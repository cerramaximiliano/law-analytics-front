import { useState } from "react";

// material-ui
import {
	Typography,
	Button,
	Box,
	Alert,
	AlertTitle,
	Stack,
	Step,
	Stepper,
	StepLabel,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { ArrowRight2, Next, ArrowLeft, ArrowRight, Profile2User } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";

// ==============================|| CONTENIDOS DE CONTACTOS ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El módulo de Contactos te permite organizar y gestionar todas las personas y organizaciones relacionadas con tus casos legales.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Con el módulo de Contactos puedes:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Crear perfiles detallados para clientes, oponentes, testigos y otros contactos</li>
						<li>Categorizar contactos para facilitar su búsqueda y organización</li>
						<li>Vincular contactos a carpetas específicas y casos</li>
					</ul>
				</Typography>
			</Alert>
		</Stack>
	);
};

const CreationEditingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para agregar un nuevo contacto a tu base de datos:</Typography>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Creación de contacto
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Navega a la sección "Contactos" y haz clic en el botón "Nuevo Contacto"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Selecciona el tipo de contacto: Persona física o Persona jurídica/Organización</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Completa los campos obligatorios: Nombre, tipo de relación, información de contacto básica</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Edición de contactos
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Localiza el contacto en la lista y haz clic en el ícono de edición</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Modifica los campos necesarios en el formulario de edición</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

const SearchOrganizationContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>El sistema de contactos ofrece potentes herramientas de búsqueda y organización:</Typography>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Búsqueda avanzada
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Utiliza la barra de búsqueda para encontrar contactos por nombre, email o teléfono</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Filtra contactos por tipo, categoría, carpeta asociada o fecha de creación</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Categorización
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Asigna etiquetas personalizadas a los contactos para organizarlos por área legal, estado, etc.</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Crea grupos de contactos relacionados para casos o proyectos específicos</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

const LinkingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Para aprovechar al máximo el sistema, vincula tus contactos con las carpetas de casos correspondientes:
			</Typography>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Vinculación desde la vista de contacto
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Abre el perfil del contacto que deseas vincular</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Navega a la sección "Carpetas asociadas"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Vincular a carpeta" y selecciona la carpeta deseada</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Vinculación desde la vista de carpeta
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Abre la carpeta a la que deseas agregar contactos</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Navega a la pestaña "Contactos" dentro de la carpeta</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Agregar contacto" y selecciona de tu lista de contactos existentes</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

const ImportExportContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema permite importar y exportar contactos para facilitar la migración desde otros sistemas o compartir datos:
			</Typography>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Exportación de contactos
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Desde la vista principal de contactos, selecciona los contactos a exportar</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en el botón "Exportar" en la barra de herramientas</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Elige el formato deseado: CSV, Excel o vCard (para agendas)</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Importación de contactos
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Importar contactos" en la barra de herramientas</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Selecciona el archivo (CSV, Excel o vCard) con los datos a importar</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
						<Typography>Mapea los campos del archivo con los campos del sistema</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA DE CONTACTOS ||============================== //

interface GuideContactsProps {
	open: boolean;
	onClose: () => void;
}

const GuideContacts: React.FC<GuideContactsProps> = ({ open, onClose }) => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	// Reiniciar el paso activo cuando se cierra el diálogo
	const handleCloseWithReset = () => {
		onClose();
		// Reiniciamos el paso después de que se cierre el diálogo
		setTimeout(() => setActiveStep(0), 300);
	};

	const steps = [
		{
			title: "Gestión de Contactos",
			content: <IntroductionContent />,
		},
		{
			title: "Creación y Edición de Contactos",
			content: <CreationEditingContent />,
		},
		{
			title: "Búsqueda y Organización",
			content: <SearchOrganizationContent />,
		},
		{
			title: "Vinculación con Carpetas y Casos",
			content: <LinkingContent />,
		},
		{
			title: "Exportación e Importación",
			content: <ImportExportContent />,
		},
	];

	return (
		<Dialog
			open={open}
			onClose={handleCloseWithReset}
			fullScreen={fullScreen}
			maxWidth="md"
			fullWidth
			TransitionComponent={PopupTransition}
			sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}
		>
			<DialogTitle
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					p: 2,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<Profile2User variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.info.dark }} />
					<Typography variant="h3">Guía de Contactos</Typography>
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
				<Button color="error" onClick={handleCloseWithReset}>
					Cerrar
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={handleCloseWithReset} endIcon={<Next />}>
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

export default GuideContacts;