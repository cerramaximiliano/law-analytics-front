// material-ui
import { Grid, Chip, Divider, Stack, TableCell, TableRow, Typography, Box, Paper, Button, Tooltip, alpha, useTheme } from "@mui/material";

// project-imports
import Transitions from "components/@extended/Transitions";
import LinkToJudicialPower from "./LinkToJudicialPower";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import useSubscription from "hooks/useSubscription";

// assets
import { Calendar, FolderOpen, Profile, Clock, NoteText, ExportSquare, TickCircle, CloseCircle, InfoCircle } from "iconsax-react";
import { memo, useState } from "react";
import moment from "moment";

// ==============================|| FOLDER - VIEW ||============================== //

const FolderView = memo(({ data }: any) => {
	const theme = useTheme();
	const notAvailableMsg = "No disponible";
	const [openLinkJudicial, setOpenLinkJudicial] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);

	// Usar el hook de suscripción para verificar características
	const { canVinculateFolders } = useSubscription();

	// Función para obtener el color del estado
	const getStatusColor = (status: string) => {
		switch (status) {
			case "Finalizado":
				return "success";
			case "Activo":
				return "primary";
			case "En trámite":
				return "warning";
			case "Archivado":
				return "default";
			default:
				return "default";
		}
	};

	// Info cards - Horizontal layout similar to TaskView
	const InfoCard = ({ icon, label, value, color = "textSecondary" }: any) => (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
			<Box sx={{ color: "primary.main" }}>{icon}</Box>
			<Box>
				<Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
					{label}
				</Typography>
				<Typography variant="body2" color={color} sx={{ fontWeight: 500 }}>
					{value || notAvailableMsg}
				</Typography>
			</Box>
		</Box>
	);

	const handleOpenLinkJudicial = () => {
		// Verificar si el usuario tiene acceso a la característica de vincular carpetas
		const { canAccess, featureInfo } = canVinculateFolders();

		if (canAccess) {
			// Si tiene acceso, mostrar el modal de vinculación
			setOpenLinkJudicial(true);
		} else {
			// Si no tiene acceso, mostrar el modal de error de límite
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	};

	const handleCancelLinkJudicial = () => {
		setOpenLinkJudicial(false);
	};

	const handleCloseLimitErrorModal = () => {
		setLimitErrorOpen(false);
	};

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` } }}>
			<TableCell colSpan={8} sx={{ p: 2.5 }}>
				<Transitions type="slide" direction="down" in={true}>
					<Box>
						{/* Header with title and status */}
						<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="h5">{data.folderName || notAvailableMsg}</Typography>
								<Chip size="small" label={data.status || "Sin estado"} color={getStatusColor(data.status)} />
							</Stack>
							{data.pjn ? (
								<Box sx={{ position: "relative", display: "inline-flex" }}>
									<Box
										sx={{
											px: 2,
											py: 0.75,
											height: 36,
											display: "flex",
											alignItems: "center",
											gap: 0.75,
											bgcolor: alpha(theme.palette.success.main, 0.1),
											border: `1px solid ${theme.palette.success.main}`,
											borderRadius: 0.5,
										}}
									>
										<ExportSquare size={16} variant="Bold" color={theme.palette.success.main} />
										<Typography
											variant="body2"
											sx={{
												fontWeight: 500,
												color: theme.palette.success.dark,
												fontSize: "0.8125rem",
											}}
										>
											Vinculado con PJN
										</Typography>
									</Box>
									{/* Ícono de estado de verificación */}
									{(data.causaVerified === false || (data.causaVerified === true && data.causaIsValid !== undefined)) && (
										<Tooltip
											title={
												data.causaVerified === false ? "Pendiente de verificación" : data.causaIsValid ? "Causa válida" : "Causa inválida"
											}
										>
											<Box
												sx={{
													position: "absolute",
													bottom: -8,
													right: -8,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													width: 20,
													height: 20,
													bgcolor: theme.palette.background.paper,
													borderRadius: "50%",
													boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
												}}
											>
												{data.causaVerified === false ? (
													<InfoCircle size={18} variant="Bold" color={theme.palette.warning.main} />
												) : data.causaIsValid ? (
													<TickCircle size={18} variant="Bold" color={theme.palette.success.main} />
												) : (
													<CloseCircle size={18} variant="Bold" color={theme.palette.error.main} />
												)}
											</Box>
										</Tooltip>
									)}
								</Box>
							) : (
								<Button
									variant="outlined"
									color="primary"
									startIcon={<ExportSquare size="20" />}
									onClick={handleOpenLinkJudicial}
									sx={{
										borderRadius: 1,
										textTransform: "none",
										fontWeight: 500,
									}}
								>
									Vincular con Poder Judicial
								</Button>
							)}
						</Stack>

						{/* Info cards - Horizontal layout */}
						<Grid container spacing={3} sx={{ mb: 3 }}>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard
									icon={<Calendar size="20" />}
									label="Fecha de Inicio"
									value={data.initialDateFolder ? moment(data.initialDateFolder).format("DD/MM/YYYY") : null}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard
									icon={<Clock size="20" />}
									label="Fecha Final"
									value={data.finalDateFolder ? moment(data.finalDateFolder).format("DD/MM/YYYY") : null}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Profile size="20" />} label="Cliente" value={data.customerName} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<FolderOpen size="20" />} label="Fuero" value={data.folderFuero} />
							</Grid>
						</Grid>

						<Divider sx={{ my: 2 }} />

						{/* Main content - 2 columns */}
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
									<Stack spacing={2}>
										<Typography variant="subtitle1" color="primary" fontWeight={600}>
											Información de la Causa
										</Typography>

										<Stack spacing={1.5}>
											<Stack direction="row" spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
													Jurisdicción:
												</Typography>
												<Typography variant="body2">{data.folderJuris?.label || notAvailableMsg}</Typography>
											</Stack>

											<Stack direction="row" spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
													Materia:
												</Typography>
												<Typography variant="body2">{data.folderFuero || notAvailableMsg}</Typography>
											</Stack>

											<Stack direction="row" spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
													Carátula:
												</Typography>
												<Typography variant="body2">{data.folderName || notAvailableMsg}</Typography>
											</Stack>

											{data.judFolder?.courtNumber && (
												<Stack direction="row" spacing={1}>
													<Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
														N° de Juzgado:
													</Typography>
													<Typography variant="body2">{data.judFolder.courtNumber}</Typography>
												</Stack>
											)}

											{data.judFolder?.secretaryNumber && (
												<Stack direction="row" spacing={1}>
													<Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
														N° de Secretaría:
													</Typography>
													<Typography variant="body2">{data.judFolder.secretaryNumber}</Typography>
												</Stack>
											)}
										</Stack>
									</Stack>
								</Paper>
							</Grid>

							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
									<Stack spacing={2}>
										<Typography variant="subtitle1" color="primary" fontWeight={600}>
											Observaciones
										</Typography>

										<Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
											<NoteText size="18" style={{ marginTop: 3, flexShrink: 0 }} />
											<Typography variant="body2" color="textSecondary">
												{data.description || "Sin observaciones"}
											</Typography>
										</Box>
									</Stack>
								</Paper>
							</Grid>
						</Grid>
					</Box>
				</Transitions>

				{/* Modal para vincular con Poder Judicial */}
				<LinkToJudicialPower
					openLink={openLinkJudicial}
					onCancelLink={handleCancelLinkJudicial}
					folderId={data._id}
					folderName={data.folderName}
				/>

				{/* Modal de error cuando no se tiene acceso a la característica */}
				<LimitErrorModal
					open={limitErrorOpen}
					onClose={handleCloseLimitErrorModal}
					message="Esta característica no está disponible en tu plan actual."
					featureInfo={limitErrorInfo}
					upgradeRequired={true}
				/>
			</TableCell>
		</TableRow>
	);
});

export default FolderView;
