# Script simple para configurar BD de test
Write-Host "Configurando base de datos de test..." -ForegroundColor Cyan

$env:PGPASSWORD = "postgres"
$env:DATABASE_URL = "postgresql://postgres:071104@localhost:5432/volunteer_platform_dev"

# Crear BD
Write-Host "Creando base de datos..." -ForegroundColor Yellow
psql -U postgres -h localhost -c "CREATE DATABASE volunteer_platform_dev;" postgres 2>$null

# Aplicar schema
Write-Host "Aplicando schema..." -ForegroundColor Yellow
cd "D:\oliver\UAGRM\semestre 9\taller\proyecto\server"
npx prisma db push --skip-generate --accept-data-loss

Write-Host "Listo!" -ForegroundColor Green

