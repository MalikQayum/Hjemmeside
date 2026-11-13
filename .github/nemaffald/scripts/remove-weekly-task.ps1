$ErrorActionPreference = 'Stop'
$TaskName = 'NemAffald - Weekly Haveaffald Order'
$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Task) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed scheduled task: $TaskName" -ForegroundColor Green
} else {
    Write-Host "Scheduled task not found: $TaskName"
}
