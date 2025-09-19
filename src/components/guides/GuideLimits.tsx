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
	LinearProgress,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import {
	ArrowRight2,
	ArrowLeft,
	ArrowRight,
	InfoCircle,
	FolderOpen,
	Calculator,
	Profile2User,
	Archive,
	Cloud,
	Warning2,
	TickCircle,
	CloseCircle,
	Crown,
	Clock,
	Trash,
	DocumentText,
	Setting2,
} from "iconsax-react";

// ==============================|| GUÍA LÍMITES - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA LÍMITES - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Law Analytics utiliza un sistema dual de límites para garantizar el mejor rendimiento y experiencia. Comprende cómo funcionan estos
				límites te ayudará a optimizar tu uso de la plataforma.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Lo que aprenderás:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Diferencia entre límites de cantidad y almacenamiento</li>
						<li>Cómo funcionan los elementos activos vs archivados</li>
						<li>Estrategias para optimizar tu espacio</li>
						<li>Qué es y cómo usar el período de gracia</li>
						<li>Comparación detallada entre planes</li>
					</ul>
				</Typography>
			</Alert>
			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: "primary.lighter" }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Límites de Cantidad
						</Typography>
						<Typography variant="body2">Controlan cuántos elementos activos puedes tener (carpetas, contactos, calculadoras)</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, bgcolor: "secondary.lighter" }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Límites de Almacenamiento
						</Typography>
						<Typography variant="body2">Controlan el espacio total que utilizas (activos + archivados + archivos)</Typography>
					</Paper>
				</Grid>
			</Grid>
		</Stack>
	);
};

const PlansComparisonContent = () => {
	const theme = useTheme();
	const plans = [
		{
			name: "Plan Free",
			folders: 5,
			calculators: 3,
			contacts: 10,
			storage: "50 MB",
			color: "default",
			recommended: false,
		},
		{
			name: "Plan Standard",
			folders: 50,
			calculators: 20,
			contacts: 100,
			storage: "1 GB",
			color: "primary",
			recommended: true,
		},
		{
			name: "Plan Premium",
			folders: 500,
			calculators: 200,
			contacts: 1000,
			storage: "5 GB",
			color: "secondary",
			recommended: false,
		},
	];

	return (
		<Stack spacing={3}>
			<Typography paragraph>Compara los límites y características de cada plan para elegir el que mejor se adapte a tus necesidades:</Typography>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Característica</TableCell>
							{plans.map((plan) => (
								<TableCell key={plan.name} align="center">
									<Stack alignItems="center" spacing={1}>
										<Typography fontWeight="bold">{plan.name}</Typography>
										{plan.recommended && <Chip label="Más Popular" size="small" color="primary" />}
									</Stack>
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<Box display="flex" alignItems="center">
									<FolderOpen size={20} style={{ marginRight: 8 }} />
									Carpetas Activas
								</Box>
							</TableCell>
							{plans.map((plan) => (
								<TableCell key={`${plan.name}-folders`} align="center">
									<Typography variant="h6">{plan.folders}</Typography>
								</TableCell>
							))}
						</TableRow>
						<TableRow>
							<TableCell>
								<Box display="flex" alignItems="center">
									<Calculator size={20} style={{ marginRight: 8 }} />
									Calculadoras Activas
								</Box>
							</TableCell>
							{plans.map((plan) => (
								<TableCell key={`${plan.name}-calculators`} align="center">
									<Typography variant="h6">{plan.calculators}</Typography>
								</TableCell>
							))}
						</TableRow>
						<TableRow>
							<TableCell>
								<Box display="flex" alignItems="center">
									<Profile2User size={20} style={{ marginRight: 8 }} />
									Contactos Activos
								</Box>
							</TableCell>
							{plans.map((plan) => (
								<TableCell key={`${plan.name}-contacts`} align="center">
									<Typography variant="h6">{plan.contacts}</Typography>
								</TableCell>
							))}
						</TableRow>
						<TableRow>
							<TableCell>
								<Box display="flex" alignItems="center">
									<Cloud size={20} style={{ marginRight: 8 }} />
									Almacenamiento Total
								</Box>
							</TableCell>
							{plans.map((plan) => (
								<TableCell key={`${plan.name}-storage`} align="center">
									<Typography variant="h6" color="primary">
										{plan.storage}
									</Typography>
								</TableCell>
							))}
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<Alert severity="success">
				<AlertTitle>💡 Consejo</AlertTitle>
				<Typography>
					Si recién comienzas, el Plan Free es perfecto para probar. Cuando tu práctica crezca, actualizar es instantáneo y mantienes toda tu
					información.
				</Typography>
			</Alert>
		</Stack>
	);
};

const ActiveVsArchivedContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Entender la diferencia entre elementos activos y archivados es clave para optimizar tu uso de Law Analytics:
			</Typography>

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 3, height: "100%", bgcolor: alpha(theme.palette.success.main, 0.1) }}>
						<Box display="flex" alignItems="center" mb={2}>
							<FolderOpen size={24} color={theme.palette.success.main} />
							<Typography variant="h6" ml={1}>
								Elementos Activos
							</Typography>
						</Box>
						<List dense>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.success.main} />
								</ListItemIcon>
								<ListItemText primary="Aparecen en tu lista principal" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.success.main} />
								</ListItemIcon>
								<ListItemText primary="Puedes editarlos libremente" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.success.main} />
								</ListItemIcon>
								<ListItemText primary="Se incluyen en búsquedas rápidas" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<Warning2 size={18} color={theme.palette.warning.main} />
								</ListItemIcon>
								<ListItemText primary="Cuentan para límite de cantidad" />
							</ListItem>
						</List>
					</Paper>
				</Grid>

				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 3, height: "100%", bgcolor: alpha(theme.palette.info.main, 0.1) }}>
						<Box display="flex" alignItems="center" mb={2}>
							<Archive size={24} color={theme.palette.info.main} />
							<Typography variant="h6" ml={1}>
								Elementos Archivados
							</Typography>
						</Box>
						<List dense>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.info.main} />
								</ListItemIcon>
								<ListItemText primary="Se mantienen para consulta" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.info.main} />
								</ListItemIcon>
								<ListItemText primary="Conservan toda la información" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<TickCircle size={18} color={theme.palette.info.main} />
								</ListItemIcon>
								<ListItemText primary="NO cuentan para límite de cantidad" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<Warning2 size={18} color={theme.palette.warning.main} />
								</ListItemIcon>
								<ListItemText primary="SÍ ocupan almacenamiento" />
							</ListItem>
						</List>
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
				<Typography variant="h6" gutterBottom>
					Ejemplo Práctico: Plan Free (5 carpetas máximo)
				</Typography>
				<Box sx={{ mt: 2 }}>
					<Typography variant="body2" gutterBottom>
						Estado inicial: 5 carpetas activas (límite alcanzado)
					</Typography>
					<LinearProgress variant="determinate" value={100} sx={{ height: 10, borderRadius: 5, mb: 2 }} color="error" />

					<Typography variant="body2" gutterBottom>
						Acción: Archivar 2 carpetas antiguas
					</Typography>
					<Typography variant="body2" gutterBottom color="text.secondary">
						↓
					</Typography>

					<Typography variant="body2" gutterBottom>
						Estado final: 3 activas + 2 archivadas = ¡2 espacios libres!
					</Typography>
					<LinearProgress variant="determinate" value={60} sx={{ height: 10, borderRadius: 5 }} color="success" />
				</Box>
			</Paper>
		</Stack>
	);
};

const StorageSystemContent = () => {
	const theme = useTheme();
	const storageItems = [
		{ type: "Contacto", size: "2 KB", equivalent: "~500 contactos = 1 MB", icon: Profile2User },
		{ type: "Carpeta", size: "10 KB", equivalent: "~100 carpetas = 1 MB", icon: FolderOpen },
		{ type: "Calculadora", size: "5 KB", equivalent: "~200 calculadoras = 1 MB", icon: Calculator },
		{ type: "Archivo PDF", size: "Variable", equivalent: "Según tamaño real", icon: DocumentText },
	];

	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema de almacenamiento cuenta TODOS tus elementos (activos + archivados + archivos adjuntos). Aquí está el desglose:
			</Typography>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Tipo de Elemento</TableCell>
							<TableCell>Tamaño Aproximado</TableCell>
							<TableCell>Equivalencia</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{storageItems.map((item) => {
							const Icon = item.icon;
							return (
								<TableRow key={item.type}>
									<TableCell>
										<Box display="flex" alignItems="center">
											<Icon size={20} style={{ marginRight: 8 }} />
											{item.type}
										</Box>
									</TableCell>
									<TableCell>{item.size}</TableCell>
									<TableCell>{item.equivalent}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			<Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
				<Typography variant="h6" gutterBottom>
					Ejemplo de Cálculo - Plan Standard (1 GB)
				</Typography>
				<Stack spacing={1} mt={2}>
					<Typography variant="body2">• 30 carpetas activas = 300 KB</Typography>
					<Typography variant="body2">• 70 carpetas archivadas = 700 KB</Typography>
					<Typography variant="body2">• 50 contactos = 100 KB</Typography>
					<Typography variant="body2">• 10 calculadoras = 50 KB</Typography>
					<Typography variant="body2">• 5 PDFs (2 MB c/u) = 10 MB</Typography>
					<Box sx={{ borderTop: 1, borderColor: "divider", pt: 1, mt: 1 }}>
						<Typography variant="subtitle1" fontWeight="bold">
							Total: 11.15 MB de 1,024 MB (1.1%)
						</Typography>
					</Box>
				</Stack>
			</Paper>

			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), textAlign: "center" }}>
						<Typography variant="h4" color="success.main">
							🟢
						</Typography>
						<Typography variant="subtitle2" fontWeight="bold">
							0-60%
						</Typography>
						<Typography variant="body2">Uso normal</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), textAlign: "center" }}>
						<Typography variant="h4" color="warning.main">
							🟡
						</Typography>
						<Typography variant="subtitle2" fontWeight="bold">
							60-80%
						</Typography>
						<Typography variant="body2">Considera limpiar</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), textAlign: "center" }}>
						<Typography variant="h4" color="error.main">
							🔴
						</Typography>
						<Typography variant="subtitle2" fontWeight="bold">
							80-100%
						</Typography>
						<Typography variant="body2">Acción necesaria</Typography>
					</Paper>
				</Grid>
			</Grid>
		</Stack>
	);
};

const GracePeriodContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El período de gracia es un tiempo adicional que te damos para ajustar tu uso cuando hay cambios en tu suscripción:
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Paper sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
						<Box display="flex" alignItems="center" mb={2}>
							<Clock size={24} color={theme.palette.warning.main} />
							<Typography variant="h6" ml={1}>
								¿Cuándo se activa?
							</Typography>
						</Box>
						<Stack spacing={2}>
							<Box>
								<Typography variant="subtitle2" fontWeight="bold">
									1. Cambio a plan inferior (Downgrade)
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Tienes 30 días para ajustar tus elementos al nuevo límite
								</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" fontWeight="bold">
									2. Problema temporal con el pago
								</Typography>
								<Typography variant="body2" color="text.secondary">
									7-14 días típicamente para resolver el problema
								</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" fontWeight="bold">
									3. Suscripción por vencer
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Funcionalidad completa hasta la fecha de expiración
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), mt: 2 }}>
				<Typography variant="h6" gutterBottom>
					Ejemplo: Downgrade de Premium a Standard
				</Typography>
				<Stack spacing={2} mt={2}>
					<Box>
						<Typography variant="body2" color="text.secondary">
							Situación inicial:
						</Typography>
						<Typography variant="body2">• Plan Premium: 500 carpetas permitidas</Typography>
						<Typography variant="body2">• Tienes: 100 carpetas activas</Typography>
					</Box>
					<Box>
						<Typography variant="body2" color="text.secondary">
							Durante el período de gracia (30 días):
						</Typography>
						<Typography variant="body2" color="success.main">
							✅ Puedes seguir usando tus 100 carpetas
						</Typography>
						<Typography variant="body2" color="warning.main">
							⚠️ Recibes recordatorios para reducir a 50
						</Typography>
					</Box>
					<Box>
						<Typography variant="body2" color="text.secondary">
							Después del período de gracia:
						</Typography>
						<Typography variant="body2" color="error.main">
							❌ No puedes crear nuevas carpetas hasta reducir a 50
						</Typography>
					</Box>
				</Stack>
			</Paper>

			<Alert severity="info">
				<AlertTitle>💡 Durante el período de gracia</AlertTitle>
				<Typography>Aprovecha para archivar elementos antiguos, eliminar duplicados o considerar mantener tu plan actual.</Typography>
			</Alert>
		</Stack>
	);
};

const OptimizationTipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Sigue estas estrategias para optimizar tu uso de límites y almacenamiento:</Typography>

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 3, height: "100%" }}>
						<Typography variant="h6" gutterBottom color="primary">
							🎯 Estrategia de Archivado
						</Typography>
						<Stack spacing={2}>
							<Box>
								<Chip label="Más de 12 meses" size="small" color="error" />
								<Typography variant="body2" mt={1}>
									Archivar automáticamente
								</Typography>
							</Box>
							<Box>
								<Chip label="6-12 meses" size="small" color="warning" />
								<Typography variant="body2" mt={1}>
									Revisar y archivar selectivamente
								</Typography>
							</Box>
							<Box>
								<Chip label="3-6 meses" size="small" color="default" />
								<Typography variant="body2" mt={1}>
									Mantener activo si es relevante
								</Typography>
							</Box>
							<Box>
								<Chip label="Menos de 3 meses" size="small" color="success" />
								<Typography variant="body2" mt={1}>
									Mantener siempre activo
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 3, height: "100%" }}>
						<Typography variant="h6" gutterBottom color="primary">
							💾 Gestión de Archivos
						</Typography>
						<List dense>
							<ListItem>
								<ListItemIcon>
									<ArrowRight2 size={18} />
								</ListItemIcon>
								<ListItemText primary="Comprime PDFs grandes antes de subir" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<ArrowRight2 size={18} />
								</ListItemIcon>
								<ListItemText primary="Elimina archivos duplicados regularmente" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<ArrowRight2 size={18} />
								</ListItemIcon>
								<ListItemText primary="Usa enlaces externos para archivos muy grandes" />
							</ListItem>
							<ListItem>
								<ListItemIcon>
									<ArrowRight2 size={18} />
								</ListItemIcon>
								<ListItemText primary="Revisa y elimina borradores no usados" />
							</ListItem>
						</List>
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
				<Typography variant="h6" gutterBottom>
					⚠️ Diferencia importante: Archivar vs Eliminar
				</Typography>
				<TableContainer sx={{ mt: 2 }}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Acción</TableCell>
								<TableCell align="center">Libera Límite de Cantidad</TableCell>
								<TableCell align="center">Libera Almacenamiento</TableCell>
								<TableCell align="center">Se puede recuperar</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell>
									<Box display="flex" alignItems="center">
										<Archive size={18} style={{ marginRight: 4 }} />
										Archivar
									</Box>
								</TableCell>
								<TableCell align="center">
									<TickCircle size={20} color={theme.palette.success.main} />
								</TableCell>
								<TableCell align="center">
									<CloseCircle size={20} color={theme.palette.error.main} />
								</TableCell>
								<TableCell align="center">
									<TickCircle size={20} color={theme.palette.success.main} />
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>
									<Box display="flex" alignItems="center">
										<Trash size={18} style={{ marginRight: 4 }} />
										Eliminar
									</Box>
								</TableCell>
								<TableCell align="center">
									<TickCircle size={20} color={theme.palette.success.main} />
								</TableCell>
								<TableCell align="center">
									<TickCircle size={20} color={theme.palette.success.main} />
								</TableCell>
								<TableCell align="center">
									<CloseCircle size={20} color={theme.palette.error.main} />
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Alert severity="success">
				<AlertTitle>🚀 Acciones Rápidas si alcanzas el límite</AlertTitle>
				<Typography component="div">
					<ol>
						<li>Filtra elementos por "Más antiguos" y archiva masivamente</li>
						<li>Elimina archivos duplicados o borradores</li>
						<li>Considera actualizar tu plan para más espacio</li>
					</ol>
				</Typography>
			</Alert>
		</Stack>
	);
};

// ==============================|| GUÍA LÍMITES - COMPONENTE PRINCIPAL ||============================== //

interface GuideLimitsProps {
	open: boolean;
	onClose: () => void;
}

const GuideLimits = ({ open, onClose }: GuideLimitsProps) => {
	const theme = useTheme();
	const [activeStep, setActiveStep] = useState(0);

	const steps = [
		{
			title: "Introducción",
			content: <IntroductionContent />,
		},
		{
			title: "Comparación de Planes",
			content: <PlansComparisonContent />,
		},
		{
			title: "Activos vs Archivados",
			content: <ActiveVsArchivedContent />,
		},
		{
			title: "Sistema de Almacenamiento",
			content: <StorageSystemContent />,
		},
		{
			title: "Período de Gracia",
			content: <GracePeriodContent />,
		},
		{
			title: "Consejos de Optimización",
			content: <OptimizationTipsContent />,
		},
	];

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			TransitionComponent={PopupTransition}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					maxHeight: "90vh",
				},
			}}
		>
			<DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Cloud size={28} color={theme.palette.primary.main} />
					<Box>
						<Typography variant="h5">Guía de Límites y Almacenamiento</Typography>
						<Typography variant="caption" color="text.secondary">
							Comprende y optimiza tu uso de Law Analytics
						</Typography>
					</Box>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 0 }}>
				<Box sx={{ p: 3 }}>
					<Stepper activeStep={activeStep} alternativeLabel>
						{steps.map((step) => (
							<Step key={step.title}>
								<StepLabel>{step.title}</StepLabel>
							</Step>
						))}
					</Stepper>

					<StyledPaper>
						<Box sx={{ p: 3, minHeight: 400, maxHeight: "60vh", overflowY: "auto" }}>{steps[activeStep].content}</Box>
					</StyledPaper>
				</Box>
			</DialogContent>

			<DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 3, py: 2 }}>
				<Button onClick={onClose} color="secondary">
					Cerrar
				</Button>
				<Box sx={{ flex: "1 1 auto" }} />
				<Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowLeft size={18} />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" onClick={handleReset} startIcon={<Crown size={18} />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" onClick={handleNext} endIcon={<ArrowRight size={18} />}>
						Siguiente
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default GuideLimits;