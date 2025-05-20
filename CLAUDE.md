# CLAUDE.md - Law Analytics Front-end Guide

## Commands

- `npm run start` - Start development server
- `npm run build` - Build for production
- `npm run build-stage` - Build for staging using .env.qa
- `npm run test` - Run tests
- `npm run lint` - Run ESLint to check for issues
- `npm run format` - Format code with Prettier

## Code Style Guidelines

- **TypeScript**: Use strict typing and interfaces
- **Imports**: Order imports logically, avoid deep MUI imports (`@mui/*/*/*`)
- **Formatting**:
  - Use tabs for indentation
  - 140 characters print width
  - Double quotes, not single quotes
  - Trailing commas
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use try/catch for API calls and async operations
- **Components**: Follow React functional component patterns with hooks
- **State Management**: Use Redux for global state, React context for theme/auth
- **Styling**: Use MUI theming system and styled components
- **Icons**: Use iconsax

Use VS Code with auto-formatting on save for consistent code style.
