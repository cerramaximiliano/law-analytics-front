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
} from "@mui/material";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import EmptyResults from "./EmptyResults";
import { Warning2 } from "iconsax-react"; // Asumiendo que estás utilizando iconsax-react para los íconos

// types
interface ArchivedItemsModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	items: any[];
	onUnarchive: (selectedIds: string[]) => void;
	loading: boolean;
	itemType: "folders" | "contacts";
}

// ==============================|| ARCHIVED ITEMS MODAL ||============================== //

const ArchivedItemsModal = ({ open, onClose, title, items, onUnarchive, loading, itemType }: ArchivedItemsModalProps) => {
	const [selected, setSelected] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const theme = useTheme();

	// Resetear selección cuando cambia el modal
	useEffect(() => {
		if (open) {
			setSelected([]);
			setError(null);
		}
	}, [open]);

	// Columnas para la tabla según el tipo de item
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

	// Manejar cambio de selección
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

	// Seleccionar/deseleccionar todos los elementos
	const handleSelectAllClick = (event: SyntheticEvent) => {
		if ((event.target as HTMLInputElement).checked) {
			const newSelecteds = items.map((item) => item._id);
			setSelected(newSelecteds);
			return;
		}
		setSelected([]);
	};

	// Función para confirmar el desarchivar
	const handleUnarchive = () => {
		if (selected.length === 0) {
			setError("Debes seleccionar al menos un elemento para desarchivar.");
			return;
		}

		setError(null);
		onUnarchive(selected);
	};

	// Verificar si un elemento está seleccionado
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
					bgcolor: alpha(theme.palette.primary.main, 0.05),
					py: 2.5,
				}}
			>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>
					{title}
				</Typography>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 3 }}>
				{/* Nuevo aviso informativo */}
				<Alert severity="info" icon={<Warning2 variant="Bulk" />} sx={{ mb: 3, borderRadius: 1.5 }}>
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
							"& .MuiAlert-icon": {
								alignItems: "center",
							},
						}}
					>
						{error}
					</Alert>
				)}

				{loading ? (
					<Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
						<CircularProgress />
					</Stack>
				) : items.length === 0 ? (
					<EmptyResults message={`No hay ${itemType === "contacts" ? "contactos" : "causas"} archivados`} />
				) : (
					<Paper
						sx={{
							width: "100%",
							overflow: "hidden",
							borderRadius: 2,
							boxShadow: theme.shadows[2],
						}}
					>
						<TableContainer sx={{ maxHeight: 440 }}>
							<Table stickyHeader>
								<TableHead>
									<TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
										<TableCell padding="checkbox">
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
													fontWeight: 600,
													py: 2,
													color: theme.palette.text.secondary,
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
			</DialogContent>

			<DialogActions
				sx={{
					p: 3,
					bgcolor: alpha(theme.palette.background.default, 0.7),
				}}
			>
				<Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
					<Button
						onClick={onClose}
						disabled={loading}
						color="error"
						sx={{
							borderRadius: 1.5,
							px: 3,
						}}
					>
						Cancelar
					</Button>
					<Button
						onClick={handleUnarchive}
						variant="contained"
						color="primary"
						disabled={selected.length === 0 || loading}
						startIcon={loading && <CircularProgress size={16} color="inherit" />}
						sx={{
							borderRadius: 1.5,
							px: 3,
							boxShadow: theme.shadows[1],
						}}
					>
						{loading ? "Procesando..." : `Desarchivar ${selected.length > 0 ? `(${selected.length})` : ""}`}
					</Button>
				</Box>
			</DialogActions>
		</Dialog>
	);
};

export default ArchivedItemsModal;
