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

			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-email`, {
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

	const renderActionButtons = () => (
		<Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" className="no-print">
			<Tooltip title="Copiar al portapapeles">
				<IconButton
					onClick={handleCopyToClipboard}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Copy size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton
					onClick={() => setEmailModalOpen(true)}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Sms size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton
					onClick={handlePrint}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Printer size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Vincular a causa">
				<IconButton
					onClick={() => setLinkModalOpen(true)}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Link21 size={18} />
				</IconButton>
			</Tooltip>
			{!hideInterestButton && (
				<Tooltip title="Actualizar con intereses">
					<IconButton
						onClick={() => setUpdateModalOpen(true)}
						size="small"
						sx={{
							border: "1px solid",
							borderColor: "divider",
							bgcolor: "background.paper",
							"&:hover": {
								bgcolor: "action.hover",
								borderColor: "primary.main",
							},
						}}
					>
						<Calculator size={18} />
					</IconButton>
				</Tooltip>
			)}
			{showInfoButton && onInfoClick && (
				<Tooltip title="Información sobre los cálculos">
					<IconButton
						onClick={onInfoClick}
						size="small"
						sx={{
							border: "1px solid",
							borderColor: "divider",
							bgcolor: "background.paper",
							"&:hover": {
								bgcolor: "action.hover",
								borderColor: "primary.main",
							},
						}}
					>
						<Information size={18} />
					</IconButton>
				</Tooltip>
			)}
			{showSaveButton && onSaveClick && (
				<Tooltip title={isSaved ? "El cálculo ya fue guardado" : isSaving ? "Guardando..." : "Guardar cálculo"}>
					<span>
						<IconButton
							onClick={onSaveClick}
							disabled={isSaved || isSaving}
							size="small"
							sx={{
								border: "1px solid",
								borderColor: "divider",
								bgcolor: "background.paper",
								"&:hover": {
									bgcolor: "action.hover",
									borderColor: "primary.main",
								},
								"&:disabled": {
									bgcolor: "action.disabledBackground",
									borderColor: "divider",
								},
							}}
						>
							{isSaving ? <CircularProgress size={18} /> : <Save2 size={18} />}
						</IconButton>
					</span>
				</Tooltip>
			)}
			{/* Toggle keepUpdated - solo visible cuando el cálculo está guardado y es elegible */}
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
						sx={{
							border: "1px solid",
							borderColor: data.keepUpdated ? "primary.main" : "divider",
							bgcolor: data.keepUpdated ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
							color: data.keepUpdated ? "primary.main" : "text.secondary",
							"&:hover": {
								bgcolor: data.keepUpdated ? alpha(theme.palette.primary.main, 0.15) : "action.hover",
								borderColor: "primary.main",
							},
							"&:disabled": {
								bgcolor: "action.disabledBackground",
								borderColor: "divider",
							},
						}}
					>
						{isKeepUpdatedLoading ? <CircularProgress size={18} /> : <Refresh size={18} />}
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
					mb: 1.5,
					overflow: "hidden",
					borderRadius: 2,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: "background.paper",
					boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						px: 2,
						py: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
					}}
				>
					<Icon
						size={18}
						style={{
							marginRight: theme.spacing(1),
							color: theme.palette.primary.main,
						}}
					/>
					<Typography variant="body1" fontWeight={600}>
						{getSectionTitle(sectionKey)}
					</Typography>
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
														p: 1.5,
														bgcolor: alpha(theme.palette.warning.main, 0.1),
														borderRadius: 1,
														border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
														display: "flex",
														alignItems: "flex-start",
														gap: 1,
													}}
												>
													<Warning2
														size={18}
														color={theme.palette.warning.main}
														variant="Bold"
														style={{ flexShrink: 0, marginTop: 2 }}
													/>
													<Typography variant="body2" color="text.primary">
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
														borderBottom: `1px solid ${theme.palette.divider}`,
													},
												}}
											>
												<Typography variant="body2" color="text.secondary">
													{getLabelForKey(key, customLabel)}:
												</Typography>
												<Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
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
											mb: 1.5,
											mt: idx === 0 ? 1 : 0,
											bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
											borderRadius: 1,
											border: `1px solid ${theme.palette.divider}`,
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
													px: 1.5,
													bgcolor: theme.palette.mode === "dark" ? "grey.700" : "grey.100",
													borderBottom: `1px solid ${theme.palette.divider}`,
												}}
											>
												<Typography variant="body2" fontWeight={600}>
													{getLabelForKey(tramo.header.key, tramo.header.customLabel)}
												</Typography>
												<Typography variant="body2" fontWeight={500} color="text.secondary">
													{formatValue(tramo.header.key, tramo.header.value, tramo.header.formatType)}
												</Typography>
											</Box>
										)}
										{/* Detalles del tramo */}
										<Box sx={{ px: 1.5, py: 0.75 }}>
											{tramo.tasa && (
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														py: 0.5,
													}}
												>
													<Typography variant="caption" color="text.secondary">
														{getLabelForKey(tramo.tasa.key, tramo.tasa.customLabel)}:
													</Typography>
													<Typography variant="caption" fontWeight={500}>
														{formatValue(tramo.tasa.key, tramo.tasa.value, tramo.tasa.formatType)}
													</Typography>
												</Box>
											)}
											{tramo.interes && (
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														py: 0.5,
													}}
												>
													<Typography variant="caption" color="text.secondary">
														{getLabelForKey(tramo.interes.key, tramo.interes.customLabel)}:
													</Typography>
													<Typography variant="caption" fontWeight={500} color="success.main">
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
													borderTop: `1px solid ${theme.palette.divider}`,
												}}
											>
												<Typography variant="body2" color="text.secondary">
													{getLabelForKey(key, customLabel)}:
												</Typography>
												<Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
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
								<Box key={`saved-segment-${segIndex}`} sx={{ mb: 1.5, mt: segIndex === 0 ? 0 : 1 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.5,
											bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
											px: 1,
											borderRadius: 1,
											mb: 0.5,
										}}
									>
										<Typography variant="body2" fontWeight={600}>
											Tramo {segIndex + 1}: {segment.startDate} - {segment.endDate}
										</Typography>
										{segment.isExtension && <Chip label="Extensión" size="small" color="info" sx={{ height: 20, fontSize: "0.7rem" }} />}
									</Box>
									<Box sx={{ pl: 1 }}>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
											<Typography variant="caption" color="text.secondary">
												Tasa:
											</Typography>
											<Typography variant="caption" fontWeight={500}>
												{segment.rateName || segment.rate}
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
											<Typography variant="caption" color="text.secondary">
												Capital del tramo:
											</Typography>
											<Typography variant="caption" fontWeight={500}>
												{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.capital || 0)}
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
											<Typography variant="caption" color="text.secondary">
												Coeficiente:
											</Typography>
											<Typography variant="caption" fontWeight={500}>
												{((segment.coefficient || 0) * 100).toFixed(4)}%
											</Typography>
										</Box>
										<Box sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
											<Typography variant="caption" color="text.secondary">
												Interés generado:
											</Typography>
											<Typography variant="caption" fontWeight={500} color="success.main">
												{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.interest || 0)}
											</Typography>
										</Box>
									</Box>
								</Box>
							))}
							{/* Mostrar si hay capitalización */}
							{data.variables?.capitalizeInterest && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										py: 0.5,
										mt: 1,
										bgcolor: alpha(theme.palette.info.main, 0.1),
										px: 1,
										borderRadius: 1,
									}}
								>
									<Typography variant="caption" color="info.main">
										Capitalización de intereses activada
									</Typography>
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
											py: 0.75,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
									>
										<Box>
											<Typography variant="body2" color="text.secondary">
												{segment.isExtension ? "Actualización automática" : `Tramo ${segIndex + 1}`} ({formatDateShort(segment.startDate)} -{" "}
												{formatDateShort(segment.endDate)}):
											</Typography>
											{segment.rateName && (
												<Typography variant="caption" color="text.disabled">
													{segment.rateName}
												</Typography>
											)}
										</Box>
										<Typography
											variant="body2"
											fontWeight={500}
											sx={{ ml: 2, color: segment.isExtension ? "primary.main" : "text.primary" }}
										>
											{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.interest || 0)}
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
											py: 0.75,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
									>
										<Box>
											<Typography variant="body2" color="text.secondary">
												Tramo {segIndex + 1} ({segment.startDate} - {segment.endDate}):
											</Typography>
											{segment.rateName && (
												<Typography variant="caption" color="text.disabled">
													{segment.rateName}
												</Typography>
											)}
										</Box>
										<Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
											{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.interest || 0)}
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
							subtotal = data.lastUpdate!.segments!.reduce((sum, seg) => sum + (seg.interest || 0), 0);
						} else if (sectionKey === "intereses" && hasSavedSegments) {
							// Si hay segmentos guardados pero no hay keepUpdated
							subtotal = savedSegments.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);
						}

						// Si es sección de cálculos con segmentos guardados, calcular el subtotal de los intereses
						if (sectionKey === "calculos" && hasSavedSegments) {
							subtotal = savedSegments.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);
						}

						if (subtotal <= 0) return null;

						return (
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									py: 0.75,
									borderTop: `2px solid ${theme.palette.divider}`,
									mt: 1,
									bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
									mx: -2,
									px: 2,
								}}
							>
								<Typography variant="body2" fontWeight={600} color="text.primary">
									Subtotal:
								</Typography>
								<Typography variant="body2" fontWeight={600} sx={{ ml: 2, color: "primary.main" }}>
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(subtotal)}
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
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
						borderRadius: 2,
						p: 2,
						border: `1px solid ${theme.palette.divider}`,
						boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
						"&:hover": {
							bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
						},
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

							{/* Card del total con diseño minimalista */}
							<Paper
								elevation={0}
								sx={{
									mt: 1.5,
									overflow: "hidden",
									borderRadius: 2,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: "background.paper",
									boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										px: 2,
										py: 1.5,
										borderBottom: `1px solid ${theme.palette.divider}`,
										bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
									}}
								>
									<Typography variant="body1" fontWeight={600}>
										{data.subClassType === "laboral" ? "Total" : "Capital Actualizado"}
									</Typography>
								</Box>
								<Box sx={{ px: 2, py: 1.5 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											py: 0.75,
										}}
									>
										<Typography variant="body2" color="text.secondary">
											{data.subClassType === "laboral" ? "Total a pagar:" : "Capital actualizado:"}
										</Typography>
										<Typography variant="body2" fontWeight={700} sx={{ ml: 2, color: "primary.main" }}>
											{new Intl.NumberFormat("es-AR", {
												style: "currency",
												currency: "ARS",
											}).format(data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount)}
										</Typography>
									</Box>
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
			>
				<DialogTitle>Enviar por Email</DialogTitle>
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
				<DialogActions>
					<Button
						color="error"
						onClick={() => {
							setEmailModalOpen(false);
							onEmailModalClose?.();
							setEmail("");
							setEmailList([]);
							setCopyToMe(false);
							setCustomMessage("");
						}}
						disabled={isSendingEmail}
					>
						Cancelar
					</Button>
					<Button
						onClick={handleEmailSend}
						variant="contained"
						disabled={isSendingEmail}
						startIcon={isSendingEmail ? <CircularProgress size={20} /> : undefined}
					>
						{isSendingEmail ? "Enviando..." : "Enviar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Link Modal */}
			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={data._id} folderId={data.folderId} />

			{/* Interest Modal */}
			{!hideInterestButton && (
				<Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)}>
					<DialogTitle>Actualizar con Intereses</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Tasa de Interés (%)"
							type="number"
							fullWidth
							value={interestRate}
							onChange={(e) => setInterestRate(e.target.value)}
							size="small"
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setUpdateModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleUpdateWithInterest} variant="contained">
							Actualizar
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	);
};
