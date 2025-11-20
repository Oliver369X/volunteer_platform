#!/usr/bin/env pwsh
# Script para poblar la base de datos con datos completos de prueba

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🌱 SEED COMPLETO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Split-Path -Parent $scriptDir
Set-Location $serverDir

Write-Host "📁 Directorio de trabajo: $serverDir" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe el archivo .env
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encontró el archivo .env" -ForegroundColor Yellow
    Write-Host "   Asegúrate de tener configurada la variable DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
}

# Preguntar confirmación
Write-Host "⚠️  ATENCIÓN: Este script borrará TODOS los datos existentes" -ForegroundColor Red
Write-Host "   y creará datos de prueba completos." -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "¿Deseas continuar? (s/N)"

if ($confirmation -ne "s" -and $confirmation -ne "S") {
    Write-Host ""
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Iniciando seed..." -ForegroundColor Green
Write-Host ""

# Ejecutar el seed
try {
    node prisma/seed-complete.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "  ✅ SEED COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Próximos pasos:" -ForegroundColor Cyan
        Write-Host "   1. Inicia el servidor: npm run dev" -ForegroundColor White
        Write-Host "   2. Inicia el frontend: cd ../client && npm run dev" -ForegroundColor White
        Write-Host "   3. Accede con cualquiera de las credenciales mostradas arriba" -ForegroundColor White
        Write-Host ""
    } else {
        throw "El seed falló con código de salida $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "  ❌ ERROR EN SEED" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "   • Verifica que PostgreSQL esté corriendo" -ForegroundColor White
    Write-Host "   • Verifica la variable DATABASE_URL en .env" -ForegroundColor White
    Write-Host "   • Ejecuta: npm run db:migrate" -ForegroundColor White
    Write-Host ""
    exit 1
}


