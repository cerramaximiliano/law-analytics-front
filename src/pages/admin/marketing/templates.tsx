import { useState, useEffect } from "react";
import axios from "axios";

// material-ui
import {
	Box,
	Button,
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
	Typography,
	useTheme,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { Add, Edit2, Eye, Trash, AddCircle } from "iconsax-react";
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

	// State for detail modal
	const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
	const [detailOpen, setDetailOpen] = useState<boolean>(false);
	const [viewTab, setViewTab] = useState<number>(0);

	// State for create template modal
	const [createOpen, setCreateOpen] = useState<boolean>(false);
	const [createViewTab, setCreateViewTab] = useState<number>(0);
	const [creating, setCreating] = useState<boolean>(false);
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
	};

	const handleCloseDetail = () => {
		setDetailOpen(false);
		setSelectedTemplate(null);
	};

	const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
		setViewTab(newValue);
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
				// Add the new template to the list
				setTemplates([...templates, response.data.data]);

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
													<IconButton aria-label="editar" size="small" color="primary">
														<Edit2 size={18} />
													</IconButton>
													<IconButton aria-label="eliminar" size="small" color="error">
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
									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle1">Asunto:</Typography>
										<Typography variant="body1">{selectedTemplate.subject}</Typography>
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
													<body>${selectedTemplate.htmlBody}</body>
												</html>
											`}
											sandbox="allow-same-origin allow-scripts"
											referrerPolicy="no-referrer"
										></iframe>
									</Box>
								</Box>
							</TabPanel>
							<TabPanel value={viewTab} index={1}>
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
							<Button color="primary" startIcon={<Edit2 />}>
								Editar
							</Button>
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
		</MainCard>
	);
};

export default EmailTemplates;
