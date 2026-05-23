import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	Button,
	Stack,
	Typography,
	Box,
	CircularProgress,
	IconButton,
	Tooltip,
	alpha,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import {
	ArrowRight2,
	Calendar,
	CloseCircle,
	DocumentText,
	InfoCircle,
	Lock1,
	SearchNormal1,
	TickCircle,
	Warning2,
} from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { getPendingCausas, selectPendingCausa, clearPendingCausas } from "store/reducers/folder";
import { PendingCausa } from "types/folder";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

interface CausaSelectorProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
	folderName: string;
	onCausaSelected?: (causa: PendingCausa) => void;
	onSelectionCancelled?: () => void;
}

const CausaSelector: React.FC<CausaSelectorProps> = ({ open, onClose, folderId, folderName, onCausaSelected, onSelectionCancelled }) => {
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [selecting, setSelecting] = useState(false);
	const [causas, setCausas] = useState<PendingCausa[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [causaType, setCausaType] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [selectedCausaId, setSelectedCausaId] = useState<string | null>(null);
	const [showCloseWarning, setShowCloseWarning] = useState(false);
	const [closeAction, setCloseAction] = useState<"close" | "cancel">("close");

	// Cargar causas pendientes cuando se abre el diálogo
	useEffect(() => {
		if (open && folderId) {
			loadPendingCausas();
		}
	}, [open, folderId]);

	const loadPendingCausas = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await dispatch(getPendingCausas(folderId) as any);

			if (result.success) {
				setCausas(result.causas);
				setSearchTerm(result.searchTerm || "");
				setCausaType(result.causaType);
			} else {
				setError(result.error || "Error al cargar las causas");
			}
		} catch (err) {
			setError("Error al cargar las causas pendientes");
		} finally {
			setLoading(false);
		}
	};

	const handleSelectCausa = async (causaId: string) => {
		setSelecting(true);
		setSelectedCausaId(causaId);

		try {
			const result = await dispatch(selectPendingCausa(folderId, causaId, true) as any);

			if (result.success) {
				enqueueSnackbar("Causa vinculada exitosamente", { variant: "success", anchorOrigin: { vertical: "bottom", horizontal: "right" } });
				const selectedCausa = causas.find((c) => c._id === causaId);
				if (selectedCausa) {
					onCausaSelected?.(selectedCausa);
				}
				onClose();
			} else {
				setError(result.error || "Error al seleccionar la causa");
				enqueueSnackbar(result.error || "Error al seleccionar la causa", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			}
		} catch (err) {
			setError("Error al seleccionar la causa");
			enqueueSnackbar("Error al seleccionar la causa", { variant: "error", anchorOrigin: { vertical: "bottom", horizontal: "right" } });
		} finally {
			setSelecting(false);
			setSelectedCausaId(null);
		}
	};

	// Mostrar advertencia antes de cerrar o cancelar
	const handleShowCloseWarning = (action: "close" | "cancel") => {
		setCloseAction(action);
		setShowCloseWarning(true);
	};

	// Ejecutar cierre sin cancelar vinculación (solo cerrar el modal)
	const handleConfirmClose = () => {
		setShowCloseWarning(false);
		onClose();
	};

	// Ejecutar cancelación de vinculación
	const handleConfirmCancelSelection = async () => {
		setShowCloseWarning(false);
		setSelecting(true);

		try {
			const result = await dispatch(clearPendingCausas(folderId) as any);

			if (result.success) {
				enqueueSnackbar("Vinculación cancelada. El expediente quedó sin asociar.", {
					variant: "warning",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
				onSelectionCancelled?.();
				onClose();
			} else {
				setError(result.error || "Error al cancelar la selección");
				enqueueSnackbar(result.error || "Error al cancelar la selección", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			}
		} catch (err) {
			setError("Error al cancelar la selección");
			enqueueSnackbar("Error al cancelar la selección", { variant: "error", anchorOrigin: { vertical: "bottom", horizontal: "right" } });
		} finally {
			setSelecting(false);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		try {
			return new Date(dateString).toLocaleDateString("es-AR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			});
		} catch {
			return null;
		}
	};

	const getPlatformName = () => {
		if (causaType === "CausasEje") return "EJE - Poder Judicial de CABA";
		if (causaType === "MEV") return "MEV - Poder Judicial de Buenos Aires";
		return "Sistema Judicial";
	};

	const isDark = theme.palette.mode === "dark";
	const platformName = getPlatformName();

	return (
		<Dialog
			open={open}
			onClose={() => !selecting && handleShowCloseWarning("close")}
			TransitionComponent={PopupTransition}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
					overflow: "hidden",
					bgcolor: "background.paper",
				},
			}}
		>
			{/* ====== HEADER ====== */}
			<Box
				sx={{
					position: "relative",
					px: { xs: 2.25, sm: 3 },
					py: { xs: 1.75, sm: 2 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
				}}
			>
				<Stack direction="row" alignItems="flex-start" spacing={1.5}>
					<Box
						sx={{
							flexShrink: 0,
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
							color: BRAND_BLUE,
						}}
					>
						<DocumentText size={20} variant="Bulk" />
					</Box>
					<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={0.75} alignItems="center">
							<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: BRAND_BLUE,
								}}
							>
								{loading ? "Buscando coincidencias" : `${causas.length} ${causas.length === 1 ? "coincidencia" : "coincidencias"}`}
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: { xs: "1.05rem", sm: "1.15rem" },
								fontWeight: 600,
								letterSpacing: "-0.018em",
								color: "text.primary",
								lineHeight: 1.25,
							}}
						>
							Seleccionar expediente
						</Typography>
						<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Elegí cuál de los expedientes corresponde a la carpeta {folderName ? <strong>"{folderName}"</strong> : "seleccionada"}.
						</Typography>
					</Stack>
					<IconButton
						onClick={() => !selecting && handleShowCloseWarning("close")}
						disabled={selecting}
						size="small"
						sx={{
							color: "text.secondary",
							alignSelf: "flex-start",
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.05) },
						}}
					>
						<CloseCircle size={18} />
					</IconButton>
				</Stack>
			</Box>

			{/* ====== BODY ====== */}
			<DialogContent sx={{ p: { xs: 2.25, sm: 2.75 }, bgcolor: "background.default" }}>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 1.25,
							minHeight: 200,
						}}
					>
						<CircularProgress size={28} thickness={4} sx={{ color: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Consultando expedientes pendientes…
						</Typography>
					</Box>
				) : error && causas.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: 1,
							p: 1.5,
							borderRadius: 1.25,
							border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
							bgcolor: alpha(theme.palette.error.main, isDark ? 0.1 : 0.05),
						}}
					>
						<Warning2 size={16} variant="Bulk" color={theme.palette.error.main} style={{ marginTop: 2, flexShrink: 0 }} />
						<Typography sx={{ fontSize: "0.82rem", color: "text.primary", lineHeight: 1.5 }}>{error}</Typography>
					</Box>
				) : (
					<Stack spacing={1.75}>
						{/* Banner de contexto: búsqueda + origen */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
								border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
								borderRadius: 1.25,
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									px: 1.5,
									py: 1,
									borderRight: { xs: "none", sm: `1px solid ${alpha(theme.palette.divider, 0.9)}` },
									borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.9)}`, sm: "none" },
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.025 : 0.015),
								}}
							>
								<Stack direction="row" spacing={0.625} alignItems="center" sx={{ mb: 0.25 }}>
									<SearchNormal1 size={11} color={theme.palette.text.secondary} />
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.06em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Búsqueda
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: "0.82rem",
										fontWeight: 600,
										color: "text.primary",
										letterSpacing: "-0.005em",
										fontVariantNumeric: "tabular-nums",
										wordBreak: "break-word",
									}}
								>
									{searchTerm || "—"}
								</Typography>
							</Box>
							<Box sx={{ px: 1.5, py: 1 }}>
								<Stack direction="row" spacing={0.625} alignItems="center" sx={{ mb: 0.25 }}>
									<DocumentText size={11} color={theme.palette.text.secondary} />
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.06em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Origen
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: "0.82rem",
										fontWeight: 600,
										color: "text.primary",
										letterSpacing: "-0.005em",
										wordBreak: "break-word",
									}}
								>
									{platformName}
								</Typography>
							</Box>
						</Box>

						{/* Hint corto */}
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45, letterSpacing: "-0.005em", px: 0.25 }}>
							Hacé click en una tarjeta para vincularla. La selección se sincroniza al instante.
						</Typography>

						{/* Lista de causas */}
						<Stack spacing={1}>
							{causas.map((causa) => {
								const isSelecting = selecting && selectedCausaId === causa._id;
								const cardTone = causa.isPrivate ? STALE_AMBER : BRAND_BLUE;
								const estadoLabel = causa.estado;
								const estadoTone =
									estadoLabel === "ARCHIVADO"
										? theme.palette.text.secondary
										: estadoLabel === "EN TRAMITE"
										? theme.palette.success.main
										: BRAND_BLUE;

								return (
									<Box
										key={causa._id}
										onClick={() => !selecting && handleSelectCausa(causa._id)}
										sx={{
											position: "relative",
											px: 1.5,
											py: 1.25,
											borderRadius: 1.25,
											border: `1px solid ${alpha(cardTone, isDark ? 0.22 : 0.16)}`,
											bgcolor: alpha(cardTone, isDark ? 0.04 : 0.022),
											cursor: selecting ? "default" : "pointer",
											transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
											opacity: selecting && !isSelecting ? 0.55 : 1,
											"&:hover":
												selecting || isSelecting
													? undefined
													: {
															borderColor: alpha(cardTone, isDark ? 0.5 : 0.38),
															bgcolor: alpha(cardTone, isDark ? 0.09 : 0.05),
													  },
											"&:active": selecting ? undefined : { transform: "scale(0.998)" },
										}}
									>
										{/* Top row: CUIJ + chips */}
										<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 0.5 }}>
											<Typography
												sx={{
													fontSize: "0.82rem",
													fontWeight: 600,
													color: cardTone,
													letterSpacing: "0.005em",
													fontVariantNumeric: "tabular-nums",
													fontFamily:
														"ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
												}}
											>
												{causa.cuij || `EXP ${causa.numero}/${causa.anio}`}
											</Typography>

											{causa.isPrivate && (
												<Tooltip title="Acceso restringido — algunos datos pueden no estar disponibles">
													<Box
														sx={{
															display: "inline-flex",
															alignItems: "center",
															gap: 0.375,
															px: 0.75,
															py: 0.125,
															borderRadius: 0.75,
															bgcolor: alpha(STALE_AMBER, isDark ? 0.15 : 0.1),
															border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.3 : 0.22)}`,
														}}
													>
														<Lock1 size={10} variant="Bulk" color={STALE_AMBER} />
														<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.04em" }}>
															PRIVADO
														</Typography>
													</Box>
												</Tooltip>
											)}

											{estadoLabel && (
												<Box
													sx={{
														display: "inline-flex",
														alignItems: "center",
														px: 0.75,
														py: 0.125,
														borderRadius: 0.75,
														bgcolor: alpha(estadoTone, isDark ? 0.14 : 0.08),
														border: `1px solid ${alpha(estadoTone, isDark ? 0.28 : 0.2)}`,
													}}
												>
													<Typography
														sx={{
															fontSize: "0.62rem",
															fontWeight: 600,
															color: estadoTone,
															letterSpacing: "0.04em",
															textTransform: "uppercase",
														}}
													>
														{estadoLabel}
													</Typography>
												</Box>
											)}
										</Stack>

										{/* Carátula */}
										{causa.caratula && (
											<Typography
												sx={{
													fontSize: "0.86rem",
													fontWeight: 500,
													color: "text.primary",
													lineHeight: 1.4,
													letterSpacing: "-0.005em",
													mb: 0.625,
													textWrap: "pretty",
												}}
											>
												{causa.caratula}
											</Typography>
										)}

										{/* Bottom row: meta + CTA */}
										<Stack
											direction="row"
											alignItems="center"
											spacing={1.5}
											sx={{ flexWrap: "wrap", rowGap: 0.5 }}
										>
											<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5, flex: 1, minWidth: 0 }}>
												<Typography
													sx={{
														fontSize: "0.72rem",
														color: "text.secondary",
														letterSpacing: "-0.005em",
														fontVariantNumeric: "tabular-nums",
													}}
												>
													Exp. <strong style={{ color: theme.palette.text.primary }}>{causa.numero}/{causa.anio}</strong>
												</Typography>
												{causa.fechaInicio && (
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Calendar size={11} color={theme.palette.text.secondary} />
														<Typography
															sx={{
																fontSize: "0.72rem",
																color: "text.secondary",
																letterSpacing: "-0.005em",
																fontVariantNumeric: "tabular-nums",
															}}
														>
															Inicio {formatDate(causa.fechaInicio)}
														</Typography>
													</Stack>
												)}
											</Stack>

											<Stack direction="row" spacing={0.625} alignItems="center" sx={{ color: cardTone, flexShrink: 0 }}>
												{isSelecting ? (
													<>
														<CircularProgress size={12} thickness={5} sx={{ color: cardTone }} />
														<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: cardTone, letterSpacing: "-0.005em" }}>
															Vinculando…
														</Typography>
													</>
												) : (
													<>
														<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: cardTone, letterSpacing: "-0.005em" }}>
															Vincular este
														</Typography>
														<ArrowRight2 size={12} color={cardTone} />
													</>
												)}
											</Stack>
										</Stack>
									</Box>
								);
							})}
						</Stack>

						{/* Aviso de expedientes privados */}
						{causas.some((c) => c.isPrivate) && (
							<Box
								sx={{
									display: "flex",
									alignItems: "flex-start",
									gap: 0.875,
									p: 1.25,
									borderRadius: 1.25,
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.28 : 0.2)}`,
									bgcolor: alpha(STALE_AMBER, isDark ? 0.08 : 0.04),
								}}
							>
								<InfoCircle size={14} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
								<Typography sx={{ fontSize: "0.74rem", color: "text.primary", lineHeight: 1.5, letterSpacing: "-0.005em" }}>
									Los expedientes marcados como <strong>privados</strong> tienen acceso restringido en el portal. Es posible que no podamos
									sincronizar todos sus movimientos.
								</Typography>
							</Box>
						)}
					</Stack>
				)}
			</DialogContent>

			{/* ====== FOOTER ====== */}
			<Box
				sx={{
					px: { xs: 2.25, sm: 3 },
					py: 1.5,
					borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
					bgcolor: "background.paper",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Button
					onClick={() => handleShowCloseWarning("cancel")}
					disabled={selecting || loading}
					size="small"
					startIcon={<CloseCircle size={14} />}
					sx={{
						textTransform: "none",
						fontWeight: 500,
						fontSize: "0.74rem",
						color: theme.palette.error.main,
						letterSpacing: "-0.005em",
						px: 1,
						py: 0.5,
						minHeight: 0,
						"&:hover": { bgcolor: alpha(theme.palette.error.main, isDark ? 0.1 : 0.05) },
					}}
				>
					Cancelar vinculación
				</Button>
				<Button
					onClick={() => handleShowCloseWarning("close")}
					disabled={selecting}
					size="small"
					sx={{
						textTransform: "none",
						fontWeight: 600,
						fontSize: "0.78rem",
						color: "text.secondary",
						letterSpacing: "-0.005em",
						borderRadius: 1,
						px: 1.5,
						py: 0.625,
						"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.05) },
					}}
				>
					Cerrar
				</Button>
			</Box>

			{/* ====== CONFIRMATION SUB-DIALOG ====== */}
			<Dialog
				open={showCloseWarning}
				onClose={() => setShowCloseWarning(false)}
				maxWidth="sm"
				fullWidth
				sx={{
					"& .MuiDialog-paper": {
						borderRadius: 2,
						border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
						overflow: "hidden",
					},
				}}
			>
				<Box
					sx={{
						px: { xs: 2.25, sm: 3 },
						py: { xs: 1.75, sm: 2 },
						bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
						borderBottom: `1px solid ${alpha(STALE_AMBER, isDark ? 0.28 : 0.18)}`,
					}}
				>
					<Stack direction="row" alignItems="flex-start" spacing={1.5}>
						<Box
							sx={{
								flexShrink: 0,
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(STALE_AMBER, isDark ? 0.2 : 0.12),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								color: STALE_AMBER,
							}}
						>
							<Warning2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: STALE_AMBER,
								}}
							>
								Confirmación
							</Typography>
							<Typography
								sx={{
									fontSize: "1.05rem",
									fontWeight: 600,
									letterSpacing: "-0.018em",
									color: "text.primary",
									lineHeight: 1.25,
								}}
							>
								{closeAction === "cancel" ? "¿Cancelar la vinculación?" : "¿Cerrar sin seleccionar?"}
							</Typography>
						</Stack>
					</Stack>
				</Box>

				<DialogContent sx={{ p: { xs: 2.25, sm: 2.75 }, bgcolor: "background.default" }}>
					<Stack spacing={1.5}>
						<Typography sx={{ fontSize: "0.86rem", color: "text.primary", lineHeight: 1.5, letterSpacing: "-0.005em", textWrap: "pretty" }}>
							{closeAction === "cancel"
								? "El expediente va a quedar sin asociar a ninguna causa del portal. Vas a poder volver a iniciar la vinculación más adelante."
								: "Todavía no elegiste un expediente. Si cerrás, vas a tener que volver a abrir este diálogo para terminar de vincular."}
						</Typography>

						{closeAction === "cancel" && (
							<Stack spacing={0.875}>
								<Typography
									sx={{
										fontSize: "0.66rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Qué pasa si cancelás
								</Typography>
								<Box
									sx={{
										border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
										borderRadius: 1.25,
										overflow: "hidden",
									}}
								>
									{[
										"No se van a sincronizar los movimientos del Poder Judicial",
										"El expediente no va a recibir actualizaciones automáticas",
										"Se pierde la referencia a las coincidencias encontradas",
										"La carpeta queda como manual, sin vinculación al portal",
									].map((line, idx, arr) => (
										<Box
											key={line}
											sx={{
												display: "flex",
												alignItems: "flex-start",
												gap: 0.875,
												px: 1.25,
												py: 0.75,
												borderBottom: idx === arr.length - 1 ? "none" : `1px solid ${alpha(theme.palette.divider, 0.7)}`,
												bgcolor: idx % 2 === 0 ? alpha(STALE_AMBER, isDark ? 0.025 : 0.015) : "transparent",
											}}
										>
											<Box
												sx={{
													width: 4,
													height: 4,
													borderRadius: "50%",
													bgcolor: STALE_AMBER,
													mt: 0.875,
													flexShrink: 0,
												}}
											/>
											<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5, letterSpacing: "-0.005em" }}>
												{line}
											</Typography>
										</Box>
									))}
								</Box>
							</Stack>
						)}
					</Stack>
				</DialogContent>

				<Box
					sx={{
						px: { xs: 2.25, sm: 3 },
						py: 1.5,
						borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
						bgcolor: "background.paper",
						display: "flex",
						justifyContent: "flex-end",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					<Button
						onClick={() => setShowCloseWarning(false)}
						size="small"
						sx={{
							textTransform: "none",
							fontWeight: 600,
							fontSize: "0.78rem",
							color: "text.secondary",
							letterSpacing: "-0.005em",
							borderRadius: 1,
							px: 1.5,
							py: 0.625,
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.05) },
						}}
					>
						Volver a elegir
					</Button>
					<Button
						onClick={closeAction === "cancel" ? handleConfirmCancelSelection : handleConfirmClose}
						disabled={selecting}
						size="small"
						variant="contained"
						sx={{
							textTransform: "none",
							fontWeight: 600,
							fontSize: "0.78rem",
							letterSpacing: "-0.005em",
							borderRadius: 1,
							boxShadow: "none",
							px: 1.75,
							py: 0.625,
							bgcolor: closeAction === "cancel" ? theme.palette.error.main : STALE_AMBER,
							color: "#fff",
							"&:hover": {
								bgcolor: alpha(closeAction === "cancel" ? theme.palette.error.main : STALE_AMBER, 0.88),
								boxShadow: "none",
							},
						}}
					>
						{closeAction === "cancel" ? "Sí, cancelar vinculación" : "Cerrar sin seleccionar"}
					</Button>
				</Box>
			</Dialog>
		</Dialog>
	);
};

export default CausaSelector;
