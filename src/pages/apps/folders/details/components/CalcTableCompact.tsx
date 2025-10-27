import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import dayjs from "utils/dayjs-config";
import {
	Skeleton,
	Button,
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
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	IconButton,
	Zoom,
	Box,
	Chip,
	Paper,
	useTheme,
	alpha,
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import Avatar from "components/@extended/Avatar";
import { Calculator, TrendUp, TrendDown, Trash, ArrowRight2, Export } from "iconsax-react";
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
const tableRowVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 20 },
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

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				bgcolor: alpha(theme.palette[color].main, 0.08),
				border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
				borderRadius: 2,
				position: "relative",
				overflow: "hidden",
				transition: "all 0.3s ease",
				minHeight: 88, // Ensure consistent height
				"&:hover": {
					transform: "translateY(-2px)",
					boxShadow: theme.shadows[2],
					borderColor: theme.palette[color].main,
				},
			}}
		>
			<Stack direction="row" spacing={2} alignItems="center" height="100%">
				<Box sx={{ color: theme.palette[color].main }}>{icon}</Box>
				<Box flex={1}>
					<Typography variant="caption" color="text.secondary" fontWeight={500}>
						{title}
					</Typography>
					{isLoading ? (
						<Skeleton width="80%" height={28} />
					) : (
						<Typography variant="h5" fontWeight={600} color={theme.palette[color].main}>
							{value}
						</Typography>
					)}
					{subtitle && (
						<Typography variant="caption" color="text.secondary" display="block">
							{subtitle}
						</Typography>
					)}
				</Box>
				{trend !== undefined && (
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

const CalcTableCompact = ({ title, folderData }: { title: string; folderData: { folderName: string; monto: number } }) => {
	const theme = useTheme();
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

	// Get first claimed calculation date and amount
	const firstClaimedData = useMemo(() => {
		const claimedCalcs = sortedData.filter((item: any) => item.type === "Reclamado");
		if (claimedCalcs.length === 0) return null;
		const firstClaimed = claimedCalcs[claimedCalcs.length - 1];
		return {
			date: firstClaimed?.date,
			amount: firstClaimed?.amount,
		};
	}, [sortedData]);

	// Calculate trends
	const calculateTrend = useMemo(() => {
		if (sortedData.length < 2) return undefined;
		const latest = sortedData[0]?.amount || 0;
		const previous = sortedData[1]?.amount || 0;
		if (previous === 0) return undefined;
		return ((latest - previous) / previous) * 100;
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

	const EmptyState = () => (
		<TableRow>
			<TableCell colSpan={5} align="center">
				<Stack spacing={2} alignItems="center" py={4}>
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
						<Avatar
							color="error"
							variant="rounded"
							sx={{
								width: 64,
								height: 64,
								bgcolor: alpha(theme.palette.error.main, 0.1),
								color: "error.main",
							}}
						>
							<Calculator variant="Bold" size={32} />
						</Avatar>
					</motion.div>
					<Box textAlign="center">
						<Typography variant="h6" color="textPrimary" gutterBottom>
							No hay cálculos registrados
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 360 }}>
							Los cálculos te ayudan a llevar un registro detallado de montos y ofertas relacionadas con este expediente
						</Typography>
					</Box>
				</Stack>
			</TableCell>
		</TableRow>
	);

	const handleDelete = useCallback(async (id: string) => {
		try {
			const result = await dispatch(deleteCalculator(id));
			if (result.success) {
				enqueueSnackbar("Cálculo eliminado correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			} else {
				enqueueSnackbar(result.error || "Error al eliminar el cálculo", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			enqueueSnackbar("Error inesperado al eliminar el cálculo", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		}
	}, []);

	const getTypeChip = (type: string) => {
		const typeConfig: Record<string, { color: any; variant: "filled" | "outlined" }> = {
			Ofertado: { color: "success", variant: "filled" },
			Reclamado: { color: "primary", variant: "outlined" },
			Estimado: { color: "warning", variant: "outlined" },
		};

		const config = typeConfig[type] || { color: "default", variant: "outlined" };

		return <Chip label={type} size="small" color={config.color} variant={config.variant} />;
	};

	return (
		<MainCard
			shadow={3}
			title={
				title ? (
					<List disablePadding>
						<ListItem sx={{ p: 0 }}>
							<LoadingContent
								isLoader={isLoader}
								content={
									<ListItemAvatar>
										<Avatar color="success" variant="rounded">
											<Calculator variant="Bold" />
										</Avatar>
									</ListItemAvatar>
								}
								skeleton={<Skeleton variant="rectangular" width={40} height={40} style={{ marginRight: 10 }} />}
							/>
							<LoadingContent
								isLoader={isLoader}
								content={
									<ListItemText
										sx={{ my: 0 }}
										primary={title}
										secondary={<Typography variant="subtitle1">{folderData?.folderName}</Typography>}
									/>
								}
								skeleton={
									<Grid>
										<Skeleton variant="rectangular" width={120} height={16} style={{ marginBottom: 5 }} />
										<Skeleton variant="rectangular" width={120} height={16} />
									</Grid>
								}
							/>
						</ListItem>
					</List>
				) : null
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 2.5,
				},
			}}
		>
			{/* Modales */}
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} folderName={folderData?.folderName} />
			<ModalCalcTable open={open} setOpen={setOpen} folderName={folderData?.folderName} folderId={id} />

			<CardContent>
				{/* Compact Stats Cards */}
				<Grid container spacing={2} sx={{ mb: 3 }}>
					<Grid item xs={12} md={6}>
						<CompactStatsCard
							title="Monto Reclamado"
							value={formatAmount(firstClaimedData?.amount ?? folderData?.monto ?? null)}
							icon={<Calculator size={24} />}
							color="primary"
							subtitle={
								firstClaimedData?.date ? `Registrado el ${dayjs(firstClaimedData.date).format("DD/MM/YYYY")}` : "Monto inicial del reclamo"
							}
							trend={0} // Show neutral trend to maintain consistent height
							isLoading={isLoader}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
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

				{/* Integrated Table */}
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
										py: 1.5,
										px: 2,
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
													fontSize: "0.875rem",
													bgcolor: theme.palette.grey[50],
												}}
											>
												<LoadingContent isLoader={isLoader} content={header} skeleton={<Skeleton />} />
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									<AnimatePresence>
										{showEmptyState ? (
											<EmptyState />
										) : (
											sortedData.map((row: CalculatorType, index: number) => (
												<motion.tr
													key={row._id}
													variants={tableRowVariants}
													initial="hidden"
													animate="visible"
													exit="exit"
													transition={{ delay: index * 0.05 }}
													style={{ position: "relative" }}
												>
													<TableCell>
														<LoadingContent
															isLoader={isLoader}
															content={
																<Stack spacing={0.25}>
																	<Typography variant="body2" fontWeight={500}>
																		{row.date ? dayjs(row.date).format("DD/MM/YYYY") : "N/D"}
																	</Typography>
																	<Typography variant="caption" color="text.secondary">
																		{row.date ? dayjs(row.date).fromNow() : "N/D"}
																	</Typography>
																</Stack>
															}
															skeleton={<Skeleton width={80} />}
														/>
													</TableCell>
													<TableCell>
														<LoadingContent
															isLoader={isLoader}
															content={
																<Stack spacing={0.5}>
																	{getTypeChip(row.type || "N/D")}
																	{row.description && (
																		<Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 200 }}>
																			{row.description.length > 50 ? `${row.description.substring(0, 50)}...` : row.description}
																		</Typography>
																	)}
																</Stack>
															}
															skeleton={<Skeleton width={80} />}
														/>
													</TableCell>
													<TableCell>
														<LoadingContent
															isLoader={isLoader}
															content={
																<Typography variant="body2" color="text.secondary">
																	{row.user || "N/D"}
																</Typography>
															}
															skeleton={<Skeleton width={60} />}
														/>
													</TableCell>
													<TableCell align="right">
														<LoadingContent
															isLoader={isLoader}
															content={
																<Stack spacing={0.25} alignItems="flex-end">
																	<Typography variant="body2" fontWeight={600}>
																		{formatAmount(row.amount)}
																	</Typography>
																	{index > 0 && row.amount && sortedData[index - 1].amount && (
																		<Stack direction="row" spacing={0.5} alignItems="center">
																			{row.amount > sortedData[index - 1].amount ? (
																				<ArrowRight2 size={12} color={theme.palette.success.main} style={{ transform: "rotate(-45deg)" }} />
																			) : (
																				<ArrowRight2 size={12} color={theme.palette.error.main} style={{ transform: "rotate(45deg)" }} />
																			)}
																			<Typography
																				variant="caption"
																				color={row.amount > sortedData[index - 1].amount ? "success.main" : "error.main"}
																			>
																				{Math.abs(
																					((row.amount - sortedData[index - 1].amount) / sortedData[index - 1].amount) * 100,
																				).toFixed(1)}
																				%
																			</Typography>
																		</Stack>
																	)}
																</Stack>
															}
															skeleton={<Skeleton width={100} />}
														/>
													</TableCell>
													<TableCell align="right">
														<LoadingContent
															isLoader={isLoader}
															content={
																<IconButton
																	size="small"
																	color="error"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDelete(row._id);
																	}}
																>
																	<Trash size={18} />
																</IconButton>
															}
															skeleton={<Skeleton width={40} />}
														/>
													</TableCell>
												</motion.tr>
											))
										)}
									</AnimatePresence>
								</TableBody>
							</Table>
						</TableContainer>
					</SimpleBar>
				</Paper>

				{/* Action Buttons */}
				<Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
					<Button
						size="small"
						startIcon={<Export size={16} />}
						sx={{ color: "text.secondary" }}
						disabled={isLoader || sortedData.length === 0}
					>
						Exportar
					</Button>
					<Stack direction="row" spacing={2}>
						<Button
							onClick={() => setOpen(true)}
							disabled={isLoader}
							sx={{
								borderColor: "divider",
								"&:hover": {
									borderColor: "primary.main",
									bgcolor: alpha(theme.palette.primary.main, 0.04),
								},
							}}
						>
							Vincular
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() => setOpenItemModal(true)}
							disabled={isLoader}
							startIcon={<Calculator size={18} />}
						>
							Agregar cálculo
						</Button>
					</Stack>
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default CalcTableCompact;
