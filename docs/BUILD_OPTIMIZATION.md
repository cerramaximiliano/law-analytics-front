# Build Optimization Guide

## Available Build Scripts

### Development
```bash
npm run dev          # Start development server
npm run start        # Alias for dev
```

### Production Builds

#### Standard Build (with TypeScript checking)
```bash
npm run build        # TypeScript check + Vite build
```
- Runs TypeScript compiler with optimized tsconfig.build.json
- Then builds with Vite
- **Build time**: ~2-3 minutes

#### Fast Build (no TypeScript checking)
```bash
npm run build:fast   # Vite build only
```
- Skips TypeScript checking
- Fastest build option
- **Build time**: ~30-60 seconds
- ⚠️ Use only when you're confident there are no type errors

#### Optimized Production Build
```bash
npm run build:prod   # Full optimization with image compression
```
- Enables image optimization with vite-plugin-imagemin
- Produces smallest bundle size
- **Build time**: ~3-5 minutes
- Use for final production deployments

#### Staging Build
```bash
npm run build-stage  # Build with .env.qa configuration
```
- Uses staging environment variables
- No TypeScript checking for faster builds

#### Build Analysis
```bash
npm run build:analyze # Build and analyze bundle size
```
- Creates visualization of bundle chunks
- Helps identify large dependencies

### Type Checking
```bash
npm run type-check        # Check types without building
npm run type-check:watch  # Watch mode for type checking
```

## Build Performance Tips

### 1. Vite Configuration Optimizations

The `vite.config.ts` has been optimized with:

- **Conditional Image Optimization**: Only runs in production when `VITE_OPTIMIZE_IMAGES=true`
- **Smart Chunk Splitting**: Intelligent manual chunks based on package imports
- **No Sourcemaps in Production**: Faster builds and smaller bundles
- **Terser Minification**: Removes console.log and debugger statements in production

### 2. TypeScript Optimizations

Created `tsconfig.build.json` with:
- `skipLibCheck: true` - Skip checking .d.ts files
- `incremental: true` - Use incremental compilation
- Excludes test files and unnecessary directories
- Uses ES2020 target for better performance

### 3. When to Use Each Build

| Scenario | Command | Build Time | Use Case |
|----------|---------|------------|----------|
| Local development | `npm run dev` | Instant | Development with HMR |
| Quick deployment test | `npm run build:fast` | 30-60s | Testing deployment quickly |
| CI/CD pipeline | `npm run build` | 2-3min | Automated deployments with type safety |
| Final production | `npm run build:prod` | 3-5min | Production with all optimizations |

### 4. Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Disable image optimization for faster builds
VITE_OPTIMIZE_IMAGES=false

# Enable for production builds
# VITE_OPTIMIZE_IMAGES=true
```

### 5. Troubleshooting Slow Builds

If builds are still slow:

1. **Check Node.js version**: Use Node.js 20+ for best performance
2. **Clear cache**: `rm -rf node_modules/.cache`
3. **Update dependencies**: `npm update`
4. **Exclude large libraries**: Add to `optimizeDeps.exclude` in vite.config.ts
5. **Use SSD storage**: Build performance is I/O intensive

### 6. CI/CD Recommendations

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Type Check
  run: npm run type-check
  
- name: Build
  run: npm run build:fast
  
# Or in parallel
- name: Build and Type Check
  run: |
    npm run type-check &
    npm run build:fast &
    wait
```

### 7. Monitoring Build Performance

To monitor and improve build performance:

1. Run `npm run build:analyze` to see bundle composition
2. Look for large dependencies that could be lazy-loaded
3. Consider code splitting for routes
4. Use dynamic imports for heavy components

## Bundle Size Optimization

Current optimizations in place:

1. **Manual Chunks**: Splits vendor code into logical chunks
   - react-vendor: React core libraries
   - mui: Material-UI components
   - charts: ApexCharts and Recharts
   - pdf: PDF renderer (lazy loaded)
   
2. **Tree Shaking**: Vite automatically removes unused code

3. **Dynamic Imports**: Heavy components are loaded on demand

4. **Compression**: Enable gzip/brotli in your web server (nginx/apache)

## Next Steps for Further Optimization

If build times are still an issue:

1. Consider using **esbuild** instead of TypeScript for type checking
2. Implement **Turborepo** or **Nx** for build caching
3. Use **SWC** for TypeScript compilation
4. Split the application into micro-frontends