@echo off
REM Script para ejecutar el seed completo en Windows CMD
echo ================================================
echo   SEED COMPLETO DE BASE DE DATOS
echo ================================================
echo.

cd /d "%~dp0\.."

echo Directorio de trabajo: %CD%
echo.

echo ATENCION: Este script borrara TODOS los datos existentes
echo y creara datos de prueba completos.
echo.

set /p confirmation="Deseas continuar? (s/N): "
if /i not "%confirmation%"=="s" (
    echo.
    echo Operacion cancelada
    exit /b 0
)

echo.
echo Iniciando seed...
echo.

node prisma/seed-complete.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SEED COMPLETADO EXITOSAMENTE
    echo ================================================
    echo.
    echo Proximos pasos:
    echo   1. Inicia el servidor: npm run dev
    echo   2. Inicia el frontend: cd ..\client ^&^& npm run dev
    echo   3. Accede con cualquiera de las credenciales
    echo.
) else (
    echo.
    echo ================================================
    echo   ERROR EN SEED
    echo ================================================
    echo.
    echo Posibles soluciones:
    echo   - Verifica que PostgreSQL este corriendo
    echo   - Verifica la variable DATABASE_URL en .env
    echo   - Ejecuta: npm run db:migrate
    echo.
    exit /b 1
)


