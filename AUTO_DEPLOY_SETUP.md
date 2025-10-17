# 🚀 Configuración de Deploy Automático

## Objetivo
Configurar GitHub Actions para que después de hacer `git push` a `main`, se ejecute automáticamente el deploy en el servidor de producción.

## Flujo del Deploy Automático

```
git push → GitHub Actions (checks) → SSH al servidor → deploy.sh → Producción actualizada
```

---

## Paso 1: Generar SSH Key para GitHub Actions

En tu **máquina local**, ejecuta:

```bash
# Generar nueva SSH key específica para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions@law-analytics" -f ~/.ssh/github_actions_law_analytics

# NO uses passphrase (deja en blanco cuando te pregunte)
```

Esto creará dos archivos:
- `~/.ssh/github_actions_law_analytics` (clave privada) ← Para GitHub
- `~/.ssh/github_actions_law_analytics.pub` (clave pública) ← Para el servidor

---

## Paso 2: Configurar la clave pública en el servidor

### 2.1. Copiar la clave pública al servidor

```bash
# Ver el contenido de la clave pública
cat ~/.ssh/github_actions_law_analytics.pub
```

Copia todo el contenido (empieza con `ssh-ed25519 ...`)

### 2.2. Agregar la clave al servidor

Conéctate a tu servidor:

```bash
ssh usuario@tu-servidor
```

Luego ejecuta:

```bash
# Crear directorio .ssh si no existe
mkdir -p ~/.ssh

# Agregar la clave pública a authorized_keys
echo "TU_CLAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys

# Configurar permisos correctos (IMPORTANTE)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 2.3. Probar la conexión

Desde tu **máquina local**, prueba la conexión:

```bash
ssh -i ~/.ssh/github_actions_law_analytics usuario@tu-servidor
```

Si te conecta sin pedir contraseña, ¡está funcionando! 🎉

---

## Paso 2.5: Configurar sudo sin contraseña (IMPORTANTE)

El script `deploy.sh` necesita ejecutarse con `sudo` para recargar nginx. Necesitas configurar sudoers para permitir la ejecución sin contraseña.

### Método Automático (RECOMENDADO ⭐)

En el **servidor**, ejecuta el script helper:

```bash
cd /var/www/law-analytics-front
./setup-sudo.sh
```

Este script interactivo:
- ✅ Detecta automáticamente tu usuario y ruta
- ✅ Te da opciones de configuración (deploy.sh completo o comandos específicos)
- ✅ Valida la sintaxis antes de aplicar cambios
- ✅ Verifica que la configuración funciona correctamente

### Método Manual

Si prefieres configurarlo manualmente:

#### Opción 1: Permitir deploy.sh específicamente (MÁS SEGURO ✅)

En el **servidor**, ejecuta:

```bash
sudo visudo -f /etc/sudoers.d/github-deploy
```

Agrega esta línea (reemplaza `TU_USUARIO` con tu usuario real):

```
TU_USUARIO ALL=(ALL) NOPASSWD: /var/www/law-analytics-front/deploy.sh
```

Ejemplo:
```
cerramaximiliano ALL=(ALL) NOPASSWD: /var/www/law-analytics-front/deploy.sh
```

**Guarda y cierra** (Ctrl+X, luego Y, luego Enter)

#### Opción 2: Permitir comandos específicos de nginx

Si prefieres ser más granular:

```bash
sudo visudo -f /etc/sudoers.d/github-deploy
```

Agrega:
```
TU_USUARIO ALL=(ALL) NOPASSWD: /usr/sbin/nginx
TU_USUARIO ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
TU_USUARIO ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
```

### Verificar la configuración

```bash
# Probar que sudo funciona sin contraseña
sudo -n /var/www/law-analytics-front/deploy.sh --help

# Si funciona sin pedir contraseña, está bien configurado ✅
```

⚠️ **Importante**: Si ves "sudo: a password is required", la configuración de sudoers no está funcionando.

---

## Paso 3: Agregar la clave privada como GitHub Secret

### 3.1. Copiar la clave privada

En tu **máquina local**:

```bash
cat ~/.ssh/github_actions_law_analytics
```

Copia **TODO el contenido**, incluyendo:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### 3.2. Agregar el Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (configuración)
3. En el menú izquierdo, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega los siguientes secrets:

| Name | Value |
|------|-------|
| `SSH_PRIVATE_KEY` | El contenido completo de la clave privada |
| `SERVER_HOST` | La IP o dominio de tu servidor (ej: `192.168.1.100` o `servidor.ejemplo.com`) |
| `SERVER_USER` | El usuario SSH del servidor (ej: `cerramaximiliano`) |
| `SERVER_PATH` | La ruta del proyecto (ej: `/var/www/law-analytics-front`) |

---

## Paso 4: Variables adicionales (opcional)

Si tu servidor SSH usa un puerto diferente al 22:

| Name | Value |
|------|-------|
| `SERVER_PORT` | Puerto SSH (ej: `2222`) |

---

## Paso 5: Verificar el workflow

El workflow `.github/workflows/pre-deploy-check.yml` ha sido actualizado para incluir el deploy automático.

Ahora el flujo será:

1. **Check Phase** (en GitHub Actions):
   - Type checking
   - Lint
   - Build
   - Análisis de bundle

2. **Deploy Phase** (si todos los checks pasan):
   - SSH al servidor
   - Ejecutar `deploy.sh`
   - Verificar que el deploy fue exitoso

---

## ⚠️ Seguridad

- ✅ **NUNCA** compartas la clave privada
- ✅ La clave privada **SOLO** debe estar en GitHub Secrets
- ✅ La clave pública puede estar en múltiples servidores
- ✅ Usa una clave diferente para cada propósito (no reutilices tu clave personal)

---

## 🧪 Probar el Deploy Automático

1. Hacer un cambio pequeño en el código:
   ```bash
   echo "# Test deploy automático" >> README.md
   git add README.md
   git commit -m "test: probar deploy automático"
   git push origin main
   ```

2. Ver el progreso en GitHub:
   - Ve a tu repositorio en GitHub
   - Click en **Actions** (arriba)
   - Verás el workflow ejecutándose en tiempo real

3. Si todo sale bien:
   - ✅ Checks pasan
   - ✅ Deploy se ejecuta
   - ✅ Tu servidor se actualiza automáticamente

---

## 🐛 Troubleshooting

### Error: "Permission denied (publickey)"

**Solución**: Verifica que:
1. La clave pública está en `~/.ssh/authorized_keys` del servidor
2. Los permisos son correctos: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
3. El secret `SSH_PRIVATE_KEY` tiene el contenido completo de la clave privada

### Error: "sudo: a password is required"

**Solución**: La configuración de sudoers no está funcionando. En el servidor:

```bash
# Verificar que el archivo existe
sudo cat /etc/sudoers.d/github-deploy

# Debe contener algo como:
# TU_USUARIO ALL=(ALL) NOPASSWD: /var/www/law-analytics-front/deploy.sh

# Verificar sintaxis de sudoers
sudo visudo -c

# Probar manualmente
sudo -n /var/www/law-analytics-front/deploy.sh --help
```

Si sigue pidiendo contraseña, revisa que:
1. El usuario en sudoers coincide exactamente con `$USER`
2. La ruta del script es absoluta y correcta
3. No hay otros archivos en `/etc/sudoers.d/` que sobrescriban la configuración

### Error: "Host key verification failed"

**Solución**: El workflow incluye `StrictHostKeyChecking=no` para la primera conexión.

### El deploy no se ejecuta

**Solución**: Verifica que:
1. El push fue a la rama `main` o `master`
2. Todos los checks previos pasaron
3. Los secrets están configurados correctamente en GitHub

### Error: "nginx: command not found" o "systemctl: command not found"

**Solución**: En la configuración de sudoers, usa rutas absolutas:

```bash
# Encontrar la ruta completa
which nginx        # /usr/sbin/nginx
which systemctl    # /bin/systemctl

# Usar esas rutas en sudoers
```

---

## 📊 Monitoreo

Después de cada push, puedes:

1. **Ver logs en GitHub Actions**: Ve a Actions → Click en el workflow → Ver logs
2. **Ver logs en el servidor**: SSH al servidor y revisa los logs del deploy
3. **Verificar la versión**: Abre `https://tu-dominio.com/version.json`

---

## 🔄 Rollback (revertir cambios)

Si algo sale mal:

```bash
# En el servidor
cd /var/www/law-analytics-front
git log --oneline  # Ver commits recientes
git reset --hard HASH_DEL_COMMIT_ANTERIOR
./deploy.sh
```

---

## ✅ Checklist de configuración

- [ ] SSH key generada
- [ ] Clave pública agregada al servidor
- [ ] Permisos configurados correctamente (700 y 600)
- [ ] Conexión SSH probada desde local
- [ ] **Sudo configurado sin contraseña (sudoers)**
- [ ] **Verificado que `sudo -n ./deploy.sh --help` funciona**
- [ ] Secret `SSH_PRIVATE_KEY` agregado en GitHub
- [ ] Secret `SERVER_HOST` agregado en GitHub
- [ ] Secret `SERVER_USER` agregado en GitHub
- [ ] Secret `SERVER_PATH` agregado en GitHub
- [ ] Push de prueba realizado
- [ ] Workflow ejecutado exitosamente
- [ ] Servidor actualizado automáticamente

---

## 📝 Notas importantes

1. **El deploy solo se ejecuta si todos los checks pasan** - esto previene deployar código con errores
2. **Los deploys se ejecutan solo en push a main** - los PRs solo ejecutan checks
3. **El script deploy.sh se ejecuta con las verificaciones** - puedes desactivarlas con `--skip-checks` si es necesario
4. **Mantén backups** - antes de implementar esto en producción, asegúrate de tener backups de tu código y base de datos

---

Documentación creada el: 2025-10-17
Proyecto: Law Analytics Front-end
