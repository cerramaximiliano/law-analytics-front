import React, { useRef, useState, useEffect } from "react";
import {
	Stack,
	Box,
	Typography,
	Paper,
	IconButton,
	Chip,
	useTheme,
	Button,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Checkbox,
	Divider,
	InputAdornment,
	Autocomplete,
	GlobalStyles,
	CircularProgress,
	alpha,
} from "@mui/material";
import logo from "assets/images/large_logo_transparent.png";
import {
	Copy,
	Sms,
	Printer,
	Link21,
	Calculator,
	Information,
	DocumentText,
	StatusUp,
	Warning2,
	SearchNormal1,
	UserAdd,
	Save2,
	Refresh,
} from "iconsax-react";
import { useReactToPrint } from "react-to-print";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { getContactsByUserId } from "store/reducers/contacts";
import axios from "axios";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

interface ResultItem {
	key: string;
	value: number | string;
	customLabel?: string;
	formatType?: string;
}

interface CalculationDetailsViewProps {
	data: {
		_id: string;
		folderId?: string;
		amount: number;
		variables?: Record<string, any>;
		subClassType?: string;
		type?: string;
		interest?: number;
		capital?: number;
		keepUpdated?: boolean;
		originalData?: {
			amount?: number;
			capital?: number;
			interest?: number;
			endDate?: string | Date;
			createdAt?: string | Date;
		};
		lastUpdate?: {
			amount?: number;
			interest?: number;
			updatedAt?: string | Date;
			updatedToDate?: string | Date;
			segments?: Array<{
				startDate?: string | Date;
				endDate?: string | Date;
				rate?: string;
				rateName?: string;
				capital?: number;
				interest?: number;
				coefficient?: number;
				isExtension?: boolean;
				cerComparisonEnabled?: boolean;
				cerComparison?: {
					disponible: boolean;
					techo?: { factor: number; monto: number };
					piso?: { factor: number; monto: number };
					componentes?: any;
				};
			}>;
		};
	};
	getLabelForKey: (key: string, customLabel?: string) => string;
	formatValue: (key: string, value: number | string, formatType?: string) => string;
	groupResults: (variables: Record<string, any> | undefined) => Record<string, ResultItem[]>;
	generatePlainText: () => string;
	generateHtmlContent: () => string;
	customTitle?: string;
	hideInterestButton?: boolean;
	showInfoButton?: boolean;
	onInfoClick?: () => void;
	showSaveButton?: boolean;
	onSaveClick?: () => void;
	isSaved?: boolean;
	isSaving?: boolean;
	onKeepUpdatedChange?: (keepUpdated: boolean) => void;
	isKeepUpdatedLoading?: boolean;
	// Props para control externo
	openEmailModal?: boolean;
	onEmailModalClose?: () => void;
	triggerPrint?: boolean;
	onPrintComplete?: () => void;
}

// Helper: aplica clamp [piso, techo] de la comparativa CER si está disponible.
// Si no hay comparativa, devuelve el interés crudo. Las sumatorias y los renders
// de tramos deben usar esto, no segment.interest, para que el resultado refleje
// el clamp aplicado en la vista previa de tramos.
const getEffectiveInterest = (segment: any): number => {
	const cmp = segment?.cerComparison;
	const interest = segment?.interest || 0;
	if (!cmp || !cmp.disponible || !cmp.techo || !cmp.piso) return interest;
	return Math.max(cmp.piso.monto, Math.min(cmp.techo.monto, interest));
};

// Iconos para cada sección
const SectionIcons: Record<string, React.ElementType> = {
	detalles: Information,
	calculos: Calculator,
	intereses: StatusUp,
	reclamo: DocumentText,
	indemnizacion: Warning2,
	liquidacion: DocumentText,
	multas: Warning2,
};

export const CalculationDetailsView: React.FC<CalculationDetailsViewProps> = ({
	data,
	getLabelForKey,
	formatValue,
	groupResults,
	generatePlainText,
	generateHtmlContent,
	customTitle,
	hideInterestButton = false,
	showInfoButton = false,
	onInfoClick,
	showSaveButton = false,
	onSaveClick,
	isSaved = false,
	isSaving = false,
	onKeepUpdatedChange,
	isKeepUpdatedLoading = false,
	openEmailModal,
	onEmailModalClose,
	triggerPrint,
	onPrintComplete,
}) => {
	const theme = useTheme();
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [copyToMe, setCopyToMe] = useState(false);
	const [customMessage, setCustomMessage] = useState("");
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [interestRate, setInterestRate] = useState("");
	const [contactsLoaded, setContactsLoaded] = useState(false);
	const { contacts, isLoader: contactsLoading } = useSelector((state: any) => state.contacts);
	const { user } = useSelector((state: any) => state.auth);
	const printRef = useRef<HTMLDivElement>(null);

	// Cargar contactos cuando se abre el modal de email
	useEffect(() => {
		if (emailModalOpen && !contactsLoaded && user?._id) {
			dispatch(getContactsByUserId(user._id));
			setContactsLoaded(true);
		}
	}, [emailModalOpen, contactsLoaded, user?._id]);

	// Control externo del modal de email
	useEffect(() => {
		if (openEmailModal) {
			setEmailModalOpen(true);
		}
	}, [openEmailModal]);

	// Control externo de impresión
	useEffect(() => {
		if (triggerPrint && printRef.current) {
			handlePrint();
			onPrintComplete?.();
		}
	}, [triggerPrint]);

	const handleAddEmail = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (email && emailRegex.test(email) && !emailList.includes(email)) {
			setEmailList([...emailList, email]);
			setEmail("");
		} else if (email && !emailRegex.test(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Por favor ingrese un email válido",
					variant: "alert",
					alert: { color: "warning" },
					close: true,
				}),
			);
		} else if (email && emailList.includes(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Este email ya fue agregado a la lista",
					variant: "alert",
					alert: { color: "info" },
					close: true,
				}),
			);
			setEmail("");
		}
	};

	const handleRemoveEmail = (emailToRemove: string) => {
		setEmailList(emailList.filter((e) => e !== emailToRemove));
	};

	const handleEmailSend = async () => {
		if (isSendingEmail) return;

		try {
			let textBody = generatePlainText();
			let htmlBody = generateHtmlContent();
			const subject = customTitle || "Cálculo - Law||Analytics";
			const allEmails = [...emailList];

			if (allEmails.length === 0) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Debe agregar al menos un email a la lista de destinatarios",
						variant: "alert",
						alert: { color: "warning" },
						close: true,
					}),
				);
				return;
			}

			// Agregar mensaje personalizado si existe
			if (customMessage && customMessage.trim()) {
				textBody = `Mensaje del remitente:\n"${customMessage}"\n\n${"─".repeat(40)}\n\n${textBody}`;
				htmlBody = `<div style="margin-bottom: 24px; padding: 16px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #1976d2;">
					<div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Mensaje del remitente</div>
					<p style="margin: 0; white-space: pre-wrap; color: #333; font-style: italic;">"${customMessage.replace(/\n/g, "<br>")}"</p>
				</div>
				<hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;"/>
				${htmlBody}`;
			}

			setIsSendingEmail(true);

			await axios.post(`${import.meta.env.VITE_BASE_URL}/api/email/send-email`, {
				to: allEmails,
				subject,
				textBody,
				htmlBody,
				copyToMe: copyToMe,
			});

			dispatch(
				openSnackbar({
					open: true,
					message: `Cálculo enviado correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setEmailModalOpen(false);
			onEmailModalClose?.();
			setEmail("");
			setEmailList([]);
			setCopyToMe(false);
			setCustomMessage("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setIsSendingEmail(false);
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatePlainText());
			dispatch(
				openSnackbar({
					open: true,
					message: `Cálculo copiado correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
		} catch (err) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error al copiar. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
	});

	const handleUpdateWithInterest = async () => {
		try {
			// Aquí iría la lógica para actualizar con intereses

			dispatch(
				openSnackbar({
					open: true,
					message: "Intereses actualizados correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setUpdateModalOpen(false);
			setInterestRate("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar los intereses",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const getSectionTitle = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			calculos: "Metodología de Cálculo",
			intereses: "Intereses",
			reclamo: "Datos del Reclamo",
			indemnizacion: "Indemnización",
			liquidacion: "Liquidación Final",
			otrasSumas: "Otros Rubros",
			multas: "Multas",
		};
		return titles[groupKey] || groupKey;
	};

	// Verificar si el cálculo es elegible para keepUpdated
	const isEligibleForKeepUpdated = () => {
		// Verificar intereses en el campo principal o en variables (para cálculos guardados antes del fix)
		const hasInterest =
			(data.interest ?? 0) > 0 || (data.variables?.interesTotal ?? 0) > 0 || (data.variables?.calculatedInterest ?? 0) > 0;
		return data.type === "Calculado" && hasInterest;
	};

	const isDark = theme.palette.mode === "dark";

	const brandIconButtonSx = {
		width: 32,
		height: 32,
		borderRadius: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
		color: BRAND_BLUE,
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
		},
		"&:disabled": {
			bgcolor: alpha(theme.palette.text.disabled, 0.06),
			borderColor: alpha(theme.palette.text.disabled, 0.16),
			color: theme.palette.text.disabled,
		},
	};

	const renderActionButtons = () => (
		<Stack direction="row" spacing={0.875} sx={{ mb: 2 }} justifyContent="center" className="no-print" flexWrap="wrap" useFlexGap>
			<Tooltip title="Copiar al portapapeles">
				<IconButton onClick={handleCopyToClipboard} size="small" sx={brandIconButtonSx}>
					<Copy size={16} variant="Bulk" />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton onClick={() => setEmailModalOpen(true)} size="small" sx={brandIconButtonSx}>
					<Sms size={16} variant="Bulk" />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton onClick={handlePrint} size="small" sx={brandIconButtonSx}>
					<Printer size={16} variant="Bulk" />
				</IconButton>
			</Tooltip>
			<Tooltip title="Vincular a causa">
				<IconButton onClick={() => setLinkModalOpen(true)} size="small" sx={brandIconButtonSx}>
					<Link21 size={16} variant="Bulk" />
				</IconButton>
			</Tooltip>
			{!hideInterestButton && (
				<Tooltip title="Actualizar con intereses">
					<IconButton onClick={() => setUpdateModalOpen(true)} size="small" sx={brandIconButtonSx}>
						<Calculator size={16} variant="Bulk" />
					</IconButton>
				</Tooltip>
			)}
			{showInfoButton && onInfoClick && (
				<Tooltip title="Información sobre los cálculos">
					<IconButton onClick={onInfoClick} size="small" sx={brandIconButtonSx}>
						<Information size={16} variant="Bulk" />
					</IconButton>
				</Tooltip>
			)}
			{showSaveButton && onSaveClick && (
				<Tooltip title={isSaved ? "El cálculo ya fue guardado" : isSaving ? "Guardando..." : "Guardar cálculo"}>
					<span>
						<IconButton onClick={onSaveClick} disabled={isSaved || isSaving} size="small" sx={brandIconButtonSx}>
							{isSaving ? <CircularProgress size={16} sx={{ color: BRAND_BLUE }} /> : <Save2 size={16} variant="Bulk" />}
						</IconButton>
					</span>
				</Tooltip>
			)}
			{/* Toggle keepUpdated — visible cuando el cálculo está guardado y es elegible */}
			{isSaved && isEligibleForKeepUpdated() && onKeepUpdatedChange && (
				<Tooltip
					title={
						data.keepUpdated ? "Desactivar actualización automática de intereses" : "Mantener intereses actualizados a la fecha actual"
					}
				>
					<IconButton
						onClick={() => onKeepUpdatedChange(!data.keepUpdated)}
						disabled={isKeepUpdatedLoading}
						size="small"
						sx={
							data.keepUpdated
								? {
										width: 32,
										height: 32,
										borderRadius: 1,
										border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.4 : 0.3)}`,
										bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.1),
										color: LIVE_GREEN,
										transition: "all 180ms ease",
										"&:hover": {
											bgcolor: alpha(LIVE_GREEN, isDark ? 0.24 : 0.16),
											borderColor: alpha(LIVE_GREEN, isDark ? 0.54 : 0.4),
										},
										"&:disabled": {
											bgcolor: alpha(theme.palette.text.disabled, 0.06),
											borderColor: alpha(theme.palette.text.disabled, 0.16),
											color: theme.palette.text.disabled,
										},
								  }
								: brandIconButtonSx
						}
					>
						{isKeepUpdatedLoading ? (
							<CircularProgress size={16} sx={{ color: data.keepUpdated ? LIVE_GREEN : BRAND_BLUE }} />
						) : (
							<Refresh size={16} variant="Bulk" />
						)}
					</IconButton>
				</Tooltip>
			)}
		</Stack>
	);

	// Helper para formatear fechas en secciones
	const formatDateShort = (date: string | Date | undefined) => {
		if (!date) return "-";
		const d = new Date(date);
		return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
	};

	const renderSection = (title: string, items: ResultItem[], sectionKey: string, index: number) => {
		if (!items || !items.length) return null;

		// Verificar si hay segmentos guardados (múltiples tramos)
		const savedSegments = data.variables?.segments || [];
		const hasSavedSegments = savedSegments.length > 0;

		// Filtrar items para ocultar campos en la sección de intereses
		const hasSegments = data.keepUpdated && data.lastUpdate?.segments && data.lastUpdate.segments.length > 0;

		// Verificar si mostrar tramos en la sección de cálculos
		const showSegmentsInCalculos = sectionKey === "calculos" && hasSavedSegments;

		const visibleItems = items.filter((item) => {
			// Si hay segmentos guardados, ocultar los items que muestran detalles de tramos individuales
			// porque los mostraremos de una forma más estructurada
			if (hasSavedSegments && sectionKey === "calculos") {
				const keyLower = item.key.toLowerCase();
				// Ocultar items que son parte de los tramos individuales (tramoHeader, tramoTasa, etc.)
				if (keyLower.startsWith("tramo")) {
					return false;
				}
			}

			if (sectionKey === "intereses") {
				// Siempre ocultar estos campos
				if (item.key === "montoTotalConIntereses" || item.key === "capitalActualizado") {
					return false;
				}
				// Si hay segments, ocultar campos redundantes (se mostrará solo los tramos)
				if (hasSegments) {
					const keyLower = item.key.toLowerCase();
					// Ocultar capital (puede ser "capital", "capitalBase", "capitalBaseResult")
					if (keyLower.includes("capital") && !keyLower.includes("actualizado")) {
						return false;
					}
					// Ocultar fechas de intereses (ya aparecen en los títulos de los tramos)
					if (keyLower.includes("fecha") && keyLower.includes("interes")) {
						return false;
					}
					// Ocultar tasa de intereses (se muestra en Datos del Reclamo o Detalles)
					if (keyLower === "tasaintereses" || keyLower === "tasa") {
						return false;
					}
					// Ocultar campos que sean montos de intereses
					if (
						keyLower === "intereses" ||
						keyLower === "interest" ||
						keyLower === "montointereses" ||
						(keyLower.includes("interes") && !keyLower.includes("fecha") && !keyLower.includes("tasa") && typeof item.value === "number")
					) {
						return false;
					}
				}
			}
			return true;
		});

		if (!visibleItems.length && !hasSegments && !showSegmentsInCalculos) return null;

		const Icon = SectionIcons[sectionKey] || Information;

		return (
			<Paper
				elevation={0}
				sx={{
					mb: 1.25,
					overflow: "hidden",
					borderRadius: 1.5,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					bgcolor: "background.paper",
					boxShadow: "none",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						px: 1.75,
						py: 1.25,
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
						gap: 1,
					}}
				>
					<Box
						sx={{
							width: 26,
							height: 26,
							borderRadius: 0.75,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Icon size={14} variant="Bulk" />
					</Box>
					<Stack spacing={0.125}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.58rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Sección
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
							{getSectionTitle(sectionKey)}
						</Typography>
					</Stack>
				</Box>
				<Box sx={{ px: 2, py: 1.5 }}>
					{(() => {
						// Agrupar items por tramos si hay tramoHeader_
						const tramosMap = new Map<number, { header?: ResultItem; tasa?: ResultItem; interes?: ResultItem }>();
						const regularItems: ResultItem[] = [];

						visibleItems.forEach((item) => {
							const headerMatch = item.key.match(/^tramoHeader_(\d+)$/);
							const tasaMatch = item.key.match(/^tramoTasa_(\d+)$/);
							const interesMatch = item.key.match(/^tramoInteres_(\d+)$/);

							if (headerMatch) {
								const idx = parseInt(headerMatch[1], 10);
								if (!tramosMap.has(idx)) tramosMap.set(idx, {});
								tramosMap.get(idx)!.header = item;
							} else if (tasaMatch) {
								const idx = parseInt(tasaMatch[1], 10);
								if (!tramosMap.has(idx)) tramosMap.set(idx, {});
								tramosMap.get(idx)!.tasa = item;
							} else if (interesMatch) {
								const idx = parseInt(interesMatch[1], 10);
								if (!tramosMap.has(idx)) tramosMap.set(idx, {});
								tramosMap.get(idx)!.interes = item;
							} else {
								regularItems.push(item);
							}
						});

						const tramos = Array.from(tramosMap.entries()).sort((a, b) => a[0] - b[0]);
						const hasTramos = tramos.length > 0;

						return (
							<>
								{/* Renderizar items regulares primero (excluyendo montoIntereses si hay tramos) */}
								{regularItems
									.filter((item) => !hasTramos || item.key !== "montoIntereses")
									.map(({ key, value, customLabel, formatType }) => {
										// Estilo especial para leyenda de período de prueba
										if (key === "periodoPruebaLeyenda") {
											return (
												<Box
													key={key}
													sx={{
														mt: 1,
														p: 1.25,
														bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.06),
														borderRadius: 1,
														border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
														display: "flex",
														alignItems: "flex-start",
														gap: 1,
													}}
												>
													<Warning2 size={16} color={STALE_AMBER} variant="Bulk" style={{ flexShrink: 0, marginTop: 2 }} />
													<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>
														{formatValue(key, value, formatType)}
													</Typography>
												</Box>
											);
										}

										return (
											<Box
												key={key}
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													py: 0.75,
													"&:not(:last-child)": {
														borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
													},
												}}
											>
												<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													{getLabelForKey(key, customLabel)}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.82rem",
														fontWeight: 500,
														ml: 2,
														color: "text.primary",
														letterSpacing: "-0.005em",
														fontVariantNumeric: "tabular-nums",
													}}
												>
													{formatValue(key, value, formatType)}
												</Typography>
											</Box>
										);
									})}

								{/* Renderizar tramos agrupados con estilo visual */}
								{tramos.map(([idx, tramo]) => (
									<Box
										key={`tramo-group-${idx}`}
										sx={{
											mb: 1.25,
											mt: idx === 0 ? 1 : 0,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
											borderRadius: 1,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
											overflow: "hidden",
										}}
									>
										{/* Header del tramo */}
										{tramo.header && (
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													py: 0.75,
													px: 1.25,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
													borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
												}}
											>
												<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
													{getLabelForKey(tramo.header.key, tramo.header.customLabel)}
												</Typography>
												<Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.secondary", letterSpacing: "-0.005em" }}>
													{formatValue(tramo.header.key, tramo.header.value, tramo.header.formatType)}
												</Typography>
											</Box>
										)}
										{/* Detalles del tramo */}
										<Box sx={{ px: 1.25, py: 0.75 }}>
											{tramo.tasa && (
												<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.375 }}>
													<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
														{getLabelForKey(tramo.tasa.key, tramo.tasa.customLabel)}
													</Typography>
													<Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
														{formatValue(tramo.tasa.key, tramo.tasa.value, tramo.tasa.formatType)}
													</Typography>
												</Box>
											)}
											{tramo.interes && (
												<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.375 }}>
													<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
														{getLabelForKey(tramo.interes.key, tramo.interes.customLabel)}
													</Typography>
													<Typography
														sx={{
															fontSize: "0.72rem",
															fontWeight: 600,
															color: LIVE_GREEN,
															letterSpacing: "-0.005em",
															fontVariantNumeric: "tabular-nums",
														}}
													>
														{formatValue(tramo.interes.key, tramo.interes.value, tramo.interes.formatType)}
													</Typography>
												</Box>
											)}
										</Box>
									</Box>
								))}

								{/* Renderizar montoIntereses al final si hay tramos */}
								{hasTramos &&
									regularItems
										.filter((item) => item.key === "montoIntereses")
										.map(({ key, value, customLabel, formatType }) => (
											<Box
												key={key}
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													py: 0.75,
													mt: 1,
													borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
												}}
											>
												<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													{getLabelForKey(key, customLabel)}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.82rem",
														fontWeight: 600,
														ml: 2,
														color: LIVE_GREEN,
														letterSpacing: "-0.005em",
														fontVariantNumeric: "tabular-nums",
													}}
												>
													{formatValue(key, value, formatType)}
												</Typography>
											</Box>
										))}
							</>
						);
					})()}

					{/* Mostrar tramos guardados en la sección de cálculos */}
					{showSegmentsInCalculos && (
						<>
							{savedSegments.map((segment: any, segIndex: number) => (
								<Box
									key={`saved-segment-${segIndex}`}
									sx={{
										mb: 1.25,
										mt: segIndex === 0 ? 0 : 1,
										borderRadius: 1,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
										overflow: "hidden",
									}}
								>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.75,
											px: 1.25,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
											borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
										}}
									>
										<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
											Tramo {segIndex + 1}: {segment.startDate} - {segment.endDate}
										</Typography>
										{segment.isExtension && (
											<Box
												sx={{
													display: "inline-flex",
													alignItems: "center",
													gap: 0.5,
													px: 0.75,
													py: 0.125,
													borderRadius: 0.5,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
												}}
											>
												<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
												<Typography
													sx={{
														fontSize: "0.62rem",
														fontWeight: 600,
														color: BRAND_BLUE,
														letterSpacing: "0.04em",
														textTransform: "uppercase",
													}}
												>
													Extensión
												</Typography>
											</Box>
										)}
									</Box>
									<Box sx={{ px: 1.25, py: 0.75 }}>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.375 }}>
											<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>Tasa</Typography>
											<Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
												{segment.rateName || segment.rate}
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.375 }}>
											<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Capital del tramo
											</Typography>
											<Typography
												sx={{
													fontSize: "0.72rem",
													fontWeight: 500,
													color: "text.primary",
													letterSpacing: "-0.005em",
													fontVariantNumeric: "tabular-nums",
												}}
											>
												{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.capital || 0)}
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.375 }}>
											<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>Coeficiente</Typography>
											<Typography
												sx={{
													fontSize: "0.72rem",
													fontWeight: 500,
													color: "text.primary",
													letterSpacing: "-0.005em",
													fontVariantNumeric: "tabular-nums",
												}}
											>
												{((segment.coefficient || 0) * 100).toFixed(4)}%
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.375 }}>
											<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Interés generado
											</Typography>
											<Typography
												sx={{
													fontSize: "0.72rem",
													fontWeight: 600,
													color: LIVE_GREEN,
													letterSpacing: "-0.005em",
													fontVariantNumeric: "tabular-nums",
												}}
											>
												{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(getEffectiveInterest(segment))}
											</Typography>
										</Box>
									</Box>
									{segment.cerComparison?.disponible &&
										(() => {
											const eff = getEffectiveInterest(segment);
											const techo = segment.cerComparison.techo?.monto || 0;
											const piso = segment.cerComparison.piso?.monto || 0;
											const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v);
											const aplicado = eff === techo ? "(techo)" : eff === piso ? "(piso)" : "(dentro del rango)";
											return (
												<Box
													sx={{
														mx: 1.25,
														mb: 1,
														p: 1,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
														borderRadius: 1,
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
													}}
												>
													<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
														<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
														<Typography
															sx={{
																fontSize: "0.58rem",
																fontWeight: 600,
																letterSpacing: "0.08em",
																textTransform: "uppercase",
																color: BRAND_BLUE,
															}}
														>
															Comparativa CER (Ley 27.802)
														</Typography>
													</Stack>
													<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.15 }}>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: "text.secondary",
																letterSpacing: "-0.005em",
																textDecoration: eff !== (segment.interest || 0) ? "line-through" : "none",
															}}
														>
															Calculado
														</Typography>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: "text.secondary",
																letterSpacing: "-0.005em",
																fontVariantNumeric: "tabular-nums",
																textDecoration: eff !== (segment.interest || 0) ? "line-through" : "none",
															}}
														>
															{fmt(segment.interest || 0)}
														</Typography>
													</Box>
													<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.15 }}>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: eff === piso ? LIVE_GREEN : "text.secondary",
																fontWeight: eff === piso ? 700 : 400,
																letterSpacing: "-0.005em",
															}}
														>
															{eff === piso && "▸ "}Piso (67% × CER+3%)
														</Typography>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: eff === piso ? LIVE_GREEN : "text.secondary",
																fontWeight: eff === piso ? 700 : 400,
																letterSpacing: "-0.005em",
																fontVariantNumeric: "tabular-nums",
															}}
														>
															{fmt(piso)}
														</Typography>
													</Box>
													<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.15 }}>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: eff === techo ? STALE_AMBER : "text.secondary",
																fontWeight: eff === techo ? 700 : 400,
																letterSpacing: "-0.005em",
															}}
														>
															{eff === techo && "▸ "}Techo (CER+3%)
														</Typography>
														<Typography
															sx={{
																fontSize: "0.7rem",
																color: eff === techo ? STALE_AMBER : "text.secondary",
																fontWeight: eff === techo ? 700 : 400,
																letterSpacing: "-0.005em",
																fontVariantNumeric: "tabular-nums",
															}}
														>
															{fmt(techo)}
														</Typography>
													</Box>
													<Box
														sx={{
															display: "flex",
															justifyContent: "space-between",
															py: 0.375,
															mt: 0.25,
															borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
														}}
													>
														<Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: LIVE_GREEN, letterSpacing: "-0.005em" }}>
															Aplicado {aplicado}
														</Typography>
														<Typography
															sx={{
																fontSize: "0.72rem",
																fontWeight: 700,
																color: LIVE_GREEN,
																letterSpacing: "-0.005em",
																fontVariantNumeric: "tabular-nums",
															}}
														>
															{fmt(eff)}
														</Typography>
													</Box>
												</Box>
											);
										})()}
								</Box>
							))}
							{/* Mostrar si hay capitalización */}
							{data.variables?.capitalizeInterest && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										py: 0.625,
										mt: 1,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
										px: 1,
										borderRadius: 1,
									}}
								>
									<Stack direction="row" spacing={0.625} alignItems="center">
										<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
										<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.02em" }}>
											Capitalización de intereses activada
										</Typography>
									</Stack>
								</Box>
							)}
						</>
					)}

					{/* Mostrar tramos de intereses si es la sección de intereses */}
					{sectionKey === "intereses" && (hasSegments || hasSavedSegments) && (
						<>
							{/* Si hay keepUpdated con lastUpdate.segments, mostrar todos los tramos de lastUpdate */}
							{hasSegments &&
								data.lastUpdate!.segments!.map((segment, segIndex) => (
									<Box
										key={`segment-${segIndex}`}
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.875,
											borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
										}}
									>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											{segment.isExtension && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />}
											<Box>
												<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
													{segment.isExtension ? "Actualización automática" : `Tramo ${segIndex + 1}`} ({formatDateShort(segment.startDate)}{" "}
													- {formatDateShort(segment.endDate)})
												</Typography>
												{segment.rateName && (
													<Typography sx={{ fontSize: "0.66rem", color: "text.disabled", letterSpacing: "-0.005em" }}>
														{segment.rateName}
													</Typography>
												)}
											</Box>
										</Box>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: 600,
												ml: 2,
												letterSpacing: "-0.005em",
												fontVariantNumeric: "tabular-nums",
												color: segment.isExtension ? BRAND_BLUE : LIVE_GREEN,
											}}
										>
											{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(getEffectiveInterest(segment))}
										</Typography>
									</Box>
								))}
							{/* Si no hay keepUpdated pero hay segmentos guardados, mostrar los originales */}
							{!hasSegments &&
								hasSavedSegments &&
								savedSegments.map((segment: any, segIndex: number) => (
									<Box
										key={`saved-segment-${segIndex}`}
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.875,
											borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
										}}
									>
										<Box>
											<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
												Tramo {segIndex + 1} ({segment.startDate} - {segment.endDate})
											</Typography>
											{segment.rateName && (
												<Typography sx={{ fontSize: "0.66rem", color: "text.disabled", letterSpacing: "-0.005em" }}>
													{segment.rateName}
												</Typography>
											)}
										</Box>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: 600,
												ml: 2,
												letterSpacing: "-0.005em",
												fontVariantNumeric: "tabular-nums",
												color: LIVE_GREEN,
											}}
										>
											{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(getEffectiveInterest(segment))}
										</Typography>
									</Box>
								))}
						</>
					)}

					{/* Calcular y mostrar subtotal para secciones monetarias */}
					{(() => {
						const sectionsWithSubtotal = ["indemnizacion", "liquidacion", "multas", "intereses", "otrasSumas"];
						if (!sectionsWithSubtotal.includes(sectionKey)) return null;

						// Verificar si hay tramos dinámicos (tramoInteres_X)
						const hasDynamicTramos = visibleItems.some((item) => item.key.startsWith("tramoInteres_"));

						let subtotal = visibleItems.reduce((sum, item) => {
							// No sumar campos no monetarios
							if (
								item.key === "Periodos" ||
								item.key === "Días Vacaciones" ||
								item.key === "fechaInicialIntereses" ||
								item.key === "fechaFinalIntereses" ||
								item.key === "tasaIntereses" ||
								item.key === "capitalizeInterest" ||
								item.key === "periodoPruebaLeyenda" ||
								item.key.startsWith("tramoHeader_") ||
								item.key.startsWith("tramoTasa_")
							) {
								return sum;
							}
							// Si hay tramos dinámicos, no sumar los tramoInteres_ individuales (solo sumar montoIntereses)
							if (hasDynamicTramos && item.key.startsWith("tramoInteres_")) {
								return sum;
							}
							const numValue = typeof item.value === "number" ? item.value : parseFloat(String(item.value));
							return sum + (isNaN(numValue) ? 0 : numValue);
						}, 0);

						// Si es sección de intereses con segments de lastUpdate, sumar los intereses de los tramos
						if (sectionKey === "intereses" && hasSegments) {
							subtotal = data.lastUpdate!.segments!.reduce((sum, seg) => sum + getEffectiveInterest(seg), 0);
						} else if (sectionKey === "intereses" && hasSavedSegments) {
							// Si hay segmentos guardados pero no hay keepUpdated
							subtotal = savedSegments.reduce((sum: number, seg: any) => sum + getEffectiveInterest(seg), 0);
						}

						// Si es sección de cálculos con segmentos guardados, calcular el subtotal de los intereses
						if (sectionKey === "calculos" && hasSavedSegments) {
							subtotal = savedSegments.reduce((sum: number, seg: any) => sum + getEffectiveInterest(seg), 0);
						}

						if (subtotal <= 0) return null;

						return (
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									py: 1,
									borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
									mt: 1,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									mx: -1.75,
									px: 1.75,
								}}
							>
								<Typography
									sx={{
										fontSize: "0.7rem",
										fontWeight: 600,
										letterSpacing: "0.04em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Subtotal
								</Typography>
								<Typography
									sx={{
										fontSize: "0.88rem",
										fontWeight: 700,
										letterSpacing: "-0.005em",
										color: BRAND_BLUE,
										fontVariantNumeric: "tabular-nums",
									}}
								>
									{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(subtotal)}
								</Typography>
							</Box>
						);
					})()}
				</Box>
			</Paper>
		);
	};

	const groupedData = groupResults(data?.variables);

	return (
		<>
			<GlobalStyles
				styles={{
					"@media print": {
						"@page": {
							margin: "2cm",
							size: "A4",
						},
						body: {
							margin: "0",
							padding: "0",
							backgroundColor: "white",
						},
						".no-print": {
							display: "none !important",
						},
						".MuiPaper-root": {
							boxShadow: "none !important",
							border: "1px solid #ddd !important",
							pageBreakInside: "avoid",
							marginBottom: "10px !important",
						},
						".MuiBox-root": {
							pageBreakInside: "avoid",
						},
						".MuiTypography-root": {
							fontSize: "12px !important",
							pageBreakInside: "avoid",
						},
						".MuiTypography-h6": {
							fontSize: "14px !important",
							fontWeight: "bold !important",
						},
						".MuiTypography-body1": {
							fontSize: "12px !important",
						},
						".MuiTypography-body2": {
							fontSize: "11px !important",
						},
						".MuiStack-root": {
							spacing: "8px !important",
						},
						"td, th": {
							padding: "4px 8px !important",
						},
						".print-logo": {
							display: "block !important",
							width: "150px !important",
							height: "auto !important",
							marginBottom: "20px !important",
						},
					},
					".print-logo": {
						display: "none",
					},
				}}
			/>
			<Box sx={{ p: 2, maxWidth: 800, mx: "auto" }}>
				{/* Botones de acción */}
				{renderActionButtons()}

				<Box
					sx={{
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
						borderRadius: 2,
						p: 2,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
						boxShadow: "none",
						"@media print": {
							bgcolor: "white !important",
							border: "none !important",
							boxShadow: "none !important",
							p: 0,
						},
					}}
				>
					<div ref={printRef}>
						{/* Logo para impresión */}
						<Box className="print-logo" sx={{ textAlign: "center", mb: 3 }}>
							<img src={logo} alt="Law Analytics" style={{ maxWidth: "150px", height: "auto" }} />
						</Box>

						{/* Contenido principal */}
						<Stack spacing={1}>
							{/* Renderizar las secciones disponibles */}
							{Object.entries(groupedData).map(([key, items], index) => (
								<React.Fragment key={`section-${key}-${index}`}>{renderSection(key, items as ResultItem[], key, index)}</React.Fragment>
							))}

							{/* Card del total — destacado en verde brand */}
							<Paper
								elevation={0}
								sx={{
									mt: 1.5,
									overflow: "hidden",
									borderRadius: 1.5,
									border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.28 : 0.2)}`,
									bgcolor: "background.paper",
									boxShadow: "none",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										px: 1.75,
										py: 1.25,
										borderBottom: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.22 : 0.14)}`,
										bgcolor: alpha(LIVE_GREEN, isDark ? 0.06 : 0.03),
									}}
								>
									<Box
										sx={{
											width: 26,
											height: 26,
											borderRadius: 0.75,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(LIVE_GREEN, isDark ? 0.18 : 0.1),
											border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
											color: LIVE_GREEN,
											flexShrink: 0,
										}}
									>
										<Calculator size={14} variant="Bulk" />
									</Box>
									<Stack spacing={0.125}>
										<Stack direction="row" spacing={0.5} alignItems="center">
											<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: LIVE_GREEN }} />
											<Typography
												sx={{
													fontSize: "0.58rem",
													fontWeight: 600,
													letterSpacing: "0.08em",
													textTransform: "uppercase",
													color: "text.secondary",
												}}
											>
												Resultado
											</Typography>
										</Stack>
										<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
											{data.subClassType === "laboral" ? "Total" : "Capital actualizado"}
										</Typography>
									</Stack>
								</Box>
								<Box sx={{ px: 1.75, py: 1.5 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
										<Typography
											sx={{
												fontSize: "0.7rem",
												fontWeight: 600,
												letterSpacing: "0.04em",
												textTransform: "uppercase",
												color: "text.secondary",
											}}
										>
											{data.subClassType === "laboral" ? "Total a pagar" : "Capital actualizado"}
										</Typography>
										<Typography
											sx={{
												fontSize: "1.05rem",
												fontWeight: 700,
												letterSpacing: "-0.015em",
												color: LIVE_GREEN,
												fontVariantNumeric: "tabular-nums",
											}}
										>
											{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
												data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount,
											)}
										</Typography>
									</Stack>
								</Box>
							</Paper>
						</Stack>
					</div>
				</Box>
			</Box>

			{/* Modales */}
			<Dialog
				open={emailModalOpen}
				onClose={() => {
					setEmailModalOpen(false);
					onEmailModalClose?.();
				}}
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
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.25,
						px: 2.5,
						py: 1.75,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<Sms size={18} variant="Bulk" />
					</Box>
					<Stack spacing={0.125}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
							>
								Compartir cálculo
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
							Enviar por email
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Stack direction="row" spacing={1}>
							<TextField
								autoFocus
								margin="dense"
								label="Dirección de Email"
								type="email"
								fullWidth
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddEmail();
									}
								}}
								placeholder="Escribe un email y haz clic en Agregar"
								size="small"
							/>
							<Button variant="contained" onClick={handleAddEmail} color="primary" disabled={!email.trim()} size="small">
								Agregar
							</Button>
						</Stack>
						<Typography variant="caption" color="textSecondary">
							* Debes agregar cada email a la lista de destinatarios antes de enviar.
						</Typography>

						{emailList.length > 0 && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle2" gutterBottom>
									Destinatarios:
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{emailList.map((emailItem, index) => (
										<Chip
											key={`email-chip-${index}`}
											label={emailItem}
											onDelete={() => handleRemoveEmail(emailItem)}
											size="small"
											sx={{ m: 0.5 }}
										/>
									))}
								</Box>
							</Box>
						)}

						<Divider sx={{ my: 2 }}>
							<Typography variant="caption" color="textSecondary">
								o seleccionar de mis contactos
							</Typography>
						</Divider>

						{contactsLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
								<Typography>Cargando contactos...</Typography>
							</Box>
						) : contacts && contacts.length > 0 ? (
							<Autocomplete
								size="small"
								options={contacts.filter((contact: any) => contact.email)}
								getOptionLabel={(option: any) => `${option.name} ${option.lastName} (${option.email})`}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Buscar contacto"
										variant="outlined"
										size="small"
										InputProps={{
											...params.InputProps,
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={16} />
												</InputAdornment>
											),
										}}
									/>
								)}
								renderOption={(props, option: any) => (
									<li {...props}>
										<Stack direction="row" spacing={1} alignItems="center" width="100%">
											<UserAdd size={16} />
											<Stack direction="column" sx={{ overflow: "hidden" }}>
												<Typography variant="body2" noWrap>
													{option.name} {option.lastName}
												</Typography>
												<Typography variant="caption" color="textSecondary" noWrap>
													{option.email}
												</Typography>
											</Stack>
										</Stack>
									</li>
								)}
								onChange={(_, newValue) => {
									if (newValue && newValue.email && !emailList.includes(newValue.email)) {
										setEmailList([...emailList, newValue.email]);
									}
								}}
								sx={{ mt: 1 }}
							/>
						) : null}

						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Mensaje (opcional):
							</Typography>
							<TextField
								multiline
								fullWidth
								rows={4}
								placeholder="Escriba un mensaje personalizado que se incluirá en el correo (opcional)"
								value={customMessage}
								onChange={(e) => setCustomMessage(e.target.value)}
								variant="outlined"
								size="small"
							/>
						</Box>

						<Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
							<Checkbox size="small" checked={copyToMe} onChange={(e) => setCopyToMe(e.target.checked)} id="copy-to-me" />
							<Typography component="label" htmlFor="copy-to-me" variant="body2" sx={{ cursor: "pointer" }}>
								Enviarme una copia
							</Typography>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
					<Button
						onClick={() => {
							setEmailModalOpen(false);
							onEmailModalClose?.();
							setEmail("");
							setEmailList([]);
							setCopyToMe(false);
							setCustomMessage("");
						}}
						disabled={isSendingEmail}
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							color: "text.secondary",
							borderRadius: 1.25,
							px: 2,
							py: 0.875,
							border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
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
						onClick={handleEmailSend}
						variant="contained"
						disabled={isSendingEmail}
						startIcon={isSendingEmail ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : undefined}
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							bgcolor: BRAND_BLUE,
							color: "#fff",
							borderRadius: 1.25,
							px: 2,
							py: 0.875,
							boxShadow: "none",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
						}}
					>
						{isSendingEmail ? "Enviando..." : "Enviar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Link Modal */}
			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={data._id} folderId={data.folderId} />

			{/* Interest Modal */}
			{!hideInterestButton && (
				<Dialog
					open={updateModalOpen}
					onClose={() => setUpdateModalOpen(false)}
					maxWidth="xs"
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
					<DialogTitle
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.25,
							px: 2.5,
							py: 1.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						}}
					>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Calculator size={18} variant="Bulk" />
						</Box>
						<Stack spacing={0.125}>
							<Stack direction="row" spacing={0.5} alignItems="center">
								<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
								>
									Recalcular
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Actualizar con intereses
							</Typography>
						</Stack>
					</DialogTitle>
					<DialogContent sx={{ pt: 3, pb: 1, px: 2.5 }}>
						<TextField
							autoFocus
							margin="dense"
							label="Tasa de interés (%)"
							type="number"
							fullWidth
							value={interestRate}
							onChange={(e) => setInterestRate(e.target.value)}
							size="small"
						/>
					</DialogContent>
					<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
						<Button
							onClick={() => setUpdateModalOpen(false)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.secondary",
								borderRadius: 1.25,
								px: 2,
								py: 0.875,
								border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
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
							onClick={handleUpdateWithInterest}
							variant="contained"
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								bgcolor: BRAND_BLUE,
								color: "#fff",
								borderRadius: 1.25,
								px: 2,
								py: 0.875,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
							}}
						>
							Actualizar
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};
