# Complete Git Merge and Push Script
Set-Location "D:\softronix-main\futurecomps"

# Kill any stuck git processes
Get-Process | Where-Object {$_.ProcessName -like "*git*" -or $_.ProcessName -like "*vim*" -or $_.ProcessName -like "*nano*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove editor swap files
Remove-Item ".git\.MERGE_MSG.swp" -Force -ErrorAction SilentlyContinue

# Set GIT_EDITOR to bypass interactive editor
$env:GIT_EDITOR = 'true'

# Complete the merge commit
Write-Host "Completing merge commit..." -ForegroundColor Yellow
git commit --no-edit

if ($LASTEXITCODE -eq 0) {
    Write-Host "Merge completed successfully!" -ForegroundColor Green
    
    # Now push to origin
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "Failed to push. You may need to authenticate." -ForegroundColor Red
    }
} else {
    Write-Host "Failed to complete merge commit." -ForegroundColor Red
}

# Show final status
Write-Host "`nCurrent Git Status:" -ForegroundColor Cyan
git status

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
