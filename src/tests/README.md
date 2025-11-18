# Tests del Backend

Esta carpeta contiene todos los tests del backend de la plataforma.

## Estructura

```
tests/
├── helpers/
│   ├── prisma.js      # Helper para Prisma en tests
│   ├── auth.js        # Helpers para autenticación en tests
│   └── factories.js   # Factories para crear datos de prueba
├── modules/
│   ├── auth.test.js           # Tests de autenticación
│   ├── users.test.js          # Tests de usuarios
│   ├── organizations.test.js  # Tests de organizaciones
│   ├── tasks.test.js          # Tests de tareas
│   ├── matching.test.js       # Tests de matching
│   ├── gamification.test.js   # Tests de gamificación
│   └── reports.test.js        # Tests de reportes
├── mocks/
│   └── uuid.js        # Mock de UUID
├── app.test.js        # Test básico de la app
└── setup.js           # Configuración global de tests
```

## Configuración

### Base de Datos de Test

Los tests requieren una base de datos de test separada. Asegúrate de tener:

1. PostgreSQL corriendo
2. Una base de datos llamada `volunteer_platform_test`
3. Variables de entorno configuradas en `.env`:

```env
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/volunteer_platform_test
```

### Preparar Base de Datos de Test

```bash
# Crear la base de datos de test
createdb volunteer_platform_test

# O usando psql
psql -U postgres -c "CREATE DATABASE volunteer_platform_test;"

# Aplicar el schema
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/volunteer_platform_test npx prisma db push
```

## Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- --testPathPatterns=auth.test.js

# Con watch mode
npm run test:watch

# Con cobertura
npm test -- --coverage
```

## Tests Implementados

### Auth Module (`auth.test.js`)
- ✅ Registro de voluntarios
- ✅ Registro de organizaciones
- ✅ Login
- ✅ Obtener usuario actual (me)
- ✅ Validaciones de campos requeridos
- ✅ Manejo de errores

### Users Module (`users.test.js`)
- ✅ Actualizar perfil de usuario
- ✅ Actualizar perfil de voluntario
- ✅ Listar voluntarios (solo admin/organización)
- ✅ Filtros por nivel
- ✅ Validaciones de permisos

### Organizations Module (`organizations.test.js`)
- ✅ Listar organizaciones
- ✅ Obtener detalles de organización
- ✅ Agregar miembros
- ✅ Validaciones de membresía
- ✅ Permisos de roles

### Tasks Module (`tasks.test.js`)
- ✅ Crear tareas
- ✅ Obtener tarea
- ✅ Listar tareas con filtros
- ✅ Actualizar tareas
- ✅ Validaciones de permisos

### Matching Module (`matching.test.js`)
- ✅ Ejecutar matching
- ✅ Auto-asignación de voluntarios
- ✅ Recomendaciones ordenadas
- ✅ Validaciones de permisos

### Gamification Module (`gamification.test.js`)
- ✅ Completar asignaciones
- ✅ Otorgar puntos y badges
- ✅ Leaderboard
- ✅ Gamificación de voluntario
- ✅ Validaciones de permisos

### Reports Module (`reports.test.js`)
- ✅ Dashboard de organización
- ✅ KPIs de voluntario
- ✅ Filtros por fecha
- ✅ Validaciones de permisos

## Helpers Disponibles

### `getPrisma()`
Obtiene la instancia de Prisma para tests.

### `cleanup()`
Limpia todos los datos de la base de datos de test.

### `createUserData(overrides)`
Crea datos de usuario para tests.

### `createTestToken(user)`
Crea un token JWT para un usuario.

### `getAuthHeader(token)`
Retorna el header de autorización con el token.

## Notas

- Los tests limpian la base de datos antes de cada suite
- Cada test es independiente
- Los tests usan una base de datos separada para no afectar datos de desarrollo
- Los timeouts están configurados a 30 segundos para operaciones de BD

