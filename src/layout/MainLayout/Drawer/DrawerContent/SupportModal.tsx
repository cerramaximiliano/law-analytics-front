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
import { CloseSquare, DocumentUpload, InfoCircle, MessageQuestion, TickCircle, CloseCircle } from "iconsax-react";

import { LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

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
	defaultMessage?: string;
	defaultPriority?: "low" | "medium" | "high" | "urgent";
	// Bloque de contexto que SIEMPRE se envía al backend, no editable por el
	// usuario. Se renderiza como un panel read-only arriba del textarea y
	// queda prepended al mensaje en el payload. Cuando está seteado, el
	// textarea pasa a ser opcional ("agregar más contexto").
	// Tiene precedencia sobre defaultMessage.
	lockedHeader?: string;
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
	"Solicitud de acceso beta — Conector MCP",
	"Otro",
];

const priorityOptions = [
	{ value: "low", label: "Baja" },
	{ value: "medium", label: "Media" },
	{ value: "high", label: "Alta" },
	{ value: "urgent", label: "Urgente" },
];

const SUBJECT_TEMPLATE_REQUEST = "Solicitud de nuevo modelo de documento";
const SUBJECT_MCP_BETA = "Solicitud de acceso beta — Conector MCP";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE_MB = 10;

// ============================== SUPPORT MODAL ============================== //

const SupportModal = ({
	open,
	onClose,
	defaultSubject = "",
	defaultMessage = "",
	defaultPriority = "medium",
	lockedHeader,
	variant = "landing",
}: SupportModalProps) => {
	const hasLockedHeader = Boolean(lockedHeader && lockedHeader.trim().length > 0);
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
		priority: defaultPriority,
		// Si hay lockedHeader, el textarea arranca vacío: ese campo es para
		// contexto adicional del usuario. El header se concatena al enviar.
		message: hasLockedHeader ? "" : defaultMessage,
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
				...(hasLockedHeader ? { message: "" } : defaultMessage ? { message: defaultMessage } : {}),
				...(defaultPriority ? { priority: defaultPriority } : {}),
			}));
		}
	}, [open, defaultSubject, defaultMessage, defaultPriority, hasLockedHeader, userName, userEmail]);

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

	// Cuando no hay user autenticado, el email es REQUERIDO en el form (no podemos
	// inferirlo del JWT). El name se queda opcional para minimizar fricción —
	// soporte responde por email igual.
	const isAnonymous = !authUser;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validateForm = (): boolean => {
		const newErrors = {
			name: false,
			email: isAnonymous && !emailRegex.test(formData.email.trim()),
			subject: !formData.subject.trim(),
			// Con lockedHeader el contexto ya viene completo; el textarea es opcional.
			message: hasLockedHeader ? false : !formData.message.trim(),
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
			// Cuando hay lockedHeader, lo concatenamos al texto adicional del
			// usuario en un único campo `message`. El header siempre va primero
			// para que soporte vea el contexto técnico antes de la nota humana.
			const composedMessage = hasLockedHeader
				? `${lockedHeader}\n\n---\nContexto adicional del usuario:\n${formData.message.trim() || "(sin contexto adicional)"}`
				: formData.message;
			payload.append("message", composedMessage);
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
				PaperProps: {
					sx: {
						borderRadius: 2,
						overflow: "hidden",
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					},
				},
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
					{/* Box wrapper en flex column para que DialogContent scrollee internamente
					    en vez de hacer que el Paper crezca más allá del viewport (que con
					    overflow:hidden en PaperProps cortaba los DialogActions). minHeight:0
					    permite que el flex child (DialogContent) shrink correctamente. */}
					<Box sx={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
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
						    dashboard: header brand atmosférico unificado (post-redesign). */}
						{isDashboard ? (
							<Box
								id="support-modal-title"
								sx={{
									position: "relative",
									overflow: "hidden",
									px: { xs: 2.25, sm: 2.5 },
									py: 1.75,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								}}
							>
								<Box
									aria-hidden
									sx={{
										position: "absolute",
										top: -60,
										right: -40,
										width: 220,
										height: 220,
										borderRadius: "50%",
										background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
										pointerEvents: "none",
									}}
								/>
								<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1.5,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<MessageQuestion size={20} variant="Bulk" />
									</Box>
									<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
										<Stack direction="row" spacing={0.75} alignItems="center">
											<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
											<Typography
												sx={{
													fontSize: "0.6rem",
													fontWeight: 600,
													letterSpacing: "0.08em",
													textTransform: "uppercase",
													color: "text.secondary",
												}}
											>
												Soporte
											</Typography>
										</Stack>
										<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
											Contactar a soporte
										</Typography>
										<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											Completá el formulario y te respondemos dentro de las próximas 24 horas.
										</Typography>
									</Stack>
									<IconButton
										onClick={handleClose}
										disabled={submitting}
										aria-label="Cerrar"
										sx={{
											color: "text.secondary",
											borderRadius: 1,
											"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
										}}
									>
										<CloseSquare size={20} variant="Linear" />
									</IconButton>
								</Stack>
							</Box>
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

						{!isDashboard && <Divider sx={{ position: "relative", zIndex: 1 }} />}

						<DialogContent sx={{ position: "relative", zIndex: 1, p: 3, overflowY: "auto", flex: 1, minHeight: 0 }}>
							{submitted ? (
								isDashboard ? (
									<Stack alignItems="center" spacing={1.5} sx={{ py: 4, textAlign: "center" }}>
										<Box
											sx={{
												width: 60,
												height: 60,
												borderRadius: 1.5,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.08),
												border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.2)}`,
												color: LIVE_GREEN,
											}}
										>
											<TickCircle size={28} variant="Bulk" />
										</Box>
										<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
											Consulta enviada
										</Typography>
										<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em", maxWidth: 360, textWrap: "pretty" }}>
											Recibimos tu mensaje y te respondemos dentro de las próximas 24 horas.
										</Typography>
									</Stack>
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
										{/* Info box — sólo se muestra para subjects con un copy específico
										    útil (hoy: solo Solicitud de modelo de documento, que pide adjuntar
										    archivo). Para el resto omitimos la caja para no mostrar info ruido. */}
										{isTemplateRequest && (
											<Box
												sx={{
													p: 1.5,
													borderRadius: 1.25,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
												}}
											>
												<Stack direction="row" spacing={1} alignItems="flex-start">
													<InfoCircle
														size={16}
														variant="Bulk"
														color={BRAND_BLUE}
														style={{ marginTop: 2, flexShrink: 0 }}
													/>
													<Typography
														sx={{
															fontSize: "0.82rem",
															color: "text.primary",
															letterSpacing: "-0.005em",
															textWrap: "pretty",
														}}
													>
														Adjuntá el PDF, DOC o DOCX que querés que integremos como modelo
														autocompletable. Indicá también qué campos deberían ser completables
														y a qué tipo de expediente corresponde.
													</Typography>
												</Stack>
											</Box>
										)}

										{/* Email — visible solo si user no está logueado (la landing pública
										    /integraciones/claude-ai puede tener users anónimos). Para users
										    logueados el email viene del JWT y se envía implícito. */}
										{isAnonymous && (
											<TextField
												fullWidth
												type="email"
												label="Tu email"
												name="email"
												value={formData.email}
												onChange={handleChange}
												error={errors.email}
												helperText={
													errors.email
														? "Ingresá un email válido"
														: "Te respondemos a este email dentro de 24 hs"
												}
												disabled={submitting}
												required
												placeholder="tu@email.com"
												autoComplete="email"
											/>
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

										{/* Contexto fijo (lockedHeader) — se envía siempre, sin edición */}
										{hasLockedHeader && (
											<Stack spacing={0.75}>
												<Stack direction="row" spacing={0.75} alignItems="center">
													<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
													<Typography
														sx={{
															fontSize: "0.68rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Contexto que se envía a soporte
													</Typography>
												</Stack>
												<Box
													sx={{
														p: 1.5,
														borderRadius: 1.25,
														border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
														maxHeight: 180,
														overflowY: "auto",
													}}
												>
													<Typography
														component="pre"
														sx={{
															m: 0,
															fontFamily:
																'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
															fontSize: "0.74rem",
															lineHeight: 1.55,
															color: "text.primary",
															whiteSpace: "pre-wrap",
															wordBreak: "break-word",
														}}
													>
														{lockedHeader}
													</Typography>
												</Box>
												<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
													Este bloque se envía siempre. Si querés agregar algo más, escribilo abajo.
												</Typography>
											</Stack>
										)}

										{/* Mensaje */}
										<TextField
											fullWidth
											label={hasLockedHeader ? "Agregar más contexto (opcional)" : "Describí tu consulta"}
											name="message"
											multiline
											rows={hasLockedHeader ? 3 : 4}
											value={formData.message}
											onChange={handleChange}
											error={errors.message}
											helperText={
												errors.message
													? "El mensaje es requerido"
													: hasLockedHeader
													? "Sumá cualquier dato extra que ayude a entender el caso (opcional)."
													: "Proporcioná todos los detalles posibles"
											}
											disabled={submitting}
											required={!hasLockedHeader}
											placeholder={
												hasLockedHeader
													? "Ej.: 'verifiqué el número en la cédula y figura igual', 'el expediente sí aparece si lo busco manualmente en el portal'..."
													: isTemplateRequest
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
									<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) }} />
									<DialogActions sx={{ px: 3, py: 2 }}>
										<Button
											onClick={handleClose}
											disabled={submitting}
											sx={{
												textTransform: "none",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												color: "text.secondary",
												borderRadius: 1.25,
												border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
												px: 2,
												py: 0.75,
												transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
												"&:hover": {
													color: BRAND_BLUE,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
													borderColor: alpha(BRAND_BLUE, 0.28),
												},
											}}
										>
											Cancelar
										</Button>
										<Button
											variant="contained"
											onClick={handleSubmit}
											disabled={submitting}
											startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
											sx={{
												minWidth: 130,
												textTransform: "none",
												bgcolor: BRAND_BLUE,
												color: "#fff",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												borderRadius: 1.25,
												boxShadow: "none",
												transition: "background-color 0.15s ease",
												"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
												"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
											}}
										>
											{submitting ? "Enviando…" : "Enviar consulta"}
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
