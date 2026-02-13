@echo off
echo ========================================
echo  Git Status Check and Push Script
echo ========================================
echo.

cd /d "D:\softronix-main\futurecomps"

echo Cleaning up git lock files...
del /f /q .git\.MERGE_MSG.swp 2>nul

echo.
echo Checking current git status...
git status

echo.
echo Checking if push is needed...
git fetch origin main
for /f "tokens=*" %%a in ('git rev-parse HEAD') do set LOCAL=%%a
for /f "tokens=*" %%a in ('git rev-parse origin/main') do set REMOTE=%%a

if "%LOCAL%"=="%REMOTE%" (
    echo.
    echo === SUCCESS ===
    echo All changes are already pushed to GitHub!
    echo Repository: https://github.com/sana-arshad12/softronix
) else (
    echo.
    echo Local and remote differ. Attempting to push...
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo === AUTHENTICATION REQUIRED ===
        echo Please sign in to GitHub when prompted.
    ) else (
        echo.
        echo === SUCCESS ===
        echo Successfully pushed to GitHub!
    )
)

echo.
echo Recent commits:
git log --oneline -n 3

echo.
echo ========================================
pause
