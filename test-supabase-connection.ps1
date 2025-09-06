# Test Connessione Supabase - Verifica dati reali

$SupabaseUrl = "https://aumhdoiwtichjlvbrnrl.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bWhkb2l3dGljaGpsdmJybnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjU5OTEsImV4cCI6MjA3MjE0MTk5MX0.5FXNRebRq55y3SkeoSeKdR-kN4nf1H864nSpwa7rSeA"

function Test-SupabaseTable {
    param([string]$TableName)
    
    try {
        $Headers = @{
            "apikey" = $SupabaseKey
            "Authorization" = "Bearer $SupabaseKey"
            "Content-Type" = "application/json"
        }
        
        $Url = "$SupabaseUrl/rest/v1/$TableName"
        
        Write-Host "Testing: $TableName" -ForegroundColor Yellow
        
        $Response = Invoke-RestMethod -Uri $Url -Method GET -Headers $Headers -ErrorAction Stop
        
        $Count = if ($Response -is [array]) { $Response.Count } else { if ($Response) { 1 } else { 0 } }
        
        Write-Host "  ✓ $TableName: $Count record" -ForegroundColor Green
        
        if ($Count -gt 0 -and $Response -is [array]) {
            Write-Host "  Primo record:" -ForegroundColor Cyan
            $Response[0] | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Gray
        }
        
        return $true
        
    } catch {
        Write-Host "  ✗ $TableName: ERRORE - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Clear-Host
Write-Host "🔍 TEST CONNESSIONE SUPABASE - DALLELEC" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Test alcune tabelle principali
$TestTables = @("clients", "produits", "devis", "chantiers", "admins")

foreach ($Table in $TestTables) {
    Test-SupabaseTable -TableName $Table
    Write-Host ""
}

Write-Host "Test completato!" -ForegroundColor Green
Read-Host "Premi ENTER per continuare"