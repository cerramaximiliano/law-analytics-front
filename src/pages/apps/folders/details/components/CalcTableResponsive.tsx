import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import dayjs from "utils/dayjs-config";
import {
	Skeleton,
	CardContent,
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
	Chip,
	Paper,
	useTheme,
	alpha,
	Divider,
	Card,
	useMediaQuery,
	Collapse,
	Button,
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import { Calculator, TrendUp, TrendDown, Trash, Add, ArrowDown2, ArrowUp2 } from "iconsax-react";
import ModalCalcTable from "../modals/ModalCalcTable";
import ModalCalcData from "../modals/ModalCalcData";
import { dispatch, useSelector } from "store";
import { deleteCalculator, getCalculatorsByFolderId } from "store/reducers/calculator";
import { enqueueSnackbar } from "notistack";
import { motion, AnimatePresence } from "framer-motion";

// types
import { CalculatorType, LoadingContentProps } from "types/calculator";

const formatAmount = (amount: number | null | undefined): string => {
	if (amount == null) return "No Disponible";
	return `$${amount.toLocaleString("es-AR")}`;
};

const LoadingContent = ({ isLoader, content, skeleton }: LoadingContentProps): JSX.Element => (isLoader ? <>{skeleton}</> : <>{content}</>);

// Animation variants
const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
};

interface CompactStatsCardProps {
	title: string;
	value: string | number;
	trend?: number;
	icon?: React.ReactNode;
	color?: "success" | "error" | "warning" | "primary";
	subtitle?: string;
	isLoading?: boolean;
}

const CompactStatsCard: React.FC<CompactStatsCardProps> = ({ title, value, trend, icon, color = "primary", subtitle, isLoading }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	return (
		<Paper
			elevation={0}
			sx={{
				p: isMobile ? 1.5 : 2,
				bgcolor: alpha(theme.palette[color].main, 0.08),
				border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
				borderRadius: 2,
				position: "relative",
				overflow: "hidden",
				transition: "all 0.3s ease",
				minHeight: isMobile ? 80 : 88,
				"&:hover": {
					transform: "translateY(-2px)",
					boxShadow: theme.shadows[2],
					borderColor: theme.palette[color].main,
				},
			}}
		>
			<Stack direction="row" spacing={isMobile ? 1.5 : 2} alignItems="center" height="100%">
				<Box sx={{ color: theme.palette[color].main, display: isMobile ? "none" : "block" }}>{icon}</Box>
				<Box flex={1}>
					<Typography variant="caption" color="text.secondary" fontWeight={500}>
						{title}
					</Typography>
					{isLoading ? (
						<Skeleton width="80%" height={28} />
					) : (
						<Typography variant={isMobile ? "h6" : "h5"} fontWeight={600} color={theme.palette[color].main}>
							{value}
						</Typography>
					)}
					{!isMobile && subtitle && (
						<Typography variant="caption" color="text.secondary" display="block">
							{subtitle}
						</Typography>
					)}
				</Box>
				{!isMobile && trend !== undefined && (
					<Stack alignItems="center" spacing={0.5}>
						{trend === 0 ? (
							<Box sx={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
								<Box sx={{ width: 8, height: 2, bgcolor: theme.palette.grey[400], borderRadius: 1 }} />
							</Box>
						) : trend > 0 ? (
							<TrendUp size={16} color={theme.palette.success.main} />
						) : (
							<TrendDown size={16} color={theme.palette.error.main} />
						)}
						<Typography
							variant="caption"
							fontWeight={600}
							color={trend === 0 ? "text.secondary" : trend > 0 ? "success.main" : "error.main"}
						>
							{trend === 0 ? "Base" : `${Math.abs(trend).toFixed(0)}%`}
						</Typography>
					</Stack>
				)}
			</Stack>
		</Paper>
	);
};

// Mobile Card Component for Table Rows
interface MobileCalcCardProps {
	row: CalculatorType;
	index: number;
	onDelete: (id: string) => void;
	previousAmount?: number;
}

const MobileCalcCard: React.FC<MobileCalcCardProps> = ({ row, index, onDelete, previousAmount }) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);

	const getTypeColor = (type: string) => {
		switch (type) {
			case "Reclamado":
				return "primary";
			case "Ofertado":
				return "success";
			case "Actualizado":
				return "warning";
			default:
				return "default";
		}
	};

	const percentageChange = previousAmount && row.amount ? ((row.amount - previousAmount) / previousAmount) * 100 : null;

	return (
		<Card
			variant="outlined"
			sx={{
				mb: 1.5,
				borderColor: theme.palette.divider,
				"&:hover": {
					bgcolor: alpha(theme.palette.primary.main, 0.02),
					borderColor: theme.palette.primary.main,
				},
			}}
		>
			<Box
				sx={{
					p: 2,
					cursor: "pointer",
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Stack spacing={1.5}>
					{/* Header Row */}
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
						<Stack spacing={0.5}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Chip
									label={row.type || "N/D"}
									size="small"
									color={getTypeColor(row.type || "")}
									variant="filled"
									sx={{ fontWeight: 500 }}
								/>
								<Typography variant="caption" color="text.secondary">
									{row.date ? dayjs(row.date).fromNow() : "N/D"}
								</Typography>
							</Stack>
							<Typography variant="h6" fontWeight={600}>
								{formatAmount(row.amount)}
							</Typography>
						</Stack>
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(row._id);
							}}
							sx={{
								color: theme.palette.error.main,
								"&:hover": {
									bgcolor: alpha(theme.palette.error.main, 0.1),
								},
							}}
						>
							<Trash size={20} />
						</IconButton>
					</Stack>

					{/* Additional Info */}
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="body2" color="text.secondary">
							{row.date ? dayjs(row.date).format("DD/MM/YYYY") : "N/D"}
						</Typography>
						{percentageChange !== null && (
							<Stack direction="row" spacing={0.5} alignItems="center">
								{percentageChange > 0 ? (
									<TrendUp size={14} color={theme.palette.success.main} />
								) : (
									<TrendDown size={14} color={theme.palette.error.main} />
								)}
								<Typography variant="caption" color={percentageChange > 0 ? "success.main" : "error.main"} fontWeight={500}>
									{Math.abs(percentageChange).toFixed(1)}%
								</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Box>

			<Collapse in={expanded}>
				<Divider />
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
					<Stack spacing={1}>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="caption" color="text.secondary">
								Parte:
							</Typography>
							<Typography variant="caption" fontWeight={500}>
								{row.user || "N/D"}
							</Typography>
						</Stack>
					</Stack>
				</Box>
			</Collapse>
		</Card>
	);
};

const CalcTableResponsive = ({ title, folderData }: { title: string; folderData: { folderName: string; monto: number } }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);

	const { id } = useParams();

	const sortedData = useMemo(
		() => selectedCalculators.slice().sort((a: any, b: any) => dayjs(b.date).diff(dayjs(a.date))),
		[selectedCalculators],
	);

	const latestOfferedAmount = useMemo(() => {
		const latestOffered = sortedData.find((item: any) => item.type === "Ofertado");
		return latestOffered?.amount ?? null;
	}, [sortedData]);

	// Calculate trends
	const calculateTrend = useMemo(() => {
		if (sortedData.length < 2) return undefined;
		const latest = sortedData[0]?.amount || 0;
		const previous = sortedData[1]?.amount || 0;
		if (previous === 0) return undefined;
		return ((latest - previous) / previous) * 100;
	}, [sortedData]);

	// Get first claimed calculation data (date and amount)
	const firstClaimedData = useMemo(() => {
		const claimedCalcs = sortedData.filter((item: any) => item.type === "Reclamado");
		if (claimedCalcs.length === 0) return null;
		const firstClaimed = claimedCalcs[claimedCalcs.length - 1];
		return {
			date: firstClaimed?.date,
			amount: firstClaimed?.amount,
		};
	}, [sortedData]);

	// Calculate difference percentage
	const differencePercentage = useMemo(() => {
		const claimedAmount = firstClaimedData?.amount ?? folderData?.monto;
		if (!claimedAmount || !latestOfferedAmount) return null;
		return ((latestOfferedAmount / claimedAmount) * 100).toFixed(1);
	}, [firstClaimedData?.amount, folderData?.monto, latestOfferedAmount]);

	useEffect(() => {
		if (id) {
			dispatch(getCalculatorsByFolderId(id));
		}
	}, [id]);

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

	const getTypeChip = (type: string) => {
		const getColor = () => {
			switch (type) {
				case "Reclamado":
					return "primary";
				case "Ofertado":
					return "success";
				case "Actualizado":
					return "warning";
				default:
					return "default";
			}
		};

		return (
			<Chip
				label={type}
				size="small"
				color={getColor()}
				variant="filled"
				sx={{
					fontWeight: 500,
					"& .MuiChip-label": {
						px: 1.5,
					},
				}}
			/>
		);
	};

	const EmptyState = () => (
		<Box
			sx={{
				py: 4,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Calculator size={48} color={theme.palette.text.secondary} style={{ opacity: 0.5 }} />
			<Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
				No hay cálculos registrados
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 320, mx: "auto", textAlign: "center" }}>
				Comienza agregando tu primer cálculo o registro
			</Typography>
		</Box>
	);

	return (
		<MainCard
			title={title}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: isMobile ? 1.5 : 2.5,
				},
			}}
		>
			{/* Modales */}
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} folderName={folderData?.folderName} />
			<ModalCalcTable open={open} setOpen={setOpen} folderName={folderData?.folderName} folderId={id} />

			<Box sx={{ p: 2.5 }}>
				{/* Compact Stats Cards */}
				<Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: isMobile ? 2 : 3 }}>
					<Grid item xs={12} sm={6}>
						<CompactStatsCard
							title="Monto Reclamado"
							value={formatAmount(firstClaimedData?.amount ?? folderData?.monto ?? null)}
							icon={<Calculator size={24} />}
							color="primary"
							subtitle={firstClaimedData?.date ? `Registrado el ${dayjs(firstClaimedData.date).format("DD/MM/YYYY")}` : "Monto inicial del reclamo"}
							trend={0}
							isLoading={isLoader}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<CompactStatsCard
							title="Último Ofrecimiento"
							value={latestOfferedAmount !== null ? formatAmount(latestOfferedAmount) : "Sin ofertas"}
							trend={calculateTrend}
							icon={<TrendUp size={24} />}
							color={latestOfferedAmount ? "success" : "warning"}
							subtitle={differencePercentage ? `${differencePercentage}% del monto reclamado` : "Aún no hay ofertas registradas"}
							isLoading={isLoader}
						/>
					</Grid>
				</Grid>

				{/* Content Area */}
				{showEmptyState ? (
					<>
						<EmptyState />
						<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
							<Button variant="contained" fullWidth startIcon={<Add />} onClick={() => setOpenItemModal(true)}>
								Nuevo Monto
							</Button>
							<Button variant="outlined" fullWidth onClick={() => setOpen(true)}>
								Gestionar Cálculos
							</Button>
						</Stack>
					</>
				) : (
					<>
						{/* Mobile View - Cards */}
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
											transition={{ delay: index * 0.05 }}
										>
											<MobileCalcCard
												row={row}
												index={index}
												onDelete={handleDelete}
												previousAmount={index < sortedData.length - 1 ? sortedData[index + 1].amount : undefined}
											/>
										</motion.div>
									))}
								</AnimatePresence>
							</Box>
						) : (
							/* Desktop/Tablet View - Table */
							<Paper
								elevation={0}
								sx={{
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<SimpleBar sx={{ maxHeight: 400 }}>
									<TableContainer>
										<Table
											sx={{
												"& .MuiTableCell-root": {
													py: isTablet ? 1 : 1.5,
													px: isTablet ? 1.5 : 2,
												},
												"& .MuiTableRow-root": {
													transition: "all 0.2s ease",
													cursor: "pointer",
													"&:hover": {
														bgcolor: alpha(theme.palette.primary.main, 0.04),
													},
												},
											}}
										>
											<TableHead>
												<TableRow>
													{["Fecha", "Tipo", "Parte", "Monto", ""].map((header, index) => (
														<TableCell
															key={header}
															align={index >= 3 ? "right" : "left"}
															sx={{
																fontWeight: 600,
																color: "text.secondary",
																fontSize: isTablet ? "0.75rem" : "0.875rem",
																bgcolor: theme.palette.grey[50],
															}}
														>
															<LoadingContent isLoader={isLoader} content={header} skeleton={<Skeleton />} />
														</TableCell>
													))}
												</TableRow>
											</TableHead>
											<TableBody>
												{sortedData.map((row: CalculatorType, index: number) => (
													<TableRow key={row._id}>
														<TableCell>
															<Stack spacing={0.25}>
																<Typography variant="body2" fontWeight={500}>
																	{row.date ? dayjs(row.date).format("DD/MM/YYYY") : "N/D"}
																</Typography>
																<Typography variant="caption" color="text.secondary">
																	{row.date ? dayjs(row.date).fromNow() : "N/D"}
																</Typography>
															</Stack>
														</TableCell>
														<TableCell>{getTypeChip(row.type || "N/D")}</TableCell>
														<TableCell>
															<Typography variant="body2" color="text.secondary">
																{row.user || "N/D"}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Stack spacing={0.25} alignItems="flex-end">
																<Typography variant="body2" fontWeight={600}>
																	{formatAmount(row.amount)}
																</Typography>
																{index > 0 && row.amount && sortedData[index - 1].amount && (
																	<Stack direction="row" spacing={0.5} alignItems="center">
																		{row.amount > sortedData[index - 1].amount ? (
																			<ArrowUp2 size={12} color={theme.palette.success.main} />
																		) : (
																			<ArrowDown2 size={12} color={theme.palette.error.main} />
																		)}
																		<Typography
																			variant="caption"
																			color={row.amount > sortedData[index - 1].amount ? "success.main" : "error.main"}
																		>
																			{Math.abs(((row.amount - sortedData[index - 1].amount) / sortedData[index - 1].amount) * 100).toFixed(
																				1,
																			)}
																			%
																		</Typography>
																	</Stack>
																)}
															</Stack>
														</TableCell>
														<TableCell align="right">
															<IconButton
																size="small"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDelete(row._id);
																}}
																sx={{
																	color: theme.palette.error.main,
																	"&:hover": {
																		bgcolor: alpha(theme.palette.error.main, 0.1),
																	},
																}}
															>
																<Trash size={18} />
															</IconButton>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</SimpleBar>
							</Paper>
						)}
						{/* Action Buttons */}
						<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
							<Button variant="contained" fullWidth startIcon={<Add />} onClick={() => setOpenItemModal(true)}>
								Nuevo Monto
							</Button>
							<Button variant="outlined" fullWidth onClick={() => setOpen(true)}>
								Gestionar Cálculos
							</Button>
						</Stack>
					</>
				)}
			</Box>
		</MainCard>
	);
};

export default CalcTableResponsive;
