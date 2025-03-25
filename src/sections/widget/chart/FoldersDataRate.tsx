// Adaptación para RepeatCustomerRate
import { useState, useEffect, MouseEvent } from "react";
import { useTheme } from "@mui/material/styles";
import { Chip, Grid, ListItemButton, Menu, Stack, Typography, CircularProgress } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import { More } from "iconsax-react";
import StatsService from "store/reducers/ApiService";
import { useSelector } from "store";
import {
	FolderAnalytics,
	//FolderDistribution
} from "types/stats";

const FoldersDataRate = () => {
	const theme = useTheme();
	const [loading, setLoading] = useState<boolean>(true);
	const [folderData, setFolderData] = useState<FolderAnalytics | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	// Obtener userId del usuario actualmente autenticado
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	const open = Boolean(anchorEl);

	// Cargar datos de la API
	useEffect(() => {
		const fetchFolderData = async () => {
			try {
				setLoading(true);
				const categoryData = await StatsService.getCategoryAnalysis<FolderAnalytics>("folders", userId);
				console.log(categoryData);
				setFolderData(categoryData);
			} catch (error) {
				console.error("Error fetching folder data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchFolderData();
	}, [userId]);

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	// Configurar opciones de gráfico
	const pieChartOptions = {
		chart: {
			type: "pie" as const,
			height: 365,
		},
		labels: ["Nueva", "En Proceso", "Pendiente", "Cerrada"],
		legend: {
			show: true,
			position: "bottom" as const,
			fontSize: "14px",
			fontFamily: "inherit",
			fontWeight: 400,
			labels: {
				colors: theme.palette.text.secondary,
			},
			itemMargin: {
				horizontal: 8,
				vertical: 4,
			},
			markers: {
				width: 12,
				height: 12,
				radius: 4,
			},
		},
		dataLabels: {
			enabled: true,
			formatter: function (val: number) {
				return Math.round(val) + "%";
			},
			dropShadow: { enabled: false },
		},
		colors: [theme.palette.primary.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.success.main],
		tooltip: {
			theme: theme.palette.mode,
			y: {
				formatter: (value: number) => {
					// Simplemente mostrar el valor entero con el símbolo de porcentaje
					return Math.round(value) + "%";
				},
			},
		},
		stroke: {
			width: 2,
		},
		plotOptions: {
			pie: {
				donut: {
					size: '0%',
				},
				expandOnClick: false
			}
		},
	};

	if (loading) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<CircularProgress />
				</Stack>
			</MainCard>
		);
	}

	if (!folderData || !folderData.distribution) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<Typography variant="h6">No hay datos disponibles</Typography>
				</Stack>
			</MainCard>
		);
	}

	const { distribution } = folderData;
	const total = distribution.nueva + distribution.enProceso + distribution.cerrada + distribution.pendiente;

	// Calcular porcentajes para el gráfico
	const getPercentage = (value: number) => (total > 0 ? (value / total) * 100 : 0);

	// Datos para el gráfico - redondeando a enteros para evitar decimales
	const seriesData = [
		Math.round(getPercentage(distribution.nueva)),
		Math.round(getPercentage(distribution.enProceso)),
		Math.round(getPercentage(distribution.pendiente)),
		Math.round(getPercentage(distribution.cerrada)),
	];

	return (
		<MainCard>
			<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
				<Typography variant="h5">Distribución de Carpetas</Typography>
				<IconButton
					color="secondary"
					id="wallet-button"
					aria-controls={open ? "wallet-menu" : undefined}
					aria-haspopup="true"
					aria-expanded={open ? "true" : undefined}
					onClick={handleClick}
				>
					<More />
				</IconButton>
				<Menu
					id="wallet-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					MenuListProps={{
						"aria-labelledby": "wallet-button",
						sx: { p: 1.25, minWidth: 150 },
					}}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
				>
					<ListItemButton onClick={handleClose}>Actualizar</ListItemButton>
				</Menu>
			</Stack>

			<Grid container spacing={3} sx={{ mt: 1 }}>
				<Grid item xs={12} sm={5}>
					<Stack spacing={2} sx={{ height: "100%" }}>
						<Stack spacing={0.5}>
							<Typography variant="subtitle1">Resumen de Carpetas</Typography>
							<Typography variant="h4">{total} carpetas en total</Typography>
						</Stack>

						<Grid container spacing={1.5}>
							<Grid item xs={6}>
								<Stack spacing={0.5}>
									<Typography color="primary.main" variant="subtitle2">
										Nuevas
									</Typography>
									<Typography variant="h5">{distribution.nueva}</Typography>
								</Stack>
							</Grid>
							<Grid item xs={6}>
								<Stack spacing={0.5}>
									<Typography color="warning.main" variant="subtitle2">
										En Proceso
									</Typography>
									<Typography variant="h5">{distribution.enProceso}</Typography>
								</Stack>
							</Grid>
							<Grid item xs={6}>
								<Stack spacing={0.5}>
									<Typography color="error.main" variant="subtitle2">
										Pendientes
									</Typography>
									<Typography variant="h5">{distribution.pendiente}</Typography>
								</Stack>
							</Grid>
							<Grid item xs={6}>
								<Stack spacing={0.5}>
									<Typography color="success.main" variant="subtitle2">
										Cerradas
									</Typography>
									<Typography variant="h5">{distribution.cerrada}</Typography>
								</Stack>
							</Grid>
						</Grid>

						<Stack direction="row" alignItems="center" spacing={1}>
							<Chip label={`Tasa de resolución: ${Math.round((distribution.cerrada / total) * 100)}%`} color="success" size="small" />
						</Stack>
					</Stack>
				</Grid>

				<Grid item xs={12} sm={7}>
					<ReactApexChart options={pieChartOptions} series={seriesData} type="pie" height={300} />
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default FoldersDataRate;