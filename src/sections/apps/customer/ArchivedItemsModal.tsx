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
} from "@mui/material";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import EmptyResults from "./EmptyResults";

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
		>
			<DialogTitle id="archived-items-modal-title">
				<Typography variant="h5">{title}</Typography>
			</DialogTitle>
			<Divider />

			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
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
					<Paper sx={{ width: "100%", overflow: "hidden" }}>
						<TableContainer sx={{ maxHeight: 440 }}>
							<Table stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell padding="checkbox">
											<Checkbox
												indeterminate={selected.length > 0 && selected.length < items.length}
												checked={items.length > 0 && selected.length === items.length}
												onChange={handleSelectAllClick}
												inputProps={{ "aria-label": "select all items" }}
											/>
										</TableCell>
										{columns.map((column) => (
											<TableCell key={column.id} style={{ minWidth: column.minWidth }}>
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
												sx={{ cursor: "pointer" }}
											>
												<TableCell padding="checkbox">
													<Checkbox checked={isItemSelected} />
												</TableCell>

												{itemType === "contacts" ? (
													<>
														<TableCell>
															<Typography variant="body2">{`${item.name} ${item.lastName || ""}`}</Typography>
														</TableCell>
														<TableCell>{item.email}</TableCell>
														<TableCell>{item.phone}</TableCell>
													</>
												) : (
													<>
														<TableCell>{item.folderName}</TableCell>
														<TableCell>{item.materia}</TableCell>
														<TableCell>{item.status}</TableCell>
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

			<DialogActions sx={{ p: 2.5, justifyContent: "space-between" }}>
				<Button onClick={onClose} disabled={loading} color="secondary" variant="outlined">
					Cancelar
				</Button>
				<Button
					onClick={handleUnarchive}
					variant="contained"
					color="primary"
					disabled={selected.length === 0 || loading}
					startIcon={loading && <CircularProgress size={16} color="inherit" />}
				>
					{loading ? "Procesando..." : `Desarchivar ${selected.length > 0 ? `(${selected.length})` : ""}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ArchivedItemsModal;
