# able-pro-material-react-ts

# Estructura del proyecto

├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   ├── favicon.svg
│   └── index.html
├── README.md
├── src
│   ├── App.tsx
│   ├── assets
│   ├── components
│   ├── config.ts
│   ├── contexts
│   ├── data
│   ├── hooks
│   ├── index.tsx
│   ├── layout
│   ├── menu-items
│   ├── pages
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   ├── routes
│   ├── sections
│   ├── setupTests.ts
│   ├── store
│   ├── themes
│   ├── types
│   └── utils
├── tsconfig.json
└── yarn.lock

README.md:

markdown
Copiar
Editar

## 🧹 Formateo y Linting del Código

Este proyecto utiliza **ESLint** junto con **Prettier** para mantener un estilo de código consistente y legible de forma automática.

---

### 📦 Instalación de dependencias necesarias

Si aún no están instaladas, ejecutá el siguiente comando:

```bash
npm install --save-dev eslint prettier eslint-plugin-prettier eslint-config-prettier
También es recomendable instalar otros paquetes relacionados como:

bash
Copiar
Editar
npm install --save-dev eslint-plugin-import eslint-plugin-react eslint-plugin-jsx-a11y @typescript-eslint/eslint-plugin
🔧 Scripts disponibles
En el archivo package.json están definidos los siguientes scripts:

json
Copiar
Editar
"scripts": {
  "lint": "eslint src/ --ext .ts,.tsx",
  "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
}
📌 Descripción de cada script
Comando	Descripción
npm run lint	Ejecuta ESLint y muestra errores y advertencias en los archivos .ts y .tsx.
npm run lint:fix	Ejecuta ESLint y corrige automáticamente los errores de estilo cuando sea posible.
npm run format	Ejecuta Prettier y formatea el código de acuerdo a las reglas definidas.
💡 Recomendación para Visual Studio Code
Activá el formateo automático al guardar archivo agregando estas configuraciones en tu archivo .vscode/settings.json:

json
Copiar
Editar
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
Esto garantiza que cada vez que guardes un archivo, se aplique el formato automáticamente según la configuración de Prettier.

```
