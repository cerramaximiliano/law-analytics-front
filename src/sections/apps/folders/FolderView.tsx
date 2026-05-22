import React from "react";
// material-ui
import { Grid, Stack, TableCell, TableRow, Typography, Box, Tooltip, alpha, useTheme } from "@mui/material";

// project-imports
import LinkToJudicialPower from "./LinkToJudicialPower";
import LinkToPJBuenosAires from "./LinkToPJBuenosAires";
import LinkToPJCaba from "./LinkToPJCaba";
import CausaSelector from "./CausaSelector";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import useSubscription from "hooks/useSubscription";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import { useScbaCredentialError } from "hooks/useScbaCredentialError";

// assets
import { Calendar, FolderOpen, Profile, Clock, NoteText, ExportSquare, TickCircle, CloseCircle, InfoCircle, Warning2 } from "iconsax-react";
import { memo, useState } from "react";
import dayjs from "utils/dayjs-config";

// Whitelist de jurisdicciones que tienen worker de sincronización.
// "Nacional" → PJN, "Buenos Aires" → SCBA/MEV, "CABA" → EJE.
// Debe quedar alineada con la del detalle del folder (pages/apps/folders/details/details.tsx).
const SYNCABLE_JURISDICCION_LABELS = ["Nacional", "Buenos Aires", "CABA"];

// ==============================|| FOLDER - VIEW ||============================== //

const FolderView = memo(({ data }: any) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const notAvailableMsg = "No disponible";
	const [openLinkJudicial, setOpenLinkJudicial] = useState(false);
	const [openLinkPJBA, setOpenLinkPJBA] = useState(false);
	const [openLinkPJCaba, setOpenLinkPJCaba] = useState(false);
	const [openCausaSelector, setOpenCausaSelector] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);

	const hasPendingSelection = data.causaAssociationStatus === "pending_selection";

	const isPjnFromMisCausas = data.pjn === true && data.source === "pjn-login";
	const isScbaFromMisCausas = data.scba === true && data.source === "scba-login";
	const isListRemovedPjn =
		isPjnFromMisCausas && ((data.listRemoved === true && data.listRemovedSource === "pjn") || data.pjnNotFound === true);
	const isListRemovedScba = isScbaFromMisCausas && data.listRemoved === true && data.listRemovedSource === "scba";
	const listRemovedCopyPjn =
		"Esta causa no fue encontrada en tu lista de Mis Causas del portal PJN. Puede haber sido archivada o desvinculada por el tribunal.";

	const isPjnPrivateRestricted = data.pjn === true && data.causaIsPrivate === true && data.source !== "pjn-login";
	const privateRestrictedCopyPjn =
		"Causa reservada — el tribunal restringió la consulta web pública. El sistema sigue verificando si vuelve a estar accesible.";

	const { canVinculateFolders } = useSubscription();
	const scbaCredError = useScbaCredentialError();

	// Map status → brand-aligned accent
	const getStatusAccent = (status: string) => {
		switch (status) {
			case "Finalizado":
				return LIVE_GREEN;
			case "Activo":
				return BRAND_BLUE;
			case "En trámite":
				return STALE_AMBER;
			case "Archivado":
				return theme.palette.text.disabled as string;
			default:
				return theme.palette.text.secondary as string;
		}
	};

	const StatusPill = ({ label, accent }: { label: string; accent: string }) => (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
				border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
			}}
		>
			<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: accent }} />
			<Typography
				sx={{
					fontSize: "0.66rem",
					fontWeight: 600,
					color: accent,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					lineHeight: 1,
				}}
			>
				{label}
			</Typography>
		</Box>
	);

	const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) => (
		<Stack direction="row" alignItems="center" spacing={1.25}>
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125} sx={{ minWidth: 0 }}>
				<Typography
					sx={{
						fontSize: "0.58rem",
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "text.secondary",
					}}
				>
					{label}
				</Typography>
				<Typography
					sx={{
						fontSize: "0.82rem",
						fontWeight: 500,
						color: "text.primary",
						letterSpacing: "-0.005em",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{value || notAvailableMsg}
				</Typography>
			</Stack>
		</Stack>
	);

	const SectionCard = ({
		eyebrow,
		title,
		icon,
		children,
	}: {
		eyebrow: string;
		title: string;
		icon: React.ReactNode;
		children: React.ReactNode;
	}) => (
		<Box
			sx={{
				height: "100%",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				bgcolor: theme.palette.background.paper,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					px: 1.75,
					py: 1.25,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
				}}
			>
				<Stack direction="row" spacing={1} alignItems="center">
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
						{icon}
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
								{eyebrow}
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>{title}</Typography>
					</Stack>
				</Stack>
			</Box>
			<Box sx={{ p: 1.75 }}>{children}</Box>
		</Box>
	);

	const KeyValueRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
		<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.5 }} alignItems={{ xs: "flex-start", sm: "baseline" }}>
			<Typography
				sx={{
					fontSize: "0.66rem",
					fontWeight: 600,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					color: "text.secondary",
					minWidth: { sm: 130 },
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontSize: "0.82rem",
					fontWeight: 500,
					color: "text.primary",
					letterSpacing: "-0.005em",
					textWrap: "pretty" as any,
				}}
			>
				{value || notAvailableMsg}
			</Typography>
		</Stack>
	);

	const handleOpenLinkJudicial = () => {
		const { canAccess, featureInfo } = canVinculateFolders();
		if (canAccess) {
			setOpenLinkJudicial(true);
		} else {
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	};

	const handleCancelLinkJudicial = () => setOpenLinkJudicial(false);

	const handleOpenLinkPJBA = () => {
		const { canAccess, featureInfo } = canVinculateFolders();
		if (canAccess) {
			setOpenLinkPJBA(true);
		} else {
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	};

	const handleCancelLinkPJBA = () => setOpenLinkPJBA(false);

	const handleOpenLinkPJCaba = () => {
		const { canAccess, featureInfo } = canVinculateFolders();
		if (canAccess) {
			setOpenLinkPJCaba(true);
		} else {
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	};

	const handleCancelLinkPJCaba = () => setOpenLinkPJCaba(false);
	const handleCloseLimitErrorModal = () => setLimitErrorOpen(false);

	// Binding pill — composable across PJN / EJE / MEV / "Vincular"
	const BindingPill = ({
		label,
		accent,
		icon,
		onClick,
		verifyIcon,
		verifyTooltip,
	}: {
		label: string;
		accent: string;
		icon?: React.ReactNode;
		onClick?: () => void;
		verifyIcon?: React.ReactNode;
		verifyTooltip?: string;
	}) => (
		<Box sx={{ position: "relative", display: "inline-flex" }}>
			<Box
				onClick={onClick}
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.75,
					px: 1.25,
					py: 0.625,
					borderRadius: 1,
					cursor: onClick ? "pointer" : "default",
					bgcolor: alpha(accent, isDark ? 0.14 : 0.08),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
					transition: "all 180ms ease",
					...(onClick && {
						"&:hover": {
							bgcolor: alpha(accent, isDark ? 0.22 : 0.14),
							borderColor: alpha(accent, isDark ? 0.48 : 0.36),
						},
					}),
				}}
			>
				{icon ?? <ExportSquare size={14} variant="Bulk" color={accent} />}
				<Typography
					sx={{
						fontSize: "0.7rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "-0.005em",
						lineHeight: 1.4,
					}}
				>
					{label}
				</Typography>
			</Box>
			{verifyIcon && verifyTooltip && (
				<Tooltip title={verifyTooltip}>
					<Box
						sx={{
							position: "absolute",
							bottom: -6,
							right: -6,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 18,
							height: 18,
							bgcolor: theme.palette.background.paper,
							borderRadius: "50%",
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
							boxShadow: `0 2px 4px ${alpha("#000", 0.08)}`,
						}}
					>
						{verifyIcon}
					</Box>
				</Tooltip>
			)}
		</Box>
	);

	const renderBinding = () => {
		if (data.pjn) {
			const accent = isPjnPrivateRestricted ? theme.palette.error.main : isListRemovedPjn ? STALE_AMBER : LIVE_GREEN;
			const label = isPjnPrivateRestricted ? "PJN — Causa reservada" : isListRemovedPjn ? "PJN — Ya no en la lista" : "Vinculado con PJN";

			const showVerify =
				isPjnPrivateRestricted ||
				isListRemovedPjn ||
				data.causaVerified === false ||
				(data.causaVerified === true && data.causaIsValid !== undefined);

			let verifyIcon: React.ReactNode = null;
			let verifyTooltip = "";
			if (isPjnPrivateRestricted) {
				verifyIcon = <Warning2 size={14} variant="Bold" color={theme.palette.error.main} />;
				verifyTooltip = privateRestrictedCopyPjn;
			} else if (isListRemovedPjn) {
				verifyIcon = <Warning2 size={14} variant="Bold" color={STALE_AMBER} />;
				verifyTooltip = listRemovedCopyPjn;
			} else if (data.causaVerified === false) {
				verifyIcon = <InfoCircle size={14} variant="Bold" color={STALE_AMBER} />;
				verifyTooltip = "Pendiente de verificación";
			} else if (data.causaIsValid) {
				verifyIcon = <TickCircle size={14} variant="Bold" color={LIVE_GREEN} />;
				verifyTooltip = "Causa válida";
			} else {
				verifyIcon = <CloseCircle size={14} variant="Bold" color={theme.palette.error.main} />;
				verifyTooltip = "Causa inválida";
			}

			return (
				<BindingPill
					label={label}
					accent={accent}
					verifyIcon={showVerify ? verifyIcon : undefined}
					verifyTooltip={showVerify ? verifyTooltip : undefined}
				/>
			);
		}

		if (data.eje && data.causaAssociationStatus === "success") {
			const showVerify = data.causaVerified === false || (data.causaVerified === true && data.causaIsValid !== undefined);
			const verifyIcon =
				data.causaVerified === false ? (
					<InfoCircle size={14} variant="Bold" color={STALE_AMBER} />
				) : data.causaIsValid ? (
					<TickCircle size={14} variant="Bold" color={LIVE_GREEN} />
				) : (
					<CloseCircle size={14} variant="Bold" color={theme.palette.error.main} />
				);
			const verifyTooltip =
				data.causaVerified === false ? "Pendiente de verificación" : data.causaIsValid ? "Causa válida" : "Causa inválida";
			return (
				<BindingPill
					label="Vinculado con EJE"
					accent={LIVE_GREEN}
					verifyIcon={showVerify ? verifyIcon : undefined}
					verifyTooltip={showVerify ? verifyTooltip : undefined}
				/>
			);
		}

		if (hasPendingSelection) {
			return (
				<BindingPill
					label="Seleccionar expediente"
					accent={STALE_AMBER}
					icon={<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />}
					onClick={() => setOpenCausaSelector(true)}
				/>
			);
		}

		if (data.mev) {
			const showVerify = data.causaVerified === false || (data.causaVerified === true && data.causaIsValid !== undefined);
			const verifyIcon =
				data.causaVerified === false ? (
					<InfoCircle size={14} variant="Bold" color={STALE_AMBER} />
				) : data.causaIsValid ? (
					<TickCircle size={14} variant="Bold" color={LIVE_GREEN} />
				) : (
					<CloseCircle size={14} variant="Bold" color={theme.palette.error.main} />
				);
			const verifyTooltip =
				data.causaVerified === false ? "Pendiente de verificación" : data.causaIsValid ? "Causa válida" : "Causa inválida";
			return (
				<BindingPill
					label="Vinculado con MEV"
					accent={LIVE_GREEN}
					verifyIcon={showVerify ? verifyIcon : undefined}
					verifyTooltip={showVerify ? verifyTooltip : undefined}
				/>
			);
		}

		if (data.scba) {
			// Prioridad: removida del listado > credenciales en error > OK.
			// "Cred en error" es por user (afecta a todos sus folders SCBA), no por folder.
			if (isListRemovedScba) {
				return (
					<BindingPill
						label="SCBA — Ya no en la lista"
						accent={STALE_AMBER}
						icon={<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />}
					/>
				);
			}
			if (scbaCredError.hasError) {
				return (
					<BindingPill
						label="SCBA — Sincronización pausada"
						accent={STALE_AMBER}
						icon={<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />}
					/>
				);
			}
			const showVerify = data.causaVerified === false || (data.causaVerified === true && data.causaIsValid !== undefined);
			const verifyIcon =
				data.causaVerified === false ? (
					<InfoCircle size={14} variant="Bold" color={STALE_AMBER} />
				) : data.causaIsValid ? (
					<TickCircle size={14} variant="Bold" color={LIVE_GREEN} />
				) : (
					<CloseCircle size={14} variant="Bold" color={theme.palette.error.main} />
				);
			const verifyTooltip =
				data.causaVerified === false ? "Pendiente de verificación" : data.causaIsValid ? "Causa válida" : "Causa inválida";
			return (
				<BindingPill
					label="Vinculado con SCBA"
					accent={LIVE_GREEN}
					verifyIcon={showVerify ? verifyIcon : undefined}
					verifyTooltip={showVerify ? verifyTooltip : undefined}
				/>
			);
		}

		if (data.previousSyncSource) {
			// Folder desvinculado via modo "keep" (PJN/SCBA). Bloqueamos la re-vinculación
			// individual: matching por fuero+numero+año puede asociar a una causa distinta,
			// y workers PJN-login/SCBA-login requieren credenciales gestionadas desde Perfil.
			const sourceLabel = data.previousSyncSource.toUpperCase();
			return (
				<BindingPill
					label={`Sincronización pausada (era ${sourceLabel})`}
					accent={STALE_AMBER}
					icon={<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />}
				/>
			);
		}

		if (data.folderJuris?.label && !SYNCABLE_JURISDICCION_LABELS.includes(data.folderJuris.label)) {
			// Folder manual con jurisdicción fuera de las cubiertas por scrapers.
			return (
				<BindingPill
					label="Jurisdicción no cubierta"
					accent={STALE_AMBER}
					icon={<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />}
				/>
			);
		}

		return (
			<BindingPill
				label="Vincular con Poder Judicial"
				accent={BRAND_BLUE}
				icon={<ExportSquare size={14} variant="Linear" color={BRAND_BLUE} />}
				onClick={handleOpenLinkJudicial}
			/>
		);
	};

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` } }}>
			<TableCell colSpan={8} sx={{ p: 0, borderBottom: "none" }}>
				<Box
					sx={{
						m: 1.5,
						p: 2,
						borderRadius: 2,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					}}
				>
					{/* Pending selection — sober brand-amber callout */}
					{hasPendingSelection && (
						<Box
							onClick={() => setOpenCausaSelector(true)}
							sx={{
								p: 1.5,
								mb: 2,
								cursor: "pointer",
								borderRadius: 1.25,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.06),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.36 : 0.24)}`,
								transition: "all 180ms ease",
								"&:hover": {
									bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
									borderColor: alpha(STALE_AMBER, isDark ? 0.5 : 0.36),
								},
							}}
						>
							<Stack direction="row" spacing={1.25} alignItems="center">
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(STALE_AMBER, isDark ? 0.18 : 0.12),
										border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
										color: STALE_AMBER,
										flexShrink: 0,
									}}
								>
									<Warning2 size={18} variant="Bulk" />
								</Box>
								<Stack spacing={0.125} flex={1} sx={{ minWidth: 0 }}>
									<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
										Acción requerida: seleccionar expediente
									</Typography>
									<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
										Encontramos varios expedientes para esta carpeta. Tocá para seleccionar el correcto.
									</Typography>
								</Stack>
								<StatusPill label="Seleccionar" accent={STALE_AMBER} />
							</Stack>
						</Box>
					)}

					{/* Header — folder name + status + binding */}
					<Stack
						direction={{ xs: "column", md: "row" }}
						spacing={{ xs: 1.5, md: 2 }}
						alignItems={{ xs: "flex-start", md: "center" }}
						justifyContent="space-between"
						sx={{ mb: 2 }}
					>
						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
							<Box
								sx={{
									width: 36,
									height: 36,
									borderRadius: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
									flexShrink: 0,
								}}
							>
								<FolderOpen size={20} variant="Bulk" />
							</Box>
							<Stack spacing={0.125} sx={{ minWidth: 0 }}>
								<Stack direction="row" spacing={0.625} alignItems="center">
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
										Detalle de la carpeta
									</Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
									<Typography
										sx={{
											fontSize: "1.05rem",
											fontWeight: 600,
											letterSpacing: "-0.015em",
											color: "text.primary",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											maxWidth: { xs: 240, md: 400 },
										}}
									>
										{data.folderName || notAvailableMsg}
									</Typography>
									{data.status && <StatusPill label={data.status} accent={getStatusAccent(data.status)} />}
								</Stack>
							</Stack>
						</Stack>
						{renderBinding()}
					</Stack>

					{/* Info row — Fecha inicio, Fecha final, Cliente, Fuero */}
					<Box
						sx={{
							p: 1.75,
							mb: 2,
							borderRadius: 1.5,
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						}}
					>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard
									icon={<Calendar size={16} variant="Bulk" />}
									label="Fecha de inicio"
									value={data.initialDateFolder ? dayjs(data.initialDateFolder).format("DD/MM/YYYY") : undefined}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard
									icon={<Clock size={16} variant="Bulk" />}
									label="Fecha final"
									value={data.finalDateFolder ? dayjs(data.finalDateFolder).format("DD/MM/YYYY") : undefined}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Profile size={16} variant="Bulk" />} label="Cliente" value={data.customerName} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<FolderOpen size={16} variant="Bulk" />} label="Fuero" value={data.folderFuero} />
							</Grid>
						</Grid>
					</Box>

					{/* Two-column content */}
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<SectionCard eyebrow="Expediente" title="Información de la causa" icon={<FolderOpen size={14} variant="Bulk" />}>
								<Stack spacing={1.25}>
									<KeyValueRow label="Jurisdicción" value={data.folderJuris?.label} />
									<KeyValueRow label="Materia" value={data.folderFuero} />
									<KeyValueRow label="Carátula" value={data.folderName} />
									{data.judFolder?.numberJudFolder && <KeyValueRow label="N° de expediente" value={data.judFolder.numberJudFolder} />}
									{data.judFolder?.courtNumber && <KeyValueRow label="N° de juzgado" value={data.judFolder.courtNumber} />}
									{data.judFolder?.secretaryNumber && <KeyValueRow label="N° de secretaría" value={data.judFolder.secretaryNumber} />}
								</Stack>
							</SectionCard>
						</Grid>

						<Grid item xs={12} md={6}>
							<SectionCard eyebrow="Notas" title="Observaciones" icon={<NoteText size={14} variant="Bulk" />}>
								{data.description ? (
									<Typography
										sx={{
											fontSize: "0.82rem",
											color: "text.primary",
											letterSpacing: "-0.005em",
											lineHeight: 1.6,
											textWrap: "pretty" as any,
										}}
									>
										{data.description}
									</Typography>
								) : (
									<Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
										<NoteText size={14} variant="Bulk" color={theme.palette.text.disabled} />
										<Typography
											sx={{
												fontSize: "0.78rem",
												color: "text.disabled",
												letterSpacing: "-0.005em",
												fontStyle: "italic",
											}}
										>
											Sin observaciones registradas
										</Typography>
									</Stack>
								)}
							</SectionCard>
						</Grid>
					</Grid>
				</Box>

				{/* Modals — preserved */}
				<LinkToJudicialPower
					openLink={openLinkJudicial}
					onCancelLink={handleCancelLinkJudicial}
					folderId={data._id}
					folderName={data.folderName}
					onSelectBuenosAires={handleOpenLinkPJBA}
					onSelectCaba={handleOpenLinkPJCaba}
					folderJurisLabel={data.folderJuris?.label}
				/>

				<LinkToPJBuenosAires
					open={openLinkPJBA}
					onCancel={handleCancelLinkPJBA}
					onBack={() => {
						setOpenLinkPJBA(false);
						setOpenLinkJudicial(true);
					}}
					folderId={data._id}
					folderName={data.folderName}
				/>

				<LinkToPJCaba
					open={openLinkPJCaba}
					onCancel={handleCancelLinkPJCaba}
					onBack={() => {
						setOpenLinkPJCaba(false);
						setOpenLinkJudicial(true);
					}}
					folderId={data._id}
					folderName={data.folderName}
				/>

				<LimitErrorModal
					open={limitErrorOpen}
					onClose={handleCloseLimitErrorModal}
					message="Esta característica no está disponible en tu plan actual."
					featureInfo={limitErrorInfo}
					upgradeRequired={true}
				/>

				<CausaSelector
					open={openCausaSelector}
					onClose={() => setOpenCausaSelector(false)}
					folderId={data._id}
					folderName={data.folderName}
					onCausaSelected={() => {
						setOpenCausaSelector(false);
					}}
					onSelectionCancelled={() => {
						setOpenCausaSelector(false);
					}}
				/>
			</TableCell>
		</TableRow>
	);
});

export default FolderView;
