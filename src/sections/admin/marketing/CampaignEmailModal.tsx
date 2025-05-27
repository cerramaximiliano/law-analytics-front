import { useState, useEffect } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";

// material-ui
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	FormHelperText,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	Tab,
	Tabs,
	TextField,
	Typography,
	Chip,
	IconButton,
	Card,
	CardContent,
	//useTheme,
} from "@mui/material";

// project imports
import { useSnackbar } from "notistack";
import AnimateButton from "components/@extended/AnimateButton";
import axios from "axios";
import { Add, Trash } from "iconsax-react";

// types
import { Campaign } from "types/campaign";
import { CampaignEmail, CampaignEmailInput, SendingRestrictions, EmailTracking } from "types/campaign-email";
import { CampaignEmailService } from "store/reducers/campaign";

// Interface for email template
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
}

interface CampaignEmailModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	campaign: Campaign;
	email?: CampaignEmail;
	mode: "create" | "edit";
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, index, value, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`email-tabpanel-${index}`} aria-labelledby={`email-tab-${index}`} {...other}>
			{value === index && <Box sx={{ p: 2 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `email-tab-${index}`,
		"aria-controls": `email-tabpanel-${index}`,
	};
}

const CampaignEmailModal = ({ open, onClose, onSuccess, campaign, email, mode }: CampaignEmailModalProps) => {
	//const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	// State for tabs
	const [tabValue, setTabValue] = useState(0);

	// State for submitting
	const [submitting, setSubmitting] = useState<boolean>(false);

	// State for templates
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
	const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

	// State for A/B testing
	const [abTestingEnabled, setAbTestingEnabled] = useState<boolean>(email?.abTesting?.enabled || false);
	const [abTestingVariations, setAbTestingVariations] = useState<any[]>(email?.abTesting?.variants || []);

	// Inicialización de conditions.type en caso de uso
	// Esta línea se mantiene para inicializar correctamente conditions.type en el formulario
	//const conditionsType = email?.conditions?.type || "time";

	// Fetch email templates on mount
	useEffect(() => {
		if (open) {
			fetchTemplates();
		}
	}, [open]);

	// Set selected template based on templateId
	useEffect(() => {
		if (email?.templateId && templates.length > 0) {
			const template = templates.find((t) => t._id === email.templateId);
			if (template) {
				setSelectedTemplate(template);
			}
		}
	}, [email, templates]);

	// Handle tab change
	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	// Fetch templates
	const fetchTemplates = async () => {
		setTemplatesLoading(true);
		try {
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/email/templates`);
			if (response.data.success) {
				// Only include active templates
				const activeTemplates = response.data.data.filter((template: EmailTemplate) => template.isActive);
				setTemplates(activeTemplates);
			} else {
				enqueueSnackbar("Error al cargar las plantillas de email", { variant: "error" });
			}
		} catch (err: any) {
			enqueueSnackbar(err.message || "Error al cargar las plantillas de email", { variant: "error" });
		} finally {
			setTemplatesLoading(false);
		}
	};

	// Template change handler
	const handleTemplateChange = (templateId: string) => {
		const template = templates.find((t) => t._id === templateId);
		if (template) {
			setSelectedTemplate(template);
			formik.setFieldValue("templateId", templateId);

			// Auto-populate name and subject from the template
			formik.setFieldValue("name", template.name);
			formik.setFieldValue("subject", template.subject);
		} else {
			setSelectedTemplate(null);
			formik.setFieldValue("templateId", "");
		}
	};

	// Esta sección de código se eliminó ya que no se utiliza más

	// A/B Testing handlers
	const handleAbTestingChange = (enabled: boolean) => {
		setAbTestingEnabled(enabled);
		formik.setFieldValue("abTesting.enabled", enabled);
	};

	const handleAddVariation = () => {
		const newVariation = {
			name: `Variante ${abTestingVariations.length + 1}`,
			subject: "",
			weight: 50,
		};

		const updatedVariations = [...abTestingVariations, newVariation];
		setAbTestingVariations(updatedVariations);
		formik.setFieldValue("abTesting.variants", updatedVariations);
	};

	const handleRemoveVariation = (index: number) => {
		const updatedVariations = abTestingVariations.filter((_, i) => i !== index);
		setAbTestingVariations(updatedVariations);
		formik.setFieldValue("abTesting.variants", updatedVariations);
	};

	const handleVariationChange = (index: number, field: string, value: any) => {
		const updatedVariations = [...abTestingVariations];
		updatedVariations[index] = {
			...updatedVariations[index],
			[field]: value,
		};
		setAbTestingVariations(updatedVariations);
		formik.setFieldValue("abTesting.variants", updatedVariations);
	};

	// Validation schema
	const validationSchema = Yup.object({
		sequenceIndex: Yup.number()
			.required("El índice de secuencia es obligatorio")
			.min(0, "El índice de secuencia debe ser mayor o igual a 0"),
		status: Yup.string().required("El estado es obligatorio"),
		...(mode === "create"
			? { templateId: Yup.string().required("La selección de plantilla es obligatoria") }
			: {
					name: Yup.string().required("El nombre es obligatorio"),
					subject: Yup.string().required("El asunto es obligatorio"),
			  }),
	});

	// Initial sending restrictions
	const initialSendingRestrictions: SendingRestrictions = {
		daysOfWeek: email?.sendingRestrictions?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
		timeStart: email?.sendingRestrictions?.timeStart || "08:00",
		timeEnd: email?.sendingRestrictions?.timeEnd || "20:00",
		timezone: email?.sendingRestrictions?.timezone || "America/Santiago",
	};

	// Initial tracking settings
	const initialTracking: EmailTracking = {
		opens: email?.tracking?.opens !== undefined ? email.tracking.opens : true,
		clicks: email?.tracking?.clicks !== undefined ? email.tracking.clicks : true,
		customTracking: email?.tracking?.customTracking || {},
	};

	// Initial values
	const initialValues: CampaignEmailInput & { conditions: any } = {
		campaignId: campaign._id || "",
		name: email?.name || "",
		subject: email?.subject || "",
		sequenceIndex: email?.sequenceIndex || 0,
		templateId: email?.templateId || "",
		status: email?.status || "draft",
		isFinal: email?.isFinal || false,
		content: email?.content || { html: "", text: "" },
		sender: email?.sender || { name: "", email: "" },
		replyTo: email?.replyTo || "",
		conditions: email?.conditions || {
			type: "time",
			timeDelay: {
				value: 1,
				unit: "days",
			},
			eventTrigger: {
				eventName: "",
				maxWaitTime: {
					value: 1,
					unit: "days",
				},
			},
			customCondition: {},
		},
		sendingRestrictions: initialSendingRestrictions,
		variables: email?.variables || {},
		tracking: initialTracking,
		abTesting: email?.abTesting || {
			enabled: false,
			variants: [],
			winnerCriteria: "opens",
			testDuration: {
				value: 24,
				unit: "hours",
			},
		},
	};

	// Submit handler
	const handleSubmit = async (values: any) => {
		if (!campaign._id) {
			enqueueSnackbar("ID de campaña no válido", { variant: "error" });
			return;
		}

		setSubmitting(true);
		try {
			let response;

			if (mode === "create") {
				response = await CampaignEmailService.createEmail(values);
			} else if (mode === "edit" && email?._id) {
				response = await CampaignEmailService.updateEmail(email._id, values);
			}

			if (response && response.success) {
				enqueueSnackbar(mode === "create" ? "Email creado con éxito" : "Email actualizado con éxito", { variant: "success" });
				onSuccess();
			} else {
				throw new Error("Error en la respuesta del servidor");
			}
		} catch (err: any) {
			enqueueSnackbar(err.message || `Error al ${mode === "create" ? "crear" : "actualizar"} el email de la campaña`, { variant: "error" });
		} finally {
			setSubmitting(false);
		}
	};

	// Formik instance
	const formik = useFormik({
		initialValues,
		validationSchema,
		onSubmit: handleSubmit,
	});

	// Template preview functionality removed as it's not being used

	// Rendering the days of week options
	const daysOfWeek = [
		{ value: 0, label: "Domingo" },
		{ value: 1, label: "Lunes" },
		{ value: 2, label: "Martes" },
		{ value: 3, label: "Miércoles" },
		{ value: 4, label: "Jueves" },
		{ value: 5, label: "Viernes" },
		{ value: 6, label: "Sábado" },
	];

	const handleDayToggle = (day: number) => {
		const currentDays = formik.values.sendingRestrictions?.daysOfWeek || [];
		const updatedDays = currentDays.includes(day) ? currentDays.filter((d) => d !== day) : [...currentDays, day];

		formik.setFieldValue("sendingRestrictions.daysOfWeek", updatedDays);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				{mode === "create" ? "Agregar nuevo email a la campaña" : "Editar email de la campaña"}
				<Typography variant="subtitle2" color="textSecondary">
					Campaña: {campaign.name}
				</Typography>
			</DialogTitle>

			<Divider />

			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
					<Tab label="Información Básica" {...a11yProps(0)} />
					<Tab label="Configuración Avanzada" {...a11yProps(1)} />
				</Tabs>
			</Box>

			<DialogContent sx={{ p: 0 }}>
				<form onSubmit={formik.handleSubmit}>
					{/* Información Básica */}
					<TabPanel value={tabValue} index={0}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								{/* Template selection */}
								<FormControl
									fullWidth
									sx={{ mb: 2 }}
									error={mode === "create" && formik.touched.templateId && Boolean(formik.errors.templateId)}
								>
									<InputLabel id="template-label">Plantilla de email</InputLabel>
									<Select
										labelId="template-label"
										id="templateId"
										name="templateId"
										value={formik.values.templateId}
										label="Plantilla de email"
										onChange={(e) => handleTemplateChange(e.target.value)}
										disabled={templatesLoading}
									>
										{mode === "edit" && (
											<MenuItem value="">
												<em>Ninguna (usar contenido personalizado)</em>
											</MenuItem>
										)}
										{templates.map((template) => (
											<MenuItem key={template._id} value={template._id}>
												{template.name} ({template.category})
											</MenuItem>
										))}
									</Select>
									<FormHelperText>
										{mode === "create" && formik.touched.templateId && formik.errors.templateId ? (
											<span>{formik.errors.templateId}</span>
										) : (
											<>
												{mode === "create"
													? "Seleccione una plantilla para crear el email. "
													: "Seleccione una plantilla o deje en blanco para contenido personalizado. "}
												Al seleccionar una plantilla, el nombre y asunto se actualizarán automáticamente.
											</>
										)}
									</FormHelperText>
								</FormControl>

								{templatesLoading && (
									<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
										<CircularProgress size={24} />
									</Box>
								)}
								{mode === "edit" ? (
									<>
										<TextField
											fullWidth
											id="name"
											name="name"
											label="Nombre del email"
											value={formik.values.name}
											onChange={formik.handleChange}
											error={formik.touched.name && Boolean(formik.errors.name)}
											helperText={
												(formik.touched.name && formik.errors.name) ||
												(formik.values.templateId ? "Actualizado desde la plantilla seleccionada" : "")
											}
											sx={{ mb: 2 }}
											required
										/>

										<TextField
											fullWidth
											id="subject"
											name="subject"
											label="Asunto"
											value={formik.values.subject}
											onChange={formik.handleChange}
											error={formik.touched.subject && Boolean(formik.errors.subject)}
											helperText={
												(formik.touched.subject && formik.errors.subject) ||
												(formik.values.templateId ? "Actualizado desde la plantilla seleccionada" : "")
											}
											sx={{ mb: 2 }}
											required
										/>
									</>
								) : (
									selectedTemplate && (
										<Card variant="outlined" sx={{ mb: 2, p: 2 }}>
											<Typography variant="subtitle2" gutterBottom>
												Detalles de la plantilla seleccionada:
											</Typography>
											<Typography variant="body2" sx={{ mb: 1 }}>
												<strong>Nombre:</strong> {selectedTemplate.name}
											</Typography>
											<Typography variant="body2" sx={{ mb: 1 }}>
												<strong>Asunto:</strong> {selectedTemplate.subject}
											</Typography>
										</Card>
									)
								)}

								<TextField
									fullWidth
									id="sequenceIndex"
									name="sequenceIndex"
									label="Índice de secuencia"
									type="number"
									InputProps={{ inputProps: { min: 0 } }}
									value={formik.values.sequenceIndex}
									onChange={formik.handleChange}
									error={formik.touched.sequenceIndex && Boolean(formik.errors.sequenceIndex)}
									helperText={
										(formik.touched.sequenceIndex && formik.errors.sequenceIndex) || "Orden en que se enviará este email en la secuencia"
									}
									sx={{ mb: 2 }}
									required
								/>

								<FormControl fullWidth sx={{ mb: 2 }}>
									<InputLabel id="status-label">Estado</InputLabel>
									<Select
										labelId="status-label"
										id="status"
										name="status"
										value={formik.values.status}
										label="Estado"
										onChange={formik.handleChange}
										error={formik.touched.status && Boolean(formik.errors.status)}
									>
										<MenuItem value="draft">Borrador</MenuItem>
										<MenuItem value="active">Activo</MenuItem>
										<MenuItem value="paused">Pausado</MenuItem>
										<MenuItem value="completed">Completado</MenuItem>
									</Select>
									{formik.touched.status && formik.errors.status && <FormHelperText error>{formik.errors.status}</FormHelperText>}
								</FormControl>

								<FormControlLabel
									control={
										<Switch
											checked={formik.values.isFinal}
											onChange={(e) => formik.setFieldValue("isFinal", e.target.checked)}
											name="isFinal"
										/>
									}
									label="Es el email final de la secuencia"
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography variant="subtitle2" gutterBottom>
									Información del Remitente
								</Typography>
								<TextField
									fullWidth
									id="sender.name"
									name="sender.name"
									label="Nombre del remitente"
									value={formik.values.sender?.name || ""}
									onChange={formik.handleChange}
									sx={{ mb: 2 }}
								/>

								<TextField
									fullWidth
									id="sender.email"
									name="sender.email"
									label="Email del remitente"
									value={formik.values.sender?.email || ""}
									onChange={formik.handleChange}
									sx={{ mb: 2 }}
								/>

								<TextField
									fullWidth
									id="replyTo"
									name="replyTo"
									label="Email de respuesta (Reply-To)"
									value={formik.values.replyTo || ""}
									onChange={formik.handleChange}
									sx={{ mb: 2 }}
								/>
							</Grid>
						</Grid>
					</TabPanel>

					{/* Configuración Avanzada */}
					<TabPanel value={tabValue} index={1}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Typography variant="subtitle2" gutterBottom>
									Días permitidos para envío
								</Typography>
								<Box sx={{ mb: 3 }}>
									<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
										{daysOfWeek.map((day) => (
											<Chip
												key={day.value}
												label={day.label}
												variant={formik.values.sendingRestrictions?.daysOfWeek?.includes(day.value) ? "filled" : "outlined"}
												color={formik.values.sendingRestrictions?.daysOfWeek?.includes(day.value) ? "primary" : "default"}
												onClick={() => handleDayToggle(day.value)}
												sx={{ my: 0.5 }}
											/>
										))}
									</Stack>
								</Box>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography variant="subtitle2" gutterBottom>
									Ventana de tiempo para envío
								</Typography>
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<TextField
											fullWidth
											id="sendingRestrictions.timeStart"
											name="sendingRestrictions.timeStart"
											label="Hora inicio"
											type="time"
											value={formik.values.sendingRestrictions?.timeStart || "08:00"}
											onChange={formik.handleChange}
											InputLabelProps={{ shrink: true }}
											inputProps={{ step: 300 }}
											sx={{ mb: 2 }}
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											fullWidth
											id="sendingRestrictions.timeEnd"
											name="sendingRestrictions.timeEnd"
											label="Hora fin"
											type="time"
											value={formik.values.sendingRestrictions?.timeEnd || "20:00"}
											onChange={formik.handleChange}
											InputLabelProps={{ shrink: true }}
											inputProps={{ step: 300 }}
											sx={{ mb: 2 }}
										/>
									</Grid>
								</Grid>
								<TextField
									fullWidth
									id="sendingRestrictions.timezone"
									name="sendingRestrictions.timezone"
									label="Zona horaria"
									value={formik.values.sendingRestrictions?.timezone || "America/Santiago"}
									onChange={formik.handleChange}
									sx={{ mb: 2 }}
									placeholder="America/Santiago"
								/>
							</Grid>

							{/* Sección A/B Testing dentro de Configuración Avanzada */}
							<Grid item xs={12}>
								<Divider sx={{ my: 3 }} />
								<Typography variant="subtitle1" gutterBottom>
									Pruebas A/B
								</Typography>

								<FormControlLabel
									control={
										<Switch checked={abTestingEnabled} onChange={(e) => handleAbTestingChange(e.target.checked)} name="abTesting.enabled" />
									}
									label="Habilitar pruebas A/B"
								/>

								{abTestingEnabled && (
									<Grid container spacing={3} sx={{ mt: 1 }}>
										<Grid item xs={12} md={6}>
											<Card variant="outlined">
												<CardContent>
													<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
														<Typography variant="subtitle2">Criterio de ganador</Typography>
														<FormControl sx={{ minWidth: 200 }}>
															<InputLabel id="winner-criteria-label">Criterio</InputLabel>
															<Select
																labelId="winner-criteria-label"
																id="abTesting.winnerCriteria"
																name="abTesting.winnerCriteria"
																value={formik.values.abTesting?.winnerCriteria || "opens"}
																label="Criterio"
																onChange={formik.handleChange}
															>
																<MenuItem value="opens">Tasa de apertura</MenuItem>
																<MenuItem value="clicks">Tasa de clics</MenuItem>
																<MenuItem value="conversions">Conversiones</MenuItem>
															</Select>
														</FormControl>
													</Box>

													<Typography variant="subtitle2" gutterBottom>
														Duración de la prueba
													</Typography>
													<Box sx={{ display: "flex", alignItems: "center" }}>
														<TextField
															id="abTesting.testDuration.value"
															name="abTesting.testDuration.value"
															label="Valor"
															type="number"
															value={formik.values.abTesting?.testDuration?.value || 24}
															onChange={formik.handleChange}
															InputProps={{ inputProps: { min: 1 } }}
															sx={{ mr: 2, width: "40%" }}
														/>
														<FormControl sx={{ width: "60%" }}>
															<InputLabel id="duration-unit-label">Unidad</InputLabel>
															<Select
																labelId="duration-unit-label"
																id="abTesting.testDuration.unit"
																name="abTesting.testDuration.unit"
																value={formik.values.abTesting?.testDuration?.unit || "hours"}
																label="Unidad"
																onChange={formik.handleChange}
															>
																<MenuItem value="hours">Horas</MenuItem>
																<MenuItem value="days">Días</MenuItem>
															</Select>
														</FormControl>
													</Box>
												</CardContent>
											</Card>
										</Grid>

										<Grid item xs={12}>
											<Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
												Variantes A/B
											</Typography>
											<Box sx={{ mb: 2 }}>
												<Button
													variant="outlined"
													startIcon={<Add />}
													onClick={handleAddVariation}
													disabled={abTestingVariations.length >= 5}
												>
													Agregar variante
												</Button>
											</Box>

											{abTestingVariations.length === 0 ? (
												<Typography color="textSecondary">No hay variantes. Haga clic en "Agregar variante" para comenzar.</Typography>
											) : (
												abTestingVariations.map((variation, index) => (
													<Card key={index} variant="outlined" sx={{ mb: 2 }}>
														<CardContent>
															<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
																<Typography variant="subtitle2">Variante {index + 1}</Typography>
																<IconButton
																	color="error"
																	onClick={() => handleRemoveVariation(index)}
																	disabled={abTestingVariations.length <= 1}
																>
																	<Trash />
																</IconButton>
															</Box>

															<Grid container spacing={2}>
																<Grid item xs={12} md={6}>
																	<TextField
																		fullWidth
																		label="Nombre de la variante"
																		value={variation.name}
																		onChange={(e) => handleVariationChange(index, "name", e.target.value)}
																		sx={{ mb: 2 }}
																	/>
																	<TextField
																		fullWidth
																		label="Asunto"
																		value={variation.subject}
																		onChange={(e) => handleVariationChange(index, "subject", e.target.value)}
																		sx={{ mb: 2 }}
																	/>
																	<TextField
																		fullWidth
																		label="Peso (%)"
																		type="number"
																		value={variation.weight}
																		onChange={(e) => handleVariationChange(index, "weight", parseInt(e.target.value))}
																		InputProps={{ inputProps: { min: 1, max: 100 } }}
																		sx={{ mb: 2 }}
																		helperText="Porcentaje de destinatarios que recibirán esta variante"
																	/>
																</Grid>
																<Grid item xs={12} md={6}>
																	<FormControl fullWidth sx={{ mb: 2 }}>
																		<InputLabel>Plantilla</InputLabel>
																		<Select
																			value={variation.templateId || ""}
																			label="Plantilla"
																			onChange={(e) => handleVariationChange(index, "templateId", e.target.value)}
																		>
																			<MenuItem value="">
																				<em>Ninguna (usar contenido personalizado)</em>
																			</MenuItem>
																			{templates.map((template) => (
																				<MenuItem key={template._id} value={template._id}>
																					{template.name}
																				</MenuItem>
																			))}
																		</Select>
																	</FormControl>
																	{!variation.templateId && (
																		<>
																			<TextField
																				fullWidth
																				label="Contenido HTML"
																				multiline
																				rows={3}
																				value={variation.content?.html || ""}
																				onChange={(e) => {
																					handleVariationChange(index, "content", {
																						...variation.content,
																						html: e.target.value,
																					});
																				}}
																				sx={{ mb: 2 }}
																			/>
																			<TextField
																				fullWidth
																				label="Contenido Texto"
																				multiline
																				rows={2}
																				value={variation.content?.text || ""}
																				onChange={(e) => {
																					handleVariationChange(index, "content", {
																						...variation.content,
																						text: e.target.value,
																					});
																				}}
																			/>
																		</>
																	)}
																</Grid>
															</Grid>
														</CardContent>
													</Card>
												))
											)}
										</Grid>
									</Grid>
								)}
							</Grid>

							{/* Sección de Seguimiento dentro de Configuración Avanzada */}
							<Grid item xs={12}>
								<Divider sx={{ my: 3 }} />
								<Typography variant="subtitle1" gutterBottom>
									Opciones de Seguimiento
								</Typography>

								<Grid container spacing={3}>
									<Grid item xs={12} md={6}>
										<FormControlLabel
											control={
												<Switch
													checked={formik.values.tracking?.opens}
													onChange={(e) => formik.setFieldValue("tracking.opens", e.target.checked)}
													name="tracking.opens"
												/>
											}
											label="Seguimiento de aperturas"
										/>

										<FormControlLabel
											control={
												<Switch
													checked={formik.values.tracking?.clicks}
													onChange={(e) => formik.setFieldValue("tracking.clicks", e.target.checked)}
													name="tracking.clicks"
												/>
											}
											label="Seguimiento de clics"
										/>

										<TextField
											fullWidth
											id="tracking.customTracking"
											name="tracking.customTracking"
											label="Parámetros personalizados de seguimiento"
											multiline
											rows={4}
											value={
												typeof formik.values.tracking?.customTracking === "object"
													? JSON.stringify(formik.values.tracking.customTracking)
													: formik.values.tracking?.customTracking || ""
											}
											onChange={(e) => {
												try {
													const value = e.target.value.trim() ? JSON.parse(e.target.value) : {};
													formik.setFieldValue("tracking.customTracking", value);
												} catch (err) {
													formik.setFieldValue("tracking.customTracking", e.target.value);
												}
											}}
											placeholder='{"utm_source": "campaign", "utm_medium": "email"}'
											sx={{ mt: 2 }}
											helperText="Ingrese parámetros de seguimiento adicionales en formato JSON"
										/>
									</Grid>

									<Grid item xs={12} md={6}>
										<Typography variant="subtitle2" gutterBottom>
											Variables Personalizadas
										</Typography>
										<TextField
											fullWidth
											id="variables"
											name="variables"
											label="Variables personalizadas"
											multiline
											rows={4}
											value={
												typeof formik.values.variables === "object"
													? JSON.stringify(formik.values.variables)
													: formik.values.variables || ""
											}
											onChange={(e) => {
												try {
													const value = e.target.value.trim() ? JSON.parse(e.target.value) : {};
													formik.setFieldValue("variables", value);
												} catch (err) {
													formik.setFieldValue("variables", e.target.value);
												}
											}}
											placeholder='{"nombre": "Valor por defecto", "fecha": "01/01/2023"}'
											sx={{ mb: 2 }}
											helperText="Ingrese variables personalizadas para este email en formato JSON"
										/>
									</Grid>
								</Grid>

								{mode === "edit" && !formik.values.templateId && (
									<Grid item xs={12}>
										<Divider sx={{ my: 3 }} />
										<Typography variant="subtitle1" gutterBottom>
											Contenido Personalizado
										</Typography>
										<TextField
											fullWidth
											id="content.html"
											name="content.html"
											label="Contenido HTML"
											multiline
											rows={8}
											value={formik.values.content?.html || ""}
											onChange={formik.handleChange}
											placeholder="<p>Contenido HTML del email</p>"
											sx={{ mb: 2 }}
										/>

										<TextField
											fullWidth
											id="content.text"
											name="content.text"
											label="Contenido Texto Plano"
											multiline
											rows={4}
											value={formik.values.content?.text || ""}
											onChange={formik.handleChange}
											placeholder="Contenido en texto plano del email"
											sx={{ mb: 2 }}
										/>
									</Grid>
								)}
							</Grid>
						</Grid>
					</TabPanel>
				</form>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} color="inherit">
					Cancelar
				</Button>
				<AnimateButton>
					<Button variant="contained" color="primary" disabled={submitting} onClick={() => formik.handleSubmit()}>
						{submitting ? <CircularProgress size={24} sx={{ color: "inherit" }} /> : mode === "create" ? "Crear Email" : "Guardar Cambios"}
					</Button>
				</AnimateButton>
			</DialogActions>
		</Dialog>
	);
};

export default CampaignEmailModal;
