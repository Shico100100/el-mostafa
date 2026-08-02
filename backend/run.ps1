@echo off
set NODE_ENV=production
set NODE_NO_WARNINGS=1
set FRONTEND_DOMAIN=http://localhost:3000
cd /d C:\ELMostafa\backend
node dist/main.js > out.log 2> err.log

