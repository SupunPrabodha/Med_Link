$ErrorActionPreference = 'Stop'

function Get-HttpStatusCode {
  param(
    [Parameter(Mandatory = $true)][scriptblock]$Request
  )
  try {
    & $Request | Out-Null
    return 200
  } catch {
    if ($_.Exception -and $_.Exception.Response) {
      try {
        return [int]$_.Exception.Response.StatusCode
      } catch {
        return -1
      }
    }
    return -1
  }
}

function Wait-ForHttp {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Request,
    [Parameter(Mandatory = $true)][int[]]$OkStatuses,
    [int]$TimeoutSeconds = 240
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $code = Get-HttpStatusCode $Request
    if ($OkStatuses -contains $code) {
      return
    }
    Start-Sleep -Seconds 2
  }

  $last = Get-HttpStatusCode $Request
  throw "Timed out waiting for $Name (last HTTP status: $last)"
}

Write-Host "[1/7] Starting infrastructure (docker compose)..."
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$doBuild = ($env:SMOKE_BUILD -eq "1")
$composeArgs = @("up", "-d")
if ($doBuild) { $composeArgs += "--build" }

docker compose @composeArgs | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "docker compose up failed; retrying once..."
  docker compose @composeArgs | Out-Null
}
if ($LASTEXITCODE -ne 0) {
  if ($doBuild) {
    Write-Host "docker compose up with --build failed; retrying without build (best-effort)..."
    docker compose up -d | Out-Null
  }
}

if ($LASTEXITCODE -ne 0) {
  throw "Docker/Compose failed to start infrastructure. If this is a Docker Desktop/BuildKit issue, try restarting Docker Desktop or running: docker builder prune"
}

Write-Host "[2/7] Waiting for gateway to respond..."
$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 8)
$pw = "Passw0rd!"

$gateway = "http://localhost:8090"

Wait-ForHttp -Name "gateway health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/actuator/health" -TimeoutSec 2
}

Write-Host "[3/7] Waiting for service discovery + routes to be ready..."

# Wait for Eureka UI to come up (service-discovery module)
Wait-ForHttp -Name "service-discovery" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761" -TimeoutSec 2
}

# Wait for each service to be healthy on its direct port
Wait-ForHttp -Name "auth-service health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8081/actuator/health" -TimeoutSec 2
}
Wait-ForHttp -Name "doctor-service health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8084/actuator/health" -TimeoutSec 2
}
Wait-ForHttp -Name "appointment-service health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8082/actuator/health" -TimeoutSec 2
}
Wait-ForHttp -Name "payment-service health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8085/actuator/health" -TimeoutSec 2
}

Wait-ForHttp -Name "patient-service health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8086/actuator/health" -TimeoutSec 2
}

# Ensure services are registered in Eureka before attempting gateway load-balancing routes
Wait-ForHttp -Name "eureka auth-service registered" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761/eureka/apps/AUTH-SERVICE" -TimeoutSec 2
}
Wait-ForHttp -Name "eureka doctor-service registered" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761/eureka/apps/DOCTOR-SERVICE" -TimeoutSec 2
}
Wait-ForHttp -Name "eureka appointment-service registered" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761/eureka/apps/APPOINTMENT-SERVICE" -TimeoutSec 2
}
Wait-ForHttp -Name "eureka payment-service registered" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761/eureka/apps/PAYMENT-SERVICE" -TimeoutSec 2
}

Wait-ForHttp -Name "eureka patient-service registered" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "http://localhost:8761/eureka/apps/PATIENT-SERVICE" -TimeoutSec 2
}

# Wait for auth route to become routable through gateway.
# We accept 400/401/403 because credentials/body may be invalid during readiness probes.
$probeLoginBody = @{ email = "probe_$suffix@demo.com"; password = "bad" } | ConvertTo-Json
Wait-ForHttp -Name "auth route" -OkStatuses @(200, 400, 401, 403) -Request {
  Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$gateway/api/auth/login" -ContentType "application/json" -Body $probeLoginBody -TimeoutSec 2
}

Wait-ForHttp -Name "doctor route" -OkStatuses @(200, 401, 403, 404) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/api/doctors/ping" -TimeoutSec 2
}

Wait-ForHttp -Name "appointment route" -OkStatuses @(200, 401, 403, 404) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/api/appointments/ping" -TimeoutSec 2
}

Wait-ForHttp -Name "payment route" -OkStatuses @(200, 401, 403, 404) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/api/payments/ping" -TimeoutSec 2
}

Wait-ForHttp -Name "patient route" -OkStatuses @(200, 401, 403, 404) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/api/patients/ping" -TimeoutSec 2
}

Write-Host "[4/7] Running workflow via gateway (admin+doctor verification -> appointment -> payment -> confirmation)..."

function Register-User($email, $role) {
  $body = @{ email = $email; password = $pw; role = $role } | ConvertTo-Json
  try {
    return Invoke-RestMethod -Method Post -Uri "$gateway/api/auth/register" -ContentType "application/json" -Body $body
  } catch {
    $loginBody = @{ email = $email; password = $pw } | ConvertTo-Json
    return Invoke-RestMethod -Method Post -Uri "$gateway/api/auth/login" -ContentType "application/json" -Body $loginBody
  }
}

$admin = Register-User "admin_$suffix@demo.com" "ADMIN"
$doctor = Register-User "doctor_$suffix@demo.com" "DOCTOR"
$patient = Register-User "patient_$suffix@demo.com" "PATIENT"

$adminHeaders = @{ Authorization = "Bearer $($admin.accessToken)" }
$doctorHeaders = @{ Authorization = "Bearer $($doctor.accessToken)" }
$patientHeaders = @{ Authorization = "Bearer $($patient.accessToken)" }

# RBAC sanity check: patient must NOT access admin-only endpoint
try {
  Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/doctors/pending" -Headers $patientHeaders | Out-Null
  throw "RBAC check failed: PATIENT was able to call /api/admin/doctors/pending"
} catch {
  # Expected: 403
}

# RBAC sanity check: patient must NOT access admin user management
try {
  Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/users" -Headers $patientHeaders | Out-Null
  throw "RBAC check failed: PATIENT was able to call /api/admin/users"
} catch {
  # Expected: 403
}

# RBAC sanity check: patient must NOT access admin appointment management
try {
  Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/appointments" -Headers $patientHeaders | Out-Null
  throw "RBAC check failed: PATIENT was able to call /api/admin/appointments"
} catch {
  # Expected: 403
}

# Doctor creates profile
$profileBody = @{ fullName = "Dr Demo $suffix"; registrationNo = "REG-$suffix"; specialization = "General"; documentsUrl = "http://example.com/doc/$suffix" } | ConvertTo-Json
$profile = Invoke-RestMethod -Method Post -Uri "$gateway/api/doctors/me/profile" -ContentType "application/json" -Headers $doctorHeaders -Body $profileBody

# Admin approves the pending profile we just created (match by registrationNo)
$pending = Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/doctors/pending" -Headers $adminHeaders
if(-not $pending -or $pending.Count -lt 1) { throw "No pending doctors found" }
$target = $pending | Where-Object { $_.registrationNo -eq "REG-$suffix" } | Select-Object -First 1
if(-not $target) { throw "Pending doctor profile for this run not found (registrationNo=REG-$suffix)" }
$doctorId = $target.id
$approved = Invoke-RestMethod -Method Post -Uri "$gateway/api/admin/doctors/$doctorId/approve" -Headers $adminHeaders
Write-Host "Approved doctor id=$doctorId status=$($approved.status)"

# Verify approved doctor is visible in public doctors list
$doctors = Invoke-RestMethod -Method Get -Uri "$gateway/api/doctors" -Headers $patientHeaders
$inList = $doctors | Where-Object { $_.id -eq $doctorId } | Select-Object -First 1
if(-not $inList) { throw "Approved doctor not found in GET /api/doctors (id=$doctorId)" }
if($inList.status -ne "VERIFIED") { throw "Expected doctor status VERIFIED in doctors list; got '$($inList.status)'" }

# Doctor sets availability (weekly blocks)
$availabilityBody = @{
  blocks = @(
    @{ dayOfWeek = "MONDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "TUESDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "WEDNESDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "THURSDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "FRIDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "SATURDAY"; startTime = "09:00"; endTime = "17:00" },
    @{ dayOfWeek = "SUNDAY"; startTime = "09:00"; endTime = "17:00" }
  )
} | ConvertTo-Json -Depth 5

$availability = Invoke-RestMethod -Method Put -Uri "$gateway/api/doctors/me/availability" -ContentType "application/json" -Headers $doctorHeaders -Body $availabilityBody
Write-Host "Set doctor availability blocks=$($availability.Count)"

# Fetch available slots and pick one
$slots = Invoke-RestMethod -Method Get -Uri "$gateway/api/appointments/available-slots?doctorId=$doctorId&days=14" -Headers $patientHeaders
$slot = $slots | Select-Object -First 1
if(-not $slot) { throw "No available slots returned for doctorId=$doctorId" }
Write-Host "Selected slot=$slot"

# Patient creates appointment
$apptBody = @{ doctorId = $doctorId; slotTime = $slot } | ConvertTo-Json
$appt = Invoke-RestMethod -Method Post -Uri "$gateway/api/appointments" -ContentType "application/json" -Headers $patientHeaders -Body $apptBody
Write-Host "Created appointment id=$($appt.id) status=$($appt.status)"

# Create PayHere payment intent
$intentBody = @{ appointmentId = $appt.id; amount = 1000.00; currency = "LKR" } | ConvertTo-Json
$intent = Invoke-RestMethod -Method Post -Uri "$gateway/api/payments/intents/payhere" -ContentType "application/json" -Headers $patientHeaders -Body $intentBody

$merchantId = $intent.formFields.merchant_id
$orderId = $intent.formFields.order_id
$amount = $intent.formFields.amount
$currency = $intent.formFields.currency

# Simulate PayHere notify callback (status_code=2 success)
$statusCode = "2"

function Md5Upper([string]$s) {
  $md5 = [System.Security.Cryptography.MD5]::Create()
  if ($null -eq $s) { $s = "" }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($s)
  $hashBytes = $md5.ComputeHash($bytes)
  -join ($hashBytes | ForEach-Object { $_.ToString('x2') }) | ForEach-Object { $_.ToUpper() }
}

$merchantSecret = $env:PAYHERE_MERCHANT_SECRET
if (-not $merchantSecret) {
  # Keep in sync with docker-compose.yml default for marker-friendly runs.
  $merchantSecret = "change-me"
}
$secretHash = Md5Upper $merchantSecret
$md5sig = Md5Upper ("$merchantId$orderId$amount$currency$statusCode$secretHash")

$notifyBody = @{ merchant_id = $merchantId; order_id = $orderId; payhere_amount = $amount; payhere_currency = $currency; status_code = $statusCode; md5sig = $md5sig; payment_id = "smoke-$suffix" }
$notifyResp = Invoke-RestMethod -Method Post -Uri "$gateway/api/payments/callback/payhere" -ContentType "application/x-www-form-urlencoded" -Body $notifyBody
Write-Host "PayHere notify response: $notifyResp"

Write-Host "[5/7] Waiting for async confirmation (RabbitMQ event -> appointment CONFIRMED)..."
$deadline = (Get-Date).AddSeconds(30)
$latest = $null
while ((Get-Date) -lt $deadline) {
  $appts = Invoke-RestMethod -Method Get -Uri "$gateway/api/appointments" -Headers $patientHeaders
  $latest = $appts | Where-Object { $_.id -eq $appt.id } | Select-Object -First 1
  if ($latest -and $latest.status -eq "CONFIRMED") {
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $latest) {
  throw "Appointment not found after creation (id=$($appt.id))"
}

Write-Host "Appointment after payment: id=$($latest.id) status=$($latest.status)"
if ($latest.status -ne "CONFIRMED") {
  throw "Expected appointment status CONFIRMED after PayHere notify; got '$($latest.status)'."
}

Write-Host "[6/7] Verifying admin management endpoints (users + appointments)..."

# Admin: users list/search
$adminUsers = Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/users?q=$suffix" -Headers $adminHeaders
$adminUsersArr = @($adminUsers)

$expected = @(
  @{ email = "admin_$suffix@demo.com"; role = "ADMIN" },
  @{ email = "doctor_$suffix@demo.com"; role = "DOCTOR" },
  @{ email = "patient_$suffix@demo.com"; role = "PATIENT" }
)

foreach ($e in $expected) {
  $u = $adminUsersArr | Where-Object { $_.email -eq $e.email } | Select-Object -First 1
  if (-not $u) {
    throw "Admin user search did not return expected user email='$($e.email)'"
  }
  if ($u.role -ne $e.role) {
    throw "Expected role '$($e.role)' for user '$($e.email)'; got '$($u.role)'"
  }
}

# Admin: appointments list + cancel
$allAdminAppts = Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/appointments" -Headers $adminHeaders
$allAdminApptsArr = @($allAdminAppts)
$adminFound = $allAdminApptsArr | Where-Object { $_.id -eq $appt.id } | Select-Object -First 1
if (-not $adminFound) {
  throw "Admin appointments list did not include created appointment id=$($appt.id)"
}

$cancelled = Invoke-RestMethod -Method Delete -Uri "$gateway/api/admin/appointments/$($appt.id)" -Headers $adminHeaders
Write-Host "Admin cancelled appointment id=$($cancelled.id) status=$($cancelled.status)"
if ($cancelled.status -ne "CANCELLED") {
  throw "Expected admin-cancelled appointment to be CANCELLED; got '$($cancelled.status)'"
}

$apptsAfterCancel = Invoke-RestMethod -Method Get -Uri "$gateway/api/appointments" -Headers $patientHeaders
$after = @($apptsAfterCancel) | Where-Object { $_.id -eq $appt.id } | Select-Object -First 1
if (-not $after) {
  throw "Patient appointments did not contain appointment id=$($appt.id) after admin cancel"
}
if ($after.status -ne "CANCELLED") {
  throw "Expected patient to see CANCELLED after admin cancel; got '$($after.status)'"
}

Write-Host "[7/7] Done. (doctor.verified, payment.completed, appointment.confirmed/cancelled, admin.users/appointments verified)."

