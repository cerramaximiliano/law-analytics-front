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
	MenuItem,
	Select,
	Stack,
	Step,
	StepLabel,
	Stepper,
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

const STEPS = ["Partes", "Reclamo y abogado", "Documentos"];

const DOC_TIPO_LABEL: Record<SecloDocTipo, string> = {
	dni:        "D.N.I del trabajador",
	credencial: "Credencial letrado",
	poder:      "Poder",
	formulario: "Formulario",
	otros:      "Otros",
};

const REQUIRED_DOCS: SecloDocTipo[] = ["dni", "credencial"];

interface ContactOption {
	_id: string;
	name: string;
	lastName?: string;
	cuit?: string;
	company?: string;
	type?: string;
	folderIds?: string[];
}

interface FolderOption {
	_id: string;
	folderName: string;
	materia?: string;
	status?: string;
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

	// Modal "Nuevo contacto" — abierto desde el step Partes para crear
	// trabajador o empleador sin salir del wizard.
	const [addCustomerFor, setAddCustomerFor] = useState<"requirente" | "requerido" | null>(null);

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
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	// Validación por step
	const canAdvance = () => {
		if (step === 0) return !!requirente && !!requerido && requirente._id !== requerido._id;
		if (step === 1) return objetoReclamo.length > 0 && !!abogado.tomo && !!abogado.folio;
		if (step === 2) return REQUIRED_DOCS.every((t) => documentos.some((d) => d.tipo === t));
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
			await dispatch<any>(
				createSolicitud({
					requirenteId: requirente!._id,
					requirenteDatosLaborales: datosLab,
					requeridoId: requerido!._id,
					objetoReclamo,
					comentarioReclamo: comentario,
					iniciadoPor,
					datosAbogado: { tomo: abogado.tomo, folio: abogado.folio, caracter: abogado.caracter, domicilio: { cpa: abogado.cpa } },
					documentos,
					folderId: selectedFolder?._id ?? undefined,
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
						</Grid>

						{requirente && (
							<>
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
						</Grid>
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

			default:
				return null;
		}
	};

	return (
		<>
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
					<Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting || !canAdvance()}>
						{submitting ? "Creando…" : "Crear solicitud"}
					</Button>
				)}
			</DialogActions>
		</Dialog>

		{/* Modal de creación rápida de contacto desde el step Partes.
		    AddCustomer es un componente "in-flow" (no Dialog interno) que
		    se monta dentro de un <Dialog> propio. Si hay carpeta seleccionada,
		    el contacto queda automáticamente vinculado a ella vía folderId.
		    El zIndex superior asegura que se renderice arriba del Dialog del wizard. */}
		{addCustomerFor && (
			<Dialog
				open={!!addCustomerFor}
				onClose={() => setAddCustomerFor(null)}
				maxWidth="sm"
				fullWidth
				TransitionComponent={PopupTransition}
				keepMounted
				sx={{
					zIndex: (t) => t.zIndex.modal + 1,
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
		</>
	);
}
