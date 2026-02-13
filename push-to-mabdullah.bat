@echo off
echo ================================================
echo  Push to mabdullahniazi/softronix Repository
echo ================================================
echo.

cd /d "D:\softronix-main\futurecomps"

echo [1/6] Cleaning up Git lock files...
del /f /q .git\.MERGE_MSG.swp 2>nul
del /f /q .git\MERGE_HEAD 2>nul
del /f /q .git\MERGE_MODE 2>nul
del /f /q .git\AUTO_MERGE 2>nul
echo Done!

echo.
echo [2/6] Updating remote to mabdullahniazi/softronix...
git remote set-url origin https://github.com/mabdullahniazi/softronix.git
git remote -v

echo.
echo [3/6] Checking current status...
git status

echo.
echo [4/6] Pulling latest changes from mabdullahniazi/softronix...
git fetch origin main
git pull origin main --no-edit

echo.
echo [5/6] Pushing your AI Chat changes to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ============================================
    echo  AUTHENTICATION REQUIRED
    echo ============================================
    echo Please sign in with GitHub credentials for:
    echo   mabdullahniazi
    echo.
    echo If you don't have access, you may need the
    echo repository owner to add you as a collaborator.
    echo ============================================
) else (
    echo.
    echo ================================================
    echo  SUCCESS! 
    echo ================================================
    echo Your AI Chat integration is now on GitHub at:
    echo https://github.com/mabdullahniazi/softronix
    echo ================================================
)

echo.
echo [6/6] Recent commits:
git log --oneline -n 3

echo.
pause
