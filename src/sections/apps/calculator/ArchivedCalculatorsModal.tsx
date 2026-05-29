import React from "react";
import { useEffect, useState, useMemo, SyntheticEvent } from "react";

// material-ui
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControl,
	IconButton,
	MenuItem,
	Pagination,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import { Archive, Calculator, Chart2, CloseSquare, Coin, InfoCircle, Warning2 } from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// types
import { CalculatorType, CalculatorPaginationInfo } from "types/calculator";
import dayjs from "utils/dayjs-config";

interface ArchivedCalculatorsModalProps {
	open: boolean;
	onClose: () => void;
	items: CalculatorType[];
	onUnarchive: (selectedIds: string[]) => void;
	loading: boolean;
	pagination?: CalculatorPaginationInfo;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
}

// ==============================|| ARCHIVED CALCULATORS MODAL ||============================== //

const ArchivedCalculatorsModal = ({
	open,
	onClose,
	items,
	onUnarchive,
	loading,
	pagination,
	onPageChange,
	onPageSizeChange,
}: ArchivedCalculatorsModalProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [selected, setSelected] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setSelected([]);
			setError(null);
		}
	}, [open]);

	const columns = useMemo(
		() => [
			{ id: "date", label: "Fecha", minWidth: 100 },
			{ id: "folderName", label: "Carátula", minWidth: 170 },
			{ id: "type", label: "Tipo", minWidth: 100 },
			{ id: "classType", label: "Categoría", minWidth: 110 },
			{ id: "amount", label: "Importe", minWidth: 110 },
		],
		[],
	);

	const handleClick = (id: string) => {
		const idx = selected.indexOf(id);
		setSelected(idx === -1 ? [...selected, id] : selected.filter((itemId) => itemId !== id));
	};

	const handleSelectAllClick = (event: SyntheticEvent) => {
		if ((event.target as HTMLInputElement).checked) {
			setSelected(items.map((item) => item._id));
			return;
		}
		setSelected([]);
	};

	const handleUnarchive = () => {
		if (selected.length === 0) {
			setError("Debés seleccionar al menos un cálculo para desarchivar.");
			return;
		}
		setError(null);
		onUnarchive(selected);
	};

	const isSelected = (id: string) => selected.indexOf(id) !== -1;

	const getClassTypeIcon = (type?: string) => {
		switch (type) {
			case "laboral":
				return <Calculator size={13} variant="Linear" />;
			case "civil":
				return <Chart2 size={13} variant="Linear" />;
			case "intereses":
				return <Coin size={13} variant="Linear" />;
			default:
				return null;
		}
	};

	const getClassTypeLabel = (type?: string) => {
		switch (type) {
			case "laboral":
				return "Laboral";
			case "civil":
				return "Civil";
			case "intereses":
				return "Intereses";
			default:
				return "No especificado";
		}
	};

	// ── Brand helpers ───────────────────────────────────────────────────────
	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.82rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};
	const checkboxSx = {
		color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
		"&.Mui-checked": { color: BRAND_BLUE },
		"&.MuiCheckbox-indeterminate": { color: BRAND_BLUE },
	};
	const paginationSx = {
		"& .MuiPaginationItem-root": {
			fontWeight: 600,
			color: "text.secondary",
			borderRadius: 1,
			"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06), color: BRAND_BLUE },
		},
		"& .Mui-selected": {
			bgcolor: `${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)} !important`,
			color: BRAND_BLUE,
			border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.4 : 0.28)}`,
		},
	};
	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-root": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			color: "text.secondary",
			fontSize: "0.68rem",
			fontWeight: 600,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
			py: 1.25,
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
			fontSize: "0.82rem",
		},
		"& .MuiTableBody-root .MuiTableRow-root": { transition: "background-color 0.12s ease" },
		"& .MuiTableBody-root .MuiTableRow-root:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035), cursor: "pointer" },
		"& .MuiTableBody-root .MuiTableRow-root.Mui-selected, & .MuiTableBody-root .MuiTableRow-root.Mui-selected:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
		},
	};

	// Pill brand para "Tipo" (Calculado/Ofertado/Reclamado)
	const TypePill = ({ value }: { value: string }) => {
		const map: Record<string, string> = {
			Calculado: BRAND_BLUE,
			Ofertado: LIVE_GREEN,
			Reclamado: STALE_AMBER,
		};
		const color = map[value] ?? theme.palette.text.secondary;
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.625,
					px: 0.875,
					py: 0.25,
					borderRadius: 0.75,
					bgcolor: alpha(color, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(color, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
				<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
					{value}
				</Typography>
			</Box>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			TransitionComponent={PopupTransition}
			keepMounted
			maxWidth="md"
			fullWidth
			aria-labelledby="archived-calculators-modal-title"
			PaperProps={{ sx: dialogPaperSx }}
		>
			{/* Header brand atmosférico */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					p: { xs: 2.25, sm: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 220,
						height: 220,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Archive size={20} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={0.75} alignItems="center">
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
								Archivo
							</Typography>
						</Stack>
						<Typography
							id="archived-calculators-modal-title"
							sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}
						>
							Cálculos archivados
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Seleccioná los cálculos archivados para recuperarlos.
						</Typography>
					</Stack>
					<IconButton
						onClick={onClose}
						disabled={loading}
						sx={{
							color: "text.secondary",
							borderRadius: 1,
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
						}}
						aria-label="cerrar"
					>
						<CloseSquare size={20} variant="Linear" />
					</IconButton>
				</Stack>
			</Box>

			<DialogContent sx={{ p: { xs: 2, sm: 2.5 }, height: 600, display: "flex", flexDirection: "column" }}>
				{/* Aviso info brand */}
				<Box
					sx={{
						p: 1.5,
						mb: 2,
						borderRadius: 1.25,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
						flexShrink: 0,
					}}
				>
					<Stack direction="row" spacing={1} alignItems="flex-start">
						<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
						<Stack spacing={0.25}>
							<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
								Selección de cálculos
							</Typography>
							<Typography sx={{ fontSize: "0.76rem", color: "text.primary", letterSpacing: "-0.005em" }}>
								Marcá las casillas de los cálculos que querés desarchivar.
							</Typography>
						</Stack>
					</Stack>
				</Box>

				{error && (
					<Box
						sx={{
							p: 1.5,
							mb: 2,
							borderRadius: 1.25,
							bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.04),
							border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
							flexShrink: 0,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<Warning2 size={16} variant="Bulk" color={theme.palette.error.main} />
							<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>{error}</Typography>
						</Stack>
					</Box>
				)}

				<Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
					{loading ? (
						<Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={1.25}>
							<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								Cargando cálculos archivados…
							</Typography>
						</Stack>
					) : items.length === 0 ? (
						<Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }} spacing={1.25}>
							<Box
								sx={{
									width: 56,
									height: 56,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
								}}
							>
								<Archive size={26} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
								Sin cálculos archivados
							</Typography>
							<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center" }}>
								Los elementos archivados aparecerán acá.
							</Typography>
						</Stack>
					) : (
						<Box
							sx={{
								borderRadius: 1.5,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
								overflow: "hidden",
								flex: 1,
								display: "flex",
								flexDirection: "column",
								bgcolor: "background.paper",
							}}
						>
							<TableContainer sx={{ flex: 1, minHeight: 0 }}>
								<Table stickyHeader sx={tableSx}>
									<TableHead>
										<TableRow>
											<TableCell padding="checkbox" sx={{ position: "sticky !important", top: 0, zIndex: 2 }}>
												<Checkbox
													indeterminate={selected.length > 0 && selected.length < items.length}
													checked={items.length > 0 && selected.length === items.length}
													onChange={handleSelectAllClick}
													inputProps={{ "aria-label": "select all items" }}
													sx={checkboxSx}
												/>
											</TableCell>
											{columns.map((column) => (
												<TableCell
													key={column.id}
													style={{ minWidth: column.minWidth }}
													sx={{ position: "sticky !important", top: 0, zIndex: 2 }}
												>
													{column.label}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{items.map((item) => {
											const isItemSelected = isSelected(item._id);
											return (
												<TableRow
													hover
													onClick={() => handleClick(item._id)}
													role="checkbox"
													aria-checked={isItemSelected}
													tabIndex={-1}
													key={item._id}
													selected={isItemSelected}
												>
													<TableCell padding="checkbox">
														<Checkbox checked={isItemSelected} sx={checkboxSx} />
													</TableCell>
													<TableCell>
														<Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
															{dayjs(item.date).format("DD/MM/YYYY")}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography
															sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}
														>
															{item.folderName || "Sin carátula"}
														</Typography>
													</TableCell>
													<TableCell>
														<TypePill value={item.type} />
													</TableCell>
													<TableCell>
														<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
															{getClassTypeIcon(item.classType)}
															<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em" }}>
																{getClassTypeLabel(item.classType)}
															</Typography>
														</Stack>
													</TableCell>
													<TableCell>
														<Typography
															sx={{
																fontSize: "0.85rem",
																fontWeight: 600,
																color: "text.primary",
																fontVariantNumeric: "tabular-nums",
															}}
														>
															{new Intl.NumberFormat("es-AR", {
																style: "currency",
																currency: "ARS",
															}).format(item.amount)}
														</Typography>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>
					)}
				</Box>

				{pagination && (
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ xs: "stretch", sm: "center" }}
						justifyContent="space-between"
						spacing={1.5}
						sx={{ mt: 2, flexShrink: 0 }}
					>
						<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
							<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								{items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–
								{Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
								<Box component="span" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "text.primary" }}>
									{pagination.total}
								</Box>
							</Typography>
							{onPageSizeChange && (
								<FormControl size="small" sx={{ minWidth: 120 }}>
									<Select
										value={pagination.limit}
										onChange={(e) => onPageSizeChange(Number(e.target.value))}
										disabled={loading}
										sx={selectSx}
									>
										<MenuItem value={5}>5 por página</MenuItem>
										<MenuItem value={10}>10 por página</MenuItem>
										<MenuItem value={25}>25 por página</MenuItem>
										<MenuItem value={50}>50 por página</MenuItem>
									</Select>
								</FormControl>
							)}
						</Stack>
						{onPageChange && (
							<Pagination
								count={pagination.totalPages}
								page={pagination.page}
								onChange={(_event, page) => onPageChange(page)}
								disabled={loading}
								showFirstButton
								showLastButton
								size="small"
								sx={paginationSx}
							/>
						)}
					</Stack>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				<Button onClick={onClose} disabled={loading} sx={ghostBtnSx}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={handleUnarchive}
					disabled={selected.length === 0 || loading}
					startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Archive size={15} variant="Linear" />}
					sx={brandPrimarySx}
				>
					{loading ? "Procesando…" : `Desarchivar${selected.length > 0 ? ` (${selected.length})` : ""}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ArchivedCalculatorsModal;
