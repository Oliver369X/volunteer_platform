# ============================================
# Script alternativo para sincronizar base de datos
# Usa "prisma db push" en lugar de migraciones
# Más seguro para producción con datos existentes
# ============================================

Write-Host "🚀 Sincronizando esquema de base de datos con Prisma..." -ForegroundColor Green
Write-Host ""

# Verificar DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: No se encontró DATABASE_URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configura tu DATABASE_URL primero:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL="postgresql://usuario:contraseña@host:puerto/database?sslmode=require"' -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ DATABASE_URL configurado" -ForegroundColor Green
Write-Host ""

# Generar cliente de Prisma
Write-Host "📦 Generando cliente de Prisma..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al generar cliente de Prisma" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Cliente generado" -ForegroundColor Green
Write-Host ""

# Sincronizar esquema con db push (sin migraciones)
Write-Host "🔄 Sincronizando esquema de base de datos..." -ForegroundColor Cyan
Write-Host "Esto creará las tablas faltantes sin usar el sistema de migraciones" -ForegroundColor Yellow
Write-Host ""

npx prisma db push --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Esquema sincronizado exitosamente!" -ForegroundColor Green
    Write-Host ""
    
    # Preguntar por seed
    $seed = Read-Host "¿Deseas cargar datos iniciales? (s/n)"
    if ($seed -eq "s" -or $seed -eq "S") {
        Write-Host ""
        Write-Host "🌱 Cargando datos iniciales..." -ForegroundColor Cyan
        npm run seed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Datos iniciales cargados!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠️  Advertencia: Error al cargar datos" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Base de datos lista!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes usar tu aplicación en:" -ForegroundColor Cyan
    Write-Host "https://dolphin-app-4ehoz.ondigitalocean.app" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Error al sincronizar esquema" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "1. El DATABASE_URL sea correcto" -ForegroundColor Yellow
    Write-Host "2. Tengas permisos en la base de datos" -ForegroundColor Yellow
    Write-Host "3. La base de datos esté accesible" -ForegroundColor Yellow
    exit 1
}

