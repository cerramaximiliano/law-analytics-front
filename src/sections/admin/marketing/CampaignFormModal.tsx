import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

// material-ui
import {
	Box,
	Button,
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
	TextField,
	Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

// project imports
import { Campaign, CampaignInput, CampaignType } from "types/campaign";
import { CampaignService } from "store/reducers/campaign";

// types
interface CampaignFormModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	campaign?: Campaign | null; // If provided, we're in edit mode
	mode: "create" | "edit";
}

// Define form values type
interface FormValues {
	name: string;
	type: CampaignType;
	description: string;
	status: string;
	startDate: Date | null;
	endDate: Date | null;
	isPermanent: boolean;
	category: string;
	tags: string;
}

// validation schema
const validationSchema = Yup.object({
	name: Yup.string().required("Nombre de campaña requerido"),
	type: Yup.string().required("Tipo de campaña requerido"),
	description: Yup.string(),
	status: Yup.string(),
	startDate: Yup.date().nullable(),
	endDate: Yup.date()
		.nullable()
		.when("startDate", (startDate, schema) => {
			if (startDate && startDate[0]) {
				return schema.min(startDate[0], "La fecha de fin debe ser posterior a la fecha de inicio");
			}
			return schema;
		}),
	isPermanent: Yup.boolean(),
	category: Yup.string(),
	tags: Yup.string(),
});

// Campaign types with labels
const campaignTypes = [
	{ value: "onetime", label: "Una sola vez" },
	{ value: "automated", label: "Automatizada" },
	{ value: "sequence", label: "Secuencia" },
	{ value: "recurring", label: "Recurrente" },
];

// Campaign statuses
const campaignStatuses = [
	{ value: "draft", label: "Borrador" },
	{ value: "active", label: "Activa" },
	{ value: "paused", label: "Pausada" },
	{ value: "completed", label: "Completada" },
	{ value: "archived", label: "Archivada" },
];

const CampaignFormModal = ({ open, onClose, onSuccess, campaign = null, mode }: CampaignFormModalProps) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isEditMode = mode === "edit";

	// Default initial values
	const defaultInitialValues: FormValues = {
		name: "",
		type: "onetime" as CampaignType,
		description: "",
		status: "draft",
		startDate: null,
		endDate: null,
		isPermanent: false,
		category: "",
		tags: "",
	};

	// Formik setup
	const formik = useFormik<FormValues>({
		initialValues: defaultInitialValues,
		validationSchema,
		onSubmit: async (values) => {
			try {
				setLoading(true);
				setError(null);

				// Convert tags string to array
				const tagsArray = values.tags ? values.tags.split(",").map((tag) => tag.trim()) : [];

				if (isEditMode && campaign?._id) {
					// Prepare update payload - type is omitted as it can't be changed
					const updateData: Partial<Campaign> = {
						name: values.name,
						status: values.status as any,
						description: values.description || undefined,
						startDate: values.startDate || undefined,
						endDate: values.isPermanent ? undefined : values.endDate || undefined,
						isPermanent: values.isPermanent,
						category: values.category || undefined,
						tags: tagsArray.length > 0 ? tagsArray : undefined,
					};

					// Update campaign
					await CampaignService.updateCampaign(campaign._id, updateData);
				} else {
					// Prepare create payload - needs type
					const createData: CampaignInput = {
						name: values.name,
						type: values.type,
						status: values.status as any,
						description: values.description || undefined,
						startDate: values.startDate || undefined,
						endDate: values.isPermanent ? undefined : values.endDate || undefined,
						isPermanent: values.isPermanent,
						category: values.category || undefined,
						tags: tagsArray.length > 0 ? tagsArray : undefined,
					};

					// Create campaign
					await CampaignService.createCampaign(createData);
				}

				// Reset form and close modal
				formik.resetForm();
				onSuccess();
			} catch (err: any) {
				setError(err.message || `Error al ${isEditMode ? "actualizar" : "crear"} la campaña`);
				console.error(`Error ${isEditMode ? "updating" : "creating"} campaign:`, err);
			} finally {
				setLoading(false);
			}
		},
	});

	// Update form values when campaign data changes (edit mode)
	useEffect(() => {
		if (campaign && isEditMode) {
			// Format tags as a comma-separated string
			const tagsString = campaign.tags ? campaign.tags.join(", ") : "";

			formik.setValues({
				name: campaign.name || "",
				type: campaign.type || "onetime",
				description: campaign.description || "",
				status: campaign.status || "draft",
				startDate: campaign.startDate ? new Date(campaign.startDate) : null,
				endDate: campaign.endDate ? new Date(campaign.endDate) : null,
				isPermanent: campaign.isPermanent || false,
				category: campaign.category || "",
				tags: tagsString,
			});
		} else {
			// Reset to defaults for create mode
			formik.setValues(defaultInitialValues);
		}
	}, [campaign, isEditMode, open]);

	// Handle permanent campaign toggle
	const handlePermanentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
		const isPermanent = event.target.checked;
		formik.setFieldValue("isPermanent", isPermanent);

		// Clear end date if permanent
		if (isPermanent) {
			formik.setFieldValue("endDate", null);
		}
	};

	// Close handler
	const handleClose = () => {
		formik.resetForm();
		setError(null);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					borderRadius: 2,
				},
			}}
		>
			<form onSubmit={formik.handleSubmit}>
				<DialogTitle>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h4">{isEditMode ? "Editar Campaña" : "Nueva Campaña de Email"}</Typography>
					</Stack>
				</DialogTitle>
				<Divider />

				<DialogContent sx={{ pt: 3 }}>
					{error && (
						<Box mb={3}>
							<Typography color="error">{error}</Typography>
						</Box>
					)}

					<Grid container spacing={3}>
						{/* Required fields section */}
						<Grid item xs={12}>
							<Typography variant="h5" gutterBottom>
								Información Básica
							</Typography>
						</Grid>

						{/* Campaign name */}
						<Grid item xs={12} md={6}>
							<FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)}>
								<TextField
									id="name"
									name="name"
									label="Nombre de la campaña *"
									value={formik.values.name}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									error={formik.touched.name && Boolean(formik.errors.name)}
									helperText={formik.touched.name && formik.errors.name}
									placeholder="Ej: Newsletter Julio 2025"
								/>
							</FormControl>
						</Grid>

						{/* Campaign type - disabled in edit mode */}
						<Grid item xs={12} md={6}>
							<FormControl fullWidth error={formik.touched.type && Boolean(formik.errors.type)}>
								<InputLabel id="type-label">Tipo de campaña *</InputLabel>
								<Select
									labelId="type-label"
									id="type"
									name="type"
									value={formik.values.type}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									label="Tipo de campaña *"
									disabled={isEditMode} // Can't change type in edit mode
								>
									{campaignTypes.map((type) => (
										<MenuItem key={type.value} value={type.value}>
											{type.label}
										</MenuItem>
									))}
								</Select>
								{formik.touched.type && formik.errors.type && <FormHelperText>{formik.errors.type}</FormHelperText>}
								{isEditMode && <FormHelperText>El tipo de campaña no puede modificarse</FormHelperText>}
							</FormControl>
						</Grid>

						{/* Campaign description */}
						<Grid item xs={12}>
							<FormControl fullWidth>
								<TextField
									id="description"
									name="description"
									label="Descripción"
									value={formik.values.description}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									multiline
									rows={3}
									placeholder="Descripción detallada de la campaña"
								/>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Divider />
						</Grid>

						{/* Additional settings section */}
						<Grid item xs={12}>
							<Typography variant="h5" gutterBottom>
								Configuración Adicional
							</Typography>
						</Grid>

						{/* Campaign status */}
						<Grid item xs={12} md={6}>
							<FormControl fullWidth>
								<InputLabel id="status-label">Estado</InputLabel>
								<Select
									labelId="status-label"
									id="status"
									name="status"
									value={formik.values.status}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									label="Estado"
								>
									{campaignStatuses.map((status) => (
										<MenuItem
											key={status.value}
											value={status.value}
											// Only show completed and archived in edit mode
											style={{
												display: !isEditMode && (status.value === "completed" || status.value === "archived") ? "none" : "flex",
											}}
										>
											{status.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						{/* Campaign category */}
						<Grid item xs={12} md={6}>
							<FormControl fullWidth>
								<TextField
									id="category"
									name="category"
									label="Categoría"
									value={formik.values.category}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									placeholder="Ej: Noticias, Eventos, Promociones"
								/>
							</FormControl>
						</Grid>

						{/* Campaign tags */}
						<Grid item xs={12}>
							<FormControl fullWidth>
								<TextField
									id="tags"
									name="tags"
									label="Etiquetas"
									value={formik.values.tags}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									placeholder="Etiquetas separadas por comas (ej: verano, descuentos, 2025)"
									helperText="Añade etiquetas separadas por comas para organizar tus campañas"
								/>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Divider />
						</Grid>

						{/* Campaign schedule section */}
						<Grid item xs={12}>
							<Typography variant="h5" gutterBottom>
								Programación
							</Typography>
						</Grid>

						{/* Date pickers wrapped in LocalizationProvider */}
						<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
							{/* Start date */}
							<Grid item xs={12} md={6}>
								<FormControl fullWidth error={formik.touched.startDate && Boolean(formik.errors.startDate)}>
									<DatePicker
										label="Fecha de inicio"
										value={formik.values.startDate}
										onChange={(date) => formik.setFieldValue("startDate", date)}
										slotProps={{
											textField: {
												variant: "outlined",
												fullWidth: true,
												error: formik.touched.startDate && Boolean(formik.errors.startDate),
												helperText: formik.touched.startDate && (formik.errors.startDate as string),
											},
										}}
									/>
								</FormControl>
							</Grid>

							{/* End date - only shows if not permanent */}
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									<FormControl fullWidth error={formik.touched.endDate && Boolean(formik.errors.endDate)}>
										<DatePicker
											label="Fecha de fin"
											value={formik.values.endDate}
											onChange={(date) => formik.setFieldValue("endDate", date)}
											disabled={formik.values.isPermanent}
											slotProps={{
												textField: {
													variant: "outlined",
													fullWidth: true,
													error: formik.touched.endDate && Boolean(formik.errors.endDate),
													helperText: formik.touched.endDate && (formik.errors.endDate as string),
												},
											}}
										/>
									</FormControl>
								</Stack>
							</Grid>
						</LocalizationProvider>

						{/* Permanent campaign switch */}
						<Grid item xs={12}>
							<FormControlLabel
								control={<Switch checked={formik.values.isPermanent} onChange={handlePermanentToggle} name="isPermanent" color="primary" />}
								label="Campaña permanente (sin fecha de finalización)"
							/>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={handleClose} color="inherit">
						Cancelar
					</Button>
					<LoadingButton type="submit" variant="contained" loading={loading}>
						{isEditMode ? "Guardar cambios" : "Crear campaña"}
					</LoadingButton>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default CampaignFormModal;
