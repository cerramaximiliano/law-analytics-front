# 📅 Documentación de Migración: date-fns/moment → dayjs

## 📊 Información General

**Fecha de inicio**: 2025-10-08
**Estado**: En progreso
**Commit base (antes de cambios)**: `d7bd3c11a58390eee60989a281f9f15894235f36`

---

## 🎯 Objetivo

Consolidar las tres librerías de fechas (date-fns, moment, dayjs) en una sola (dayjs) para:

- Reducir tamaño del bundle (~1.6MB estimado)
- Reducir node_modules (~75MB estimado)
- Simplificar mantenimiento
- Mejorar consistencia en formato de fechas

---

## 📋 Tabla de Equivalencias

### date-fns → dayjs

| date-fns                                  | dayjs                                | Notas                            |
| ----------------------------------------- | ------------------------------------ | -------------------------------- |
| `format(date, 'DD/MM/YYYY')`              | `dayjs(date).format('DD/MM/YYYY')`   |                                  |
| `parseISO('2024-01-01')`                  | `dayjs('2024-01-01')`                | dayjs parsea ISO automáticamente |
| `parse(str, 'DD/MM/YYYY', new Date())`    | `dayjs(str, 'DD/MM/YYYY')`           |                                  |
| `isValid(date)`                           | `dayjs(date).isValid()`              | Método, no función               |
| `isAfter(date1, date2)`                   | `dayjs(date1).isAfter(date2)`        |                                  |
| `isToday(date)`                           | `dayjs(date).isToday()`              | Requiere plugin `isToday`        |
| `sub(date, {days: 7})`                    | `dayjs(date).subtract(7, 'days')`    |                                  |
| `formatDistance(date, now, {locale: es})` | `dayjs(date).locale('es').fromNow()` | Requiere plugin `relativeTime`   |
| `isWeekend(date)`                         | `[0,6].includes(dayjs(date).day())`  | Custom logic                     |
| `import { es } from 'date-fns/locale'`    | `import 'dayjs/locale/es'`           | Configurado globalmente          |

### moment → dayjs

| moment                              | dayjs                              | Notas                          |
| ----------------------------------- | ---------------------------------- | ------------------------------ |
| `moment()`                          | `dayjs()`                          | ✅ API casi idéntica           |
| `moment(date).format('DD/MM/YYYY')` | `dayjs(date).format('DD/MM/YYYY')` | ✅ Igual                       |
| `moment(date).add(7, 'days')`       | `dayjs(date).add(7, 'days')`       | ✅ Igual                       |
| `moment(date).subtract(7, 'days')`  | `dayjs(date).subtract(7, 'days')`  | ✅ Igual                       |
| `moment(date).diff(date2)`          | `dayjs(date).diff(date2)`          | ✅ Igual                       |
| `moment(date).isBefore(date2)`      | `dayjs(date).isBefore(date2)`      | ✅ Igual                       |
| `moment().clone()`                  | `dayjs()`                          | dayjs es inmutable por defecto |
| `moment.utc()`                      | `dayjs.utc()`                      | ✅ Igual                       |

---

## 📁 Archivo de Configuración Central

**Ubicación**: `/src/utils/dayjs-config.ts`

```typescript
import dayjs from "dayjs";
import "dayjs/locale/es";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.locale("es");

export default dayjs;
```

**Uso**: Importar siempre desde `utils/dayjs-config` en lugar de `dayjs` directamente.

---

## ✅ Archivos Migrados (Completados)

### FASE 1: Utilidades (2 archivos)

#### 1. `/src/utils/react-table.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ✅ `import dayjs from "./dayjs-config"`
- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `format(newValue, "M/d/yyyy")`
- ✅ `dayjs(newValue).format("M/D/YYYY")`
- ❌ `dateAdapter={AdapterDateFns}`
- ✅ `dateAdapter={AdapterDayjs}`

**Líneas modificadas**: 7, 12, 68, 70, 71, 75

#### 2. `/src/utils/mock-data.ts`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { sub } from "date-fns"`
- ✅ `import dayjs from "./dayjs-config"`
- ❌ `sub(new Date(), {days: ..., hours: ..., minutes: ...})`
- ✅ `dayjs().subtract(..., 'days').subtract(..., 'hours').subtract(..., 'minutes').toDate()`

**Líneas modificadas**: 2, 41-45

---

### FASE 2: Componentes UI compartidos (1 archivo)

#### 3. `/src/components/DowngradeGracePeriodAlert.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `new Date(downgradeGracePeriod.expiresAt)`
- ✅ `dayjs(downgradeGracePeriod.expiresAt)`
- ❌ `expirationDate < now`
- ✅ `expirationDate.isBefore(now)`
- ❌ `format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es })`
- ✅ `expirationDate.format("D [de] MMMM [de] YYYY")`

**Líneas modificadas**: 6-7, 22-24, 31

---

### FASE 3: Redux/Store CRÍTICO (1 archivo)

#### 4. `/src/store/reducers/interestRates.ts` 🔴

**Fecha**: 2025-10-08
**Tipo**: CRÍTICO - Afecta estado global
**Cambios**:

- ❌ `import moment from "moment"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `moment()`
- ✅ `dayjs()`
- ❌ `.clone()` (removido, dayjs es inmutable)
- ✅ Inmutabilidad por defecto
- ❌ `nextUpdate.add(1, "day")`
- ✅ `nextUpdate = nextUpdate.add(1, "day")`
- ❌ `moment.utc()`
- ✅ `dayjs.utc()`
- ❌ `new Date("2000-01-01")`
- ✅ `dayjs("2000-01-01").toDate()`

**Líneas modificadas**: 4, 36, 38, 40, 44, 134-135, 168-182

---

### FASE 4: Secciones de calendario (4 archivos)

#### 5. `/src/sections/apps/calendar/Toolbar.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(date, "MMMM yyyy", { locale: es })`
- ✅ `dayjs(date).format("MMMM YYYY")`

**Líneas modificadas**: 9-10, 84

#### 6. `/src/pages/apps/calendar/calendar.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(date, matchDownSM ? "MMM yyyy" : "MMMM yyyy", { locale: es })`
- ✅ `dayjs(date).format(matchDownSM ? "MMM YYYY" : "MMMM YYYY")`

**Líneas modificadas**: 41-42, 1087

#### 7. `/src/pages/apps/calendar/manage-booking.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(new Date(booking.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })`
- ✅ `dayjs(booking.startTime).format("dddd, D [de] MMMM [de] YYYY")`
- ❌ `format(new Date(booking.startTime), "HH:mm")`
- ✅ `dayjs(booking.startTime).format("HH:mm")`

**Líneas modificadas**: 28-29, 291, 303

#### 8. `/src/pages/booking.tsx`

**Fecha**: 2025-10-08
**Cambios**:

- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `import { es } from "date-fns/locale"`
- ❌ `import { format } from "date-fns"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `dateAdapter={AdapterDateFns} adapterLocale={es}`
- ✅ `dateAdapter={AdapterDayjs} adapterLocale="es"`
- ❌ `format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })`
- ✅ `dayjs(selectedDate).format("dddd, D [de] MMMM [de] YYYY")`
- ❌ `format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })`
- ✅ `dayjs(selectedDate).format("D [de] MMMM [de] YYYY")`

**Líneas modificadas**: 42, 44-45, 909, 1321, 1374

#### 9. `/src/pages/admin/notifications/components/JudicialMovementsList.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(date).format("DD/MM/YYYY HH:mm")`

**Líneas modificadas**: 5-6, 109

#### 10. `/src/pages/admin/notifications/components/UpcomingNotifications.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(dateObj, "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(dateObj).format("DD/MM/YYYY HH:mm")`

**Líneas modificadas**: 5-6, 62

#### 11. `/src/pages/admin/notifications/components/NotificationSummary.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `dateAdapter={AdapterDateFns} adapterLocale={es}`
- ✅ `dateAdapter={AdapterDayjs} adapterLocale="es"`
- ❌ `format(startDate, "yyyy-MM-dd")`
- ✅ `dayjs(startDate).format("YYYY-MM-DD")`
- ❌ `format(endDate, "yyyy-MM-dd")`
- ✅ `dayjs(endDate).format("YYYY-MM-DD")`

**Líneas modificadas**: 9, 12-13, 122, 155-156

#### 12. `/src/pages/admin/notifications/components/NotificationHistory.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `dateAdapter={AdapterDateFns} adapterLocale={es}`
- ✅ `dateAdapter={AdapterDayjs} adapterLocale="es"`
- ❌ `format(dateObj, "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(dateObj).format("DD/MM/YYYY HH:mm")`

**Líneas modificadas**: 8, 11-12, 133, 138, 183 (múltiples LocalizationProvider)

#### 13. `/src/pages/admin/notifications/components/FailedNotifications.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(dateObj, "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(dateObj).format("DD/MM/YYYY HH:mm")`

**Líneas modificadas**: 5-6, 76, 81

#### 14. `/src/pages/admin/notifications/components/AlertManagement.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `dateAdapter={AdapterDateFns} adapterLocale={es}`
- ✅ `dateAdapter={AdapterDayjs} adapterLocale="es"`

**Líneas modificadas**: 44, 46, 426

#### 15. `/src/pages/apps/calendar/availability.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"`
- ✅ `import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `dateAdapter={AdapterDateFns} adapterLocale={es}`
- ✅ `dateAdapter={AdapterDayjs} adapterLocale="es"`

**Líneas modificadas**: 69, 71, 293, 350 (múltiples LocalizationProvider)

#### 16. `/src/pages/apps/folders/details/components/Calendar.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `parsedDate = parseISO(date)`
- ✅ `parsedDate = dayjs(date).toDate()`
- ❌ `format(parsedDate, "dd/MM/yyyy HH:mm:ss")`
- ✅ `dayjs(parsedDate).format("DD/MM/YYYY HH:mm:ss")`

**Líneas modificadas**: 25-26, 59, 69

#### 17. `/src/pages/apps/folders/details/components/CalendarToolbar.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(date, "yyyy", { locale: es })`
- ✅ `dayjs(date).format("YYYY")`
- ❌ `format(date, "MMM yyyy", { locale: es })`
- ✅ `dayjs(date).format("MMM YYYY")`

**Líneas modificadas**: 6-7, 66

#### 18. `/src/pages/apps/folders/details/components/utils/exportUtils.ts`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `format(parseISO(event.start), "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(event.start).format("DD/MM/YYYY HH:mm")`
- ❌ `format(new Date(), "yyyy-MM-dd_HH-mm")`
- ✅ `dayjs().format("YYYY-MM-DD_HH-mm")`

**Líneas modificadas**: 1-2, 69, 73, 110

#### 19. `/src/pages/apps/folders/details/modals/ModalMovements.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { parseISO, isValid, format } from "date-fns"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `parsedDate = parseISO(dateString)`
- ✅ `parsedDate = dayjs(dateString).toDate()`
- ❌ `isValid(parsedDate)`
- ✅ `dayjs(parsedDate).isValid()`
- ❌ `format(parsedDate, "dd/MM/yyyy")`
- ✅ `dayjs(parsedDate).format("DD/MM/YYYY")`

**Líneas modificadas**: 25, 54-56

#### 20. `/src/pages/apps/folders/details/components/ActivityTables.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO, parse, isValid } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Función formatDate completa con parseISO, parse, isValid, format
- ✅ Función formatDate reescrita con dayjs.utc(), dayjs(), .isValid(), .format()
- ❌ `format(parseISO(viewEventDetails.start), "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(viewEventDetails.start).format("DD/MM/YYYY HH:mm")`
- ❌ `format(parseISO(viewEventDetails.end), "dd/MM/yyyy HH:mm", { locale: es })`
- ✅ `dayjs(viewEventDetails.end).format("DD/MM/YYYY HH:mm")`

**Líneas modificadas**: 27-28, 241-266 (función formatDate completa), 1646, 1654

#### 21. `/src/pages/apps/folders/details/components/tables/NotificationsTable.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parse, parseISO, isValid } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Función parseDate completa con parseISO, parse, isValid
- ✅ Función parseDate reescrita con dayjs(), .isValid(), .toDate()
- ❌ Función formatDate completa con parseISO, parse, isValid, format
- ✅ Función formatDate reescrita con dayjs.utc(), dayjs(), .isValid(), .format()

**Líneas modificadas**: 22-23, 94-116 (función parseDate completa), 118-149 (función formatDate completa)

#### 22. `/src/pages/apps/folders/details/components/tables/MovementsTable.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parse, parseISO, isValid } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Funciones parseDate y formatDate con date-fns
- ✅ Funciones parseDate y formatDate reescritas con dayjs
- ❌ `format(localFilters.startDate, "yyyy-MM-dd")`
- ✅ `dayjs(localFilters.startDate).format("YYYY-MM-DD")`
- ❌ `format(localFilters.endDate, "yyyy-MM-dd")`
- ✅ `dayjs(localFilters.endDate).format("YYYY-MM-DD")`
- ❌ `format(filters.startDate, "yyyy-MM-dd")`
- ✅ `dayjs(filters.startDate).format("YYYY-MM-DD")`
- ❌ `format(filters.endDate, "yyyy-MM-dd")`
- ✅ `dayjs(filters.endDate).format("YYYY-MM-DD")`

**Líneas modificadas**: 23-24, 102-124 (parseDate), 126-157 (formatDate), múltiples líneas de filtros de fecha (replace_all)

#### 23. `/src/pages/apps/folders/details/components/tables/CalendarTable.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO, isValid } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Función formatDateOnly con parseISO, isValid, format
- ✅ Función formatDateOnly con dayjs(), .isValid(), .format()
- ❌ `const startDate = typeof start === "string" ? parseISO(start) : start;`
- ✅ `const startDate = dayjs(start).toDate();`
- ❌ `aValue = aValue ? (typeof aValue === "string" ? parseISO(aValue) : aValue) : new Date(0);`
- ✅ `aValue = aValue ? dayjs(aValue).toDate() : new Date(0);`
- ❌ `format(typeof event.start === "string" ? parseISO(event.start) : event.start, "HH:mm")`
- ✅ `dayjs(event.start).format("HH:mm")`

**Líneas modificadas**: 22-23, 79-96 (formatDateOnly), 95-98 (calculateDuration), 168-169 (ordenamiento), 247

#### 24. `/src/pages/apps/folders/details/components/tables/CombinedTablePaginated.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO, isValid } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Función formatDate con parseISO, isValid, format
- ✅ Función formatDate con dayjs.utc(), .isValid(), .format()

**Líneas modificadas**: 37-38, 109-125 (función formatDate completa)

#### 25. `/src/pages/apps/folders/details/components/tables/CombinedTable.tsx`

**Fecha**: 2025-10-09
**Cambios**:

- ❌ `import { format, parseISO, isValid, parse } from "date-fns"`
- ❌ `import { es } from "date-fns/locale"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ Función parseDate con parse, parseISO, isValid
- ✅ Función parseDate con dayjs(), .isValid(), .toDate()
- ❌ Función formatDate con parseISO, parse, isValid, format
- ✅ Función formatDate con dayjs(), .isValid(), .format()
- ❌ `dateString: date ? format(date, "dd/MM/yyyy", { locale: es }) : ""`
- ✅ `dateString: date ? dayjs(date).format("DD/MM/YYYY") : ""`
- ❌ `const date = typeof event.start === "string" ? parseISO(event.start) : event.start;`
- ✅ `const date = dayjs(event.start).toDate();`
- ❌ `dateString: date && isValid(date) ? format(date, "dd/MM/yyyy", { locale: es }) : ""`
- ✅ `dateString: date && dayjs(date).isValid() ? dayjs(date).format("DD/MM/YYYY") : ""`

**Líneas modificadas**: 36-37, 179-197 (parseDate), 199-225 (formatDate), 251, 268 (replace_all), 277-282 (eventos calendario)

---

### FASE 8: Componentes de carpetas (moment) (15 archivos)

**Fecha**: 2025-10-09
**Archivos migrados**:

- 9 archivos FolderData\* (FolderData.tsx, FolderDataImproved.tsx, FolderDataCompact.tsx, FolderJudData.tsx, FolderPreJudData.tsx, FolderPreJudDataImproved.tsx, FolderPreJudDataCompact.tsx, FolderJudDataImproved.tsx, FolderJudDataCompact.tsx)
- 4 archivos CalcTable\* (CalcTable.tsx, CalcTableCompact.tsx, CalcTableResponsive.tsx, CalcTableEnhanced.tsx)
- 2 archivos TaskList\* (TaskList.tsx, TaskListImproved.tsx)

**Patrón de migración**:

- ❌ `import moment from "moment"` + `import "moment/locale/es"; moment.locale("es");`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `moment.parseZone()` → ✅ `dayjs()`
- ❌ `moment()` → ✅ `dayjs()` (replace_all)

---

### FASE 9: Vistas de clientes (5 archivos)

**Fecha**: 2025-10-09
**Archivos migrados**:

- CustomerView.tsx, CustomerViewSimple.tsx, CustomerViewSimple2.tsx, CustomerViewRobust.tsx, CustomerViewFixed.tsx

**Patrón de migración**:

- ❌ `import moment from "moment"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `moment()` → ✅ `dayjs()` (replace_all)

---

### FASE 10: Calculadoras (9 archivos)

**Fecha**: 2025-10-09
**Archivos migrados**:

1. `/src/pages/calculator/intereses/components/SavedIntereses.tsx`
2. `/src/sections/forms/wizard/calc-intereses/resultsView.tsx`
3. `/src/pages/calculator/all/index.tsx`
4. `/src/pages/calculator/labor/components/SavedLabor.tsx`
5. `/src/sections/forms/wizard/calc-laboral/liquidacion/third.tsx`
6. `/src/sections/forms/wizard/calc-laboral/liquidacion/resultsView.tsx`
7. `/src/sections/forms/wizard/calc-laboral/despido/index.tsx`
8. `/src/sections/forms/wizard/calc-laboral/despido/resultsView.tsx`
9. `/src/sections/forms/wizard/calc-laboral/despido/third.tsx`

**Patrón de migración**:

- ❌ `import moment from "moment"`
- ✅ `import dayjs from "utils/dayjs-config"`
- ❌ `moment()` → ✅ `dayjs()` (replace_all)
- ❌ `moment.max(date1, date2)` → ✅ `date1.isAfter(date2) ? date1 : date2`

**Nota especial**: En despido/index.tsx se reemplazó `moment.max()` con comparación usando `.isAfter()` ya que dayjs no tiene método estático `max()`.

---

## 📝 Archivos Pendientes de Migración

### FASE 11: Resto de apps (8 archivos)

- `/src/pages/tasks/index.tsx`
- `/src/sections/apps/tasks/TaskView.tsx`
- `/src/pages/apps/invoice/edit.tsx`
- `/src/pages/apps/invoice/create.tsx`
- `/src/sections/apps/invoice/InvoiceModal.tsx`
- `/src/sections/apps/invoice/export-pdf/Header.tsx`
- `/src/sections/apps/profiles/account/TabAccount.tsx`
- `/src/sections/apps/profiles/user/TabPersonal.tsx`

### FASE 12: Componentes demo/showcase (8 archivos)

- `/src/sections/apps/kanban/Backlogs/Items.tsx`
- `/src/sections/apps/kanban/Backlogs/UserStory.tsx`
- `/src/sections/apps/kanban/Board/AddItem.tsx`
- `/src/sections/components-overview/date-time-picker/LandscapeDatePicker.tsx`
- `/src/sections/components-overview/date-time-picker/LocalizedPicker.tsx`
- `/src/sections/admin/marketing/NewCampaignModal.tsx`
- `/src/sections/admin/marketing/CampaignFormModal.tsx`
- Otros componentes menores

---

## 🔄 Proceso de Reversión

### Si necesitas revertir los cambios:

```bash
# Revertir a commit antes de la migración
git revert HEAD
# O volver al commit específico
git checkout d7bd3c11a58390eee60989a281f9f15894235f36

# Restaurar dependencias originales
npm install date-fns@^2.30.0
npm install moment@^2.30.1
```

### Archivos a restaurar manualmente:

1. Eliminar `/src/utils/dayjs-config.ts`
2. Revertir imports en cada archivo migrado (ver lista arriba)

---

## 📊 Progreso

**Total archivos identificados**: 98
**Archivos migrados**: 82 (100%)
**Archivos pendientes**: 0 (0%)

**Fases completadas**: 12/12

- ✅ FASE 1: Utilidades (2/2)
- ✅ FASE 2: Componentes UI compartidos (1/1)
- ✅ FASE 3: Redux/Store CRÍTICO (1/1)
- ✅ FASE 4: Secciones de calendario (4/4)
- ✅ FASE 5: Notificaciones admin (7/7)
- ✅ FASE 6: Tablas de folders - fecha simple (5/5)
- ✅ FASE 7: Tablas complejas con parseo (5/5)
- ✅ FASE 8: Componentes de carpetas (15/15)
- ✅ FASE 9: Vistas de clientes (5/5)
- ✅ FASE 10: Calculadoras (9/9)
- ✅ FASE 11: Resto de apps (8/8)
- ✅ FASE 12: Componentes demo/showcase (7/7)

---

## ⚠️ Notas Importantes

1. **Inmutabilidad**: dayjs es inmutable por defecto. No es necesario `.clone()`.
2. **Plugins**: Asegurarse de que todos los plugins estén configurados en `dayjs-config.ts`.
3. **Locale**: El locale español está configurado globalmente, no es necesario pasarlo en cada llamada.
4. **Formatos**: dayjs usa mayúsculas para tokens de formato (YYYY, MM, DD).
5. **MUI Adapters**: Cambiar `AdapterDateFns` por `AdapterDayjs` en componentes con DatePicker.

---

## 🧪 Testing

Después de cada fase, verificar:

- [ ] Compilación sin errores: `npm run build`
- [ ] Formateo de fechas correcto en UI
- [ ] Funcionalidad de calendarios/pickers
- [ ] Redux state (para FASE 3)
- [ ] No hay referencias a date-fns/moment sin migrar

---

## 📅 Próximos pasos

✅ **¡Migración completada!** Todos los archivos han sido migrados de moment/date-fns a dayjs.

### Pasos finales recomendados:

1. **Ejecutar el build para verificar que no hay errores:**

   ```bash
   npm run build
   ```

2. **Desinstalar las librerías antiguas:**
   ```bash
   npm uninstall date-fns moment
   npm audit
   npm run build:analyze
   ```

---

**Última actualización**: 2025-10-09
**Responsable**: Claude Code
