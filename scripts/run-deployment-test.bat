@echo off
REM Calendar System Deployment Test Runner for Windows
REM This script runs the deployment test for the calendar system

echo === CALENDAR SYSTEM DEPLOYMENT TEST ===
echo Starting deployment test at %date% %time%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js to run this test.
    exit /b 1
)

REM Check if the deployment test script exists
if not exist "scripts\deployment-test.js" (
    echo Error: Deployment test script not found at scripts\deployment-test.js
    exit /b 1
)

REM Set environment variables for the test
REM Uncomment and modify these if needed for your environment
REM set SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres

REM Run the deployment test
echo Running deployment test...
node scripts\deployment-test.js

REM Check the exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Deployment test completed successfully!
    echo The calendar system is ready for deployment to production.
    exit /b 0
) else (
    echo.
    echo Deployment test failed. Please review the errors above.
    exit /b 1
)