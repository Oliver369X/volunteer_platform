# ============================================
# Script para resetear y migrar base de datos en producción
# ⚠️  CUIDADO: Esto eliminará TODOS los datos
# ============================================

Write-Host "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "¿Estás seguro que deseas continuar? Escribe 'SI' para confirmar"

if ($confirm -ne "SI") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Iniciando proceso de reset..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: No se encontró DATABASE_URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configura tu DATABASE_URL primero:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL="postgresql://usuario:contraseña@host:puerto/database?sslmode=require"' -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ DATABASE_URL configurado" -ForegroundColor Green
Write-Host ""

# Paso 1: Eliminar todo (reset)
Write-Host "🗑️  Eliminando estructura existente..." -ForegroundColor Yellow
npx prisma migrate reset --force --skip-seed

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al hacer reset" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intentando método alternativo..." -ForegroundColor Yellow
    Write-Host ""
    
    # Método alternativo: ejecutar migraciones directamente
    Write-Host "📦 Aplicando migraciones..." -ForegroundColor Cyan
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Error al aplicar migraciones" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Base de datos reseteada exitosamente!" -ForegroundColor Green
Write-Host ""

# Paso 2: Ejecutar seed
$seed = Read-Host "¿Deseas cargar datos iniciales (seed)? (s/n)"
if ($seed -eq "s" -or $seed -eq "S") {
    Write-Host ""
    Write-Host "🌱 Cargando datos iniciales..." -ForegroundColor Cyan
    npm run seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Datos iniciales cargados!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Advertencia: Error al cargar datos iniciales" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes probar tu aplicación en:" -ForegroundColor Cyan
Write-Host "https://dolphin-app-4ehoz.ondigitalocean.app" -ForegroundColor Cyan
Write-Host ""

