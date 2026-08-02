# peachtree-query.ps1
# Queries Peachtree via 32-bit Pervasive ODBC from 32-bit PowerShell
# Called by Node.js backend as child process

param(
    [Parameter(Mandatory=$true)]
    [string]$Table,
    [string]$ServerName = "localhost",
    [string]$Database = "mos",
    [int]$Limit = 0,
    [string]$Fields = "",
    [string]$Where = ""
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $connString = "Driver={Pervasive ODBC Client Interface};ServerName=$ServerName;DBQ=$Database;UID=Crystal;PWD=;"
    $conn = New-Object -ComObject "ADODB.Connection"
    $conn.ConnectionTimeout = 10
    $conn.Open($connString)

    $selectFields = if ($Fields) { $Fields } else { "*" }
    $query = "SELECT $selectFields FROM $Table"
    if ($Where) { $query += " WHERE $Where" }
    $rs = New-Object -ComObject "ADODB.Recordset"
    $rs.CursorType = 3
    $rs.Open($query, $conn)

    $results = [System.Collections.ArrayList]::new()
    $count = 0
    while (!$rs.EOF) {
        $row = @{}
        for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
            $field = $rs.Fields.Item($i)
            $val = $field.Value
            $row[$field.Name] = $val
        }
        [void]$results.Add($row)
        $count++
        if ($Limit -gt 0 -and $count -ge $Limit) { break }
        $rs.MoveNext()
    }

    $rs.Close()
    $conn.Close()

    $json = ConvertTo-Json -InputObject $results -Depth 10 -Compress
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output $json
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
