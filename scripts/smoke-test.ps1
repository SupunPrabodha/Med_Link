$ErrorActionPreference = 'Stop'

Write-Host "[1/6] Starting infrastructure (docker compose)..."
Set-Location "F:\Projects\DS Project"
docker compose up -d | Out-Null

Write-Host "[2/6] Building (mvn test)..."
mvn -q test | Out-Null

Write-Host "[3/6] Stopping any old Java processes from previous runs (best-effort)..."
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process mvn -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[4/6] Starting services..."
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl service-discovery spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl auth-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl appointment-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl notification-service spring-boot:run" | Out-Null
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoProfile -Command cd 'F:\Projects\DS Project'; mvn -q -pl api-gateway spring-boot:run" | Out-Null

Write-Host "Waiting for gateway to respond..."
$gateway = "http://localhost:8090"
$deadline = (Get-Date).AddSeconds(60)
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

Write-Host "[5/6] Register user and create appointment via gateway..."
$registerBody = @{ email = "patient1@demo.com"; password = "Passw0rd!"; role = "PATIENT" } | ConvertTo-Json
$register = Invoke-RestMethod -Method Post -Uri "$gateway/api/auth/register" -ContentType "application/json" -Body $registerBody
$token = $register.accessToken
if(-not $token) { throw "No token returned from register" }

$headers = @{ Authorization = "Bearer $token" }
$apptBody = @{ doctorId = 10; slotTime = "2030-01-01T10:00:00Z" } | ConvertTo-Json
$appt = Invoke-RestMethod -Method Post -Uri "$gateway/api/appointments" -ContentType "application/json" -Headers $headers -Body $apptBody

Write-Host "Created appointment id=$($appt.id) status=$($appt.status)"

Write-Host "[6/6] Done. Check notification-service window/logs for the consumed RabbitMQ event."

