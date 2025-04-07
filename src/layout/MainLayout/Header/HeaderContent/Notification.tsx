import { useEffect, useRef, useState } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
	Badge,
	Box,
	ClickAwayListener,
	Link,
	List,
	ListItemButton,
	ListItemAvatar,
	ListItemText,
	ListItemSecondaryAction,
	Paper,
	Popper,
	Stack,
	Typography,
	useMediaQuery,
} from "@mui/material";

// Importar SimpleBar
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import Transitions from "components/@extended/Transitions";
import {
	TableDocument,
	CalendarRemove,
	Gift,
	MessageText1,
	Notification,
	Setting2,
	Add,
	NotificationCircle,
	TaskSquare,
} from "iconsax-react";
import Avatar from "components/@extended/Avatar";
import { ThemeMode } from "types/config";
import { dispatch, useSelector } from "store";
import { markAlertAsRead, fetchUserAlerts, deleteAlert } from "store/reducers/alerts";
import { Alert } from "types/alert";
import { useNavigate } from "react-router-dom";

const actionSX = {
	mt: "6px",
	ml: 1,
	top: "auto",
	right: "auto",
	alignSelf: "flex-start",
	transform: "none",
};

type AvatarColorType = "primary" | "secondary" | "error" | "warning" | "info" | "success" | "default";
type TypographyVariantType =
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "subtitle1"
	| "subtitle2"
	| "body1"
	| "body2"
	| "caption"
	| "button"
	| "overline"
	| "inherit";

const NotificationPage = () => {
	const theme = useTheme();
	const matchesXs = useMediaQuery(theme.breakpoints.down("md"));
	const anchorRef = useRef<any>(null);
	const [read, setRead] = useState(0);
	const [open, setOpen] = useState(false);
	const [showAll, setShowAll] = useState(false);
	const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

	const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? "secondary.200" : "secondary.200";
	const iconBackColor = theme.palette.mode === ThemeMode.DARK ? "background.default" : "secondary.100";

	const navigate = useNavigate();

	const userId = useSelector((state) => state.auth.user?._id || "");
	const alertsData = useSelector((state) => state.alerts.alerts);

	// Calcular alertas a mostrar
	const visibleAlerts = showAll ? alertsData : alertsData.slice(0, 3);

	const handleToggle = () => {
		setOpen((prevOpen) => !prevOpen);
	};

	const handleClose = (event: MouseEvent | TouchEvent) => {
		if (anchorRef.current && anchorRef.current.contains(event.target)) {
			return;
		}
		setOpen(false);
	};

	const handleDeleteAlert = async (alertId: string) => {
		if (processingIds.has(alertId) || !alertId) return;

		try {
			// Marcar como procesando para evitar clics múltiples
			setProcessingIds((prev) => new Set([...prev, alertId]));

			// Eliminar la alerta
			await dispatch(deleteAlert(alertId));

			// Quitar del conjunto de IDs en procesamiento
			setProcessingIds((prev) => {
				const newIds = new Set(prev);
				newIds.delete(alertId);
				return newIds;
			});
		} catch (error) {
			console.error("Error eliminando alerta:", error);

			// Quitar del conjunto de IDs en procesamiento en caso de error
			setProcessingIds((prev) => {
				const newIds = new Set(prev);
				newIds.delete(alertId);
				return newIds;
			});
		}
	};

	const handleMarkAlertAsRead = async (alertId: string) => {
		if (processingIds.has(alertId) || !alertId) return;

		try {
			// Marcar como procesando para evitar clics múltiples
			setProcessingIds((prev) => new Set([...prev, alertId]));

			// Eliminar directamente de la interfaz para una respuesta más rápida
			const newProcessingIds = new Set(processingIds);
			await dispatch(markAlertAsRead(alertId));

			// Quitar del conjunto de IDs en procesamiento
			newProcessingIds.delete(alertId);
			setProcessingIds(newProcessingIds);
		} catch (error) {
			console.error("Error marcando alerta como leída:", error);

			// Quitar del conjunto de IDs en procesamiento en caso de error
			const newProcessingIds = new Set(processingIds);
			newProcessingIds.delete(alertId);
			setProcessingIds(newProcessingIds);
		}
	};

	const toggleShowAll = (e: React.MouseEvent) => {
		e.preventDefault();
		setShowAll(!showAll);
	};

	useEffect(() => {
		const unreadCount = alertsData.filter((alert: Alert) => !alert.read).length;
		setRead(unreadCount);
	}, [alertsData]);

	useEffect(() => {
		const fetchAlerts = async (userId: string) => {
			if (!userId) return;
			try {
				dispatch(fetchUserAlerts(userId));
			} catch (error) {
				console.error("Error recibiendo alerts", error);
			}
		};

		fetchAlerts(userId);
	}, [userId]);

	const getFormattedNotification = (notification: Alert) => {
		if (!notification.expirationDate) {
			return {
				primaryText: notification.secondaryText || "Notificación",
				primaryVariant: "body1" as TypographyVariantType, // Asegurarse de usar el tipo correcto
				typographyColor: "info",
				avatarColor: "primary" as AvatarColorType,
			};
		}

		try {
			// Usar la expirationDate proporcionada por el servidor
			const expirationDate = new Date(notification.expirationDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Calcular diferencia en días
			const diffTime = expirationDate.getTime() - today.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			// Determinar el mensaje, variante y color según los días restantes
			let primaryText = "";
			let typographyColor = "info";
			let avatarColor: AvatarColorType = "primary";

			// Adaptación según el tipo de notificación
			const isTask = notification.avatarIcon === "TaskSquare";
			const isEvent = notification.avatarIcon === "CalendarRemove";
			const isMovement = notification.avatarIcon === "TableDocument";

			const itemType = isTask ? "Tarea" : isEvent ? "Evento" : "Movimiento";

			if (diffDays < 0) {
				primaryText = `${itemType} vencido${isTask || isMovement ? "a" : ""} hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? "s" : ""
					}`;
				typographyColor = "error";
				avatarColor = "error";
			} else if (diffDays === 0) {
				primaryText = `${itemType} vence hoy`;
				typographyColor = "warning";
				avatarColor = "warning";
			} else if (diffDays === 1) {
				primaryText = `${itemType} vence mañana`;
				typographyColor = "warning";
				avatarColor = "warning";
			} else if (diffDays <= 3) {
				primaryText = `${itemType} vence en ${diffDays} días`;
				typographyColor = "warning";
				avatarColor = "warning";
			} else if (diffDays <= 7) {
				primaryText = `${itemType} vence en ${diffDays} días`;
				typographyColor = "info";
				avatarColor = "info";
			} else {
				primaryText = `${itemType} vence en ${diffDays} días`;
				typographyColor = "info";
				avatarColor = "secondary";
			}

			// Usar una variante específica para Typography (forzar el tipo correcto)
			const primaryVariant: TypographyVariantType = "body1";

			if (notification.read) {
				typographyColor = "text.secondary";
				// Mantener una versión atenuada del color del avatar
				if (avatarColor === "error") avatarColor = "default";
				if (avatarColor === "warning" || avatarColor === "info") avatarColor = "secondary";
			}

			return { primaryText, primaryVariant, typographyColor, avatarColor };
		} catch (error) {
			console.error("Error al procesar la fecha de la notificación:", error);
			// Devolver valores predeterminados si hay algún error
			return {
				primaryText: notification.secondaryText || "Notificación",
				primaryVariant: "body1" as TypographyVariantType,
				typographyColor: "info",
				avatarColor: "primary" as AvatarColorType,
			};
		}
	};

	const handleNotificationClick = (notification: Alert) => {
		if (notification.folderId) {
			handleMarkAlertAsRead(notification._id);
			setOpen(false);
			navigate(`/apps/folders/details/${notification.folderId}`);
		}
	};

	const listItemSxStyles = {
		"& .MuiListItemButton-root": {
			p: 1.5,
			my: 1.5,
			border: `1px solid ${theme.palette.divider}`,
			borderRadius: 1, // Añadir bordes redondeados para un aspecto más moderno
			transition: "all 0.2s ease-in-out", // Transición para todos los cambios de estilo
			position: "relative", // Necesario para efectos de ripple personalizado
			overflow: "hidden", // Contener el efecto ripple

			"&.read": {
				opacity: 0.7,
				bgcolor: theme.palette.mode === ThemeMode.DARK ? alpha(theme.palette.background.paper, 0.5) : alpha(theme.palette.grey[100], 0.7),
				border: `1px dashed ${theme.palette.divider}`,

				// Reducir el efecto hover en items leídos
				"&:hover": {
					bgcolor: theme.palette.mode === ThemeMode.DARK ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[100], 0.9),
					borderColor: theme.palette.divider,
					transform: "none",
					boxShadow: "none",
				},
			},

			// Efecto hover mejorado
			"&:hover": {
				bgcolor: "primary.lighter",
				borderColor: theme.palette.primary.light,
				transform: "translateY(-1px)", // Ligero efecto de elevación al pasar el mouse
				boxShadow: `0 2px 4px rgba(0,0,0,0.05)`,
			},

			// Efecto activo (durante el clic)
			"&:active": {
				transform: "translateY(0)",
				boxShadow: "none",
				bgcolor: theme.palette.mode === ThemeMode.DARK ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
			},

			// Estado de procesamiento
			"&.processing": {
				opacity: 0.7,
				pointerEvents: "none",
			},

			// Posicionamiento de acciones secundarias
			"& .MuiListItemSecondaryAction-root": {
				...actionSX,
				position: "relative",
			},

			// Efecto de ripple personalizado
			"&::after": {
				content: '""',
				position: "absolute",
				top: "50%",
				left: "50%",
				width: 5,
				height: 5,
				backgroundColor: alpha(theme.palette.primary.main, 0.3),
				opacity: 0,
				borderRadius: "100%",
				transform: "scale(1, 1) translate(-50%, -50%)",
				transformOrigin: "50% 50%",
			},

			// Animación del ripple al hacer clic
			"&:focus::after": {
				animation: "ripple 0.6s linear",
				"@keyframes ripple": {
					"0%": {
						opacity: 1,
						transform: "scale(0, 0) translate(-50%, -50%)",
						transformOrigin: "50% 50%",
					},
					"100%": {
						opacity: 0,
						transform: "scale(20, 20) translate(-50%, -50%)",
						transformOrigin: "50% 50%",
					},
				},
			},
		},
	};

	// Renderizar la lista de notificaciones
	const renderNotificationsList = () => (
		<>
			{showAll && alertsData.length > 3 ? (
				<SimpleBar style={{ maxHeight: 350 }}>
					<List component="nav" sx={listItemSxStyles}>
						{visibleAlerts.map((notification: Alert) => (
							<ListItemButton
								key={notification._id}
								className={`${processingIds.has(notification._id) ? "processing" : ""} ${notification.read ? "read" : ""}`}
								onClick={() => handleNotificationClick(notification)}
							>
								<ListItemAvatar>
									<Avatar type={notification.avatarType} color={getFormattedNotification(notification).avatarColor}>
										{notification.avatarIcon === "Gift" && <Gift size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "MessageText1" && <MessageText1 size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "Setting2" && <Setting2 size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "TableDocument" && <TableDocument size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "CalendarRemove" && <CalendarRemove size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "TaskSquare" && <TaskSquare size={notification.avatarSize} variant="Bold" />}
										{notification.avatarInitial && notification.avatarInitial}
									</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={
										<Typography
											variant={getFormattedNotification(notification).primaryVariant}
											color={getFormattedNotification(notification).typographyColor}
										>
											{getFormattedNotification(notification).primaryText}
										</Typography>
									}
									secondary={notification.secondaryText}
								/>
								<ListItemSecondaryAction>
									<IconButton
										shape="rounded"
										color={notification.read ? "secondary" : "error"}
										onClick={(e) => {
											e.stopPropagation(); // Evitar que el clic se propague al ListItemButton
											handleDeleteAlert(notification._id);
										}}
										disabled={processingIds.has(notification._id)}
										sx={{
											transition: "all 0.15s ease-in-out",
											opacity: notification.read ? 0.6 : 1,
											"&:hover": {
												transform: "rotate(90deg)",
												// Modificar esta línea para usar un color con mayor transparencia
												bgcolor: notification.read
													? alpha(theme.palette.secondary.light, 0.3)
													: alpha(theme.palette.error.light, 0.3),
											},
											"&:active": {
												transform: "rotate(90deg) scale(0.9)",
											},
										}}
									>
										<Add style={{ transform: "rotate(45deg)" }} />
									</IconButton>
								</ListItemSecondaryAction>
							</ListItemButton>
						))}
					</List>
				</SimpleBar>
			) : (
				<List component="nav" sx={listItemSxStyles}>
					{visibleAlerts.map((notification: Alert) => {
						const formattedNotification = getFormattedNotification(notification);
						return (
							<ListItemButton
								key={notification._id}
								className={`${processingIds.has(notification._id) ? "processing" : ""} ${notification.read ? "read" : ""}`}
								onClick={() => handleNotificationClick(notification)}
							>
								<ListItemAvatar>
									<Avatar type={notification.avatarType} color={formattedNotification.avatarColor}>
										{notification.avatarIcon === "Gift" && <Gift size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "MessageText1" && <MessageText1 size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "Setting2" && <Setting2 size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "TableDocument" && <TableDocument size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "CalendarRemove" && <CalendarRemove size={notification.avatarSize} variant="Bold" />}
										{notification.avatarIcon === "TaskSquare" && <TaskSquare size={notification.avatarSize} variant="Bold" />}
										{notification.avatarInitial && notification.avatarInitial}
									</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={
										<Typography variant={formattedNotification.primaryVariant} color={formattedNotification.typographyColor}>
											{formattedNotification.primaryText}
										</Typography>
									}
									secondary={notification.secondaryText}
								/>
								<ListItemSecondaryAction>
									<IconButton
										shape="rounded"
										color={notification.read ? "secondary" : "error"}
										onClick={(e) => {
											e.stopPropagation(); // Evitar que el clic se propague al ListItemButton
											handleDeleteAlert(notification._id);
										}}
										disabled={processingIds.has(notification._id)}
										sx={{
											transition: "all 0.15s ease-in-out",
											opacity: notification.read ? 0.6 : 1,
											"&:hover": {
												transform: "rotate(90deg)",
												// Modificar esta línea para usar un color con mayor transparencia
												bgcolor: notification.read
													? alpha(theme.palette.secondary.light, 0.3)
													: alpha(theme.palette.error.light, 0.3),
											},
											"&:active": {
												transform: "rotate(90deg) scale(0.9)",
											},
										}}
									>
										<Add style={{ transform: "rotate(45deg)" }} />
									</IconButton>
								</ListItemSecondaryAction>
							</ListItemButton>
						);
					})}
				</List>
			)}
			{alertsData.length > 3 && (
				<Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
					<Link href="#" variant="h6" color="primary" onClick={toggleShowAll}>
						{showAll ? "Ver menos" : "Ver todas"}
					</Link>
				</Stack>
			)}
		</>
	);

	const NotificationEmptyState = () => {
		const theme = useTheme();

		return (
			<Stack
				direction="column"
				spacing={2.5}
				justifyContent="center"
				alignItems="center"
				sx={{
					py: 4,
					px: 3,
					borderRadius: 2,
					bgcolor: theme.palette.mode === ThemeMode.DARK ? "background.default" : "grey.50",
				}}
			>
				{/* Ícono simple con animación sutil */}
				<Box
					sx={{
						animation: "pulse 3s infinite",
						"@keyframes pulse": {
							"0%": { opacity: 0.8 },
							"50%": { opacity: 1 },
							"100%": { opacity: 0.8 },
						},
					}}
				>
					<NotificationCircle size={50} variant="Bulk" color={theme.palette.primary.main} />
				</Box>

				{/* Título descriptivo */}
				<Typography variant="h6" color="textPrimary" fontWeight="500">
					No tienes notificaciones pendientes
				</Typography>

				<Link
					href="#"
					variant="body2"
					color="primary"
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						mt: 0.5,
						"&:hover": { textDecoration: "none" },
					}}
					// Si tienes una página de configuración de notificaciones
					onClick={() => {
						setOpen(false);
						navigate("apps/profiles/user/settings");
					}}
				>
					<Setting2 size={13} />
					Configurar preferencias
				</Link>
			</Stack>
		);
	};

	return (
		<Box sx={{ flexShrink: 0, ml: 0.5 }}>
			<IconButton
				color="secondary"
				variant="light"
				aria-label="open notifications"
				ref={anchorRef}
				aria-controls={open ? "notifications-popup" : undefined}
				aria-haspopup="true"
				onClick={handleToggle}
				size="large"
				sx={{ color: "secondary.main", bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
			>
				<Badge badgeContent={read} color="success" sx={{ "& .MuiBadge-badge": { top: 2, right: 4 } }}>
					<Notification variant="Bold" />
				</Badge>
			</IconButton>
			<Popper
				placement={matchesXs ? "bottom" : "bottom-end"}
				open={open}
				anchorEl={anchorRef.current}
				role={undefined}
				transition
				disablePortal
				popperOptions={{
					modifiers: [
						{
							name: "offset",
							options: {
								offset: [matchesXs ? -5 : 0, 9],
							},
						},
					],
				}}
			>
				{({ TransitionProps }) => (
					<Transitions type="grow" position={matchesXs ? "top" : "top-right"} sx={{ overflow: "hidden" }} in={open} {...TransitionProps}>
						<Paper
							sx={{
								boxShadow: theme.customShadows.z1,
								borderRadius: 1.5,
								width: "100%",
								minWidth: 285,
								maxWidth: 420,
								[theme.breakpoints.down("md")]: {
									maxWidth: 285,
								},
							}}
						>
							<ClickAwayListener onClickAway={handleClose}>
								<MainCard elevation={0} border={false}>
									<Stack direction="row" alignItems="center" justifyContent="space-between">
										<Typography variant="h5">Notificaciones</Typography>
									</Stack>

									{alertsData.length > 0 ? renderNotificationsList() : <NotificationEmptyState />}
								</MainCard>
							</ClickAwayListener>
						</Paper>
					</Transitions>
				)}
			</Popper>
		</Box>
	);
};

export default NotificationPage;
