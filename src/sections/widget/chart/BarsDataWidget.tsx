import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ThemeMode } from "types/config";
import { Box, Typography, Stack } from "@mui/material";
import { ChartSquare } from "iconsax-react";

interface Props {
	color: string;
	height?: number;
	data?: number[];
	noDataMessage?: string; // Mensaje personalizable
	seriesName?: string; // Nombre general para la serie
	labels?: string[]; // Etiquetas individuales para cada valor
}

const BarsDataWidget = ({ color, height, data, noDataMessage, seriesName = "Value", labels }: Props) => {
	const theme = useTheme();
	const mode = theme.palette.mode;

	// Verificar si hay datos
	const hasData = data && data.length > 0;

	// Chart options
	const areaChartOptions: ApexOptions = {
		chart: {
			id: "new-stack-chart",
			type: "bar",
			sparkline: {
				enabled: true,
			},
			toolbar: {
				show: false,
			},
			offsetX: -2,
		},
		dataLabels: {
			enabled: false,
		},
		plotOptions: {
			bar: {
				borderRadius: 2,
				columnWidth: "80%",
			},
		},
		xaxis: {
			crosshairs: {
				width: 1,
			},
			categories: labels || [], // Usar las etiquetas proporcionadas como categorías
		},
		tooltip: {
			fixed: {
				enabled: false,
			},
			x: {
				show: true, // Mostrar la etiqueta X en el tooltip
			},
			y: {
				formatter: function (value) {
					// Formatear valor como entero
					return Math.round(value).toString();
				},
				title: {
					formatter: function () {
						return seriesName + ":";
					},
				},
			},
			// Personalizar el formato del tooltip para mostrar la etiqueta
			custom: labels
				? function ({ series, seriesIndex, dataPointIndex, w }) {
						const value = Math.round(series[seriesIndex][dataPointIndex]);
						const label = labels[dataPointIndex] || "";
						return `<div class="apexcharts-tooltip-title" style="font-family: inherit; font-size: 12px">${label}</div>
                    <div class="apexcharts-tooltip-series-group">
                      <span class="apexcharts-tooltip-marker" style="background-color: ${color}"></span>
                      <div class="apexcharts-tooltip-text" style="font-family: inherit; font-size: 12px">
                        <div class="apexcharts-tooltip-y-group">
                          <span class="apexcharts-tooltip-text-y-label">${seriesName}: </span>
                          <span class="apexcharts-tooltip-text-y-value">${value}</span>
                        </div>
                      </div>
                    </div>`;
				  }
				: undefined,
		},
	};

	const { primary, secondary } = theme.palette.text;
	const line = theme.palette.divider;

	const [options, setOptions] = useState<ApexOptions>(areaChartOptions);

	useEffect(() => {
		setOptions((prevState) => ({
			...prevState,
			colors: [color],
			theme: {
				mode: mode === ThemeMode.DARK ? "dark" : "light",
			},
		}));
	}, [color, mode, primary, secondary, line, theme, labels]);

	const [series] = useState([
		{
			name: seriesName,
			data: data || [], // Usar un array vacío si no hay datos
		},
	]);

	// Si no hay datos, mostrar un mensaje con icono
	if (!hasData) {
		return (
			<Box
				sx={{
					height: height || 50,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: "8px",
					backgroundColor: theme.palette.background.paper,
					border: `1px dashed ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
					<ChartSquare size={16} variant="Bulk" color={theme.palette.text.secondary} />
					<Typography variant="caption" color="text.secondary">
						{noDataMessage || "No hay datos suficientes"}
					</Typography>
				</Stack>
			</Box>
		);
	}

	return <ReactApexChart options={options} series={series} type="bar" height={height ? height : 50} />;
};

export default BarsDataWidget;
