# 🌱 Guía de Seed de Base de Datos

Este documento explica cómo poblar la base de datos con datos de prueba completos para probar todas las funcionalidades del sistema.

## 📋 Requisitos Previos

1. PostgreSQL instalado y corriendo
2. Base de datos creada
3. Variables de entorno configuradas en `.env`
4. Migraciones aplicadas: `npm run db:migrate`

## 🚀 Uso Rápido

### Opción 1: Usando npm (Recomendado)

```bash
cd server
npm run db:seed:complete
```

### Opción 2: Usando PowerShell (Windows)

```powershell
cd server
.\scripts\seed-complete.ps1
```

### Opción 3: Usando CMD (Windows)

```cmd
cd server
scripts\seed-complete.bat
```

### Opción 4: Directamente con Node

```bash
cd server
node prisma/seed-complete.js
```

## 📊 Datos Creados

El seed crea los siguientes datos:

### 🏅 Badges del Sistema (8)
- **Primera Misión** (Bronce) - Completar primera misión
- **Respuesta Rápida** (Plata) - Completar misión en tiempo récord
- **Héroe Humanitario** (Oro) - 10 misiones críticas completadas
- **Experto Médico** (Oro) - Excelencia en misiones de salud
- **Líder de Equipo** (Platino) - Coordinación exitosa de equipos
- **Compromiso Centenario** (Platino) - Más de 100 horas de servicio
- **Favorito de la Comunidad** (Oro) - Excelentes calificaciones
- **Especialista en Emergencias** (Especial) - Reconocimiento especial

### 👤 Usuarios (1 Admin + 3 Org + 6 Voluntarios)

**Administrador:**
- Email: `admin@volunteerplatform.org`
- Password: `Admin123!`

**Organizaciones:**
1. **Cruz Roja Boliviana**
   - Email: `maria@cruzroja.org`
   - Password: `Password123!`

2. **Defensa Civil Bolivia**
   - Email: `jorge@defcivil.gob.bo`
   - Password: `Password123!`

3. **Cáritas Bolivia**
   - Email: `sandra@caritas.org.bo`
   - Password: `Password123!`

**Voluntarios:**
1. **Juan Pérez** (Nivel: ORO)
   - Email: `juan.perez@example.com`
   - Skills: Primeros auxilios, rescate, comunicación
   - 3,500 puntos | 92 reputación | 120 horas

2. **Ana María López** (Nivel: PLATINO)
   - Email: `ana.lopez@example.com`
   - Skills: Atención médica, psicología
   - 5,200 puntos | 98 reputación | 180 horas

3. **Carlos Mamani** (Nivel: PLATA)
   - Email: `carlos.mamani@example.com`
   - Skills: Construcción, logística
   - 2,100 puntos | 85 reputación | 75 horas

4. **Laura Fernández** (Nivel: PLATA)
   - Email: `laura.fernandez@example.com`
   - Skills: Comunicación, coordinación
   - 1,800 puntos | 88 reputación | 60 horas

5. **Roberto Silva** (Nivel: BRONCE)
   - Email: `roberto.silva@example.com`
   - Skills: Primeros auxilios
   - 350 puntos | 72 reputación | 15 horas

6. **Patricia Morales** (Nivel: PLATA)
   - Email: `patricia.morales@example.com`
   - Skills: Logística, cocina
   - 1,500 puntos | 80 reputación | 50 horas

Password para todos: `Password123!`

### 📋 Tareas (7 en diferentes estados)

1. **Distribución de alimentos** (ASSIGNED) - Villa Tunari
2. **Brigada médica** (IN_PROGRESS) - Trinidad
3. **Construcción de refugios** (PENDING) - La Paz
4. **Apoyo psicosocial** (PENDING) - Cochabamba
5. **Evaluación de daños** (PENDING) - El Alto
6. **Limpieza de escuela** (COMPLETED) - Santa Cruz
7. **Campaña de vacunación** (VERIFIED) - Tarija

### 🤝 Asignaciones (6 en diferentes estados)
- 1 verificada (con puntos y feedback)
- 2 en progreso
- 2 aceptadas
- 1 pendiente

## 🎯 Flujo de Prueba Recomendado

### 1️⃣ Como Organización (maria@cruzroja.org)

```
1. Iniciar sesión
2. Ver dashboard con métricas de organización
3. Crear nueva tarea de emergencia
4. Ver lista de tareas activas
5. Usar matching de IA para encontrar voluntarios
6. Asignar voluntarios a tareas
7. Verificar tareas completadas
8. Generar reportes de impacto
```

### 2️⃣ Como Voluntario (juan.perez@example.com)

```
1. Iniciar sesión
2. Ver dashboard con perfil y gamificación
3. Ver tareas disponibles
4. Aceptar/rechazar asignaciones
5. Marcar tarea como completada
6. Ver puntos ganados y badges obtenidos
7. Ver historial de misiones
```

### 3️⃣ Como Admin (admin@volunteerplatform.org)

```
1. Iniciar sesión
2. Ver estadísticas globales del sistema
3. Gestionar usuarios y organizaciones
4. Ver reportes de actividad
```

## 📈 Cobertura de Historias de Usuario

Este seed cubre las siguientes HU:

### ✅ Gestión de Usuarios y Autenticación
- [x] HU-001: Registro de voluntarios
- [x] HU-002: Registro de organizaciones
- [x] HU-003: Login y autenticación
- [x] HU-004: Gestión de perfiles

### ✅ Gestión de Tareas
- [x] HU-005: Creación de tareas por organizaciones
- [x] HU-006: Visualización de tareas disponibles
- [x] HU-007: Filtrado y búsqueda de tareas
- [x] HU-008: Estados de tareas

### ✅ Matching Inteligente
- [x] HU-009: Recomendación de voluntarios con IA
- [x] HU-010: Matching basado en habilidades
- [x] HU-011: Matching basado en ubicación
- [x] HU-012: Matching basado en disponibilidad

### ✅ Asignaciones y Seguimiento
- [x] HU-013: Asignación de voluntarios a tareas
- [x] HU-014: Aceptar/rechazar asignaciones
- [x] HU-015: Seguimiento de progreso
- [x] HU-016: Verificación de tareas completadas
- [x] HU-017: Calificación y feedback

### ✅ Gamificación
- [x] HU-018: Sistema de puntos
- [x] HU-019: Niveles de voluntarios
- [x] HU-020: Badges y logros
- [x] HU-021: Leaderboard
- [x] HU-022: Blockchain de badges (simulado)

### ✅ Reportes y Analíticas
- [x] HU-023: Dashboard de voluntarios
- [x] HU-024: Dashboard de organizaciones
- [x] HU-025: Reportes de impacto
- [x] HU-026: Estadísticas de participación

## 🔧 Troubleshooting

### Error: "Database not found"
```bash
# Crear la base de datos manualmente o ejecutar:
npm run db:migrate
```

### Error: "Connection refused"
```bash
# Verificar que PostgreSQL esté corriendo:
# Windows:
Get-Service postgresql*

# Iniciar si está detenido:
Start-Service postgresql-x64-14  # Ajustar versión
```

### Error: "Migration not applied"
```bash
# Aplicar migraciones:
npm run db:migrate

# Si hay problemas, reset completo:
npm run db:migrate:reset
```

### Limpiar y volver a seed
```bash
# Opción 1: Reset completo (borra todo y re-migra)
npm run db:migrate:reset
npm run db:seed:complete

# Opción 2: Solo re-seed (más rápido, pero requiere que las tablas existan)
npm run db:seed:complete
```

## 📝 Notas Importantes

1. **⚠️ ADVERTENCIA**: Este seed **borrará todos los datos existentes** en la base de datos
2. Los passwords de prueba son simples para facilitar las pruebas. No usar en producción.
3. Las coordenadas geográficas son reales de ciudades bolivianas
4. Los datos de blockchain están simulados (no se conecta a una red real)
5. Las fechas de las tareas pueden necesitar ajustarse según la fecha actual

## 🎨 Personalización

Para modificar los datos de seed, edita el archivo:
```
server/prisma/seed-complete.js
```

Los datos están organizados en constantes al inicio del archivo:
- `VOLUNTEER_DATA` - Datos de voluntarios
- `ORGANIZATION_DATA` - Datos de organizaciones
- `TASK_DATA` - Datos de tareas
- `BADGE_DATA` - Datos de badges

## 🤝 Contribuir

Si encuentras problemas o tienes sugerencias para mejorar el seed, por favor:
1. Documenta el problema
2. Propón una solución
3. Actualiza este README si es necesario

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0




