# Check Status and Push to GitHub
Set-Location "D:\softronix-main\futurecomps"

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Checking Remote Status ===" -ForegroundColor Cyan
git fetch origin main
$local = git rev-parse main
$remote = git rev-parse origin/main

if ($local -eq $remote) {
    Write-Host "`n✅ Already up to date! Your changes are on GitHub." -ForegroundColor Green
} else {
    Write-Host "`n⚠ Local and remote are different. Attempting to push..." -ForegroundColor Yellow
    
    # Kill any stuck processes
    Get-Process | Where-Object {$_.ProcessName -like "*vim*" -or $_.ProcessName -like "*nano*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Remove swap files
    Remove-Item ".git\.MERGE_MSG.swp" -Force -ErrorAction SilentlyContinue
    
    # Complete any pending merge
    $env:GIT_EDITOR = 'true'
    git commit --no-edit 2>$null
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Failed to push. You may need to authenticate." -ForegroundColor Red
        Write-Host "Error: GitHub credentials may be required." -ForegroundColor Red
    }
}

Write-Host "`n=== Final Status ===" -ForegroundColor Cyan
git log --oneline -n 5
git status

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
