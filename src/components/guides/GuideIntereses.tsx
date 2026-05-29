import React from "react";

// material-ui
import { Typography, Box, Alert, AlertTitle, Stack, Paper, Grid, styled, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { Coin, ArrowRight2, Copy, Sms, Printer, Save2, DocumentText, Link21 } from "iconsax-react";
import GuideShell from "./GuideShell";

// ==============================|| GUÍA INTERESES - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA INTERESES - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				Esta guía te mostrará cómo utilizar la calculadora de intereses para generar, guardar y gestionar distintos tipos de cálculos con
				diferentes tasas.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Aprenderás a:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Acceder y completar el formulario de cálculo de intereses</li>
						<li>Seleccionar entre diferentes tipos de tasas disponibles</li>
						<li>Interpretar los resultados y la metodología aplicada</li>
						<li>Exportar, guardar y gestionar tus cálculos</li>
					</ul>
				</Typography>
			</Alert>
		</Stack>
	);
};

const FormContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Para comenzar con un cálculo de intereses, sigue estos pasos:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Accede a la calculadora seleccionando la tarjeta "Intereses" en la sección "Cálculos disponibles"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Se abrirá la pantalla de cálculo con un formulario de entrada</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Completa los datos requeridos: reclamante, reclamado, fechas inicial y final, tipo de tasa y capital</Typography>
					</Box>
				</Stack>
			</Paper>
			<Typography paragraph>Todos los campos marcados con asterisco (*) son obligatorios para poder realizar el cálculo.</Typography>
		</Stack>
	);
};

const RatesContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>La calculadora de intereses permite seleccionar entre diferentes tipos de tasas:</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Tasas más comunes
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Tasa Pasiva BCRA:</strong> Tasa pasiva publicada por el Banco Central de la República Argentina
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Tasa Activa Banco Nación:</strong> Tasa activa para operaciones de descuento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>CER (Coeficiente de Estabilización de Referencia):</strong> Refleja la variación del IPC
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Tasas específicas del fuero laboral
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Tasa Activa CNAT Acta 2601:</strong> Tasa establecida por la Cámara Nacional de Apelaciones del Trabajo
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Tasa Activa CNAT Acta 2658:</strong> Actualización posterior de la Cámara Laboral
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info">
				<AlertTitle>Recomendación</AlertTitle>
				Al seleccionar una tasa, el sistema mostrará automáticamente el rango de fechas disponible para esa tasa específica.
			</Alert>
		</Stack>
	);
};

const MethodsContent = () => {
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				La calculadora de intereses utiliza dos métodos principales para calcular los intereses según el tipo de tasa seleccionada:
			</Typography>

			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
					Método de Indexación
				</Typography>
				<Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: "4px" }}>
					<Typography variant="body2">
						<strong>Aplicado a:</strong> CER, ICL y otros índices de ajuste
					</Typography>
					<Typography variant="body2" mt={1}>
						<strong>Fórmula:</strong> Capital × (Valor final / Valor inicial)
					</Typography>
					<Typography variant="body2" mt={1}>
						Compara el valor del índice al inicio y al final del período, aplicando la variación proporcional al capital.
					</Typography>
				</Box>
			</Paper>

			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
					Método de Interés Diario
				</Typography>
				<Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: "4px" }}>
					<Typography variant="body2">
						<strong>Aplicado a:</strong> Tasas Pasivas y Activas (BCRA, BNA, CNAT)
					</Typography>
					<Typography variant="body2" mt={1}>
						<strong>Fórmula:</strong> Capital × (1 + Σ [Tasa diaria × días])
					</Typography>
					<Typography variant="body2" mt={1}>
						Calcula los intereses acumulando la tasa diaria para cada período. La tasa diaria se obtiene dividiendo la tasa anual por 365.
					</Typography>
				</Box>
			</Paper>

			<Typography paragraph>
				En ambos casos, el sistema obtiene los datos oficiales publicados por los organismos correspondientes para cada fecha del período
				seleccionado.
			</Typography>
		</Stack>
	);
};

const ResultsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				Después de realizar el cálculo, se mostrará una pantalla de resultados con la siguiente información:
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Detalles del Cálculo
							</Typography>
						</Box>
						<Typography variant="body2">Muestra los datos ingresados como fechas, tipo de tasa seleccionada y capital base.</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.success.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Metodología de Cálculo
							</Typography>
						</Box>
						<Typography variant="body2">
							Muestra información sobre el método aplicado (indexación o interés diario), coeficiente calculado y otros parámetros técnicos.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.secondary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.secondary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Resultados
							</Typography>
						</Box>
						<Typography variant="body2">
							Muestra el capital base, los intereses generados y el capital actualizado (suma de capital e intereses).
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Ver Tasas
							</Typography>
						</Box>
						<Typography variant="body2">
							Botón que permite visualizar en detalle los valores de las tasas utilizadas en cada período del cálculo.
						</Typography>
					</Paper>
				</Grid>
			</Grid>
		</Stack>
	);
};

const ManagementContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Una vez obtenidos los resultados, puedes realizar las siguientes acciones:</Typography>

			<Box sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Opciones de exportación:
				</Typography>
				<Stack spacing={1}>
					<Box display="flex" alignItems="center">
						<Copy size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Copiar al portapapeles:</strong> Copia el resultado en formato texto para pegarlo donde necesites
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Sms size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Enviar por email:</strong> Envía los resultados por correo electrónico
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Printer size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Imprimir:</strong> Genera una versión imprimible del resultado
						</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: alpha(theme.palette.success.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Gestión de cálculos:
				</Typography>
				<Stack spacing={1}>
					<Box display="flex" alignItems="center">
						<Save2 size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>
							<strong>Guardar cálculo:</strong> Guarda el cálculo en tu cuenta para acceder posteriormente
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<DocumentText size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>
							<strong>Ver cálculos guardados:</strong> Accede a todos tus cálculos de intereses guardados desde la pestaña "Guardados"
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Link21 size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>
							<strong>Vincular a carpetas:</strong> Asocia el cálculo a un expediente o carpeta específica
						</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="info">
				<AlertTitle>Recordatorio</AlertTitle>
				Para generar un nuevo cálculo, utiliza el botón "Nueva Liquidación" que aparece en la pantalla de resultados.
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA INTERESES ||============================== //

interface GuideInteresesProps {
	open: boolean;
	onClose: () => void;
}

const GuideIntereses: React.FC<GuideInteresesProps> = ({ open, onClose }) => {
	const steps = [
		{ title: "Bienvenido a la Calculadora de Intereses", content: <IntroductionContent /> },
		{ title: "Acceso y Formulario Básico", content: <FormContent /> },
		{ title: "Tipos de Tasas Disponibles", content: <RatesContent /> },
		{ title: "Métodos de Cálculo Aplicados", content: <MethodsContent /> },
		{ title: "Interpretación de Resultados", content: <ResultsContent /> },
		{ title: "Gestión y Exportación de Cálculos", content: <ManagementContent /> },
	];

	return (
		<GuideShell
			open={open}
			onClose={onClose}
			icon={<Coin size={18} variant="Bulk" />}
			eyebrow="Guía"
			title="Guía de Calculadora de Intereses"
			subtitle="Tasas, métodos de cálculo y exportación"
			steps={steps}
		/>
	);
};

export default GuideIntereses;
