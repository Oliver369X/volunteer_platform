# Script para poblar la base de datos de producción
# Uso: .\scripts\seed-production.ps1
# IMPORTANTE: Configura DATABASE_URL en tu archivo .env.production antes de ejecutar

Write-Host "🌱 Iniciando seed de producción..." -ForegroundColor Green

# Cargar variables de entorno desde .env.production si existe
if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Variables cargadas desde .env.production" -ForegroundColor Green
}

# Verificar que DATABASE_URL esté configurada
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL no está configurada" -ForegroundColor Red
    Write-Host "   Crea un archivo .env.production con DATABASE_URL o configúrala como variable de entorno" -ForegroundColor Yellow
    Write-Host "   Ver env.production.example para el formato" -ForegroundColor Gray
    exit 1
}

Write-Host "📦 Conectando a base de datos de producción..." -ForegroundColor Yellow
# No mostrar la URL completa por seguridad
try {
    $dbParts = $env:DATABASE_URL -split '@'
    if ($dbParts.Length -gt 1) {
        $hostPart = ($dbParts[1] -split '/')[0] -split ':'
        $dbHost = $hostPart[0]
        Write-Host "   Host: $dbHost" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Conectando..." -ForegroundColor Gray
}

# Ejecutar seed
Write-Host "`n🚀 Ejecutando seed..." -ForegroundColor Cyan
node prisma/seed-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Seed completado exitosamente!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error al ejecutar seed" -ForegroundColor Red
    exit 1
}

