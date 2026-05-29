import React from "react";

// material-ui
import { Typography, Box, Alert, AlertTitle, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { ArrowRight2, Profile2User } from "iconsax-react";
import GuideShell from "./GuideShell";

// ==============================|| CONTENIDOS DE CONTACTOS ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
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
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
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
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
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
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
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
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
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
	const steps = [
		{ title: "Gestión de Contactos", content: <IntroductionContent /> },
		{ title: "Creación y Edición de Contactos", content: <CreationEditingContent /> },
		{ title: "Búsqueda y Organización", content: <SearchOrganizationContent /> },
		{ title: "Vinculación con Carpetas y Casos", content: <LinkingContent /> },
		{ title: "Exportación e Importación", content: <ImportExportContent /> },
	];

	return (
		<GuideShell
			open={open}
			onClose={onClose}
			icon={<Profile2User size={18} variant="Bulk" />}
			eyebrow="Guía"
			title="Guía de Contactos"
			subtitle="Aprendé a gestionar clientes, oponentes y testigos"
			steps={steps}
		/>
	);
};

export default GuideContacts;
