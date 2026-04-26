param(
  [string]$Url = "http://127.0.0.1:4173"
)

Write-Host "Varakozas a frontend szerverre..."

for ($attempt = 1; $attempt -le 60; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 1
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
      Write-Host "Frontend fut. Bongeszo megnyitasa..."
      Start-Process $Url
      exit 0
    }
  } catch {
    Write-Host "Meg nem elerheto a frontend, ujraprobalas $attempt/60..."
    Start-Sleep -Seconds 1
  }
}

Write-Host "A frontend meg nem valaszolt automatikusan."
Write-Host "Nyisd meg kezzel, ha a frontend ablakban mar kesz:"
Write-Host $Url
exit 1
