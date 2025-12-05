import React from "react";
import { useEffect, useState, useMemo, SyntheticEvent } from "react";

// material-ui
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Checkbox,
	Typography,
	Stack,
	Divider,
	CircularProgress,
	Paper,
	Alert,
	AlertTitle,
	Box,
	Chip,
	useTheme,
	alpha,
	Grid,
	Pagination,
	Select,
	MenuItem,
	FormControl,
} from "@mui/material";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import EmptyResults from "./EmptyResults";
import { Archive, Warning2 } from "iconsax-react"; // Assuming you're using iconsax-react for icons

// types
interface PaginationInfo {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface ArchivedItemsModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	items: any[];
	onUnarchive: (selectedIds: string[]) => void;
	loading: boolean;
	itemType: "folders" | "contacts";
	pagination?: PaginationInfo;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
}

// ==============================|| ARCHIVED ITEMS MODAL ||============================== //

const ArchivedItemsModal = ({
	open,
	onClose,
	title,
	items,
	onUnarchive,
	loading,
	itemType,
	pagination,
	onPageChange,
	onPageSizeChange,
}: ArchivedItemsModalProps) => {
	const [selected, setSelected] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const theme = useTheme();

	// Reset selection when modal changes
	useEffect(() => {
		if (open) {
			setSelected([]);
			setError(null);
		}
	}, [open]);

	// Columns for the table based on item type
	const columns = useMemo(() => {
		if (itemType === "contacts") {
			return [
				{ id: "name", label: "Nombre", minWidth: 170 },
				{ id: "email", label: "Email", minWidth: 170 },
				{ id: "phone", label: "Teléfono", minWidth: 100 },
			];
		} else {
			return [
				{ id: "folderName", label: "Carátula", minWidth: 170 },
				{ id: "materia", label: "Materia", minWidth: 100 },
				{ id: "status", label: "Estado", minWidth: 100 },
			];
		}
	}, [itemType]);

	// Handle selection change
	const handleClick = (id: string) => {
		const selectedIndex = selected.indexOf(id);
		let newSelected: string[] = [];

		if (selectedIndex === -1) {
			newSelected = [...selected, id];
		} else {
			newSelected = selected.filter((itemId) => itemId !== id);
		}

		setSelected(newSelected);
	};

	// Select/deselect all elements
	const handleSelectAllClick = (event: SyntheticEvent) => {
		if ((event.target as HTMLInputElement).checked) {
			const newSelecteds = items.map((item) => item._id);
			setSelected(newSelecteds);
			return;
		}
		setSelected([]);
	};

	// Function to confirm unarchiving
	const handleUnarchive = () => {
		if (selected.length === 0) {
			setError("Debes seleccionar al menos un elemento para desarchivar.");
			return;
		}

		setError(null);
		onUnarchive(selected);
	};

	// Check if an element is selected
	const isSelected = (id: string) => selected.indexOf(id) !== -1;

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			TransitionComponent={PopupTransition}
			keepMounted
			maxWidth="md"
			fullWidth
			aria-labelledby="archived-items-modal-title"
			PaperProps={{
				elevation: 5,
				sx: {
					borderRadius: 2,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="archived-items-modal-title"
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Archive size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							{title}
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						{itemType === "contacts"
							? "Selecciona los contactos archivados para recuperarlos"
							: "Selecciona las causas archivadas para recuperarlas"}
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 2.5, height: 650, display: "flex", flexDirection: "column" }}>
				{/* Notification alert */}
				<Alert
					severity="info"
					icon={<Warning2 variant="Bulk" />}
					sx={{
						mb: 3,
						borderRadius: 1.5,
						border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
						bgcolor: alpha(theme.palette.info.main, 0.1),
						flexShrink: 0,
					}}
				>
					<AlertTitle>{itemType === "contacts" ? "Selección de contactos" : "Selección de causas"}</AlertTitle>
					Selecciona {itemType === "contacts" ? "los contactos" : "las causas"} que deseas desarchivar marcando las casillas
					correspondientes.
				</Alert>

				{error && (
					<Alert
						severity="error"
						sx={{
							mb: 2,
							borderRadius: 1.5,
							border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
							bgcolor: alpha(theme.palette.error.main, 0.1),
							"& .MuiAlert-icon": {
								alignItems: "center",
							},
							flexShrink: 0,
						}}
					>
						{error}
					</Alert>
				)}

				<Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
					{loading ? (
						<Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
							<CircularProgress />
						</Stack>
					) : items.length === 0 ? (
						<Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
							<EmptyResults message={`No hay ${itemType === "contacts" ? "contactos" : "causas"} archivados`} />
						</Stack>
					) : (
						<Paper
							sx={{
								width: "100%",
								overflow: "hidden",
								borderRadius: 2,
								boxShadow: theme.shadows[2],
								flex: 1,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<TableContainer sx={{ maxHeight: 400 }}>
								<Table stickyHeader aria-label="sticky table">
									<TableHead>
										<TableRow>
											<TableCell
												padding="checkbox"
												sx={{
													backgroundColor: theme.palette.background.default,
													borderBottom: `1px solid ${theme.palette.divider}`,
													position: "sticky !important",
													top: 0,
													zIndex: 2,
												}}
											>
												<Checkbox
													indeterminate={selected.length > 0 && selected.length < items.length}
													checked={items.length > 0 && selected.length === items.length}
													onChange={handleSelectAllClick}
													inputProps={{ "aria-label": "select all items" }}
													sx={{
														"&.Mui-checked": {
															color: theme.palette.primary.main,
														},
														"&.MuiCheckbox-indeterminate": {
															color: theme.palette.primary.main,
														},
													}}
												/>
											</TableCell>
											{columns.map((column) => (
												<TableCell
													key={column.id}
													style={{ minWidth: column.minWidth }}
													sx={{
														py: 2,
														backgroundColor: theme.palette.background.default,
														borderBottom: `1px solid ${theme.palette.divider}`,
														position: "sticky !important",
														top: 0,
														zIndex: 2,
													}}
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
													sx={{
														cursor: "pointer",
														"&.Mui-selected": {
															bgcolor: alpha(theme.palette.primary.main, 0.12),
															"&:hover": {
																bgcolor: alpha(theme.palette.primary.main, 0.16),
															},
														},
														"&:hover": {
															bgcolor: alpha(theme.palette.primary.main, 0.04),
														},
													}}
												>
													<TableCell padding="checkbox">
														<Checkbox
															checked={isItemSelected}
															sx={{
																"&.Mui-checked": {
																	color: theme.palette.primary.main,
																},
															}}
														/>
													</TableCell>

													{itemType === "contacts" ? (
														<>
															<TableCell>
																<Typography variant="body2" fontWeight={500}>{`${item.name} ${item.lastName || ""}`}</Typography>
															</TableCell>
															<TableCell>
																<Typography variant="body2" color="text.secondary">
																	{item.email}
																</Typography>
															</TableCell>
															<TableCell>
																<Typography variant="body2">{item.phone}</Typography>
															</TableCell>
														</>
													) : (
														<>
															<TableCell>
																<Typography variant="body2" fontWeight={500}>
																	{item.folderName}
																</Typography>
															</TableCell>
															<TableCell>
																<Typography variant="body2" color="text.secondary">
																	{item.materia}
																</Typography>
															</TableCell>
															<TableCell>
																<Chip
																	label={item.status}
																	size="small"
																	color={item.status === "Activo" ? "success" : "default"}
																	sx={{ borderRadius: 1 }}
																/>
															</TableCell>
														</>
													)}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					)}
				</Box>

				{/* Pagination controls */}
				{pagination && pagination.totalPages > 1 && (
					<Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
						<Stack direction="row" spacing={2} alignItems="center">
							<Typography variant="body2" color="textSecondary">
								Mostrando {items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{" "}
								{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
							</Typography>
							{onPageSizeChange && (
								<FormControl size="small" sx={{ minWidth: 120 }}>
									<Select value={pagination.limit} onChange={(e) => onPageSizeChange(Number(e.target.value))} disabled={loading}>
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
								color="primary"
								disabled={loading}
								showFirstButton
								showLastButton
							/>
						)}
					</Box>
				)}
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid container justifyContent="flex-end" alignItems="center">
					<Grid item>
						<Stack direction="row" spacing={2} alignItems="center">
							<Button onClick={onClose} disabled={loading} color="error" sx={{ minWidth: 100 }}>
								Cancelar
							</Button>
							<Button
								onClick={handleUnarchive}
								variant="contained"
								color="primary"
								disabled={selected.length === 0 || loading}
								startIcon={loading && <CircularProgress size={16} color="inherit" />}
								sx={{ minWidth: 100 }}
							>
								{loading ? "Procesando..." : `Desarchivar ${selected.length > 0 ? `(${selected.length})` : ""}`}
							</Button>
						</Stack>
					</Grid>
				</Grid>
			</DialogActions>
		</Dialog>
	);
};

export default ArchivedItemsModal;
