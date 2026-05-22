import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	Typography,
	Alert,
	Box,
	Card,
	CardContent,
	CardActionArea,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Tooltip,
	alpha,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { CloseCircle, TickCircle, Lock1, Calendar, DocumentText, InfoCircle, Warning2 } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { getPendingCausas, selectPendingCausa, clearPendingCausas } from "store/reducers/folder";
import { PendingCausa } from "types/folder";

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
				},
			}}
		>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Stack direction="row" spacing={1.5} alignItems="center">
						<DocumentText size={24} color={theme.palette.primary.main} />
						<Typography variant="h5">Seleccionar Expediente</Typography>
					</Stack>
					<IconButton
						onClick={() => !selecting && handleShowCloseWarning("close")}
						disabled={selecting}
						size="small"
						sx={{ color: theme.palette.grey[500] }}
					>
						<CloseCircle size={20} />
					</IconButton>
				</Stack>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ p: 3 }}>
				{loading ? (
					<Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
						<CircularProgress />
					</Box>
				) : error && causas.length === 0 ? (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				) : (
					<Stack spacing={3}>
						{/* Header informativo */}
						<Alert
							severity="info"
							icon={<InfoCircle size={20} />}
							sx={{
								"& .MuiAlert-message": {
									width: "100%",
								},
							}}
						>
							<Stack spacing={0.5}>
								<Typography variant="body2" fontWeight={500}>
									Se encontraron {causas.length} expedientes para "{searchTerm}"
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Seleccione el expediente correcto para vincular con la carpeta "{folderName}"
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Fuente: {getPlatformName()}
								</Typography>
							</Stack>
						</Alert>

						{/* Lista de causas */}
						<Stack spacing={2}>
							{causas.map((causa) => (
								<Card
									key={causa._id}
									variant="outlined"
									sx={{
										borderColor: causa.isPrivate ? alpha(theme.palette.warning.main, 0.5) : theme.palette.divider,
										backgroundColor: causa.isPrivate ? alpha(theme.palette.warning.light, 0.05) : "transparent",
										transition: "all 0.2s ease",
										"&:hover": {
											borderColor: theme.palette.primary.main,
											boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
										},
									}}
								>
									<CardActionArea onClick={() => handleSelectCausa(causa._id)} disabled={selecting}>
										<CardContent sx={{ p: 2.5 }}>
											<Stack spacing={1.5}>
												{/* Header con CUIJ y badges */}
												<Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
													<Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{ fontFamily: "monospace" }}>
														{causa.cuij || `EXP ${causa.numero}/${causa.anio}`}
													</Typography>
													<Stack direction="row" spacing={1}>
														{causa.isPrivate && (
															<Tooltip title="Este expediente tiene acceso restringido">
																<Chip icon={<Lock1 size={14} />} label="Privado" size="small" color="warning" variant="outlined" />
															</Tooltip>
														)}
														{causa.estado && (
															<Chip
																label={causa.estado}
																size="small"
																variant="outlined"
																color={causa.estado === "ARCHIVADO" ? "default" : causa.estado === "EN TRAMITE" ? "success" : "primary"}
															/>
														)}
													</Stack>
												</Stack>

												{/* Carátula */}
												{causa.caratula && (
													<Typography variant="body1" fontWeight={500}>
														{causa.caratula}
													</Typography>
												)}

												{/* Info adicional */}
												<Stack direction="row" spacing={2} flexWrap="wrap">
													<Typography variant="body2" color="text.secondary">
														Expediente: {causa.numero}/{causa.anio}
													</Typography>
													{causa.fechaInicio && (
														<Stack direction="row" spacing={0.5} alignItems="center">
															<Calendar size={14} color={theme.palette.text.secondary} />
															<Typography variant="body2" color="text.secondary">
																Inicio: {formatDate(causa.fechaInicio)}
															</Typography>
														</Stack>
													)}
												</Stack>

												{/* Botón de selección (visible al hacer hover o en mobile) */}
												<Box
													sx={{
														display: "flex",
														justifyContent: "flex-end",
														mt: 1,
													}}
												>
													{selecting && selectedCausaId === causa._id ? (
														<CircularProgress size={24} />
													) : (
														<Chip
															icon={<TickCircle size={16} />}
															label="Seleccionar este expediente"
															color="primary"
															variant="outlined"
															sx={{
																cursor: "pointer",
																"&:hover": {
																	backgroundColor: alpha(theme.palette.primary.main, 0.1),
																},
															}}
														/>
													)}
												</Box>
											</Stack>
										</CardContent>
									</CardActionArea>
								</Card>
							))}
						</Stack>

						{/* Mensaje de advertencia para expedientes privados */}
						{causas.some((c) => c.isPrivate) && (
							<Alert severity="warning" variant="outlined">
								<Typography variant="body2">
									Los expedientes marcados como "Privado" pueden tener restricciones de acceso. Es posible que no se puedan obtener todos
									los datos del expediente.
								</Typography>
							</Alert>
						)}
					</Stack>
				)}
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5 }}>
				<Button
					variant="outlined"
					color="error"
					onClick={() => handleShowCloseWarning("cancel")}
					disabled={selecting || loading}
					startIcon={<CloseCircle size={18} />}
				>
					Cancelar vinculación
				</Button>
				<Button variant="outlined" onClick={() => handleShowCloseWarning("close")} disabled={selecting}>
					Cerrar
				</Button>
			</DialogActions>

			{/* Diálogo de confirmación para cerrar/cancelar */}
			<Dialog open={showCloseWarning} onClose={() => setShowCloseWarning(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ pb: 1 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Warning2 size={24} color={theme.palette.warning.main} />
						<Typography variant="h5">{closeAction === "cancel" ? "¿Cancelar vinculación?" : "¿Cerrar sin seleccionar?"}</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Alert severity="warning" sx={{ mb: 2 }}>
						<Typography variant="body2" fontWeight={500} gutterBottom>
							{closeAction === "cancel"
								? "Al cancelar la vinculación, el expediente quedará sin asociar a ninguna causa."
								: "Aún no seleccionaste un expediente. Si cerrás ahora, deberás volver a abrir este diálogo para completar la selección."}
						</Typography>
					</Alert>

					{closeAction === "cancel" && (
						<Stack spacing={1.5}>
							<Typography variant="subtitle2" color="text.secondary">
								Consecuencias de cancelar:
							</Typography>
							<Box component="ul" sx={{ m: 0, pl: 2.5 }}>
								<Typography component="li" variant="body2" color="text.secondary">
									El expediente no recibirá actualizaciones automáticas
								</Typography>
								<Typography component="li" variant="body2" color="text.secondary">
									No se sincronizarán los movimientos del Poder Judicial
								</Typography>
								<Typography component="li" variant="body2" color="text.secondary">
									Perderás la referencia a las opciones encontradas
								</Typography>
								<Typography component="li" variant="body2" color="text.secondary">
									El expediente quedará como "manual" sin vinculación
								</Typography>
							</Box>
						</Stack>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2.5 }}>
					<Button variant="outlined" onClick={() => setShowCloseWarning(false)}>
						Volver a seleccionar
					</Button>
					{closeAction === "cancel" ? (
						<Button variant="contained" color="error" onClick={handleConfirmCancelSelection} disabled={selecting}>
							Sí, cancelar vinculación
						</Button>
					) : (
						<Button variant="contained" color="warning" onClick={handleConfirmClose}>
							Cerrar sin seleccionar
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</Dialog>
	);
};

export default CausaSelector;
