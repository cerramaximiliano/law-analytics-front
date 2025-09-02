import React, { Suspense, lazy, ComponentType } from "react";
import Loader from "./Loader";

// Helper para lazy loading con mejor UX
export const lazyLoad = <T extends ComponentType<any>>(importFunc: () => Promise<{ default: T }>, fallback = <Loader />) => {
	const LazyComponent = lazy(importFunc);
	return (props: any) => (
		<Suspense fallback={fallback}>
			<LazyComponent {...props} />
		</Suspense>
	);
};

// Para componentes pesados específicos
export const LazyApexChart = lazyLoad(() => import("react-apexcharts"), <div>Cargando gráfico...</div>);

export const LazyPDFViewer = lazyLoad(
	() => import("@react-pdf/renderer").then((module) => ({ default: module.PDFViewer })),
	<div>Cargando PDF...</div>,
);

export const LazyFullCalendar = lazyLoad(() => import("@fullcalendar/react"), <div>Cargando calendario...</div>);
