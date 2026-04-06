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

Write-Host "[1/6] Starting infrastructure (docker compose)..."
Set-Location "F:\Projects\DS Project"
docker compose up -d | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "docker compose up failed; retrying once..."
  docker compose up -d | Out-Null
}
if ($LASTEXITCODE -ne 0) {
  throw "Docker/Compose failed to start infrastructure. If this is a Docker Hub connectivity issue, try again on a stable network or pre-pull required images."
}

Write-Host "[2/6] Building (mvn test)..."
mvn -q test | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Build failed (mvn test). See Maven output above." 
}

Write-Host "[3/6] Stopping any old Java processes from previous runs (best-effort)..."
$portsToFree = @(8761, 8090, 8081, 8082, 8083, 8084, 8085)
foreach ($port in $portsToFree) {
  try {
    $pids = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch { }
    }
  } catch { }
}

$javaProcs = Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue
foreach ($p in ($javaProcs | Where-Object {
  $_.CommandLine -and (
    $_.CommandLine -match 'lk\\.medilink\\.' -or
    $_.CommandLine -match 'spring-boot:run'
  )
})) {
  try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
}

Write-Host "[4/6] Starting services..."
$repoRoot = "F:\Projects\DS Project"
$logDir = Join-Path $repoRoot "scripts\smoke-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Get-ChildItem -Path $logDir -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

function Start-MediLinkModule {
  param(
    [Parameter(Mandatory = $true)][string]$Module
  )
  $out = Join-Path $logDir "$Module.out.log"
  $err = Join-Path $logDir "$Module.err.log"

  $cmd = "cd '$repoRoot'; mvn -q -pl $Module spring-boot:run"
  $proc = Start-Process -FilePath "powershell" -WindowStyle Minimized -PassThru -ArgumentList @(
    "-NoProfile",
    "-Command",
    $cmd
  ) -RedirectStandardOutput $out -RedirectStandardError $err

  Start-Sleep -Seconds 2
  if ($proc.HasExited) {
    throw "Module '$Module' exited immediately. See logs: $out and $err"
  }
}

Start-MediLinkModule "service-discovery"
Start-MediLinkModule "auth-service"
Start-MediLinkModule "doctor-service"
Start-MediLinkModule "appointment-service"
Start-MediLinkModule "payment-service"
Start-MediLinkModule "notification-service"
Start-MediLinkModule "api-gateway"

Write-Host "Waiting for gateway to respond..."
$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 8)
$pw = "Passw0rd!"

$gateway = "http://localhost:8090"

Wait-ForHttp -Name "gateway health" -OkStatuses @(200) -Request {
  Invoke-WebRequest -UseBasicParsing "$gateway/actuator/health" -TimeoutSec 2
}

Write-Host "Waiting for service discovery + routes to be ready..."

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

Write-Host "[5/6] Running workflow via gateway (admin+doctor verification -> appointment -> payment -> confirmation)..."

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

# Doctor creates profile
$profileBody = @{ fullName = "Dr Demo $suffix"; registrationNo = "REG-$suffix"; specialization = "General"; documentsUrl = "http://example.com/doc/$suffix" } | ConvertTo-Json
$profile = Invoke-RestMethod -Method Post -Uri "$gateway/api/doctors/me/profile" -ContentType "application/json" -Headers $doctorHeaders -Body $profileBody

# Admin approves first pending profile (should include the one we just created)
$pending = Invoke-RestMethod -Method Get -Uri "$gateway/api/admin/doctors/pending" -Headers $adminHeaders
if(-not $pending -or $pending.Count -lt 1) { throw "No pending doctors found" }
$doctorId = $pending[0].id
$approved = Invoke-RestMethod -Method Post -Uri "$gateway/api/admin/doctors/$doctorId/approve" -Headers $adminHeaders
Write-Host "Approved doctor id=$doctorId status=$($approved.status)"

# Patient creates appointment
$apptBody = @{ doctorId = $doctorId; slotTime = "2030-01-01T10:00:00Z" } | ConvertTo-Json
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

$merchantSecret = "change-me"
$secretHash = Md5Upper $merchantSecret
$md5sig = Md5Upper ("$merchantId$orderId$amount$currency$statusCode$secretHash")

$notifyBody = @{ merchant_id = $merchantId; order_id = $orderId; payhere_amount = $amount; payhere_currency = $currency; status_code = $statusCode; md5sig = $md5sig; payment_id = "smoke-$suffix" }
$notifyResp = Invoke-RestMethod -Method Post -Uri "$gateway/api/payments/callback/payhere" -ContentType "application/x-www-form-urlencoded" -Body $notifyBody
Write-Host "PayHere notify response: $notifyResp"

Start-Sleep -Seconds 2

$appts = Invoke-RestMethod -Method Get -Uri "$gateway/api/appointments" -Headers $patientHeaders
$latest = $appts | Where-Object { $_.id -eq $appt.id } | Select-Object -First 1
Write-Host "Appointment after payment: id=$($latest.id) status=$($latest.status)"

Write-Host "[6/6] Done. Check notification-service window/logs for consumed events (doctor.verified, payment.completed, appointment.confirmed)."

