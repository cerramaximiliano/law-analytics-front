// Configuración global para ApexCharts
import * as React from "react";

// Asegurar que React esté disponible globalmente para ApexCharts
// Esto es necesario porque react-apexcharts espera React en el scope global
if (typeof window !== "undefined" && !window.React) {
	// @ts-ignore
	window.React = React;
}

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