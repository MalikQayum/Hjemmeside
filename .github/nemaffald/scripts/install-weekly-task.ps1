$ErrorActionPreference = 'Stop'

$TaskName = 'NemAffald - Weekly Haveaffald Order'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReadinessFile = Join-Path $ProjectRoot 'artifacts\weekly-route-ready.json'
$WeeklyScript = Join-Path $ProjectRoot 'src\weekly-order.js'

if (-not (Test-Path $ReadinessFile)) {
    throw 'Run npm.cmd run weekly:test successfully before installing the recurring task.'
}
$Readiness = Get-Content $ReadinessFile -Raw | ConvertFrom-Json
if ($Readiness.status -ne 'automated_route_and_datepicker_verified') {
    throw 'The automatic front-page route and date picker have not passed weekly:test. The recurring task was not installed.'
}

$Node = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path $WeeklyScript)) { throw "Could not find $WeeklyScript" }

$Action = New-ScheduledTaskAction -Execute $Node -Argument "`"$WeeklyScript`" --scheduled" -WorkingDirectory $ProjectRoot
$AtEight = (Get-Date).Date.AddHours(8)
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At $AtEight
$TimeZone = Get-TimeZone
if ($TimeZone.Id -notin @('Romance Standard Time', 'W. Europe Standard Time')) {
    throw "Windows time zone is '$($TimeZone.Id)'. Set Windows to Copenhagen/Amsterdam/Berlin time before installing so 08:00 matches Europe/Copenhagen."
}
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$User = "$env:USERDOMAIN\$env:USERNAME"
$Principal = New-ScheduledTaskPrincipal -UserId $User -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description 'Every Friday at 08:00, navigate from the NemAffald front page and submit one Haveaffald order for Vigerslevvej 148 with the requested date on the following Friday. Duplicate dates, existing basket items, unexpected prices, authentication and uncertain outcomes stop safely.' -Force | Out-Null

Write-Host ''
Write-Host "Scheduled task installed: $TaskName" -ForegroundColor Green
Write-Host 'Schedule: Every Friday at 08:00 Europe/Copenhagen.'
Write-Host 'Requested collection date: the following Friday.'
Write-Host 'The task runs only while this Windows user is logged on; the PC must be powered on.'
Write-Host 'Task Scheduler uses your existing local NemAffald browser profile.'
Write-Host 'To remove it, run: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\remove-weekly-task.ps1'
