# Guia de Equipos

## Descripcion General

Aprende a crear y gestionar equipos de trabajo para colaborar con otros profesionales en tus causas, contactos, calculadoras y demas recursos de Law Analytics.

## Objetivos de Aprendizaje

- Entender como funciona el sistema de equipos
- Crear un equipo y configurarlo
- Invitar miembros y asignarles roles
- Aceptar invitaciones a equipos
- Gestionar recursos compartidos dentro del equipo
- Conocer los limites por plan
- Administrar miembros y roles
- Abandonar o eliminar un equipo

---

## 1. Introduccion a los Equipos

El sistema de equipos te permite invitar colaboradores para trabajar juntos en tus recursos de Law Analytics. Todo el equipo comparte las causas, contactos, calculadoras y documentos del propietario.

### Lo que aprenderas:

- ✅ Crear un equipo y ser su propietario
- ✅ Invitar colegas y asignarles roles con permisos especificos
- ✅ Trabajar colaborativamente en causas y recursos compartidos
- ✅ Gestionar miembros, cambiar roles y remover colaboradores
- ✅ Entender como funcionan los limites del plan en equipos
- ✅ Migrar o eliminar recursos al unirte a un equipo

### Concepto clave: Pool compartido

> **"La cuenta del propietario ES el equipo"**

Cuando creas un equipo, todos tus recursos (causas, contactos, calculadoras, documentos) pasan a estar disponibles para los miembros segun su rol. No existe separacion entre recursos "personales" y recursos "del equipo": todo se comparte desde la cuenta del propietario.

---

## 2. Requisitos para Crear un Equipo

Para crear un equipo necesitas:

- **Plan Standard o Premium**: Los usuarios con plan Free no pueden crear equipos
- **No pertenecer a otro equipo**: Solo puedes pertenecer a un equipo a la vez

### Limites de miembros por plan:

| Plan         | Miembros Maximos | Equipos       |
| ------------ | ---------------- | ------------- |
| **Free**     | -                | No disponible |
| **Standard** | 5 miembros       | 1 equipo      |
| **Premium**  | 10 miembros      | 1 equipo      |

> **💡 Nota**: El limite de miembros se refiere a los invitados. El propietario no cuenta dentro de ese limite.

---

## 3. Crear un Equipo

### Pasos para crear tu equipo:

1. Ve a la seccion de **Equipos** en el menu lateral
2. Haz clic en el boton **"Crear Equipo"**
3. Completa los datos del equipo:
   - **Nombre**: Un nombre descriptivo (ej. "Estudio Garcia & Asociados")
   - **Descripcion**: Breve descripcion del equipo (opcional)
4. Haz clic en **"Crear"**

```
┌─────────────────────────────────────┐
│  Crear Equipo                       │
├─────────────────────────────────────┤
│                                     │
│  Nombre del equipo *               │
│  ┌─────────────────────────────┐   │
│  │ Estudio Garcia & Asociados  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Descripcion                       │
│  ┌─────────────────────────────┐   │
│  │ Equipo del estudio juridico │   │
│  └─────────────────────────────┘   │
│                                     │
│         [Cancelar]  [Crear]        │
└─────────────────────────────────────┘
```

### Que sucede al crear el equipo:

- Te conviertes en el **Propietario (Owner)** del equipo
- Todos tus recursos existentes pasan a estar disponibles para los futuros miembros
- Los limites de tu plan definen la capacidad del equipo (causas, almacenamiento, etc.)

> **⚠️ Importante**: Al crear un equipo, tus recursos siguen siendo tuyos. Los miembros podran verlos y (segun su rol) editarlos, pero la propiedad siempre es del propietario.

---

## 4. Invitar Miembros

### Pasos para invitar colaboradores:

1. Abre la configuracion de tu equipo
2. Haz clic en **"Invitar Miembro"**
3. Ingresa el **email** del colaborador
4. Selecciona el **rol** que deseas asignarle
5. Haz clic en **"Enviar Invitacion"**

```
┌─────────────────────────────────────┐
│  Invitar Miembro                    │
├─────────────────────────────────────┤
│                                     │
│  Email del colaborador *           │
│  ┌─────────────────────────────┐   │
│  │ juan@ejemplo.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Rol *                             │
│  ┌─────────────────────────────┐   │
│  │ Editor                  ▼   │   │
│  └─────────────────────────────┘   │
│                                     │
│     [Cancelar]  [Enviar Invitacion]│
└─────────────────────────────────────┘
```

### Que sucede al enviar la invitacion:

- El colaborador recibe un **email con un link de invitacion**
- La invitacion es **valida por 7 dias**
- Aparece como **"Pendiente"** hasta que sea aceptada o rechazada
- Puedes **revocar** la invitacion en cualquier momento antes de que sea aceptada

> **💡 Nota**: Solo el Propietario y los Administradores pueden invitar nuevos miembros al equipo.

---

## 5. Roles y Permisos

El sistema de equipos tiene cuatro roles con diferentes niveles de acceso:

### Matriz de permisos:

| Accion                | Propietario | Administrador | Editor | Visor |
| --------------------- | :---------: | :-----------: | :----: | :---: |
| **Ver recursos**      |     ✅      |      ✅       |   ✅   |  ✅   |
| **Crear recursos**    |     ✅      |      ✅       |   ✅   |  ❌   |
| **Editar recursos**   |     ✅      |      ✅       |   ✅   |  ❌   |
| **Eliminar recursos** |     ✅      |      ✅       |   ❌   |  ❌   |
| **Invitar miembros**  |     ✅      |      ✅       |   ❌   |  ❌   |
| **Cambiar roles**     |     ✅      |      ✅       |   ❌   |  ❌   |
| **Remover miembros**  |     ✅      |      ✅       |   ❌   |  ❌   |
| **Configurar equipo** |     ✅      |      ✅       |   ❌   |  ❌   |
| **Eliminar equipo**   |     ✅      |      ❌       |   ❌   |  ❌   |

### Descripcion de cada rol:

#### Propietario (Owner)

- Es el creador y dueno del equipo y de todos los recursos
- Los limites de su plan definen la capacidad del equipo
- Es el unico que puede eliminar el equipo
- No puede ser removido ni degradado de rol

#### Administrador (Admin)

- Puede gestionar miembros: invitar, cambiar roles y remover
- Puede crear, editar y eliminar recursos
- Puede configurar opciones del equipo
- Rol ideal para socios o colaboradores de confianza

#### Editor

- Puede crear y editar recursos (causas, contactos, notas, etc.)
- No puede eliminar recursos ni gestionar miembros
- Rol ideal para colaboradores que necesitan contribuir activamente

#### Visor (Viewer)

- Solo puede ver recursos, sin crear, editar ni eliminar
- No puede gestionar miembros
- Rol ideal para supervisores, pasantes o clientes con acceso de consulta

> **💡 Consejo**: Asigna el rol minimo necesario para cada colaborador. Un pasante que solo necesita consultar informacion debe ser Visor, mientras que un abogado que trabaja activamente en causas deberia ser Editor o Administrador.

---

## 6. Aceptar una Invitacion

Cuando recibes una invitacion a un equipo, el proceso depende de tu situacion actual:

### Caso A: Eres un usuario nuevo

1. Recibiras un email con un link de invitacion
2. Haz clic en el link
3. Se te pedira crear una cuenta con:
   - Nombre
   - Apellido
   - Contrasena
4. Al completar el registro, te unes automaticamente al equipo con el rol asignado

### Caso B: Ya tienes cuenta pero SIN recursos

1. Haz clic en el link de invitacion del email
2. Si no estas logueado, ingresa con tu cuenta existente
3. Veras los detalles de la invitacion (nombre del equipo, rol asignado)
4. Haz clic en **"Aceptar"** para unirte al equipo

### Caso C: Ya tienes cuenta CON recursos existentes

Si ya tienes causas, contactos u otros recursos en tu cuenta personal, deberas decidir que hacer con ellos antes de unirte:

```
┌─────────────────────────────────────────────────────┐
│  Tienes recursos existentes en tu cuenta personal   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Resumen de tus recursos:                          │
│  ├── 5 Causas                                      │
│  ├── 12 Calculadoras                               │
│  ├── 8 Contactos                                   │
│  └── 150 MB de almacenamiento                      │
│                                                     │
│  Para unirte al equipo, elige que hacer:           │
│                                                     │
│  ○ Migrar al equipo                                │
│    Tus recursos pasaran a ser del equipo           │
│    y seran accesibles para todos los miembros.     │
│                                                     │
│  ○ Exportar y eliminar                             │
│    Descargaras un backup antes de eliminarlos.     │
│                                                     │
│  ○ Eliminar recursos                               │
│    Tus recursos seran eliminados permanentemente.  │
│                                                     │
│        [Cancelar]            [Continuar]           │
└─────────────────────────────────────────────────────┘
```

#### Opcion 1: Migrar al equipo

- Tus recursos se transfieren al equipo y pasan a ser propiedad del propietario
- Todos los miembros podran acceder a ellos segun su rol
- Es la opcion recomendada si quieres mantener tus datos

#### Opcion 2: Exportar y eliminar

- Descargas un respaldo de todos tus recursos
- Luego se eliminan de tu cuenta
- Te unes al equipo con la cuenta limpia

#### Opcion 3: Eliminar recursos

- Tus recursos se eliminan permanentemente
- Te unes al equipo con la cuenta limpia

> **⚠️ Importante**: Si la migracion excederia los limites del plan del propietario, se te notificara cuales recursos no pueden migrarse. El propietario debera liberar espacio o mejorar su plan.

---

## 7. Trabajar en Equipo

Una vez dentro del equipo, trabajas directamente con los recursos compartidos:

### Creacion de recursos:

Cuando creas una causa, contacto, nota o cualquier otro recurso:

- El recurso se crea dentro del equipo automaticamente
- Cuenta contra los limites del plan del **propietario**
- Todos los miembros pueden acceder segun su rol
- Se registra quien creo el recurso para auditoria

### Limites del equipo:

Los limites de recursos son los del plan del propietario:

| Recurso            | Standard | Premium |
| ------------------ | -------- | ------- |
| **Causas**         | 50       | 500     |
| **Calculadoras**   | 20       | 200     |
| **Contactos**      | 100      | 1.000   |
| **Almacenamiento** | 1 GB     | 10 GB   |

> **💡 Nota**: Todos los recursos creados por cualquier miembro cuentan contra estos limites. Si el equipo alcanza el limite de causas, ningun miembro podra crear causas nuevas hasta que se archiven/eliminen existentes o el propietario mejore su plan.

### Historial de actividad:

El sistema registra automaticamente todas las acciones del equipo:

- Quien creo, edito o elimino cada recurso
- Fecha y hora de cada accion
- Detalle de los cambios realizados

El propietario y los administradores pueden consultar el historial de actividad completo del equipo.

---

## 8. Gestion de Miembros

### Cambiar el rol de un miembro:

1. Ve a la configuracion del equipo
2. Busca al miembro en la lista
3. Haz clic en el menu de opciones del miembro
4. Selecciona **"Cambiar rol"**
5. Elige el nuevo rol y confirma

### Remover un miembro:

1. Ve a la configuracion del equipo
2. Busca al miembro en la lista
3. Haz clic en **"Remover"**
4. Confirma la accion

### Que sucede al remover un miembro:

- El miembro pierde acceso inmediato a todos los recursos del equipo
- Los recursos que creo permanecen en el equipo (son del propietario)
- El ex-miembro queda sin equipo y sin recursos
- Puede unirse a otro equipo o comenzar a crear sus propios recursos

> **💡 Nota**: Solo el Propietario y los Administradores pueden cambiar roles y remover miembros. Un Administrador no puede remover ni cambiar el rol del Propietario.

---

## 9. Restriccion: Un Equipo por Usuario

Actualmente, cada usuario solo puede pertenecer a **un equipo a la vez**. Esto significa:

- Si ya eres miembro de un equipo, no puedes aceptar invitaciones a otros equipos
- Debes **abandonar tu equipo actual** antes de unirte a uno nuevo

### Para cambiar de equipo:

1. Ve a la configuracion de tu equipo actual
2. Haz clic en **"Abandonar Equipo"**
3. Confirma la accion
4. Acepta la nueva invitacion

> **⚠️ Importante**: Al abandonar un equipo, los recursos que creaste o migraste permanecen en el equipo (son propiedad del propietario). Quedas sin recursos propios y puedes unirte a otro equipo o comenzar desde cero.

---

## 10. Eliminar un Equipo

Solo el **Propietario** puede eliminar el equipo.

### Que sucede al eliminar el equipo:

1. Todos los miembros pierden acceso inmediatamente
2. Los recursos permanecen en la cuenta del propietario (siguen siendo suyos)
3. El propietario vuelve a ser un usuario individual con todos sus recursos
4. Los ex-miembros quedan sin equipo y pueden unirse a otros o crear cuentas propias

> **💡 Nota**: Eliminar un equipo **no elimina** ningún recurso. Las causas, contactos y demas datos siguen disponibles para el propietario como recursos personales.

---

## 11. Tu Plan y los Equipos

### Mejora de plan:

- Al mejorar de Standard a Premium, el equipo obtiene automaticamente mas capacidad (mas miembros, mas recursos, mas almacenamiento)
- No se requiere ninguna accion adicional

### Degradacion de plan:

El sistema protege tu equipo impidiendo cambios de plan incompatibles:

- **Si intentas bajar al plan Free**: Se bloquea la accion mientras tengas un equipo activo. Debes eliminar el equipo primero.
- **Si intentas bajar a un plan con menos miembros permitidos**: Se bloquea si tu equipo tiene mas miembros activos de los que permite el nuevo plan. Debes remover miembros primero.

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ No es posible cambiar de plan                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  No puedes cambiar al plan gratuito mientras seas  │
│  propietario del equipo "Estudio Garcia".          │
│                                                     │
│  Para cambiar de plan, primero debes:              │
│  • Eliminar tu equipo desde la configuracion       │
│  • O remover miembros hasta cumplir los limites    │
│    del nuevo plan                                  │
│                                                     │
│                               [Entendido]          │
└─────────────────────────────────────────────────────┘
```

> **⚠️ Importante**: Si ocurre un problema de pago y Stripe fuerza una degradacion automatica, el equipo sera **suspendido** temporalmente hasta que se resuelva el plan.

---

## 12. Consejos Practicos

### Asignacion de roles

Asigna el rol minimo necesario a cada colaborador. Si alguien solo necesita consultar informacion, asignale el rol de Visor. Esto protege tus datos de modificaciones accidentales.

### Organizacion del equipo

Antes de invitar miembros, organiza tus causas y recursos. Un equipo bien organizado facilita el trabajo colaborativo desde el primer dia.

### Comunicacion de limites

Informa a tu equipo sobre los limites del plan para que todos sepan cuantos recursos pueden crear. Esto evita sorpresas al alcanzar los limites.

### Supervision de actividad

Como propietario o administrador, revisa periodicamente el historial de actividad del equipo para mantener el control sobre los cambios realizados.

### Tips de flujo de trabajo:

- Invita primero a los colaboradores mas activos para que comiencen a trabajar rapidamente
- Usa el rol de Editor para abogados que trabajan activamente en causas
- Reserva el rol de Administrador para socios o personas de confianza
- Los pasantes o consultores externos funcionan bien como Visores
- Si un miembro cambia de responsabilidades, actualiza su rol en lugar de removerlo y reinvitarlo
- Antes de eliminar el equipo, asegurate de que ningun miembro necesite acceso a los recursos

> **📢 Nota Final**: El sistema de equipos esta en constante mejora. En el futuro se habilitara la posibilidad de pertenecer a multiples equipos simultaneamente. Ante cualquier duda o sugerencia, contactanos en soporte@lawanalytics.app.

---

## Resumen de Caracteristicas Clave

| Caracteristica             | Descripcion                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Creacion de equipos**    | Disponible para planes Standard y Premium                       |
| **Roles diferenciados**    | Propietario, Administrador, Editor y Visor                      |
| **Invitaciones por email** | Con link valido por 7 dias                                      |
| **Pool compartido**        | Todos los recursos comparten los limites del propietario        |
| **Migracion de recursos**  | Los miembros con recursos existentes pueden migrarlos al equipo |
| **Historial de actividad** | Registro detallado de todas las acciones del equipo             |
| **Proteccion de plan**     | Bloqueo de downgrades incompatibles con equipos activos         |
| **Un equipo por usuario**  | Restriccion actual para simplicidad y claridad                  |

---

## Metadatos para Uso Posterior

### Tags

- equipos
- teams
- colaboracion
- roles
- permisos
- invitaciones
- miembros
- migracion
- propietario
- administrador
- editor
- visor

### Categoria

Colaboracion y Equipos

### Nivel de Usuario

Principiante - Intermedio

### Tiempo Estimado

15-20 minutos para dominar la herramienta

### Prerrequisitos

- Cuenta activa en Law Analytics
- Plan Standard o Premium (para crear equipos)

### Formatos de Salida Posibles

- Tutorial interactivo web
- Video tutorial con casos de uso
- Diagrama de flujo de trabajo
- Manual de mejores practicas
- Tour guiado in-app
- Webinar de capacitacion
