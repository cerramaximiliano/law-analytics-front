import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Hook para prefetch inteligente de rutas
export const usePrefetch = () => {
	const location = useLocation();

	useEffect(() => {
		// Prefetch rutas basado en la ubicación actual
		const prefetchRoutes = async () => {
			// En dashboard, precargar calculadoras
			if (location.pathname.includes("/dashboard")) {
				import("pages/calculator/labor/index");
				import("pages/calculator/civil/index");
			}

			// En folders, precargar detalles
			if (location.pathname.includes("/folders")) {
				import("pages/apps/folders/details/details");
			}

			// Precargar componentes pesados con baja prioridad
			if ("requestIdleCallback" in window) {
				requestIdleCallback(() => {
					import("@fullcalendar/react");
					import("react-apexcharts");
				});
			}
		};

		prefetchRoutes();
	}, [location]);
};

// Prefetch en hover
export const prefetchOnHover = (importFunc: () => Promise<any>) => {
	return {
		onMouseEnter: () => {
			importFunc();
		},
		onTouchStart: () => {
			importFunc();
		},
	};
};
