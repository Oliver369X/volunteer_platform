@echo off
REM Script para crear la base de datos de test en Windows
echo Creando base de datos de test...

SET PGPASSWORD=postgres
createdb -U postgres -h localhost volunteer_platform_test 2>nul

IF %ERRORLEVEL% EQU 0 (
    echo ✓ Base de datos volunteer_platform_test creada
) ELSE (
    echo ℹ Base de datos volunteer_platform_test ya existe
)

echo.
echo Aplicando schema de Prisma...
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/volunteer_platform_test
call npx prisma db push --skip-generate --accept-data-loss

echo.
echo ✓ Base de datos de test lista!
echo.
pause

