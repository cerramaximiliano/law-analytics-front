// Configuración global para ApexCharts
import React from "react";

// Asegurar que React esté disponible globalmente para ApexCharts
if (typeof window !== "undefined") {
	// @ts-ignore
	window.React = React;
}

// Re-exportar React para uso en componentes
export { React };

// Configuración por defecto para ApexCharts
export const defaultApexOptions = {
	chart: {
		toolbar: {
			show: false,
		},
		animations: {
			enabled: true,
			easing: "easeinout",
			speed: 800,
		},
	},
	grid: {
		borderColor: "#f1f1f1",
	},
};