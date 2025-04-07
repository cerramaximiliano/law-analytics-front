# Law Analytics Front-end

Aplicación front-end para Law Analytics, construida con React, TypeScript y Material-UI.

## 🚀 Comandos disponibles

```bash
# Iniciar servidor de desarrollo
npm run start

# Generar build para producción
npm run build

# Generar build para staging
npm run build-stage

# Ejecutar tests
npm run test

# Ejecutar ESLint
npm run lint

# Formatear código con Prettier
npm run format
```

## 📁 Estructura del proyecto

```
├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   ├── favicon.svg
│   └── index.html
├── README.md
├── src
│   ├── App.tsx
│   ├── assets
│   ├── components
│   ├── config.ts
│   ├── contexts
│   ├── data
│   ├── hooks
│   ├── index.tsx
│   ├── layout
│   ├── menu-items
│   ├── pages
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   ├── routes
│   ├── sections
│   ├── setupTests.ts
│   ├── store
│   ├── themes
│   ├── types
│   └── utils
├── tsconfig.json
└── yarn.lock
```

## 💻 Guías de estilo de código

- **TypeScript**: Usar tipado estricto e interfaces
- **Imports**: Ordenar imports lógicamente, evitar imports profundos de MUI (`@mui/*/*/*`)
- **Formateo**:
  - Usar tabs para indentación
  - Ancho de línea de 140 caracteres
  - Comillas dobles, no simples
  - Comas finales
- **Nombrado**: Usar camelCase para variables/funciones, PascalCase para componentes/clases
- **Manejo de errores**: Usar try/catch para llamadas a API y operaciones asíncronas
- **Componentes**: Seguir patrones de componentes funcionales de React con hooks
- **Gestión de estado**: Usar Redux para estado global, React context para tema/auth
- **Estilos**: Usar sistema de temas de MUI y styled components

## 💡 Recomendación para Visual Studio Code

Activar el formateo automático al guardar agregando estas configuraciones en el archivo `.vscode/settings.json`:

```json
{
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

Esto garantiza que cada vez que se guarde un archivo, se aplique el formato automáticamente según la configuración de Prettier.
