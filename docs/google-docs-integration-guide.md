# Guía de Integración con Google Docs - Law Analytics

## 📋 Índice
1. [Configuración en Google Cloud Console](#configuración-en-google-cloud-console)
2. [Justificación de Permisos](#justificación-de-permisos)
3. [Video de Demostración](#video-de-demostración)
4. [Implementación Backend](#implementación-backend)
5. [Implementación Frontend](#implementación-frontend)

---

## 🔧 Configuración en Google Cloud Console

### Paso 1: Crear Proyecto
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto: "Law Analytics"
3. Anotar el Project ID

### Paso 2: Habilitar APIs
1. Ir a **APIs & Services** → **Library**
2. Buscar y habilitar:
   - **Google Docs API**
   - **Google Drive API**

### Paso 3: Configurar OAuth 2.0
1. Ir a **APIs & Services** → **OAuth consent screen**
2. Seleccionar **External** (o Internal si es para organización)
3. Completar información básica:
   - App name: "Law Analytics"
   - User support email: [tu-email]
   - Developer contact: [tu-email]

### Paso 4: Agregar Scopes
1. En la sección **Scopes**, click en **ADD OR REMOVE SCOPES**
2. Buscar y agregar:
   ```
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/userinfo.email
   ```

### Paso 5: Crear Credenciales
1. Ir a **APIs & Services** → **Credentials**
2. Click **CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Law Analytics Web Client"
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://tu-dominio.com
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:5000/api/google/auth/callback
   https://tu-dominio.com/api/google/auth/callback
   ```
7. Descargar JSON con credenciales

---

## 📝 Justificación de Permisos

### Respuesta para Google sobre el uso de permisos:

**Pregunta:** ¿Cómo usará su aplicación los permisos de Google Docs?

**Respuesta recomendada:**

```
Nuestra aplicación "Law Analytics" es una plataforma de gestión documental para abogados que permite exportar documentos legales a Google Docs para facilitar la colaboración con clientes y colegas.

Uso específico del permiso Google Docs API:
- Los usuarios crean documentos legales (escritos judiciales, contratos, etc.) en nuestro editor especializado
- Cuando necesitan colaborar, pueden exportar estos documentos a Google Docs con un clic
- Solo CREAMOS nuevos documentos, no leemos ni modificamos documentos existentes
- El usuario mantiene control total y puede revocar acceso en cualquier momento

Justificación comercial:
- Los abogados necesitan compartir documentos de forma segura con clientes
- Google Docs ofrece colaboración en tiempo real que complementa nuestro editor
- Mejora el flujo de trabajo integrando herramientas que los profesionales ya utilizan

Seguridad y privacidad:
- No almacenamos tokens permanentemente
- No accedemos a documentos existentes del usuario
- Solo actuamos cuando el usuario solicita explícitamente la exportación
- Cumplimos con todas las políticas de privacidad de Google
```

---

## 🎥 Video de Demostración

### Estructura del Video (2-3 minutos)

#### Guión Detallado:

**[00:00-00:10] Introducción**
- Logo de Law Analytics
- Texto: "Demostración de integración con Google Docs"
- Narración: "Esta es una demostración de cómo Law Analytics utiliza los permisos de Google Docs"

**[00:10-00:30] Mostrar Editor**
- Pantalla del editor con documento legal
- Destacar el botón "Exportar a Google Docs"
- Narración: "Los abogados crean documentos legales en nuestro editor especializado"

**[00:30-00:50] Iniciar Exportación**
- Usuario hace clic en "Exportar a Google Docs"
- Mostrar tooltip explicativo
- Narración: "Cuando necesitan colaborar, exportan sus documentos a Google Docs"

**[00:50-01:20] Flujo de Autorización**
- Mostrar ventana de OAuth de Google (mockup si es necesario)
- Destacar los permisos solicitados
- Narración: "En el primer uso, el usuario autoriza el acceso. Solo solicitamos permisos para crear documentos nuevos"

**[01:20-01:50] Proceso de Exportación**
- Mostrar barra de progreso o animación
- Mensaje: "Exportando documento..."
- Narración: "El documento se exporta manteniendo el formato y estructura"

**[01:50-02:10] Resultado Final**
- Mostrar Google Docs abierto con el documento
- Destacar que es un documento nuevo
- Narración: "El documento está listo para colaboración. El usuario puede compartirlo y editarlo en Google Docs"

**[02:10-02:30] Conclusión**
- Mostrar opciones de privacidad
- Texto: "El usuario puede revocar acceso en cualquier momento"
- Narración: "El usuario mantiene control total sobre sus documentos y puede desconectar Google cuando desee"

### Herramientas para crear el video:

1. **Grabación de pantalla:**
   - OBS Studio (gratis)
   - Loom (freemium)
   - Camtasia (pago)

2. **Edición:**
   - DaVinci Resolve (gratis)
   - Adobe Premiere (pago)
   - iMovie (Mac, gratis)

3. **Mockups/Diseño:**
   - Figma (gratis)
   - Adobe XD (gratis con límites)
   - Canva (freemium)

### Código Demo para el Video:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Law Analytics - Demo Google Docs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: #1976d2;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .editor {
            padding: 40px;
            min-height: 600px;
            font-family: 'Times New Roman', serif;
            line-height: 1.8;
        }
        
        .editor h2 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 18pt;
        }
        
        .editor p {
            margin-bottom: 15px;
            text-align: justify;
            text-indent: 2em;
        }
        
        .toolbar {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .btn {
            padding: 8px 16px;
            border: 1px solid #dee2e6;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #f8f9fa;
        }
        
        .btn-primary {
            background: #4285f4;
            color: white;
            border-color: #4285f4;
        }
        
        .btn-primary:hover {
            background: #3367d6;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 500px;
            text-align: center;
        }
        
        .google-logo {
            width: 120px;
            margin-bottom: 20px;
        }
        
        .success-message {
            display: none;
            background: #4caf50;
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Law Analytics - Editor de Documentos Legales</h1>
            <span>Usuario: Dr. Juan Pérez</span>
        </div>
        
        <div class="toolbar">
            <button class="btn">
                <span>📄</span> Nuevo
            </button>
            <button class="btn">
                <span>💾</span> Guardar
            </button>
            <button class="btn">
                <span>🖨️</span> Imprimir
            </button>
            <button class="btn">
                <span>📥</span> Descargar PDF
            </button>
            <button class="btn btn-primary" onclick="exportToGoogleDocs()">
                <span>📤</span> Exportar a Google Docs
            </button>
        </div>
        
        <div class="success-message" id="successMessage">
            ✅ Documento exportado exitosamente a Google Docs
        </div>
        
        <div class="editor">
            <h2>ESCRITO JUDICIAL</h2>
            <p><strong>SR. JUEZ:</strong></p>
            <p>JUAN GARCÍA, DNI 12.345.678, por derecho propio, con domicilio real en Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, constituyendo domicilio procesal en Av. de Mayo 567, piso 3°, oficina "B" de esta ciudad, con el patrocinio letrado del Dr. CARLOS RODRÍGUEZ, abogado inscripto al Tomo 50, Folio 123 del CPACF, CUIT 20-98765432-1, con domicilio electrónico 20987654321@notificaciones.scba.gov.ar, ante V.S. respetuosamente me presento y digo:</p>
            <p><strong>I.- OBJETO:</strong></p>
            <p>Que vengo por el presente a iniciar formal demanda por daños y perjuicios contra EMPRESA S.A., CUIT 30-12345678-9, con domicilio en Av. Libertador 4567 de esta ciudad, por los hechos y fundamentos de derecho que paso a exponer.</p>
            <p><strong>II.- HECHOS:</strong></p>
            <p>El día 15 de marzo de 2024, siendo aproximadamente las 14:30 horas, me encontraba transitando por la intersección de las calles...</p>
        </div>
    </div>
    
    <!-- Modal de autorización (mockup) -->
    <div class="modal" id="authModal">
        <div class="modal-content">
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" class="google-logo">
            <h3>Law Analytics quiere acceder a tu cuenta de Google</h3>
            <p style="margin: 20px 0;">Esto permitirá que Law Analytics:</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>✓ Cree nuevos documentos en Google Docs</li>
                <li>✓ Vea la dirección de correo de tu cuenta</li>
            </ul>
            <p style="font-size: 12px; color: #666; margin: 20px 0;">
                Law Analytics no podrá ver ni editar tus documentos existentes
            </p>
            <button class="btn btn-primary" onclick="authorizeGoogle()" style="margin: 10px;">
                Autorizar
            </button>
            <button class="btn" onclick="closeModal()">
                Cancelar
            </button>
        </div>
    </div>
    
    <script>
        function exportToGoogleDocs() {
            // Simular verificación de autenticación
            const isAuthenticated = localStorage.getItem('googleAuth');
            
            if (!isAuthenticated) {
                // Mostrar modal de autorización
                document.getElementById('authModal').style.display = 'flex';
            } else {
                // Simular exportación
                performExport();
            }
        }
        
        function authorizeGoogle() {
            // Simular autorización
            localStorage.setItem('googleAuth', 'true');
            closeModal();
            performExport();
        }
        
        function closeModal() {
            document.getElementById('authModal').style.display = 'none';
        }
        
        function performExport() {
            // Simular proceso de exportación
            const btn = document.querySelector('.btn-primary');
            btn.innerHTML = '<span>⏳</span> Exportando...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerHTML = '<span>📤</span> Exportar a Google Docs';
                btn.disabled = false;
                
                // Mostrar mensaje de éxito
                document.getElementById('successMessage').style.display = 'block';
                
                // Abrir Google Docs en nueva pestaña
                setTimeout(() => {
                    window.open('https://docs.google.com/document/d/demo/edit', '_blank');
                }, 1000);
                
                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    document.getElementById('successMessage').style.display = 'none';
                }, 5000);
            }, 2000);
        }
    </script>
</body>
</html>
```

---

## 🔧 Implementación Backend

### Variables de Entorno (.env)
```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/auth/callback

# Session Secret
SESSION_SECRET=genera-un-string-aleatorio-seguro-aqui

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MongoDB (para guardar tokens)
MONGODB_URI=mongodb://localhost:27017/lawanalytics
```

### Dependencias necesarias:
```bash
npm install googleapis google-auth-library express-session connect-mongo
```

### Estructura de archivos:
```
backend/
├── src/
│   ├── config/
│   │   └── google.config.js
│   ├── services/
│   │   ├── googleDocs.service.js
│   │   └── htmlToGoogleDocs.utils.js
│   ├── controllers/
│   │   └── googleAuth.controller.js
│   ├── routes/
│   │   └── google.routes.js
│   ├── models/
│   │   └── UserGoogleAuth.model.js
│   └── middleware/
│       └── auth.js
```

### Endpoints a implementar:
```
GET  /api/google/auth/status      - Verificar si el usuario tiene Google conectado
GET  /api/google/auth/url         - Obtener URL de autorización OAuth
GET  /api/google/auth/callback    - Callback de OAuth (recibe el código)
POST /api/google/auth/disconnect  - Desconectar cuenta de Google
POST /api/google/docs/export      - Exportar documento a Google Docs
```

---

## 💻 Implementación Frontend

### Servicio ya creado:
- Ubicación: `/src/services/googleDocs.ts`
- Métodos:
  - `checkGoogleAuth()` - Verifica estado de autenticación
  - `initiateGoogleAuth()` - Inicia flujo OAuth
  - `exportToGoogleDocs()` - Exporta documento
  - `disconnectGoogle()` - Desconecta cuenta

### Integración en el editor:
- Archivo: `/src/sections/documents/TiptapCSSPagedEditor.tsx`
- Botón: "Exportar a Google Docs" con icono de Google
- Función: `handleExportToGoogleDocs()`

### Flujo de usuario:
1. Usuario hace clic en "Exportar a Google Docs"
2. Si no está autenticado, se abre popup de OAuth
3. Usuario autoriza los permisos
4. Documento se exporta
5. Se abre el documento en Google Docs

---

## 📋 Checklist de Implementación

### Google Cloud Console:
- [ ] Crear proyecto en Google Cloud
- [ ] Habilitar Google Docs API
- [ ] Habilitar Google Drive API
- [ ] Configurar pantalla de consentimiento OAuth
- [ ] Agregar scopes necesarios
- [ ] Crear credenciales OAuth 2.0
- [ ] Descargar JSON de credenciales

### Video de demostración:
- [ ] Crear mockups/prototipos de las pantallas
- [ ] Grabar flujo de usuario (2-3 minutos)
- [ ] Editar video con explicaciones
- [ ] Subir a YouTube (no listado)
- [ ] Incluir link en solicitud de Google

### Backend:
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias
- [ ] Crear modelo UserGoogleAuth
- [ ] Implementar servicio de Google OAuth
- [ ] Implementar controladores
- [ ] Configurar rutas
- [ ] Implementar conversión HTML a Google Docs
- [ ] Agregar manejo de errores
- [ ] Configurar sesiones

### Frontend:
- [ ] Restaurar servicio googleDocs.ts
- [ ] Restaurar botón en editor
- [ ] Implementar manejo de popup OAuth
- [ ] Agregar notificaciones de éxito/error
- [ ] Probar flujo completo

### Seguridad:
- [ ] Validar todos los inputs
- [ ] Implementar CSRF protection
- [ ] Usar HTTPS en producción
- [ ] No exponer tokens al frontend
- [ ] Implementar rate limiting

### Testing:
- [ ] Probar flujo de autorización
- [ ] Probar exportación de documentos
- [ ] Probar manejo de errores
- [ ] Probar revocación de acceso
- [ ] Probar con diferentes tipos de documentos

---

## 🔒 Consideraciones de Seguridad

1. **Tokens**: Nunca enviar tokens de Google al frontend
2. **HTTPS**: Obligatorio en producción
3. **Validación**: Validar todo input del usuario
4. **Logs**: Mantener logs de todas las operaciones
5. **Revocación**: Permitir al usuario desconectar Google fácilmente

---

## 📚 Referencias

- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 📞 Soporte

Para preguntas sobre la implementación:
- Documentación oficial de Google
- Stack Overflow con tag `google-docs-api`
- Foro de desarrolladores de Google

---

**Última actualización:** Diciembre 2024