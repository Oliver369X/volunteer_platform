# Script para poblar la base de datos de producción
# Uso: .\scripts\seed-production.ps1

Write-Host "🌱 Iniciando seed de producción..." -ForegroundColor Green

# Configurar variables de entorno para producción
$env:DATABASE_URL = "postgresql://dev-db-263476:AVNS_lLuJLivU8ISUL9_Pg9C@app-a5f9e579-1b85-4e67-827a-507b902e828d-do-user-28219899-0.k.db.ondigitalocean.com:25060/dev-db-263476?sslmode=require"

Write-Host "📦 Conectando a base de datos de producción..." -ForegroundColor Yellow
Write-Host "   Host: app-a5f9e579-1b85-4e67-827a-507b902e828d-do-user-28219899-0.k.db.ondigitalocean.com" -ForegroundColor Gray
Write-Host "   Database: dev-db-263476" -ForegroundColor Gray

# Ejecutar seed
Write-Host "`n🚀 Ejecutando seed..." -ForegroundColor Cyan
node prisma/seed-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Seed completado exitosamente!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error al ejecutar seed" -ForegroundColor Red
    exit 1
}

