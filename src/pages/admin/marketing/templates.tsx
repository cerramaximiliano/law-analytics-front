import { useState, useEffect } from "react";
import axios from "axios";

// material-ui
import {
	Box,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Switch,
	Tab,
	Tabs,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,

} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { Add, Edit2, Eye, Trash, AddCircle, Send, Mobile, Monitor, MouseSquare, Copy } from "iconsax-react";
import { useSnackbar } from "notistack";
import AnimateButton from "components/@extended/AnimateButton";

// types
interface EmailTemplate {
	_id: string;
	category: string;
	name: string;
	subject: string;
	htmlBody: string;
	textBody: string;
	description: string;
	variables: string[];
	isActive: boolean;
	lastModifiedBy?: string;
	createdAt: string;
	updatedAt: string;
}

interface NewEmailTemplate {
	category: string;
	name: string;
	subject: string;
	htmlBody: string;
	textBody: string;
	description: string;
	variables: string[];
	isActive: boolean;
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: any;
	value: any;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`template-tabpanel-${index}`}
			aria-labelledby={`template-tab-${index}`}
			style={{ height: "100%" }}
			{...other}
		>
			{value === index && <Box sx={{ p: 0, height: "100%" }}>{children}</Box>}
		</div>
	);
}

// Category display mapping
const categoryDisplay: Record<string, string> = {
	subscription: "Suscripción",
	auth: "Autenticación",
	support: "Soporte",
	tasks: "Tareas",
	documents: "Documentos",
	notification: "Notificación",
	welcome: "Bienvenida",
	calculadora: "Calculadora",
	gestionCausas: "Gestión de Causas",
	gestionContactos: "Gestión de Contactos",
	gestionCalendario: "Gestión de Calendario",
	secuenciaOnboarding: "Onboarding",
	promotional: "Promocional",
};

// Default blank template HTML
const defaultHtmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #777777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/djswoawfj/image/upload/v1709646644/lawanalytics/logo_transparent_v2_yjlbyj.png" alt="Law Analytics Logo" class="logo">
    </div>
    <div class="content">
      <h2>Título del Email</h2>
      <p>Hola \${nombre},</p>
      <p>Este es el contenido del email. Aquí puedes incluir toda la información que necesites comunicar.</p>
      <p>Atentamente,<br>El equipo de Law Analytics</p>
    </div>
    <div class="footer">
      <p>© \${year} Law Analytics. Todos los derechos reservados.</p>
      <p>Dirección: \${direccion}</p>
    </div>
  </div>
</body>
</html>`;

// Default blank template text
const defaultTextTemplate = `Título del Email

Hola \${nombre},

Este es el contenido del email. Aquí puedes incluir toda la información que necesites comunicar.

Atentamente,
El equipo de Law Analytics

© \${year} Law Analytics. Todos los derechos reservados.
Dirección: \${direccion}`;

// ==============================|| ADMIN - EMAIL TEMPLATES ||============================== //

const EmailTemplates = () => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	// State for templates data
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Device type enum
	enum DeviceType {
		Desktop = "desktop",
		Tablet = "tablet",
		Mobile = "mobile",
	}

	// Device dimensions (in px)
	const deviceDimensions = {
		[DeviceType.Desktop]: { width: "100%", height: "100%" },
		[DeviceType.Tablet]: { width: "768px", height: "1024px" },
		[DeviceType.Mobile]: { width: "375px", height: "667px" },
	};

	// State for detail modal
	const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
	const [detailOpen, setDetailOpen] = useState<boolean>(false);
	const [viewTab, setViewTab] = useState<number>(0);
	const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.Desktop);

	// State for create template modal
	const [createOpen, setCreateOpen] = useState<boolean>(false);
	const [createViewTab, setCreateViewTab] = useState<number>(0);
	const [creating, setCreating] = useState<boolean>(false);

	// State for edit template modal
	const [editOpen, setEditOpen] = useState<boolean>(false);
	const [editViewTab, setEditViewTab] = useState<number>(0);
	const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
	const [updating, setUpdating] = useState<boolean>(false);

	// State for activation/deactivation confirmation
	const [activationOpen, setActivationOpen] = useState<boolean>(false);
	const [templateToToggle, setTemplateToToggle] = useState<EmailTemplate | null>(null);
	const [toggling, setToggling] = useState<boolean>(false);

	// State for email sending
	const [sendEmailOpen, setSendEmailOpen] = useState<boolean>(false);
	const [templateToSend, setTemplateToSend] = useState<EmailTemplate | null>(null);
	const [sending, setSending] = useState<boolean>(false);
	const [emailData, setEmailData] = useState({
		email: "",
		variables: {} as Record<string, string>,
	});
	const [newTemplate, setNewTemplate] = useState<NewEmailTemplate>({
		name: "",
		category: "notification",
		subject: "",
		htmlBody: defaultHtmlTemplate,
		textBody: defaultTextTemplate,
		description: "",
		variables: ["nombre", "year", "direccion"],
		isActive: true,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// State for pagination
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Filter state
	const [filter, setFilter] = useState<string>("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	// Fetch email templates
	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/email/templates`);
				if (response.data.success) {
					setTemplates(response.data.data);
				} else {
					setError("Error fetching templates");
				}
			} catch (err: any) {
				setError(err.message || "Error fetching templates");
			} finally {
				setLoading(false);
			}
		};

		fetchTemplates();
	}, []);

	// Pagination handlers
	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	// Detail modal handlers
	const handleOpenDetail = (template: EmailTemplate) => {
		setSelectedTemplate(template);
		setDetailOpen(true);
		setViewTab(0); // Reset to rendered view
		setDeviceType(DeviceType.Desktop); // Reset to desktop view
	};

	const handleCloseDetail = () => {
		setDetailOpen(false);
		setSelectedTemplate(null);
	};

	const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
		setViewTab(newValue);
	};

	// Handle device type change
	const handleDeviceTypeChange = (type: DeviceType) => {
		setDeviceType(type);
	};

	// Create template modal handlers
	const handleOpenCreate = () => {
		setCreateOpen(true);
		setCreateViewTab(0);
		// Reset form
		setNewTemplate({
			name: "",
			category: "notification",
			subject: "",
			htmlBody: defaultHtmlTemplate,
			textBody: defaultTextTemplate,
			description: "",
			variables: ["nombre", "year", "direccion"],
			isActive: true,
		});
		setErrors({});
	};

	const handleCloseCreate = () => {
		setCreateOpen(false);
	};

	const handleCreateChangeTab = (event: React.SyntheticEvent, newValue: number) => {
		setCreateViewTab(newValue);
	};

	// Edit template modal handlers
	const handleOpenEdit = (template: EmailTemplate) => {
		setEditTemplate(template);
		setEditOpen(true);
		setEditViewTab(0);
		setErrors({});
	};

	const handleCloseEdit = () => {
		setEditOpen(false);
		setEditTemplate(null);
	};

	const handleEditChangeTab = (event: React.SyntheticEvent, newValue: number) => {
		setEditViewTab(newValue);
	};

	// Activation/Deactivation handlers
	const handleOpenActivationDialog = (template: EmailTemplate) => {
		setTemplateToToggle(template);
		setActivationOpen(true);
	};

	const handleCloseActivationDialog = () => {
		setActivationOpen(false);
		setTemplateToToggle(null);
	};

	const handleToggleActivation = async () => {
		if (!templateToToggle) return;

		setToggling(true);

		try {
			const url = templateToToggle.isActive
				? `${process.env.REACT_APP_BASE_URL}/api/email/templates/deactivate/${templateToToggle._id}`
				: `${process.env.REACT_APP_BASE_URL}/api/email/templates/activate/${templateToToggle._id}`;

			const response = await axios.post(url);

			if (response.data.success) {
				// Use the updated template directly from the API response
				const updatedTemplate = response.data.data;

				// Update template in the list using the response data
				setTemplates(templates.map((template) => (template._id === templateToToggle._id ? updatedTemplate : template)));

				// Close dialog
				setActivationOpen(false);
				setTemplateToToggle(null);

				// Show success message
				const action = templateToToggle.isActive ? "desactivada" : "activada";
				enqueueSnackbar(`Plantilla ${action} con éxito`, { variant: "success" });
			} else {
				enqueueSnackbar(response.data.message || `Error al cambiar estado de la plantilla`, { variant: "error" });
			}
		} catch (err: any) {
			console.error("Error toggling template status:", err);
			enqueueSnackbar(err.message || `Error al cambiar estado de la plantilla`, { variant: "error" });
		} finally {
			setToggling(false);
		}
	};

	// Email sending handlers
	const handleOpenSendEmail = (template: EmailTemplate) => {
		setTemplateToSend(template);
		setSendEmailOpen(true);

		// Initialize variables object with empty values for each template variable
		const initialVariables: Record<string, string> = {};
		template.variables.forEach((variable) => {
			initialVariables[variable] = "";
		});

		setEmailData({
			email: "",
			variables: initialVariables,
		});
	};

	const handleCloseSendEmail = () => {
		setSendEmailOpen(false);
		setTemplateToSend(null);
	};

	const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setEmailData({
			...emailData,
			email: event.target.value,
		});
	};

	const handleVariableChange = (variable: string, value: string) => {
		setEmailData({
			...emailData,
			variables: {
				...emailData.variables,
				[variable]: value,
			},
		});
	};

	const handleSendEmail = async () => {
		if (!templateToSend) return;

		// Validate email
		if (!emailData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.email)) {
			enqueueSnackbar("Por favor, ingresa un email válido", { variant: "error" });
			return;
		}

		setSending(true);

		try {
			const payload = {
				email: emailData.email,
				templateId: templateToSend._id,
				variables: emailData.variables,
			};

			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-with-template`, payload);

			if (response.data.success) {
				// Close dialog
				setSendEmailOpen(false);
				setTemplateToSend(null);

				// Show success message
				enqueueSnackbar("Email enviado con éxito", { variant: "success" });
			} else {
				enqueueSnackbar(response.data.message || "Error al enviar el email", { variant: "error" });
			}
		} catch (err: any) {
			console.error("Error sending email:", err);
			enqueueSnackbar(err.message || "Error al enviar el email", { variant: "error" });
		} finally {
			setSending(false);
		}
	};

	// Handle edit template field changes
	const handleEditTemplateChange = (field: keyof EmailTemplate, value: string | boolean | string[]) => {
		if (editTemplate) {
			setEditTemplate({
				...editTemplate,
				[field]: value,
			});

			// Clear error for the field
			if (errors[field]) {
				setErrors({
					...errors,
					[field]: "",
				});
			}
		}
	};

	// Handle template field changes
	const handleTemplateChange = (field: keyof NewEmailTemplate, value: string | boolean | string[]) => {
		setNewTemplate({
			...newTemplate,
			[field]: value,
		});

		// Clear error for the field
		if (errors[field]) {
			setErrors({
				...errors,
				[field]: "",
			});
		}
	};

	// Handle variable changes
	const handleAddVariable = () => {
		const variableName = document.getElementById("new-variable") as HTMLInputElement;
		if (variableName && variableName.value) {
			// Check if variable already exists
			if (newTemplate.variables.includes(variableName.value)) {
				enqueueSnackbar("Esta variable ya existe", { variant: "warning" });
				return;
			}

			// Add variable
			setNewTemplate({
				...newTemplate,
				variables: [...newTemplate.variables, variableName.value],
			});

			// Clear input
			variableName.value = "";
		}
	};

	const handleRemoveVariable = (variable: string) => {
		setNewTemplate({
			...newTemplate,
			variables: newTemplate.variables.filter((v) => v !== variable),
		});
	};

	// Validate form
	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!newTemplate.name.trim()) {
			newErrors.name = "El nombre es obligatorio";
		}

		if (!newTemplate.subject.trim()) {
			newErrors.subject = "El asunto es obligatorio";
		}

		if (!newTemplate.htmlBody.trim()) {
			newErrors.htmlBody = "El cuerpo HTML es obligatorio";
		}

		if (!newTemplate.textBody.trim()) {
			newErrors.textBody = "El cuerpo de texto es obligatorio";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Submit new template
	const handleCreateTemplate = async () => {
		if (!validateForm()) {
			return;
		}

		setCreating(true);

		try {
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/templates`, newTemplate);

			if (response.data.success) {
				// Add the new template from the API response to the list
				// This ensures we have the complete and accurate data including _id, timestamps, etc.
				const createdTemplate = response.data.data;
				setTemplates([...templates, createdTemplate]);

				// Close modal
				setCreateOpen(false);

				// Show success message
				enqueueSnackbar("Plantilla creada con éxito", { variant: "success" });
			} else {
				enqueueSnackbar(response.data.message || "Error al crear la plantilla", { variant: "error" });
			}
		} catch (err: any) {
			console.error("Error creating template:", err);
			enqueueSnackbar(err.message || "Error al crear la plantilla", { variant: "error" });
		} finally {
			setCreating(false);
		}
	};

	// Validate edit form
	const validateEditForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!editTemplate) return false;

		if (!editTemplate.subject.trim()) {
			newErrors.subject = "El asunto es obligatorio";
		}

		if (!editTemplate.htmlBody.trim()) {
			newErrors.htmlBody = "El cuerpo HTML es obligatorio";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Submit edited template
	const handleUpdateTemplate = async () => {
		if (!validateEditForm() || !editTemplate) {
			return;
		}

		setUpdating(true);

		try {
			// Prepare data to send (only the fields that can be updated)
			const updateData = {
				subject: editTemplate.subject,
				htmlBody: editTemplate.htmlBody,
				description: editTemplate.description,
				isActive: editTemplate.isActive,
			};

			const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/email/templates/${editTemplate._id}`, updateData);

			if (response.data.success) {
				// Use the returned template data from the API response instead of our local update data
				// This ensures we have the most accurate data without needing to refetch
				const updatedTemplate = response.data.data;

				// Update the template in the list with the complete updated template from the API
				setTemplates(templates.map((template) => (template._id === editTemplate._id ? updatedTemplate : template)));

				// Close modal
				setEditOpen(false);

				// Show success message
				enqueueSnackbar("Plantilla actualizada con éxito", { variant: "success" });
			} else {
				enqueueSnackbar(response.data.message || "Error al actualizar la plantilla", { variant: "error" });
			}
		} catch (err: any) {
			console.error("Error updating template:", err);
			enqueueSnackbar(err.message || "Error al actualizar la plantilla", { variant: "error" });
		} finally {
			setUpdating(false);
		}
	};

	// Filter handlers
	const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFilter(event.target.value);
		setPage(0);
	};

	const handleCategoryFilterChange = (category: string) => {
		setCategoryFilter(category);
		setPage(0);
	};

	// Filter templates
	const filteredTemplates = templates.filter(
		(template) =>
			(categoryFilter === "all" || template.category === categoryFilter) &&
			(template.name.toLowerCase().includes(filter.toLowerCase()) ||
				template.subject.toLowerCase().includes(filter.toLowerCase()) ||
				template.description.toLowerCase().includes(filter.toLowerCase())),
	);

	// Categories for filter
	const categories = ["all", ...new Set(templates.map((template) => template.category))];

	return (
		<MainCard>
			<Box sx={{ mb: 2 }}>
				<Grid container alignItems="center" justifyContent="space-between">
					<Grid item>
						<Typography variant="h3">Plantillas de Email</Typography>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" startIcon={<Add />} sx={{ textTransform: "none" }} onClick={handleOpenCreate}>
							Nueva plantilla
						</Button>
					</Grid>
				</Grid>
			</Box>

			<MainCard content={false}>
				<Box sx={{ p: 2 }}>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								value={filter}
								onChange={handleFilterChange}
								label="Buscar plantilla"
								placeholder="Buscar por nombre, asunto o descripción"
								size="small"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
								{categories.map((category) => (
									<Chip
										key={category}
										label={category === "all" ? "Todas" : categoryDisplay[category] || category}
										onClick={() => handleCategoryFilterChange(category)}
										color={categoryFilter === category ? "primary" : "default"}
										variant={categoryFilter === category ? "filled" : "outlined"}
										size="small"
									/>
								))}
							</Box>
						</Grid>
					</Grid>
				</Box>
				<Divider />

				{loading ? (
					<Box sx={{ p: 3, textAlign: "center" }}>
						<Typography>Cargando plantillas...</Typography>
					</Box>
				) : error ? (
					<Box sx={{ p: 3, textAlign: "center" }}>
						<Typography color="error">{error}</Typography>
					</Box>
				) : (
					<>
						<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
							<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
								<TableHead>
									<TableRow>
										<TableCell>Nombre</TableCell>
										<TableCell>Categoría</TableCell>
										<TableCell>Asunto</TableCell>
										<TableCell>Descripción</TableCell>
										<TableCell>Estado</TableCell>
										<TableCell>Última modificación</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredTemplates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((template) => (
										<TableRow hover key={template._id} tabIndex={-1}>
											<TableCell>
												<Typography variant="subtitle2">{template.name}</Typography>
											</TableCell>
											<TableCell>{categoryDisplay[template.category] || template.category}</TableCell>
											<TableCell>{template.subject}</TableCell>
											<TableCell>{template.description}</TableCell>
											<TableCell>
												<Chip
													label={template.isActive ? "Activa" : "Inactiva"}
													color={template.isActive ? "success" : "default"}
													size="small"
												/>
											</TableCell>
											<TableCell>{new Date(template.updatedAt).toLocaleDateString()}</TableCell>
											<TableCell align="center">
												<Stack direction="row" spacing={1} justifyContent="center">
													<IconButton aria-label="ver" size="small" color="info" onClick={() => handleOpenDetail(template)}>
														<Eye size={18} />
													</IconButton>
													<IconButton aria-label="editar" size="small" color="primary" onClick={() => handleOpenEdit(template)}>
														<Edit2 size={18} />
													</IconButton>
													<IconButton
														aria-label="enviar email"
														size="small"
														color="secondary"
														onClick={() => handleOpenSendEmail(template)}
														title="Enviar email con esta plantilla"
														disabled={!template.isActive}
													>
														<Send size={18} />
													</IconButton>
													<IconButton
														aria-label={template.isActive ? "desactivar" : "activar"}
														size="small"
														color={template.isActive ? "error" : "success"}
														onClick={() => handleOpenActivationDialog(template)}
														title={template.isActive ? "Desactivar plantilla" : "Activar plantilla"}
													>
														<Trash size={18} />
													</IconButton>
												</Stack>
											</TableCell>
										</TableRow>
									))}
									{filteredTemplates.length === 0 && (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
												<Typography variant="subtitle1">No hay plantillas disponibles</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>

						<TablePagination
							rowsPerPageOptions={[5, 10, 25]}
							component="div"
							count={filteredTemplates.length}
							rowsPerPage={rowsPerPage}
							page={page}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							labelRowsPerPage="Filas por página:"
							labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
						/>
					</>
				)}
			</MainCard>

			{/* Template Stats */}
			<Grid container spacing={3} sx={{ mt: 2 }}>
				<Grid item xs={12} md={6} lg={4}>
					<Card>
						<CardHeader title="Estadísticas de plantillas" />
						<CardContent>
							<Stack spacing={2}>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Total de plantillas
									</Typography>
									<Typography variant="h4">{templates.length}</Typography>
								</Box>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Plantillas activas
									</Typography>
									<Typography variant="h4">{templates.filter((t) => t.isActive).length}</Typography>
								</Box>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Categorías
									</Typography>
									<Typography variant="h4">{new Set(templates.map((t) => t.category)).size}</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={6} lg={8}>
					<Card>
						<CardHeader title="Plantillas por categoría" />
						<CardContent>
							<Grid container spacing={2}>
								{Object.entries(
									templates.reduce((acc: Record<string, number>, template) => {
										acc[template.category] = (acc[template.category] || 0) + 1;
										return acc;
									}, {}),
								).map(([category, count]) => (
									<Grid item xs={6} sm={4} key={category}>
										<Box
											sx={{
												p: 2.5,
												bgcolor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.grey[50],
												borderRadius: 2,
												textAlign: "center",
											}}
										>
											<Typography variant="h4">{count}</Typography>
											<Typography variant="subtitle2" sx={{ mt: 1 }}>
												{categoryDisplay[category] || category}
											</Typography>
										</Box>
									</Grid>
								))}
							</Grid>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Template Detail Dialog */}
			<Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="lg" fullWidth>
				{selectedTemplate && (
					<>
						<DialogTitle>
							{selectedTemplate.name}
							<Typography variant="body2" color="textSecondary">
								{categoryDisplay[selectedTemplate.category] || selectedTemplate.category}
							</Typography>
						</DialogTitle>
						<Divider />
						<Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
							<Tabs value={viewTab} onChange={handleChangeTab} aria-label="template view tabs">
								<Tab label="Vista renderizada" id="template-tab-0" aria-controls="template-tabpanel-0" />
								<Tab label="Código HTML" id="template-tab-1" aria-controls="template-tabpanel-1" />
								<Tab label="Texto plano" id="template-tab-2" aria-controls="template-tabpanel-2" />
							</Tabs>
						</Box>
						<DialogContent sx={{ p: 0, height: 500 }}>
							<TabPanel value={viewTab} index={0}>
								<Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
									<Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<Box>
											<Typography variant="subtitle1">Asunto:</Typography>
											<Typography variant="body1">{selectedTemplate.subject}</Typography>
										</Box>

										{/* Device selector */}
										<Box>
											<ButtonGroup aria-label="device view selector">
												<Tooltip title="Vista Desktop">
													<Button
														variant={deviceType === DeviceType.Desktop ? "contained" : "outlined"}
														onClick={() => handleDeviceTypeChange(DeviceType.Desktop)}
														aria-label="desktop view"
													>
														<Monitor size={18} />
													</Button>
												</Tooltip>
												<Tooltip title="Vista Tablet">
													<Button
														variant={deviceType === DeviceType.Tablet ? "contained" : "outlined"}
														onClick={() => handleDeviceTypeChange(DeviceType.Tablet)}
														aria-label="tablet view"
													>
														<MouseSquare size={18} />
													</Button>
												</Tooltip>
												<Tooltip title="Vista Móvil">
													<Button
														variant={deviceType === DeviceType.Mobile ? "contained" : "outlined"}
														onClick={() => handleDeviceTypeChange(DeviceType.Mobile)}
														aria-label="mobile view"
													>
														<Mobile size={18} />
													</Button>
												</Tooltip>
											</ButtonGroup>
										</Box>
									</Box>
									<Typography variant="subtitle1">Contenido:</Typography>
									<Box
										sx={{
											mt: 1,
											border: 1,
											borderColor: "divider",
											borderRadius: 1,
											p: 2,
											height: "calc(100% - 120px)",
											overflow: "auto",
											display: "flex",
											justifyContent: "center",
											"& .preview-container": {
												width: deviceDimensions[deviceType].width,
												height: deviceDimensions[deviceType].height,
												transition: "width 0.3s, height 0.3s",
												transform: deviceType !== DeviceType.Desktop ? "scale(0.8)" : "none",
												transformOrigin: "top center",
												boxShadow: deviceType !== DeviceType.Desktop ? "0 0 10px rgba(0,0,0,0.1)" : "none",
												overflow: "hidden",
												borderRadius: deviceType !== DeviceType.Desktop ? "8px" : "0",
											},
											"& iframe": {
												border: "none",
												width: "100%",
												height: "100%",
											},
										}}
									>
										<Box className="preview-container">
											<iframe
												title="Email Preview"
												srcDoc={`
													<!DOCTYPE html>
													<html>
														<head>
															<meta http-equiv="Content-Security-Policy"
																content="default-src 'self';
																img-src * data: https:;
																style-src 'unsafe-inline' 'self';">
															<meta name="viewport" content="width=device-width, initial-scale=1.0">
															<style>
																body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
															</style>
														</head>
														<body>${selectedTemplate.htmlBody}</body>
													</html>
												`}
												sandbox="allow-same-origin allow-scripts"
												referrerPolicy="no-referrer"
											></iframe>
										</Box>
									</Box>
								</Box>
							</TabPanel>
							<TabPanel value={viewTab} index={1}>
								<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2, mt: 2 }}>
									<IconButton

										onClick={() => {
											navigator.clipboard.writeText(selectedTemplate.htmlBody);
											enqueueSnackbar("Código HTML copiado al portapapeles", { variant: "success" });
										}}
									>
										<Copy />
									</IconButton>
								</Box>
								<Box
									component="pre"
									sx={{
										p: 2,
										m: 0,
										height: "calc(100% - 60px)",
										overflow: "auto",
										bgcolor: theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
										borderRadius: 0,
										"& code": {
											fontFamily: "monospace",
											fontSize: "0.875rem",
											display: "block",
										},
									}}
								>
									<code>{selectedTemplate.htmlBody}</code>
								</Box>
							</TabPanel>
							<TabPanel value={viewTab} index={2}>
								<Box
									component="pre"
									sx={{
										p: 2,
										m: 0,
										height: "100%",
										overflow: "auto",
										bgcolor: theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
										borderRadius: 0,
										"& code": {
											fontFamily: "monospace",
											fontSize: "0.875rem",
											display: "block",
										},
									}}
								>
									<code>{selectedTemplate.textBody}</code>
								</Box>
							</TabPanel>
						</DialogContent>
						<DialogActions>
							{selectedTemplate.variables.length > 0 && (
								<Box sx={{ mr: "auto", pl: 2 }}>
									<Typography variant="caption" color="textSecondary">
										Variables: {selectedTemplate.variables.join(", ")}
									</Typography>
								</Box>
							)}
							<Button onClick={handleCloseDetail}>Cerrar</Button>
							<Button
								color="secondary"
								startIcon={<Send />}
								onClick={() => {
									handleCloseDetail();
									handleOpenSendEmail(selectedTemplate);
								}}
								disabled={!selectedTemplate?.isActive}
								sx={{ mr: 1 }}
							>
								Enviar email
							</Button>
							<Button color="primary" startIcon={<Edit2 />} onClick={() => handleOpenEdit(selectedTemplate)}>
								Editar
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>

			{/* Edit Template Dialog */}
			<Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="lg" fullWidth>
				{editTemplate && (
					<>
						<DialogTitle>
							Editar Plantilla: {editTemplate.name}
							<Typography variant="body2" color="textSecondary">
								{categoryDisplay[editTemplate.category] || editTemplate.category}
							</Typography>
						</DialogTitle>
						<Divider />
						<DialogContent sx={{ p: 3 }}>
							<Grid container spacing={3}>
								{/* Basic information */}
								<Grid item xs={12} md={6}>
									<TextField
										label="Asunto"
										fullWidth
										value={editTemplate.subject}
										onChange={(e) => handleEditTemplateChange("subject", e.target.value)}
										error={!!errors.subject}
										helperText={errors.subject}
										required
										sx={{ mb: 2 }}
									/>

									<TextField
										label="Descripción"
										fullWidth
										value={editTemplate.description}
										onChange={(e) => handleEditTemplateChange("description", e.target.value)}
										multiline
										rows={2}
										sx={{ mb: 2 }}
									/>

									<FormControlLabel
										control={
											<Switch
												checked={editTemplate.isActive}
												onChange={(e) => handleEditTemplateChange("isActive", e.target.checked)}
												color="primary"
											/>
										}
										label="Activa"
									/>

									{/* Variables section (read-only) */}
									<Box sx={{ mt: 2 }}>
										<Typography variant="subtitle1" sx={{ mb: 1 }}>
											Variables disponibles
										</Typography>
										<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
											{editTemplate.variables.map((variable) => (
												<Chip key={variable} label={variable} color="primary" variant="outlined" />
											))}
										</Box>
									</Box>
								</Grid>

								{/* Template content and preview */}
								<Grid item xs={12} md={6}>
									<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
										<Tabs value={editViewTab} onChange={handleEditChangeTab} aria-label="template edit tabs">
											<Tab label="Vista previa" id="edit-tab-0" aria-controls="edit-tabpanel-0" />
											<Tab label="Código HTML" id="edit-tab-1" aria-controls="edit-tabpanel-1" />
										</Tabs>
									</Box>

									<TabPanel value={editViewTab} index={0}>
										<Box sx={{ height: "450px", overflow: "auto" }}>
											<Box sx={{ mb: 2 }}>
												<Typography variant="subtitle1">Asunto:</Typography>
												<Typography variant="body1">{editTemplate.subject || "(Sin asunto)"}</Typography>
											</Box>
											<Typography variant="subtitle1">Contenido:</Typography>
											<Box
												sx={{
													mt: 1,
													border: 1,
													borderColor: "divider",
													borderRadius: 1,
													p: 2,
													height: "calc(100% - 80px)",
													overflow: "auto",
													"& iframe": {
														border: "none",
														width: "100%",
														height: "100%",
													},
												}}
											>
												<iframe
													title="Email Preview"
													srcDoc={`
														<!DOCTYPE html>
														<html>
															<head>
																<meta http-equiv="Content-Security-Policy" 
																	content="default-src 'self'; 
																	img-src * data: https:; 
																	style-src 'unsafe-inline' 'self';">
																<style>
																	body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
																</style>
															</head>
															<body>${editTemplate.htmlBody}</body>
														</html>
													`}
													sandbox="allow-same-origin allow-scripts"
													referrerPolicy="no-referrer"
												></iframe>
											</Box>
										</Box>
									</TabPanel>

									<TabPanel value={editViewTab} index={1}>
										<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
											<IconButton
												onClick={() => {
													navigator.clipboard.writeText(editTemplate.htmlBody);
													enqueueSnackbar("Código HTML copiado al portapapeles", { variant: "success" });
												}}
											>
												<Copy />
											</IconButton>
										</Box>
										<TextField
											label="Código HTML"
											fullWidth
											multiline
											rows={18}
											value={editTemplate.htmlBody}
											onChange={(e) => handleEditTemplateChange("htmlBody", e.target.value)}
											error={!!errors.htmlBody}
											helperText={errors.htmlBody}
											sx={{
												fontFamily: "monospace",
												"& .MuiInputBase-input": {
													fontFamily: "monospace",
													fontSize: "0.875rem",
												},
											}}
										/>
									</TabPanel>
								</Grid>
							</Grid>
						</DialogContent>

						<DialogActions>
							<Button onClick={handleCloseEdit}>Cancelar</Button>
							<AnimateButton>
								<Button variant="contained" color="primary" onClick={handleUpdateTemplate} disabled={updating}>
									{updating ? "Actualizando..." : "Guardar cambios"}
								</Button>
							</AnimateButton>
						</DialogActions>
					</>
				)}
			</Dialog>

			{/* Activation/Deactivation Confirmation Dialog */}
			<Dialog open={activationOpen} onClose={handleCloseActivationDialog} maxWidth="xs">
				{templateToToggle && (
					<>
						<DialogTitle>{templateToToggle.isActive ? "Desactivar plantilla" : "Activar plantilla"}</DialogTitle>
						<DialogContent>
							<Typography>
								{templateToToggle.isActive
									? "¿Estás seguro que deseas desactivar esta plantilla?"
									: "¿Estás seguro que deseas activar esta plantilla?"}
							</Typography>
							<Typography variant="subtitle2" sx={{ mt: 2 }}>
								<strong>Plantilla:</strong> {templateToToggle.name}
							</Typography>
							<Typography variant="body2" color="textSecondary">
								<strong>Categoría:</strong> {categoryDisplay[templateToToggle.category] || templateToToggle.category}
							</Typography>
							<Typography variant="caption" color="textSecondary">
								Al {templateToToggle.isActive ? "desactivar" : "activar"} esta plantilla,
								{templateToToggle.isActive
									? " no estará disponible para su uso en el sistema."
									: " estará disponible para su uso en el sistema."}
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={handleCloseActivationDialog}>Cancelar</Button>
							<AnimateButton>
								<Button
									variant="contained"
									color={templateToToggle.isActive ? "error" : "success"}
									onClick={handleToggleActivation}
									disabled={toggling}
								>
									{toggling
										? templateToToggle.isActive
											? "Desactivando..."
											: "Activando..."
										: templateToToggle.isActive
											? "Desactivar"
											: "Activar"}
								</Button>
							</AnimateButton>
						</DialogActions>
					</>
				)}
			</Dialog>

			{/* Send Email Dialog */}
			<Dialog open={sendEmailOpen} onClose={handleCloseSendEmail} maxWidth="md" fullWidth>
				{templateToSend && (
					<>
						<DialogTitle>Enviar email usando plantilla: {templateToSend.name}</DialogTitle>
						<DialogContent>
							<Grid container spacing={3} sx={{ mt: 0.5 }}>
								<Grid item xs={12}>
									<Typography variant="subtitle2" sx={{ mb: 1 }}>
										Detalles de la plantilla
									</Typography>
									<Paper variant="outlined" sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
										<Grid container spacing={2}>
											<Grid item xs={12} sm={6}>
												<Typography variant="body2">
													<strong>Categoría:</strong> {categoryDisplay[templateToSend.category] || templateToSend.category}
												</Typography>
												<Typography variant="body2">
													<strong>Asunto:</strong> {templateToSend.subject}
												</Typography>
											</Grid>
											<Grid item xs={12} sm={6}>
												<Typography variant="body2">
													<strong>Estado:</strong>{" "}
													<Chip
														label={templateToSend.isActive ? "Activa" : "Inactiva"}
														color={templateToSend.isActive ? "success" : "default"}
														size="small"
													/>
												</Typography>
												<Typography variant="body2">
													<strong>Variables:</strong> {templateToSend.variables.join(", ")}
												</Typography>
											</Grid>
										</Grid>
									</Paper>
								</Grid>

								<Grid item xs={12}>
									<TextField
										label="Email del destinatario"
										fullWidth
										value={emailData.email}
										onChange={handleEmailChange}
										required
										error={!!emailData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.email)}
										helperText={
											!!emailData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.email) ? "Por favor, ingresa un email válido" : ""
										}
										placeholder="ejemplo@dominio.com"
									/>
								</Grid>

								{templateToSend.variables.length > 0 && (
									<Grid item xs={12}>
										<Typography variant="subtitle2" sx={{ mb: 1 }}>
											Variables de la plantilla
										</Typography>
										<Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
											Complete los valores para las variables que serán reemplazadas en la plantilla
										</Typography>

										<Grid container spacing={2}>
											{templateToSend.variables.map((variable) => (
												<Grid item xs={12} sm={6} key={variable}>
													<TextField
														label={variable}
														fullWidth
														value={emailData.variables[variable] || ""}
														onChange={(e) => handleVariableChange(variable, e.target.value)}
														placeholder={`Valor para ${variable}`}
													/>
												</Grid>
											))}
										</Grid>
									</Grid>
								)}
							</Grid>
						</DialogContent>
						<DialogActions>
							<Button onClick={handleCloseSendEmail}>Cancelar</Button>
							<AnimateButton>
								<Button
									variant="contained"
									color="primary"
									onClick={handleSendEmail}
									disabled={sending || !emailData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.email)}
								>
									{sending ? "Enviando..." : "Enviar email"}
								</Button>
							</AnimateButton>
						</DialogActions>
					</>
				)}
			</Dialog>

			{/* Create Template Dialog */}
			<Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="lg" fullWidth>
				<DialogTitle>Nueva plantilla de email</DialogTitle>
				<Divider />

				<DialogContent sx={{ p: 3 }}>
					<Grid container spacing={3}>
						{/* Basic information */}
						<Grid item xs={12} md={6}>
							<TextField
								label="Nombre de la plantilla"
								fullWidth
								value={newTemplate.name}
								onChange={(e) => handleTemplateChange("name", e.target.value)}
								error={!!errors.name}
								helperText={errors.name}
								required
								sx={{ mb: 2 }}
							/>

							<FormControl fullWidth sx={{ mb: 2 }}>
								<InputLabel>Categoría</InputLabel>
								<Select value={newTemplate.category} label="Categoría" onChange={(e) => handleTemplateChange("category", e.target.value)}>
									{Object.entries(categoryDisplay).map(([value, label]) => (
										<MenuItem key={value} value={value}>
											{label}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<TextField
								label="Asunto"
								fullWidth
								value={newTemplate.subject}
								onChange={(e) => handleTemplateChange("subject", e.target.value)}
								error={!!errors.subject}
								helperText={errors.subject}
								required
								sx={{ mb: 2 }}
							/>

							<TextField
								label="Descripción"
								fullWidth
								value={newTemplate.description}
								onChange={(e) => handleTemplateChange("description", e.target.value)}
								multiline
								rows={2}
								sx={{ mb: 2 }}
							/>

							<FormControlLabel
								control={
									<Switch
										checked={newTemplate.isActive}
										onChange={(e) => handleTemplateChange("isActive", e.target.checked)}
										color="primary"
									/>
								}
								label="Activa"
							/>

							{/* Variables section */}
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Variables
								</Typography>
								<Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
									Ingrese las variables que se pueden usar en la plantilla con la sintaxis ${"{"}variable{"}"}
								</Typography>

								<Grid container spacing={1} alignItems="center">
									<Grid item xs>
										<TextField id="new-variable" label="Nueva variable" size="small" fullWidth />
									</Grid>
									<Grid item>
										<Button variant="contained" size="small" color="primary" onClick={handleAddVariable} startIcon={<AddCircle />}>
											Agregar
										</Button>
									</Grid>
								</Grid>

								<Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
									{newTemplate.variables.map((variable) => (
										<Chip
											key={variable}
											label={variable}
											onDelete={() => handleRemoveVariable(variable)}
											color="primary"
											variant="outlined"
										/>
									))}
								</Box>
							</Box>
						</Grid>

						{/* Template content and preview */}
						<Grid item xs={12} md={6}>
							<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
								<Tabs value={createViewTab} onChange={handleCreateChangeTab} aria-label="template edit tabs">
									<Tab label="Vista previa" id="create-tab-0" aria-controls="create-tabpanel-0" />
									<Tab label="Código HTML" id="create-tab-1" aria-controls="create-tabpanel-1" />
									<Tab label="Texto plano" id="create-tab-2" aria-controls="create-tabpanel-2" />
								</Tabs>
							</Box>

							<TabPanel value={createViewTab} index={0}>
								<Box sx={{ height: "450px", overflow: "auto" }}>
									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle1">Asunto:</Typography>
										<Typography variant="body1">{newTemplate.subject || "(Sin asunto)"}</Typography>
									</Box>
									<Typography variant="subtitle1">Contenido:</Typography>
									<Box
										sx={{
											mt: 1,
											border: 1,
											borderColor: "divider",
											borderRadius: 1,
											p: 2,
											height: "calc(100% - 80px)",
											overflow: "auto",
											"& iframe": {
												border: "none",
												width: "100%",
												height: "100%",
											},
										}}
									>
										<iframe
											title="Email Preview"
											srcDoc={`
												<!DOCTYPE html>
												<html>
													<head>
														<meta http-equiv="Content-Security-Policy" 
															content="default-src 'self'; 
															img-src * data: https:; 
															style-src 'unsafe-inline' 'self';">
														<style>
															body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
														</style>
													</head>
													<body>${newTemplate.htmlBody}</body>
												</html>
											`}
											sandbox="allow-same-origin allow-scripts"
											referrerPolicy="no-referrer"
										></iframe>
									</Box>
								</Box>
							</TabPanel>

							<TabPanel value={createViewTab} index={1}>
								<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
									<Button
										variant="contained"
										color="secondary"
										startIcon={<Copy />}
										onClick={() => {
											navigator.clipboard.writeText(newTemplate.htmlBody);
											enqueueSnackbar("Código HTML copiado al portapapeles", { variant: "success" });
										}}
									>
										Copiar al portapapeles
									</Button>
								</Box>
								<TextField
									label="Código HTML"
									fullWidth
									multiline
									rows={18}
									value={newTemplate.htmlBody}
									onChange={(e) => handleTemplateChange("htmlBody", e.target.value)}
									error={!!errors.htmlBody}
									helperText={errors.htmlBody}
									sx={{
										fontFamily: "monospace",
										"& .MuiInputBase-input": {
											fontFamily: "monospace",
											fontSize: "0.875rem",
										},
									}}
								/>
							</TabPanel>

							<TabPanel value={createViewTab} index={2}>
								<TextField
									label="Texto plano"
									fullWidth
									multiline
									rows={18}
									value={newTemplate.textBody}
									onChange={(e) => handleTemplateChange("textBody", e.target.value)}
									error={!!errors.textBody}
									helperText={errors.textBody}
									sx={{
										fontFamily: "monospace",
										"& .MuiInputBase-input": {
											fontFamily: "monospace",
											fontSize: "0.875rem",
										},
									}}
								/>
							</TabPanel>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions>
					<Button onClick={handleCloseCreate}>Cancelar</Button>
					<AnimateButton>
						<Button variant="contained" color="primary" onClick={handleCreateTemplate} disabled={creating}>
							{creating ? "Creando..." : "Crear plantilla"}
						</Button>
					</AnimateButton>
				</DialogActions>
			</Dialog>
		</MainCard >
	);
};

export default EmailTemplates;