# Editor de Documentos — Guía de Variables y Bloques

## Índice
1. [Cómo funciona el sistema](#cómo-funciona-el-sistema)
2. [Variables individuales](#variables-individuales)
3. [Bloques de texto](#bloques-de-texto)
4. [Encabezado judicial — lógica completa](#encabezado-judicial--lógica-completa)
5. [Datos del contacto que afectan los bloques](#datos-del-contacto-que-afectan-los-bloques)
6. [Datos del expediente que afectan los bloques](#datos-del-expediente-que-afectan-los-bloques)
7. [Datos del letrado (usuario)](#datos-del-letrado-usuario)
8. [Ejemplos de salida](#ejemplos-de-salida)
9. [Casos sin cobertura y pendientes](#casos-sin-cobertura-y-pendientes)

---

## Cómo funciona el sistema

El editor permite insertar **variables dinámicas** en el texto de un documento legal. Al hacer clic en "Resolver campos" en el tab "Datos", el sistema reemplaza cada variable con el valor correspondiente tomado de:

- El **expediente** seleccionado
- El contacto **Actor** seleccionado
- El contacto **Demandado** seleccionado
- El **cálculo** seleccionado (si aplica)
- El **movimiento** seleccionado (si aplica)
- Los datos del **letrado** (el usuario autenticado)

Todos los segmentos son **condicionales**: si un dato no existe, el segmento se omite sin dejar texto vacío ni comas colgantes.

---

## Variables individuales

### 📁 Expediente

| Variable | Descripción | Fuente |
|---|---|---|
| `expediente.numero` | Número de expediente judicial | `judFolder.numberJudFolder` |
| `expediente.caratula` | Carátula del expediente | `folderName` |
| `expediente.juzgado` | Número de juzgado | `judFolder.courtNumber` |
| `expediente.secretaria` | Número de secretaría | `judFolder.secretaryNumber` |
| `expediente.fuero` | Fuero / estado | `judFolder.statusJudFolder` |
| `expediente.jurisdiccion` | Jurisdicción | `judFolder.jurisdiccion` |

---

### 👤 Actor

| Variable | Descripción | Notas |
|---|---|---|
| `actor.nombre_completo` | Nombre completo o razón social | Humana: nombre + apellido. Jurídica: company |
| `actor.nombre` | Nombre de pila | Solo persona humana |
| `actor.apellido` | Apellido | Solo persona humana |
| `actor.razon_social` | Razón social | Solo persona jurídica |
| `actor.dni` | DNI | Campo `document` del contacto |
| `actor.cuit` | CUIT/CUIL | Campo `cuit` del contacto |
| `actor.domicilio` | Domicilio completo | Combina `address + city + state`. Si solo hay `address`, se usa solo eso |
| `actor.email` | Email | Campo `email` del contacto |
| `actor.telefono` | Teléfono | Campo `phone` del contacto |

---

### ⚖️ Demandado

Mismas variables que Actor, con prefijo `demandado.*`. Incluye además:

| Variable | Descripción |
|---|---|
| `demandado.representante` | Representante legal (si existe `company` en persona humana) |

---

### 🏛️ Letrado

Los datos del letrado se toman del **usuario autenticado**, no de un contacto.

| Variable | Descripción | Fuente en el usuario |
|---|---|---|
| `letrado.nombre_completo` | Nombre y apellido del letrado | `firstName + lastName` |
| `letrado.matricula` | Matrícula (ej: "Tº 109 Fº 47 CPACF") | `skill.registrationNumber` |
| `letrado.colegio` | Colegio de abogados | `skill.name` |
| `letrado.domicilio_constituido` | Domicilio constituido | `user.address` |
| `letrado.email` | Email del letrado | `user.email` |

> **Nota sobre matrícula:** Si el usuario tiene más de una matrícula (skills), se puede seleccionar cuál usar en el selector "Matrícula" del tab Datos. Si tiene solo una, se usa automáticamente.

---

### 📅 Fechas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `fecha.hoy` | Fecha actual en formato corto | `20/03/2026` |
| `fecha.hoy_largo` | Fecha actual en formato largo | `20 de marzo de 2026` |

Estas variables **siempre se resuelven** sin necesidad de seleccionar ningún dato adicional.

---

### 🔢 Cálculo

Requiere seleccionar un cálculo vinculado al expediente.

| Variable | Descripción |
|---|---|
| `calculo.monto_total` | Monto total (formato $AR) |
| `calculo.capital` | Capital |
| `calculo.interes` | Intereses |
| `calculo.descripcion` | Descripción del cálculo |
| `calculo.fecha` | Fecha del cálculo |
| `calculo.tipo` | Tipo (ej: "laboral — despido") |
| `calculo.fecha_inicio_relacion` | Inicio de relación laboral (solo laboral) |
| `calculo.fecha_fin_relacion` | Fin de relación laboral (solo laboral) |
| `calculo.fecha_inicio_intereses` | Fecha inicio de intereses |
| `calculo.fecha_fin_intereses` | Fecha fin de intereses |
| `calculo.tasa` | Tasa de interés aplicada |

---

### 📋 Movimiento

Requiere seleccionar un movimiento del expediente.

| Variable | Descripción |
|---|---|
| `movimiento.fecha` | Fecha del movimiento |
| `movimiento.tipo` | Tipo de movimiento |
| `movimiento.titulo` | Título del movimiento |
| `movimiento.descripcion` | Descripción del movimiento |

---

## Bloques de texto

Los bloques generan **texto completo** a partir de múltiples datos. Se insertan como un único campo y se resuelven en un párrafo.

### 📦 Actor completo (`bloque.actor_completo`)

Genera: `Nombre, DNI xxx, CUIT/CUIL yyy, con domicilio en zzz`

**Reglas:**
- Si es **persona jurídica**: usa razón social, omite el segmento DNI
- Si es **persona humana**: usa nombre + apellido, incluye DNI si está cargado
- CUIT/CUIL se incluye solo si está cargado
- "con domicilio en..." se incluye solo si hay al menos `address` cargado

**Ejemplos:**
```
Juan Pérez, DNI 30.123.456, CUIT/CUIL 20-30123456-7, con domicilio en Av. Corrientes 1234, CABA
Juan Pérez, DNI 30.123.456
Pérez Servicios S.A., CUIT/CUIL 30-71234567-9, con domicilio en Av. Córdoba 800, CABA
GFR S.A.
```

---

### 📦 Demandado completo (`bloque.demandado_completo`)

Misma lógica que Actor completo, usando los datos del contacto Demandado.

---

### 📦 Encabezado judicial (`bloque.encabezado_judicial`)

El bloque más complejo. El texto generado varía según el **rol del letrado en el expediente**. Ver sección completa a continuación.

---

## Encabezado judicial — lógica completa

### Determinación del rol

El sistema detecta automáticamente qué tipo de encabezado generar en base a dos fuentes, en orden de prioridad:

**1. Campo `tipoRepresentacion` del contacto** *(prioridad alta)*
Si el contacto Actor o Demandado fue creado con "¿Lo/la representás? → Sí" y se eligió Patrocinante o Apoderado, ese valor se usa directamente.

**2. Campo `parte` del expediente** *(fallback)*
Si el contacto no tiene `tipoRepresentacion` configurado, se infiere por el tipo de contacto:
- Persona **humana** → Patrocinante
- Persona **jurídica** → Apoderado

---

### Tabla de casos según `parte` del expediente

| `parte` del expediente | Contacto usado | Tipo de encabezado |
|---|---|---|
| Actor | Actor | Según `tipoRepresentacion` del contacto |
| Requirente | Actor | Según `tipoRepresentacion` del contacto |
| Acreedor | Actor | Según `tipoRepresentacion` del contacto |
| Denunciante | Actor | Según `tipoRepresentacion` del contacto |
| Querellante | Actor | Según `tipoRepresentacion` del contacto |
| Incidentista | Actor | Según `tipoRepresentacion` del contacto |
| Heredero/os | Actor | Según `tipoRepresentacion` del contacto |
| Part. Damnificado | Actor | Según `tipoRepresentacion` del contacto |
| Beneficiario | Actor | Según `tipoRepresentacion` del contacto |
| Demandado | Demandado | Según `tipoRepresentacion` del contacto |
| Requerido | Demandado | Según `tipoRepresentacion` del contacto |
| Deudor | Demandado | Según `tipoRepresentacion` del contacto |
| Denunciado | Demandado | Según `tipoRepresentacion` del contacto |
| Imputado | Demandado | Según `tipoRepresentacion` del contacto |
| Pres. Fallido | Demandado | Según `tipoRepresentacion` del contacto |
| **Derecho Propio** | *(ninguno)* | Encabezado derecho propio |
| Concursado | Actor* | Solo si el contacto tiene `representado: true` |
| Síndico | Actor* | Solo si el contacto tiene `representado: true` |

> *Para Concursado y Síndico: cargar el contacto en el selector Actor con categoría "Concursado" o "Síndico" y marcar "¿Lo/la representás? → Sí" en la creación del contacto.

---

### Caso 1 — Patrocinante de persona física

**Condición:** `tipoRepresentacion = "Patrocinante"` (o fallback: contacto de tipo Humana)

**Formato:**
```
Sr. Juez:
    NOMBRE DEL CLIENTE, DNI xxx, por derecho propio, con domicilio real en [domicilio cliente],
    constituyendo domicilio residual en [domicilio letrado], y procesal en IEJ [iej letrado],
    conjuntamente con mi letrado patrocinante Dr. [nombre letrado], inscripto al [matrícula],
    condición tributaria [tributario] CUIT [cuit letrado], respetuosamente decimos:
```

**Segmentos condicionales:** DNI (si existe), domicilio real (si existe), domicilio residual (si existe), IEJ (si existe), matrícula (si existe), condición tributaria+CUIT (si ambos existen).

**Ejemplo completo:**
```
Sr. Juez:
    PEDRO OMAR AGUIRRI, DNI 14.406.875, por derecho propio, con domicilio real en Valldargent 21 3ro., Palma de Mallorca, constituyendo domicilio residual en Av. Callao 1103, CABA, y procesal en IEJ 20305969207, conjuntamente con mi letrado patrocinante Dr. Maximiliano Cerra, inscripto al Tº 109 Fº 47 CPACF, condición tributaria Monotributista CUIT 20-30596920-7, respetuosamente decimos:
```

---

### Caso 1b — Patrocinante de persona jurídica

**Condición:** `tipoRepresentacion = "Patrocinante"` + contacto de tipo Jurídica

**Formato:**
```
Sr. Juez:
    RAZÓN SOCIAL, CUIT xxx, representada en este acto por [nombre representante], DNI [dni representante],
    por derecho propio, con domicilio real en [domicilio empresa],
    constituyendo domicilio residual en [domicilio letrado], y procesal en IEJ [iej letrado],
    conjuntamente con mi letrado patrocinante Dr. [nombre letrado], inscripto al [matrícula],
    condición tributaria [tributario] CUIT [cuit letrado], respetuosamente decimos:
```

**Segmentos condicionales:** CUIT empresa (si existe), "representada en este acto por" (solo si se cargó el representante en el contacto), DNI representante (si existe), domicilio real (si existe), domicilio residual (si existe), IEJ (si existe), matrícula (si existe), tributario+CUIT letrado (si ambos existen).

**Datos requeridos en el contacto:** cargar el campo "Representante legal" (nombre) y opcionalmente "DNI del representante" al crear/editar el contacto jurídico.

---

### Caso 2 — Apoderado de persona jurídica o física

**Condición:** `tipoRepresentacion = "Apoderado"` (o fallback: contacto de tipo Jurídica)

**Formato:**
```
Señor Juez:
    Dr. NOMBRE LETRADO, abogado apoderado de [nombre cliente], CUIT [cuit cliente],
    [matrícula letrado], CUIT [cuit letrado], [tributario letrado],
    constituyendo domicilio legal en [domicilio letrado], IEJ [iej letrado],
    (Tel: [tel]; e-mail: [email]), en los autos caratulados: "[carátula]",
    (Expte N° [número]), a V.S. respetuosamente me presento y digo:
```

**Ejemplo completo:**
```
Señor Juez:
    Dr. MAXIMILIANO CERRA, abogado apoderado de VIVIENDAS DEL FUTURO S.A., CUIT 30-71410802-2, Tº 109 Fº 47 CPACF, CUIT 20-30596920-7, Monotributista, constituyendo domicilio legal en Av. Callao 1103, Piso 2D, CABA, IEJ 20305969207, (Tel: 4375-5002; e-mail: cerra@estudio.com), en los autos caratulados: "CASTRO c/ VIVIENDAS DEL FUTURO S.A. s/DESPIDO", (Expte N° 042152/2025), a V.S. respetuosamente me presento y digo:
```

---

### Caso 3 — Derecho propio

**Condición:** `parte` del expediente = `"Derecho Propio"`

El letrado actúa en causa propia (ej: ejecución de honorarios). No se usa ningún contacto.

**Formato:**
```
Sr. Juez:
    Dr. [nombre letrado], por derecho propio, CUIT [cuit letrado], inscripto al [matrícula],
    constituyendo domicilio en [domicilio letrado], IEJ [iej letrado], (Tel/email),
    en los autos caratulados: "[carátula]", (Expte N° [número]),
    a V.S. respetuosamente me presento y digo:
```

---

## Datos del contacto que afectan los bloques

Al crear o editar un contacto, los siguientes campos impactan directamente en los bloques:

| Campo del contacto | Impacto |
|---|---|
| **Tipo** (Humana / Jurídica) | Define si se usa nombre+apellido o razón social. En Jurídica se omite el DNI |
| **Nombre / Apellido** | `actor.nombre_completo` en personas humanas |
| **Razón social** (company) | `actor.nombre_completo` en personas jurídicas |
| **DNI** (document) | `actor.dni` y aparece en bloque actor completo (solo Humana) |
| **CUIT/CUIL** | `actor.cuit` y aparece en bloques |
| **Domicilio** (address + city + state) | `actor.domicilio` y aparece en bloques |
| **¿Lo/la representás?** (representado) | Activa la detección explícita de tipo de encabezado |
| **¿En carácter de?** (tipoRepresentacion) | `Patrocinante` → encabezado caso 1 · `Apoderado` → encabezado caso 2 |

---

## Datos del expediente que afectan los bloques

| Campo del expediente | Impacto |
|---|---|
| **Parte** (orderStatus) | Define qué contacto se usa como cliente en el encabezado y qué tipo de encabezado |
| **Carátula** (folderName) | `expediente.caratula` y aparece en encabezado judicial |
| **Número de expediente** | `expediente.numero` y aparece en encabezado judicial |
| **Juzgado, secretaría, fuero** | Variables individuales del expediente |

---

## Datos del letrado (usuario)

Los siguientes campos del perfil del usuario se usan en los bloques. Si están vacíos, los segmentos correspondientes se omiten.

| Campo | Variable / uso |
|---|---|
| Nombre y apellido | `letrado.nombre_completo` |
| Email | `letrado.email` y aparece en encabezado apoderado |
| Domicilio (address) | `letrado.domicilio_constituido` y aparece en encabezados |
| CUIT (user.cuit) | Aparece en encabezados caso 1 y 2 |
| IEJ (user.iej) | Aparece en encabezados caso 1 y 2 |
| Condición tributaria (user.tributario) | Aparece en encabezados (ej: "Monotributista") |
| Teléfono (user.phone) | Aparece en encabezado apoderado entre paréntesis |
| Matrícula (skill.registrationNumber) | `letrado.matricula` y aparece en encabezados |
| Colegio (skill.name) | `letrado.colegio` |

---

## Ejemplos de salida

### Bloque actor — persona física con todos los datos
```
Juan Pérez, DNI 30.123.456, CUIT/CUIL 20-30123456-7, con domicilio en Av. Corrientes 1234, CABA
```

### Bloque actor — persona física sin CUIT ni domicilio
```
Juan Pérez, DNI 30.123.456
```

### Bloque actor — persona jurídica completa
```
Pérez Servicios S.A., CUIT/CUIL 30-71234567-9, con domicilio en Av. Córdoba 800, CABA
```

### Encabezado patrocinio — persona física
```
Sr. Juez:
    GLESY ALEXANDRA RAMIREZ ROMERO, por derecho propio, conjuntamente con mi letrado patrocinante Dr. Maximiliano Cerra, inscripto al Tº 109 Fº 47 CPACF, respetuosamente decimos:
```
*(sin DNI ni domicilio porque el contacto no los tiene cargados)*

### Encabezado apoderado — persona jurídica
```
Señor Juez:
    Dr. MAXIMILIANO CERRA, abogado apoderado de GFR S.A., Tº 109 Fº 47 CPACF, en los autos caratulados: "RAMIREZ ROMERO c/ GFR S.A. s/DESPIDO", (Expte N° 051860/2021), a V.S. respetuosamente me presento y digo:
```

### Encabezado derecho propio
```
Sr. Juez:
    Dr. Maximiliano Cerra, por derecho propio, CUIT 20-30596920-7, inscripto al Tº 109 Fº 47 CPACF, constituyendo domicilio en Av. Callao 1103, CABA, IEJ 20305969207, en los autos caratulados: "CERRA c/ CLIENTE s/HONORARIOS", (Expte N° 012345/2025), a V.S. respetuosamente me presento y digo:
```

---

## Casos sin cobertura y pendientes

| Caso | Estado | Nota |
|---|---|---|
| Patrocinio de persona jurídica (se patrocina al representante legal) | ✅ Soportado | Cargar Nombre y DNI del representante en el formulario del contacto |
| Concursado / Síndico sin `representado: true` en el contacto | ⚠️ Sin encabezado | Cargar el contacto con "¿Lo/la representás? → Sí" para activar |
| Múltiples letrados en un mismo escrito | ❌ No soportado | — |
| Reconvención (demandado actúa como actor) | ❌ No soportado | — |

---

*Documento generado automáticamente — actualizar ante cambios en el editor o el modelo de resolución.*
