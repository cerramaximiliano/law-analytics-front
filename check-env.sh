#!/bin/bash

echo "========================================="
echo "🔧 VERIFICACIÓN DE VARIABLES DE ENTORNO"
echo "========================================="
echo ""

# Verificar archivos .env
echo "📁 Archivos de configuración disponibles:"
ls -la .env* 2>/dev/null | grep -v example
echo ""

# Mostrar variables de producción (sin valores sensibles)
if [ -f ".env.production" ]; then
    echo "📋 Variables en .env.production:"
    cat .env.production | sed 's/=.*/=***OCULTO***/' | grep -E "(KEY|SECRET|PASSWORD)" || true
    cat .env.production | grep -v -E "(KEY|SECRET|PASSWORD)" || true
    echo ""
fi

# Verificar en el build actual
if [ -f "build/index.html" ]; then
    echo "🔍 Verificando variables en el build:"
    echo ""
    
    # Buscar referencias a VITE_ en los archivos JS del build
    echo "Variables encontradas en los chunks:"
    grep -h "VITE_" build/assets/*.js 2>/dev/null | grep -o "VITE_[A-Z_]*" | sort | uniq || echo "No se encontraron variables VITE en el build"
    echo ""
    
    # Verificar valores específicos (sin mostrar valores sensibles)
    echo "URLs configuradas en el build:"
    grep -h "https://.*lawanalytics" build/assets/*.js 2>/dev/null | grep -o "https://[^\"']*" | sort | uniq || echo "No se encontraron URLs"
fi

echo ""
echo "💡 Para ver las variables en el navegador:"
echo "   1. Abre la aplicación"
echo "   2. Abre la consola (F12)"
echo "   3. Ejecuta: console.table(Object.entries(import.meta.env).filter(([k]) => k.startsWith('VITE_')))"
echo ""