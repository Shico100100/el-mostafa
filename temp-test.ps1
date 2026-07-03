$token = "eyJhbGciOiJIUzI1NiIs"
$r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/auth/email/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@admin.com","password":"admin123"}' -UseBasicParsing -TimeoutSec 10
$token = ($r.Content | ConvertFrom-Json).token
$headers = @{"Authorization"="Bearer " + $token; "Content-Type"="application/json"}

$body = '{"supplier_id":1,"total_amount":500,"reason":"Test return","items":[{"product_id":1,"quantity":50,"unit_price":10,"total":500}]}'

try {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/purchases/returns" -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 10
    Write-Output ("OK: " + $r.Content)
} catch {
    $s = $_.Exception.Response.StatusCode.value__
    Write-Output ("Status: " + $s)
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Output ("Body: " + $errorBody)
}
