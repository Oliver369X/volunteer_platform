@echo off
REM Script para crear la base de datos de test en Windows
echo Creando base de datos de test...

SET PGPASSWORD=postgres
createdb -U postgres -h localhost volunteer_platform_dev 2>nul

IF %ERRORLEVEL% EQU 0 (
    echo ✓ Base de datos volunteer_platform_dev creada
) ELSE (
    echo ℹ Base de datos volunteer_platform_dev ya existe
)

echo.
echo Aplicando schema de Prisma...
set DATABASE_URL=postgresql://postgres:071104@localhost:5432/volunteer_platform_dev
call npx prisma db push --skip-generate --accept-data-loss

echo.
echo ✓ Base de datos de test lista!
echo.
pause

