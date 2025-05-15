import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Grid,
	TextField,
	Box,
	IconButton,
	CircularProgress,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Divider,
	Chip,
	Stack,
	FormHelperText,
	Paper,
	RadioGroup,
	FormControlLabel,
	Radio,
	Tooltip,
	Autocomplete,
} from "@mui/material";
import { AddCircle, CloseCircle, Information, Trash } from "iconsax-react";
import { SegmentInput, FilterOperator, SegmentFilter, ConditionOperator, SegmentType, Segment } from "types/segment";
import { SegmentService } from "store/reducers/segments";
import { MarketingContactService } from "store/reducers/marketing-contacts";
import { MarketingContact } from "types/marketing-contact";

interface SegmentFormModalProps {
	open: boolean;
	onClose: () => void;
	onSave: () => void; // Callback para actualizar la lista después de guardar
	segment?: Segment | null; // Segmento a editar, null para crear uno nuevo
}

// Opciones de campos para condiciones
const FIELD_OPTIONS = [
	{ value: "email", label: "Email" },
	{ value: "firstName", label: "Nombre" },
	{ value: "lastName", label: "Apellido" },
	{ value: "company", label: "Empresa" },
	{ value: "position", label: "Cargo" },
	{ value: "status", label: "Estado" },
	{ value: "tags", label: "Etiquetas" },
	{ value: "subscriptionType", label: "Suscripción" },
	{ value: "isAppUser", label: "Usuario" },
	{ value: "isVerified", label: "Verificado" },
	{ value: "totalCampaigns", label: "Número de campañas" },
	{ value: "openRate", label: "Tasa de apertura" },
	{ value: "clickRate", label: "Tasa de clics" },
	{ value: "lastActivity", label: "Última actividad" },
];

// Opciones de operadores para condiciones
const OPERATOR_OPTIONS: { [key: string]: { value: FilterOperator; label: string }[] } = {
	default: [
		{ value: "equals", label: "Igual a" },
		{ value: "not_equals", label: "No igual a" },
		{ value: "contains", label: "Contiene" },
		{ value: "not_contains", label: "No contiene" },
		{ value: "starts_with", label: "Empieza con" },
		{ value: "ends_with", label: "Termina con" },
		{ value: "exists", label: "Tiene valor" },
		{ value: "not_exists", label: "No tiene valor" },
	],
	number: [
		{ value: "equals", label: "Igual a" },
		{ value: "not_equals", label: "No igual a" },
		{ value: "greater_than", label: "Mayor que" },
		{ value: "less_than", label: "Menor que" },
		{ value: "between", label: "Entre" },
		{ value: "not_between", label: "No entre" },
	],
	date: [
		{ value: "equals", label: "Igual a" },
		{ value: "not_equals", label: "No igual a" },
		{ value: "greater_than", label: "Después de" },
		{ value: "less_than", label: "Antes de" },
		{ value: "between", label: "Entre fechas" },
	],
	boolean: [
		{ value: "equals", label: "Igual a" },
		{ value: "not_equals", label: "No igual a" },
	],
	status: [
		{ value: "equals", label: "Igual a" },
		{ value: "not_equals", label: "No igual a" },
		{ value: "in", label: "Es alguno de" },
		{ value: "not_in", label: "No es ninguno de" },
	],
	tags: [
		{ value: "contains", label: "Tiene la etiqueta" },
		{ value: "not_contains", label: "No tiene la etiqueta" },
		{ value: "exists", label: "Tiene etiquetas" },
		{ value: "not_exists", label: "No tiene etiquetas" },
	],
};

// Valores por defecto para operadores
const DEFAULT_OPERATOR_BY_FIELD: { [key: string]: string } = {
	email: "contains",
	firstName: "contains",
	lastName: "contains",
	company: "contains",
	position: "contains",
	status: "equals",
	tags: "contains",
	subscriptionType: "equals",
	isAppUser: "equals",
	isVerified: "equals",
	totalCampaigns: "greater_than",
	openRate: "greater_than",
	clickRate: "greater_than",
	lastActivity: "greater_than",
};

// Operadores que no necesitan valor
const NO_VALUE_OPERATORS: FilterOperator[] = ["exists", "not_exists"];

// Operadores que necesitan dos valores
const DUAL_VALUE_OPERATORS: FilterOperator[] = ["between", "not_between"];

// Valores para el campo status
const STATUS_OPTIONS = [
	{ value: "active", label: "Activo" },
	{ value: "unsubscribed", label: "Cancelado" },
	{ value: "bounced", label: "Rebotado" },
	{ value: "complained", label: "Reclamado" },
];

// Valores para el campo subscription
const SUBSCRIPTION_OPTIONS = [
	{ value: "free", label: "Free" },
	{ value: "standard", label: "Standard" },
	{ value: "premium", label: "Premium" },
];

// Valores para campos booleanos
const BOOLEAN_OPTIONS = [
	{ value: "true", label: "Sí" },
	{ value: "false", label: "No" },
];

const SegmentFormModal: React.FC<SegmentFormModalProps> = ({ open, onClose, onSave, segment }) => {
	// Estado para carga y errores
	const [loading, setLoading] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<Record<string, string>>({});
	const [estimatedCount, setEstimatedCount] = useState<number>(0);
	const [isCalculating, setIsCalculating] = useState<boolean>(false);
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [loadingTags, setLoadingTags] = useState<boolean>(false);
	
	// Determinar si estamos en modo edición
	const isEditMode = !!segment;
	
	// Consola de depuración (eliminar en producción)
	useEffect(() => {
		if (availableTags.length > 0) {
			console.log("Tags loaded:", availableTags);
		}
	}, [availableTags]);

	// Datos del formulario
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [type, setType] = useState<SegmentType>("dynamic");
	const [conditionOperator, setConditionOperator] = useState<ConditionOperator>("and");

	// Para segmentos dinámicos
	const [filters, setFilters] = useState<SegmentFilter[]>([
		{
			field: "email",
			operator: "contains",
			value: "",
		},
	]);

	// Para segmentos estáticos
	const [contacts, setContacts] = useState<string[]>([]);
	const [availableContacts, setAvailableContacts] = useState<MarketingContact[]>([]);
	const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
	const [contactSearchTerm, setContactSearchTerm] = useState<string>("");

	// Reinicar formulario y cargar datos si es modo edición
	useEffect(() => {
		if (open) {
			resetForm();
			fetchAvailableContacts();
			fetchAvailableTags();
			
			// Si es modo edición, cargar los datos del segmento
			if (isEditMode && segment) {
				setName(segment.name);
				setDescription(segment.description || "");
				setType(segment.type);
				
				if (segment.type === "dynamic" && segment.conditions) {
					setConditionOperator(segment.conditions.operator);
					setFilters(segment.conditions.filters || []);
				} else if (segment.type === "static" && segment.contacts) {
					setSelectedContactIds(segment.contacts);
				}
				
				// Establecer conteo estimado para segmentos dinámicos
				if (segment.estimatedCount !== undefined) {
					setEstimatedCount(segment.estimatedCount);
				}
			}
		}
	}, [open, isEditMode, segment]);

	// Calcular conteo estimado cuando cambien las condiciones
	useEffect(() => {
		if (type === "dynamic" && filters.length > 0) {
			calculateEstimatedCount();
		}
	}, [type, filters, conditionOperator]);

	// Obtener contactos disponibles para seleccionar en modo estático
	const fetchAvailableContacts = async () => {
		try {
			setLoading(true);
			const response = await MarketingContactService.getContacts(1, 100);
			setAvailableContacts(response.data);
		} catch (err: any) {
			console.error("Error fetching contacts:", err);
			setError(err?.message || "No se pudieron cargar los contactos");
		} finally {
			setLoading(false);
		}
	};
	
	// Obtener etiquetas disponibles para el campo de etiquetas
	const fetchAvailableTags = async () => {
		try {
			setLoadingTags(true);
			const tags = await MarketingContactService.getTags();
			setAvailableTags(tags);
		} catch (err: any) {
			console.error("Error fetching tags:", err);
			// No mostrar error al usuario para no interrumpir el flujo principal
		} finally {
			setLoadingTags(false);
		}
	};

	// Resetear el formulario
	const resetForm = () => {
		setName("");
		setDescription("");
		setType("dynamic");
		setConditionOperator("and");
		setFilters([{ field: "email", operator: "contains", value: "" }]);
		setContacts([]);
		setSelectedContactIds([]);
		setContactSearchTerm("");
		setFormError({});
		setEstimatedCount(0);
	};

	// Validar formulario
	const validateForm = (): boolean => {
		const errors: Record<string, string> = {};

		// Validar nombre
		if (!name.trim()) {
			errors.name = "El nombre es obligatorio";
		}

		// Validar tipo y opciones específicas
		if (type === "dynamic") {
			const invalidFilters = filters.filter(
				(filter) => !filter.field || !filter.operator || (!NO_VALUE_OPERATORS.includes(filter.operator) && filter.value === undefined),
			);

			if (invalidFilters.length > 0) {
				errors.filters = "Todas las condiciones deben estar completas";
			}
		} else if (type === "static" && contacts.length === 0) {
			errors.contacts = "Debe seleccionar al menos un contacto";
		}

		setFormError(errors);
		return Object.keys(errors).length === 0;
	};

	// Calcular conteo estimado de contactos
	const calculateEstimatedCount = async () => {
		try {
			if (filters.length === 0) {
				setEstimatedCount(0);
				return;
			}

			setIsCalculating(true);
			const conditions = {
				operator: conditionOperator,
				filters: filters.map((filter) => {
					// Crear una copia adecuada según el tipo de operador
					if (NO_VALUE_OPERATORS.includes(filter.operator)) {
						return { field: filter.field, operator: filter.operator };
					} else if (DUAL_VALUE_OPERATORS.includes(filter.operator) && filter.values) {
						return { field: filter.field, operator: filter.operator, values: filter.values };
					} else {
						return { field: filter.field, operator: filter.operator, value: filter.value };
					}
				}),
			};

			const response = await SegmentService.calculateSegmentCount(conditions);
			setEstimatedCount(response.count);
		} catch (err) {
			console.error("Error calculating count:", err);
			setEstimatedCount(0);
		} finally {
			setIsCalculating(false);
		}
	};

	// Manejar cambios en los filtros
	const handleAddFilter = () => {
		const newFilter: SegmentFilter = {
			field: "email",
			operator: "contains",
			value: "",
		};
		setFilters([...filters, newFilter]);
	};

	const handleRemoveFilter = (index: number) => {
		const newFilters = [...filters];
		newFilters.splice(index, 1);
		setFilters(newFilters);
	};

	const handleFilterChange = (index: number, field: string, value: any) => {
		const newFilters = [...filters];

		// Si cambia el campo, resetear el operador y el valor
		if (field === "field") {
			const fieldValue = value as string;
			const defaultOperator = DEFAULT_OPERATOR_BY_FIELD[fieldValue] || "equals";

			newFilters[index] = {
				field: fieldValue,
				operator: defaultOperator as FilterOperator,
				value: "",
			};

			// Para operadores que no necesitan valor
			if (NO_VALUE_OPERATORS.includes(defaultOperator as FilterOperator)) {
				delete newFilters[index].value;
			}

			// Para operadores que necesitan dos valores
			if (DUAL_VALUE_OPERATORS.includes(defaultOperator as FilterOperator)) {
				newFilters[index].values = ["", ""];
				delete newFilters[index].value;
			}
		}
		// Si cambia el operador
		else if (field === "operator") {
			const operatorValue = value as FilterOperator;

			// Resetear valores según el operador
			if (NO_VALUE_OPERATORS.includes(operatorValue)) {
				delete newFilters[index].value;
				delete newFilters[index].values;
			} else if (DUAL_VALUE_OPERATORS.includes(operatorValue)) {
				newFilters[index].values = newFilters[index].values || ["", ""];
				delete newFilters[index].value;
			} else {
				newFilters[index].value = newFilters[index].value || "";
				delete newFilters[index].values;
			}

			newFilters[index].operator = operatorValue;
		}
		// Si cambia un valor
		else if (field === "value") {
			newFilters[index].value = value;
		}
		// Si cambia uno de los valores duales
		else if (field === "values") {
			newFilters[index].values = value;
		}

		setFilters(newFilters);
	};

	// Manejar búsqueda de contactos
	const handleContactSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setContactSearchTerm(event.target.value);
	};

	// Filtrar contactos disponibles según la búsqueda
	const filteredContacts = contactSearchTerm
		? availableContacts.filter(
				(contact) =>
					contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
					(contact.firstName && contact.firstName.toLowerCase().includes(contactSearchTerm.toLowerCase())) ||
					(contact.lastName && contact.lastName.toLowerCase().includes(contactSearchTerm.toLowerCase())),
		  )
		: availableContacts;

	// Manejar selección de contactos
	const handleContactSelect = (contactId: string) => {
		if (selectedContactIds.includes(contactId)) {
			setSelectedContactIds(selectedContactIds.filter((id) => id !== contactId));
		} else {
			setSelectedContactIds([...selectedContactIds, contactId]);
		}
	};

	// Guardar segmento (crear o actualizar)
	const handleSave = async () => {
		if (!validateForm()) return;

		try {
			setSaving(true);
			setError(null);

			let segmentData: SegmentInput = {
				name,
				description: description.trim() || undefined,
				isActive: true,
			};

			// Solo enviar el tipo en modo creación, no se puede cambiar en edición
			if (!isEditMode) {
				segmentData.type = type;
			}

			if (type === "dynamic") {
				segmentData.conditions = {
					operator: conditionOperator,
					filters: filters.map((filter) => {
						// Crear una copia adecuada según el tipo de operador
						if (NO_VALUE_OPERATORS.includes(filter.operator)) {
							return { field: filter.field, operator: filter.operator };
						} else if (DUAL_VALUE_OPERATORS.includes(filter.operator) && filter.values) {
							return { field: filter.field, operator: filter.operator, values: filter.values };
						} else {
							return { field: filter.field, operator: filter.operator, value: filter.value };
						}
					}),
				};
			} else if (type === "static") {
				segmentData.contacts = selectedContactIds;
			}

			if (isEditMode && segment?._id) {
				// Modo edición - actualizar segmento existente
				await SegmentService.updateSegment(segment._id, segmentData);
			} else {
				// Modo creación - crear nuevo segmento
				await SegmentService.createSegment(segmentData);
			}

			// Éxito - cerrar modal y actualizar lista
			onSave();
			onClose();
		} catch (err: any) {
			console.error(isEditMode ? "Error updating segment:" : "Error creating segment:", err);
			setError(err?.message || (isEditMode ? "No se pudo actualizar el segmento" : "No se pudo crear el segmento"));
		} finally {
			setSaving(false);
		}
	};

	// Obtener operadores disponibles para un campo
	const getOperatorsForField = (fieldName: string): { value: FilterOperator; label: string }[] => {
		if (fieldName === "status") return OPERATOR_OPTIONS.status;
		if (fieldName === "subscriptionType") return OPERATOR_OPTIONS.status; // Usar los mismos operadores que status
		if (fieldName === "tags") return OPERATOR_OPTIONS.tags;
		if (["isAppUser", "isVerified"].includes(fieldName)) return OPERATOR_OPTIONS.boolean;
		if (["totalCampaigns", "openRate", "clickRate"].includes(fieldName)) return OPERATOR_OPTIONS.number;
		if (fieldName === "lastActivity") return OPERATOR_OPTIONS.date;
		return OPERATOR_OPTIONS.default;
	};

	// Renderizar campo de valor según el tipo de operador y campo
	const renderValueInput = (filter: SegmentFilter, index: number) => {
		// No mostrar campo de valor para operadores que no lo necesitan
		if (NO_VALUE_OPERATORS.includes(filter.operator)) {
			return null;
		}

		// Para operadores que requieren dos valores
		if (DUAL_VALUE_OPERATORS.includes(filter.operator)) {
			return (
				<Grid container spacing={1}>
					<Grid item xs={6}>
						<TextField
							fullWidth
							size="small"
							label="Valor mínimo"
							value={filter.values?.[0] || ""}
							onChange={(e) => {
								const newValues = [...(filter.values || ["", ""])];
								newValues[0] = e.target.value;
								handleFilterChange(index, "values", newValues);
							}}
							disabled={saving}
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							fullWidth
							size="small"
							label="Valor máximo"
							value={filter.values?.[1] || ""}
							onChange={(e) => {
								const newValues = [...(filter.values || ["", ""])];
								newValues[1] = e.target.value;
								handleFilterChange(index, "values", newValues);
							}}
							disabled={saving}
						/>
					</Grid>
				</Grid>
			);
		}

		// Para el campo de estado
		if (filter.field === "status") {
			return (
				<FormControl fullWidth size="small">
					<InputLabel>Estado</InputLabel>
					<Select
						value={filter.value || ""}
						label="Estado"
						onChange={(e) => handleFilterChange(index, "value", e.target.value)}
						disabled={saving}
					>
						{STATUS_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			);
		}
		
		// Para el campo de suscripción
		if (filter.field === "subscriptionType") {
			return (
				<FormControl fullWidth size="small">
					<InputLabel>Suscripción</InputLabel>
					<Select
						value={filter.value || ""}
						label="Suscripción"
						onChange={(e) => handleFilterChange(index, "value", e.target.value)}
						disabled={saving}
					>
						{SUBSCRIPTION_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			);
		}
		
		// Para campos booleanos (Usuario, Verificado)
		if (filter.field === "isAppUser" || filter.field === "isVerified") {
			const fieldLabel = filter.field === "isAppUser" ? "Usuario" : "Verificado";
			return (
				<FormControl fullWidth size="small">
					<InputLabel>{fieldLabel}</InputLabel>
					<Select
						value={filter.value || ""}
						label={fieldLabel}
						onChange={(e) => handleFilterChange(index, "value", e.target.value)}
						disabled={saving}
					>
						{BOOLEAN_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			);
		}
		
		// Para el campo de etiquetas
		if (filter.field === "tags") {
			return (
				<Autocomplete
					fullWidth
					size="small"
					options={availableTags}
					loading={loadingTags}
					value={filter.value || null}
					onChange={(_, newValue) => handleFilterChange(index, "value", newValue || "")}
					disabled={saving}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Etiqueta"
							placeholder="Seleccione una etiqueta"
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{loadingTags ? <CircularProgress color="inherit" size={20} /> : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
				/>
			);
		}

		// Para campos numéricos
		if (["totalCampaigns", "openRate", "clickRate"].includes(filter.field)) {
			return (
				<TextField
					fullWidth
					type="number"
					size="small"
					label="Valor"
					value={filter.value || ""}
					onChange={(e) => handleFilterChange(index, "value", e.target.value)}
					disabled={saving}
				/>
			);
		}

		// Para fechas
		if (filter.field === "lastActivity") {
			return (
				<TextField
					fullWidth
					type="date"
					size="small"
					InputLabelProps={{ shrink: true }}
					label="Fecha"
					value={filter.value || ""}
					onChange={(e) => handleFilterChange(index, "value", e.target.value)}
					disabled={saving}
				/>
			);
		}

		// Valor por defecto para texto
		return (
			<TextField
				fullWidth
				size="small"
				label="Valor"
				value={filter.value || ""}
				onChange={(e) => handleFilterChange(index, "value", e.target.value)}
				disabled={saving}
			/>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					borderRadius: 2,
				},
			}}
		>
			<DialogTitle>
				<Grid container alignItems="center" justifyContent="space-between">
					<Grid item>
						<Typography variant="h5">{isEditMode ? "Editar Segmento" : "Crear Nuevo Segmento"}</Typography>
					</Grid>
					<Grid item>
						<IconButton onClick={onClose} size="small">
							<CloseCircle variant="Bold" />
						</IconButton>
					</Grid>
				</Grid>
			</DialogTitle>

			<DialogContent dividers>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
						<CircularProgress />
					</Box>
				) : error ? (
					<Alert severity="error" sx={{ my: 2 }}>
						{error}
					</Alert>
				) : (
					<Grid container spacing={2}>
						{/* Información básica */}
						<Grid item xs={12}>
							<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
								Información Básica
							</Typography>
							<Divider sx={{ mb: 2 }} />
						</Grid>

						<Grid item xs={12}>
							<TextField
								fullWidth
								required
								label="Nombre del segmento"
								name="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								error={!!formError.name}
								helperText={formError.name}
								disabled={saving}
							/>
						</Grid>

						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Descripción"
								name="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								multiline
								rows={2}
								disabled={saving}
							/>
						</Grid>

						{/* Tipo de segmento */}
						<Grid item xs={12}>
							<Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
								Tipo de Segmento
							</Typography>
							<Divider sx={{ mb: 2 }} />

							<FormControl component="fieldset">
								<RadioGroup row value={type} onChange={(e) => setType(e.target.value as SegmentType)}>
									<FormControlLabel
										value="dynamic"
										control={<Radio />}
										label={
											<Box>
												<Typography component="span" variant="body1">
													Dinámico{" "}
												</Typography>
												<Tooltip title="Los segmentos dinámicos se actualizan automáticamente cuando los contactos cumplen o dejan de cumplir los criterios definidos">
													<IconButton size="small" sx={{ ml: 0.5 }}>
														<Information variant="Bold" size={16} />
													</IconButton>
												</Tooltip>
											</Box>
										}
										disabled={saving || isEditMode}
									/>
									<FormControlLabel
										value="static"
										control={<Radio />}
										label={
											<Box>
												<Typography component="span" variant="body1">
													Estático{" "}
												</Typography>
												<Tooltip title="Los segmentos estáticos contienen una lista fija de contactos que no cambia automáticamente">
													<IconButton size="small" sx={{ ml: 0.5 }}>
														<Information variant="Bold" size={16} />
													</IconButton>
												</Tooltip>
											</Box>
										}
										disabled={saving || isEditMode}
									/>
								</RadioGroup>
								{isEditMode && (
									<FormHelperText>
										No es posible cambiar el tipo de segmento una vez creado.
									</FormHelperText>
								)}
							</FormControl>
						</Grid>

						{/* Configuración específica según el tipo */}
						{type === "dynamic" ? (
							<>
								{/* Criterios para segmentos dinámicos */}
								<Grid item xs={12}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 1 }}>
										<Typography variant="subtitle1" fontWeight="bold">
											Criterios de Segmentación
										</Typography>
										<Tooltip title="Los contactos que cumplan estos criterios serán incluidos automáticamente en el segmento">
											<IconButton size="small">
												<Information variant="Bold" size={16} />
											</IconButton>
										</Tooltip>
									</Box>
									<Divider sx={{ mb: 2 }} />

									<Box sx={{ mb: 2 }}>
										<FormControl component="fieldset">
											<Typography variant="body2" gutterBottom>
												Los contactos deben cumplir:
											</Typography>
											<RadioGroup row value={conditionOperator} onChange={(e) => setConditionOperator(e.target.value as ConditionOperator)}>
												<FormControlLabel value="and" control={<Radio color="primary" />} label="Todas las condiciones" disabled={saving} />
												<FormControlLabel value="or" control={<Radio color="primary" />} label="Al menos una condición" disabled={saving} />
											</RadioGroup>
										</FormControl>
									</Box>

									{/* Lista de filtros */}
									{filters.map((filter, index) => (
										<Paper
											key={index}
											elevation={0}
											sx={{
												p: 2,
												mb: 2,
												border: "1px solid",
												borderColor: "divider",
												borderRadius: 1,
											}}
										>
											<Grid container spacing={2} alignItems="center">
												<Grid item xs={12} md={3}>
													<FormControl fullWidth size="small">
														<InputLabel>Campo</InputLabel>
														<Select
															value={filter.field}
															label="Campo"
															onChange={(e) => handleFilterChange(index, "field", e.target.value)}
															disabled={saving}
														>
															{FIELD_OPTIONS.map((option) => (
																<MenuItem key={option.value} value={option.value}>
																	{option.label}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</Grid>

												<Grid item xs={12} md={3}>
													<FormControl fullWidth size="small">
														<InputLabel>Operador</InputLabel>
														<Select
															value={filter.operator}
															label="Operador"
															onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
															disabled={saving}
														>
															{getOperatorsForField(filter.field).map((option) => (
																<MenuItem key={option.value} value={option.value}>
																	{option.label}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</Grid>

												<Grid item xs={12} md={NO_VALUE_OPERATORS.includes(filter.operator) ? 3 : 5}>
													{renderValueInput(filter, index)}
												</Grid>

												<Grid item xs={12} md={1}>
													<IconButton color="error" onClick={() => handleRemoveFilter(index)} disabled={filters.length === 1 || saving}>
														<Trash size={18} />
													</IconButton>
												</Grid>
											</Grid>
										</Paper>
									))}

									{formError.filters && <FormHelperText error>{formError.filters}</FormHelperText>}

									<Button startIcon={<AddCircle />} variant="outlined" onClick={handleAddFilter} disabled={saving} sx={{ mt: 1 }}>
										Añadir condición
									</Button>

									{/* Previsualización */}
									<Paper
										sx={{
											mt: 3,
											p: 2,
											bgcolor: "action.hover",
											borderRadius: 1,
										}}
									>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography variant="subtitle2">Contactos estimados:</Typography>
											{isCalculating ? (
												<CircularProgress size={20} />
											) : (
												<Chip label={`${estimatedCount} contactos`} color="primary" variant="outlined" />
											)}
										</Stack>
									</Paper>
								</Grid>
							</>
						) : (
							<>
								{/* Selección de contactos para segmentos estáticos */}
								<Grid item xs={12}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2, mt: 1 }}>
										<Typography variant="subtitle1" fontWeight="bold">
											Selección de Contactos
										</Typography>
										<Tooltip title="Seleccione los contactos que desea incluir en este segmento">
											<IconButton size="small">
												<Information variant="Bold" size={16} />
											</IconButton>
										</Tooltip>
									</Box>
									<Divider sx={{ mb: 2 }} />

									<TextField
										fullWidth
										label="Buscar contactos"
										placeholder="Buscar por email, nombre o apellido"
										value={contactSearchTerm}
										onChange={handleContactSearch}
										sx={{ mb: 2 }}
										disabled={saving}
									/>

									<Paper
										variant="outlined"
										sx={{
											maxHeight: 300,
											overflow: "auto",
											border: "1px solid",
											borderColor: "divider",
										}}
									>
										{filteredContacts.length === 0 ? (
											<Box sx={{ p: 2, textAlign: "center" }}>
												<Typography variant="body2" color="textSecondary">
													No se encontraron contactos
												</Typography>
											</Box>
										) : (
											<Box component="ul" sx={{ p: 0, m: 0, listStyle: "none" }}>
												{filteredContacts.map((contact) => (
													<Box
														component="li"
														key={contact._id}
														sx={{
															p: 1.5,
															borderBottom: "1px solid",
															borderColor: "divider",
															"&:last-child": {
																borderBottom: "none",
															},
														}}
													>
														<FormControlLabel
															control={
																<Radio
																	checked={selectedContactIds.includes(contact._id || "")}
																	onChange={() => handleContactSelect(contact._id || "")}
																	disabled={saving}
																/>
															}
															label={
																<Box>
																	<Typography variant="body2" component="div">
																		{contact.email}
																	</Typography>
																	{(contact.firstName || contact.lastName) && (
																		<Typography variant="caption" color="textSecondary">
																			{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
																		</Typography>
																	)}
																</Box>
															}
														/>
													</Box>
												))}
											</Box>
										)}
									</Paper>

									{formError.contacts && <FormHelperText error>{formError.contacts}</FormHelperText>}

									<Paper
										sx={{
											mt: 2,
											p: 2,
											bgcolor: "action.hover",
											borderRadius: 1,
										}}
									>
										<Typography variant="subtitle2">{selectedContactIds.length} contactos seleccionados</Typography>
									</Paper>
								</Grid>
							</>
						)}
					</Grid>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} color="inherit" disabled={saving}>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					color="primary"
					variant="contained"
					disabled={loading || saving || !name}
					startIcon={saving && <CircularProgress size={20} color="inherit" />}
				>
					{saving ? "Guardando..." : (isEditMode ? "Actualizar Segmento" : "Crear Segmento")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SegmentFormModal;