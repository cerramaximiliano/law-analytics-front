import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

// material-ui
import {
	Alert,
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
	IconButton,
	FormControlLabel,
	Checkbox,
	CircularProgress,
	Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import esLocale from "date-fns/locale/es";

// project imports
import MainCard from "components/MainCard";
import { getUserById, clearUserData } from "store/reducers/users";
import { DefaultRootStateProps } from "types/root";
import { User, Subscription, UserLightData } from "types/user";
import DeleteUserDialog from "./DeleteUserDialog";
import EditUserModal from "./EditUserModal";
import { formatCurrency } from "utils/formatCurrency";

// assets
import {
	User as UserIcon,
	Wallet,
	Lock,
	Calendar,
	Folder2,
	Calculator,
	Profile2User,
	CalendarAdd,
	CardPos,
	Edit2,
	Save2,
	CloseCircle,
	RefreshCircle,
	Setting2,
} from "iconsax-react";

// API and types
import ApiService from "store/reducers/ApiService";
import { StripeCustomerHistory } from "types/stripe-history";
import { useSnackbar } from "notistack";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`user-tabpanel-${index}`} aria-labelledby={`user-tab-${index}`} {...other}>
			{value === index && (
				<Box
					sx={{
						p: 3,
						height: "400px",
						overflowY: "auto",
						"&::-webkit-scrollbar": {
							width: "8px",
						},
						"&::-webkit-scrollbar-track": {
							background: "#f1f1f1",
							borderRadius: "4px",
						},
						"&::-webkit-scrollbar-thumb": {
							background: "#888",
							borderRadius: "4px",
						},
						"&::-webkit-scrollbar-thumb:hover": {
							background: "#555",
						},
					}}
				>
					{children}
				</Box>
			)}
		</div>
	);
}

interface UserViewProps {
	user: User;
	onClose: () => void;
}

// Helper function to get the correct Stripe value based on environment
const getStripeValue = (value: any): string => {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "object" && value !== null) {
		// Detectar si estamos en desarrollo o producción
		const isDevelopment = import.meta.env.VITE_BASE_URL?.includes("localhost") || import.meta.env.MODE === "development";

		if (isDevelopment && value.test) {
			return value.test;
		} else if (!isDevelopment && value.live) {
			return value.live;
		} else if (value.test) {
			// Fallback to test if live is not available
			return value.test;
		} else if (value.live) {
			// Fallback to live if test is not available
			return value.live;
		}
	}

	return "Información no disponible";
};

// Helper function to get Stripe value with environment indicator
const getStripeValueWithIndicator = (value: any): { value: string; isTest?: boolean } => {
	if (typeof value === "string") {
		return { value };
	}

	if (typeof value === "object" && value !== null) {
		// Detectar si estamos en desarrollo o producción
		const isDevelopment = import.meta.env.VITE_BASE_URL?.includes("localhost") || import.meta.env.MODE === "development";

		if (isDevelopment && value.test) {
			return { value: value.test, isTest: true };
		} else if (!isDevelopment && value.live) {
			return { value: value.live, isTest: false };
		} else if (value.test) {
			// Fallback to test if live is not available
			return { value: value.test, isTest: true };
		} else if (value.live) {
			// Fallback to live if test is not available
			return { value: value.live, isTest: false };
		}
	}

	return { value: "Información no disponible" };
};

const UserView: React.FC<UserViewProps> = ({ user, onClose }) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	console.log("UserView component - dispatch:", typeof dispatch);
	const { user: userDetails, lightData } = useSelector((state: DefaultRootStateProps) => state.users);
	console.log("UserView component - initial state:", { userDetails, lightData });

	// Estados para los modales
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [tabValue, setTabValue] = useState(0);
	const [stripeHistory, setStripeHistory] = useState<StripeCustomerHistory | null>(null);
	const [stripeHistoryLoading, setStripeHistoryLoading] = useState(false);
	const [stripeHistoryError, setStripeHistoryError] = useState<string | null>(null);

	// Estados para editar el downgrade grace period
	const [isEditingGracePeriod, setIsEditingGracePeriod] = useState(false);
	const [gracePeriodExpiresAt, setGracePeriodExpiresAt] = useState<Date | null>(null);
	const [autoArchiveScheduled, setAutoArchiveScheduled] = useState(false);
	const [savingGracePeriod, setSavingGracePeriod] = useState(false);

	// Estado para sincronización de suscripción
	const [syncingSubscription, setSyncingSubscription] = useState(false);

	// Estado para sincronización de almacenamiento
	const [syncingStorage, setSyncingStorage] = useState(false);

	const { enqueueSnackbar } = useSnackbar();

	useEffect(() => {
		console.log("UserView useEffect - user:", user);
		console.log("User properties:", {
			hasId: user?.hasOwnProperty("id"),
			has_id: user?.hasOwnProperty("_id"),
			id: user?.id,
			_id: user?._id,
		});

		const userId = user?.id || user?._id;
		if (userId) {
			console.log("UserView - Calling getUserById with ID:", userId);
			dispatch(getUserById(userId) as any);
		} else {
			console.log("UserView - No user ID found, skipping API call");
		}

		// Cleanup function para limpiar los datos cuando se desmonta el componente
		return () => {
			console.log("UserView - Cleanup, calling clearUserData");
			dispatch(clearUserData() as any);
		};
	}, [user, dispatch]);

	// Log para ver el estado de Redux
	useEffect(() => {
		console.log("=== REDUX STATE IN USERV VIEW ===");
		console.log("userDetails from Redux:", userDetails);
		console.log("lightData from Redux:", lightData);
		console.log("=================================");
	}, [userDetails, lightData]);

	// Initialize grace period values when subscription data is available
	useEffect(() => {
		if (userDetails?.subscription?.downgradeGracePeriod) {
			const gracePeriod = userDetails.subscription.downgradeGracePeriod;
			setGracePeriodExpiresAt(gracePeriod.expiresAt ? new Date(gracePeriod.expiresAt) : null);
			setAutoArchiveScheduled(gracePeriod.autoArchiveScheduled || false);
		}
	}, [userDetails?.subscription?.downgradeGracePeriod]);

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

		// Cargar historial de Stripe cuando se selecciona esa pestaña
		if (newValue === 5 && !stripeHistory && !stripeHistoryLoading) {
			const userId = userData?.id || userData?._id;
			if (userId) {
				loadStripeHistory(userId);
			}
		}
	};

	// Función para cargar el historial de Stripe
	const loadStripeHistory = async (userId: string) => {
		setStripeHistoryLoading(true);
		setStripeHistoryError(null);
		try {
			const response = await ApiService.getStripeCustomerHistory(userId);
			if (response.success && response.data) {
				setStripeHistory(response.data);
			} else {
				setStripeHistoryError(response.message || "No se pudo cargar el historial de Stripe");
			}
		} catch (error) {
			console.error("Error loading Stripe history:", error);
			const errorMessage = error instanceof Error ? error.message : "Error desconocido al cargar el historial de Stripe";
			setStripeHistoryError(errorMessage);
		} finally {
			setStripeHistoryLoading(false);
		}
	};

	// Función para guardar cambios en el grace period
	const handleSaveGracePeriod = async () => {
		const userId = userData?.id || userData?._id;
		if (!userId) {
			enqueueSnackbar("No se pudo identificar el usuario", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
			return;
		}

		setSavingGracePeriod(true);
		try {
			const response = await ApiService.updateUserSubscription(userId, {
				downgradeGracePeriod: {
					...userData?.subscription?.downgradeGracePeriod,
					expiresAt: gracePeriodExpiresAt,
					autoArchiveScheduled: autoArchiveScheduled,
				} as any,
			});

			if (response.success) {
				enqueueSnackbar("Período de gracia actualizado correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
				setIsEditingGracePeriod(false);
				// Recargar los datos del usuario para reflejar los cambios
				dispatch(getUserById(userId) as any);
			} else {
				enqueueSnackbar(response.message || "Error al actualizar el período de gracia", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			}
		} catch (error) {
			console.error("Error updating grace period:", error);
			enqueueSnackbar("Error al actualizar el período de gracia", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
		} finally {
			setSavingGracePeriod(false);
		}
	};

	// Función para cancelar la edición
	const handleCancelEditGracePeriod = () => {
		setIsEditingGracePeriod(false);
		// Reset values to original
		if (userDetails?.subscription?.downgradeGracePeriod) {
			const gracePeriod = userDetails.subscription.downgradeGracePeriod;
			setGracePeriodExpiresAt(gracePeriod.expiresAt ? new Date(gracePeriod.expiresAt) : null);
			setAutoArchiveScheduled(gracePeriod.autoArchiveScheduled || false);
		}
	};

	// Función para sincronizar suscripción con Stripe
	const handleSyncSubscription = async () => {
		const userId = userData?.id || userData?._id;
		if (!userId) {
			enqueueSnackbar("No se pudo obtener el ID del usuario", { variant: "error" });
			return;
		}

		setSyncingSubscription(true);
		try {
			const response = await ApiService.repairUserSubscription(userId);

			if (response.success) {
				enqueueSnackbar(response.message || "Suscripción sincronizada exitosamente", { variant: "success" });

				// Recargar los datos del usuario para mostrar la suscripción actualizada
				dispatch(getUserById(userId) as any);
			} else {
				enqueueSnackbar(response.message || "Error al sincronizar la suscripción", { variant: "error" });
			}
		} catch (error: any) {
			console.error("Error syncing subscription:", error);
			const errorMessage = error?.response?.data?.message || error?.message || "Error al sincronizar la suscripción";
			enqueueSnackbar(errorMessage, { variant: "error" });
		} finally {
			setSyncingSubscription(false);
		}
	};

	// Función para sincronizar el almacenamiento del usuario
	const handleSyncStorage = async () => {
		const userId = userData?.id || userData?._id;
		if (!userId) {
			enqueueSnackbar("No se pudo obtener el ID del usuario", { variant: "error" });
			return;
		}

		setSyncingStorage(true);
		try {
			const response = await ApiService.recalculateUserStorage(userId);

			if (response.success) {
				// Mostrar mensaje con el cambio de almacenamiento
				const beforeMB = response.data?.before?.storageMB || 0;
				const afterMB = response.data?.after?.storage?.totalMB || 0;
				const difference = response.data?.difference?.mb || 0;

				let message = `Almacenamiento sincronizado para ${response.data?.user?.email || "el usuario"}`;
				if (response.data?.changed) {
					message += `. Antes: ${beforeMB.toFixed(2)} MB, Después: ${afterMB.toFixed(2)} MB (${difference > 0 ? "+" : ""}${difference.toFixed(2)} MB)`;
				}

				enqueueSnackbar(message, { variant: "success" });

				// Recargar los datos del usuario para mostrar el almacenamiento actualizado
				dispatch(getUserById(userId) as any);
			} else {
				enqueueSnackbar(response.message || "Error al sincronizar el almacenamiento", { variant: "error" });
			}
		} catch (error: any) {
			console.error("Error syncing storage:", error);
			const errorMessage = error?.response?.data?.message || error?.message || "Error al sincronizar el almacenamiento";
			enqueueSnackbar(errorMessage, { variant: "error" });
		} finally {
			setSyncingStorage(false);
		}
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

	// Renderizar chip de estado de suscripción más detallado
	const renderSubscriptionStatusChip = (status: string) => {
		let color;
		let label;

		switch (status.toLowerCase()) {
			case "active":
				color = "success";
				label = "Activa";
				break;
			case "canceled":
				color = "error";
				label = "Cancelada";
				break;
			case "past_due":
				color = "warning";
				label = "Pago vencido";
				break;
			case "trialing":
				color = "info";
				label = "Período de prueba";
				break;
			case "incomplete":
				color = "warning";
				label = "Incompleta";
				break;
			case "unpaid":
				color = "error";
				label = "Impaga";
				break;
			case "incomplete_expired":
				color = "error";
				label = "Incompleta expirada";
				break;
			default:
				color = "default";
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
				<Stack spacing={3}>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
						<Alert severity="info" sx={{ flex: 1, mr: 2 }}>
							<Typography variant="body2">
								<strong>Nota:</strong> La información mostrada corresponde a los datos del usuario dentro de la colección de suscripciones.
							</Typography>
						</Alert>
						<Tooltip title="Sincronizar con Stripe para obtener información de suscripción">
							<Button
								variant="outlined"
								size="small"
								startIcon={syncingSubscription ? <CircularProgress size={16} /> : <RefreshCircle size={16} />}
								onClick={handleSyncSubscription}
								disabled={syncingSubscription}
								sx={{
									minWidth: 150,
									borderColor: theme.palette.primary.main,
									color: theme.palette.primary.main,
									"&:hover": {
										borderColor: theme.palette.primary.dark,
										backgroundColor: theme.palette.action.hover,
									},
								}}
							>
								{syncingSubscription ? "Sincronizando..." : "Sincronizar"}
							</Button>
						</Tooltip>
					</Box>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
							borderRadius: 2,
						}}
					>
						<Typography variant="body1" align="center">
							El usuario no posee información sobre suscripción dentro de la colección de suscripciones.
						</Typography>
						<Typography variant="body2" align="center" sx={{ mt: 2, color: "text.secondary" }}>
							Usa el botón "Sincronizar" para intentar obtener la información desde Stripe.
						</Typography>
					</Paper>
				</Stack>
			);
		}

		return (
			<Stack spacing={3}>
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
					<Alert severity="info" sx={{ flex: 1, mr: 2 }}>
						<Typography variant="body2">
							<strong>Nota:</strong> La información mostrada corresponde a los datos del usuario dentro de la colección de suscripciones.
						</Typography>
					</Alert>
					<Tooltip title="Sincronizar con Stripe para actualizar la información de suscripción">
						<Button
							variant="outlined"
							size="small"
							startIcon={syncingSubscription ? <CircularProgress size={16} /> : <RefreshCircle size={16} />}
							onClick={handleSyncSubscription}
							disabled={syncingSubscription}
							sx={{
								minWidth: 150,
								borderColor: theme.palette.primary.main,
								color: theme.palette.primary.main,
								"&:hover": {
									borderColor: theme.palette.primary.dark,
									backgroundColor: theme.palette.action.hover,
								},
							}}
						>
							{syncingSubscription ? "Sincronizando..." : "Sincronizar"}
						</Button>
					</Tooltip>
				</Box>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Plan</Typography>
					<Chip
						label={subscription.plan || subscription.name || "Sin información"}
						size="small"
						color="primary"
						sx={{
							borderRadius: "4px",
							fontSize: "0.875rem",
							textTransform: "capitalize",
						}}
					/>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Estado</Typography>
					{renderSubscriptionStatusChip(subscription.status)}
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">ID de Cliente Stripe</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
							{(() => {
								const stripeData = getStripeValueWithIndicator(subscription.stripeCustomerId);
								return stripeData.value;
							})()}
						</Typography>
						{(() => {
							const stripeData = getStripeValueWithIndicator(subscription.stripeCustomerId);
							if (stripeData.isTest !== undefined) {
								return (
									<Chip
										label={stripeData.isTest ? "TEST" : "LIVE"}
										size="small"
										color={stripeData.isTest ? "warning" : "success"}
										sx={{
											height: 20,
											fontSize: "0.7rem",
											fontWeight: "bold",
										}}
									/>
								);
							}
							return null;
						})()}
					</Box>
				</Stack>

				{subscription.stripeSubscriptionId && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1">ID de Suscripción Stripe</Typography>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
								{(() => {
									const stripeData = getStripeValueWithIndicator(subscription.stripeSubscriptionId);
									return stripeData.value;
								})()}
							</Typography>
							{(() => {
								const stripeData = getStripeValueWithIndicator(subscription.stripeSubscriptionId);
								if (stripeData.isTest !== undefined) {
									return (
										<Chip
											label={stripeData.isTest ? "TEST" : "LIVE"}
											size="small"
											color={stripeData.isTest ? "warning" : "success"}
											sx={{
												height: 20,
												fontSize: "0.7rem",
												fontWeight: "bold",
											}}
										/>
									);
								}
								return null;
							})()}
						</Box>
					</Stack>
				)}

				<Divider />
				<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
					Período de Facturación
				</Typography>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Inicio del período actual</Typography>
					<Typography variant="body2">
						{subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString() : "Información no disponible"}
					</Typography>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Fin del período actual</Typography>
					<Typography variant="body2">
						{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "Información no disponible"}
					</Typography>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Cancelar al final del período</Typography>
					<Typography variant="body2">{subscription.cancelAtPeriodEnd ? "Sí" : "No"}</Typography>
				</Stack>

				{subscription.canceledAt && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1">Fecha de cancelación</Typography>
						<Typography variant="body2">{new Date(subscription.canceledAt).toLocaleDateString()}</Typography>
					</Stack>
				)}

				{subscription.trialStart && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1">Inicio de prueba</Typography>
						<Typography variant="body2">{new Date(subscription.trialStart).toLocaleDateString()}</Typography>
					</Stack>
				)}

				{subscription.trialEnd && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1">Fin de prueba</Typography>
						<Typography variant="body2">{new Date(subscription.trialEnd).toLocaleDateString()}</Typography>
					</Stack>
				)}

				{subscription.paymentInfo && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Información de Pago
						</Typography>

						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="subtitle1">Método</Typography>
							<Typography variant="body2" fontWeight="medium">
								{getStripeValue(subscription.paymentInfo.method)}
							</Typography>
						</Stack>

						{subscription.paymentInfo.lastPayment && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Último pago</Typography>
								<Typography variant="body2">{new Date(subscription.paymentInfo.lastPayment).toLocaleDateString()}</Typography>
							</Stack>
						)}

						{subscription.paymentInfo.nextPayment && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Próximo pago</Typography>
								<Typography variant="body2">{new Date(subscription.paymentInfo.nextPayment).toLocaleDateString()}</Typography>
							</Stack>
						)}

						{subscription.paymentInfo.lastFourDigits && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Últimos 4 dígitos</Typography>
								<Typography variant="body2" fontWeight="medium">
									**** {subscription.paymentInfo.lastFourDigits}
								</Typography>
							</Stack>
						)}

						{subscription.paymentInfo.brand && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Marca de tarjeta</Typography>
								<Typography variant="body2" fontWeight="medium">
									{getStripeValue(subscription.paymentInfo.brand)}
								</Typography>
							</Stack>
						)}

						{subscription.paymentInfo.expiryMonth && subscription.paymentInfo.expiryYear && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Vencimiento</Typography>
								<Typography variant="body2" fontWeight="medium">
									{String(subscription.paymentInfo.expiryMonth).padStart(2, "0")}/{subscription.paymentInfo.expiryYear}
								</Typography>
							</Stack>
						)}
					</>
				)}



				{(subscription.pendingPlanChange || subscription.scheduledPlanChange || subscription.downgradeGracePeriod) && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
							Cambios Programados
						</Typography>

						<Grid container spacing={1}>
							{subscription.pendingPlanChange && (
								<Grid item xs={12} md={6}>
									<Paper elevation={0} sx={{ p: 1.5, backgroundColor: "warning.light", height: "100%" }}>
										<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
											Cambio pendiente: {getStripeValue(subscription.pendingPlanChange.planId)}
										</Typography>
										<Typography variant="caption">
											Efectivo:{" "}
											{subscription.pendingPlanChange.effectiveDate
												? new Date(subscription.pendingPlanChange.effectiveDate).toLocaleDateString()
												: "No especificada"}
										</Typography>
									</Paper>
								</Grid>
							)}

							{subscription.scheduledPlanChange && (
								<Grid item xs={12} md={6}>
									<Paper elevation={0} sx={{ p: 1.5, backgroundColor: "warning.light", height: "100%" }}>
										<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
											Cambio programado: {getStripeValue(subscription.scheduledPlanChange.targetPlan)}
										</Typography>
										<Typography variant="caption">
											Efectivo:{" "}
											{subscription.scheduledPlanChange.effectiveDate
												? new Date(subscription.scheduledPlanChange.effectiveDate).toLocaleDateString()
												: "No especificada"}
										</Typography>
										<Typography variant="caption" display="block">
											Notificado: {subscription.scheduledPlanChange.notified ? "Sí" : "No"}
										</Typography>
									</Paper>
								</Grid>
							)}

							{subscription.downgradeGracePeriod && (
								<Grid item xs={12} md={6}>
									<Paper elevation={0} sx={{ p: 1.5, backgroundColor: "info.light", height: "100%" }}>
										<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
											<Box sx={{ flex: 1 }}>
												<Typography variant="body2">
													Período de gracia {subscription.downgradeGracePeriod.isActive ? "activo" : "inactivo"}
													{subscription.downgradeGracePeriod.previousPlan &&
														` (plan anterior: ${subscription.downgradeGracePeriod.previousPlan})`}
												</Typography>

												{isEditingGracePeriod ? (
													<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
														<Stack spacing={2} sx={{ mt: 2 }}>
															<DatePicker
																label="Fecha de expiración"
																value={gracePeriodExpiresAt}
																onChange={(newValue) => setGracePeriodExpiresAt(newValue)}
																slotProps={{
																	textField: {
																		size: "small",
																		fullWidth: true,
																	},
																}}
															/>
															<FormControlLabel
																control={
																	<Checkbox
																		checked={autoArchiveScheduled}
																		onChange={(e) => setAutoArchiveScheduled(e.target.checked)}
																		size="small"
																	/>
																}
																label="Auto-archivar programado"
															/>
															<Stack direction="row" spacing={1}>
																<Button
																	size="small"
																	variant="contained"
																	startIcon={<Save2 size={16} />}
																	onClick={handleSaveGracePeriod}
																	disabled={savingGracePeriod}
																>
																	{savingGracePeriod ? "Guardando..." : "Guardar"}
																</Button>
																<Button
																	size="small"
																	variant="outlined"
																	startIcon={<CloseCircle size={16} />}
																	onClick={handleCancelEditGracePeriod}
																	disabled={savingGracePeriod}
																>
																	Cancelar
																</Button>
															</Stack>
														</Stack>
													</LocalizationProvider>
												) : (
													<>
														<Typography variant="caption">
															Expira:{" "}
															{subscription.downgradeGracePeriod.expiresAt
																? new Date(subscription.downgradeGracePeriod.expiresAt).toLocaleDateString()
																: "No especificada"}
														</Typography>
														{subscription.downgradeGracePeriod.autoArchiveScheduled !== undefined && (
															<Typography variant="caption" display="block">
																Auto-archivar: {subscription.downgradeGracePeriod.autoArchiveScheduled ? "Sí" : "No"}
															</Typography>
														)}
														{subscription.downgradeGracePeriod.notificationsSent &&
															subscription.downgradeGracePeriod.notificationsSent.length > 0 && (
																<Typography variant="caption" display="block" sx={{ mt: 1 }}>
																	Notificaciones enviadas: {subscription.downgradeGracePeriod.notificationsSent.join(", ")}
																</Typography>
															)}
													</>
												)}
											</Box>
											{!isEditingGracePeriod && (
												<IconButton size="small" onClick={() => setIsEditingGracePeriod(true)} sx={{ ml: 1 }}>
													<Edit2 size={16} />
												</IconButton>
											)}
										</Stack>
									</Paper>
								</Grid>
							)}
						</Grid>
					</>
				)}

				{subscription.paymentFailures && subscription.paymentFailures.count > 0 && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Fallos de Pago
						</Typography>

						<Paper elevation={0} sx={{ p: 2, backgroundColor: "error.light", mb: 1 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
								<Typography variant="subtitle2">Cantidad de fallos</Typography>
								<Chip label={subscription.paymentFailures.count} size="small" color="error" />
							</Stack>

							{subscription.paymentFailures.lastAttempt && (
								<Typography variant="body2">
									Último intento:{" "}
									{subscription.paymentFailures.lastAttempt
										? new Date(subscription.paymentFailures.lastAttempt).toLocaleString()
										: "No disponible"}
								</Typography>
							)}

							{subscription.paymentFailures.nextRetry && (
								<Typography variant="body2">
									Próximo reintento:{" "}
									{subscription.paymentFailures.nextRetry
										? new Date(subscription.paymentFailures.nextRetry).toLocaleString()
										: "No disponible"}
								</Typography>
							)}

							{subscription.paymentFailures.notificationsSent && (
								<Box sx={{ mt: 1 }}>
									<Typography variant="caption" display="block">
										Notificaciones enviadas:
									</Typography>
									{subscription.paymentFailures.notificationsSent.firstFailure && (
										<Typography variant="caption" display="block">
											• Primer fallo:{" "}
											{subscription.paymentFailures.notificationsSent.firstFailure
												? new Date(subscription.paymentFailures.notificationsSent.firstFailure).toLocaleDateString()
												: "No disponible"}
										</Typography>
									)}
									{subscription.paymentFailures.notificationsSent.secondFailure && (
										<Typography variant="caption" display="block">
											• Segundo fallo:{" "}
											{subscription.paymentFailures.notificationsSent.secondFailure
												? new Date(subscription.paymentFailures.notificationsSent.secondFailure).toLocaleDateString()
												: "No disponible"}
										</Typography>
									)}
									{subscription.paymentFailures.notificationsSent.finalWarning && (
										<Typography variant="caption" display="block">
											• Advertencia final:{" "}
											{subscription.paymentFailures.notificationsSent.finalWarning
												? new Date(subscription.paymentFailures.notificationsSent.finalWarning).toLocaleDateString()
												: "No disponible"}
										</Typography>
									)}
								</Box>
							)}
						</Paper>
					</>
				)}

				{subscription.accountStatus && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Estado de la Cuenta
						</Typography>

						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="subtitle1">Cuenta bloqueada</Typography>
							<Chip
								label={subscription.accountStatus.isLocked ? "Sí" : "No"}
								size="small"
								color={subscription.accountStatus.isLocked ? "error" : "success"}
							/>
						</Stack>

						{subscription.accountStatus.lockedAt && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Fecha de bloqueo</Typography>
								<Typography variant="body2">{new Date(subscription.accountStatus.lockedAt).toLocaleString()}</Typography>
							</Stack>
						)}

						{subscription.accountStatus.lockedReason && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Razón del bloqueo</Typography>
								<Typography variant="body2">{subscription.accountStatus.lockedReason}</Typography>
							</Stack>
						)}

						{subscription.accountStatus.suspendedFeatures && subscription.accountStatus.suspendedFeatures.length > 0 && (
							<Box sx={{ mt: 1 }}>
								<Typography variant="subtitle1">Características suspendidas:</Typography>
								{subscription.accountStatus.suspendedFeatures.map((feature, index) => (
									<Chip key={index} label={feature} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
								))}
							</Box>
						)}

						{subscription.accountStatus.warnings && subscription.accountStatus.warnings.length > 0 && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle1">Advertencias:</Typography>
								{subscription.accountStatus.warnings.map((warning, index) => (
									<Paper key={index} elevation={0} sx={{ p: 1.5, backgroundColor: "warning.light", mb: 1 }}>
										<Typography variant="body2" fontWeight="medium">
											{warning.type}
										</Typography>
										<Typography variant="body2">{warning.message}</Typography>
										<Typography variant="caption">Enviado: {new Date(warning.sentAt).toLocaleString()}</Typography>
									</Paper>
								))}
							</Box>
						)}
					</>
				)}

				{subscription.paymentRecovery && subscription.paymentRecovery.isInRecovery && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Recuperación de Pago
						</Typography>

						<Paper elevation={0} sx={{ p: 2, backgroundColor: "warning.light" }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle2">En recuperación</Typography>
								<Chip label="Sí" size="small" color="warning" />
							</Stack>

							{subscription.paymentRecovery.recoveryStarted && (
								<Typography variant="body2" sx={{ mt: 1 }}>
									Inicio: {new Date(subscription.paymentRecovery.recoveryStarted).toLocaleString()}
								</Typography>
							)}

							<Typography variant="body2">Intentos: {subscription.paymentRecovery.attemptCount}</Typography>

							{subscription.paymentRecovery.lastRecoveryAttempt && (
								<Typography variant="body2">
									Último intento: {new Date(subscription.paymentRecovery.lastRecoveryAttempt).toLocaleString()}
								</Typography>
							)}

							{subscription.paymentRecovery.recoveryDeadline && (
								<Typography variant="body2" color="error">
									Fecha límite: {new Date(subscription.paymentRecovery.recoveryDeadline).toLocaleString()}
								</Typography>
							)}

							{subscription.paymentRecovery.recoveryMethod && (
								<Typography variant="body2">Método: {subscription.paymentRecovery.recoveryMethod}</Typography>
							)}
						</Paper>
					</>
				)}


				{subscription.invoiceSettings && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Configuración de Facturación
						</Typography>

						{subscription.invoiceSettings.customerId && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">ID de cliente</Typography>
								<Typography variant="body2">{subscription.invoiceSettings.customerId}</Typography>
							</Stack>
						)}

						{subscription.invoiceSettings.billingEmail && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Email de facturación</Typography>
								<Typography variant="body2">{subscription.invoiceSettings.billingEmail}</Typography>
							</Stack>
						)}

						{subscription.invoiceSettings.taxId && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">ID fiscal</Typography>
								<Typography variant="body2">{subscription.invoiceSettings.taxId}</Typography>
							</Stack>
						)}

						{subscription.invoiceSettings.billingAddress && (
							<Box sx={{ mt: 1 }}>
								<Typography variant="subtitle1">Dirección de facturación:</Typography>
								<Typography variant="body2">
									{subscription.invoiceSettings.billingAddress.line1 || ""}
									{subscription.invoiceSettings.billingAddress.line2 && <>, {subscription.invoiceSettings.billingAddress.line2}</>}
								</Typography>
								<Typography variant="body2">
									{subscription.invoiceSettings.billingAddress.city || ""}
									{subscription.invoiceSettings.billingAddress.state && <>, {subscription.invoiceSettings.billingAddress.state}</>}
									{subscription.invoiceSettings.billingAddress.postalCode && <> {subscription.invoiceSettings.billingAddress.postalCode}</>}
								</Typography>
								{subscription.invoiceSettings.billingAddress.country && (
									<Typography variant="body2">{subscription.invoiceSettings.billingAddress.country}</Typography>
								)}
							</Box>
						)}
					</>
				)}

				{subscription.notifications && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Preferencias de Notificación
						</Typography>

						<Grid container spacing={2}>
							{Object.entries(subscription.notifications).map(([key, value], index) => (
								<Grid item xs={6} key={index}>
									<Stack direction="row" alignItems="center" spacing={1}>
										<Chip label={value ? "Activo" : "Inactivo"} size="small" color={value ? "success" : "default"} sx={{ minWidth: 70 }} />
										<Typography variant="body2">
											{key === "email"
												? "Email"
												: key === "sms"
												? "SMS"
												: key === "inApp"
												? "En aplicación"
												: key === "marketing"
												? "Marketing"
												: key === "billingAlerts"
												? "Alertas de facturación"
												: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
										</Typography>
									</Stack>
								</Grid>
							))}
						</Grid>
					</>
				)}

				{subscription.metadata && Object.keys(subscription.metadata).length > 0 && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Metadatos
						</Typography>

						{subscription.metadata.source && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Fuente</Typography>
								<Typography variant="body2">{subscription.metadata.source}</Typography>
							</Stack>
						)}

						{subscription.metadata.referrer && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">Referente</Typography>
								<Typography variant="body2">{subscription.metadata.referrer}</Typography>
							</Stack>
						)}

						{subscription.metadata.campaignId && (
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle1">ID de campaña</Typography>
								<Typography variant="body2">{subscription.metadata.campaignId}</Typography>
							</Stack>
						)}

						{subscription.metadata.notes && (
							<Box sx={{ mt: 1 }}>
								<Typography variant="subtitle1">Notas:</Typography>
								<Paper elevation={0} sx={{ p: 1.5, backgroundColor: "grey.100" }}>
									<Typography variant="body2">{subscription.metadata.notes}</Typography>
								</Paper>
							</Box>
						)}

						{subscription.metadata.customFields && Object.keys(subscription.metadata.customFields).length > 0 && (
							<Box sx={{ mt: 1 }}>
								<Typography variant="subtitle1">Campos personalizados:</Typography>
								{Object.entries(subscription.metadata.customFields).map(([key, value], index) => (
									<Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="body2">{key}</Typography>
										<Typography variant="body2" fontWeight="medium">
											{String(value)}
										</Typography>
									</Stack>
								))}
							</Box>
						)}
					</>
				)}

				{subscription.statusHistory && subscription.statusHistory.length > 0 && (
					<>
						<Divider />
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							Historial de Estados
						</Typography>

						<List dense>
							{subscription.statusHistory.slice(0, 5).map((history, index) => (
								<ListItem key={index} sx={{ px: 0 }}>
									<ListItemText
										primary={
											<Stack direction="row" alignItems="center" spacing={1}>
												<Typography variant="body2" fontWeight="medium">
													{history.status}
												</Typography>
												{history.reason && (
													<Typography variant="caption" color="textSecondary">
														- {history.reason}
													</Typography>
												)}
											</Stack>
										}
										secondary={new Date(history.changedAt).toLocaleString()}
									/>
								</ListItem>
							))}
						</List>
						{subscription.statusHistory.length > 5 && (
							<Typography variant="caption" color="textSecondary" align="center" display="block">
								Mostrando 5 de {subscription.statusHistory.length} cambios de estado
							</Typography>
						)}
					</>
				)}

				<Divider />
				<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
					Información de Auditoría
				</Typography>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Creado</Typography>
					<Typography variant="body2">
						{subscription.createdAt ? new Date(subscription.createdAt).toLocaleString() : "Información no disponible"}
					</Typography>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Última actualización</Typography>
					<Typography variant="body2">
						{subscription.updatedAt ? new Date(subscription.updatedAt).toLocaleString() : "Información no disponible"}
					</Typography>
				</Stack>
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
				<Alert severity="info">
					<Typography variant="body2">La información de preferencias no está disponible actualmente.</Typography>
				</Alert>
			</Stack>
		);
	};

	// Renderizar límites de recursos
	const renderResourceLimits = () => {
		const subscription = userData?.subscription;

		if (!subscription) {
			return (
				<Alert severity="info">
					<Typography variant="body2">No hay información de límites disponible para este usuario.</Typography>
				</Alert>
			);
		}

		return (
			<Stack spacing={3}>
				{/* Límites de Recursos */}
				{subscription.limits && Object.keys(subscription.limits).length > 0 && (
					<>
						<Typography variant="h6" sx={{ fontWeight: "bold" }}>
							Límites del Plan
						</Typography>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
								borderRadius: 2,
							}}
						>
							<Grid container spacing={2}>
								{Object.entries(subscription.limits).map(([key, value], index) => (
									<Grid item xs={12} sm={6} key={index}>
										<Stack spacing={1}>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Typography variant="subtitle2" color="textSecondary">
													{key === "maxFolders"
														? "Carpetas máximas"
														: key === "maxCalculators"
														? "Calculadoras máximas"
														: key === "maxContacts"
														? "Contactos máximos"
														: key === "storageLimit" || key.toLowerCase() === "storage" || key === "Storage"
														? "Almacenamiento"
														: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
												</Typography>
												{(key === "storageLimit" || key.toLowerCase() === "storage" || key === "Storage") && (
													<Tooltip title="Sincronizar el cálculo de almacenamiento del usuario">
														<IconButton
															size="small"
															onClick={handleSyncStorage}
															disabled={syncingStorage}
															sx={{
																color: theme.palette.primary.main,
																"&:hover": {
																	backgroundColor: theme.palette.action.hover,
																},
															}}
														>
															{syncingStorage ? <CircularProgress size={16} /> : <RefreshCircle size={16} />}
														</IconButton>
													</Tooltip>
												)}
											</Stack>
											<Typography variant="h6" fontWeight="medium">
												{key === "storageLimit" || key.toLowerCase() === "storage" || key === "Storage"
													? `${value} MB`
													: value || "Información no disponible"}
											</Typography>
										</Stack>
									</Grid>
								))}
							</Grid>
						</Paper>
					</>
				)}

				{/* Seguimiento de Uso */}
				{subscription.usageTracking && (
					<>
						<Typography variant="h6" sx={{ fontWeight: "bold" }}>
							Uso Actual
						</Typography>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
								borderRadius: 2,
							}}
						>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1}>
										<Typography variant="subtitle2" color="textSecondary">
											Carpetas creadas
										</Typography>
										<Typography variant="h6" fontWeight="medium">
											{subscription.usageTracking.foldersCreated || 0}
											{subscription.limits?.maxFolders && (
												<Typography component="span" variant="body2" color="textSecondary">
													{" / "}{subscription.limits.maxFolders}
												</Typography>
											)}
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1}>
										<Typography variant="subtitle2" color="textSecondary">
											Cálculos creados
										</Typography>
										<Typography variant="h6" fontWeight="medium">
											{subscription.usageTracking.calculatorsCreated || 0}
											{subscription.limits?.maxCalculators && (
												<Typography component="span" variant="body2" color="textSecondary">
													{" / "}{subscription.limits.maxCalculators}
												</Typography>
											)}
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1}>
										<Typography variant="subtitle2" color="textSecondary">
											Contactos creados
										</Typography>
										<Typography variant="h6" fontWeight="medium">
											{subscription.usageTracking.contactsCreated || 0}
											{subscription.limits?.maxContacts && (
												<Typography component="span" variant="body2" color="textSecondary">
													{" / "}{subscription.limits.maxContacts}
												</Typography>
											)}
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1}>
										<Stack direction="row" alignItems="center" spacing={1}>
											<Typography variant="subtitle2" color="textSecondary">
												Almacenamiento usado
											</Typography>
											<Tooltip title="Sincronizar el cálculo de almacenamiento del usuario">
												<IconButton
													size="small"
													onClick={handleSyncStorage}
													disabled={syncingStorage}
													sx={{
														color: theme.palette.primary.main,
														"&:hover": {
															backgroundColor: theme.palette.action.hover,
														},
													}}
												>
													{syncingStorage ? <CircularProgress size={16} /> : <RefreshCircle size={16} />}
												</IconButton>
											</Tooltip>
										</Stack>
										<Typography variant="h6" fontWeight="medium">
											{subscription.usageTracking.storageUsed || 0} MB
											{subscription.limits?.storageLimit && (
												<Typography component="span" variant="body2" color="textSecondary">
													{" / "}{subscription.limits.storageLimit} MB
												</Typography>
											)}
										</Typography>
									</Stack>
								</Grid>

								{subscription.usageTracking.lastActivityDate && (
									<Grid item xs={12}>
										<Divider sx={{ my: 2 }} />
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography variant="subtitle2" color="textSecondary">
												Última actividad
											</Typography>
											<Typography variant="body2">
												{new Date(subscription.usageTracking.lastActivityDate).toLocaleString()}
											</Typography>
										</Stack>
									</Grid>
								)}
							</Grid>
						</Paper>
					</>
				)}

				{/* Características del Plan */}
				{subscription.features && (
					<>
						<Typography variant="h6" sx={{ fontWeight: "bold" }}>
							Características del Plan
						</Typography>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
								borderRadius: 2,
							}}
						>
							<Grid container spacing={2}>
								{Object.entries(subscription.features).map(([featureName, enabled], index) => (
									<Grid item xs={12} sm={6} key={index}>
										<Stack direction="row" alignItems="center" spacing={1}>
											<Chip
												label={enabled ? "Activo" : "Inactivo"}
												size="small"
												color={enabled ? "success" : "default"}
												sx={{ minWidth: 70 }}
											/>
											<Typography variant="body2">
												{featureName === "advancedAnalytics"
													? "Analíticas avanzadas"
													: featureName === "exportReports"
													? "Exportar reportes"
													: featureName === "taskAutomation"
													? "Automatización de tareas"
													: featureName === "bulkOperations"
													? "Operaciones masivas"
													: featureName === "prioritySupport"
													? "Soporte prioritario"
													: featureName === "customIntegrations"
													? "Integraciones personalizadas"
													: featureName === "teamCollaboration"
													? "Colaboración en equipo"
													: featureName === "apiAccess"
													? "Acceso API"
													: featureName === "ssoIntegration"
													? "Integración SSO"
													: featureName === "auditLog"
													? "Registro de auditoría"
													: featureName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
											</Typography>
										</Stack>
									</Grid>
								))}
							</Grid>
						</Paper>
					</>
				)}
			</Stack>
		);
	};

	// Renderizar información resumida (lightData)
	const renderLightData = (lightData?: UserLightData) => {
		if (!lightData) {
			return (
				<Alert severity="info">
					<Typography variant="body2">No hay información resumida disponible.</Typography>
				</Alert>
			);
		}

		return (
			<Grid container spacing={3}>
				{/* Carpetas */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
							borderRadius: 2,
							height: "100%",
						}}
					>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<Folder2 size={20} />
							<Typography variant="h6">Carpetas</Typography>
							<Chip label={`${lightData.folders.totalCount} total`} size="small" sx={{ ml: "auto" }} />
						</Stack>
						{lightData.folders.items.length > 0 ? (
							<Stack spacing={1.5}>
								{lightData.folders.items.slice(0, 5).map((folder, index) => (
									<Box key={folder._id}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Box>
												<Typography variant="subtitle2">{folder.folderName}</Typography>
												<Typography variant="caption" color="textSecondary">
													{folder.materia} • {folder.status}
												</Typography>
											</Box>
											<Typography variant="body2" fontWeight="medium">
												{folder.amount != null ? formatCurrency(folder.amount) : "-"}
											</Typography>
										</Stack>
										{index < lightData.folders.items.length - 1 && <Divider sx={{ mt: 1.5 }} />}
									</Box>
								))}
								{lightData.folders.totalCount > lightData.folders.count && (
									<Typography variant="caption" color="textSecondary" align="center" sx={{ pt: 1 }}>
										Mostrando {lightData.folders.count} de {lightData.folders.totalCount} carpetas
									</Typography>
								)}
							</Stack>
						) : (
							<Typography variant="body2" color="textSecondary">
								No hay carpetas registradas
							</Typography>
						)}
					</Paper>
				</Grid>

				{/* Calculadoras */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
							borderRadius: 2,
							height: "100%",
						}}
					>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<Calculator size={20} />
							<Typography variant="h6">Cálculos</Typography>
							<Chip label={`${lightData.calculators.totalCount} total`} size="small" sx={{ ml: "auto" }} />
						</Stack>
						{lightData.calculators.items.length > 0 ? (
							<Stack spacing={1.5}>
								{lightData.calculators.items.slice(0, 5).map((calc, index) => (
									<Box key={calc._id}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Box>
												<Typography variant="subtitle2">{calc.type}</Typography>
												<Typography variant="caption" color="textSecondary">
													{calc.classType} • {new Date(calc.date).toLocaleDateString()}
												</Typography>
											</Box>
											<Typography variant="body2" fontWeight="medium">
												{calc.amount != null ? formatCurrency(calc.amount) : "-"}
											</Typography>
										</Stack>
										{index < lightData.calculators.items.length - 1 && <Divider sx={{ mt: 1.5 }} />}
									</Box>
								))}
								{lightData.calculators.totalCount > lightData.calculators.count && (
									<Typography variant="caption" color="textSecondary" align="center" sx={{ pt: 1 }}>
										Mostrando {lightData.calculators.count} de {lightData.calculators.totalCount} cálculos
									</Typography>
								)}
							</Stack>
						) : (
							<Typography variant="body2" color="textSecondary">
								No hay cálculos registrados
							</Typography>
						)}
					</Paper>
				</Grid>

				{/* Contactos */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
							borderRadius: 2,
							height: "100%",
						}}
					>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<Profile2User size={20} />
							<Typography variant="h6">Contactos</Typography>
							<Chip label={`${lightData.contacts.totalCount} total`} size="small" sx={{ ml: "auto" }} />
						</Stack>
						{lightData.contacts.items.length > 0 ? (
							<Stack spacing={1.5}>
								{lightData.contacts.items.slice(0, 5).map((contact, index) => (
									<Box key={contact._id}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Box>
												<Typography variant="subtitle2">
													{contact.name} {contact.lastName}
												</Typography>
												<Typography variant="caption" color="textSecondary">
													{contact.role} • {contact.type}
												</Typography>
											</Box>
											{contact.email && (
												<Typography variant="caption" color="textSecondary">
													{contact.email}
												</Typography>
											)}
										</Stack>
										{index < lightData.contacts.items.length - 1 && <Divider sx={{ mt: 1.5 }} />}
									</Box>
								))}
								{lightData.contacts.totalCount > lightData.contacts.count && (
									<Typography variant="caption" color="textSecondary" align="center" sx={{ pt: 1 }}>
										Mostrando {lightData.contacts.count} de {lightData.contacts.totalCount} contactos
									</Typography>
								)}
							</Stack>
						) : (
							<Typography variant="body2" color="textSecondary">
								No hay contactos registrados
							</Typography>
						)}
					</Paper>
				</Grid>

				{/* Eventos */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100",
							borderRadius: 2,
							height: "100%",
						}}
					>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<CalendarAdd size={20} />
							<Typography variant="h6">Eventos</Typography>
							<Chip label={`${lightData.events.totalCount} total`} size="small" sx={{ ml: "auto" }} />
						</Stack>
						{lightData.events.items.length > 0 ? (
							<Stack spacing={1.5}>
								{lightData.events.items.slice(0, 5).map((event, index) => (
									<Box key={event._id}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Box sx={{ flex: 1 }}>
												<Typography variant="subtitle2" noWrap>
													{event.title}
												</Typography>
												<Typography variant="caption" color="textSecondary">
													{new Date(event.start).toLocaleDateString()} • {event.type}
												</Typography>
											</Box>
											{!event.allDay && (
												<Typography variant="caption" color="textSecondary">
													{new Date(event.start).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</Typography>
											)}
										</Stack>
										{index < lightData.events.items.length - 1 && <Divider sx={{ mt: 1.5 }} />}
									</Box>
								))}
								{lightData.events.totalCount > lightData.events.count && (
									<Typography variant="caption" color="textSecondary" align="center" sx={{ pt: 1 }}>
										Mostrando {lightData.events.count} de {lightData.events.totalCount} eventos
									</Typography>
								)}
							</Stack>
						) : (
							<Typography variant="body2" color="textSecondary">
								No hay eventos programados
							</Typography>
						)}
					</Paper>
				</Grid>
			</Grid>
		);
	};

	// Renderizar historial de Stripe
	const renderStripeHistory = () => {
		// Helper function to format interval
		const formatInterval = (interval: string) => {
			switch (interval) {
				case "month":
					return "Mensual";
				case "year":
					return "Anual";
				case "week":
					return "Semanal";
				case "day":
					return "Diario";
				default:
					return interval;
			}
		};

		if (stripeHistoryLoading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
					<CircularProgress />
				</Box>
			);
		}

		if (stripeHistoryError) {
			return (
				<Alert severity="error" sx={{ mb: 2 }}>
					{stripeHistoryError}
				</Alert>
			);
		}

		if (!stripeHistory) {
			return (
				<Alert severity="info" sx={{ mb: 2 }}>
					No se ha cargado el historial de Stripe. Intenta refrescar la página.
				</Alert>
			);
		}

		return (
			<Stack spacing={3}>
				{/* Información del Cliente */}
				<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
					<Typography variant="h6" sx={{ mb: 2 }}>
						Información del Cliente
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									ID de Cliente
								</Typography>
								<Typography variant="body2" sx={{ fontFamily: "monospace" }}>
									{stripeHistory.customer.id}
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={12} md={6}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Email
								</Typography>
								<Typography variant="body2">{stripeHistory.customer.email}</Typography>
							</Stack>
						</Grid>
						<Grid item xs={12} md={6}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Creado
								</Typography>
								<Typography variant="body2">{new Date(stripeHistory.customer.created).toLocaleString()}</Typography>
							</Stack>
						</Grid>
						{stripeHistory.customer.metadata && Object.keys(stripeHistory.customer.metadata).length > 0 && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
									Metadata
								</Typography>
								{Object.entries(stripeHistory.customer.metadata).map(([key, value]) => (
									<Stack key={key} direction="row" spacing={1}>
										<Typography variant="caption" fontWeight="medium">
											{key}:
										</Typography>
										<Typography variant="caption">{value}</Typography>
									</Stack>
								))}
							</Grid>
						)}
					</Grid>
				</Paper>

				{/* Estadísticas */}
				<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
					<Typography variant="h6" sx={{ mb: 2 }}>
						Estadísticas
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={6} md={3}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Total Gastado
								</Typography>
								<Typography variant="h5">{formatCurrency(stripeHistory.stats?.lifetimeValue || 0)}</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} md={3}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Suscripciones Activas
								</Typography>
								<Typography variant="h5">{stripeHistory.stats?.activeSubscriptions || 0}</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} md={3}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Total Facturas
								</Typography>
								<Typography variant="h5">{stripeHistory.stats?.totalInvoices || 0}</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} md={3}>
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Facturas Pagadas
								</Typography>
								<Typography variant="h5">{stripeHistory.stats?.paidInvoices || 0}</Typography>
							</Stack>
						</Grid>
						{stripeHistory.stats?.totalPaymentMethods && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="text.secondary">
									Métodos de Pago
								</Typography>
								<Typography variant="body2">{stripeHistory.stats.totalPaymentMethods} registrado(s)</Typography>
							</Grid>
						)}
					</Grid>
				</Paper>

				{/* Suscripciones */}
				{stripeHistory.subscriptions.length > 0 && (
					<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Historial de Suscripciones
						</Typography>
						<Stack spacing={2}>
							{stripeHistory.subscriptions.map((sub) => (
								<Paper key={sub.id} variant="outlined" sx={{ p: 2 }}>
									<Grid container spacing={2}>
										<Grid item xs={12}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle1">ID: {sub.id}</Typography>
												{renderSubscriptionStatusChip(sub.status)}
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Typography variant="caption" color="text.secondary">
												Período Actual
											</Typography>
											<Typography variant="body2">
												{new Date(sub.current_period_start).toLocaleDateString()} - {new Date(sub.current_period_end).toLocaleDateString()}
											</Typography>
										</Grid>
										<Grid item xs={12} md={6}>
											<Typography variant="caption" color="text.secondary">
												Creada
											</Typography>
											<Typography variant="body2">{new Date(sub.created).toLocaleString()}</Typography>
										</Grid>
										{sub.plan && (
											<Grid item xs={12}>
												<Stack direction="row" justifyContent="space-between" alignItems="center">
													<Typography variant="body2">
														Plan: {sub.plan.product || sub.plan.id}
														{sub.plan.interval && ` (${formatInterval(sub.plan.interval)})`}
													</Typography>
													<Typography variant="body2" fontWeight="medium">
														{formatCurrency(sub.plan.amount || 0)} {(sub.plan.currency || "usd").toUpperCase()}
													</Typography>
												</Stack>
											</Grid>
										)}
										{sub.canceled_at && (
											<Grid item xs={12}>
												<Typography variant="caption" color="error">
													Cancelada el: {new Date(sub.canceled_at).toLocaleString()}
												</Typography>
											</Grid>
										)}
									</Grid>
								</Paper>
							))}
						</Stack>
					</Paper>
				)}

				{/* Facturas */}
				{stripeHistory.invoices.length > 0 && (
					<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Facturas
						</Typography>
						<Stack spacing={2}>
							{stripeHistory.invoices.slice(0, 10).map((invoice) => (
								<Paper key={invoice.id} variant="outlined" sx={{ p: 2 }}>
									<Grid container spacing={2} alignItems="center">
										<Grid item xs={12} md={3}>
											<Typography variant="subtitle2">{invoice.number || invoice.id}</Typography>
											<Typography variant="caption" color="text.secondary">
												{new Date(invoice.created).toLocaleDateString()}
											</Typography>
										</Grid>
										<Grid item xs={12} md={3}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Chip label={invoice.paid ? "Pagada" : "Pendiente"} size="small" color={invoice.paid ? "success" : "warning"} />
												<Typography variant="caption" color="text.secondary">
													{invoice.status}
												</Typography>
											</Stack>
										</Grid>
										<Grid item xs={12} md={3}>
											<Typography variant="body2" fontWeight="medium">
												{formatCurrency((invoice.amount_paid || 0) / 100)} {(invoice.currency || "usd").toUpperCase()}
											</Typography>
										</Grid>
										<Grid item xs={12} md={3}>
											<Stack direction="row" spacing={1}>
												{invoice.pdf_url && (
													<Button size="small" variant="outlined" href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
														PDF
													</Button>
												)}
												{invoice.hosted_invoice_url && (
													<Button
														size="small"
														variant="outlined"
														href={invoice.hosted_invoice_url}
														target="_blank"
														rel="noopener noreferrer"
													>
														Ver
													</Button>
												)}
											</Stack>
										</Grid>
									</Grid>
								</Paper>
							))}
							{stripeHistory.invoices.length > 10 && (
								<Typography variant="caption" color="text.secondary" align="center">
									Mostrando 10 de {stripeHistory.invoices.length} facturas
								</Typography>
							)}
						</Stack>
					</Paper>
				)}

				{/* Métodos de Pago */}
				{stripeHistory.paymentMethods.length > 0 && (
					<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Métodos de Pago
						</Typography>
						<Stack spacing={2}>
							{stripeHistory.paymentMethods.map((method) => (
								<Paper key={method.id} variant="outlined" sx={{ p: 2 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Box>
											<Typography variant="subtitle2">
												{method.type === "card" && method.card
													? `${method.card.brand.toUpperCase()} •••• ${method.card.last4}`
													: method.type.toUpperCase()}
											</Typography>
											{method.card && (
												<Typography variant="caption" color="text.secondary">
													Expira: {method.card.exp_month}/{method.card.exp_year}
												</Typography>
											)}
										</Box>
										<Typography variant="caption" color="text.secondary">
											Agregada: {new Date(method.created).toLocaleDateString()}
										</Typography>
									</Stack>
								</Paper>
							))}
						</Stack>
					</Paper>
				)}

				{/* Eventos Recientes */}
				{stripeHistory.recentEvents.length > 0 && (
					<Paper elevation={0} sx={{ p: 3, backgroundColor: theme.palette.mode === "dark" ? "background.default" : "grey.100" }}>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Eventos Recientes
						</Typography>
						<Stack spacing={1}>
							{stripeHistory.recentEvents.slice(0, 20).map((event) => (
								<Stack key={event.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
									<Box>
										<Typography variant="body2">{event.type.replace(/\./g, " ").replace(/_/g, " ")}</Typography>
										<Typography variant="caption" color="text.secondary">
											{new Date(event.created).toLocaleString()}
										</Typography>
									</Box>
								</Stack>
							))}
							{stripeHistory.recentEvents.length > 20 && (
								<Typography variant="caption" color="text.secondary" align="center">
									Mostrando 20 de {stripeHistory.recentEvents.length} eventos
								</Typography>
							)}
						</Stack>
					</Paper>
				)}
			</Stack>
		);
	};

	return (
		<>
			<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
				<MainCard
					title={<Typography variant="h5">Detalles del Usuario</Typography>}
					sx={{ flex: 1, display: "flex", flexDirection: "column" }}
				>
					<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
						{/* Header con info del usuario */}
						<Box sx={{ pb: 2 }}>
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
						</Box>

						<Divider />

						{/* Contenido con tabs */}
						<Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", mt: 2 }}>
							<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
								<Tabs value={tabValue} onChange={handleTabChange} aria-label="user tabs" variant="scrollable" scrollButtons="auto">
									<Tab
										icon={<UserIcon size={18} />}
										iconPosition="start"
										label="Información General"
										id="user-tab-0"
										aria-controls="user-tabpanel-0"
									/>
									<Tab
										icon={<Wallet size={18} />}
										iconPosition="start"
										label="Suscripción"
										id="user-tab-1"
										aria-controls="user-tabpanel-1"
									/>
									<Tab
										icon={<Calendar size={18} />}
										iconPosition="start"
										label="Actividad"
										id="user-tab-2"
										aria-controls="user-tabpanel-2"
									/>
									<Tab
										icon={<Lock size={18} />}
										iconPosition="start"
										label="Preferencias"
										id="user-tab-3"
										aria-controls="user-tabpanel-3"
									/>
									<Tab icon={<Folder2 size={18} />} iconPosition="start" label="Resumen" id="user-tab-4" aria-controls="user-tabpanel-4" />
									<Tab
										icon={<Setting2 size={18} />}
										iconPosition="start"
										label="Límites de Recursos"
										id="user-tab-5"
										aria-controls="user-tabpanel-5"
									/>
									<Tab
										icon={<CardPos size={18} />}
										iconPosition="start"
										label="Clientes de Stripe"
										id="user-tab-6"
										aria-controls="user-tabpanel-6"
									/>
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

							<TabPanel value={tabValue} index={4}>
								{renderLightData(lightData)}
							</TabPanel>

							<TabPanel value={tabValue} index={5}>
								{renderResourceLimits()}
							</TabPanel>

							<TabPanel value={tabValue} index={6}>
								{renderStripeHistory()}
							</TabPanel>
						</Box>

						{/* Botones de acción - siempre visibles */}
						<Box sx={{ pt: 2 }}>
							<Divider sx={{ mb: 2 }} />
							<Stack direction="row" spacing={1} justifyContent="space-between">
								<Button variant="outlined" color="error" onClick={handleDeleteClick}>
									Eliminar Usuario
								</Button>
								<Stack direction="row" spacing={1}>
									<Button variant="outlined" onClick={onClose}>
										Cerrar
									</Button>
									<Button variant="contained" onClick={handleEditClick}>
										Editar Usuario
									</Button>
								</Stack>
							</Stack>
						</Box>
					</Box>
				</MainCard>
			</Box>

			{/* Modal para editar usuario */}
			{editModalOpen && userData && <EditUserModal user={userData} open={editModalOpen} onClose={handleEditModalClose} />}

			{/* Diálogo para confirmar eliminación */}
			{deleteDialogOpen && userData && <DeleteUserDialog user={userData} open={deleteDialogOpen} onClose={handleDeleteDialogClose} />}
		</>
	);
};

export default UserView;
