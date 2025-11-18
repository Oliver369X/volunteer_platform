# Plataforma de Asignación Inteligente de Voluntarios – API

API monolítica modular construída con Node.js, Express y PostgreSQL para la plataforma descrita en la documentación académica. Este servicio expone los módulos de autenticación, gestión de usuarios y organizaciones, administración de tareas, motor de asignación inteligente con Gemini, simulación de badges en blockchain y reportes analíticos.

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- (Opcional) Docker y Docker Compose

## Configuración

1. Copia el archivo de variables de entorno:

```bash
cp env.example .env
```

2. Ajusta las variables necesarias (`DB_*`, `JWT_*`, `GEMINI_API_KEY`, etc.).

3. Instala dependencias:

```bash
npm install
```

4. Ejecuta migraciones y seeders:

```bash
npm run db:migrate
npm run db:seed
```

## Scripts disponibles

- `npm run dev`: Levanta la API en modo desarrollo con recarga.
- `npm start`: Arranca la API en modo producción.
- `npm run lint`: Ejecuta ESLint.
- `npm test`: Corre la suite de pruebas con Jest.
- `npm run db:migrate`: Ejecuta migraciones.
- `npm run db:migrate:undo`: Revierte la última migración.
- `npm run db:seed`: Aplica seeders iniciales.

## Docker Compose

Puedes levantar la API y PostgreSQL con:

```bash
docker compose up --build
```

El servicio expone la API en `http://localhost:3000`.

## Endpoints principales

- `POST /api/auth/register/volunteer` – Registro de voluntarios.
- `POST /api/auth/register/organization` – Registro de organizaciones y creación automática del perfil institucional.
- `POST /api/auth/login` – Autenticación con emisión de tokens JWT.
- `GET /api/users/volunteers` – Listado filtrado de voluntarios (roles ADMIN/ORGANIZATION).
- `POST /api/tasks` – Creación de tareas humanitarias.
- `POST /api/matching/tasks/:id/run` – Motor de matching con IA (Gemini) y heurísticas.
- `POST /api/gamification/assignments/:id/complete` – Registro de puntos, reputación y badges NFT simulados.
- `GET /api/reports/organization` – Dashboard estratégico para organizaciones.
- `GET /api/reports/volunteer` – KPIs individuales para voluntarios.

Consulta el código fuente de cada módulo para más detalles de payloads y respuestas.

## IA y Blockchain

- **Gemini**: se integra mediante `src/services/gemini-client.js`. Si no se configura `GEMINI_API_KEY`, el sistema utiliza únicamente heurísticas locales.
- **Blockchain**: `src/services/blockchain-simulator.js` emula la emisión de badges como NFTs permitiendo sustituirlo por una implementación real posteriormente.

## Tests

Ejecuta la suite con:

```bash
npm test
```

Se utilizan Jest y Supertest; añade más pruebas unitarias/integración en `src/tests/`.

## Estructura del proyecto

```
src/
  app.js             # Configuración de Express
  server.js          # Bootstrap e inicio de servidor
  config/            # Configuración de entorno y base de datos
  database/          # Definición de modelos, asociaciones, migraciones y seeders
  modules/           # Módulos funcionales (auth, users, tasks, matching, etc.)
  services/          # Servicios compartidos (Gemini, blockchain mock, notificaciones)
  middlewares/       # Middlewares reutilizables (auth, validaciones, errores)
  utils/             # Utilidades (JWT, contraseñas, geolocalización, logger)
```

## Próximos pasos sugeridos

- Extender la suite de pruebas (unitarias y de integración).
- Añadir almacenamiento de evidencias en un servicio externo (S3, Google Cloud Storage).
- Implementar la emisión real de badges NFT usando blockchain.
- Instrumentar métricas de Business Intelligence avanzadas y dashboards adicionales.



