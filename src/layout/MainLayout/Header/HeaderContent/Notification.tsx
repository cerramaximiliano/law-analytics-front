import React from "react";
import { useEffect, useRef, useState } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
	Badge,
	Box,
	ClickAwayListener,
	CircularProgress,
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
	Tooltip,
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
	TaskSquare,
	TickCircle,
} from "iconsax-react";
import Avatar from "components/@extended/Avatar";
import { ThemeMode } from "types/config";
import { dispatch, useSelector } from "store";
import { markAlertAsRead, fetchUserAlerts, deleteAlert, loadMoreAlerts } from "store/reducers/alerts";
import { Alert } from "types/alert";
import { useNavigate } from "react-router-dom";
import { BRAND_BLUE, headerBorder, headerShadow, LIVE_GREEN, LIVE_PULSE_KEYFRAMES, navActiveBg } from "themes/dashboardTokens";

const actionSX = {
	mt: 0,
	mr: 0,
	top: "50%",
	right: 0,
	transform: "translateY(-50%)",
	position: "absolute",
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
	const isDark = theme.palette.mode === ThemeMode.DARK;
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
	const pagination = useSelector((state) => state.alerts.pagination);
	const stats = useSelector((state) => state.alerts.stats);
	const isLoading = useSelector((state) => state.alerts.isLoader);

	// Separar alertas leídas y no leídas
	const unreadAlerts = alertsData.filter((alert: Alert) => !alert.read);
	const readAlerts = alertsData.filter((alert: Alert) => alert.read);

	// Combinar con las no leídas primero
	const sortedAlerts = [...unreadAlerts, ...readAlerts];

	// Calcular alertas a mostrar
	const visibleAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, 3);

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

	// Función para manejar el scroll infinito
	const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		const scrollTop = target.scrollTop;
		const scrollHeight = target.scrollHeight;
		const clientHeight = target.clientHeight;

		// Si estamos cerca del final (90%) y hay más páginas disponibles
		if (scrollTop + clientHeight >= scrollHeight * 0.9 && pagination?.hasNext && !isLoading) {
			dispatch(loadMoreAlerts(userId, pagination.page));
		}
	};

	useEffect(() => {
		// Usar stats.unread si está disponible, sino contar las alertas no leídas
		setRead(stats?.unread ?? unreadAlerts.length);
	}, [stats?.unread, unreadAlerts.length]);

	useEffect(() => {
		const fetchAlerts = async (userId: string) => {
			if (!userId) return;
			try {
				// Cargar la primera página con 20 alertas
				dispatch(fetchUserAlerts(userId, 1, 20));
			} catch (error) {}
		};

		fetchAlerts(userId);
	}, [userId]);

	const getFormattedNotification = (notification: Alert) => {
		// Si la notificación tiene primaryText definido, usarlo directamente
		if (notification.primaryText) {
			return {
				primaryText: notification.primaryText,
				primaryVariant: "body1" as TypographyVariantType,
				typographyColor: notification.read ? "text.secondary" : "text.primary",
				avatarColor: "primary" as AvatarColorType,
			};
		}

		// Si no hay fecha de expiración, usar secondaryText como fallback
		if (!notification.expirationDate) {
			return {
				primaryText: notification.secondaryText || "Notificación",
				primaryVariant: "body1" as TypographyVariantType,
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
				primaryText = `${itemType} vencido${isTask || isMovement ? "a" : ""} hace ${Math.abs(diffDays)} día${
					Math.abs(diffDays) !== 1 ? "s" : ""
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
		// Navegación para eventos
		if (notification.sourceType === "event" && notification.sourceId) {
			handleMarkAlertAsRead(notification._id);
			setOpen(false);
			navigate("/apps/calendar");
			return;
		}

		// Navegación para tareas
		if (notification.sourceType === "task" && notification.sourceId) {
			handleMarkAlertAsRead(notification._id);
			setOpen(false);
			navigate("/tareas");
			return;
		}

		// Navegación para movimientos
		if (notification.sourceType === "movement" && notification.sourceId) {
			handleMarkAlertAsRead(notification._id);
			setOpen(false);
			// Si tiene folderId, usar ese en lugar del sourceId
			const navigationId = notification.folderId || notification.sourceId;
			navigate(`/apps/folders/details/${navigationId}`);
			return;
		}

		// Navegación para carpetas (mantener funcionalidad existente)
		if (notification.folderId) {
			handleMarkAlertAsRead(notification._id);
			setOpen(false);
			navigate(`/apps/folders/details/${notification.folderId}`);
		}
	};

	const listItemSxStyles = {
		"& .MuiListItemButton-root": {
			p: 1.5,
			pr: 10, // Añadir padding derecho para los dos botones
			my: 1.5,
			border: `1px solid ${theme.palette.divider}`,
			borderRadius: 1, // Añadir bordes redondeados para un aspecto más moderno
			transition: "all 0.2s ease-in-out", // Transición para todos los cambios de estilo
			position: "relative", // Necesario para efectos de ripple personalizado
			overflow: "hidden", // Contener el efecto ripple

			"&.read": {
				opacity: 0.7,
				// Bg muy sutil tintado brand para mantener coherencia visual; border
				// sólido con alpha bajo en vez del 1px dashed (relicto Phoenix).
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.09)}`,

				// Reducir el efecto hover en items leídos
				"&:hover": {
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.07 : 0.05),
					borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.16),
					transform: "none",
					boxShadow: "none",
				},
			},

			// Efecto hover mejorado — usa el mismo lenguaje del active pill del nav
			// rail (bg + border calibrados como "marcado pero no fuerte").
			"&:hover": {
				bgcolor: navActiveBg(isDark),
				borderColor: alpha(BRAND_BLUE, isDark ? 0.55 : 0.5),
				transform: "translateY(-1px)",
				boxShadow: `0 2px 6px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
			},

			// Efecto activo (durante el clic)
			"&:active": {
				transform: "translateY(0)",
				boxShadow: "none",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.12),
			},

			// Estado de procesamiento
			"&.processing": {
				opacity: 0.7,
				pointerEvents: "none",
			},

			// Posicionamiento de acciones secundarias
			"& .MuiListItemSecondaryAction-root": {
				...actionSX,
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

	// Render compartido de un item — antes estaba duplicado entre la rama con
	// SimpleBar (showAll) y la rama compacta. Toda la lógica visual va acá.
	const renderItem = (notification: Alert) => {
		const formatted = getFormattedNotification(notification);
		const isProcessing = processingIds.has(notification._id);
		return (
			<ListItemButton
				key={notification._id}
				className={`${isProcessing ? "processing" : ""} ${notification.read ? "read" : ""}`}
				onClick={() => handleNotificationClick(notification)}
			>
				<ListItemAvatar>
					<Avatar type={notification.avatarType} color={formatted.avatarColor}>
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
						<Typography variant={formatted.primaryVariant} color={formatted.typographyColor}>
							{formatted.primaryText}
						</Typography>
					}
					secondary={
						notification.secondaryText ? (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
								}}
							>
								{notification.secondaryText}
							</Typography>
						) : null
					}
				/>
				<ListItemSecondaryAction>
					<Box sx={{ display: "flex", gap: 0.5 }}>
						{!notification.read && (
							<Tooltip title="Marcar como leído" placement="left">
								<IconButton
									shape="rounded"
									color="secondary"
									data-testid="notification-mark-read-btn"
									onClick={(e) => {
										e.stopPropagation();
										handleMarkAlertAsRead(notification._id);
									}}
									disabled={isProcessing}
									sx={{
										color: "text.secondary",
										transition: "color 0.15s ease-in-out, background-color 0.15s ease-in-out",
										"&:hover": {
											color: theme.palette.success.main,
											bgcolor: alpha(theme.palette.success.main, 0.1),
										},
									}}
								>
									<TickCircle size={20} />
								</IconButton>
							</Tooltip>
						)}
						<Tooltip title="Eliminar" placement="left">
							<IconButton
								shape="rounded"
								color="secondary"
								data-testid="notification-delete-btn"
								onClick={(e) => {
									e.stopPropagation();
									handleDeleteAlert(notification._id);
								}}
								disabled={isProcessing}
								sx={{
									color: "text.secondary",
									transition: "color 0.15s ease-in-out, background-color 0.15s ease-in-out, transform 0.15s ease-in-out",
									opacity: notification.read ? 0.7 : 1,
									"&:hover": {
										color: theme.palette.error.main,
										bgcolor: alpha(theme.palette.error.main, 0.1),
										transform: "rotate(90deg)",
									},
									"&:active": {
										transform: "rotate(90deg) scale(0.9)",
									},
								}}
							>
								<Add style={{ transform: "rotate(45deg)" }} />
							</IconButton>
						</Tooltip>
					</Box>
				</ListItemSecondaryAction>
			</ListItemButton>
		);
	};

	// Renderizar la lista de notificaciones
	const renderNotificationsList = () => (
		<>
			{showAll && sortedAlerts.length > 3 ? (
				<SimpleBar style={{ maxHeight: 350 }} onScroll={handleScroll}>
					<List component="nav" sx={listItemSxStyles}>
						{visibleAlerts.map(renderItem)}

						{/* Indicador de carga cuando se están cargando más alertas */}
						{isLoading && pagination && pagination.page > 1 && (
							<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
								<CircularProgress size={24} />
							</Box>
						)}

						{/* Mensaje cuando no hay más alertas */}
						{!isLoading && pagination && !pagination.hasNext && sortedAlerts.length > 3 && (
							<Box sx={{ textAlign: "center", py: 2 }}>
								<Typography variant="caption" color="textSecondary">
									No hay más notificaciones
								</Typography>
							</Box>
						)}
					</List>
				</SimpleBar>
			) : (
				<List component="nav" sx={listItemSxStyles}>
					{visibleAlerts.map(renderItem)}
				</List>
			)}
			{sortedAlerts.length > 3 && (
				<Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
					<Link component="button" variant="h6" color="primary" onClick={toggleShowAll} sx={{ background: "none", border: "none", cursor: "pointer" }}>
						{showAll ? "Ver menos" : "Ver todas"}
					</Link>
				</Stack>
			)}
		</>
	);

	const NotificationEmptyState = () => (
		<Box
			sx={{
				py: 4,
				px: 3,
				textAlign: "center",
				borderRadius: 2,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.07)}`,
			}}
		>
			{/* Hero — anillos concéntricos brand-blue + tick verde con pulse corner.
			    El anillo más externo escanea (radar) lento para reforzar "monitoreo activo".
			    El disco interno tiene gradiente radial en vez de fill plano, y un live
			    pulse dot abajo-derecha como las tiles del landing. */}
			<Box sx={{ position: "relative", display: "inline-flex", mb: 2.5, mt: 1 }}>
				{/* Ring 3 — animación scan (radar) */}
				<Box
					aria-hidden
					sx={{
						position: "absolute",
						inset: -28,
						borderRadius: "50%",
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.14)}`,
						animation: "la-empty-scan 3.6s ease-out infinite",
						"@keyframes la-empty-scan": {
							"0%": { transform: "scale(0.78)", opacity: 0 },
							"30%": { opacity: 1 },
							"100%": { transform: "scale(1.18)", opacity: 0 },
						},
					}}
				/>
				{/* Ring 2 — estático medio */}
				<Box
					aria-hidden
					sx={{
						position: "absolute",
						inset: -18,
						borderRadius: "50%",
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.1)}`,
					}}
				/>
				{/* Ring 1 — estático interno */}
				<Box
					aria-hidden
					sx={{
						position: "absolute",
						inset: -8,
						borderRadius: "50%",
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.16)}`,
					}}
				/>
				{/* Disco central con gradient radial — BRAND_BLUE monocromático, en línea
			    con el badge de la campanita y el resto del lenguaje. El corner pulse
			    queda LIVE_GREEN como único acento — "señal de vida" del sistema. */}
				<Box
					sx={{
						width: 72,
						height: 72,
						borderRadius: "50%",
						background: `radial-gradient(circle at 35% 30%, ${alpha(BRAND_BLUE, isDark ? 0.34 : 0.24)} 0%, ${alpha(
							BRAND_BLUE,
							isDark ? 0.14 : 0.09,
						)} 70%)`,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.38 : 0.28)}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
						zIndex: 1,
						boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
					}}
				>
					<TickCircle size={36} variant="Bulk" color={BRAND_BLUE} />
					{/* Live pulse dot — único acento verde del empty state, comunica
					    "monitoreo activo" sin competir con el resto del lenguaje brand-blue. */}
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							bottom: 2,
							right: 2,
							width: 10,
							height: 10,
							borderRadius: "50%",
							bgcolor: LIVE_GREEN,
							border: `2px solid ${theme.palette.background.paper}`,
							zIndex: 3,
							"&::after": {
								content: '""',
								position: "absolute",
								inset: -1,
								borderRadius: "50%",
								bgcolor: LIVE_GREEN,
								animation: "la-live-pulse 2.4s ease-out infinite",
							},
							...LIVE_PULSE_KEYFRAMES,
						}}
					/>
				</Box>
			</Box>

			<Typography
				sx={{
					fontSize: "1.05rem",
					fontWeight: 600,
					letterSpacing: "-0.015em",
					color: "text.primary",
					mb: 0.75,
				}}
			>
				Todo al día
			</Typography>

			<Typography
				sx={{
					fontSize: "0.82rem",
					color: "text.secondary",
					lineHeight: 1.55,
					maxWidth: 280,
					mx: "auto",
					mb: 2.5,
					textWrap: "balance",
				}}
			>
				Te avisamos apenas tengamos novedades de tus expedientes, vencimientos o tareas.
			</Typography>

			<Box sx={{ borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`, mt: 0.5, pt: 2 }}>
				<Link
					component="button"
					onClick={() => {
						setOpen(false);
						navigate("apps/profiles/user/settings");
					}}
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.6,
						fontSize: "0.78rem",
						fontWeight: 600,
						color: BRAND_BLUE,
						textDecoration: "none",
						border: "none",
						background: "none",
						cursor: "pointer",
						letterSpacing: "-0.005em",
						"&:hover": { textDecoration: "underline" },
					}}
				>
					<Setting2 size={14} variant="Bulk" />
					Configurar preferencias
				</Link>
			</Box>
		</Box>
	);

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
				<Badge
					badgeContent={read}
					max={99}
					overlap="circular"
					sx={{
						"& .MuiBadge-badge": {
							bgcolor: BRAND_BLUE,
							color: "#fff",
							fontWeight: 500,
							fontSize: "0.68rem",
							minWidth: 16,
							height: 16,
							padding: "0 4px",
							lineHeight: 1,
							fontVariantNumeric: "tabular-nums",
						},
					}}
				>
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
								boxShadow: headerShadow(isDark),
								border: `1px solid ${headerBorder(isDark)}`,
								borderRadius: 1.5,
								width: 420,
								[theme.breakpoints.down("md")]: {
									width: 285,
								},
							}}
						>
							<ClickAwayListener onClickAway={handleClose}>
								<MainCard elevation={0} border={false}>
									<Stack direction="row" alignItems="center" justifyContent="space-between">
										<Typography variant="h5">Notificaciones</Typography>
									</Stack>

									{sortedAlerts.length > 0 ? renderNotificationsList() : <NotificationEmptyState />}
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
