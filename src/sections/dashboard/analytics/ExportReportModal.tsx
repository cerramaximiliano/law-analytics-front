import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	CircularProgress,
	Alert,
	Stack,
	Divider,
} from "@mui/material";
import { DocumentDownload } from "iconsax-react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import useAuth from "hooks/useAuth";
import useSubscription from "hooks/useSubscription";
import { useSelector } from "react-redux";
import { RootState } from "store";
import logoBase64 from "./logoBase64";

// Estilos para el PDF
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 10,
		fontFamily: "Helvetica",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 30,
		paddingBottom: 20,
		borderBottom: "2px solid #1890ff",
	},
	logo: {
		width: 80,
		height: 80,
	},
	headerInfo: {
		flex: 1,
		marginLeft: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#1c3d5a",
		marginBottom: 5,
	},
	subtitle: {
		fontSize: 12,
		color: "#666",
		marginBottom: 3,
	},
	dateText: {
		fontSize: 10,
		color: "#999",
	},
	userInfo: {
		backgroundColor: "#f5f5f5",
		padding: 15,
		marginBottom: 20,
		borderRadius: 5,
	},
	userTitle: {
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#1c3d5a",
	},
	userRow: {
		flexDirection: "row",
		marginBottom: 5,
	},
	userLabel: {
		fontSize: 10,
		fontWeight: "bold",
		width: 100,
		color: "#666",
	},
	userData: {
		fontSize: 10,
		color: "#333",
		flex: 1,
	},
	section: {
		marginBottom: 25,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#1c3d5a",
		borderBottom: "1px solid #e0e0e0",
		paddingBottom: 5,
	},
	metricsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	metricBox: {
		width: "48%",
		backgroundColor: "#f9f9f9",
		padding: 12,
		marginBottom: 10,
		borderRadius: 5,
		borderLeft: "3px solid #1890ff",
	},
	metricLabel: {
		fontSize: 9,
		color: "#666",
		marginBottom: 5,
	},
	metricValue: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#1c3d5a",
	},
	statsTable: {
		marginTop: 10,
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: "1px solid #e0e0e0",
		paddingVertical: 8,
	},
	tableHeader: {
		backgroundColor: "#f5f5f5",
		fontWeight: "bold",
	},
	tableCell: {
		flex: 1,
		fontSize: 10,
		paddingHorizontal: 5,
	},
	footer: {
		position: "absolute",
		bottom: 30,
		left: 40,
		right: 40,
		textAlign: "center",
		fontSize: 8,
		color: "#999",
		borderTop: "1px solid #e0e0e0",
		paddingTop: 10,
	},
});

interface ExportReportModalProps {
	open: boolean;
	onClose: () => void;
}

// Componente del documento PDF
const ReportDocument: React.FC<{ userData: any; statsData: any; lastUpdated?: string }> = ({ userData, statsData, lastUpdated }) => {
	const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
	const dataDate = lastUpdated ? format(new Date(lastUpdated), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : currentDate;

	// Formatear números con separadores de miles
	const formatNumber = (num: number) => {
		return new Intl.NumberFormat("es-AR").format(num);
	};

	// Formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header con logo */}
				<View style={styles.header}>
					<Image style={styles.logo} src={logoBase64} />
					<View style={styles.headerInfo}>
						<Text style={styles.title}>Reporte de Analíticas</Text>
						<Text style={styles.subtitle}>Law Analytics - Sistema de Gestión Legal</Text>
						<Text style={styles.dateText}>Generado el {currentDate}</Text>
						<Text style={styles.dateText}>Datos actualizados al {dataDate}</Text>
					</View>
				</View>

				{/* Información del usuario */}
				<View style={styles.userInfo}>
					<Text style={styles.userTitle}>Información del Usuario</Text>
					<View style={styles.userRow}>
						<Text style={styles.userLabel}>Nombre:</Text>
						<Text style={styles.userData}>{userData.name}</Text>
					</View>
					<View style={styles.userRow}>
						<Text style={styles.userLabel}>Email:</Text>
						<Text style={styles.userData}>{userData.email}</Text>
					</View>
					<View style={styles.userRow}>
						<Text style={styles.userLabel}>Plan:</Text>
						<Text style={styles.userData}>
							{userData.plan === "free" ? "Gratuito" : userData.plan === "standard" ? "Estándar" : userData.plan === "premium" ? "Premium" : userData.plan}
						</Text>
					</View>
				</View>

				{/* Métricas principales */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Métricas Principales</Text>
					<View style={styles.metricsGrid}>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Carpetas Activas</Text>
							<Text style={styles.metricValue}>{statsData?.folders?.active || 0}</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Carpetas Cerradas</Text>
							<Text style={styles.metricValue}>{statsData?.folders?.closed || 0}</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Tiempo Promedio Resolución</Text>
							<Text style={styles.metricValue}>
								{(statsData?.folders?.resolutionTimes?.overall || 0).toFixed(1)} días
							</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Tasa de Completitud</Text>
							<Text style={styles.metricValue}>{(statsData?.tasks?.completionRate || 0).toFixed(1)}%</Text>
						</View>
					</View>
				</View>

				{/* Estadísticas financieras */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Resumen Financiero</Text>
					<View style={styles.statsTable}>
						<View style={[styles.tableRow, styles.tableHeader]}>
							<Text style={styles.tableCell}>Estado</Text>
							<Text style={styles.tableCell}>Cantidad</Text>
							<Text style={styles.tableCell}>Monto Total</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Activos</Text>
							<Text style={styles.tableCell}>{statsData?.folders?.active || 0}</Text>
							<Text style={styles.tableCell}>{formatCurrency(statsData?.financial?.activeAmount || 0)}</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Cerrados</Text>
							<Text style={styles.tableCell}>{statsData?.folders?.closed || 0}</Text>
							<Text style={styles.tableCell}>{formatCurrency(statsData?.financial?.receivedAmount || 0)}</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Pendientes</Text>
							<Text style={styles.tableCell}>{statsData?.folders?.pending || 0}</Text>
							<Text style={styles.tableCell}>{formatCurrency(statsData?.financial?.pendingAmount || 0)}</Text>
						</View>
					</View>
				</View>

				{/* Distribución de tareas */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Estado de Tareas</Text>
					<View style={styles.metricsGrid}>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Pendientes</Text>
							<Text style={styles.metricValue}>{statsData?.tasks?.pending || 0}</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Completadas</Text>
							<Text style={styles.metricValue}>{statsData?.tasks?.completed || 0}</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Vencidas</Text>
							<Text style={styles.metricValue}>{statsData?.tasks?.overdue || 0}</Text>
						</View>
						<View style={styles.metricBox}>
							<Text style={styles.metricLabel}>Total</Text>
							<Text style={styles.metricValue}>
								{(statsData?.tasks?.pending || 0) + (statsData?.tasks?.completed || 0) + (statsData?.tasks?.overdue || 0)}
							</Text>
						</View>
					</View>
				</View>

				{/* Próximos vencimientos */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Próximos Vencimientos</Text>
					<View style={styles.statsTable}>
						<View style={[styles.tableRow, styles.tableHeader]}>
							<Text style={styles.tableCell}>Período</Text>
							<Text style={styles.tableCell}>Cantidad</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Próximos 7 días</Text>
							<Text style={styles.tableCell}>{statsData?.deadlines?.next7Days || statsData?.deadlines?.nextWeek || 0}</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Próximos 15 días</Text>
							<Text style={styles.tableCell}>{statsData?.deadlines?.next15Days || 0}</Text>
						</View>
						<View style={styles.tableRow}>
							<Text style={styles.tableCell}>Próximos 30 días</Text>
							<Text style={styles.tableCell}>{statsData?.deadlines?.next30Days || 0}</Text>
						</View>
					</View>
				</View>

				{/* Footer */}
				<Text style={styles.footer}>
					© {new Date().getFullYear()} Law Analytics - Todos los derechos reservados | Reporte generado automáticamente
				</Text>
			</Page>
		</Document>
	);
};

const ExportReportModal: React.FC<ExportReportModalProps> = ({ open, onClose }) => {
	const { user } = useAuth();
	const { subscription } = useSubscription();
	const { data: statsData, lastUpdated } = useSelector((state: RootState) => state.unifiedStats);
	const [isGenerating, setIsGenerating] = useState(false);

	const userData = {
		name: user?.name || "Usuario",
		email: user?.email || "No disponible",
		plan: subscription?.plan || "free",
	};

	// Combinar datos de dashboard y otras secciones
	const reportData = {
		folders: {
			active: statsData?.dashboard?.folders?.active || 0,
			closed: statsData?.dashboard?.folders?.closed || 0,
			pending: statsData?.folders?.distribution?.pendiente || 0,
			resolutionTimes: statsData?.folders?.resolutionTimes,
		},
		financial: {
			activeAmount: statsData?.dashboard?.financial?.activeAmount || 0,
			receivedAmount: statsData?.dashboard?.financial?.receivedAmount || 0,
			pendingAmount: statsData?.dashboard?.financial?.pendingAmount || 0,
		},
		tasks: {
			pending: statsData?.dashboard?.tasks?.pending || 0,
			completed: statsData?.dashboard?.tasks?.completed || 0,
			overdue: statsData?.dashboard?.tasks?.overdue || 0,
			completionRate: statsData?.tasks?.completionRate || 0,
		},
		deadlines: {
			next7Days: statsData?.folders?.upcomingDeadlines?.next7Days || statsData?.dashboard?.deadlines?.nextWeek || 0,
			nextWeek: statsData?.dashboard?.deadlines?.nextWeek || 0,
			next15Days: statsData?.folders?.upcomingDeadlines?.next15Days || statsData?.dashboard?.deadlines?.next15Days || 0,
			next30Days: statsData?.folders?.upcomingDeadlines?.next30Days || statsData?.dashboard?.deadlines?.next30Days || 0,
		},
	};

	const handleDownloadPDF = async () => {
		setIsGenerating(true);
		try {
			// Generar el PDF como blob
			const doc = <ReportDocument userData={userData} statsData={reportData} lastUpdated={lastUpdated} />;
			const asPdf = pdf(doc);
			const blob = await asPdf.toBlob();

			// Crear enlace de descarga
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Reporte_Analytics_${format(new Date(), "yyyy-MM-dd")}.pdf`;
			link.click();

			// Limpiar
			URL.revokeObjectURL(url);

			// Pequeño delay para UX
			setTimeout(() => {
				setIsGenerating(false);
				onClose();
			}, 1000);
		} catch (error) {
			console.error("Error generando PDF:", error);
			setIsGenerating(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Exportar Reporte de Analíticas</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 2 }}>
					{/* Preview Info */}
					<Alert severity="info" icon={<DocumentDownload size={20} />}>
						El reporte incluirá todas las métricas y estadísticas actuales de tu dashboard de analíticas.
					</Alert>

					{/* Información del reporte */}
					<Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
						<Typography variant="subtitle2" gutterBottom fontWeight={600}>
							Contenido del Reporte:
						</Typography>
						<Stack spacing={1}>
							<Typography variant="body2" color="text.secondary">
								• Información del usuario y plan actual
							</Typography>
							<Typography variant="body2" color="text.secondary">
								• Métricas principales (carpetas, tiempos de resolución)
							</Typography>
							<Typography variant="body2" color="text.secondary">
								• Resumen financiero por estado
							</Typography>
							<Typography variant="body2" color="text.secondary">
								• Estado y distribución de tareas
							</Typography>
							<Typography variant="body2" color="text.secondary">
								• Próximos vencimientos y deadlines
							</Typography>
						</Stack>
					</Box>

					<Divider />

					{/* Datos del reporte */}
					<Box>
						<Typography variant="subtitle2" gutterBottom fontWeight={600}>
							Datos del Reporte:
						</Typography>
						<Stack spacing={1}>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography variant="body2" color="text.secondary">
									Usuario:
								</Typography>
								<Typography variant="body2">{userData.name}</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography variant="body2" color="text.secondary">
									Email:
								</Typography>
								<Typography variant="body2">{userData.email}</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography variant="body2" color="text.secondary">
									Fecha:
								</Typography>
								<Typography variant="body2">{format(new Date(), "dd/MM/yyyy HH:mm")}</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography variant="body2" color="text.secondary">
									Plan:
								</Typography>
								<Typography variant="body2">
									{userData.plan === "free" ? "Gratuito" : userData.plan === "standard" ? "Estándar" : userData.plan === "premium" ? "Premium" : userData.plan}
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isGenerating}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					startIcon={isGenerating ? <CircularProgress size={16} /> : <DocumentDownload size={16} />}
					onClick={handleDownloadPDF}
					disabled={isGenerating}
				>
					{isGenerating ? "Generando..." : "Descargar PDF"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ExportReportModal;