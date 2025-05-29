import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { dispatch } from "store/index";

// material-ui
import {
	Box,
	Button,
	Chip,
	Dialog,
	Divider,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import { getUsers } from "store/reducers/users";
import { DefaultRootStateProps } from "types/root";
import { User } from "types/user";
import UserView from "./UserView";
import TableSkeleton from "components/UI/TableSkeleton";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import GenerateDataModal from "./GenerateDataModal";

// assets
import { Eye, Trash, Edit, Add, Chart } from "iconsax-react";

// table sort
function descendingComparator(a: any, b: any, orderBy: string) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

const getComparator = (order: string, orderBy: string) =>
	order === "desc" ? (a: any, b: any) => descendingComparator(a, b, orderBy) : (a: any, b: any) => -descendingComparator(a, b, orderBy);

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
	const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
	stabilizedThis.sort((a, b) => {
		const order = comparator(a[0], b[0]);
		if (order !== 0) return order;
		return a[1] - b[1];
	});
	return stabilizedThis.map((el) => el[0]);
}

// table header options
const headCells = [
	{
		id: "name",
		numeric: false,
		label: "Nombre",
		align: "left",
	},
	{
		id: "email",
		numeric: false,
		label: "Email",
		align: "left",
	},
	{
		id: "role",
		numeric: false,
		label: "Rol",
		align: "left",
	},
	{
		id: "status",
		numeric: false,
		label: "Estado",
		align: "left",
	},
	{
		id: "lastLogin",
		numeric: false,
		label: "Último Login",
		align: "left",
	},
	{
		id: "actions",
		numeric: false,
		label: "Acciones",
		align: "center",
	},
];

// ==============================|| USERS ADMIN PAGE ||============================== //

const UsersList = () => {
	const theme = useTheme();

	const { users, loading, error } = useSelector((state: DefaultRootStateProps) => state.users);

	// Estado para la paginación
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Estado para ordenamiento
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [orderBy, setOrderBy] = useState("name");

	// Estado para el diálogo de detalles de usuario
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	// Estados para los modales de agregar, editar y eliminar
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [generateDataModalOpen, setGenerateDataModalOpen] = useState(false);

	const handleRequestSort = (property: string) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};

	const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined) => {
		event?.target.value && setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleUserView = (user: User) => {
		setSelectedUser(user);
		setViewDialogOpen(true);
	};

	const handleUserEdit = (user: User) => {
		setSelectedUser(user);
		setEditModalOpen(true);
	};

	const handleUserDelete = (user: User) => {
		setSelectedUser(user);
		setDeleteDialogOpen(true);
	};

	const handleGenerateData = (user: User) => {
		setSelectedUser(user);
		setGenerateDataModalOpen(true);
	};

	const handleAddUser = () => {
		setAddModalOpen(true);
	};

	const handleCloseViewDialog = () => {
		setViewDialogOpen(false);
		setSelectedUser(null);
	};

	const handleCloseAddModal = () => {
		setAddModalOpen(false);
	};

	const handleCloseEditModal = () => {
		setEditModalOpen(false);
		setSelectedUser(null);
	};

	const handleCloseDeleteDialog = () => {
		setDeleteDialogOpen(false);
		setSelectedUser(null);
	};

	const handleCloseGenerateDataModal = () => {
		setGenerateDataModalOpen(false);
		setSelectedUser(null);
	};

	useEffect(() => {
		dispatch(getUsers());
	}, []);

	// Aplicamos paginación y ordenamiento
	const visibleRows = useMemo(() => {
		if (!users || !Array.isArray(users) || users.length === 0) {
			return [];
		}

		return stableSort<User>(users as User[], getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [users, order, orderBy, page, rowsPerPage]);

	// Renderizado de chip de estado
	const renderStatusChip = (status: string | undefined | null) => {
		let color;
		let label;

		// Si status es undefined o null, usar un valor por defecto
		if (!status) {
			color = "default";
			label = "Desconocido";
			return (
				<Chip
					label={label}
					size="small"
					color={color as any}
					sx={{
						borderRadius: "4px",
						minWidth: 80,
						"& .MuiChip-label": {
							px: 1.5,
						},
					}}
				/>
			);
		}

		// Si status existe, procesar normalmente
		switch (status.toLowerCase()) {
			case "active":
			case "activo":
				color = "success";
				label = "Activo";
				break;
			case "inactive":
			case "inactivo":
				color = "error";
				label = "Inactivo";
				break;
			case "pending":
			case "pendiente":
				color = "warning";
				label = "Pendiente";
				break;
			default:
				color = "primary";
				label = status;
		}

		return (
			<Chip
				label={label}
				size="small"
				color={color as any}
				sx={{
					borderRadius: "4px",
					minWidth: 80,
					"& .MuiChip-label": {
						px: 1.5,
					},
				}}
			/>
		);
	};

	return (
		<MainCard title="Administración de Usuarios" content={false}>
			<ScrollX>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
					<Typography variant="h5">Lista de Usuarios</Typography>
					<Button variant="contained" color="primary" onClick={handleAddUser} startIcon={<Add />}>
						Agregar Usuario
					</Button>
				</Stack>
				<Divider />

				<TableContainer>
					<Table>
						<TableHead>
							<TableRow key="header-row">
								{headCells.map((headCell) => (
									<TableCell
										key={headCell.id}
										align={headCell.align as any}
										sortDirection={orderBy === headCell.id ? order : false}
										sx={{ py: 2 }}
									>
										{headCell.id === "actions" ? (
											headCell.label
										) : (
											<Box component="span" onClick={() => handleRequestSort(headCell.id)} sx={{ cursor: "pointer" }}>
												{headCell.label}
												{orderBy === headCell.id ? <Box component="span">{order === "desc" ? " ▼" : " ▲"}</Box> : null}
											</Box>
										)}
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{/* Skeleton de carga */}
							{loading && <TableSkeleton columns={headCells.length} rows={rowsPerPage} />}

							{/* Mensaje de error */}
							{!loading && error && (
								<TableRow key="error-row">
									<TableCell colSpan={headCells.length} align="center" sx={{ py: 8 }}>
										<Stack spacing={2} alignItems="center">
											<Box
												sx={{
													width: 80,
													height: 80,
													borderRadius: "50%",
													backgroundColor: (theme) => (theme.palette.mode === "dark" ? "error.dark" : "error.lighter"),
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													mb: 2,
												}}
											>
												<Typography variant="h2" color="error.main">
													!
												</Typography>
											</Box>
											<Typography variant="h5" color="text.primary" gutterBottom>
												Ups, algo salió mal
											</Typography>
											<Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
												{error?.toLowerCase().includes("network") || error?.toLowerCase().includes("conexión")
													? "Parece que hay problemas de conexión. Verifica tu acceso a internet e intenta de nuevo."
													: error?.toLowerCase().includes("unauthorized") || error?.toLowerCase().includes("401")
													? "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."
													: error?.toLowerCase().includes("forbidden") || error?.toLowerCase().includes("403")
													? "No tienes permisos para ver esta información. Contacta al administrador."
													: error?.toLowerCase().includes("server") || error?.toLowerCase().includes("500")
													? "Nuestros servidores están experimentando problemas. Intenta más tarde."
													: "No pudimos cargar la lista de usuarios. Por favor, intenta nuevamente."}
											</Typography>
											{error && (
												<Box
													sx={{
														mt: 2,
														p: 1,
														borderRadius: 1,
														backgroundColor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"),
														maxWidth: 400,
														width: "100%",
													}}
												>
													<Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
														Error técnico: {error}
													</Typography>
												</Box>
											)}
											<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
												<Button variant="contained" color="primary" onClick={() => dispatch(getUsers())}>
													Reintentar
												</Button>
												<Button variant="outlined" color="primary" onClick={() => window.location.reload()}>
													Recargar página
												</Button>
											</Stack>
										</Stack>
									</TableCell>
								</TableRow>
							)}

							{/* No hay resultados */}
							{!loading && !error && (!users || users.length === 0) && (
								<TableRow key="empty-row">
									<TableCell colSpan={headCells.length} align="center" sx={{ py: 8 }}>
										<Stack spacing={3} alignItems="center">
											<Box
												sx={{
													width: 100,
													height: 100,
													borderRadius: "50%",
													backgroundColor: theme.palette.mode === "dark" ? "background.paper" : "grey.100",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													mb: 2,
												}}
											>
												<Add size={48} color={theme.palette.text.secondary} />
											</Box>
											<Stack spacing={1} alignItems="center">
												<Typography variant="h5" color="text.primary">
													Comienza agregando usuarios
												</Typography>
												<Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
													Aún no hay usuarios registrados en el sistema. Agrega el primer usuario para comenzar a gestionar tu equipo.
												</Typography>
											</Stack>
											<Button variant="contained" color="primary" onClick={handleAddUser} startIcon={<Add />} size="large" sx={{ mt: 2 }}>
												Agregar Primer Usuario
											</Button>
										</Stack>
									</TableCell>
								</TableRow>
							)}

							{/* Listado de usuarios */}
							{!loading &&
								!error &&
								users &&
								users.length > 0 &&
								visibleRows.map((userItem, index) => {
									const user = userItem as User;
									return (
										<TableRow hover role="checkbox" tabIndex={-1} key={user._id || user.id || `user-row-${index}`}>
											<TableCell>
												<Stack direction="row" alignItems="center" spacing={1.5}>
													<Stack>
														<Typography variant="subtitle1">{user.name || "Sin nombre"}</Typography>
													</Stack>
												</Stack>
											</TableCell>
											<TableCell>{user.email || "No disponible"}</TableCell>
											<TableCell>
												<Chip
													label={user.role || "Sin rol"}
													size="small"
													sx={{
														borderRadius: "4px",
														minWidth: 80,
														background: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.primary.light,
														color: theme.palette.primary.main,
														"& .MuiChip-label": {
															px: 1.5,
														},
													}}
												/>
											</TableCell>
											<TableCell>{renderStatusChip(user.status)}</TableCell>
											<TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Nunca"}</TableCell>
											<TableCell align="center">
												<Stack direction="row" justifyContent="center" alignItems="center">
													<Tooltip title="Ver detalles">
														<IconButton color="primary" onClick={() => handleUserView(user)}>
															<Eye size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Editar">
														<IconButton color="primary" onClick={() => handleUserEdit(user)}>
															<Edit size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Generar datos">
														<IconButton color="success" onClick={() => handleGenerateData(user)}>
															<Chart size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Eliminar">
														<IconButton color="error" onClick={() => handleUserDelete(user)}>
															<Trash size={18} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
				</TableContainer>

				{/* Paginación (solo se muestra cuando hay usuarios) */}
				{!loading && !error && users && users.length > 0 && (
					<TablePagination
						rowsPerPageOptions={[5, 10, 25]}
						component="div"
						count={users.length}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={handleChangePage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						labelRowsPerPage="Filas por página:"
						labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
					/>
				)}
			</ScrollX>

			{/* Diálogo para ver los detalles de un usuario */}
			{selectedUser && (
				<Dialog
					open={viewDialogOpen}
					onClose={handleCloseViewDialog}
					maxWidth="md"
					fullWidth
					sx={{
						"& .MuiDialog-paper": {
							height: "90vh",
							maxHeight: "900px",
							display: "flex",
							flexDirection: "column",
						},
					}}
				>
					<UserView user={selectedUser} onClose={handleCloseViewDialog} />
				</Dialog>
			)}

			{/* Modal para agregar un nuevo usuario */}
			<AddUserModal open={addModalOpen} onClose={handleCloseAddModal} />

			{/* Modal para editar usuario */}
			{selectedUser && <EditUserModal user={selectedUser} open={editModalOpen} onClose={handleCloseEditModal} />}

			{/* Diálogo para confirmar eliminación */}
			{selectedUser && <DeleteUserDialog user={selectedUser} open={deleteDialogOpen} onClose={handleCloseDeleteDialog} />}

			{/* Modal para generar datos de usuario */}
			{selectedUser && <GenerateDataModal user={selectedUser} open={generateDataModalOpen} onClose={handleCloseGenerateDataModal} />}
		</MainCard>
	);
};

export default UsersList;
