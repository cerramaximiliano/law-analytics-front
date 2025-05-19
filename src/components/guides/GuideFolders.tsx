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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import {
	FolderAdd,
	ArrowRight2,
	Next,
	ArrowLeft,
	ArrowRight,
	Maximize,
	Edit,
	Trash,
	DocumentText,
	Archive,
	Box1,
	Eye,
	Sms,
	Calculator,
	Link21,
	DocumentUpload,
} from "iconsax-react";

// ==============================|| GUÍA CARPETAS - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA CARPETAS - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Esta guía te mostrará cómo utilizar el sistema de gestión de causas para administrar eficientemente los expedientes legales,
				realizar seguimiento de casos y organizar toda la información relacionada con tus asuntos jurídicos.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Aprenderás a:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Crear y gestionar causas judiciales</li>
						<li>Importar causas automáticamente desde el Poder Judicial</li>
						<li>Organizar documentos y cálculos asociados a cada causa</li>
						<li>Manejar el estado y seguimiento de tus expedientes</li>
						<li>Archivar causas finalizadas y mantener tu sistema organizado</li>
					</ul>
				</Typography>
			</Alert>
		</Stack>
	);
};

const CreationContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para crear una nueva causa en el sistema, sigue estos pasos:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en el botón "Agregar Causa" en la parte superior derecha de la tabla</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Completa el formulario con los datos básicos de la causa</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Guardar" para crear la nueva causa en el sistema</Typography>
					</Box>
				</Stack>
			</Paper>
			<Typography paragraph>
				Al crear una nueva causa, asegúrate de incluir toda la información relevante como jurisdicción, materia, parte representada y
				fechas importantes para facilitar su seguimiento posterior.
			</Typography>
		</Stack>
	);
};

const ImportContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Ahora puedes importar causas directamente desde el Poder Judicial de la Nación de forma automática:
			</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Proceso de Importación:
				</Typography>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en el botón "Agregar Causa" en la parte superior derecha de la tabla</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>En el formulario, selecciona la pestaña "Importar Automáticamente"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Selecciona la jurisdicción del Poder Judicial (ej. Civil, Laboral, Seguridad Social)</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Ingresa el número de expediente y el año</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en "Siguiente" y luego "Guardar" para importar la causa</Typography>
					</Box>
				</Stack>
			</Paper>

			<Alert severity="warning" sx={{ mt: 2 }}>
				<AlertTitle>Causas Pendientes de Verificación</AlertTitle>
				<Typography paragraph>
					Las causas importadas automáticamente aparecerán con estado <strong>"Pendiente de verificación"</strong> hasta que la
					información sea validada por el sistema. Esto se indica visualmente en la tabla de causas.
				</Typography>
				<Typography>
					Una vez que los datos hayan sido verificados y procesados, se actualizarán automáticamente con la información completa del
					expediente.
				</Typography>
			</Alert>

			<Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
				Jurisdicciones disponibles para importación automática:
			</Typography>
			<Stack spacing={1} sx={{ mb: 2 }}>
				<Typography>• Cámara Nacional de Apelaciones en lo Civil</Typography>
				<Typography>• Cámara Federal de la Seguridad Social</Typography>
				<Typography>• Cámara Nacional de Apelaciones del Trabajo</Typography>
			</Stack>

			<Typography paragraph>
				La importación automática te permite ahorrar tiempo en la carga de datos y reducir errores de transcripción, facilitando la
				gestión de múltiples expedientes.
			</Typography>
		</Stack>
	);
};

const FormFieldsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>El formulario para crear o editar una causa contiene los siguientes campos:</Typography>
			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Datos Básicos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Carátula:</strong> Nombre identificativo del expediente (ej. "Pérez c/ González s/ Daños")
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Parte:</strong> Rol que representa (Actora, Demandada, Tercero, etc.)
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Descripción:</strong> Resumen o notas sobre la causa
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Información Jurisdiccional
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Jurisdicción:</strong> Ámbito territorial (ej. CABA, Provincia de Buenos Aires)
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Fuero:</strong> Especialidad del tribunal (Civil, Laboral, Comercial, etc.)
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Materia:</strong> Tipo de proceso (Daños y Perjuicios, Despido, etc.)
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Estado y Fechas
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>
								<strong>Fecha de Inicio:</strong> Cuándo comenzó la causa
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>
								<strong>Fecha Final:</strong> Estimación de finalización o fecha de cierre
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>
								<strong>Estado:</strong> Situación actual (Nueva, En proceso, Finalizada)
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>
		</Stack>
	);
};

const ManagementContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Una vez creadas las causas, puedes gestionar tus expedientes de manera eficiente utilizando las siguientes funciones:
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Eye size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Ver Causa
							</Typography>
						</Box>
						<Typography variant="body2">
							Haz clic en el icono de ojo para desplegar una vista previa con toda la información detallada de la causa directamente en
							la tabla.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Edit size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Editar Causa
							</Typography>
						</Box>
						<Typography variant="body2">
							Utiliza el botón de edición para modificar cualquier dato de la causa, actualizar su estado o añadir nueva información.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Trash size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Eliminar Causa
							</Typography>
						</Box>
						<Typography variant="body2">
							Permite eliminar causas del sistema. Esta acción requiere confirmación y es irreversible, por lo que se recomienda
							archivar en lugar de eliminar.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Maximize size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Abrir Causa
							</Typography>
						</Box>
						<Typography variant="body2">
							Abre la vista detallada de la causa donde podrás gestionar documentos, cálculos y toda la información relacionada con el
							expediente.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
				Acciones Adicionales:
			</Typography>

			<Box sx={{ bgcolor: alpha(theme.palette.info.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<Archive size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Archivar Causas:</strong> Selecciona una o varias causas y haz clic en "Archivar" para moverlas al archivo
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Box1 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Ver Archivados:</strong> Accede a las causas archivadas y recupera aquellas que necesites
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<DocumentText size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Exportar CSV:</strong> Exporta la lista de causas como archivo CSV para su uso en otras aplicaciones
						</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

const DetailedViewContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Al abrir una causa (haciendo clic en el icono de maximizar), accederás a la vista detallada que te permite gestionar todos los
				aspectos relacionados con el expediente:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Secciones Principales
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Información General</Typography>
								<Typography variant="body2">
									Muestra todos los datos básicos de la causa con opción de edición rápida. Aquí puedes actualizar el estado, fechas y
									detalles generales.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Documentos Asociados</Typography>
								<Typography variant="body2">
									Permite subir, visualizar y gestionar todos los documentos relacionados con la causa, manteniendo un expediente
									digital completo y organizado.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Cálculos Vinculados</Typography>
								<Typography variant="body2">
									Muestra todos los cálculos (laborales, intereses, etc.) que has asociado a esta causa, permitiéndote acceder
									rápidamente a ellos.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notas y Comentarios</Typography>
								<Typography variant="body2">
									Espacio para añadir notas, recordatorios o comentarios relacionados con la causa, facilitando el seguimiento y la
									colaboración.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Vinculación de Cálculos</AlertTitle>
				<Typography paragraph>
					Puedes vincular cualquier cálculo realizado en el sistema (laboral, intereses, etc.) a una causa específica para mantener toda
					la información relacionada organizada.
				</Typography>
				<Stack direction="row" spacing={1} alignItems="center">
					<Calculator size={20} />
					<Typography>Para vincular un cálculo, selecciona la opción "Vincular a Causa" al guardar el cálculo</Typography>
				</Stack>
			</Alert>
		</Stack>
	);
};

const ArchivingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema te permite archivar causas finalizadas o inactivas para mantener tu espacio de trabajo organizado:
			</Typography>

			<Box sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Proceso de Archivado:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Selecciona una o varias causas marcando las casillas de selección en la tabla</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en el botón "Archivar" en la barra de herramientas</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Confirma la acción cuando se te solicite</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: alpha(theme.palette.success.lighter, 0.1), p: 2, borderRadius: "8px", mt: 3 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Gestión de Archivados:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Accede a las causas archivadas mediante el botón "Ver Archivados"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Selecciona las causas que deseas recuperar en la lista de archivados</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Haz clic en "Desarchivar" para restaurarlas a la lista principal</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="warning" sx={{ mt: 3 }}>
				<AlertTitle>Recuerda</AlertTitle>
				<Typography>
					Las causas archivadas permanecen en el sistema y pueden ser recuperadas en cualquier momento. El archivado es diferente a la
					eliminación, que es permanente.
				</Typography>
			</Alert>

			<Typography paragraph>
				Recomendamos usar el archivado como estrategia regular para mantener tu lista de causas activas más manejable, mejorando la
				eficiencia al centrarte en los casos que requieren atención inmediata.
			</Typography>
		</Stack>
	);
};

const PracticalTipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Para sacar el máximo provecho del sistema de gestión de causas, te ofrecemos estos consejos prácticos:
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Organización Sistemática
							</Typography>
						</Box>
						<Typography variant="body2">
							Utiliza un sistema coherente para nombrar las carátulas de tus causas, lo que facilitará su identificación y búsqueda
							posterior.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Actualización Regular
							</Typography>
						</Box>
						<Typography variant="body2">
							Mantén actualizado el estado de tus causas y añade notas relevantes después de cada novedad o actuación procesal
							importante.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Vinculación de Contenidos
							</Typography>
						</Box>
						<Typography variant="body2">
							Vincula todos los cálculos y documentos relacionados a la causa correspondiente para tener un expediente digital completo
							y centralizado.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Archivado Estratégico
							</Typography>
						</Box>
						<Typography variant="body2">
							Archiva regularmente las causas finalizadas o inactivas para mantener tu lista principal enfocada en casos activos que
							requieren atención.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1), borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Flujo de Trabajo Eficiente:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<Sms size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Utiliza la sección de notas para registrar recordatorios, plazos y observaciones importantes</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Link21 size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>
							Aprovecha la función de vincular cálculos para mantener toda la información financiera asociada a la causa
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<DocumentText size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Exporta regularmente tus causas a CSV como respaldo adicional o para compartir con colaboradores</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<DocumentUpload size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Utiliza la importación automática para ahorrar tiempo en la carga de expedientes del Poder Judicial</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Mejora Continua</AlertTitle>
				Estamos constantemente mejorando el sistema de gestión de causas. Si tienes sugerencias o detectas oportunidades de mejora,
				háznoslo saber para seguir perfeccionando la herramienta.
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA CARPETAS ||============================== //

interface GuideFoldersProps {
	open: boolean;
	onClose: () => void;
}

const GuideFolders: React.FC<GuideFoldersProps> = ({ open, onClose }) => {
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
			title: "Introducción a la Gestión de Causas",
			content: <IntroductionContent />,
		},
		{
			title: "Creación de Nuevas Causas",
			content: <CreationContent />,
		},
		{
			title: "Importación Automática de Causas",
			content: <ImportContent />,
		},
		{
			title: "Campos del Formulario de Causa",
			content: <FormFieldsContent />,
		},
		{
			title: "Gestión de Causas",
			content: <ManagementContent />,
		},
		{
			title: "Vista Detallada de Causa",
			content: <DetailedViewContent />,
		},
		{
			title: "Archivado y Organización",
			content: <ArchivingContent />,
		},
		{
			title: "Consejos Prácticos",
			content: <PracticalTipsContent />,
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
					<FolderAdd variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
					<Typography variant="h3">Guía de Gestión de Causas</Typography>
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

export default GuideFolders;