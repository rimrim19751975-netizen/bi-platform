@echo off
echo === Starting BI Platform Services ===

:: Kill existing processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ngrok.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1
timeout /t 3 /nobreak >nul

:: Start Backend
echo [1/3] Starting Backend...
start "BI-Backend" cmd /c "cd /d C:\ClassePro\backend && npx tsx src/index.ts"
timeout /t 5 /nobreak >nul

:: Check Backend
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -ErrorAction Stop; Write-Host 'Backend: OK' } catch { Write-Host 'Backend: FAILED'; exit 1 }"

:: Start Frontend
echo [2/3] Starting Frontend...
start "BI-Frontend" cmd /c "cd /d C:\ClassePro\frontend && npx next dev --hostname 0.0.0.0 -p 3001"
timeout /t 10 /nobreak >nul

:: Check Frontend
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/' -UseBasicParsing -ErrorAction Stop; Write-Host 'Frontend: OK (Status:' $r.StatusCode ')' } catch { Write-Host 'Frontend: FAILED'; exit 1 }"

:: Start Tunnel (localtunnel)
echo [3/3] Starting Tunnel...
start "BI-Tunnel" cmd /c "cd /d C:\ClassePro && npx localtunnel --port 3001"
timeout /t 8 /nobreak >nul

echo.
echo === Services Started ===
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:3001
echo.
echo Tunnel URL will appear in the "BI-Tunnel" window
echo.
echo Press any key to view tunnel URL...
pause
