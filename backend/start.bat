@echo off
chcp 65001 >nul
echo ========================================
echo 正在启动后端服务器...
echo ========================================
cd /d %~dp0
node server.js
pause
