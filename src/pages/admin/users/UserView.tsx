import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { dispatch } from "store/index";

// material-ui
import {
	Avatar,
	Button,
	Chip,
	Divider,
	Grid,
	Paper,
	Stack,
	Tab,
	Tabs,
	Typography,
	useTheme,
	Box,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { getUserById } from "store/reducers/users";
import { DefaultRootStateProps } from "types/root";
import { User, Subscription } from "types/user";
import DeleteUserDialog from "./DeleteUserDialog";
import EditUserModal from "./EditUserModal";

// assets
import { User as UserIcon, Wallet, Lock, Calendar } from "iconsax-react";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`user-tabpanel-${index}`} aria-labelledby={`user-tab-${index}`} {...other}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

interface UserViewProps {
	user: User;
	onClose: () => void;
}

const UserView: React.FC<UserViewProps> = ({ user, onClose }) => {
	const theme = useTheme();
	const { user: userDetails } = useSelector((state: DefaultRootStateProps) => state.users);

	// Estados para los modales
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [tabValue, setTabValue] = useState(0);

	useEffect(() => {
		if (user?.id) {
			dispatch(getUserById(user.id));
		}
	}, [user]);

	// Información combinada (datos de la fila + detalles completos de la API)
	const userData = userDetails || user;

	// Manejadores de eventos para los botones
	const handleEditClick = () => {
		setEditModalOpen(true);
	};

	const handleDeleteClick = () => {
		setDeleteDialogOpen(true);
	};

	// Manejadores para cerrar modales
	const handleEditModalClose = () => {
		setEditModalOpen(false);
	};

	const handleDeleteDialogClose = () => {
		setDeleteDialogOpen(false);
		// Si el usuario fue eliminado, cerrar el diálogo principal
		if (!userDetails) {
			onClose();
		}
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	// Renderizado de chip de estado
	const renderStatusChip = (status: string) => {
		let color;
		let label;

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
					fontSize: "0.875rem",
				}}
			/>
		);
	};

	// Renderizar información de la suscripción
	const renderSubscriptionInfo = (subscription?: Subscription) => {
		if (!subscription) {
			return (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
						borderRadius: 2,
					}}
				>
					<Typography variant="body1" align="center">
						El usuario no tiene una suscripción activa.
					</Typography>
				</Paper>
			);
		}

		return (
			<Stack spacing={3}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Plan</Typography>
					<Chip
						label={subscription.name}
						size="small"
						color="primary"
						sx={{
							borderRadius: "4px",
							fontSize: "0.875rem",
						}}
					/>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Estado</Typography>
					{renderStatusChip(subscription.status)}
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Fecha de inicio</Typography>
					<Typography variant="body2">{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : "-"}</Typography>
				</Stack>

				{subscription.endDate && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1">Fecha de finalización</Typography>
						<Typography variant="body2">{new Date(subscription.endDate).toLocaleDateString()}</Typography>
					</Stack>
				)}

				{subscription.paymentInfo && (
					<>
						<Divider />
						<Typography variant="subtitle1">Información de pago</Typography>

						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2 }}>
							<Typography variant="body2">Método</Typography>
							<Typography variant="body2" fontWeight="medium">
								{subscription.paymentInfo.method}
							</Typography>
						</Stack>

						{subscription.paymentInfo.lastPayment && (
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2 }}>
								<Typography variant="body2">Último pago</Typography>
								<Typography variant="body2">{new Date(subscription.paymentInfo.lastPayment).toLocaleDateString()}</Typography>
							</Stack>
						)}

						{subscription.paymentInfo.nextPayment && (
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2 }}>
								<Typography variant="body2">Próximo pago</Typography>
								<Typography variant="body2">{new Date(subscription.paymentInfo.nextPayment).toLocaleDateString()}</Typography>
							</Stack>
						)}
					</>
				)}

				{subscription.features && Object.entries(subscription.features).filter(([_, value]) => value).length > 0 && (
					<>
						<Divider />
						<Typography variant="subtitle1">Características incluidas</Typography>
						<List dense disablePadding>
							{Object.entries(subscription.features)
								.filter(([_, enabled]) => enabled)
								.map(([featureName, _], index) => (
									<ListItem key={index} sx={{ py: 0.5 }}>
										<ListItemText primary={featureName} />
									</ListItem>
								))}
						</List>
					</>
				)}

				{subscription.limits && Object.keys(subscription.limits).length > 0 && (
					<>
						<Divider />
						<Typography variant="subtitle1">Límites</Typography>
						{Object.entries(subscription.limits).map(([key, value], index) => (
							<Stack key={index} direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2 }}>
								<Typography variant="body2" sx={{ textTransform: "capitalize" }}>
									{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
								</Typography>
								<Typography variant="body2" fontWeight="medium">
									{value}
								</Typography>
							</Stack>
						))}
					</>
				)}
			</Stack>
		);
	};

	// Renderiza información de actividad
	const renderActivityInfo = () => {
		return (
			<Stack spacing={2}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Último acceso</Typography>
					<Typography variant="body2">{userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : "Nunca"}</Typography>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Fecha de registro</Typography>
					<Typography variant="body2">{userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "-"}</Typography>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Última actualización</Typography>
					<Typography variant="body2">{userData?.updatedAt ? new Date(userData.updatedAt).toLocaleString() : "-"}</Typography>
				</Stack>

				{/* Aquí se pueden agregar más datos de actividad cuando estén disponibles */}
				{/* Como historial de accesos, acciones recientes, etc. */}
			</Stack>
		);
	};

	// Renderizar configuración y preferencias
	const renderPreferences = () => {
		return (
			<Stack spacing={2}>
				{/* Aquí pueden agregarse preferencias del usuario cuando estén disponibles */}
				{/* Como preferencias de notificaciones, idioma, etc. */}
				<Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
					La información de preferencias no está disponible actualmente.
				</Typography>
			</Stack>
		);
	};

	return (
		<>
			<MainCard title={<Typography variant="h5">Detalles del Usuario</Typography>}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "center", sm: "flex-start" }} spacing={2.5}>
							<Avatar
								alt={userData?.name}
								src={userData?.avatar || "/assets/images/users/default.png"}
								sx={{
									width: { xs: 80, sm: 90 },
									height: { xs: 80, sm: 90 },
									boxShadow: theme.shadows[4],
								}}
							/>
							<Stack spacing={1} sx={{ width: "100%", alignItems: { xs: "center", sm: "flex-start" } }}>
								<Typography variant="h4">{userData?.name}</Typography>
								<Typography variant="body1" color="textSecondary">
									{userData?.email}
								</Typography>
								<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
									{userData?.status && renderStatusChip(userData.status)}
									<Chip
										label={userData?.role}
										size="small"
										sx={{
											borderRadius: "4px",
											backgroundColor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.primary.light,
											color: theme.palette.primary.main,
											fontSize: "0.875rem",
										}}
									/>
								</Stack>
							</Stack>
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Divider />
					</Grid>

					<Grid item xs={12}>
						<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
							<Tabs value={tabValue} onChange={handleTabChange} aria-label="user tabs" variant="scrollable" scrollButtons="auto">
								<Tab
									icon={<UserIcon size={18} />}
									iconPosition="start"
									label="Información General"
									id="user-tab-0"
									aria-controls="user-tabpanel-0"
								/>
								<Tab icon={<Wallet size={18} />} iconPosition="start" label="Suscripción" id="user-tab-1" aria-controls="user-tabpanel-1" />
								<Tab icon={<Calendar size={18} />} iconPosition="start" label="Actividad" id="user-tab-2" aria-controls="user-tabpanel-2" />
								<Tab icon={<Lock size={18} />} iconPosition="start" label="Preferencias" id="user-tab-3" aria-controls="user-tabpanel-3" />
							</Tabs>
						</Box>

						<TabPanel value={tabValue} index={0}>
							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<Stack spacing={3}>
										<Typography variant="h6">Información Personal</Typography>
										<Stack spacing={2}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">Nombre completo</Typography>
												<Typography variant="body2">{userData?.name || "-"}</Typography>
											</Stack>

											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">Correo electrónico</Typography>
												<Typography variant="body2">{userData?.email || "-"}</Typography>
											</Stack>

											{userData?.phone && (
												<Stack direction="row" justifyContent="space-between" alignItems="center">
													<Typography variant="subtitle1">Teléfono</Typography>
													<Typography variant="body2">{userData.phone}</Typography>
												</Stack>
											)}
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={12} md={6}>
									<Stack spacing={3}>
										<Typography variant="h6">Información de Cuenta</Typography>
										<Stack spacing={2}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">ID</Typography>
												<Typography
													variant="body2"
													sx={{
														maxWidth: "180px",
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{userData?.id || "-"}
												</Typography>
											</Stack>

											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">Rol</Typography>
												<Chip
													label={userData?.role || "Sin rol"}
													size="small"
													sx={{
														borderRadius: "4px",
														backgroundColor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.primary.light,
														color: theme.palette.primary.main,
														fontSize: "0.75rem",
													}}
												/>
											</Stack>

											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">Estado</Typography>
												{userData?.status ? renderStatusChip(userData.status) : "-"}
											</Stack>

											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">Fecha de registro</Typography>
												<Typography variant="body2">
													{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "-"}
												</Typography>
											</Stack>
										</Stack>
									</Stack>
								</Grid>
							</Grid>
						</TabPanel>

						<TabPanel value={tabValue} index={1}>
							{renderSubscriptionInfo(userData?.subscription)}
						</TabPanel>

						<TabPanel value={tabValue} index={2}>
							{renderActivityInfo()}
						</TabPanel>

						<TabPanel value={tabValue} index={3}>
							{renderPreferences()}
						</TabPanel>
					</Grid>

					<Grid item xs={12}>
						<Divider />
					</Grid>

					<Grid item xs={12}>
						<Stack direction="row" spacing={1} justifyContent="flex-end">
							<Button variant="outlined" color="error" onClick={handleDeleteClick}>
								Eliminar Usuario
							</Button>
							<Button variant="contained" onClick={handleEditClick}>
								Editar Usuario
							</Button>
						</Stack>
					</Grid>
				</Grid>
			</MainCard>

			{/* Modal para editar usuario */}
			{editModalOpen && userData && <EditUserModal user={userData} open={editModalOpen} onClose={handleEditModalClose} />}

			{/* Diálogo para confirmar eliminación */}
			{deleteDialogOpen && userData && <DeleteUserDialog user={userData} open={deleteDialogOpen} onClose={handleDeleteDialogClose} />}
		</>
	);
};

export default UserView;
