$token = $null
$headers = @{}

function Login {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/auth/email/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@admin.com","password":"admin123"}' -UseBasicParsing -TimeoutSec 10
    $script:token = ($r.Content | ConvertFrom-Json).token
    $script:headers = @{"Authorization"="Bearer $script:token"; "Content-Type"="application/json"}
}

function ApiPost($url, $body) {
    try {
        $json = $body | ConvertTo-Json -Depth 5 -Compress
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1$url" -Method POST -Headers $headers -Body $json -UseBasicParsing -TimeoutSec 10
        $data = $r.Content | ConvertFrom-Json
        return $data
    } catch {
        try {
            $s = $_.Exception.Response.StatusCode.value__
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $msg = $reader.ReadToEnd()
            Write-Output "  FAIL $url ($s): $msg"
        } catch {
            Write-Output ("  FAIL $url : $($_.Exception.Message)")
        }
        return $null
    }
}

function ApiGet($url) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/v1$url" -Headers $headers -UseBasicParsing -TimeoutSec 10
        return ($r.Content | ConvertFrom-Json)
    } catch { return $null }
}

Login
Write-Output "Logged in"

# ---- Customers ----
Write-Output "Creating customers..."
$c1 = ApiPost "/sales/customers" @{name="Customer 1 - Egypt Trade"; phone="01001111111"; email="info@egyptrade.com"; address="Cairo"}
$c2 = ApiPost "/sales/customers" @{name="Customer 2 - Al Amal Plastic"; phone="01002222222"; email="info@alamal.com"; address="Alexandria"}
$c3 = ApiPost "/sales/customers" @{name="Customer 3 - Al Noor Dist"; phone="01003333333"; email="info@alnoor.com"; address="Tanta"}

# ---- Add stock ----
Write-Output "Adding stock..."
ApiPost "/inventory/stock/movement" @{product_id=12; warehouse_id=1; quantity=10000; type="IN"; notes="Opening stock"}
ApiPost "/inventory/stock/movement" @{product_id=1; warehouse_id=1; quantity=2000; type="IN"; notes="Opening stock"}
ApiPost "/inventory/stock/movement" @{product_id=2; warehouse_id=1; quantity=500; type="IN"; notes="Opening stock"}
ApiPost "/inventory/stock/movement" @{product_id=4; warehouse_id=1; quantity=1500; type="IN"; notes="Opening stock"}
ApiPost "/inventory/stock/movement" @{product_id=13; warehouse_id=1; quantity=5000; type="IN"; notes="Opening stock"}

# ---- Sales Orders ----
Write-Output "Creating sales orders..."
$so1_items = @(@{product_id=13; quantity=300; price=50; total=15000})
$so1_body = @{customer_id=$c1.id; total_amount=15000; items=$so1_items}
ApiPost "/sales/orders" $so1_body

$so2_items = @(@{product_id=13; quantity=1000; price=50; total=50000})
$so2_body = @{customer_id=$c2.id; total_amount=50000; items=$so2_items}
ApiPost "/sales/orders" $so2_body

# ---- Quotes ----
Write-Output "Creating quotes..."
$q1_items = @(@{product_id=13; quantity=500; price=50; total=25000})
$q1_body = @{customer_id=$c3.id; total_amount=25000; status="SENT"; notes="Quote for 500 pcs"; items=$q1_items}
ApiPost "/sales/quotes" $q1_body

$q2_items = @(@{product_id=13; quantity=1500; price=50; total=75000})
$q2_body = @{customer_id=$c1.id; total_amount=75000; status="DRAFT"; notes="Quote for 1500 pcs"; items=$q2_items}
ApiPost "/sales/quotes" $q2_body

# ---- BOM ----
Write-Output "Creating BOMs..."
$bom_items = @(
    @{product_id=1; quantity=0.5}
    @{product_id=12; quantity=1}
)
$bom1_body = @{name="BOM - Demo Product"; product_id=13; description="Components for demo finished good"; items=$bom_items}
ApiPost "/manufacturing/boms" $bom1_body

# ---- Purchase Returns ----
Write-Output "Creating purchase returns..."
$pr_items = @(@{product_id=1; quantity=50; unit_price=10; total=500})
$pr_body = @{supplier_id=1; total_amount=500; reason="Defective raw materials"; items=$pr_items}
ApiPost "/purchases/returns" $pr_body

# ---- Daily Production ----
Write-Output "Creating daily production records..."
for ($i = 1; $i -le 5; $i++) {
    $day = 25 + $i
    $date = "2026-06-$($day.ToString('00'))"
    $prodBody = @{
        machine_id=$i; mold_id=$i; raw_material_id=$i
        date=$date; total_production_kg=(50 + $i * 25); pieces_produced=(200 + $i * 150)
        start_time="${date}T08:00:00Z"; end_time="${date}T16:00:00Z"; hours_worked=8
        status="COMPLETED"
    }
    ApiPost "/manufacturing/production" $prodBody
}

# ---- Supplier Payments ----
Write-Output "Creating supplier payments..."
ApiPost "/purchases/suppliers/1/payments" @{amount=2000; payment_date="2026-06-20"; payment_method="CASH"; notes="Supplier payment"}

Write-Output "`nDone! Seeded demo data successfully."