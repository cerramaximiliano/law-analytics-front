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
	Tooltip,
	Zoom,
	Box,
	Chip,
	Paper,
	useTheme,
	alpha,
	Menu,
	MenuItem,
	ListItemIcon,
	Divider,
	Collapse,
	Fade,
	LinearProgress,
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import Avatar from "components/@extended/Avatar";
import {
	Calculator,
	TrendUp,
	TrendDown,
	More,
	Edit2,
	Trash,
	Eye,
	Filter,
	ArrowRight2,
	InfoCircle,
	DocumentCopy,
	Export,
} from "iconsax-react";
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

const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
};

interface StatsCardProps {
	title: string;
	value: string | number;
	trend?: number;
	icon?: React.ReactNode;
	color?: "success" | "error" | "warning" | "primary";
	subtitle?: string;
	isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, icon, color = "primary", subtitle, isLoading }) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				bgcolor: alpha(theme.palette[color].main, 0.08),
				border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
				borderRadius: 2,
				position: "relative",
				overflow: "hidden",
				transition: "all 0.3s ease",
				"&:hover": {
					transform: "translateY(-2px)",
					boxShadow: theme.shadows[4],
					borderColor: theme.palette[color].main,
				},
			}}
		>
			{/* Background Pattern */}
			<Box
				sx={{
					position: "absolute",
					top: -20,
					right: -20,
					opacity: 0.1,
				}}
			>
				{icon}
			</Box>

			<Stack spacing={2}>
				<Box>
					<Typography variant="caption" color="text.secondary" fontWeight={500}>
						{title}
					</Typography>
					{isLoading ? (
						<Skeleton width="80%" height={32} />
					) : (
						<Typography variant="h4" fontWeight={600} color={theme.palette[color].main}>
							{value}
						</Typography>
					)}
				</Box>

				{(trend !== undefined || subtitle) && (
					<Box>
						{trend !== undefined && (
							<Stack direction="row" spacing={0.5} alignItems="center">
								{trend > 0 ? (
									<TrendUp size={16} color={theme.palette.success.main} />
								) : (
									<TrendDown size={16} color={theme.palette.error.main} />
								)}
								<Typography variant="caption" fontWeight={600} color={trend > 0 ? "success.main" : "error.main"}>
									{Math.abs(trend)}%
								</Typography>
								<Typography variant="caption" color="text.secondary">
									vs. anterior
								</Typography>
							</Stack>
						)}
						{subtitle && (
							<Typography variant="caption" color="text.secondary">
								{subtitle}
							</Typography>
						)}
					</Box>
				)}
			</Stack>
		</Paper>
	);
};

const CalcTableEnhanced = ({ title, folderData }: { title: string; folderData: { folderName: string; monto: number } }) => {
	const theme = useTheme();
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<CalculatorType | null>(null);
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);

	const { id } = useParams();

	const sortedData = useMemo(
		() => selectedCalculators.slice().sort((a: any, b: any) => dayjs(b.date, "DD/MM/YYYY").diff(dayjs(a.date, "DD/MM/YYYY"))),
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

	// Calculate difference percentage
	const differencePercentage = useMemo(() => {
		if (!folderData?.monto || !latestOfferedAmount) return null;
		return ((latestOfferedAmount / folderData.monto) * 100).toFixed(1);
	}, [folderData?.monto, latestOfferedAmount]);

	useEffect(() => {
		if (id) {
			dispatch(getCalculatorsByFolderId(id));
		}
	}, [id]);

	const showEmptyState = !isLoader && sortedData.length === 0;

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: CalculatorType) => {
		setAnchorEl(event.currentTarget);
		setSelectedRow(row);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedRow(null);
	};

	const EmptyState = () => (
		<TableRow>
			<TableCell colSpan={5} align="center">
				<Stack spacing={3} alignItems="center" py={6}>
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
						<Avatar
							color="error"
							variant="rounded"
							sx={{
								width: 80,
								height: 80,
								bgcolor: alpha(theme.palette.error.main, 0.1),
								color: "error.main",
							}}
						>
							<Calculator variant="Bold" size={40} />
						</Avatar>
					</motion.div>
					<Box textAlign="center">
						<Typography variant="h6" color="textPrimary" gutterBottom>
							No hay cálculos registrados
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 360 }}>
							Los cálculos te ayudan a llevar un registro detallado de montos y ofertas relacionadas con este expediente
						</Typography>
						<Button variant="contained" color="primary" startIcon={<Calculator />} onClick={() => setOpenItemModal(true)} size="large">
							Agregar primer cálculo
						</Button>
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
		handleMenuClose();
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
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 3,
				},
			}}
		>
			{/* Modales */}
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} folderName={folderData?.folderName} />
			<ModalCalcTable open={open} setOpen={setOpen} folderName={folderData?.folderName} folderId={id} />

			{/* Actions Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			>
				<MenuItem onClick={handleMenuClose}>
					<ListItemIcon>
						<Eye size={18} />
					</ListItemIcon>
					<Typography variant="body2">Ver detalles</Typography>
				</MenuItem>
				<MenuItem onClick={handleMenuClose}>
					<ListItemIcon>
						<Edit2 size={18} />
					</ListItemIcon>
					<Typography variant="body2">Editar</Typography>
				</MenuItem>
				<MenuItem onClick={handleMenuClose}>
					<ListItemIcon>
						<DocumentCopy size={18} />
					</ListItemIcon>
					<Typography variant="body2">Duplicar</Typography>
				</MenuItem>
				<Divider />
				<MenuItem onClick={() => selectedRow && handleDelete(selectedRow._id)}>
					<ListItemIcon>
						<Trash size={18} color={theme.palette.error.main} />
					</ListItemIcon>
					<Typography variant="body2" color="error">
						Eliminar
					</Typography>
				</MenuItem>
			</Menu>

			<CardContent>
				{/* Enhanced Stats Cards */}
				<Grid container spacing={3} sx={{ mb: 4 }}>
					<Grid item xs={12} md={6}>
						<motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
							<StatsCard
								title="Monto Reclamado"
								value={formatAmount(folderData?.monto || null)}
								icon={<Calculator size={80} />}
								color="primary"
								subtitle="Monto inicial del reclamo"
								isLoading={isLoader}
							/>
						</motion.div>
					</Grid>
					<Grid item xs={12} md={6}>
						<motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
							<StatsCard
								title="Último Ofrecimiento"
								value={latestOfferedAmount !== null ? formatAmount(latestOfferedAmount) : "Sin ofertas"}
								trend={calculateTrend}
								icon={<TrendUp size={80} />}
								color={latestOfferedAmount ? "success" : "warning"}
								subtitle={differencePercentage ? `${differencePercentage}% del monto reclamado` : "Aún no hay ofertas registradas"}
								isLoading={isLoader}
							/>
						</motion.div>
					</Grid>
				</Grid>

				{/* Difference Indicator */}
				{folderData?.monto && latestOfferedAmount && (
					<Fade in timeout={500}>
						<Paper
							elevation={0}
							sx={{
								p: 2,
								mb: 3,
								bgcolor: alpha(theme.palette.info.main, 0.08),
								border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
								borderRadius: 2,
							}}
						>
							<Stack direction="row" spacing={2} alignItems="center">
								<InfoCircle size={20} color={theme.palette.info.main} />
								<Box flex={1}>
									<Typography variant="body2" color="text.secondary">
										Diferencia entre reclamo y ofrecimiento
									</Typography>
									<Typography variant="h6" color="info.main">
										{formatAmount(folderData.monto - latestOfferedAmount)} ({100 - parseFloat(differencePercentage || "0")}%)
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={parseFloat(differencePercentage || "0")}
									sx={{
										width: 100,
										height: 8,
										borderRadius: 4,
										bgcolor: "grey.200",
										"& .MuiLinearProgress-bar": {
											borderRadius: 4,
											bgcolor: "success.main",
										},
									}}
								/>
							</Stack>
						</Paper>
					</Fade>
				)}

				{/* Filters Section */}
				<Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<Typography variant="subtitle2" color="text.secondary">
						{sortedData.length} {sortedData.length === 1 ? "cálculo registrado" : "cálculos registrados"}
					</Typography>
					<Tooltip title="Filtros">
						<IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
							<Filter size={18} />
						</IconButton>
					</Tooltip>
				</Box>

				<Collapse in={showFilters}>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							mb: 2,
							bgcolor: "grey.50",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 1,
						}}
					>
						<Typography variant="body2" color="text.secondary">
							Los filtros estarán disponibles próximamente
						</Typography>
					</Paper>
				</Collapse>

				{/* Enhanced Table */}
				<SimpleBar sx={{ maxHeight: 350 }}>
					<TableContainer>
						<Table
							sx={{
								"& .MuiTableCell-root": {
									py: 2,
									px: 2,
								},
								"& .MuiTableRow-root": {
									transition: "all 0.2s ease",
									cursor: "pointer",
									"&:hover": {
										bgcolor: alpha(theme.palette.primary.main, 0.04),
										transform: "translateX(4px)",
									},
								},
							}}
						>
							<TableHead>
								<TableRow>
									{["Fecha", "Tipo", "Parte", "Monto", "Acciones"].map((header, index) => (
										<TableCell
											key={header}
											align={index >= 3 ? "right" : "left"}
											sx={{
												fontWeight: 600,
												color: "text.secondary",
												fontSize: "0.875rem",
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
												onMouseEnter={() => setHoveredRow(row._id)}
												onMouseLeave={() => setHoveredRow(null)}
												style={{ position: "relative" }}
											>
												<TableCell>
													<LoadingContent
														isLoader={isLoader}
														content={
															<Stack spacing={0.5}>
																<Typography variant="body2" fontWeight={500}>
																	{row.date || "N/D"}
																</Typography>
																<Typography variant="caption" color="text.secondary">
																	{dayjs(row.date, "DD/MM/YYYY").fromNow()}
																</Typography>
															</Stack>
														}
														skeleton={<Skeleton width={80} />}
													/>
												</TableCell>
												<TableCell>
													<LoadingContent isLoader={isLoader} content={getTypeChip(row.type || "N/D")} skeleton={<Skeleton width={80} />} />
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
															<Stack spacing={0.5} alignItems="flex-end">
																<Typography variant="body1" fontWeight={600}>
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
																			{Math.abs(((row.amount - sortedData[index - 1].amount) / sortedData[index - 1].amount) * 100).toFixed(
																				1,
																			)}
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
															<Fade in={hoveredRow === row._id} timeout={200}>
																<IconButton
																	size="small"
																	onClick={(e) => handleMenuOpen(e, row)}
																	sx={{
																		opacity: hoveredRow === row._id ? 1 : 0.3,
																		transition: "opacity 0.2s ease",
																	}}
																>
																	<More size={18} />
																</IconButton>
															</Fade>
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

				{/* Enhanced Action Buttons */}
				<Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
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
							sx={{
								boxShadow: theme.shadows[4],
								"&:hover": {
									boxShadow: theme.shadows[8],
								},
							}}
						>
							Agregar cálculo
						</Button>
					</Stack>
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default CalcTableEnhanced;
