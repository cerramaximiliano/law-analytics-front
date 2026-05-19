import React from "react";
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import dayjs from "utils/dayjs-config";
import {
	Skeleton,
	Grid,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	IconButton,
	Box,
	useTheme,
	alpha,
	useMediaQuery,
	Collapse,
	Button,
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import { Calculator, TrendUp, TrendDown, Trash, Add, ArrowDown2, ArrowUp2, Coin } from "iconsax-react";
import ModalCalcTable from "../modals/ModalCalcTable";
import ModalCalcData from "../modals/ModalCalcData";
import { dispatch, useSelector } from "store";
import { deleteCalculator } from "store/reducers/calculator";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import { useTeam } from "contexts/TeamContext";

import { CalculatorType } from "types/calculator";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

const formatAmount = (amount: number | null | undefined): string => {
	if (amount == null) return "No disponible";
	return `$${amount.toLocaleString("es-AR")}`;
};

const cardVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -16 },
};

// Pill mapping: type → brand accent
const getTypeAccent = (type: string, errorMain: string): string => {
	switch (type) {
		case "Reclamado":
			return BRAND_BLUE;
		case "Ofertado":
			return LIVE_GREEN;
		case "Actualizado":
			return STALE_AMBER;
		default:
			return errorMain;
	}
};

// Stat card — brand
const StatCard: React.FC<{
	eyebrow: string;
	value: React.ReactNode;
	icon: React.ReactNode;
	subtitle?: string;
	trend?: number;
	accent: string;
	isLoading?: boolean;
	isDark: boolean;
}> = ({ eyebrow, value, icon, subtitle, trend, accent, isLoading, isDark }) => (
	<Box
		sx={{
			p: 1.75,
			borderRadius: 1.5,
			bgcolor: alpha(accent, isDark ? 0.06 : 0.03),
			border: `1px solid ${alpha(accent, isDark ? 0.22 : 0.14)}`,
			height: "100%",
		}}
	>
		<Stack direction="row" spacing={1.25} alignItems="flex-start">
			<Box
				sx={{
					width: 36,
					height: 36,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
					color: accent,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: accent }} />
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{eyebrow}
					</Typography>
				</Stack>
				{isLoading ? (
					<Skeleton width="80%" height={28} />
				) : (
					<Typography
						sx={{
							fontSize: "1.15rem",
							fontWeight: 700,
							color: accent,
							letterSpacing: "-0.015em",
							fontVariantNumeric: "tabular-nums",
							lineHeight: 1.2,
						}}
					>
						{value}
					</Typography>
				)}
				{subtitle && (
					<Typography
						sx={{
							fontSize: "0.68rem",
							color: "text.secondary",
							letterSpacing: "-0.005em",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{subtitle}
					</Typography>
				)}
			</Stack>
			{trend !== undefined && (
				<Box sx={{ flexShrink: 0 }}>
					<Stack direction="row" spacing={0.375} alignItems="center">
						{trend === 0 ? (
							<Box sx={{ width: 8, height: 2, bgcolor: "text.disabled", borderRadius: 1 }} />
						) : trend > 0 ? (
							<TrendUp size={12} variant="Bulk" color={LIVE_GREEN} />
						) : (
							<TrendDown size={12} variant="Bulk" color={LIVE_GREEN === accent ? STALE_AMBER : LIVE_GREEN} />
						)}
						<Typography
							sx={{
								fontSize: "0.7rem",
								fontWeight: 700,
								color: trend === 0 ? "text.secondary" : trend > 0 ? LIVE_GREEN : STALE_AMBER,
								letterSpacing: "-0.005em",
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{trend === 0 ? "Base" : `${Math.abs(trend).toFixed(0)}%`}
						</Typography>
					</Stack>
				</Box>
			)}
		</Stack>
	</Box>
);

interface MobileCalcCardProps {
	row: CalculatorType;
	index: number;
	onDelete: (id: string) => void;
	previousAmount?: number;
	canDelete?: boolean;
}

const MobileCalcCard: React.FC<MobileCalcCardProps> = ({ row, onDelete, previousAmount, canDelete = true }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const [expanded, setExpanded] = useState(false);
	const typeAccent = getTypeAccent(row.type || "", errorColor);
	const percentageChange = previousAmount && row.amount ? ((row.amount - previousAmount) / previousAmount) * 100 : null;

	return (
		<Box
			sx={{
				mb: 1.25,
				borderRadius: 1.25,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				bgcolor: theme.palette.background.paper,
				transition: "all 180ms ease",
				"&:hover": {
					borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				},
			}}
		>
			<Box sx={{ p: 1.5, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
				<Stack spacing={1.25}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
						<Stack spacing={0.5} sx={{ minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.5,
										px: 0.75,
										py: 0.125,
										borderRadius: 0.625,
										bgcolor: alpha(typeAccent, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(typeAccent, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: typeAccent }} />
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											color: typeAccent,
											letterSpacing: "0.04em",
											textTransform: "uppercase",
											lineHeight: 1,
										}}
									>
										{row.type || "N/D"}
									</Typography>
								</Box>
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									{row.date ? dayjs(row.date).fromNow() : "N/D"}
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: "1rem",
									fontWeight: 700,
									color: "text.primary",
									letterSpacing: "-0.015em",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{formatAmount(row.amount)}
							</Typography>
						</Stack>
						{canDelete && (
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(row._id);
								}}
								sx={{
									width: 28,
									height: 28,
									borderRadius: 0.75,
									color: errorColor,
									bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
									border: `1px solid ${alpha(errorColor, isDark ? 0.22 : 0.14)}`,
									"&:hover": {
										bgcolor: alpha(errorColor, isDark ? 0.18 : 0.1),
									},
								}}
							>
								<Trash size={14} variant="Bulk" />
							</IconButton>
						)}
					</Stack>

					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							{row.date ? dayjs(row.date).format("DD/MM/YYYY") : "N/D"}
						</Typography>
						{percentageChange !== null && (
							<Stack direction="row" spacing={0.375} alignItems="center">
								{percentageChange > 0 ? (
									<TrendUp size={12} variant="Bulk" color={LIVE_GREEN} />
								) : (
									<TrendDown size={12} variant="Bulk" color={STALE_AMBER} />
								)}
								<Typography
									sx={{
										fontSize: "0.7rem",
										fontWeight: 600,
										color: percentageChange > 0 ? LIVE_GREEN : STALE_AMBER,
										letterSpacing: "-0.005em",
										fontVariantNumeric: "tabular-nums",
									}}
								>
									{Math.abs(percentageChange).toFixed(1)}%
								</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Box>

			<Collapse in={expanded}>
				<Box
					sx={{
						borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
						p: 1.5,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
					}}
				>
					<Stack direction="row" justifyContent="space-between">
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							Parte
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
							{row.user || "—"}
						</Typography>
					</Stack>
				</Box>
			</Collapse>
		</Box>
	);
};

const CalcTableResponsive = ({
	title,
	folderData,
}: {
	title: string;
	folderData: { folderName: string; monto: number; groupId?: string };
}) => {
	void title;
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);

	const { id } = useParams();
	const { canDelete, canCreate } = useTeam();

	const sortedData = useMemo(
		() => selectedCalculators.slice().sort((a: any, b: any) => dayjs(b.date).diff(dayjs(a.date))),
		[selectedCalculators],
	);

	const latestOfferedAmount = useMemo(() => {
		const latestOffered = sortedData.find((item: any) => item.type === "Ofertado");
		return latestOffered?.amount ?? null;
	}, [sortedData]);

	const calculateTrend = useMemo(() => {
		if (sortedData.length < 2) return undefined;
		const latest = sortedData[0]?.amount || 0;
		const previous = sortedData[1]?.amount || 0;
		if (previous === 0) return undefined;
		return ((latest - previous) / previous) * 100;
	}, [sortedData]);

	const firstClaimedData = useMemo(() => {
		const claimedCalcs = sortedData.filter((item: any) => item.type === "Reclamado");
		if (claimedCalcs.length === 0) return null;
		const firstClaimed = claimedCalcs[claimedCalcs.length - 1];
		return {
			date: firstClaimed?.date,
			amount: firstClaimed?.amount,
		};
	}, [sortedData]);

	const differencePercentage = useMemo(() => {
		const claimedAmount = firstClaimedData?.amount ?? folderData?.monto;
		if (!claimedAmount || !latestOfferedAmount) return null;
		return ((latestOfferedAmount / claimedAmount) * 100).toFixed(1);
	}, [firstClaimedData?.amount, folderData?.monto, latestOfferedAmount]);

	const showEmptyState = !isLoader && sortedData.length === 0;

	const handleDelete = async (calcId: string) => {
		try {
			const result = await dispatch(deleteCalculator(calcId));
			if (result.success) {
				enqueueSnackbar("Cálculo eliminado correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			} else {
				enqueueSnackbar(result.error || "Error al eliminar el cálculo", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			}
		} catch (error) {
			enqueueSnackbar("Error inesperado al eliminar el cálculo", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
		}
	};

	const TypePill = ({ type }: { type: string }) => {
		const accent = getTypeAccent(type, errorColor);
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.5,
					px: 0.75,
					py: 0.125,
					borderRadius: 0.625,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.62rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						lineHeight: 1,
					}}
				>
					{type}
				</Typography>
			</Box>
		);
	};

	const EmptyState = () => (
		<Box
			sx={{
				p: 3.5,
				textAlign: "center",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
				borderRadius: 1.5,
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 1.5,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					mb: 1.5,
				}}
			>
				<Calculator size={28} variant="Bulk" />
			</Box>
			<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
				Sin cálculos registrados
			</Typography>
			<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5, maxWidth: 320, mx: "auto" }}>
				Empezá agregando tu primer cálculo o registro.
			</Typography>
		</Box>
	);

	const ctaButtonSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		py: 1,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};
	const ghostCtaSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: BRAND_BLUE,
		borderRadius: 1.25,
		py: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: "transparent",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
		},
	};

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
				overflow: "hidden",
			}}
		>
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} folderName={folderData?.folderName} />
			<ModalCalcTable open={open} setOpen={setOpen} folderName={folderData?.folderName} folderId={id} />

			<Box sx={{ p: 2 }}>
				{/* Stats */}
				<Grid container spacing={1.5} sx={{ mb: 2 }}>
					<Grid item xs={12} sm={6}>
						<StatCard
							eyebrow="Monto reclamado"
							value={formatAmount(firstClaimedData?.amount ?? folderData?.monto ?? null)}
							icon={<Calculator size={18} variant="Bulk" />}
							accent={BRAND_BLUE}
							subtitle={
								firstClaimedData?.date ? `Registrado el ${dayjs(firstClaimedData.date).format("DD/MM/YYYY")}` : "Monto inicial del reclamo"
							}
							trend={0}
							isLoading={isLoader}
							isDark={isDark}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<StatCard
							eyebrow="Último ofrecimiento"
							value={latestOfferedAmount !== null ? formatAmount(latestOfferedAmount) : "Sin ofertas"}
							icon={<Coin size={18} variant="Bulk" />}
							accent={latestOfferedAmount ? LIVE_GREEN : STALE_AMBER}
							subtitle={differencePercentage ? `${differencePercentage}% del monto reclamado` : "Aún no hay ofertas registradas"}
							trend={calculateTrend}
							isLoading={isLoader}
							isDark={isDark}
						/>
					</Grid>
				</Grid>

				{/* Content */}
				{showEmptyState ? (
					<>
						<EmptyState />
						{canCreate && (
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
								<Button variant="contained" fullWidth startIcon={<Add size={16} variant="Bulk" />} onClick={() => setOpenItemModal(true)} sx={ctaButtonSx}>
									Nuevo monto
								</Button>
								<Button fullWidth onClick={() => setOpen(true)} sx={ghostCtaSx}>
									Gestionar cálculos
								</Button>
							</Stack>
						)}
					</>
				) : (
					<>
						{isMobile ? (
							<Box sx={{ maxHeight: 400, overflow: "auto" }}>
								<AnimatePresence>
									{sortedData.map((row: CalculatorType, index: number) => (
										<motion.div
											key={row._id}
											variants={cardVariants}
											initial="hidden"
											animate="visible"
											exit="exit"
											transition={{ delay: index * 0.04 }}
										>
											<MobileCalcCard
												row={row}
												index={index}
												onDelete={handleDelete}
												previousAmount={index < sortedData.length - 1 ? sortedData[index + 1].amount : undefined}
												canDelete={canDelete}
											/>
										</motion.div>
									))}
								</AnimatePresence>
							</Box>
						) : (
							<Box
								sx={{
									borderRadius: 1.5,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									overflow: "hidden",
								}}
							>
								<SimpleBar sx={{ maxHeight: 400 }}>
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow
													sx={{
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
														"& th": {
															borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
															fontSize: "0.6rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
															py: 1,
															px: isTablet ? 1.5 : 2,
														},
													}}
												>
													<TableCell>Fecha</TableCell>
													<TableCell>Tipo</TableCell>
													<TableCell>Parte</TableCell>
													<TableCell align="right">Monto</TableCell>
													<TableCell align="right" sx={{ width: 56 }}></TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{sortedData.map((row: CalculatorType, index: number) => {
													const prevAmount = index < sortedData.length - 1 ? sortedData[index + 1].amount : null;
													return (
														<TableRow
															key={row._id}
															sx={{
																"& td": {
																	borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
																	py: 1.25,
																	px: isTablet ? 1.5 : 2,
																},
																"&:last-child td": { borderBottom: "none" },
																transition: "background 180ms ease",
																"&:hover": {
																	bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
																},
															}}
														>
															<TableCell>
																<Stack spacing={0.125}>
																	<Typography
																		sx={{
																			fontSize: "0.82rem",
																			fontWeight: 600,
																			color: "text.primary",
																			letterSpacing: "-0.005em",
																			fontVariantNumeric: "tabular-nums",
																		}}
																	>
																		{row.date ? dayjs(row.date).format("DD/MM/YYYY") : "N/D"}
																	</Typography>
																	<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
																		{row.date ? dayjs(row.date).fromNow() : "N/D"}
																	</Typography>
																</Stack>
															</TableCell>
															<TableCell>
																<TypePill type={row.type || "N/D"} />
															</TableCell>
															<TableCell>
																<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
																	{row.user || "—"}
																</Typography>
															</TableCell>
															<TableCell align="right">
																<Stack spacing={0.125} alignItems="flex-end">
																	<Typography
																		sx={{
																			fontSize: "0.88rem",
																			fontWeight: 700,
																			color: "text.primary",
																			letterSpacing: "-0.005em",
																			fontVariantNumeric: "tabular-nums",
																		}}
																	>
																		{formatAmount(row.amount)}
																	</Typography>
																	{prevAmount !== null && row.amount && prevAmount && (
																		<Stack direction="row" spacing={0.375} alignItems="center">
																			{row.amount > prevAmount ? (
																				<ArrowUp2 size={10} variant="Bulk" color={LIVE_GREEN} />
																			) : (
																				<ArrowDown2 size={10} variant="Bulk" color={STALE_AMBER} />
																			)}
																			<Typography
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 600,
																					color: row.amount > prevAmount ? LIVE_GREEN : STALE_AMBER,
																					letterSpacing: "-0.005em",
																					fontVariantNumeric: "tabular-nums",
																				}}
																			>
																				{Math.abs(((row.amount - prevAmount) / prevAmount) * 100).toFixed(1)}%
																			</Typography>
																		</Stack>
																	)}
																</Stack>
															</TableCell>
															<TableCell align="right">
																{canDelete && (
																	<IconButton
																		size="small"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleDelete(row._id);
																		}}
																		sx={{
																			width: 28,
																			height: 28,
																			borderRadius: 0.75,
																			color: errorColor,
																			bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
																			border: `1px solid ${alpha(errorColor, isDark ? 0.22 : 0.14)}`,
																			"&:hover": {
																				bgcolor: alpha(errorColor, isDark ? 0.18 : 0.1),
																			},
																		}}
																	>
																		<Trash size={14} variant="Bulk" />
																	</IconButton>
																)}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</SimpleBar>
							</Box>
						)}

						{canCreate && (
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
								<Button variant="contained" fullWidth startIcon={<Add size={16} variant="Bulk" />} onClick={() => setOpenItemModal(true)} sx={ctaButtonSx}>
									Nuevo monto
								</Button>
								<Button fullWidth onClick={() => setOpen(true)} sx={ghostCtaSx}>
									Gestionar cálculos
								</Button>
							</Stack>
						)}
					</>
				)}
			</Box>
		</MainCard>
	);
};

export default CalcTableResponsive;
