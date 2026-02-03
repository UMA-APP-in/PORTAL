@echo off
cd /d "%~dp0"
echo ==========================================
echo Starting Portal Automation System
echo ==========================================

echo Starting Dashboard (Port 3002)...
start "Dashboard (3002)" cmd /k "cd dashboard && set PORT=3002 && npm start"

echo Starting Rectification Portal (Port 3001)...
start "Rectification (3001)" cmd /k "cd rectification && set PORT=3001 && npm start"

echo Starting Carnet Universitario (Port 5000)...
start "Carnet (5000)" cmd /k "cd Carne_Univarsario\Carne_Univarsario && set PORT=5000 && npm start"

echo.
echo All servers are launching in separate windows.
echo External Windows will appear for each service.
echo.
echo Dashboard: http://localhost:3002
echo Rectification: http://localhost:3001
echo Carnet: http://localhost:5000
echo.
pause
