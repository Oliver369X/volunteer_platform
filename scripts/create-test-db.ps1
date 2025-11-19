#!/usr/bin/env pwsh
# Script para crear la base de datos de test en Windows con PowerShell

Write-Host "🔧 Creando base de datos de test..." -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "postgres"

# Intentar crear la base de datos
$output = psql -U postgres -h localhost -c "CREATE DATABASE volunteer_platform_dev;" postgres 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos 'volunteer_platform_dev' creada" -ForegroundColor Green
} elseif ($output -match "already exists") {
    Write-Host "ℹ️  Base de datos 'volunteer_platform_dev' ya existe" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error al crear la base de datos" -ForegroundColor Red
    Write-Host $output
    exit 1
}

Write-Host ""
Write-Host "📊 Aplicando schema de Prisma..." -ForegroundColor Cyan

$env:DATABASE_URL = "postgresql://postgres:071104@localhost:5432/volunteer_platform_dev"

npx prisma db push --skip-generate --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Base de datos de test lista!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes ejecutar: npm test" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Error al aplicar schema" -ForegroundColor Red
    exit 1
}

Write-Host ""

