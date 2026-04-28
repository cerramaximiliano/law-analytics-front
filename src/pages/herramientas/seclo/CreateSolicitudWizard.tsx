import { useEffect, useState, useCallback } from "react";
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormGroup,
	Grid,
	IconButton,
	InputLabel,
	Link as MuiLink,
	MenuItem,
	Select,
	Stack,
	Step,
	StepLabel,
	Stepper,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { Add, DocumentText, Trash } from "iconsax-react";

import { dispatch, useSelector } from "store";
import { createSolicitud, uploadDocumento } from "store/reducers/seclo";
import { getContactsByUserId } from "store/reducers/contacts";
import { getFoldersByUserId } from "store/reducers/folder";
import AddCustomer from "sections/apps/customer/AddCustomer";
import { PopupTransition } from "components/@extended/Transitions";
import {
	OBJETO_RECLAMO_OPTIONS,
	type SecloCaracter,
	type SecloDocTipo,
	type SecloDatosLaborales,
	type SecloDocumento,
} from "types/seclo";

interface Props {
	open: boolean;
	onClose: () => void;
}

const STEPS = ["Partes", "Reclamo y abogado", "Documentos", "Revisar"];

const DOC_TIPO_LABEL: Record<SecloDocTipo, string> = {
	dni:        "D.N.I del trabajador",
	credencial: "Credencial letrado",
	poder:      "Poder",
	formulario: "Formulario",
	otros:      "Otros",
};

const REQUIRED_DOCS: SecloDocTipo[] = ["dni", "credencial"];

interface DatosLaboralesEntry {
	source?: string;
	empleadorName?: string;
	fechaNacimiento?: string | null;
	fechaIngreso?: string | null;
	fechaEgreso?: string | null;
	fechaAccidente?: string | null;
	remuneracion?: number | null;
	importeReclamo?: number | null;
	cct?: string;
	categoria?: string;
	estadoTrabajador?: "regular" | "irregular" | "no_registrado" | null;
	sexo?: "M" | "F" | null;
}

interface ContactOption {
	_id: string;
	name: string;
	lastName?: string;
	cuit?: string;
	company?: string;
	type?: string;
	folderIds?: string[];
	// Domicilio estructurado — exigido por SECLO en campos separados.
	street?: string;
	streetNumber?: string;
	floor?: string;
	apartment?: string;
	address?: string;
	city?: string;
	phoneCelular?: string;
	tipoSociedad?: string;
	datosLaboralesHistorial?: DatosLaboralesEntry[];
}

interface FolderOption {
	_id: string;
	folderName: string;
	materia?: string;
	status?: string;
}

// ─── Review components ────────────────────────────────────────────────────
// Wrappers minimalistas usados en el step de "Revisar y enviar". Se mantienen
// inline porque el shape de los datos es específico de SECLO y no se
// reutiliza fuera de este wizard.

function ReviewSection({
	title, onEdit, children,
}: { title: string; onEdit?: () => void; children: React.ReactNode }) {
	return (
		<Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
				<Typography variant="subtitle2">{title}</Typography>
				{onEdit && (
					<MuiLink component="button" type="button" onClick={onEdit} sx={{ fontSize: 12 }}>
						Editar
					</MuiLink>
				)}
			</Stack>
			<Stack spacing={0.25}>{children}</Stack>
		</Box>
	);
}

function ReviewRow({
	label, value, emptyHint,
}: { label: string; value?: string | null; emptyHint?: React.ReactNode }) {
	const isEmpty = !value || !String(value).trim();
	return (
		<Box>
			<Typography variant="body2">
				<strong>{label}:</strong> {isEmpty ? "—" : value}
			</Typography>
			{isEmpty && emptyHint && (
				<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
					{emptyHint}
				</Typography>
			)}
		</Box>
	);
}

export default function CreateSolicitudWizard({ open, onClose }: Props) {
	const auth = useSelector((s: any) => s.auth);
	const userId = auth?.user?._id || auth?.user?.id;

	const [step, setStep] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Contactos del usuario
	const [contacts, setContacts] = useState<ContactOption[]>([]);
	const [contactsLoading, setContactsLoading] = useState(false);

	// Carpetas del usuario (para filtrar contactos)
	const [folders, setFolders] = useState<FolderOption[]>([]);

	// Step 1 — Partes
	const [selectedFolder, setSelectedFolder] = useState<FolderOption | null>(null);
	const [requirente, setRequirente] = useState<ContactOption | null>(null);
	const [datosLab, setDatosLab] = useState<SecloDatosLaborales>({ estadoTrabajador: "regular", sexo: "M" });
	const [requerido, setRequerido] = useState<ContactOption | null>(null);

	// Step 2 — Reclamo + abogado
	const [objetoReclamo, setObjetoReclamo] = useState<string[]>([]);
	const [comentario, setComentario] = useState("");
	const [iniciadoPor, setIniciadoPor] = useState<"trabajador" | "empleador">("trabajador");
	const [abogado, setAbogado] = useState<{ tomo: string; folio: string; caracter: SecloCaracter; cpa: string }>({
		tomo:     "",
		folio:    "",
		caracter: "apoderado",
		cpa:      "",
	});

	// Step 3 — Documentos
	const [documentos, setDocumentos] = useState<SecloDocumento[]>([]);
	const [uploadingDoc, setUploadingDoc] = useState<SecloDocTipo | null>(null);

	// Modo prueba (dry-run): el worker llena el form pero NO confirma. Sólo
	// disponible cuando MODE='development'. En producción la opción está
	// oculta y el backend ignora la bandera. Default: ON en dev para que las
	// pruebas no terminen presentando expedientes reales por accidente.
	const isDevMode = import.meta.env.MODE === "development";
	const [dryRunMode, setDryRunMode] = useState<boolean>(isDevMode);

	// Reclamantes adicionales — sólo válidos cuando iniciadoPor === 'trabajador'.
	// El portal SECLO permite agregar varios al paso 5 (grilla); el worker
	// itera presionando ctl03_btnSeguir y luego btnSeguirTrabajador. Mientras
	// la feature se valida, el worker fuerza dryRun cuando hay >1 requirente.
	const [extraRequirentes, setExtraRequirentes] = useState<Array<{ contact: ContactOption; datosLaborales: SecloDatosLaborales }>>([]);
	const [extraDialog, setExtraDialog] = useState<{ open: boolean; editIndex: number | null; contact: ContactOption | null; datosLab: SecloDatosLaborales }>({
		open: false, editIndex: null, contact: null, datosLab: { estadoTrabajador: "regular", sexo: "M" },
	});

	// Empleadores adicionales — el portal permite varios en la grilla
	// ctl02_grdEmpleadores. El worker hace loop con ctl02_btnSeguir y luego
	// btnSeguirEmpleador. Multi-empleador también fuerza dryRun.
	const [extraRequeridos, setExtraRequeridos] = useState<ContactOption[]>([]);
	const [extraRequeridoDialog, setExtraRequeridoDialog] = useState<{ open: boolean; editIndex: number | null; contact: ContactOption | null }>({
		open: false, editIndex: null, contact: null,
	});

	// Cuando el usuario abre AddCustomer (edit) desde un extra-diálogo,
	// guardamos el contexto para poder volver al extra-diálogo con el
	// contacto fresco al guardar — sin perder los datos laborales tipeados.
	const [extraReopen, setExtraReopen] = useState<{
		kind: "trabajador" | "empleador";
		editIndex: number | null;
		datosLab?: SecloDatosLaborales;
	} | null>(null);

	// Modal "Nuevo contacto" — abierto desde el step Partes para crear
	// trabajador o empleador sin salir del wizard.
	const [addCustomerFor, setAddCustomerFor] = useState<"requirente" | "requerido" | null>(null);
	const [editCustomerFor, setEditCustomerFor] = useState<{ target: "requirente" | "requerido"; contact: ContactOption } | null>(null);

	// Cargar contactos + carpetas al abrir
	useEffect(() => {
		if (!open || !userId) return;
		setContactsLoading(true);
		Promise.all([
			dispatch<any>(getContactsByUserId(userId)),
			dispatch<any>(getFoldersByUserId(userId)),
		])
			.then(([contactsRes, foldersRes]: [any, any]) => {
				setContacts(contactsRes?.contacts || []);
				setFolders(foldersRes?.folders || []);
			})
			.finally(() => setContactsLoading(false));
	}, [open, userId]);

	// Reset al cerrar
	const reset = () => {
		setStep(0);
		setError(null);
		setSelectedFolder(null);
		setRequirente(null);
		setDatosLab({ estadoTrabajador: "regular", sexo: "M" });
		setRequerido(null);
		setObjetoReclamo([]);
		setComentario("");
		setIniciadoPor("trabajador");
		setAbogado({ tomo: "", folio: "", caracter: "apoderado", cpa: "" });
		setDocumentos([]);
		setDryRunMode(isDevMode);
		setExtraRequirentes([]);
		setExtraDialog({ open: false, editIndex: null, contact: null, datosLab: { estadoTrabajador: "regular", sexo: "M" } });
		setExtraRequeridos([]);
		setExtraRequeridoDialog({ open: false, editIndex: null, contact: null });
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	// Validación por step
	// SECLO carga calle y número en campos separados — sin esos datos
	// estructurados el portal rechaza el formulario. Bloqueamos el avance
	// hasta que ambos contactos tengan calle+número.
	const hasStructuredAddress = (c: ContactOption | null) =>
		!!(c?.street?.trim() && c?.streetNumber?.trim());

	// Para personas jurídicas el portal exige el subtipo concreto (cmbTipoSociedad).
	// Para físicas se asume "Persona Física" automáticamente.
	const hasValidTipoSociedad = (c: ContactOption | null) => {
		if (!c) return false;
		// type puede venir como "Jurídica", "Persona Jurídica" — tolerante.
		const isJur = (c.type || "").toLowerCase().includes("jur");
		if (isJur) return !!c.tipoSociedad?.trim();
		return true;
	};

	const canAdvance = () => {
		if (step === 0)
			return (
				!!requirente && !!requerido && requirente._id !== requerido._id &&
				hasStructuredAddress(requirente) && hasStructuredAddress(requerido) &&
				hasValidTipoSociedad(requerido)
			);
		if (step === 1) {
			if (objetoReclamo.length === 0) return false;
			if (!abogado.tomo || !abogado.folio) return false;
			// Si el reclamo es por accidente o enfermedad, fechaAccidente es requerida
			if (objetoReclamo.some((o) => /accidente|enfermedad/i.test(o)) && !datosLab.fechaAccidente) return false;
			return true;
		}
		if (step === 2) return REQUIRED_DOCS.every((t) => documentos.some((d) => d.tipo === t));
		if (step === 3) return true; // resumen final — el submit se hace con su propio botón
		return false;
	};

	// Tras crear un contacto desde el wizard: recargar la lista forzando
	// refresh y auto-seleccionar el contacto recién creado (el _id que
	// no estaba antes en el set local).
	const handleContactCreated = async () => {
		const target = addCustomerFor;
		setAddCustomerFor(null);
		if (!userId) return;
		const before = new Set(contacts.map((c) => c._id));
		const res = await dispatch<any>(getContactsByUserId(userId, true));
		const updated = (res?.contacts || []) as ContactOption[];
		setContacts(updated);
		const newOne = updated.find((c) => !before.has(c._id));
		if (newOne) {
			if (target === "requirente") setRequirente(newOne);
			else if (target === "requerido") setRequerido(newOne);
		}
	};

	// Tras editar un contacto desde el wizard (típicamente para completar
	// calle+número faltantes): recargar y re-seleccionar el contacto editado.
	const handleContactEdited = async () => {
		const target = editCustomerFor?.target;
		const editedId = editCustomerFor?.contact._id;
		setEditCustomerFor(null);
		if (!userId || !editedId) return;
		const res = await dispatch<any>(getContactsByUserId(userId, true));
		const updated = (res?.contacts || []) as ContactOption[];
		setContacts(updated);
		const refreshed = updated.find((c) => c._id === editedId);
		if (!refreshed) return;

		// Si veníamos desde un extra-diálogo, volvemos ahí con el contacto
		// actualizado en vez de tocar requirente/requerido principales.
		if (extraReopen) {
			if (extraReopen.kind === "trabajador") {
				setExtraDialog({
					open: true,
					editIndex: extraReopen.editIndex,
					contact: refreshed,
					datosLab: extraReopen.datosLab || { estadoTrabajador: "regular", sexo: "M" },
				});
			} else {
				setExtraRequeridoDialog({
					open: true,
					editIndex: extraReopen.editIndex,
					contact: refreshed,
				});
			}
			setExtraReopen(null);
			return;
		}

		if (target === "requirente") setRequirente(refreshed);
		else if (target === "requerido") setRequerido(refreshed);
	};

	// Abre AddCustomer en modo edit para completar campos faltantes del
	// contacto seleccionado en un extra-diálogo. Cierra el extra-diálogo y
	// vuelve a abrirlo con el contacto refrescado al guardar.
	const completarDesdeExtra = (kind: "trabajador" | "empleador") => {
		if (kind === "trabajador") {
			if (!extraDialog.contact) return;
			setExtraReopen({ kind, editIndex: extraDialog.editIndex, datosLab: extraDialog.datosLab });
			setExtraDialog((s) => ({ ...s, open: false }));
			setEditCustomerFor({ target: "requirente", contact: extraDialog.contact });
		} else {
			if (!extraRequeridoDialog.contact) return;
			setExtraReopen({ kind, editIndex: extraRequeridoDialog.editIndex });
			setExtraRequeridoDialog((s) => ({ ...s, open: false }));
			setEditCustomerFor({ target: "requerido", contact: extraRequeridoDialog.contact });
		}
	};

	// Upload de un documento
	const handleFileUpload = useCallback(async (file: File, tipo: SecloDocTipo) => {
		setUploadingDoc(tipo);
		try {
			const { s3Key } = await uploadDocumento(file);
			setDocumentos((prev) => [...prev.filter((d) => d.tipo !== tipo), { tipo, s3Key, fileName: file.name }]);
		} catch (e: any) {
			setError(`Error subiendo ${DOC_TIPO_LABEL[tipo]}: ${e?.message || "—"}`);
		} finally {
			setUploadingDoc(null);
		}
	}, []);

	// Submit final
	const handleSubmit = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const allRequirentes = [
				{ contactId: requirente!._id, datosLaborales: datosLab },
				...extraRequirentes.map((r) => ({ contactId: r.contact._id, datosLaborales: r.datosLaborales })),
			];
			const allRequeridos = [
				{ contactId: requerido!._id },
				...extraRequeridos.map((c) => ({ contactId: c._id })),
			];
			await dispatch<any>(
				createSolicitud({
					...(allRequirentes.length > 1
						? { requirentes: allRequirentes }
						: { requirenteId: requirente!._id, requirenteDatosLaborales: datosLab }),
					...(allRequeridos.length > 1
						? { requeridos: allRequeridos }
						: { requeridoId: requerido!._id }),
					objetoReclamo,
					comentarioReclamo: comentario,
					iniciadoPor,
					datosAbogado: { tomo: abogado.tomo, folio: abogado.folio, caracter: abogado.caracter, domicilio: { cpa: abogado.cpa } },
					documentos,
					folderId: selectedFolder?._id ?? undefined,
					...(isDevMode && dryRunMode && { dryRun: true }),
				}),
			);
			handleClose();
		} catch (e: any) {
			setError(e?.response?.data?.message || e?.message || "Error al crear la solicitud");
		} finally {
			setSubmitting(false);
		}
	};

	// ─── Render por step ────────────────────────────────────────────────────

	const contactLabel = (c: ContactOption) =>
		`${c.name} ${c.lastName || ""}${c.cuit ? ` — ${c.cuit}` : ""}${c.company ? ` (${c.company})` : ""}`.trim();

	// ── Filtrado de contactos en cascada ──────────────────────────────────
	// 1) Si hay carpeta seleccionada → solo los contactos vinculados a esa carpeta.
	// 2) Sin carpeta → todos los contactos.
	const contactsForRequirente = selectedFolder
		? contacts.filter((c) => c.folderIds?.includes(selectedFolder._id))
		: contacts;

	// Para el empleador:
	// 1) Si hay carpeta seleccionada → solo contactos de esa carpeta (excluyendo el requirente).
	// 2) Sin carpeta + requirente con carpetas → solo los que comparten al menos una carpeta con el requirente.
	// 3) Si el filtro estricto deja sin opciones → modo permisivo (todos los contactos).
	const _baseRequerido = contacts.filter((c) => c._id !== requirente?._id);
	const contactsForRequeridoStrict = (() => {
		if (selectedFolder) return _baseRequerido.filter((c) => c.folderIds?.includes(selectedFolder._id));
		if (requirente?.folderIds?.length) {
			const reqSet = new Set(requirente.folderIds);
			return _baseRequerido.filter((c) => c.folderIds?.some((id) => reqSet.has(id)));
		}
		return _baseRequerido;
	})();
	const requeridoPermissive = !selectedFolder && !!requirente?.folderIds?.length && contactsForRequeridoStrict.length === 0;
	const contactsForRequerido = requeridoPermissive ? _baseRequerido : contactsForRequeridoStrict;

	// Carpetas en las que aparece el requirente — info útil al usuario
	const requirenteFolderNames = requirente?.folderIds?.length
		? folders.filter((f) => requirente.folderIds!.includes(f._id)).map((f) => f.folderName)
		: [];

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<Grid container spacing={2}>
						{/* Selector de carpeta (opcional) */}
						{folders.length > 0 && (
							<Grid item xs={12}>
								<Autocomplete
									options={folders}
									value={selectedFolder}
									onChange={(_, v) => {
										setSelectedFolder(v);
										// Reset selecciones que pueden quedar fuera del filtro
										setRequirente(null);
										setRequerido(null);
									}}
									getOptionLabel={(f) => `${f.folderName}${f.materia ? ` — ${f.materia}` : ""}`}
									isOptionEqualToValue={(a, b) => a._id === b._id}
									renderInput={(params) => (
										<TextField {...params} label="Vincular a carpeta (opcional)" placeholder="Sin carpeta" />
									)}
								/>
								<Typography variant="caption" color="text.secondary" mt={0.5} component="div">
									{selectedFolder
										? `Solo verás los contactos vinculados a "${selectedFolder.folderName}".`
										: "Si elegís una carpeta, los selectores de trabajador y empleador van a mostrar solo los contactos vinculados a ella."}
								</Typography>
							</Grid>
						)}

						<Grid item xs={12}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
								<Typography variant="subtitle2">Trabajador (requirente)</Typography>
								<Button
									size="small"
									startIcon={<Add size={14} />}
									onClick={() => setAddCustomerFor("requirente")}
									disabled={!userId}
								>
									Nuevo contacto
								</Button>
							</Stack>
							<Autocomplete
								options={contactsForRequirente}
								loading={contactsLoading}
								value={requirente}
								onChange={(_, v) => {
									setRequirente(v);
									// Si cambió el requirente, resetear el requerido (su filtro depende de él)
									setRequerido(null);
								}}
								getOptionLabel={contactLabel}
								isOptionEqualToValue={(a, b) => a._id === b._id}
								noOptionsText={
									selectedFolder
										? `No hay contactos en "${selectedFolder.folderName}". Creá uno con "Nuevo contacto".`
										: contactsLoading ? "Cargando…" : 'Sin contactos. Creá uno con "Nuevo contacto".'
								}
								renderInput={(params) => <TextField {...params} placeholder="Buscar contacto…" />}
							/>
							{requirenteFolderNames.length > 0 && !selectedFolder && (
								<Typography variant="caption" color="text.secondary" mt={0.5} component="div">
									Pertenece a: {requirenteFolderNames.join(", ")}
								</Typography>
							)}
							{requirente && !hasStructuredAddress(requirente) && (
								<Alert
									severity="warning"
									sx={{ mt: 1 }}
									action={
										<Button
											color="inherit"
											size="small"
											onClick={() => setEditCustomerFor({ target: "requirente", contact: requirente })}
										>
											Completar
										</Button>
									}
								>
									El trabajador no tiene <strong>calle</strong> o <strong>número</strong> cargados. SECLO los exige como campos separados.
								</Alert>
							)}
							{requirente && hasStructuredAddress(requirente) && !requirente.floor && !requirente.apartment && (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
									El trabajador no tiene piso ni departamento. Si el domicilio lo requiere, podés{" "}
									<MuiLink
										component="button"
										type="button"
										onClick={() => setEditCustomerFor({ target: "requirente", contact: requirente })}
										sx={{ verticalAlign: "baseline" }}
									>
										agregarlos
									</MuiLink>
									{" "}(son opcionales).
								</Typography>
							)}
						</Grid>

						{requirente && (
							<>
								{(requirente.datosLaboralesHistorial?.length ?? 0) > 0 && (
									<Grid item xs={12}>
										<FormControl fullWidth size="small">
											<InputLabel>Reutilizar datos laborales del historial ({requirente.datosLaboralesHistorial!.length})</InputLabel>
											<Select
												label={`Reutilizar datos laborales del historial (${requirente.datosLaboralesHistorial!.length})`}
												value=""
												onChange={(e) => {
													const idx = Number(e.target.value);
													const entry = requirente.datosLaboralesHistorial![idx];
													if (!entry) return;
													setDatosLab({
														fechaNacimiento: entry.fechaNacimiento ? entry.fechaNacimiento.slice(0, 10) : null,
														fechaIngreso:    entry.fechaIngreso ? entry.fechaIngreso.slice(0, 10) : null,
														fechaEgreso:     entry.fechaEgreso ? entry.fechaEgreso.slice(0, 10) : null,
														fechaAccidente:  entry.fechaAccidente ? entry.fechaAccidente.slice(0, 10) : null,
														remuneracion:    entry.remuneracion ?? null,
														importeReclamo:  entry.importeReclamo ?? null,
														cct:             entry.cct || "",
														categoria:       entry.categoria || "",
														estadoTrabajador: entry.estadoTrabajador || "regular",
														sexo:            entry.sexo || "M",
													});
												}}
											>
												{requirente.datosLaboralesHistorial!.map((e, i) => {
													const lab = `${e.empleadorName || "Sin empleador"} · ${e.fechaIngreso?.slice(0, 10) || "—"} → ${e.fechaEgreso?.slice(0, 10) || "—"} · $${e.remuneracion ?? "—"} · src=${e.source || "—"}`;
													return <MenuItem key={i} value={i}>{lab}</MenuItem>;
												})}
											</Select>
										</FormControl>
									</Grid>
								)}
								<Grid item xs={12} sm={6}>
									<TextField
										label="Fecha de ingreso"
										type="date"
										value={datosLab.fechaIngreso || ""}
										onChange={(e) => setDatosLab((d) => ({ ...d, fechaIngreso: e.target.value }))}
										fullWidth
										InputLabelProps={{ shrink: true }}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										label="Fecha de egreso"
										type="date"
										value={datosLab.fechaEgreso || ""}
										onChange={(e) => setDatosLab((d) => ({ ...d, fechaEgreso: e.target.value }))}
										fullWidth
										InputLabelProps={{ shrink: true }}
									/>
								</Grid>
								{/* Fecha del accidente — visible siempre acá como opcional. Si en el step
								    siguiente el objetoReclamo lo requiere, lo volvemos a mostrar inline
								    con asterisco rojo y se bloquea el avance. */}
								<Grid item xs={12} sm={6}>
									<TextField
										label="Fecha del accidente (si aplica)"
										type="date"
										value={datosLab.fechaAccidente || ""}
										onChange={(e) => setDatosLab((d) => ({ ...d, fechaAccidente: e.target.value }))}
										fullWidth
										InputLabelProps={{ shrink: true }}
										helperText="Requerido si el reclamo es por accidente o enfermedad"
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										label="Última remuneración"
										type="number"
										value={datosLab.remuneracion ?? ""}
										onChange={(e) => setDatosLab((d) => ({ ...d, remuneracion: e.target.value ? Number(e.target.value) : null }))}
										fullWidth
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField
										label="Importe del reclamo"
										type="number"
										value={datosLab.importeReclamo ?? ""}
										onChange={(e) => setDatosLab((d) => ({ ...d, importeReclamo: e.target.value ? Number(e.target.value) : null }))}
										fullWidth
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<FormControl fullWidth>
										<InputLabel>Estado</InputLabel>
										<Select
											value={datosLab.estadoTrabajador || "regular"}
											label="Estado"
											onChange={(e) => setDatosLab((d) => ({ ...d, estadoTrabajador: e.target.value as any }))}
										>
											<MenuItem value="regular">Regular</MenuItem>
											<MenuItem value="irregular">Irregular</MenuItem>
											<MenuItem value="no_registrado">No registrado</MenuItem>
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12} sm={6}>
									<FormControl fullWidth>
										<InputLabel>Sexo</InputLabel>
										<Select
											value={datosLab.sexo || "M"}
											label="Sexo"
											onChange={(e) => setDatosLab((d) => ({ ...d, sexo: e.target.value as any }))}
										>
											<MenuItem value="M">Masculino</MenuItem>
											<MenuItem value="F">Femenino</MenuItem>
										</Select>
									</FormControl>
								</Grid>
							</>
						)}

						{/* Reclamantes adicionales — sólo cuando iniciadoPor === 'trabajador'.
						    El portal SECLO permite agregar varios al paso 5 (grilla); el worker
						    presiona ctl03_btnSeguir por cada uno y luego btnSeguirTrabajador. */}
						{iniciadoPor === "trabajador" && requirente && (
							<Grid item xs={12} sx={{ mt: 1 }}>
								<Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
									<Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
										<Typography variant="subtitle2">
											Reclamantes adicionales {extraRequirentes.length > 0 && <Chip size="small" label={extraRequirentes.length} sx={{ ml: 1 }} />}
										</Typography>
										<Button
											size="small"
											variant="outlined"
											onClick={() => setExtraDialog({ open: true, editIndex: null, contact: null, datosLab: { estadoTrabajador: "regular", sexo: "M" } })}
										>
											+ Agregar reclamante
										</Button>
									</Stack>
									<Alert severity="warning" sx={{ mb: 1 }}>
										Cuando hay más de un reclamante, la solicitud corre <strong>siempre en modo prueba</strong> hasta validar el flujo end-to-end con el portal.
									</Alert>
									{extraRequirentes.length === 0 ? (
										<Typography variant="caption" color="text.secondary">
											Sólo el trabajador principal de arriba. Agregá más reclamantes si el trámite los requiere.
										</Typography>
									) : (
										<Stack spacing={0.5}>
											{extraRequirentes.map((r, i) => (
												<Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, border: 1, borderColor: "divider", borderRadius: 1, p: 1 }}>
													<Box flexGrow={1}>
														<Typography variant="body2" fontWeight={600}>
															#{i + 2} · {r.contact.name} {r.contact.lastName || ""}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{r.contact.cuit || "—"} · Ingreso: {r.datosLaborales.fechaIngreso?.toString().slice(0, 10) || "—"} · Egreso: {r.datosLaborales.fechaEgreso?.toString().slice(0, 10) || "—"}
														</Typography>
													</Box>
													<Button size="small" onClick={() => setExtraDialog({ open: true, editIndex: i, contact: r.contact, datosLab: r.datosLaborales })}>
														Editar
													</Button>
													<Button size="small" color="error" onClick={() => setExtraRequirentes((prev) => prev.filter((_, j) => j !== i))}>
														Quitar
													</Button>
												</Box>
											))}
										</Stack>
									)}
								</Box>
							</Grid>
						)}

						<Grid item xs={12} sx={{ mt: 1 }}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
								<Typography variant="subtitle2">Empleador (requerido)</Typography>
								<Button
									size="small"
									startIcon={<Add size={14} />}
									onClick={() => setAddCustomerFor("requerido")}
									disabled={!userId}
								>
									Nuevo contacto
								</Button>
							</Stack>
							<Autocomplete
								options={contactsForRequerido}
								loading={contactsLoading}
								value={requerido}
								onChange={(_, v) => setRequerido(v)}
								getOptionLabel={contactLabel}
								isOptionEqualToValue={(a, b) => a._id === b._id}
								noOptionsText={
									selectedFolder
										? `No hay otros contactos en "${selectedFolder.folderName}". Creá uno con "Nuevo contacto".`
										: contactsLoading ? "Cargando…" : 'Sin contactos. Creá uno con "Nuevo contacto".'
								}
								renderInput={(params) => <TextField {...params} placeholder="Buscar contacto…" />}
							/>
							{requeridoPermissive && (
								<Typography variant="caption" color="warning.dark" mt={0.5} component="div">
									El trabajador no comparte carpeta con ningún otro contacto — se muestran todos los contactos.
								</Typography>
							)}
							{requerido && !hasStructuredAddress(requerido) && (
								<Alert
									severity="warning"
									sx={{ mt: 1 }}
									action={
										<Button
											color="inherit"
											size="small"
											onClick={() => setEditCustomerFor({ target: "requerido", contact: requerido })}
										>
											Completar
										</Button>
									}
								>
									El empleador no tiene <strong>calle</strong> o <strong>número</strong> cargados. SECLO los exige como campos separados.
								</Alert>
							)}
							{requerido && !hasValidTipoSociedad(requerido) && (
								<Alert
									severity="warning"
									sx={{ mt: 1 }}
									action={
										<Button
											color="inherit"
											size="small"
											onClick={() => setEditCustomerFor({ target: "requerido", contact: requerido })}
										>
											Completar
										</Button>
									}
								>
									El empleador es persona jurídica pero falta el <strong>tipo</strong> (S.A., S.R.L., Cooperativa, etc.). SECLO lo exige.
								</Alert>
							)}
							{requerido && hasStructuredAddress(requerido) && !requerido.floor && !requerido.apartment && (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
									El empleador no tiene piso ni departamento. Si el domicilio lo requiere, podés{" "}
									<MuiLink
										component="button"
										type="button"
										onClick={() => setEditCustomerFor({ target: "requerido", contact: requerido })}
										sx={{ verticalAlign: "baseline" }}
									>
										agregarlos
									</MuiLink>
									{" "}(son opcionales).
								</Typography>
							)}
						</Grid>

						{/* Empleadores adicionales — el portal SECLO permite varios.
						    El worker presiona ctl02_btnSeguir por cada uno y luego
						    btnSeguirEmpleador para avanzar. */}
						{requerido && (
							<Grid item xs={12} sx={{ mt: 1 }}>
								<Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
									<Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
										<Typography variant="subtitle2">
											Empleadores adicionales {extraRequeridos.length > 0 && <Chip size="small" label={extraRequeridos.length} sx={{ ml: 1 }} />}
										</Typography>
										<Button
											size="small"
											variant="outlined"
											onClick={() => setExtraRequeridoDialog({ open: true, editIndex: null, contact: null })}
										>
											+ Agregar empleador
										</Button>
									</Stack>
									<Alert severity="warning" sx={{ mb: 1 }}>
										Cuando hay más de un empleador, la solicitud corre <strong>siempre en modo prueba</strong> hasta validar el flujo end-to-end con el portal.
									</Alert>
									{extraRequeridos.length === 0 ? (
										<Typography variant="caption" color="text.secondary">
											Sólo el empleador principal de arriba. Agregá más empleadores si el trámite los requiere.
										</Typography>
									) : (
										<Stack spacing={0.5}>
											{extraRequeridos.map((c, i) => (
												<Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, border: 1, borderColor: "divider", borderRadius: 1, p: 1 }}>
													<Box flexGrow={1}>
														<Typography variant="body2" fontWeight={600}>
															#{i + 2} · {c.company || `${c.name} ${c.lastName || ""}`.trim()}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{c.cuit || "—"} · {[c.street, c.streetNumber].filter(Boolean).join(" ") || c.address || "—"}
														</Typography>
													</Box>
													<Button size="small" onClick={() => setExtraRequeridoDialog({ open: true, editIndex: i, contact: c })}>
														Cambiar
													</Button>
													<Button size="small" color="error" onClick={() => setExtraRequeridos((prev) => prev.filter((_, j) => j !== i))}>
														Quitar
													</Button>
												</Box>
											))}
										</Stack>
									)}
								</Box>
							</Grid>
						)}
					</Grid>
				);

			case 1:
				return (
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Typography variant="subtitle2" mb={1}>Objeto del reclamo</Typography>
							<Box sx={{ maxHeight: 220, overflowY: "auto", border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
								<FormGroup>
									{OBJETO_RECLAMO_OPTIONS.map((opt) => (
										<FormControlLabel
											key={opt}
											control={
												<Checkbox
													size="small"
													checked={objetoReclamo.includes(opt)}
													onChange={(e) =>
														setObjetoReclamo((prev) =>
															e.target.checked ? [...prev, opt] : prev.filter((o) => o !== opt),
														)
													}
												/>
											}
											label={<Typography variant="body2">{opt}</Typography>}
										/>
									))}
								</FormGroup>
							</Box>
						</Grid>

						{/* Si el objeto del reclamo incluye accidente o enfermedad, el portal SECLO
						    requiere "Fecha del Accidente" — sincronizado con datosLab del step Partes. */}
						{objetoReclamo.some((o) => /accidente|enfermedad/i.test(o)) && (
							<Grid item xs={12}>
								<Alert severity={datosLab.fechaAccidente ? "success" : "warning"} sx={{ mb: 1.5 }}>
									{datosLab.fechaAccidente
										? "Fecha del accidente cargada — el portal la va a aceptar."
										: "El reclamo elegido requiere Fecha del Accidente. Completala acá o volvé al step Partes."}
								</Alert>
								<TextField
									label="Fecha del accidente *"
									type="date"
									value={datosLab.fechaAccidente || ""}
									onChange={(e) => setDatosLab((d) => ({ ...d, fechaAccidente: e.target.value }))}
									fullWidth
									InputLabelProps={{ shrink: true }}
									error={!datosLab.fechaAccidente}
								/>
							</Grid>
						)}

						<Grid item xs={12}>
							<TextField
								label="Comentario adicional (opcional)"
								value={comentario}
								onChange={(e) => setComentario(e.target.value)}
								multiline
								rows={2}
								fullWidth
							/>
						</Grid>

						<Grid item xs={12} sm={6}>
							<FormControl fullWidth>
								<InputLabel>Iniciado por</InputLabel>
								<Select value={iniciadoPor} label="Iniciado por" onChange={(e) => setIniciadoPor(e.target.value as any)}>
									<MenuItem value="trabajador">Trabajador</MenuItem>
									<MenuItem value="empleador">Empleador</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormControl fullWidth>
								<InputLabel>Carácter del abogado</InputLabel>
								<Select
									value={abogado.caracter}
									label="Carácter del abogado"
									onChange={(e) => setAbogado((a) => ({ ...a, caracter: e.target.value as SecloCaracter }))}
								>
									<MenuItem value="apoderado">Apoderado</MenuItem>
									<MenuItem value="patrocinante">Patrocinante</MenuItem>
									<MenuItem value="rep_gremial">Representante gremial</MenuItem>
									<MenuItem value="rep_empresarial">Representante empresarial</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12} sm={4}>
							<TextField
								label="Tomo CPACF"
								value={abogado.tomo}
								onChange={(e) => setAbogado((a) => ({ ...a, tomo: e.target.value }))}
								fullWidth
								required
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<TextField
								label="Folio CPACF"
								value={abogado.folio}
								onChange={(e) => setAbogado((a) => ({ ...a, folio: e.target.value }))}
								fullWidth
								required
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<TextField
								label="CPA del estudio (opcional)"
								value={abogado.cpa}
								onChange={(e) => setAbogado((a) => ({ ...a, cpa: e.target.value }))}
								fullWidth
							/>
						</Grid>
					</Grid>
				);

			case 2:
				return (
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Alert severity="info">
								El portal SECLO requiere D.N.I. del trabajador y credencial letrada del abogado.
								Subí los archivos en formato PDF o imagen.
							</Alert>
						</Grid>

						{REQUIRED_DOCS.map((tipo) => {
							const uploaded = documentos.find((d) => d.tipo === tipo);
							const isUploading = uploadingDoc === tipo;
							return (
								<Grid item xs={12} key={tipo}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
											p: 1.5,
											border: 1,
											borderColor: uploaded ? "success.main" : "divider",
											borderRadius: 1,
										}}
									>
										<DocumentText size={20} />
										<Box flexGrow={1}>
											<Typography variant="body2" fontWeight={600}>{DOC_TIPO_LABEL[tipo]}</Typography>
											{uploaded && (
												<Typography variant="caption" color="text.secondary" noWrap>
													{uploaded.fileName}
												</Typography>
											)}
										</Box>
										{uploaded ? (
											<Chip
												label="Subido"
												color="success"
												size="small"
												onDelete={() => setDocumentos((prev) => prev.filter((d) => d.tipo !== tipo))}
												deleteIcon={<Trash size={14} />}
											/>
										) : (
											<Button component="label" size="small" variant="outlined" startIcon={isUploading ? <CircularProgress size={14} /> : <Add size={16} />} disabled={isUploading}>
												{isUploading ? "Subiendo…" : "Subir archivo"}
												<input
													type="file"
													hidden
													accept="application/pdf,image/*"
													onChange={(e) => {
														const f = e.target.files?.[0];
														if (f) handleFileUpload(f, tipo);
														e.target.value = "";
													}}
												/>
											</Button>
										)}
									</Box>
								</Grid>
							);
						})}
					</Grid>
				);

			// ── Step 3: Revisar y enviar ──────────────────────────────
			// Resumen final con todo lo cargado. Cada sección tiene un
			// link para volver al step correspondiente. Los campos
			// opcionales no completados (piso, depto, comentario) se
			// resaltan con una sugerencia no-bloqueante para que el
			// usuario los pueda agregar antes del submit definitivo.
			case 3:
				return renderReview();

			default:
				return null;
		}
	};

	// Helper: formato de domicilio completo desde campos estructurados.
	const formatDomicilio = (c: ContactOption | null): string => {
		if (!c) return "—";
		const calle = [c.street, c.streetNumber].filter(Boolean).join(" ");
		const piso = c.floor ? `Piso ${c.floor}` : "";
		const depto = c.apartment ? `Depto ${c.apartment}` : "";
		const ciudad = c.city || "";
		return [calle || c.address, piso, depto, ciudad].filter(Boolean).join(", ") || "—";
	};

	const renderReview = () => {
		const reclamoRequiereFecha = objetoReclamo.some((o) => /accidente|enfermedad/i.test(o));
		const empleadorIniciadoForzado = iniciadoPor === "empleador";
		return (
			<Stack spacing={2}>
				<Alert severity={dryRunMode || empleadorIniciadoForzado ? "warning" : "info"}>
					{empleadorIniciadoForzado
						? "Trámite iniciado por el empleador: el worker corre en modo PRUEBA forzado hasta validar el flujo end-to-end. Cargará empleador y trabajador en el portal y se detendrá ANTES de hacer click en \"Generar Reclamo y Especificar Fecha\"."
						: dryRunMode
						? "Modo PRUEBA activo: el worker llenará el formulario pero NO lo enviará al portal. Sólo se guardarán screenshots y artefactos para inspección."
						: "Revisá todos los datos antes de enviar la solicitud al portal SECLO. Una vez creada, el worker la procesará automáticamente."}
				</Alert>

				{isDevMode && (
					<Box sx={{ border: 1, borderColor: dryRunMode ? "warning.main" : "divider", borderRadius: 1, p: 1.5, bgcolor: dryRunMode ? "warning.lighter" : "background.default" }}>
						<FormControlLabel
							control={<Switch checked={dryRunMode} onChange={(e) => setDryRunMode(e.target.checked)} color="warning" />}
							label={
								<Box>
									<Typography variant="body2" fontWeight={dryRunMode ? 600 : 400}>
										Modo prueba (dry-run)
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Sólo visible en desarrollo. No envía la solicitud al portal SECLO; el worker corre el formulario y se detiene antes de confirmar.
									</Typography>
								</Box>
							}
						/>
					</Box>
				)}

				<ReviewSection title="Trabajador (requirente)" onEdit={() => setStep(0)}>
					<ReviewRow label="Nombre" value={requirente ? `${requirente.name} ${requirente.lastName || ""}`.trim() : "—"} />
					<ReviewRow label="CUIL" value={requirente?.cuit || "—"} />
					<ReviewRow label="Celular" value={requirente?.phoneCelular || "—"} />
					<ReviewRow label="Domicilio" value={formatDomicilio(requirente)} />
					{requirente && hasStructuredAddress(requirente) && !requirente.floor && !requirente.apartment && (
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
							Sin piso ni depto.{" "}
							<MuiLink component="button" type="button" onClick={() => setEditCustomerFor({ target: "requirente", contact: requirente })} sx={{ verticalAlign: "baseline" }}>
								Agregar
							</MuiLink>{" "}(opcional).
						</Typography>
					)}
				</ReviewSection>

				{extraRequirentes.length > 0 && (
					<ReviewSection title={`Reclamantes adicionales (${extraRequirentes.length})`} onEdit={() => setStep(0)}>
						{extraRequirentes.map((r, i) => (
							<Box key={i} sx={{ mb: 0.5 }}>
								<Typography variant="body2" fontWeight={600}>
									#{i + 2} · {r.contact.name} {r.contact.lastName || ""} {r.contact.cuit && `— ${r.contact.cuit}`}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Domicilio: {formatDomicilio(r.contact)} · Ingreso: {r.datosLaborales.fechaIngreso?.toString().slice(0, 10) || "—"} · Egreso: {r.datosLaborales.fechaEgreso?.toString().slice(0, 10) || "—"}
								</Typography>
							</Box>
						))}
						<Alert severity="warning" sx={{ mt: 1 }}>
							Con múltiples reclamantes la solicitud corre forzada en <strong>modo prueba</strong>.
						</Alert>
					</ReviewSection>
				)}

				<ReviewSection title="Datos laborales" onEdit={() => setStep(0)}>
					<ReviewRow label="Fecha de ingreso" value={datosLab.fechaIngreso || "—"} />
					<ReviewRow label="Fecha de egreso" value={datosLab.fechaEgreso || "—"} />
					{(reclamoRequiereFecha || datosLab.fechaAccidente) && (
						<ReviewRow label="Fecha del accidente" value={datosLab.fechaAccidente || "—"} />
					)}
					<ReviewRow label="Última remuneración" value={datosLab.remuneracion ? `$${datosLab.remuneracion}` : "—"} />
					<ReviewRow label="Importe del reclamo" value={datosLab.importeReclamo ? `$${datosLab.importeReclamo}` : "—"} />
					<ReviewRow label="Estado" value={datosLab.estadoTrabajador || "regular"} />
					<ReviewRow label="Sexo" value={datosLab.sexo === "F" ? "Femenino" : "Masculino"} />
				</ReviewSection>

				<ReviewSection title="Empleador (requerido)" onEdit={() => setStep(0)}>
					<ReviewRow label="Nombre / Razón social" value={requerido ? (requerido.company || `${requerido.name} ${requerido.lastName || ""}`.trim()) : "—"} />
					<ReviewRow label="CUIT" value={requerido?.cuit || "—"} />
					<ReviewRow label="Domicilio" value={formatDomicilio(requerido)} />
					{requerido && hasStructuredAddress(requerido) && !requerido.floor && !requerido.apartment && (
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
							Sin piso ni depto.{" "}
							<MuiLink component="button" type="button" onClick={() => setEditCustomerFor({ target: "requerido", contact: requerido })} sx={{ verticalAlign: "baseline" }}>
								Agregar
							</MuiLink>{" "}(opcional).
						</Typography>
					)}
				</ReviewSection>

				{extraRequeridos.length > 0 && (
					<ReviewSection title={`Empleadores adicionales (${extraRequeridos.length})`} onEdit={() => setStep(0)}>
						{extraRequeridos.map((c, i) => (
							<Box key={i} sx={{ mb: 0.5 }}>
								<Typography variant="body2" fontWeight={600}>
									#{i + 2} · {c.company || `${c.name} ${c.lastName || ""}`.trim()} {c.cuit && `— ${c.cuit}`}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Domicilio: {formatDomicilio(c)}
								</Typography>
							</Box>
						))}
						<Alert severity="warning" sx={{ mt: 1 }}>
							Con múltiples empleadores la solicitud corre forzada en <strong>modo prueba</strong>.
						</Alert>
					</ReviewSection>
				)}

				<ReviewSection title="Reclamo" onEdit={() => setStep(1)}>
					<ReviewRow label="Iniciado por" value={iniciadoPor === "trabajador" ? "Trabajador" : "Empleador"} />
					<ReviewRow label="Objeto/s del reclamo" value={objetoReclamo.length ? objetoReclamo.join(", ") : "—"} />
					<ReviewRow
						label="Comentario"
						value={comentario}
						emptyHint={
							<>
								Sin comentario.{" "}
								<MuiLink component="button" type="button" onClick={() => setStep(1)} sx={{ verticalAlign: "baseline" }}>
									Agregar
								</MuiLink>{" "}(opcional).
							</>
						}
					/>
				</ReviewSection>

				<ReviewSection title="Abogado" onEdit={() => setStep(1)}>
					<ReviewRow label="Tomo" value={abogado.tomo || "—"} />
					<ReviewRow label="Folio" value={abogado.folio || "—"} />
					<ReviewRow label="Carácter" value={abogado.caracter} />
					<ReviewRow label="CPA" value={abogado.cpa || "—"} />
				</ReviewSection>

				{selectedFolder && (
					<ReviewSection title="Carpeta vinculada" onEdit={() => setStep(0)}>
						<ReviewRow label="Carpeta" value={selectedFolder.folderName} />
					</ReviewSection>
				)}

				<ReviewSection title="Documentos adjuntos" onEdit={() => setStep(2)}>
					{REQUIRED_DOCS.map((tipo) => {
						const doc = documentos.find((d) => d.tipo === tipo);
						return (
							<ReviewRow key={tipo} label={DOC_TIPO_LABEL[tipo]} value={doc?.fileName || "—"} />
						);
					})}
				</ReviewSection>
			</Stack>
		);
	};

	return (
		<>
		<Dialog
			open={open && !addCustomerFor && !editCustomerFor && !extraDialog.open && !extraRequeridoDialog.open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>Nueva solicitud de audiencia SECLO</DialogTitle>
			<DialogContent>
				<Stepper activeStep={step} alternativeLabel sx={{ mb: 3, mt: 1 }}>
					{STEPS.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

				{renderStep()}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
				{step > 0 && <Button onClick={() => setStep((s) => s - 1)} disabled={submitting}>Atrás</Button>}
				{step < STEPS.length - 1 ? (
					<Button variant="contained" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
						Siguiente
					</Button>
				) : (
					<Button
						variant="contained"
						color={(isDevMode && dryRunMode) || iniciadoPor === "empleador" ? "warning" : "success"}
						onClick={handleSubmit}
						disabled={submitting || !canAdvance()}
					>
						{submitting
							? "Creando…"
							: iniciadoPor === "empleador"
							? "Crear en modo prueba (empleador inicia)"
							: isDevMode && dryRunMode
							? "Crear en modo prueba"
							: "Crear solicitud"}
					</Button>
				)}
			</DialogActions>
		</Dialog>

		{/* Modal de creación rápida de contacto desde el step Partes.
		    AddCustomer no es un Dialog auto-contenido — es un componente
		    "in-flow" que necesita ser envuelto en un <Dialog>. Para evitar
		    issues de z-index con los Select internos (que abren Popover en
		    theme.zIndex.modal y se ocultarían bajo un Dialog padre), el
		    Dialog del wizard se oculta vía `open={open && !addCustomerFor}`
		    mientras este modal está abierto. El componente padre sigue
		    montado, así que el state del wizard se preserva intacto. */}
		{addCustomerFor && (
			<Dialog
				open={!!addCustomerFor}
				onClose={() => setAddCustomerFor(null)}
				maxWidth="sm"
				fullWidth
				TransitionComponent={PopupTransition}
				keepMounted
				sx={{
					"& .MuiDialog-paper": {
						p: 0,
						display: "flex",
						flexDirection: "column",
						height: { xs: "90vh", sm: "85vh", md: "80vh" },
						maxHeight: { xs: "90vh", sm: "85vh", md: "80vh" },
						overflow: "hidden",
					},
				}}
			>
				<AddCustomer
					open={!!addCustomerFor}
					mode="add"
					folderId={selectedFolder?._id}
					onCancel={() => setAddCustomerFor(null)}
					onAddMember={handleContactCreated}
				/>
			</Dialog>
		)}

		{/* Edición rápida de contacto desde el step Partes — típicamente
		    para completar calle+número cuando el contacto no los tiene
		    cargados en formato estructurado. Mismo wrapping que el modal
		    de creación: el wizard padre se oculta vía editCustomerFor. */}
		{editCustomerFor && (
			<Dialog
				open={!!editCustomerFor}
				onClose={() => setEditCustomerFor(null)}
				maxWidth="sm"
				fullWidth
				TransitionComponent={PopupTransition}
				keepMounted
				sx={{
					"& .MuiDialog-paper": {
						p: 0,
						display: "flex",
						flexDirection: "column",
						height: { xs: "90vh", sm: "85vh", md: "80vh" },
						maxHeight: { xs: "90vh", sm: "85vh", md: "80vh" },
						overflow: "hidden",
					},
				}}
			>
				<AddCustomer
					open={!!editCustomerFor}
					mode="edit"
					customer={editCustomerFor.contact}
					onCancel={() => setEditCustomerFor(null)}
					onAddMember={handleContactEdited}
				/>
			</Dialog>
		)}

		{/* Diálogo para agregar/editar un reclamante adicional. La feature
		    de múltiples reclamantes sólo aplica cuando iniciadoPor === 'trabajador'
		    y el worker fuerza dryRun mientras se valida el flujo. */}
		<Dialog open={extraDialog.open} onClose={() => setExtraDialog((s) => ({ ...s, open: false }))} maxWidth="sm" fullWidth>
			<DialogTitle>{extraDialog.editIndex !== null ? "Editar reclamante" : "Agregar reclamante"}</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Autocomplete
						options={contacts.filter((c) =>
							c._id !== requirente?._id && c._id !== requerido?._id &&
							!extraRequirentes.some((r, i) => r.contact._id === c._id && i !== extraDialog.editIndex)
						)}
						getOptionLabel={contactLabel}
						value={extraDialog.contact}
						onChange={(_, v) => setExtraDialog((s) => ({ ...s, contact: v }))}
						isOptionEqualToValue={(a, b) => a._id === b._id}
						renderInput={(params) => <TextField {...params} label="Contacto reclamante *" />}
						noOptionsText="No hay otros contactos disponibles"
					/>
					{extraDialog.contact && !extraDialog.contact.phoneCelular && (
						<Alert
							severity="warning"
							action={
								<Button color="inherit" size="small" onClick={() => completarDesdeExtra("trabajador")}>
									Editar contacto
								</Button>
							}
						>
							Falta <strong>celular</strong> en este contacto. SECLO lo exige.
						</Alert>
					)}
					{extraDialog.contact && !hasStructuredAddress(extraDialog.contact) && (
						<Alert
							severity="warning"
							action={
								<Button color="inherit" size="small" onClick={() => completarDesdeExtra("trabajador")}>
									Editar contacto
								</Button>
							}
						>
							Faltan <strong>calle</strong> y/o <strong>número</strong> en este contacto. SECLO los exige separados.
						</Alert>
					)}
					{extraDialog.contact && (extraDialog.contact.datosLaboralesHistorial?.length ?? 0) > 0 && (
						<FormControl fullWidth size="small">
							<InputLabel>Reutilizar datos del historial ({extraDialog.contact.datosLaboralesHistorial!.length})</InputLabel>
							<Select
								label={`Reutilizar datos del historial (${extraDialog.contact.datosLaboralesHistorial!.length})`}
								value=""
								onChange={(e) => {
									const idx = Number(e.target.value);
									const entry = extraDialog.contact!.datosLaboralesHistorial![idx];
									if (!entry) return;
									setExtraDialog((s) => ({
										...s,
										datosLab: {
											fechaNacimiento: entry.fechaNacimiento ? entry.fechaNacimiento.slice(0, 10) : null,
											fechaIngreso:    entry.fechaIngreso ? entry.fechaIngreso.slice(0, 10) : null,
											fechaEgreso:     entry.fechaEgreso ? entry.fechaEgreso.slice(0, 10) : null,
											fechaAccidente:  entry.fechaAccidente ? entry.fechaAccidente.slice(0, 10) : null,
											remuneracion:    entry.remuneracion ?? null,
											importeReclamo:  entry.importeReclamo ?? null,
											cct:             entry.cct || "",
											categoria:       entry.categoria || "",
											estadoTrabajador: entry.estadoTrabajador || "regular",
											sexo:            entry.sexo || "M",
										},
									}));
								}}
							>
								{extraDialog.contact.datosLaboralesHistorial!.map((e, i) => {
									const lab = `${e.empleadorName || "Sin empleador"} · ${e.fechaIngreso?.slice(0, 10) || "—"} → ${e.fechaEgreso?.slice(0, 10) || "—"} · $${e.remuneracion ?? "—"} · src=${e.source || "—"}`;
									return <MenuItem key={i} value={i}>{lab}</MenuItem>;
								})}
							</Select>
						</FormControl>
					)}
					<Grid container spacing={2}>
						<Grid item xs={6}>
							<TextField fullWidth type="date" label="Fecha de ingreso" InputLabelProps={{ shrink: true }}
								value={extraDialog.datosLab.fechaIngreso?.toString().slice(0, 10) || ""}
								onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, fechaIngreso: e.target.value || null } }))}
							/>
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth type="date" label="Fecha de egreso" InputLabelProps={{ shrink: true }}
								value={extraDialog.datosLab.fechaEgreso?.toString().slice(0, 10) || ""}
								onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, fechaEgreso: e.target.value || null } }))}
							/>
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth type="date" label="Fecha del accidente (si aplica)" InputLabelProps={{ shrink: true }}
								value={extraDialog.datosLab.fechaAccidente?.toString().slice(0, 10) || ""}
								onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, fechaAccidente: e.target.value || null } }))}
							/>
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth type="number" label="Última remuneración"
								value={extraDialog.datosLab.remuneracion ?? ""}
								onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, remuneracion: e.target.value ? Number(e.target.value) : null } }))}
							/>
						</Grid>
						<Grid item xs={6}>
							<TextField fullWidth type="number" label="Importe del reclamo"
								value={extraDialog.datosLab.importeReclamo ?? ""}
								onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, importeReclamo: e.target.value ? Number(e.target.value) : null } }))}
							/>
						</Grid>
						<Grid item xs={6}>
							<FormControl fullWidth>
								<InputLabel>Estado</InputLabel>
								<Select value={extraDialog.datosLab.estadoTrabajador || "regular"} label="Estado"
									onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, estadoTrabajador: e.target.value as any } }))}
								>
									<MenuItem value="regular">Regular</MenuItem>
									<MenuItem value="irregular">Irregular</MenuItem>
									<MenuItem value="no_registrado">No registrado</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={6}>
							<FormControl fullWidth>
								<InputLabel>Sexo</InputLabel>
								<Select value={extraDialog.datosLab.sexo || "M"} label="Sexo"
									onChange={(e) => setExtraDialog((s) => ({ ...s, datosLab: { ...s.datosLab, sexo: e.target.value as any } }))}
								>
									<MenuItem value="M">Masculino</MenuItem>
									<MenuItem value="F">Femenino</MenuItem>
								</Select>
							</FormControl>
						</Grid>
					</Grid>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => setExtraDialog((s) => ({ ...s, open: false }))}>Cancelar</Button>
				<Button
					variant="contained"
					disabled={!extraDialog.contact || !extraDialog.contact.phoneCelular || !hasStructuredAddress(extraDialog.contact)}
					onClick={() => {
						if (!extraDialog.contact) return;
						const entry = { contact: extraDialog.contact, datosLaborales: extraDialog.datosLab };
						setExtraRequirentes((prev) => {
							if (extraDialog.editIndex !== null) {
								const copy = [...prev];
								copy[extraDialog.editIndex] = entry;
								return copy;
							}
							return [...prev, entry];
						});
						setExtraDialog({ open: false, editIndex: null, contact: null, datosLab: { estadoTrabajador: "regular", sexo: "M" } });
					}}
				>
					{extraDialog.editIndex !== null ? "Guardar cambios" : "Agregar a la lista"}
				</Button>
			</DialogActions>
		</Dialog>

		{/* Diálogo para agregar/editar un empleador adicional (sin datos
		    laborales — solo selección de Contact con validación de calle+número). */}
		<Dialog open={extraRequeridoDialog.open} onClose={() => setExtraRequeridoDialog((s) => ({ ...s, open: false }))} maxWidth="sm" fullWidth>
			<DialogTitle>{extraRequeridoDialog.editIndex !== null ? "Cambiar empleador" : "Agregar empleador"}</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Autocomplete
						options={contacts.filter((c) =>
							c._id !== requirente?._id &&
							c._id !== requerido?._id &&
							!extraRequirentes.some((r) => r.contact._id === c._id) &&
							!extraRequeridos.some((r, i) => r._id === c._id && i !== extraRequeridoDialog.editIndex)
						)}
						getOptionLabel={(c: ContactOption) =>
							`${c.company || `${c.name} ${c.lastName || ""}`.trim()}${c.cuit ? ` — ${c.cuit}` : ""}`
						}
						value={extraRequeridoDialog.contact}
						onChange={(_, v) => setExtraRequeridoDialog((s) => ({ ...s, contact: v }))}
						isOptionEqualToValue={(a, b) => a._id === b._id}
						renderInput={(params) => <TextField {...params} label="Contacto empleador *" />}
						noOptionsText="No hay otros contactos disponibles"
					/>
					{extraRequeridoDialog.contact && !hasStructuredAddress(extraRequeridoDialog.contact) && (
						<Alert
							severity="warning"
							action={
								<Button color="inherit" size="small" onClick={() => completarDesdeExtra("empleador")}>
									Editar contacto
								</Button>
							}
						>
							Faltan <strong>calle</strong> y/o <strong>número</strong> en este contacto. SECLO los exige separados.
						</Alert>
					)}
					{extraRequeridoDialog.contact && !hasValidTipoSociedad(extraRequeridoDialog.contact) && (
						<Alert
							severity="warning"
							action={
								<Button color="inherit" size="small" onClick={() => completarDesdeExtra("empleador")}>
									Editar contacto
								</Button>
							}
						>
							Falta el <strong>tipo</strong> de persona jurídica. SECLO lo exige.
						</Alert>
					)}
					{extraRequeridoDialog.contact && (
						<Alert severity="info" icon={false}>
							<Typography variant="body2"><strong>CUIT:</strong> {extraRequeridoDialog.contact.cuit || "—"}</Typography>
							<Typography variant="body2">
								<strong>Domicilio:</strong>{" "}
								{[extraRequeridoDialog.contact.street, extraRequeridoDialog.contact.streetNumber].filter(Boolean).join(" ") || extraRequeridoDialog.contact.address || "—"}
							</Typography>
						</Alert>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => setExtraRequeridoDialog((s) => ({ ...s, open: false }))}>Cancelar</Button>
				<Button
					variant="contained"
					disabled={
						!extraRequeridoDialog.contact ||
						!hasStructuredAddress(extraRequeridoDialog.contact) ||
						!hasValidTipoSociedad(extraRequeridoDialog.contact)
					}
					onClick={() => {
						if (!extraRequeridoDialog.contact) return;
						const c = extraRequeridoDialog.contact;
						setExtraRequeridos((prev) => {
							if (extraRequeridoDialog.editIndex !== null) {
								const copy = [...prev];
								copy[extraRequeridoDialog.editIndex] = c;
								return copy;
							}
							return [...prev, c];
						});
						setExtraRequeridoDialog({ open: false, editIndex: null, contact: null });
					}}
				>
					{extraRequeridoDialog.editIndex !== null ? "Guardar cambios" : "Agregar a la lista"}
				</Button>
			</DialogActions>
		</Dialog>
		</>
	);
}
