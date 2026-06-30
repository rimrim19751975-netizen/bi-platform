Write-Output "=== Starting BI Platform ==="

# Kill existing processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Output "Starting backend..."
$bp = Start-Process -FilePath "npx.cmd" -ArgumentList "tsx src/index.ts" -WorkingDirectory "C:\ClassePro\backend" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 5

# Check backend
try {
    $b = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Output "Backend: OK"
} catch {
    Write-Output "Backend: FAILED"
    exit 1
}

# Start frontend
Write-Output "Starting frontend..."
$fp = Start-Process -FilePath "npx.cmd" -ArgumentList "next dev --hostname 0.0.0.0 -p 3001" -WorkingDirectory "C:\ClassePro\frontend" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 10

# Check frontend
try {
    $f = Invoke-WebRequest -Uri "http://localhost:3001/" -UseBasicParsing -ErrorAction Stop
    Write-Output "Frontend: OK (Status $($f.StatusCode))"
} catch {
    Write-Output "Frontend: FAILED"
    exit 1
}

# Start localtunnel
Write-Output "Starting tunnel..."
$lt = Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port 3001" -WorkingDirectory "C:\ClassePro" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 5

Write-Output "=== All services running ==="
Write-Output "Local URLs:"
Write-Output "  Frontend: http://localhost:3001"
Write-Output "  Backend:  http://localhost:5000/api"
Write-Output "  Health:   http://localhost:5000/api/health"
Write-Output ""
Write-Output "=== TUNNEL URL ==="
Write-Output "https://big-walls-bake.loca.lt"
Write-Output ""
Write-Output "NOTE: localtunnel shows a warning page on first visit."
Write-Output "Click the button to proceed."
Write-Output ""

# Keep running
while ($true) {
    Start-Sleep -Seconds 30
    # Check services
    try { 
        $null = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -ErrorAction Stop
        $null = Invoke-WebRequest -Uri "http://localhost:3001/" -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Output "WARNING: Service check failed"
    }
}
