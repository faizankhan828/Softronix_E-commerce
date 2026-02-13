# Push to mabdullahniazi/softronix Repository
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Push AI Chat to mabdullahniazi/softronix" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "D:\softronix-main\futurecomps"

Write-Host "[1/6] Cleaning up Git files..." -ForegroundColor Yellow
Remove-Item ".git\.MERGE_MSG.swp" -Force -ErrorAction SilentlyContinue
Remove-Item ".git\MERGE_HEAD" -Force -ErrorAction SilentlyContinue
Remove-Item ".git\MERGE_MODE" -Force -ErrorAction SilentlyContinue
Remove-Item ".git\AUTO_MERGE" -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleaned up" -ForegroundColor Green

Write-Host ""
Write-Host "[2/6] Updating remote repository..." -ForegroundColor Yellow
git remote set-url origin https://github.com/mabdullahniazi/softronix.git
git remote -v
Write-Host "✓ Remote updated to mabdullahniazi/softronix" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Current status:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "[4/6] Fetching from GitHub..." -ForegroundColor Yellow
git fetch origin main

Write-Host ""
Write-Host "[5/6] Pulling latest changes..." -ForegroundColor Yellow
$env:GIT_EDITOR = 'true'
git pull origin main --no-edit 2>&1 | Out-String

Write-Host ""
Write-Host "[6/6] Pushing your changes to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host " ✓ SUCCESS!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Your AI Chat is now live at:" -ForegroundColor Green
    Write-Host "https://github.com/mabdullahniazi/softronix" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host " ⚠ AUTHENTICATION REQUIRED" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "You need access to push to mabdullahniazi/softronix" -ForegroundColor Yellow
    Write-Host "Please sign in when prompted." -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Recent commits:" -ForegroundColor Cyan
git log --oneline -n 5

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
