# Propuesta de Mejoras de Interfaz - Detalles de Carpeta

## Análisis de la Situación Actual

### Redundancia Visual

El nombre de la carpeta aparece múltiples veces:

1. En el breadcrumb (nivel superior de navegación)
2. Como título del MainCard principal
3. Dentro del componente FolderDataCompact
4. En el componente InfoTabsVertical

### Problemas Identificados

- **Desperdicio de espacio vertical**: El título del MainCard ocupa ~56px adicionales
- **Información redundante**: El usuario ya ve el nombre en el breadcrumb
- **Jerarquía visual confusa**: Múltiples niveles de tabs (principales y verticales)

## Recomendaciones

### 1. Eliminar el Título del MainCard

```tsx
// ANTES
<MainCard
  title={formatFolderName(folder.folderName)}
  secondary={renderJudicialLink}
>

// DESPUÉS
<MainCard
  content={false}
  sx={{ "& .MuiCardContent-root": { p: 0 } }}
>
```

### 2. Reposicionar el Botón "Vincular con Poder Judicial"

#### Opción A: Integrado con NavigationControls

```tsx
// En la barra superior, junto a los controles de navegación
<Box sx={{ position: "absolute", top: -60, right: 0 }}>
	<Stack direction="row" spacing={1}>
		{renderJudicialLink}
		<NavigationControls currentFolderId={id} inline />
	</Stack>
</Box>
```

#### Opción B: Dentro del Primer Tab (Recomendada)

```tsx
// Como acción flotante en la esquina superior derecha del contenido
<Box sx={{ position: "relative" }}>
	<Box sx={{ position: "absolute", top: 12, right: 16, zIndex: 10 }}>{renderJudicialLink}</Box>
	<Tabs>...</Tabs>
</Box>
```

#### Opción C: En el Header del InfoTabsVertical

Integrar el botón dentro del componente InfoTabsVertical, en su header junto al título "Información General"

### 3. Optimización del Espacio

Con estos cambios:

- **Ganancia de espacio**: ~56px verticales
- **Mejor jerarquía**: Reducción de niveles visuales redundantes
- **Interfaz más limpia**: Menos repetición de información

### 4. Mejoras Adicionales Sugeridas

1. **Unificar padding de tabs**:

   ```tsx
   sx={{ px: 2, pt: 2 }} // para mantener consistencia
   ```

2. **Indicador visual del estado de vinculación**:

   - Si está vinculado: mostrar un pequeño badge/chip en los tabs
   - Si no está vinculado: mantener el botón accesible pero menos prominente

3. **Responsive design**:
   - En móviles, considerar mover el botón a un menú de acciones
   - Adaptar los tabs verticales a tabs horizontales en pantallas pequeñas

## Implementación Propuesta

La implementación más equilibrada sería:

1. Eliminar el título del MainCard
2. Posicionar el botón de vinculación como elemento flotante dentro del contenido
3. Ajustar los paddings para aprovechar el espacio ganado

Esto mantendría la funcionalidad accesible sin crear redundancia visual y optimizaría el uso del espacio vertical disponible.
