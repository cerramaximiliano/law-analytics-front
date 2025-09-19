import React from "react";
import { useState } from "react";

// material-ui
import {
	Typography,
	Button,
	Box,
	Alert,
	AlertTitle,
	Stack,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Step,
	Stepper,
	StepLabel,
	Paper,
	Grid,
	styled,
	alpha,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import {
	ArrowRight2,
	Next,
	ArrowLeft,
	ArrowRight,
	Chart21,
	InfoCircle,
	Clock,
	Calendar,
	DocumentDownload,
	TrendUp,
	ChartSquare,
	Timer1,
	DollarSquare,
	TaskSquare,
	Notification,
	TickCircle,
	Warning2,
	CloseCircle,
} from "iconsax-react";

// ==============================|| GUÍA ANALÍTICAS - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA ANALÍTICAS - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El panel de analíticas es tu centro de comando para monitorear el rendimiento de tu práctica legal. Aquí podrás visualizar métricas
				en tiempo real sobre carpetas, tareas, vencimientos y aspectos financieros.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Lo que aprenderás:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Navegar por las diferentes secciones del panel</li>
						<li>Interpretar las métricas y visualizaciones</li>
						<li>Exportar reportes profesionales en PDF</li>
						<li>Acceder a datos históricos para análisis comparativo</li>
						<li>Usar tooltips y ayuda contextual</li>
						<li>Comprender las limitaciones por plan</li>
					</ul>
				</Typography>
			</Alert>
			<Alert severity="warning">
				<AlertTitle>Nota importante</AlertTitle>
				<Typography>
					Las analíticas avanzadas requieren un plan Standard o Premium. Con el plan gratuito, verás una vista limitada de las métricas.
				</Typography>
			</Alert>
		</Stack>
	);
};

const AccessContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para acceder al panel de analíticas, tienes varias opciones:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Desde el menú principal:</strong> Ve a "Panel de Control" {">"} "Analíticas"
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Acceso directo:</strong> Navega a /dashboard/analytics
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Desde el dashboard:</strong> Busca el widget "Ver Analíticas Completas"
						</Typography>
					</Box>
				</Stack>
			</Paper>
			<Typography paragraph>
				Una vez dentro del panel, verás un indicador en la parte superior que muestra cuándo se actualizaron los datos por última vez:
			</Typography>
			<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
				<Chip icon={<Clock size={16} />} label="Actualizado hace 2 horas" color="success" />
				<Chip icon={<Clock size={16} />} label="Actualizado hace 25 horas" color="warning" />
			</Box>
		</Stack>
	);
};

const MainMetricsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Las métricas principales te ayudan a entender el rendimiento de tu práctica:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Timer1 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Tiempo Promedio de Resolución
							</Typography>
						</Box>
						<Typography variant="body2">
							El tiempo promedio en días que tardas en resolver tus casos. Te ayuda a identificar eficiencias y establecer expectativas
							realistas con clientes.
						</Typography>
						<Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
							<InfoCircle size={16} style={{ marginRight: "4px" }} />
							<Typography variant="caption">Pasa el cursor sobre el ícono ℹ️ para más detalles</Typography>
						</Box>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<TaskSquare size={24} style={{ color: theme.palette.success.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Tasa de Completado de Tareas
							</Typography>
						</Box>
						<Typography variant="body2">
							Porcentaje de tareas completadas vs pendientes. Indica tu productividad y gestión del tiempo.
						</Typography>
						<Typography variant="caption" display="block" sx={{ mt: 1 }}>
							<strong>Código de colores:</strong> Verde {">"}80%, Amarillo 50-80%, Rojo {"<"}50%
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<DollarSquare size={24} style={{ color: theme.palette.warning.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Promedio por Carpeta
							</Typography>
						</Box>
						<Typography variant="body2">Monto promedio económico por carpeta activa. Ayuda a evaluar la rentabilidad de tu práctica.</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Notification size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Estado de Tareas
							</Typography>
						</Box>
						<Stack spacing={0.5}>
							<Typography variant="body2">• Pendientes: Tareas por realizar</Typography>
							<Typography variant="body2">• Completadas: Tareas finalizadas exitosamente</Typography>
							<Typography variant="body2">• Vencidas: Tareas que requieren atención inmediata</Typography>
						</Stack>
					</Paper>
				</Grid>
			</Grid>
		</Stack>
	);
};

const DataQualityContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El indicador de Calidad de Datos evalúa la completitud y confiabilidad de la información en el sistema, permitiéndote entender qué tan precisas son las analíticas mostradas.
			</Typography>

			<Alert severity="info">
				<AlertTitle>¿Cómo se calcula?</AlertTitle>
				<Typography component="div">
					El sistema comienza con 100% y aplica descuentos según los datos faltantes:
					<ul style={{ marginTop: 8 }}>
						<li><strong>-30%</strong> si no hay carpetas registradas</li>
						<li><strong>-20%</strong> si no hay montos financieros</li>
						<li><strong>-20%</strong> si no hay actividad reciente (últimos 30 días)</li>
					</ul>
				</Typography>
			</Alert>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
							<TableCell>Escenario</TableCell>
							<TableCell align="center">Carpetas</TableCell>
							<TableCell align="center">Montos</TableCell>
							<TableCell align="center">Actividad</TableCell>
							<TableCell align="center">Calidad</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell><strong>Ideal</strong></TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">
								<Chip label="100%" color="success" size="small" />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell><strong>Usuario activo</strong></TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">
								<Chip label="80%" color="primary" size="small" />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell><strong>Datos parciales</strong></TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">
								<Chip label="60%" color="warning" size="small" />
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell><strong>Mínimo</strong></TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">
								<Chip label="30%" color="error" size="small" />
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<Grid container spacing={2} sx={{ mt: 1 }}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<TickCircle size={24} style={{ color: theme.palette.success.main, marginRight: "8px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								90-100%: Excelente
							</Typography>
						</Box>
						<Typography variant="body2">
							Datos completos y confiables. Las analíticas reflejan con precisión el estado de tu práctica legal.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<InfoCircle size={24} style={{ color: theme.palette.info.main, marginRight: "8px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								70-89%: Bueno
							</Typography>
						</Box>
						<Typography variant="body2">
							Datos mayormente completos. Las métricas son confiables aunque falta algún componente menor.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Warning2 size={24} style={{ color: theme.palette.warning.main, marginRight: "8px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								50-69%: Parcial
							</Typography>
						</Box>
						<Typography variant="body2">
							Datos incompletos. El análisis es limitado y las tendencias pueden no ser representativas.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.error.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<CloseCircle size={24} style={{ color: theme.palette.error.main, marginRight: "8px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								0-49%: Insuficiente
							</Typography>
						</Box>
						<Typography variant="body2">
							Datos muy incompletos. Se requiere más información para generar análisis significativos.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="warning" sx={{ mt: 2 }}>
				<AlertTitle>¿Cómo mejorar la calidad?</AlertTitle>
				<Typography component="div">
					• <strong>Registra todas tus carpetas</strong>: Mantén actualizada la información de casos<br />
					• <strong>Agrega montos económicos</strong>: Incluye valores en tus carpetas activas<br />
					• <strong>Mantén actividad regular</strong>: Registra movimientos, tareas y actualizaciones frecuentemente
				</Typography>
			</Alert>
		</Stack>
	);
};

const DeadlinesContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				La proyección de vencimientos te ayuda a anticiparte a plazos críticos y mantener el control de tu agenda:
			</Typography>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
							<TableCell>Período</TableCell>
							<TableCell>Urgencia</TableCell>
							<TableCell>Acción Recomendada</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<strong>Próximos 7 días</strong>
							</TableCell>
							<TableCell>
								<Chip label="Alta" color="error" size="small" />
							</TableCell>
							<TableCell>Revisar diariamente y priorizar</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Próximos 15 días</strong>
							</TableCell>
							<TableCell>
								<Chip label="Media" color="warning" size="small" />
							</TableCell>
							<TableCell>Planificar en tu agenda semanal</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Próximos 30 días</strong>
							</TableCell>
							<TableCell>
								<Chip label="Normal" color="success" size="small" />
							</TableCell>
							<TableCell>Incluir en planificación mensual</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Origen de los datos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<Calendar size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>
								<strong>Eventos del calendario:</strong> Audiencias, reuniones, presentaciones
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<TaskSquare size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>
								<strong>Movimientos judiciales:</strong> Plazos procesales, vencimientos legales
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<Timer1 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>
								<strong>Tareas programadas:</strong> Entregas, seguimientos
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info">
				<Typography variant="body2">
					<strong>💡 Tip:</strong> Haz clic en cada tarjeta para ver el detalle de los vencimientos específicos.
				</Typography>
			</Alert>
		</Stack>
	);
};

const HistoricalDataContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema mantiene un registro histórico completo de tus analíticas, permitiéndote comparar el rendimiento a lo largo del tiempo:
			</Typography>

			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Acceso a datos históricos:
				</Typography>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Ver Histórico" (botón azul en la parte superior)</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Selecciona una fecha del menú desplegable</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Visualiza los datos de esa fecha específica</Typography>
					</Box>
				</Stack>
			</Paper>

			<Grid container spacing={2} sx={{ mt: 2 }}>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Información mostrada:
						</Typography>
						<Stack spacing={0.5}>
							<Typography variant="body2">• Fecha del reporte</Typography>
							<Typography variant="body2">• Antigüedad (Hoy, Ayer, Hace X días)</Typography>
							<Typography variant="body2">• Última actualización</Typography>
							<Typography variant="body2">• Indicador "Actual" para el reporte más reciente</Typography>
						</Stack>
					</Paper>
				</Grid>
				<Grid item xs={12} md={8}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Casos de uso:
						</Typography>
						<Stack spacing={1}>
							<Box display="flex" alignItems="flex-start">
								<ArrowRight2 size={16} style={{ minWidth: "20px", marginTop: "2px", color: theme.palette.success.main }} />
								<Typography variant="body2">
									<strong>Comparación mensual:</strong> Evalúa tu progreso mes a mes
								</Typography>
							</Box>
							<Box display="flex" alignItems="flex-start">
								<ArrowRight2 size={16} style={{ minWidth: "20px", marginTop: "2px", color: theme.palette.success.main }} />
								<Typography variant="body2">
									<strong>Análisis de tendencias:</strong> Identifica patrones en tu práctica
								</Typography>
							</Box>
							<Box display="flex" alignItems="flex-start">
								<ArrowRight2 size={16} style={{ minWidth: "20px", marginTop: "2px", color: theme.palette.success.main }} />
								<Typography variant="body2">
									<strong>Reportes para clientes:</strong> Demuestra evolución de casos
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="success">
				<Typography variant="body2">
					Los datos históricos se mantienen indefinidamente. Cada actualización crea un documento histórico que se preserva para tu análisis.
				</Typography>
			</Alert>
		</Stack>
	);
};

const ExportReportsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				La función de exportación te permite generar reportes profesionales en PDF con todas tus métricas:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Proceso de exportación
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box>
							<Typography fontWeight="bold" gutterBottom>
								1. Apertura del modal
							</Typography>
							<Typography variant="body2">
								• El botón "Exportar Reporte" abre un modal con vista previa
								<br />• Se muestra un resumen de todas las métricas actuales
								<br />• Verificación automática del plan del usuario
							</Typography>
						</Box>
						<Box>
							<Typography fontWeight="bold" gutterBottom>
								2. Contenido del PDF
							</Typography>
							<Typography variant="body2">
								• Encabezado profesional con branding
								<br />• Datos del usuario y suscripción
								<br />• Todas las métricas en formato tabla
								<br />• Visualizaciones adaptadas para impresión
							</Typography>
						</Box>
						<Box>
							<Typography fontWeight="bold" gutterBottom>
								3. Generación y descarga
							</Typography>
							<Typography variant="body2">
								• Click en "Generar PDF" para crear el archivo
								<br />• Descarga automática al navegador
								<br />• Nombre del archivo incluye fecha de generación
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<DocumentDownload size={24} style={{ color: theme.palette.info.main, marginBottom: "8px" }} />
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Presentaciones a clientes
						</Typography>
						<Typography variant="body2">Demuestra profesionalismo con reportes bien estructurados</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<ChartSquare size={24} style={{ color: theme.palette.info.main, marginBottom: "8px" }} />
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Análisis interno
						</Typography>
						<Typography variant="body2">Revisa el rendimiento mensual de tu práctica</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<TrendUp size={24} style={{ color: theme.palette.info.main, marginBottom: "8px" }} />
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Documentación
						</Typography>
						<Typography variant="body2">Mantén registros históricos para futuras referencias</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="warning" sx={{ mt: 2 }}>
				<AlertTitle>Nota importante</AlertTitle>
				<Typography>La exportación de reportes requiere un plan Standard o Premium. Con el plan gratuito esta función no está disponible.</Typography>
			</Alert>
		</Stack>
	);
};

const PlansLimitationsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Cada plan ofrece diferentes niveles de acceso a las funcionalidades de analíticas:</Typography>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
							<TableCell>Característica</TableCell>
							<TableCell align="center">Gratuito</TableCell>
							<TableCell align="center">Standard</TableCell>
							<TableCell align="center">Premium</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>Vista completa de analíticas</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Métricas básicas visibles</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Exportación de reportes PDF</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">✅</TableCell>
							<TableCell align="center">✅</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Histórico de datos</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">6 meses</TableCell>
							<TableCell align="center">Ilimitado</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Reportes personalizados</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">❌</TableCell>
							<TableCell align="center">✅</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<Alert severity="info" sx={{ mt: 2 }}>
				<AlertTitle>Plan Gratuito</AlertTitle>
				<Typography>
					Con el plan gratuito verás un overlay sobre las analíticas que limita la visualización completa. Las métricas básicas son visibles
					pero no puedes exportar reportes ni acceder al histórico.
				</Typography>
			</Alert>
		</Stack>
	);
};

const TipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para maximizar el valor de las analíticas, sigue estos consejos y mejores prácticas:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Typography fontSize="20px" marginRight="8px">
								📊
							</Typography>
							<Typography variant="subtitle1" fontWeight="bold">
								Revisión diaria
							</Typography>
						</Box>
						<Typography variant="body2">Revisa diariamente la proyección de vencimientos para anticiparte a plazos críticos</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Typography fontSize="20px" marginRight="8px">
								📈
							</Typography>
							<Typography variant="subtitle1" fontWeight="bold">
								Comparación mensual
							</Typography>
						</Box>
						<Typography variant="body2">Compara mensualmente tus métricas usando el histórico para identificar tendencias</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Typography fontSize="20px" marginRight="8px">
								📁
							</Typography>
							<Typography variant="subtitle1" fontWeight="bold">
								Exportación regular
							</Typography>
						</Box>
						<Typography variant="body2">Exporta reportes al finalizar cada mes para mantener un archivo histórico completo</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Typography fontSize="20px" marginRight="8px">
								ℹ️
							</Typography>
							<Typography variant="subtitle1" fontWeight="bold">
								Usa los tooltips
							</Typography>
						</Box>
						<Typography variant="body2">Pasa el cursor sobre los íconos de información para entender mejor cada métrica</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.1), borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					⚠️ Indicadores de alerta:
				</Typography>
				<Stack spacing={1}>
					<Typography variant="body2">• Tasa de completado {"<"} 50%: Revisa tu gestión de tareas</Typography>
					<Typography variant="body2">• Tiempo de resolución creciente: Analiza cuellos de botella</Typography>
					<Typography variant="body2">• Muchos vencimientos próximos: Reorganiza prioridades</Typography>
					<Typography variant="body2">• Montos pendientes altos: Seguimiento de cobros</Typography>
				</Stack>
			</Box>

			<Alert severity="success" sx={{ mt: 2 }}>
				<AlertTitle>Consejo profesional</AlertTitle>
				<Typography>
					Monitorea tendencias más que valores absolutos. Los patrones a lo largo del tiempo son más valiosos que los números individuales para
					evaluar el rendimiento de tu práctica.
				</Typography>
			</Alert>
		</Stack>
	);
};

const TroubleshootingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Si encuentras problemas al usar el panel de analíticas, aquí están las soluciones más comunes:</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						El panel no muestra datos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1}>
						<Typography variant="body2">1. Verifica estar autenticado correctamente</Typography>
						<Typography variant="body2">2. Espera que cargue (indicador de carga visible)</Typography>
						<Typography variant="body2">3. Actualiza la página con F5</Typography>
						<Typography variant="body2">4. Contacta soporte si persiste</Typography>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Las métricas parecen incorrectas
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1}>
						<Typography variant="body2">1. Verifica la fecha del último update (chip superior)</Typography>
						<Typography variant="body2">2. Revisa que tus carpetas tengan datos completos</Typography>
						<Typography variant="body2">3. Los cálculos se basan en datos ingresados</Typography>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						No puedo exportar reportes
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1}>
						<Typography variant="body2">1. Verifica tener plan Standard o Premium</Typography>
						<Typography variant="body2">2. El botón debe estar habilitado (no gris)</Typography>
						<Typography variant="body2">3. Permite ventanas emergentes en tu navegador</Typography>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						El histórico no carga
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1}>
						<Typography variant="body2">1. Haz clic nuevamente en "Ver Histórico"</Typography>
						<Typography variant="body2">2. Espera el indicador de carga</Typography>
						<Typography variant="body2">3. Verifica tu conexión a internet</Typography>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 2 }}>
				<AlertTitle>Recursos adicionales</AlertTitle>
				<Typography variant="body2">
					• 📚 Documentación técnica de métricas
					<br />• 💬 Soporte técnico: soporte@lawanalytics.app
				</Typography>
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA ANALÍTICAS ||============================== //

interface GuideAnalyticsProps {
	open: boolean;
	onClose: () => void;
}

const GuideAnalytics: React.FC<GuideAnalyticsProps> = ({ open, onClose }) => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const handleClose = () => {
		onClose();
		// Reset a paso 0 al cerrar
		setTimeout(() => setActiveStep(0), 300);
	};

	const steps = [
		{
			title: "Introducción al Panel de Analíticas",
			content: <IntroductionContent />,
		},
		{
			title: "Acceso al Panel",
			content: <AccessContent />,
		},
		{
			title: "Métricas Principales",
			content: <MainMetricsContent />,
		},
		{
			title: "Calidad de Datos",
			content: <DataQualityContent />,
		},
		{
			title: "Proyección de Vencimientos",
			content: <DeadlinesContent />,
		},
		{
			title: "Histórico de Analíticas",
			content: <HistoricalDataContent />,
		},
		{
			title: "Exportación de Reportes",
			content: <ExportReportsContent />,
		},
		{
			title: "Limitaciones por Plan",
			content: <PlansLimitationsContent />,
		},
		{
			title: "Consejos y Mejores Prácticas",
			content: <TipsContent />,
		},
		{
			title: "Solución de Problemas",
			content: <TroubleshootingContent />,
		},
	];

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			TransitionComponent={PopupTransition}
			sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}
		>
			<DialogTitle
				sx={{
					borderBottom: `1px solid ${theme.palette.divider}`,
					p: 2,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box display="flex" alignItems="center">
					<Chart21 variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
					<Typography variant="h3">Guía del Panel de Analíticas</Typography>
				</Box>
			</DialogTitle>

			<DialogContent sx={{ p: 0 }}>
				<Stepper activeStep={activeStep} alternativeLabel sx={{ p: 3, pb: 1, pt: 3 }}>
					{steps.map((step, index) => (
						<Step key={index}>
							<StepLabel>{step.title}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Box sx={{ p: 0 }}>
					<Box sx={{ p: 3 }}>
						<Typography variant="h4" gutterBottom color="primary">
							{steps[activeStep].title}
						</Typography>
						<Box sx={{ mb: 3 }}>{steps[activeStep].content}</Box>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
				<Button onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				<Box sx={{ flex: "1 1 auto" }} />
				<Button color="error" onClick={handleClose}>
					Cerrar
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={handleClose} endIcon={<Next />}>
						Finalizar
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default GuideAnalytics;