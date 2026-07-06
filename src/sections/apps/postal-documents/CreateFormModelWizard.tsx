import { useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControlLabel,
	IconButton,
	MenuItem,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
	Add,
	ArrowLeft2,
	CloseCircle,
	CloseSquare,
	DocumentText,
	DocumentUpload,
	InfoCircle,
	TickCircle,
	Trash,
	Warning2,
} from "iconsax-react";
import { dispatch } from "store";
import { createUserTemplate, getTemplatePlaceholders, parseDocxTemplate, updateUserTemplate } from "store/reducers/postalDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { PdfTemplate } from "types/postal-document";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ── Tipos ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "multiline" | "date" | "checkbox" | "radio" | "select" | "ai-prompt";

interface BuilderField {
	id: string;
	label: string;
	type: FieldType;
	group: string;
	required: boolean;
	options: string[];
	docxField: string;
	aiPrompt: string;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
	{ value: "text", label: "Texto corto" },
	{ value: "multiline", label: "Texto largo" },
	{ value: "date", label: "Fecha" },
	{ value: "checkbox", label: "Casilla (sí / no)" },
	{ value: "radio", label: "Opción única" },
	{ value: "select", label: "Lista desplegable" },
	{ value: "ai-prompt", label: "Campo con IA" },
];

const CATEGORIES = [
	{ value: "judicial", label: "Judicial" },
	{ value: "laboral", label: "Laboral" },
	{ value: "societario", label: "Societario" },
	{ value: "notarial", label: "Notarial" },
	{ value: "postal", label: "Postal" },
	{ value: "otros", label: "Otros" },
];

const STEPS = ["Datos y documento", "Campos", "Revisión"];

let _idSeq = 0;
const newId = () => `f${++_idSeq}`;

const slugify = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 40);

// ── Componente ───────────────────────────────────────────────────────────────

const BUILDER_TYPES: FieldType[] = ["text", "multiline", "date", "checkbox", "radio", "select", "ai-prompt"];

// Mapea los fields de un PdfTemplate a los BuilderField editables (descarta system/flow-section).
const toBuilderFields = (tpl: PdfTemplate): BuilderField[] =>
	(tpl.fields || [])
		.filter((f) => f.type !== "flow-section" && f.group !== "__system")
		.map((f) => ({
			id: newId(),
			label: f.label || f.name,
			type: (BUILDER_TYPES as string[]).includes(f.type) ? (f.type as FieldType) : "text",
			group: f.group || "General",
			required: Boolean(f.required),
			options: f.options || [],
			docxField: f.docxField || "",
			aiPrompt: f.aiPrompt || "",
		}));

interface Props {
	open: boolean;
	onClose: () => void;
	onCreated: (t: PdfTemplate) => void;
	editTemplate?: PdfTemplate | null;
}

const CreateFormModelWizard = ({ open, onClose, onCreated, editTemplate }: Props) => {
	const isEdit = Boolean(editTemplate);
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const fileRef = useRef<HTMLInputElement>(null);

	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("judicial");

	const [docxName, setDocxName] = useState<string>("");
	const [s3Key, setS3Key] = useState<string>("");
	const [placeholders, setPlaceholders] = useState<string[]>([]);
	const [parsing, setParsing] = useState(false);

	const [fields, setFields] = useState<BuilderField[]>([]);
	const [saving, setSaving] = useState(false);

	// Prefill al abrir en modo edición.
	useEffect(() => {
		if (!open || !editTemplate) return;
		setStep(0);
		setName(editTemplate.name || "");
		setDescription(editTemplate.description || "");
		setCategory(editTemplate.category || "otros");
		setFields(toBuilderFields(editTemplate));
		if (editTemplate.s3Key) {
			setS3Key(editTemplate.s3Key);
			setDocxName("Documento vinculado");
			dispatch(getTemplatePlaceholders(editTemplate._id)).then((r) => {
				if (r?.success) setPlaceholders(r.placeholders ?? []);
			});
		} else {
			setS3Key("");
			setDocxName("");
			setPlaceholders([]);
		}
	}, [open, editTemplate]);

	const reset = () => {
		setStep(0);
		setName("");
		setDescription("");
		setCategory("judicial");
		setDocxName("");
		setS3Key("");
		setPlaceholders([]);
		setFields([]);
	};

	const close = () => {
		reset();
		onClose();
	};

	const snack = (message: string, color: "success" | "error" | "warning" = "error") =>
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

	// ── Upload / parse docx ──────────────────────────────────────────────────

	const handleFile = async (file: File) => {
		if (!/\.docx?$/i.test(file.name)) {
			snack("El archivo debe ser Word (.doc o .docx)");
			return;
		}
		setParsing(true);
		const res = await dispatch(parseDocxTemplate(file));
		setParsing(false);
		if (res?.success) {
			const phs = res.placeholders ?? [];
			setDocxName(file.name);
			setS3Key(res.s3Key ?? "");
			setPlaceholders(phs);
			snack(`Documento vinculado — ${phs.length} campos detectados`, "success");
		} else {
			snack(res?.error || "No se pudo procesar el documento");
		}
	};

	const clearDoc = () => {
		setDocxName("");
		setS3Key("");
		setPlaceholders([]);
		// desvincula el mapeo de los campos
		setFields((prev) => prev.map((f) => ({ ...f, docxField: "" })));
	};

	// crea un campo por cada placeholder detectado (auto-mapeado)
	const autofillFromPlaceholders = () => {
		const existing = new Set(fields.map((f) => f.docxField).filter(Boolean));
		const created: BuilderField[] = placeholders
			.filter((p) => !existing.has(p))
			.map((p) => ({ id: newId(), label: p, type: "text" as FieldType, group: "General", required: false, options: [], docxField: p, aiPrompt: "" }));
		if (!created.length) {
			snack("Ya hay un campo para cada placeholder", "warning");
			return;
		}
		setFields((prev) => [...prev, ...created]);
	};

	// ── Campos ────────────────────────────────────────────────────────────────

	const addField = () =>
		setFields((prev) => [...prev, { id: newId(), label: "", type: "text", group: "General", required: false, options: [], docxField: "", aiPrompt: "" }]);

	const updateField = (id: string, patch: Partial<BuilderField>) =>
		setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

	const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

	// ── Validación del mapeo ────────────────────────────────────────────────────

	const validation = useMemo(() => {
		const phSet = new Set(placeholders);
		const usedPh = new Set(fields.map((f) => f.docxField).filter(Boolean));
		const matched = fields.filter((f) => f.docxField && phSet.has(f.docxField));
		const broken = fields.filter((f) => f.docxField && !phSet.has(f.docxField));
		const unmappedFields = fields.filter((f) => !f.docxField);
		const freePlaceholders = placeholders.filter((p) => !usedPh.has(p));
		return { matched, broken, unmappedFields, freePlaceholders };
	}, [fields, placeholders]);

	const hasDoc = Boolean(s3Key);

	// ── Guardar ────────────────────────────────────────────────────────────────

	const canSave =
		name.trim().length > 0 &&
		fields.length > 0 &&
		fields.every((f) => f.label.trim().length > 0) &&
		fields.every((f) => f.type !== "ai-prompt" || f.aiPrompt.trim().length > 0);

	const handleSave = async () => {
		if (!canSave) return;
		// nombres internos únicos derivados del label
		const seen = new Set<string>();
		const payloadFields = fields.map((f, i) => {
			let base = slugify(f.label) || `campo_${i + 1}`;
			let nm = base;
			let k = 2;
			while (seen.has(nm)) nm = `${base}_${k++}`;
			seen.add(nm);
			return {
				name: nm,
				label: f.label.trim(),
				type: f.type,
				group: f.group.trim() || "General",
				required: f.required,
				options: f.type === "radio" || f.type === "select" ? f.options.filter(Boolean) : [],
				order: i,
				docxField: f.docxField || "",
				aiPrompt: f.type === "ai-prompt" ? f.aiPrompt.trim() : undefined,
			};
		});
		const payload = {
			name: name.trim(),
			description: description.trim(),
			category,
			s3Key: s3Key || undefined,
			docxName: docxName || undefined,
			docxPlaceholders: placeholders,
			fields: payloadFields,
		};
		setSaving(true);
		const res =
			isEdit && editTemplate
				? await dispatch(updateUserTemplate(editTemplate._id, payload))
				: await dispatch(createUserTemplate(payload));
		setSaving(false);
		if (res?.success && res.template) {
			snack(isEdit ? "Formulario actualizado" : "Formulario creado", "success");
			onCreated(res.template);
			close();
		} else {
			snack(res?.error || "No se pudo guardar el formulario");
		}
	};

	// ── Estilos ─────────────────────────────────────────────────────────────────

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.85rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};
	const primarySx = {
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		borderRadius: 1.25,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};
	const ghostSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
	};

	const canNext = step === 0 ? name.trim().length > 0 : true;

	return (
		<Dialog
			open={open}
			onClose={close}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					flexShrink: 0,
					px: 3,
					py: 2.25,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								color: BRAND_BLUE,
							}}
						>
							<DocumentText size={20} variant="Bulk" />
						</Box>
						<Box>
							<Typography sx={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: alpha(BRAND_BLUE, 0.7) }}>
								{isEdit ? "Editar formulario" : "Nuevo formulario"}
							</Typography>
							<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
								{isEdit ? editTemplate?.name || "Editar formulario" : "Crear formulario reutilizable"}
							</Typography>
						</Box>
					</Stack>
					<IconButton onClick={close} size="small" sx={{ color: "text.secondary" }}>
						<CloseSquare size={20} variant="Linear" />
					</IconButton>
				</Stack>
				<Stepper activeStep={step} sx={{ mt: 2.25 }}>
					{STEPS.map((s) => (
						<Step key={s}>
							<StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: "0.78rem" } }}>{s}</StepLabel>
						</Step>
					))}
				</Stepper>
			</Box>

			<DialogContent sx={{ p: 3 }}>
				{/* ── Paso 0: datos + documento ── */}
				{step === 0 && (
					<Stack spacing={2.25}>
						<TextField
							label="Nombre del formulario"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							fullWidth
							size="small"
							sx={inputSx}
							placeholder="Ej. Demanda por despido"
						/>
						<TextField
							label="Descripción (opcional)"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							fullWidth
							size="small"
							multiline
							minRows={2}
							sx={inputSx}
						/>
						<TextField label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} select fullWidth size="small" sx={inputSx}>
							{CATEGORIES.map((c) => (
								<MenuItem key={c.value} value={c.value}>
									{c.label}
								</MenuItem>
							))}
						</TextField>

						{/* Documento (opcional) */}
						<Box
							sx={{
								mt: 0.5,
								p: 2,
								borderRadius: 1.5,
								border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.22)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
							}}
						>
							<input
								ref={fileRef}
								type="file"
								accept=".doc,.docx"
								hidden
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) handleFile(f);
									e.target.value = "";
								}}
							/>
							{!hasDoc ? (
								<Stack spacing={1.25} alignItems="flex-start">
									<Stack direction="row" alignItems="center" spacing={1}>
										<Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Documento modelo (.doc / .docx)</Typography>
										<Chip label="Opcional" size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: alpha(theme.palette.text.primary, 0.08) }} />
									</Stack>
									<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
										Subí tu Word con los campos entre corchetes, por ejemplo <code>[nombre del actor]</code>. Detectamos los campos automáticamente para
										vincularlos. Si todavía no lo tenés, podés crear el formulario ahora y vincular el documento después.
									</Typography>
									<Button
										onClick={() => fileRef.current?.click()}
										disabled={parsing}
										startIcon={parsing ? <CircularProgress size={14} sx={{ color: BRAND_BLUE }} /> : <DocumentUpload size={16} variant="Linear" />}
										sx={ghostSx}
										size="small"
									>
										{parsing ? "Procesando…" : "Subir documento"}
									</Button>
								</Stack>
							) : (
								<Stack direction="row" alignItems="center" justifyContent="space-between">
									<Stack direction="row" alignItems="center" spacing={1.25}>
										<TickCircle size={20} color={theme.palette.success.main} variant="Bulk" />
										<Box>
											<Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{docxName}</Typography>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{placeholders.length} campos detectados en el documento</Typography>
										</Box>
									</Stack>
									<Tooltip title="Quitar documento">
										<IconButton onClick={clearDoc} size="small" sx={{ color: "text.secondary" }}>
											<Trash size={16} variant="Linear" />
										</IconButton>
									</Tooltip>
								</Stack>
							)}
						</Box>
					</Stack>
				)}

				{/* ── Paso 1: campos ── */}
				{step === 1 && (
					<Stack spacing={2}>
						<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1}>
							<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
								{fields.length} campo{fields.length !== 1 ? "s" : ""}
								{hasDoc ? ` · ${placeholders.length} placeholders en el documento` : " · sin documento vinculado"}
							</Typography>
							<Stack direction="row" spacing={1}>
								{hasDoc && placeholders.length > 0 && (
									<Button size="small" onClick={autofillFromPlaceholders} sx={ghostSx} startIcon={<DocumentText size={15} variant="Linear" />}>
										Generar campos del documento
									</Button>
								)}
								<Button size="small" onClick={addField} sx={primarySx} startIcon={<Add size={16} />}>
									Agregar campo
								</Button>
							</Stack>
						</Stack>

						{fields.length === 0 && (
							<Box sx={{ py: 4, textAlign: "center" }}>
								<Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
									Todavía no agregaste campos.
									{hasDoc ? " Usá “Generar campos del documento” o agregá uno a mano." : " Agregá el primero."}
								</Typography>
							</Box>
						)}

						<Stack spacing={1.5}>
							{fields.map((f, idx) => (
								<FieldEditor
									key={f.id}
									field={f}
									index={idx}
									placeholders={placeholders}
									hasDoc={hasDoc}
									inputSx={inputSx}
									isDark={isDark}
									onChange={(patch) => updateField(f.id, patch)}
									onRemove={() => removeField(f.id)}
								/>
							))}
						</Stack>
					</Stack>
				)}

				{/* ── Paso 2: revisión ── */}
				{step === 2 && (
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.95rem", fontWeight: 600 }}>{name || "Formulario sin nombre"}</Typography>

						{!hasDoc ? (
							<ValidationRow
								tone="info"
								icon={<InfoCircle size={18} variant="Bulk" />}
								title="Sin documento vinculado"
								detail="El formulario se guardará con sus campos. Para generar el escrito, vinculá un .docx más adelante desde el modelo."
							/>
						) : (
							<Stack spacing={1}>
								<ValidationRow
									tone="success"
									icon={<TickCircle size={18} variant="Bulk" />}
									title={`${validation.matched.length} campo${validation.matched.length !== 1 ? "s" : ""} vinculado${validation.matched.length !== 1 ? "s" : ""} correctamente`}
									detail={validation.matched.length ? validation.matched.map((f) => f.label).join(", ") : "Ningún campo vinculado a un placeholder todavía."}
								/>
								{validation.broken.length > 0 && (
									<ValidationRow
										tone="error"
										icon={<CloseCircle size={18} variant="Bulk" />}
										title={`${validation.broken.length} campo${validation.broken.length !== 1 ? "s" : ""} con vínculo roto`}
										detail={`Apuntan a un placeholder que no existe en el documento: ${validation.broken.map((f) => `${f.label} → [${f.docxField}]`).join(", ")}`}
									/>
								)}
								{validation.freePlaceholders.length > 0 && (
									<ValidationRow
										tone="warning"
										icon={<Warning2 size={18} variant="Bulk" />}
										title={`${validation.freePlaceholders.length} placeholder${validation.freePlaceholders.length !== 1 ? "s" : ""} sin campo`}
										detail={`Quedarán vacíos al generar: ${validation.freePlaceholders.map((p) => `[${p}]`).join(", ")}`}
									/>
								)}
							</Stack>
						)}

						{!canSave && (
							<Typography sx={{ fontSize: "0.75rem", color: theme.palette.error.main }}>
								Falta completar el nombre del formulario y el rótulo de cada campo.
							</Typography>
						)}
					</Stack>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}` }}>
				{step > 0 && (
					<Button onClick={() => setStep((s) => s - 1)} sx={ghostSx} startIcon={<ArrowLeft2 size={15} />}>
						Atrás
					</Button>
				)}
				<Box sx={{ flex: 1 }} />
				{step < 2 ? (
					<Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} sx={primarySx}>
						Continuar
					</Button>
				) : (
					<Button onClick={handleSave} disabled={!canSave || saving} sx={primarySx} startIcon={saving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : undefined}>
						{saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear formulario"}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

// ── Editor de un campo ─────────────────────────────────────────────────────────

interface FieldEditorProps {
	field: BuilderField;
	index: number;
	placeholders: string[];
	hasDoc: boolean;
	inputSx: object;
	isDark: boolean;
	onChange: (patch: Partial<BuilderField>) => void;
	onRemove: () => void;
}

const FieldEditor = ({ field, index, placeholders, hasDoc, inputSx, isDark, onChange, onRemove }: FieldEditorProps) => {
	const theme = useTheme();
	const needsOptions = field.type === "radio" || field.type === "select";
	const isAi = field.type === "ai-prompt";
	const broken = hasDoc && field.docxField && !placeholders.includes(field.docxField);
	const matched = hasDoc && field.docxField && placeholders.includes(field.docxField);

	return (
		<Box
			sx={{
				p: 1.75,
				borderRadius: 1.5,
				border: `1px solid ${broken ? alpha(theme.palette.error.main, 0.5) : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
				bgcolor: "background.paper",
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
				<Box
					sx={{
						width: 22,
						height: 22,
						borderRadius: 0.75,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
						color: BRAND_BLUE,
						fontSize: "0.7rem",
						fontWeight: 700,
					}}
				>
					{index + 1}
				</Box>
				<Box sx={{ flex: 1 }} />
				{matched && <TickCircle size={16} color={theme.palette.success.main} variant="Bulk" />}
				{broken && <CloseCircle size={16} color={theme.palette.error.main} variant="Bulk" />}
				<IconButton onClick={onRemove} size="small" sx={{ color: "text.secondary" }}>
					<Trash size={15} variant="Linear" />
				</IconButton>
			</Stack>

			<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
				<TextField
					label="Rótulo"
					value={field.label}
					onChange={(e) => onChange({ label: e.target.value })}
					size="small"
					fullWidth
					sx={{ ...inputSx, flex: 2 }}
					placeholder="Ej. Nombre del actor"
				/>
				<TextField label="Tipo" value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType })} select size="small" sx={{ ...inputSx, minWidth: 160 }}>
					{FIELD_TYPES.map((t) => (
						<MenuItem key={t.value} value={t.value}>
							{t.label}
						</MenuItem>
					))}
				</TextField>
				<TextField label="Grupo" value={field.group} onChange={(e) => onChange({ group: e.target.value })} size="small" sx={{ ...inputSx, minWidth: 130 }} />
			</Stack>

			{needsOptions && (
				<TextField
					label="Opciones (una por línea)"
					value={field.options.join("\n")}
					onChange={(e) => onChange({ options: e.target.value.split("\n") })}
					size="small"
					fullWidth
					multiline
					minRows={2}
					sx={{ ...inputSx, mt: 1.25 }}
				/>
			)}

			{isAi && (
				<Box sx={{ mt: 1.25 }}>
					<TextField
						label="Instrucción para la IA"
						value={field.aiPrompt}
						onChange={(e) => onChange({ aiPrompt: e.target.value })}
						size="small"
						fullWidth
						multiline
						minRows={3}
						sx={inputSx}
						placeholder="Ej. Redactá el relato de los hechos del accidente en tono formal, a partir de los datos cargados."
					/>
					<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.75 }}>
						La IA usa los valores de los demás campos como contexto. La respuesta se inserta en el campo del documento vinculado. Consume una generación
						de tu plan por cada documento.
					</Typography>
				</Box>
			)}

			<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.25} sx={{ mt: 1.25 }}>
				{hasDoc && (
					<TextField
						label={isAi ? "Insertar la respuesta IA en" : "Vincular a campo del documento"}
						value={field.docxField}
						onChange={(e) => onChange({ docxField: e.target.value })}
						select
						size="small"
						fullWidth
						sx={{ ...inputSx, flex: 1 }}
						error={Boolean(broken)}
						helperText={broken ? "Ese placeholder ya no está en el documento" : undefined}
					>
						<MenuItem value="">— sin vincular —</MenuItem>
						{placeholders.map((p) => (
							<MenuItem key={p} value={p}>
								[{p}]
							</MenuItem>
						))}
						{broken && (
							<MenuItem value={field.docxField} sx={{ color: theme.palette.error.main }}>
								[{field.docxField}] (no existe)
							</MenuItem>
						)}
					</TextField>
				)}
				{!isAi && (
					<FormControlLabel
						control={<Checkbox size="small" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} sx={{ color: BRAND_BLUE, "&.Mui-checked": { color: BRAND_BLUE } }} />}
						label={<Typography sx={{ fontSize: "0.8rem" }}>Obligatorio</Typography>}
					/>
				)}
			</Stack>
		</Box>
	);
};

// ── Fila de validación ─────────────────────────────────────────────────────────

const ValidationRow = ({ tone, icon, title, detail }: { tone: "success" | "error" | "warning" | "info"; icon: React.ReactNode; title: string; detail: string }) => {
	const theme = useTheme();
	const color =
		tone === "success" ? theme.palette.success.main : tone === "error" ? theme.palette.error.main : tone === "warning" ? theme.palette.warning.main : BRAND_BLUE;
	return (
		<Box sx={{ p: 1.5, borderRadius: 1.25, bgcolor: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.2)}` }}>
			<Stack direction="row" spacing={1.25}>
				<Box sx={{ color, mt: 0.1 }}>{icon}</Box>
				<Box>
					<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color }}>{title}</Typography>
					<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25, textWrap: "pretty" }}>{detail}</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

export default CreateFormModelWizard;
