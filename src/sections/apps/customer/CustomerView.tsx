// material-ui
import { Box, CircularProgress, Grid, Stack, TableCell, TableRow, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// third-party
import { PatternFormat } from "react-number-format";
import { useNavigate } from "react-router-dom";

// project-imports
import Transitions from "components/@extended/Transitions";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// assets
import { Buildings2, Calendar, Call, Folder2, Location, Note1, Profile, Sms } from "iconsax-react";
import { dispatch } from "store";
import React, { useEffect, useState } from "react";
import { getFoldersByIds } from "store/reducers/folder";

import { FolderData } from "types/folder";
import { Contact } from "types/contact";

interface ContactViewProps {
	data: Contact;
}

const CustomerView: React.FC<ContactViewProps> = ({ data }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const [folders, setFolders] = useState<FolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isArchived = data.status === "archived";
	const notAvailableMsg = "—";

	const formatRole = (role: string | string[] | undefined) => {
		if (!role) return notAvailableMsg;
		if (Array.isArray(role)) return role.join(", ");
		return role;
	};

	const isMountedRef = React.useRef(true);
	const loadingRef = React.useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		setLoading(true);
		loadingRef.current = true;
		setError(null);
		setFolders([]);

		if (data.folderIds && Array.isArray(data.folderIds) && data.folderIds.length > 0) {
			const timeoutId = setTimeout(() => {
				if (isMountedRef.current && loadingRef.current) {
					setError("Tiempo de espera agotado al cargar las causas");
					setLoading(false);
					loadingRef.current = false;
				}
			}, 10000);

			loadFolders().finally(() => clearTimeout(timeoutId));
		} else {
			setLoading(false);
			loadingRef.current = false;
		}

		return () => {
			isMountedRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data._id]);

	const loadFolders = async () => {
		try {
			if (!isMountedRef.current) return;
			if (!data.folderIds || !Array.isArray(data.folderIds) || data.folderIds.length === 0) {
				if (isMountedRef.current) {
					setFolders([]);
					setLoading(false);
				}
				return;
			}
			const response = await dispatch(getFoldersByIds(data.folderIds));
			if (isMountedRef.current) {
				if (response && response.success && response.folders) {
					setFolders(response.folders);
					setError(null);
				} else if (response && !response.success) {
					setFolders([]);
					setError(response.error || "No se pudieron cargar las causas");
				} else {
					setFolders([]);
					setError("Respuesta inesperada del servidor");
				}
			}
		} catch (err) {
			if (isMountedRef.current) {
				const errorMessage = err instanceof Error ? err.message : "Error al cargar causas";
				setError(errorMessage);
				setFolders([]);
			}
		} finally {
			if (isMountedRef.current) {
				setLoading(false);
				loadingRef.current = false;
			}
		}
	};

	const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
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
						fontSize: "0.6rem",
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
					<Stack spacing={0.125} sx={{ minWidth: 0 }}>
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
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
							{title}
						</Typography>
					</Stack>
				</Stack>
			</Box>
			<Box sx={{ p: 1.75 }}>{children}</Box>
		</Box>
	);

	const KeyValueRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
		<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.5 }} alignItems={{ sm: "baseline" }}>
			<Typography
				sx={{
					fontSize: "0.7rem",
					fontWeight: 600,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					color: "text.secondary",
					minWidth: { sm: 120 },
					flexShrink: 0,
				}}
			>
				{label}
			</Typography>
			<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", wordBreak: "break-word" }}>
				{value || notAvailableMsg}
			</Typography>
		</Stack>
	);

	const getFormattedPhone = (phone: string | undefined) => {
		if (!phone) return null;
		return (
			<PatternFormat
				displayType="text"
				format="(+##) ###-###-####"
				mask="_"
				defaultValue={phone}
				renderText={(value) => (
					<Typography sx={{ fontSize: "0.82rem", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
				)}
			/>
		);
	};

	const folderStatusColor = (status: string) => {
		switch (status) {
			case "Finalizado":
				return LIVE_GREEN;
			case "Activo":
				return BRAND_BLUE;
			case "En trámite":
				return STALE_AMBER;
			default:
				return theme.palette.text.secondary;
		}
	};

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` } }}>
			<TableCell colSpan={8} sx={{ p: 0, border: "none" }}>
				<Transitions type="slide" direction="down" in={true}>
					<Box
						sx={{
							m: 1.5,
							p: 2,
							borderRadius: 2,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
						}}
					>
						{/* Header */}
						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
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
								}}
							>
								<Profile size={20} variant="Bulk" />
							</Box>
							<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
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
										Detalle del contacto
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
									{data.name || notAvailableMsg}
								</Typography>
							</Stack>
							{isArchived && (
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 600,
											color: STALE_AMBER,
											letterSpacing: "0.04em",
											textTransform: "uppercase",
											lineHeight: 1,
										}}
									>
										Archivado
									</Typography>
								</Box>
							)}
						</Stack>

						{/* Info cards horizontal */}
						<Grid container spacing={2} sx={{ mb: 2 }}>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Call size={16} variant="Bulk" />} label="Teléfono" value={getFormattedPhone(data.phone)} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Location size={16} variant="Bulk" />} label="Dirección" value={data.address} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Buildings2 size={16} variant="Bulk" />} label="Rol" value={formatRole(data.role)} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Sms size={16} variant="Bulk" />} label="Email" value={data.email} />
							</Grid>
						</Grid>

						{/* Secciones */}
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<SectionCard eyebrow="Datos básicos" title="Información personal" icon={<Profile size={14} variant="Bulk" />}>
									<Stack spacing={1.25}>
										<KeyValueRow label="Nombre completo" value={data.name} />
										<KeyValueRow label="Email" value={data.email} />
										<KeyValueRow label="Teléfono" value={data.phone || notAvailableMsg} />
										<KeyValueRow label="Notas" value="Sin notas" />
									</Stack>
								</SectionCard>
							</Grid>

							<Grid item xs={12} md={6}>
								<SectionCard eyebrow="Vinculaciones" title="Causas asociadas" icon={<Folder2 size={14} variant="Bulk" />}>
									{loading ? (
										<Stack alignItems="center" spacing={0.75} sx={{ py: 2 }}>
											<CircularProgress size={20} sx={{ color: BRAND_BLUE }} />
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Cargando causas…
											</Typography>
										</Stack>
									) : error ? (
										<Typography sx={{ fontSize: "0.78rem", color: theme.palette.error.main, letterSpacing: "-0.005em" }}>{error}</Typography>
									) : folders.length > 0 ? (
										<Stack spacing={0.75}>
											{folders.map((folder) => {
												const dotColor = folderStatusColor(folder.status);
												return (
													<Box
														key={folder._id}
														onClick={() => navigate(`/apps/folders/details/${folder._id}`)}
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
															px: 1,
															py: 0.75,
															borderRadius: 1,
															cursor: "pointer",
															bgcolor: "transparent",
															transition: "background-color 0.15s ease, transform 0.15s ease",
															"&:hover": {
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
																transform: "translateX(2px)",
															},
														}}
													>
														<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
														<Typography
															sx={{
																flex: 1,
																fontSize: "0.82rem",
																color: "text.primary",
																letterSpacing: "-0.005em",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{folder.folderName}
														</Typography>
														<Box
															sx={{
																display: "inline-flex",
																alignItems: "center",
																px: 0.625,
																py: 0.125,
																borderRadius: 0.625,
																bgcolor: alpha(dotColor, isDark ? 0.16 : 0.1),
																border: `1px solid ${alpha(dotColor, isDark ? 0.3 : 0.2)}`,
																flexShrink: 0,
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.6rem",
																	fontWeight: 600,
																	color: dotColor,
																	letterSpacing: "0.04em",
																	textTransform: "uppercase",
																	lineHeight: 1.4,
																}}
															>
																{folder.status}
															</Typography>
														</Box>
													</Box>
												);
											})}
										</Stack>
									) : (
										<Stack direction="row" spacing={0.875} alignItems="center" sx={{ py: 0.5 }}>
											<Note1 size={14} variant="Linear" color={theme.palette.text.secondary} />
											<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Sin causas asociadas
											</Typography>
										</Stack>
									)}
								</SectionCard>
							</Grid>
						</Grid>
					</Box>
				</Transitions>
			</TableCell>
		</TableRow>
	);
};

export default CustomerView;
