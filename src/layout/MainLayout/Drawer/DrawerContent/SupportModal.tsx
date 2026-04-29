import React from "react";
import { useState, SyntheticEvent, ChangeEvent, useRef } from "react";
import axios from "axios";

import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	FormControl,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Stack,
	TextField,
	Typography,
	useTheme,
	useMediaQuery,
	SelectChangeEvent,
	Divider,
	Box,
	Alert,
	CircularProgress,
	IconButton,
} from "@mui/material";

// icons
import { MessageQuestion, TickCircle, DocumentUpload, CloseCircle } from "iconsax-react";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// Tipos para el formulario de soporte
export interface SupportFormData {
	name: string;
	email: string;
	subject: string;
	priority: string;
	message: string;
}

interface SupportModalProps {
	open: boolean;
	onClose: () => void;
	defaultSubject?: string;
}

// Lista de asuntos predefinidos
const subjectOptions = [
	"Consulta general",
	"Problema técnico",
	"Facturación",
	"Actualización de datos",
	"Recuperación de cuenta",
	"Error en proceso de pago",
	"Solicitud de nueva jurisdicción",
	"Solicitud de nuevo modelo de documento",
	"Otro",
];

// Lista de prioridades
const priorityOptions = [
	{ value: "low", label: "Baja" },
	{ value: "medium", label: "Media" },
	{ value: "high", label: "Alta" },
	{ value: "urgent", label: "Urgente" },
];

const SUBJECT_TEMPLATE_REQUEST = "Solicitud de nuevo modelo de documento";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE_MB = 10;

const SupportModal = ({ open, onClose, defaultSubject = "" }: SupportModalProps) => {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
	const fileInputRef = useRef<HTMLInputElement>(null);

	const authUser = useSelector((state: any) => state.auth?.user);
	const userName = authUser ? `${authUser.name || ""}${authUser.lastName ? " " + authUser.lastName : ""}`.trim() : "";
	const userEmail = authUser?.email || "";

	const [formData, setFormData] = useState<SupportFormData>({
		name: userName,
		email: userEmail,
		subject: defaultSubject,
		priority: "medium",
		message: "",
	});

	const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
	const [attachmentError, setAttachmentError] = useState("");

	// Sincronizar nombre/email del usuario y subject al abrir
	React.useEffect(() => {
		if (open) {
			setFormData((prev) => ({
				...prev,
				name: userName,
				email: userEmail,
				...(defaultSubject ? { subject: defaultSubject } : {}),
			}));
		}
	}, [open, defaultSubject, userName, userEmail]);

	const [errors, setErrors] = useState({
		name: false,
		email: false,
		subject: false,
		message: false,
	});

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const resetForm = () => {
		setFormData({
			name: userName,
			email: userEmail,
			subject: "",
			priority: "medium",
			message: "",
		});
		setErrors({ subject: false, message: false });
		setAttachmentFile(null);
		setAttachmentError("");
		setSubmitted(false);
		setSubmitting(false);
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [event.target.name]: event.target.value });
		const key = event.target.name as keyof typeof errors;
		if (key in errors && errors[key]) {
			setErrors({ ...errors, [key]: false });
		}
	};

	const handlePriorityChange = (event: SelectChangeEvent<string>) => {
		setFormData({ ...formData, priority: event.target.value });
	};

	const handleFileChange = (file: File | null) => {
		if (!file) {
			setAttachmentFile(null);
			setAttachmentError("");
			return;
		}
		const name = file.name.toLowerCase();
		const validExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
		if (!validExt) {
			setAttachmentError("Formato no permitido. Usá PDF, DOC o DOCX.");
			setAttachmentFile(null);
			return;
		}
		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			setAttachmentError(`El archivo no puede superar ${MAX_FILE_SIZE_MB} MB.`);
			setAttachmentFile(null);
			return;
		}
		setAttachmentError("");
		setAttachmentFile(file);
	};

	const validateForm = (): boolean => {
		const newErrors = {
			name: false,
			email: false,
			subject: !formData.subject.trim(),
			message: !formData.message.trim(),
		};
		setErrors(newErrors);
		return !Object.values(newErrors).some(Boolean);
	};

	const handleSubmit = async (event: SyntheticEvent) => {
		event.preventDefault();
		if (!validateForm()) return;

		setSubmitting(true);
		try {
			const payload = new FormData();
			payload.append("name", formData.name);
			payload.append("email", formData.email);
			payload.append("subject", formData.subject);
			payload.append("priority", formData.priority);
			payload.append("message", formData.message);
			if (attachmentFile) {
				payload.append("attachment", attachmentFile);
			}

			const response = await axios.post(
				`${import.meta.env.VITE_BASE_URL || ""}/api/support-contacts`,
				payload,
				{ withCredentials: true },
			);

			if (response.data.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tu consulta ha sido enviada correctamente. Te responderemos pronto.",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				setSubmitted(true);
				setTimeout(() => {
					onClose();
					resetForm();
				}, 2000);
			}
		} catch (error) {
			let errorMessage = "Error al enviar la consulta. Por favor, intenta más tarde.";
			if (axios.isAxiosError(error)) {
				if (error.response) errorMessage = error.response.data.error || errorMessage;
				else if (error.request) errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión.";
			}
			dispatch(
				openSnackbar({
					open: true,
					message: errorMessage,
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!submitting) {
			onClose();
			setTimeout(resetForm, 300);
		}
	};

	const isTemplateRequest = formData.subject === SUBJECT_TEMPLATE_REQUEST;

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			keepMounted
			maxWidth="sm"
			fullWidth
			fullScreen={fullScreen}
			aria-labelledby="support-modal-title"
			PaperProps={{ elevation: 5, sx: { borderRadius: 2, overflow: "hidden" } }}
		>
			<DialogTitle
				id="support-modal-title"
				sx={{ bgcolor: theme.palette.primary.lighter, p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<MessageQuestion size={24} color={theme.palette.primary.main} variant="Bold" />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							Contactar a Soporte
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Completa el formulario y te responderemos dentro de las próximas 24 horas
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 3 }}>
				{submitted ? (
					<Box sx={{ py: 4, textAlign: "center" }}>
						<TickCircle size={64} color={theme.palette.success.main} variant="Bulk" />
						<Typography variant="h4" color="success.main" sx={{ mt: 2, mb: 1 }}>
							¡Consulta enviada exitosamente!
						</Typography>
						<Typography color="text.secondary">Hemos recibido tu mensaje y te responderemos pronto.</Typography>
					</Box>
				) : (
					<Box component="form" onSubmit={handleSubmit}>
						<Stack spacing={2.5}>
							{isTemplateRequest ? (
								<Alert severity="info" sx={{ mb: 0 }}>
									Adjuntá el PDF, DOC o DOCX que querés que integremos como modelo autocompletable. Indicá también qué campos deberían ser
									completables y a qué tipo de expediente corresponde.
								</Alert>
							) : (
								<Alert severity="info" sx={{ mb: 0 }}>
									Si tu consulta es sobre un error de pago, incluí todos los detalles posibles para ayudarte mejor.
								</Alert>
							)}

							{/* Asunto */}
							<TextField
								fullWidth
								label="Tipo de consulta"
								name="subject"
								select
								value={formData.subject}
								onChange={handleChange}
								error={errors.subject}
								helperText={errors.subject ? "Seleccioná un tipo de consulta" : ""}
								disabled={submitting || !!defaultSubject}
								required
							>
								{subjectOptions.map((option) => (
									<MenuItem key={option} value={option}>
										{option}
									</MenuItem>
								))}
							</TextField>

							{/* Prioridad */}
							<FormControl fullWidth>
								<InputLabel id="priority-label">Prioridad</InputLabel>
								<Select
									labelId="priority-label"
									value={formData.priority}
									onChange={handlePriorityChange}
									input={<OutlinedInput label="Prioridad" />}
									disabled={submitting}
								>
									{priorityOptions.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Mensaje */}
							<TextField
								fullWidth
								label="Describe tu consulta"
								name="message"
								multiline
								rows={4}
								value={formData.message}
								onChange={handleChange}
								error={errors.message}
								helperText={errors.message ? "El mensaje es requerido" : "Proporcioná todos los detalles posibles"}
								disabled={submitting}
								required
								placeholder={
									isTemplateRequest
										? "Describí el tipo de documento, para qué fuero/jurisdicción se usa y qué campos deberían ser autocompletables..."
										: "Describí detalladamente tu consulta o problema..."
								}
							/>

							{/* Adjunto — solo para solicitud de modelo */}
							{isTemplateRequest && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1 }}>
										Documento de referencia{" "}
										<Typography component="span" variant="caption" color="textSecondary">
											(PDF, DOC o DOCX — máx. {MAX_FILE_SIZE_MB} MB)
										</Typography>
									</Typography>
									{attachmentFile ? (
										<Stack
											direction="row"
											alignItems="center"
											spacing={1}
											sx={{
												p: 1.5,
												border: `1px solid ${theme.palette.success.main}`,
												borderRadius: 1.5,
												bgcolor: "success.lighter",
											}}
										>
											<DocumentUpload size={20} color={theme.palette.success.main} />
											<Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
												{attachmentFile.name}
											</Typography>
											<Typography variant="caption" color="textSecondary" sx={{ flexShrink: 0 }}>
												{(attachmentFile.size / 1024 / 1024).toFixed(1)} MB
											</Typography>
											<IconButton
												size="small"
												onClick={() => {
													setAttachmentFile(null);
													if (fileInputRef.current) fileInputRef.current.value = "";
												}}
												disabled={submitting}
											>
												<CloseCircle size={18} />
											</IconButton>
										</Stack>
									) : (
										<Box
											onClick={() => fileInputRef.current?.click()}
											sx={{
												p: 2.5,
												border: `2px dashed ${attachmentError ? theme.palette.error.main : theme.palette.divider}`,
												borderRadius: 1.5,
												textAlign: "center",
												cursor: "pointer",
												transition: "border-color 0.2s, background-color 0.2s",
												"&:hover": {
													borderColor: theme.palette.primary.main,
													bgcolor: "primary.lighter",
												},
											}}
										>
											<DocumentUpload size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
											<Typography variant="body2" color="textSecondary">
												Hacé click para seleccionar un archivo
											</Typography>
											<Typography variant="caption" color="textSecondary">
												PDF, DOC, DOCX — máx. {MAX_FILE_SIZE_MB} MB
											</Typography>
										</Box>
									)}
									{attachmentError && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
											{attachmentError}
										</Typography>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
										style={{ display: "none" }}
										onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
										disabled={submitting}
									/>
								</Box>
							)}
						</Stack>
					</Box>
				)}
			</DialogContent>

			{!submitted && (
				<>
					<Divider />
					<DialogActions sx={{ px: 3, py: 2 }}>
						<Button onClick={handleClose} color="error" disabled={submitting}>
							Cancelar
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={submitting}
							startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
						>
							{submitting ? "Enviando..." : "Enviar consulta"}
						</Button>
					</DialogActions>
				</>
			)}
		</Dialog>
	);
};

export default SupportModal;
