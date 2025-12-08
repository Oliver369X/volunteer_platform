# ============================================
# Script para ejecutar migraciones en producción
# Volunteer Intelligence Platform
# ============================================

Write-Host "🚀 Ejecutando migraciones de Prisma en producción..." -ForegroundColor Green
Write-Host ""

# Verificar que existe el DATABASE_URL de producción
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: No se encontró DATABASE_URL en las variables de entorno" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configura tu DATABASE_URL de producción primero:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL="postgresql://usuario:contraseña@host:puerto/database"' -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ DATABASE_URL configurado" -ForegroundColor Green
Write-Host ""

# Ejecutar migraciones
Write-Host "📦 Ejecutando migraciones..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migraciones ejecutadas exitosamente!" -ForegroundColor Green
    Write-Host ""
    
    # Preguntar si desea ejecutar seed
    $seed = Read-Host "¿Deseas ejecutar el seed de datos iniciales? (s/n)"
    if ($seed -eq "s" -or $seed -eq "S") {
        Write-Host ""
        Write-Host "🌱 Ejecutando seed..." -ForegroundColor Cyan
        npm run seed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Seed ejecutado exitosamente!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error al ejecutar seed" -ForegroundColor Red
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ Error al ejecutar migraciones" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
Write-Host ""

