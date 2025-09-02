// Wrapper component para ApexCharts con React correctamente configurado
import React from "react";
import { Props as ChartProps } from "react-apexcharts";

// Lazy load ApexCharts solo cuando se necesita
const ReactApexChart = React.lazy(() => import("react-apexcharts"));

// Hacer React disponible globalmente antes de cargar ApexCharts
if (typeof window !== "undefined" && !window.React) {
	(window as any).React = React;
}

interface ApexChartProps extends ChartProps {
	loading?: boolean;
}

const ApexChart: React.FC<ApexChartProps> = ({ loading = false, ...props }) => {
	return (
		<React.Suspense
			fallback={
				<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: props.height || 350 }}>
					<span>Cargando gráfico...</span>
				</div>
			}
		>
			<ReactApexChart {...props} />
		</React.Suspense>
	);
};

export default ApexChart;