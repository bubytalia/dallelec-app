# Verifica backup programmato domenica 2:00
Write-Host "=== VERIFICA BACKUP PROGRAMMATO ===" -ForegroundColor Green

# Controlla se esiste attività pianificata
$taskName = "Backup Dati Supabase Dallelec"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($task) {
    Write-Host "✅ Attività pianificata trovata: $taskName" -ForegroundColor Green
    Write-Host "Stato: $($task.State)" -ForegroundColor Cyan
    Write-Host "Prossima esecuzione: $($task.NextRunTime)" -ForegroundColor Yellow
    
    # Mostra trigger
    $triggers = $task.Triggers
    foreach ($trigger in $triggers) {
        Write-Host "Trigger: $($trigger.DaysOfWeek) alle $($trigger.StartBoundary)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Attività pianificata NON trovata" -ForegroundColor Red
    Write-Host "Creazione attività pianificata..." -ForegroundColor Yellow
    
    # Crea attività pianificata
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"c:\Users\TestQ\Desktop\gestionale\Dallelec_app\backup-dati-manuale.ps1`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "02:00"
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Backup automatico dati Supabase ogni domenica alle 2:00"
        Write-Host "✅ Attività pianificata creata!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Errore creazione attività: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Mostra backup esistenti
Write-Host "`n=== BACKUP ESISTENTI ===" -ForegroundColor Green
$backups = Get-ChildItem -Path "c:\Users\TestQ\Desktop\gestionale\Dallelec_app" -Directory | Where-Object { $_.Name -like "backup-dati-*" } | Sort-Object CreationTime -Descending

if ($backups) {
    foreach ($backup in $backups) {
        $age = (Get-Date) - $backup.CreationTime
        Write-Host "📁 $($backup.Name) - $($age.Days) giorni fa" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Nessun backup trovato" -ForegroundColor Red
}

Write-Host "`n✅ Verifica completata!" -ForegroundColor Green