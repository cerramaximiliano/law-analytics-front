# Guía de SEO para Law Analytics

## Implementación Realizada

### 1. Configuración Base

- **react-helmet-async**: Instalado para gestión dinámica de meta tags
- **SEOProvider**: Wrapper configurado en App.tsx
- **SEO Component**: Componente reutilizable para cada página

### 2. Archivos de Configuración SEO

#### `/src/config/seo.config.ts`

Contiene:

- Configuración SEO por defecto
- Configuraciones específicas por página
- Datos estructurados (JSON-LD)
- Keywords optimizadas por funcionalidad

#### `/src/components/SEO/SEO.tsx`

Componente que gestiona:

- Meta tags básicos (title, description, keywords)
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD)
- Canonical URLs

### 3. Archivos Públicos

- **sitemap.xml**: Mapa del sitio con todas las páginas principales
- **robots.txt**: Configuración para crawlers
- **index.html**: Meta tags por defecto mejorados

### 4. Páginas Optimizadas

#### Landing Page (`/`)

- Title: "Law Analytics - Software Legal Inteligente para Abogados"
- Keywords: software legal, gestión causas, calculadora laboral
- Structured Data: Organization

#### Calculadora Laboral (`/calculator/labor`)

- Title: "Calculadora Laboral Online - Despidos e Indemnizaciones"
- Keywords: calculadora laboral, indemnización despido, Art. 245 LCT
- Structured Data: WebApplication

#### Gestión de Causas (`/apps/folders`)

- Title: "Gestión de Causas Judiciales - Expedientes Digitales"
- Keywords: gestión causas, poder judicial, expedientes digitales
- Structured Data: SoftwareApplication

## Cómo Usar el Sistema SEO

### 1. Agregar SEO a una Nueva Página

```tsx
import SEO from "components/SEO/SEO";

function NuevaPagina() {
	return (
		<>
			<SEO path="/ruta-de-la-pagina" />
			{/* Contenido de la página */}
		</>
	);
}
```

### 2. Configurar SEO para Nueva Ruta

En `/src/config/seo.config.ts`, agregar:

```typescript
"/nueva-ruta": {
  title: "Título optimizado - Law Analytics",
  description: "Descripción de 150-160 caracteres...",
  keywords: ["keyword1", "keyword2", "keyword3"],
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebPage",
    // ... datos estructurados
  }
}
```

### 3. SEO Personalizado por Página

```tsx
<SEO
	title="Título personalizado"
	description="Descripción personalizada"
	keywords={["custom", "keywords"]}
	structuredData={customStructuredData}
/>
```

## Mejores Prácticas

### Títulos

- Máximo 60 caracteres
- Incluir nombre de marca al final
- Palabras clave al principio
- Único para cada página

### Descripciones

- Entre 150-160 caracteres
- Call to action claro
- Incluir keywords principales
- Describir valor único

### Keywords

- 5-10 keywords por página
- Relevantes al contenido
- Incluir variaciones
- Long-tail keywords

### Structured Data

- Usar schema.org apropiado
- Validar con Google's Rich Results Test
- Incluir información completa
- Actualizar regularmente

## Monitoreo y Análisis

### Herramientas Recomendadas

1. Google Search Console
2. Google Analytics
3. PageSpeed Insights
4. Schema Markup Validator

### Métricas Clave

- CTR (Click-through rate)
- Posición promedio
- Impresiones
- Core Web Vitals

## Próximos Pasos

### Optimizaciones Pendientes

1. Implementar páginas AMP
2. Agregar hreflang para multi-idioma
3. Optimizar imágenes con lazy loading
4. Implementar Service Worker para PWA

### Content Marketing

1. Blog con contenido legal
2. Guías y tutoriales
3. Casos de estudio
4. FAQ optimizadas

## Checklist SEO por Página

- [ ] Title tag único y optimizado
- [ ] Meta description atractiva
- [ ] Keywords relevantes
- [ ] URL amigable
- [ ] Structured data apropiado
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] H1 único y descriptivo
- [ ] Alt text en imágenes
- [ ] Internal linking
- [ ] Mobile-friendly
- [ ] Page speed < 3s

## Scripts Útiles

### Generar Sitemap Dinámico

```bash
npm run generate-sitemap
```

### Validar SEO

```bash
npm run seo-check
```

### Analizar Performance

```bash
npm run lighthouse
```

## Recursos

- [Schema.org Legal Services](https://schema.org/LegalService)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

## Mantenimiento

Revisar mensualmente:

- Rankings de keywords
- CTR en Search Console
- Nuevas páginas sin SEO
- Actualizar sitemap.xml
- Verificar 404s
- Actualizar structured data
