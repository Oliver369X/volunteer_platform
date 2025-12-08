# 🌱 Instrucciones para poblar la base de datos

## Desarrollo Local

Para poblar la base de datos local:

```bash
npm run seed
# o
npm run db:seed
```

Esto creará:
- ✅ 1 organización con credenciales: `admin@admin.com` / `123456`
- ✅ 10 voluntarios con contraseña: `123456`
- ✅ Badges, tareas, eventos y asignaciones de ejemplo

## Producción (DigitalOcean)

⚠️ **IMPORTANTE:** Las credenciales de producción NO deben estar en el código. Usa variables de entorno.

### Opción 1: Usando el script PowerShell (Recomendado)

1. Crea un archivo `.env.production` en la raíz del proyecto `server/`:

```bash
# Copia el archivo de ejemplo
cp env.production.example .env.production
```

2. Edita `.env.production` y agrega tu `DATABASE_URL` real:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

3. Ejecuta el script:

```powershell
.\scripts\seed-production.ps1
```

El script cargará automáticamente las variables desde `.env.production`.

### Opción 2: Manualmente

1. Configurar la variable de entorno:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

2. Ejecutar el seed:

```bash
npm run db:seed:prod
# o
node prisma/seed-production.js
```

## Credenciales creadas

### Organización
- **Email:** `admin@admin.com`
- **Password:** `12345678`
- **Plan:** PROFESSIONAL (activo)

### Voluntarios (10)
Todos con contraseña: `12345678`

1. juan.perez@test.com
2. ana.lopez@test.com
3. carlos.mamani@test.com
4. maria.fernandez@test.com
5. luis.quispe@test.com
6. sofia.morales@test.com
7. roberto.vargas@test.com
8. laura.gutierrez@test.com
9. diego.rojas@test.com
10. carmen.suarez@test.com

## Datos incluidos

- ✅ 3 badges (Héroe, Primera Misión, Respuesta Rápida)
- ✅ 1 organización con suscripción PROFESSIONAL
- ✅ 10 voluntarios con perfiles completos
- ✅ 2 eventos (Campaña de Ayuda, Emergencia Inundaciones)
- ✅ 5 tareas con diferentes estados
- ✅ Múltiples asignaciones
- ✅ Transacciones de puntos

## Nota importante

⚠️ **El script limpia TODOS los datos existentes antes de crear nuevos datos.**

Si necesitas mantener datos existentes, modifica el script para comentar la sección de limpieza.

