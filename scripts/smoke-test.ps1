$ErrorActionPreference = 'Stop'

Write-Host "[1/6] Starting infrastructure (docker compose)..."
Set-Location "F:\Projects\DS Project"
docker compose up -d | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Docker/Compose failed. Start Docker Desktop (or install Docker Engine), then re-run this script."
}

Write-Host "[2/6] Building (mvn test)..."
mvn -q test | Out-Null

Write-Host "[3/6] Stopping any old Java processes from previous runs (best-effort)..."
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process mvn -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[4/6] Starting services..."
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl service-discovery spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl auth-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl doctor-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl appointment-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl payment-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl notification-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl api-gateway spring-boot:run" | Out-Null

Write-Host "Waiting for gateway to respond..."
$gateway = "http://localhost:8090"
$deadline = (Get-Date).AddSeconds(120)
$ok = $false
while((Get-Date) -lt $deadline) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing "$gateway/actuator/health" -TimeoutSec 2
    if($resp.StatusCode -eq 200) { $ok = $true; break }
  } catch { }
  Start-Sleep -Seconds 2
}
if(-not $ok) {
  throw "Gateway health check failed. Check services logs."
}

Write-Host "[5/6] Running workflow via gateway (admin+doctor verification -> appointment -> payment -> confirmation)..."

$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 8)
$pw = "Passw0rd!"

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

