# Verifica backup semplice
Write-Host "=== VERIFICA BACKUP ===" -ForegroundColor Green

# Mostra backup esistenti
$backups = Get-ChildItem -Path "c:\Users\TestQ\Desktop\gestionale\Dallelec_app" -Directory | Where-Object { $_.Name -like "backup-dati-*" } | Sort-Object CreationTime -Descending

Write-Host "Backup trovati:" -ForegroundColor Yellow
foreach ($backup in $backups) {
    $age = (Get-Date) - $backup.CreationTime
    Write-Host "  $($backup.Name) - $($age.Days) giorni fa" -ForegroundColor Cyan
}

Write-Host "Totale backup: $($backups.Count)" -ForegroundColor Green