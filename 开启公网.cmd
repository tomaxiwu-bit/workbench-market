@echo off
cd /d "%~dp0"
title Workbench Market - Public Tunnel
echo.
echo   Local site : http://localhost:8686
echo   Keep THIS window open. Do not close it.
echo   Copy the https://xxxx.trycloudflare.com address below and share it.
echo.
tools\cloudflared.exe tunnel --url http://localhost:8686 --no-autoupdate
pause