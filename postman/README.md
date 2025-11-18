# Colección de Postman para Volunteer Platform API

Esta carpeta contiene la colección de Postman para probar todos los endpoints de la API.

## Importar la Colección

1. Abre Postman
2. Click en "Import" (botón superior izquierdo)
3. Arrastra el archivo `Volunteer-Platform-API.postman_collection.json` o selecciónalo
4. La colección se importará con todas las carpetas y variables

## Variables de Colección

La colección incluye las siguientes variables que se configuran automáticamente:

- `baseUrl`: URL base de la API (default: http://localhost:3000)
- `accessToken`: Token de acceso JWT (se configura automáticamente al hacer login)
- `refreshToken`: Token de refresh (se configura automáticamente)
- `volunteerId`: ID del voluntario actual
- `organizationId`: ID de la organización actual
- `taskId`: ID de la tarea actual
- `assignmentId`: ID de la asignación actual

## Flujo de Prueba Recomendado

### 1. Verificar API
```
GET /health
```

### 2. Autenticación

#### Como Voluntario:
1. `POST /api/auth/register/volunteer` - Registra un nuevo voluntario
2. `GET /api/auth/me` - Verifica tu perfil
3. `PATCH /api/users/me` - Actualiza tu perfil básico
4. `PATCH /api/users/me/volunteer-profile` - Actualiza tu perfil de voluntario

#### Como Organización:
1. `POST /api/auth/register/organization` - Registra una nueva organización
2. `GET /api/auth/me` - Verifica tu perfil
3. `GET /api/organizations/{{organizationId}}` - Obtiene detalles de tu organización

### 3. Gestión de Tareas (como Organización)

1. `POST /api/tasks` - Crea una nueva tarea
2. `GET /api/tasks` - Lista todas las tareas
3. `GET /api/tasks/{{taskId}}` - Obtiene detalles de una tarea
4. `PATCH /api/tasks/{{taskId}}` - Actualiza una tarea
5. `PATCH /api/tasks/{{taskId}}/status` - Cambia el estado de una tarea

### 4. Matching de Voluntarios (como Organización)

1. `POST /api/matching/tasks/{{taskId}}/run` (autoAssign: false)
   - Obtiene recomendaciones de voluntarios usando IA
   
2. `POST /api/matching/tasks/{{taskId}}/run` (autoAssign: true)
   - Auto-asigna los mejores voluntarios

### 5. Gamificación (como Organización)

1. `POST /api/gamification/assignments/{{assignmentId}}/complete`
   - Completa una asignación
   - Otorga puntos
   - Minta badges NFT en IPFS (Pinata)

2. `GET /api/gamification/leaderboard`
   - Ve el ranking de voluntarios

### 6. Reportes

#### Como Organización:
```
GET /api/reports/organization?organizationId={{organizationId}}
```

#### Como Voluntario:
```
GET /api/reports/volunteer
```

## Scripts Automáticos

La colección incluye scripts de prueba que:

1. **Guardan tokens automáticamente**: Al hacer login o registro, los tokens se guardan en las variables de colección
2. **Guardan IDs**: Los IDs de recursos creados se guardan automáticamente
3. **Configuran autorización**: El token de acceso se usa automáticamente en todas las peticiones

## Probar con Diferentes Roles

### Cambiar entre Voluntario y Organización:

1. Usa `POST /api/auth/login` con las credenciales apropiadas
2. El token se actualizará automáticamente
3. Todas las peticiones subsiguientes usarán ese token

## Ejemplo de Datos

### Voluntario:
```json
{
  "email": "juan.perez@example.com",
  "password": "Password123!"
}
```

### Organización:
```json
{
  "email": "maria.gonzalez@ong.org",
  "password": "Password123!"
}
```

## Endpoints con IA

### Matching con Gemini:
- El endpoint `/api/matching/tasks/:id/run` usa Gemini AI para mejorar las recomendaciones
- Si `GEMINI_API_KEY` está configurado, verás recomendaciones mejoradas con justificaciones

### NFTs con Pinata:
- Al completar asignaciones con badges, se mintan NFTs en IPFS
- Los metadatos se suben a Pinata
- Verás URLs de IPFS en la respuesta

## Troubleshooting

### Token Expirado:
Usa el endpoint `POST /api/auth/refresh` con el `refreshToken`

### Variable No Configurada:
Verifica que las variables de colección tengan valores válidos en:
- Postman > Variables de Colección

### Autorización Fallida:
1. Verifica que estés usando el rol correcto para el endpoint
2. Vuelve a hacer login para obtener un token fresco
3. Verifica que el token esté en la variable `accessToken`

## Testing Automatizado

Para ejecutar toda la colección:

1. Click en la colección
2. Click en "Run" (botón superior derecho)
3. Selecciona los endpoints que quieres probar
4. Click en "Run Volunteer-Platform-API"

Los scripts de prueba validarán automáticamente las respuestas.

