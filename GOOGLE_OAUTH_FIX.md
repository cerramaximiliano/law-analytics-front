# Corrección de URLs para Google OAuth - Pantalla de Consentimiento

## Problema Identificado

Google Cloud ha detectado que las URLs configuradas en la pantalla de consentimiento OAuth no responden correctamente:

- ❌ Homepage URL incorrecta: `https://lawanalytics.app/` (con "/" al final)
- ❌ Privacy Policy URL incorrecta: `https://www.lawanalytics.app/privacy-policy` (con "www")

## URLs Correctas a Configurar

Las URLs correctas que deben configurarse en Google Cloud Console son:

- ✅ **Homepage URL**: `https://lawanalytics.app`
- ✅ **Privacy Policy URL**: `https://lawanalytics.app/privacy-policy`
- ✅ **Terms of Service URL**: `https://lawanalytics.app/terms`

## Pasos para Corregir en Google Cloud Console

1. **Acceder a Google Cloud Console**
   - Ir a [https://console.cloud.google.com](https://console.cloud.google.com)
   - Seleccionar el proyecto de Law Analytics

2. **Navegar a la Pantalla de Consentimiento OAuth**
   - En el menú lateral, ir a "APIs y servicios"
   - Seleccionar "Pantalla de consentimiento OAuth"

3. **Editar la Configuración**
   - Hacer clic en "EDITAR APLICACIÓN"
   
4. **Actualizar las URLs en "Información de la aplicación"**
   - **Nombre de la aplicación**: Law Analytics (mantener)
   - **Correo electrónico de asistencia del usuario**: (mantener el actual)
   - **Logotipo de la aplicación**: (mantener el actual)
   - **Dominio de la página principal de la aplicación**: `https://lawanalytics.app`
   - **Vínculo de la Política de Privacidad**: `https://lawanalytics.app/privacy-policy`
   - **Vínculo de las Condiciones del Servicio**: `https://lawanalytics.app/terms`

5. **Dominios Autorizados**
   - Asegurarse de que `lawanalytics.app` esté en la lista (sin www)

6. **URIs de Redirección Autorizadas**
   Verificar que estén configuradas correctamente:
   - `https://lawanalytics.app/auth/google/callback`
   - `https://lawanalytics.app/api/auth/callback/google`
   - Cualquier otra URI de desarrollo si es necesario

7. **Guardar y Continuar**
   - Hacer clic en "GUARDAR Y CONTINUAR" en cada sección
   - Revisar el resumen final
   - Hacer clic en "VOLVER AL PANEL"

## Verificación

Después de actualizar las URLs, verificar que:

1. La página principal `https://lawanalytics.app` carga correctamente
2. La página de privacidad `https://lawanalytics.app/privacy-policy` es accesible
3. La página de términos `https://lawanalytics.app/terms` es accesible

## Notas Importantes

- **NO usar www**: El dominio configurado es `lawanalytics.app` sin el prefijo www
- **NO agregar "/" al final** de la URL de la página principal
- Asegurarse de que todas las rutas sean exactamente como están especificadas
- Si se requiere volver a enviar para verificación, hacerlo después de estos cambios

## Configuración del Servidor

Asegurarse de que el servidor web está configurado para:
- Redirigir `www.lawanalytics.app` a `lawanalytics.app`
- Servir correctamente las rutas `/privacy-policy` y `/terms`
- Tener certificados SSL válidos para el dominio principal

## Contacto de Soporte

Si Google requiere información adicional o hay problemas con la verificación:
- Email de soporte: support@lawanalytics.app
- Email de privacidad: privacy@lawanalytics.app

---

**Fecha de creación**: 08/01/2025
**Estado**: Pendiente de aplicar en Google Cloud Console