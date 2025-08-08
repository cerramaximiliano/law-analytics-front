# Guía de Integración con Google Calendar - Law Analytics

## 📋 Índice

1. [Justificación de Permisos](#justificación-de-permisos)
2. [Video de Demostración](#video-de-demostración)
3. [Configuración en Google Cloud Console](#configuración-en-google-cloud-console)
4. [Implementación Técnica](#implementación-técnica)

---

## 📝 Justificación de Permisos

### Pregunta de Google: "¿Cómo usará su aplicación el permiso de Google Calendar?"

### Respuesta Recomendada:

```
Law Analytics es un sistema de gestión legal que permite a los abogados sincronizar automáticamente eventos legales importantes con su Google Calendar para mejorar la gestión de plazos y compromisos judiciales.

USO ESPECÍFICO DEL PERMISO calendar.events:

1. CREAR EVENTOS cuando el usuario registra:
   - Audiencias judiciales con fecha, hora y juzgado
   - Vencimientos de plazos procesales
   - Reuniones con clientes
   - Fechas límite para presentar escritos judiciales
   - Citaciones y notificaciones judiciales

2. ACTUALIZAR EVENTOS cuando:
   - Se modifica la fecha/hora de una audiencia
   - Se reprograma una reunión
   - Se extiende un plazo procesal

3. ELIMINAR EVENTOS cuando:
   - Se cancela una audiencia
   - Se archiva un expediente
   - El usuario lo solicita específicamente

CARACTERÍSTICAS DE SEGURIDAD:
- Solo sincronizamos eventos creados por Law Analytics
- NO leemos eventos personales del usuario
- El usuario controla qué tipos de eventos sincronizar
- Cada evento incluye la nota "Creado por Law Analytics"
- El usuario puede desconectar la sincronización en cualquier momento

BENEFICIO PARA EL USUARIO:
- Recibe notificaciones automáticas de Google para audiencias
- Evita perder plazos procesales importantes
- Mantiene sincronizados sus compromisos legales
- Puede compartir calendarios con su equipo legal
- Accede a sus eventos desde cualquier dispositivo

CUMPLIMIENTO:
- Solo usamos el scope calendar.events (no calendar completo)
- Cumplimos con las políticas de privacidad de Google
- No almacenamos tokens de forma insegura
- Permitimos revocación inmediata del acceso
```

### Respuesta Corta Alternativa:

```
Law Analytics sincroniza audiencias judiciales, vencimientos de plazos procesales y reuniones legales con Google Calendar. Los abogados necesitan recordatorios automáticos para no perder fechas críticas que pueden afectar casos judiciales. Solo creamos/actualizamos eventos específicos de la aplicación cuando el usuario lo solicita. No accedemos a eventos personales.
```

---

## 🎥 Video de Demostración

### Estructura del Video (3-4 minutos)

#### Guión Detallado con Timestamps:

**[00:00-00:15] Introducción**

- Logo de Law Analytics
- Texto: "Integración con Google Calendar para Gestión Legal"
- Narración: "Law Analytics sincroniza automáticamente eventos legales importantes con Google Calendar para que los abogados nunca pierdan una audiencia o vencimiento"

**[00:15-00:35] Contexto - Mostrar el Problema**

- Mostrar calendario de audiencias en Law Analytics
- Resaltar una audiencia importante
- Narración: "Los abogados gestionan múltiples audiencias, plazos y reuniones. Un olvido puede tener consecuencias graves para sus clientes"

**[00:35-01:00] Activar Sincronización**

- Usuario va a Configuración → Integraciones
- Click en "Conectar Google Calendar"
- Mostrar pantalla de permisos de Google (mockup)
- Narración: "Con un click, el usuario conecta su Google Calendar. Solo solicitamos permisos para gestionar eventos, no para acceder a información personal"

**[01:00-01:30] Crear Audiencia - Sincronización Automática**

```
Mostrar formulario:
- Tipo: Audiencia
- Caso: García vs. Empresa S.A.
- Fecha: 15/03/2024
- Hora: 10:00
- Juzgado: Civil N° 5
- ✓ Sincronizar con Google Calendar
```

- Click en "Guardar"
- Mostrar notificación: "✓ Audiencia creada y sincronizada"
- Narración: "Al crear una audiencia, se sincroniza automáticamente con Google Calendar"

**[01:30-02:00] Ver en Google Calendar**

- Abrir Google Calendar en otra pestaña
- Mostrar el evento creado con:
  - Título: "Audiencia: García vs. Empresa S.A."
  - Ubicación: "Juzgado Civil N° 5"
  - Recordatorios: 1 día antes, 2 horas antes
- Narración: "El evento aparece en Google Calendar con todos los detalles y recordatorios automáticos"

**[02:00-02:30] Actualizar Evento**

- Volver a Law Analytics
- Cambiar fecha de audiencia (reprogramada)
- Guardar cambios
- Mostrar Google Calendar actualizado
- Narración: "Los cambios se sincronizan instantáneamente. El abogado siempre tiene la información actualizada"

**[02:30-03:00] Tipos de Eventos y Configuración**
Mostrar panel de configuración:

```
Sincronizar:
✓ Audiencias judiciales
✓ Vencimientos de plazos
✓ Reuniones con clientes
□ Tareas internas

Recordatorios predeterminados:
- Audiencias: 1 día y 2 horas antes
- Vencimientos: 3 días y 1 día antes
```

- Narración: "El usuario controla qué sincronizar y cuándo recibir recordatorios"

**[03:00-03:30] Seguridad y Control**

- Mostrar botón "Desconectar Google Calendar"
- Mostrar mensaje: "Solo sincronizamos eventos de Law Analytics"
- Destacar: "No accedemos a tus eventos personales"
- Narración: "El usuario mantiene control total. Puede desconectar en cualquier momento y sus eventos personales siempre permanecen privados"

**[03:30-03:45] Conclusión**

- Mostrar beneficios en pantalla:
  - ✓ Nunca perder una audiencia
  - ✓ Recordatorios automáticos
  - ✓ Acceso desde cualquier dispositivo
  - ✓ Sincronización instantánea
- Narración: "Law Analytics con Google Calendar: La tranquilidad de no perder ningún compromiso legal importante"

### Código HTML para Demo del Video:

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>Law Analytics - Demo Google Calendar</title>
		<style>
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}

			body {
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
				background: #f5f5f5;
			}

			.app-container {
				display: flex;
				height: 100vh;
			}

			/* Sidebar */
			.sidebar {
				width: 250px;
				background: #1a237e;
				color: white;
				padding: 20px;
			}

			.logo {
				font-size: 24px;
				font-weight: bold;
				margin-bottom: 30px;
			}

			.nav-item {
				padding: 12px 16px;
				margin: 5px 0;
				border-radius: 8px;
				cursor: pointer;
				transition: background 0.3s;
			}

			.nav-item:hover {
				background: rgba(255, 255, 255, 0.1);
			}

			.nav-item.active {
				background: rgba(255, 255, 255, 0.2);
			}

			/* Main Content */
			.main-content {
				flex: 1;
				padding: 30px;
				overflow-y: auto;
			}

			.page-header {
				background: white;
				padding: 20px;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				margin-bottom: 30px;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.page-title {
				font-size: 28px;
				color: #333;
			}

			/* Calendar Integration Section */
			.integration-card {
				background: white;
				padding: 30px;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				margin-bottom: 20px;
			}

			.google-calendar-box {
				border: 2px solid #4285f4;
				border-radius: 8px;
				padding: 30px;
				text-align: center;
				margin: 20px 0;
			}

			.google-logo {
				width: 200px;
				margin-bottom: 20px;
			}

			.btn {
				padding: 12px 24px;
				border: none;
				border-radius: 6px;
				font-size: 16px;
				cursor: pointer;
				transition: all 0.3s;
				display: inline-flex;
				align-items: center;
				gap: 10px;
			}

			.btn-primary {
				background: #4285f4;
				color: white;
			}

			.btn-primary:hover {
				background: #3367d6;
				transform: translateY(-1px);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
			}

			.btn-danger {
				background: #dc3545;
				color: white;
			}

			/* Event Form */
			.event-form {
				background: #f8f9fa;
				padding: 25px;
				border-radius: 8px;
				margin: 20px 0;
			}

			.form-group {
				margin-bottom: 20px;
			}

			.form-label {
				display: block;
				margin-bottom: 8px;
				font-weight: 600;
				color: #333;
			}

			.form-control {
				width: 100%;
				padding: 10px 15px;
				border: 1px solid #ddd;
				border-radius: 6px;
				font-size: 16px;
			}

			.form-control:focus {
				outline: none;
				border-color: #4285f4;
				box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
			}

			/* Calendar Preview */
			.calendar-preview {
				background: white;
				border: 1px solid #ddd;
				border-radius: 8px;
				padding: 20px;
				margin: 20px 0;
			}

			.calendar-event {
				background: #e3f2fd;
				border-left: 4px solid #1976d2;
				padding: 15px;
				margin: 10px 0;
				border-radius: 4px;
			}

			.event-time {
				font-weight: bold;
				color: #1976d2;
			}

			.event-title {
				font-size: 18px;
				margin: 5px 0;
			}

			.event-location {
				color: #666;
				display: flex;
				align-items: center;
				gap: 5px;
			}

			/* Settings */
			.settings-group {
				background: #f8f9fa;
				padding: 20px;
				border-radius: 8px;
				margin: 20px 0;
			}

			.checkbox-group {
				margin: 15px 0;
			}

			.checkbox-label {
				display: flex;
				align-items: center;
				margin: 10px 0;
				cursor: pointer;
			}

			.checkbox-label input {
				margin-right: 10px;
				width: 18px;
				height: 18px;
				cursor: pointer;
			}

			/* Status Messages */
			.alert {
				padding: 15px 20px;
				border-radius: 6px;
				margin: 20px 0;
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.alert-success {
				background: #d4edda;
				color: #155724;
				border: 1px solid #c3e6cb;
			}

			.alert-info {
				background: #d1ecf1;
				color: #0c5460;
				border: 1px solid #bee5eb;
			}

			/* Modal */
			.modal {
				display: none;
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				justify-content: center;
				align-items: center;
				z-index: 1000;
			}

			.modal-content {
				background: white;
				padding: 30px;
				border-radius: 12px;
				max-width: 500px;
				width: 90%;
				text-align: center;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
			}

			.permission-list {
				text-align: left;
				margin: 20px 0;
				padding: 20px;
				background: #f8f9fa;
				border-radius: 8px;
			}

			.permission-item {
				margin: 10px 0;
				display: flex;
				align-items: center;
				gap: 10px;
			}

			/* Animations */
			@keyframes slideIn {
				from {
					transform: translateX(100%);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}

			.slide-in {
				animation: slideIn 0.5s ease-out;
			}

			/* Connected Status */
			.connected-status {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 10px 20px;
				background: #d4edda;
				border-radius: 6px;
				margin: 20px 0;
			}

			.status-dot {
				width: 10px;
				height: 10px;
				background: #28a745;
				border-radius: 50%;
			}
		</style>
	</head>
	<body>
		<!-- Sidebar -->
		<div class="app-container">
			<div class="sidebar">
				<div class="logo">⚖️ Law Analytics</div>
				<div class="nav-item">📊 Dashboard</div>
				<div class="nav-item">📁 Expedientes</div>
				<div class="nav-item active">📅 Audiencias</div>
				<div class="nav-item">👥 Clientes</div>
				<div class="nav-item">📄 Documentos</div>
				<div class="nav-item">⚙️ Configuración</div>
			</div>

			<!-- Main Content -->
			<div class="main-content">
				<div class="page-header">
					<h1 class="page-title">Gestión de Audiencias</h1>
					<button class="btn btn-primary" onclick="showNewEventForm()"><span>➕</span> Nueva Audiencia</button>
				</div>

				<!-- Google Calendar Integration -->
				<div class="integration-card">
					<h2>Sincronización con Google Calendar</h2>

					<div id="disconnectedView" class="google-calendar-box">
						<img
							src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
							alt="Google Calendar"
							style="width: 80px; margin-bottom: 20px;"
						/>
						<h3>Conecta tu Google Calendar</h3>
						<p style="margin: 20px 0; color: #666;">
							Sincroniza automáticamente audiencias, vencimientos y reuniones con tu calendario de Google
						</p>
						<button class="btn btn-primary" onclick="connectGoogleCalendar()"><span>🔗</span> Conectar Google Calendar</button>
					</div>

					<div id="connectedView" style="display: none;">
						<div class="connected-status">
							<div class="status-dot"></div>
							<strong>Conectado:</strong> usuario@gmail.com
						</div>

						<div class="settings-group">
							<h3>Eventos a Sincronizar</h3>
							<div class="checkbox-group">
								<label class="checkbox-label"> <input type="checkbox" checked /> Audiencias judiciales </label>
								<label class="checkbox-label"> <input type="checkbox" checked /> Vencimientos de plazos </label>
								<label class="checkbox-label"> <input type="checkbox" checked /> Reuniones con clientes </label>
								<label class="checkbox-label"> <input type="checkbox" /> Tareas internas </label>
							</div>
						</div>

						<button class="btn btn-danger" onclick="disconnectGoogleCalendar()"><span>❌</span> Desconectar</button>
					</div>
				</div>

				<!-- Event Form -->
				<div id="eventForm" class="event-form" style="display: none;">
					<h3>Nueva Audiencia</h3>
					<div class="form-group">
						<label class="form-label">Tipo de Evento</label>
						<select class="form-control">
							<option>Audiencia</option>
							<option>Vencimiento</option>
							<option>Reunión</option>
						</select>
					</div>

					<div class="form-group">
						<label class="form-label">Caso</label>
						<input type="text" class="form-control" value="García vs. Empresa S.A." />
					</div>

					<div class="form-group">
						<label class="form-label">Fecha</label>
						<input type="date" class="form-control" value="2024-03-15" />
					</div>

					<div class="form-group">
						<label class="form-label">Hora</label>
						<input type="time" class="form-control" value="10:00" />
					</div>

					<div class="form-group">
						<label class="form-label">Lugar/Juzgado</label>
						<input type="text" class="form-control" value="Juzgado Civil N° 5" />
					</div>

					<div class="checkbox-group">
						<label class="checkbox-label">
							<input type="checkbox" checked id="syncCheckbox" />
							<strong>Sincronizar con Google Calendar</strong>
						</label>
					</div>

					<div style="margin-top: 20px;">
						<button class="btn btn-primary" onclick="saveEvent()"><span>💾</span> Guardar Audiencia</button>
						<button class="btn" onclick="hideEventForm()" style="margin-left: 10px;">Cancelar</button>
					</div>
				</div>

				<!-- Success Message -->
				<div id="successMessage" class="alert alert-success slide-in" style="display: none;">
					<span>✅</span> Audiencia creada y sincronizada con Google Calendar
				</div>

				<!-- Calendar Preview -->
				<div class="calendar-preview">
					<h3>📅 Próximas Audiencias</h3>

					<div id="eventsList">
						<div class="calendar-event">
							<div class="event-time">10 de Marzo - 14:00 hs</div>
							<div class="event-title">Audiencia: Pérez vs. Aseguradora XYZ</div>
							<div class="event-location"><span>📍</span> Juzgado Laboral N° 3</div>
						</div>

						<div class="calendar-event" id="newEvent" style="display: none;">
							<div class="event-time">15 de Marzo - 10:00 hs</div>
							<div class="event-title">Audiencia: García vs. Empresa S.A.</div>
							<div class="event-location"><span>📍</span> Juzgado Civil N° 5</div>
							<small style="color: #4285f4;">✓ Sincronizado con Google Calendar</small>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Google OAuth Modal -->
		<div id="authModal" class="modal">
			<div class="modal-content">
				<img
					src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
					alt="Google"
					style="margin-bottom: 20px;"
				/>
				<h3>Law Analytics solicita acceso a:</h3>

				<div class="permission-list">
					<div class="permission-item"><span>✓</span> Ver y administrar eventos en tu Google Calendar</div>
					<div class="permission-item"><span>✓</span> Ver tu dirección de correo electrónico</div>
					<div class="permission-item"><span>ℹ️</span> NO accederemos a tus eventos personales existentes</div>
				</div>

				<p style="font-size: 14px; color: #666; margin: 20px 0;">Solo sincronizaremos eventos creados por Law Analytics</p>

				<button class="btn btn-primary" onclick="authorizeGoogle()">Autorizar</button>
				<button class="btn" onclick="closeAuthModal()" style="margin-left: 10px;">Cancelar</button>
			</div>
		</div>

		<script>
			let isConnected = false;

			function connectGoogleCalendar() {
				document.getElementById("authModal").style.display = "flex";
			}

			function authorizeGoogle() {
				closeAuthModal();
				// Simular autorización exitosa
				setTimeout(() => {
					isConnected = true;
					document.getElementById("disconnectedView").style.display = "none";
					document.getElementById("connectedView").style.display = "block";
					showNotification("✅ Google Calendar conectado exitosamente");
				}, 1500);
			}

			function closeAuthModal() {
				document.getElementById("authModal").style.display = "none";
			}

			function disconnectGoogleCalendar() {
				if (confirm("¿Estás seguro de que deseas desconectar Google Calendar?")) {
					isConnected = false;
					document.getElementById("connectedView").style.display = "none";
					document.getElementById("disconnectedView").style.display = "block";
					showNotification("Google Calendar desconectado");
				}
			}

			function showNewEventForm() {
				document.getElementById("eventForm").style.display = "block";
				document.getElementById("eventForm").scrollIntoView({ behavior: "smooth" });
			}

			function hideEventForm() {
				document.getElementById("eventForm").style.display = "none";
			}

			function saveEvent() {
				const syncEnabled = document.getElementById("syncCheckbox").checked;

				// Simular guardado
				hideEventForm();

				// Mostrar nuevo evento
				setTimeout(() => {
					document.getElementById("newEvent").style.display = "block";
					document.getElementById("newEvent").classList.add("slide-in");

					if (syncEnabled && isConnected) {
						document.getElementById("successMessage").style.display = "flex";

						// Simular apertura de Google Calendar
						setTimeout(() => {
							if (confirm("¿Deseas ver el evento en Google Calendar?")) {
								window.open("https://calendar.google.com", "_blank");
							}
						}, 2000);
					} else if (syncEnabled && !isConnected) {
						showNotification("⚠️ Audiencia guardada. Conecta Google Calendar para sincronizar");
					} else {
						showNotification("✅ Audiencia guardada correctamente");
					}

					// Ocultar mensaje después de 5 segundos
					setTimeout(() => {
						document.getElementById("successMessage").style.display = "none";
					}, 5000);
				}, 500);
			}

			function showNotification(message) {
				// Crear notificación temporal
				const notification = document.createElement("div");
				notification.className = "alert alert-info slide-in";
				notification.style.position = "fixed";
				notification.style.top = "20px";
				notification.style.right = "20px";
				notification.style.zIndex = "2000";
				notification.textContent = message;

				document.body.appendChild(notification);

				setTimeout(() => {
					notification.remove();
				}, 3000);
			}

			// Simular datos de calendario al cargar
			window.onload = function () {
				// Verificar si hay parámetro de conexión exitosa
				if (window.location.search.includes("connected=true")) {
					isConnected = true;
					document.getElementById("disconnectedView").style.display = "none";
					document.getElementById("connectedView").style.display = "block";
				}
			};
		</script>
	</body>
</html>
```

### Tips para grabar el video:

1. **Preparación**:

   - Usa el HTML de demo proporcionado
   - Ten Google Calendar abierto en otra pestaña
   - Prepara capturas de pantalla de los permisos de Google

2. **Herramientas recomendadas**:

   - **OBS Studio**: Para grabar pantalla
   - **Loom**: Alternativa simple con narración
   - **DaVinci Resolve**: Para edición profesional

3. **Durante la grabación**:

   - Habla claro y pausado
   - Resalta con el cursor las acciones importantes
   - Usa zoom para mostrar detalles
   - Mantén un ritmo constante

4. **Post-producción**:
   - Agrega títulos explicativos
   - Incluye música de fondo suave
   - Resalta elementos importantes con flechas
   - Exporta en 1080p mínimo

---

## 🔧 Configuración en Google Cloud Console

### Pasos para habilitar Google Calendar API:

1. **Habilitar la API**:

   - Ve a **APIs & Services** → **Library**
   - Busca "Google Calendar API"
   - Click en **ENABLE**

2. **Agregar Scopes**:

   - Ve a **OAuth consent screen** → **Edit App**
   - En la sección **Scopes**, agrega:

   ```
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/userinfo.email
   ```

3. **Actualizar credenciales** (si ya las tienes):
   - No necesitas crear nuevas credenciales
   - Usa las mismas que para Google Docs

---

## 💻 Implementación Técnica

### Backend - Endpoints necesarios:

```javascript
// Rutas para Google Calendar
router.post("/api/calendar/events", createCalendarEvent);
router.put("/api/calendar/events/:id", updateCalendarEvent);
router.delete("/api/calendar/events/:id", deleteCalendarEvent);
router.get("/api/calendar/settings", getCalendarSettings);
router.put("/api/calendar/settings", updateCalendarSettings);
```

### Frontend - Servicio de Calendar:

```typescript
// services/googleCalendar.ts
interface CalendarEvent {
	title: string;
	start: Date;
	end: Date;
	location?: string;
	description?: string;
	reminders?: Reminder[];
	type: "audiencia" | "vencimiento" | "reunion";
}

class GoogleCalendarService {
	async syncEvent(event: CalendarEvent) {
		// Implementación
	}

	async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
		// Implementación
	}

	async deleteEvent(eventId: string) {
		// Implementación
	}
}
```

### Modelo de datos para sincronización:

```javascript
// models/CalendarSync.js
const calendarSyncSchema = new mongoose.Schema({
	userId: { type: ObjectId, ref: "User", required: true },
	entityType: {
		type: String,
		enum: ["audiencia", "vencimiento", "reunion"],
		required: true,
	},
	entityId: { type: ObjectId, required: true },
	googleEventId: { type: String, required: true },
	lastSyncedAt: { type: Date, default: Date.now },
	syncStatus: {
		type: String,
		enum: ["synced", "pending", "error"],
		default: "synced",
	},
});
```

---

## 📋 Checklist de Implementación

- [ ] Crear video de demostración (3-4 minutos)
- [ ] Subir video a YouTube (no listado)
- [ ] Preparar justificación de permisos
- [ ] Habilitar Google Calendar API
- [ ] Agregar scope calendar.events
- [ ] Implementar sincronización de eventos
- [ ] Crear UI de configuración
- [ ] Manejar actualizaciones bidireccionales
- [ ] Implementar manejo de errores
- [ ] Agregar logs de auditoría

---

**Última actualización:** Diciembre 2024
