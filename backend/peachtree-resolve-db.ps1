param(
    [Parameter(Mandatory=$true)]
    [string]$DataPath
)

$ErrorActionPreference = "Stop"

$connString = "Driver={Pervasive ODBC Client Interface};ServerName=localhost;UID=Crystal;PWD=;"

# Try common Peachtree database names
$candidates = @("mos", "Mostafaapp", "PeachData", "Peachtree", "Company1", "SAJ50", "peerless")

foreach ($name in $candidates) {
    try {
        $testConn = "Driver={Pervasive ODBC Client Interface};ServerName=localhost;DBQ=$name;UID=Crystal;PWD=;"
        $conn = New-Object -ComObject "ADODB.Connection"
        $conn.ConnectionTimeout = 2
        $conn.Open($testConn)
        $rs = $conn.Execute("SELECT TOP 1 * FROM Chart")
        $rs.Close()
        $conn.Close()
        Write-Output $name
        exit 0
    } catch {
        continue
    }
}

exit 1
