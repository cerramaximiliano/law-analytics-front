import React, { useState, SyntheticEvent, ChangeEvent, useRef } from "react";
import axios from "axios";

// material-ui
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	SelectChangeEvent,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// third party
import { motion, AnimatePresence } from "framer-motion";

// icons
import { MessageQuestion, TickCircle, DocumentUpload, CloseCircle } from "iconsax-react";

// project imports
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { PopupTransition } from "components/@extended/Transitions";

// ============================== TOKENS ============================== //
// Mismo brand-blue del landing para mantener atmósfera coherente.
const BRAND_BLUE = "#3A7BFF";

// ============================== TIPOS ============================== //

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
	// `landing` (default) → motion spring, blur backdrop, blob brand-blue,
	//   icono en cuadrado tintado + X close. Estética del hero rediseñado.
	// `dashboard` → look pre-rediseño (commit anterior a `adf7edb`): DialogTitle
	//   con bgcolor primary.lighter, MessageQuestion plano, PopupTransition,
	//   sin blur ni blob, footer DialogActions con "Cancelar" + "Enviar consulta".
	variant?: "landing" | "dashboard";
}

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

const priorityOptions = [
	{ value: "low", label: "Baja" },
	{ value: "medium", label: "Media" },
	{ value: "high", label: "Alta" },
	{ value: "urgent", label: "Urgente" },
];

const SUBJECT_TEMPLATE_REQUEST = "Solicitud de nuevo modelo de documento";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE_MB = 10;

// ============================== SUPPORT MODAL ============================== //

const SupportModal = ({ open, onClose, defaultSubject = "", variant = "landing" }: SupportModalProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isDashboard = variant === "dashboard";
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
		setErrors({ name: false, email: false, subject: false, message: false });
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

			const response = await axios.post(`${import.meta.env.VITE_BASE_URL || ""}/api/support-contacts`, payload, {
				withCredentials: true,
			});

			if (response.data.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Recibimos tu consulta. Te respondemos pronto.",
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
			let errorMessage = "Error al enviar la consulta. Intentá más tarde.";
			if (axios.isAxiosError(error)) {
				if (error.response) errorMessage = error.response.data.error || errorMessage;
				else if (error.request) errorMessage = "No se pudo conectar con el servidor. Verificá tu conexión.";
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

	// Props comunes para el Dialog (open/onClose/sizing); las props específicas de
	// transición y look van por separado según variant.
	const commonDialogProps = {
		open,
		onClose: handleClose,
		keepMounted: true,
		maxWidth: "sm" as const,
		fullWidth: true,
		fullScreen,
		"aria-labelledby": "support-modal-title",
	};

	// Props específicas por variant.
	const variantDialogProps = isDashboard
		? {
				TransitionComponent: PopupTransition,
				PaperProps: { elevation: 5, sx: { borderRadius: 2, overflow: "hidden" } },
		  }
		: {
				PaperProps: {
					component: motion.div,
					initial: { opacity: 0, scale: 0.96, y: 12 },
					animate: { opacity: 1, scale: 1, y: 0 },
					exit: { opacity: 0, scale: 0.96, y: 12 },
					transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
					sx: {
						borderRadius: fullScreen ? 0 : "16px",
						bgcolor: theme.palette.background.paper,
						border: fullScreen ? "none" : `1px solid ${alpha(theme.palette.divider, 0.6)}`,
						boxShadow: `0 24px 48px ${alpha("#0F172A", isDark ? 0.5 : 0.2)}`,
						overflow: "hidden",
					},
				},
				slotProps: {
					backdrop: {
						sx: {
							backgroundColor: alpha("#000", 0.55),
							backdropFilter: "blur(4px)",
							WebkitBackdropFilter: "blur(4px)",
						},
					},
				},
		  };

	const dialogJSX = (
		<Dialog {...commonDialogProps} {...(variantDialogProps as any)}>
					<Box sx={{ position: "relative" }}>
						{/* Atmósfera — blob brand-blue sutil, coherente con FeatureModal y landing.
						    Variant `dashboard` lo omite. */}
						{!isDashboard && (
							<Box
								aria-hidden
								sx={{
									position: "absolute",
									top: -60,
									right: -50,
									width: 220,
									height: 220,
									borderRadius: "50%",
									background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)} 0%, transparent 65%)`,
									filter: "blur(50px)",
									pointerEvents: "none",
									zIndex: 0,
								}}
							/>
						)}

						{/* Header — dos versiones:
						    landing: Box con icono brand-blue en cuadrado tintado + X close arriba.
						    dashboard: DialogTitle clásico con bgcolor primary.lighter + icono plano color primary (pre-redesign). */}
						{isDashboard ? (
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
						) : (
							<Box
								id="support-modal-title"
								sx={{
									position: "relative",
									zIndex: 1,
									px: 3,
									pt: 3,
									pb: 2,
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 1, pr: 4 }}>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1.5,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexShrink: 0,
										}}
									>
										<MessageQuestion size={22} variant="Bulk" color={BRAND_BLUE} />
									</Box>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: { xs: "1.15rem", sm: "1.3rem" },
											letterSpacing: "-0.018em",
											color: theme.palette.text.primary,
											lineHeight: 1.2,
										}}
									>
										Contactar a soporte
									</Typography>
								</Box>
								<Typography
									sx={{
										fontSize: "0.875rem",
										color: theme.palette.text.secondary,
										lineHeight: 1.5,
									}}
								>
									Completá el formulario y te respondemos dentro de las próximas 24 horas.
								</Typography>

								{/* Close button */}
								<IconButton
									onClick={handleClose}
									aria-label="Cerrar"
									size="small"
									sx={{
										position: "absolute",
										top: 12,
										right: 12,
										zIndex: 2,
										color: theme.palette.text.secondary,
										"&:hover": {
											color: theme.palette.text.primary,
											bgcolor: alpha(theme.palette.text.primary, 0.06),
										},
									}}
								>
									<CloseCircle size={20} />
								</IconButton>
							</Box>
						)}

						<Divider sx={{ position: "relative", zIndex: 1 }} />

						<DialogContent sx={{ position: "relative", zIndex: 1, p: 3 }}>
							{submitted ? (
								isDashboard ? (
									<Box sx={{ py: 4, textAlign: "center" }}>
										<TickCircle size={64} color={theme.palette.success.main} variant="Bulk" />
										<Typography variant="h4" color="success.main" sx={{ mt: 2, mb: 1 }}>
											¡Consulta enviada exitosamente!
										</Typography>
										<Typography color="text.secondary">Hemos recibido tu mensaje y te responderemos pronto.</Typography>
									</Box>
								) : (
									<Box sx={{ py: 4, textAlign: "center" }}>
										<TickCircle size={64} color={theme.palette.success.main} variant="Bulk" />
										<Typography
											sx={{
												mt: 2,
												mb: 1,
												fontWeight: 600,
												fontSize: "1.25rem",
												letterSpacing: "-0.015em",
												color: theme.palette.success.main,
											}}
										>
											Consulta enviada
										</Typography>
										<Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.9rem" }}>
											Recibimos tu mensaje. Te respondemos pronto.
										</Typography>
									</Box>
								)
							) : (
								<Box component="form" onSubmit={handleSubmit}>
									<Stack spacing={2.5}>
										{isTemplateRequest ? (
											<Alert severity="info" sx={{ mb: 0 }}>
												Adjuntá el PDF, DOC o DOCX que querés que integremos como modelo autocompletable. Indicá también qué campos deberían
												ser completables y a qué tipo de expediente corresponde.
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
											label="Describí tu consulta"
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
													<Typography component="span" variant="caption" color="text.secondary">
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
														<Typography
															variant="body2"
															sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
														>
															{attachmentFile.name}
														</Typography>
														<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
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
														<Typography variant="body2" color="text.secondary">
															Hacé click para seleccionar un archivo
														</Typography>
														<Typography variant="caption" color="text.secondary">
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

						{!submitted &&
							(isDashboard ? (
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
							) : (
								<>
									<Divider sx={{ position: "relative", zIndex: 1 }} />
									<DialogActions sx={{ position: "relative", zIndex: 1, px: 3, py: 2, gap: 1 }}>
										<Button onClick={handleClose} disabled={submitting} sx={{ textTransform: "none" }}>
											Cancelar
										</Button>
										<Button
											variant="contained"
											color="primary"
											onClick={handleSubmit}
											disabled={submitting}
											startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
											sx={{
												textTransform: "none",
												fontWeight: 600,
												borderRadius: 2,
												px: 2.5,
												boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.25)}`,
												"&:hover": {
													boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.35)}`,
													transform: "translateY(-1px)",
												},
												transition: "transform 0.2s ease, box-shadow 0.2s ease",
											}}
										>
											{submitting ? "Enviando..." : "Enviar consulta"}
										</Button>
									</DialogActions>
								</>
							))}
					</Box>
		</Dialog>
	);

	// landing usa AnimatePresence porque el motion.div del PaperProps necesita
	// disparar el exit animation al desmontar. dashboard usa PopupTransition de
	// MUI internamente — no requiere AnimatePresence.
	return isDashboard ? dialogJSX : <AnimatePresence>{open && dialogJSX}</AnimatePresence>;

};

export default SupportModal;
