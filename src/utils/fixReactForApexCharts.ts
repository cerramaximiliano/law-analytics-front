// Fix para react-apexcharts en producción
// Este archivo debe importarse ANTES de cualquier componente que use ApexCharts

import React from "react";

// react-apexcharts busca React en window en algunos casos
if (typeof window !== "undefined") {
	// Asegurar que React esté disponible globalmente
	(window as any).React = React;
	
	// También asegurar que React.forwardRef esté disponible
	if (React.forwardRef && !(window as any).React.forwardRef) {
		(window as any).React.forwardRef = React.forwardRef;
	}
	
	// Otros métodos de React que podrían necesitarse
	const methods = ['createElement', 'Component', 'PureComponent', 'memo', 'forwardRef', 'lazy', 'Suspense'];
	methods.forEach(method => {
		if ((React as any)[method] && !(window as any).React[method]) {
			(window as any).React[method] = (React as any)[method];
		}
	});
}

export default React;