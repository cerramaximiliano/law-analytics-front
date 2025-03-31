// Notifications.tsx
import React, { useEffect, useState } from "react";
import {
	Stack,
	Skeleton,
	Grid,
	Button,
	IconButton,
	CardContent,
	Tooltip,
	Box,
	Typography,
	Paper,
	Chip, // Agregar esta importación
} from "@mui/material";
import Avatar from "components/@extended/Avatar";
import MainCard from "components/MainCard";
import { Add, Notification1, SmsNotification, NotificationStatus, Edit, Trash, ArrowUp, ArrowDown, Calendar } from "iconsax-react";
import ModalNotifications from "../modals/ModalNotifications";
import { useParams } from "react-router";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { dispatch, useSelector } from "store";
import { getNotificationsByFolderId } from "store/reducers/notifications";
import { NotificationType } from "types/notifications";
import AlertNotificationDelete from "../modals/alertNotificationDelete";
import { useTheme } from "@mui/material/styles";

interface NotificationsProps {
	title: string;
	folderName?: string;
}

const getIconAndColor = (
	notification: string,
	user: string,
): { icon: React.ReactElement; color: "error" | "default" | "primary" | "secondary" | "info" | "success" | "warning" } => {
	switch (notification) {
		case "Carta Documento":
		case "Telegrama":
			return {
				icon: <SmsNotification />,
				color: user === "Actora" ? "success" : user === "Demandada" ? "error" : "default",
			};
		case "Cédula":
			return {
				icon: <Notification1 />,
				color: "primary",
			};
		case "Notarial":
			return {
				icon: <NotificationStatus />,
				color: "warning",
			};
		default:
			return {
				icon: <Notification1 />,
				color: "secondary",
			};
	}
};
const EmptyState = () => (
	<Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "transparent" }}>
		<Stack spacing={3} alignItems="center">
			<Avatar
				color="error"
				variant="rounded"
				sx={{
					width: 80,
					height: 80,
					bgcolor: "error.lighter",
					transition: "transform 0.3s ease-in-out",
					"&:hover": {
						transform: "scale(1.1)",
					},
				}}
			>
				<Notification1 variant="Bulk" size={40} />
			</Avatar>
			<Box>
				<Typography variant="h5" gutterBottom>
					No hay notificaciones registradas
				</Typography>
				<Typography variant="body2" color="textSecondary">
					Comienza agregando una nueva notificación usando el botón +
				</Typography>
			</Box>
		</Stack>
	</Paper>
);

const NotificationSkeleton = () => (
	<Paper elevation={0} sx={{ p: 2, mb: 2 }}>
		<Stack direction="row" spacing={3} alignItems="flex-start">
			<Stack spacing={1} alignItems="center" width={100}>
				<Skeleton width={70} height={20} />
				<Skeleton variant="circular" width={48} height={48} />
			</Stack>
			<Stack spacing={1.5} flex={1}>
				<Skeleton variant="text" width="70%" height={28} />
				<Skeleton variant="text" width="90%" height={20} />
				<Skeleton variant="rounded" width="40%" height={32} />
			</Stack>
		</Stack>
	</Paper>
);

const Notifications: React.FC<NotificationsProps> = ({ title, folderName }) => {
	const theme = useTheme();
	const [open, setOpen] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	const [editNotification, setEditNotification] = useState<NotificationType | null>(null);
	const [showAll, setShowAll] = useState(false);
	const [containerHeight, setContainerHeight] = useState(250);
	const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
	const [parent] = useAutoAnimate({ duration: 200 });

	const { id } = useParams();
	const notificationsData = useSelector((state: any) => state.notifications);

	const handleCloseModal = () => {
		setOpen(false);
		setEditNotification(null);
	};

	const handleOpen = () => {
		if (!notificationsData.isLoader) {
			setEditNotification(null);
			setOpen(true);
		}
	};

	const handleEditClick = (notification: NotificationType) => {
		setEditNotification(notification);
		setOpen(true);
	};

	const handleNotificationSelect = (notificationId: string) => {
		setSelectedNotificationId((currentId) => (currentId === notificationId ? null : notificationId));
	};

	const toggleShowAll = () => {
		setShowAll((prev) => !prev);
		setContainerHeight((prev) => (prev === 250 ? notificationsData.notifications.length * 110 : 250));
	};

	useEffect(() => {
		if (id) {
			dispatch(getNotificationsByFolderId(id));
		}
	}, [id]);

	useEffect(() => {
		setSelectedNotificationId(null);
	}, [notificationsData.notifications]);

	const displayedNotifications = showAll ? notificationsData.notifications : notificationsData.notifications.slice(0, 2);

	const NotificationItem = ({ notification, isFirst }: { notification: NotificationType; isFirst: boolean }) => {
		const { icon, color } = getIconAndColor(notification.notification || "", notification.user || "");
		const isSelected = selectedNotificationId === notification._id;

		return (
			<Grid item xs={12}>
				<Paper
					elevation={isSelected ? 2 : 0}
					onClick={() => handleNotificationSelect(notification._id!)}
					sx={{
						p: 2.5,
						transition: "all 0.3s ease-in-out",
						cursor: "pointer",
						position: "relative",
						bgcolor: isSelected ? "primary.lighter" : "background.paper",
						borderLeft: `4px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
						"&:hover": {
							bgcolor: isSelected ? "primary.lighter" : "action.hover",
							transform: "translateX(4px)",
							boxShadow: theme.shadows[2],
						},
					}}
				>
					<Grid container spacing={3}>
						<Grid item>
							<Stack spacing={1} alignItems="center">
								<Typography
									variant="caption"
									color="secondary"
									sx={{
										fontWeight: 500,
										bgcolor: "secondary.lighter",
										px: 1.5,
										py: 0.5,
										borderRadius: 1,
										whiteSpace: "nowrap",
									}}
								>
									{notification.time}
								</Typography>
								<Avatar
									color={color}
									sx={{
										width: 48,
										height: 48,
										bgcolor: `${color}.lighter`,
										transition: "transform 0.2s ease",
										"&:hover": {
											transform: "scale(1.1)",
										},
									}}
								>
									<Tooltip title={`${notification.notification}/${notification.user}`}>{icon}</Tooltip>
								</Avatar>
							</Stack>
						</Grid>
						<Grid item xs>
							<Stack spacing={1.5}>
								<Typography
									variant="h6"
									sx={{
										fontSize: "1.1rem",
										fontWeight: isSelected ? 600 : 500,
									}}
								>
									{notification.title}
								</Typography>
								{notification.description && (
									<Typography
										color="textSecondary"
										sx={{
											fontSize: "0.95rem",
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
										}}
									>
										{notification.description}
									</Typography>
								)}
								{notification.dateExpiration && (
									<Stack direction="row" spacing={2} alignItems="center">
										<Chip
											icon={<Calendar variant="Bold" size={16} />}
											label={`Vence: ${notification.dateExpiration}`}
											color="warning"
											variant="outlined"
											size="small"
											sx={{
												borderRadius: 1,
												"& .MuiChip-label": {
													px: 1,
													fontSize: "0.85rem",
												},
											}}
										/>
									</Stack>
								)}
							</Stack>
						</Grid>
					</Grid>
				</Paper>
			</Grid>
		);
	};

	const FooterActions = () => (
		<Paper
			elevation={0}
			sx={{
				mt: 3,
				pt: 2,
				px: 2,
				pb: 2,
				borderTop: `1px solid ${theme.palette.divider}`,
				bgcolor: "background.default",
				borderBottomLeftRadius: theme.shape.borderRadius,
				borderBottomRightRadius: theme.shape.borderRadius,
			}}
		>
			<Stack direction="row" spacing={2} alignItems="center">
				<Button
					variant="outlined"
					color="secondary"
					onClick={toggleShowAll}
					endIcon={showAll ? <ArrowUp /> : <ArrowDown />}
					sx={{
						flexGrow: 1,
						py: 1,
						fontWeight: 500,
						borderWidth: 1.5,
						"&:hover": {
							borderWidth: 1.5,
							bgcolor: "secondary.lighter",
						},
					}}
				>
					{showAll ? "Mostrar menos" : `Ver todos (${notificationsData.notifications.length})`}
				</Button>

				<Tooltip title={selectedNotificationId ? "Editar notificación" : "Seleccione una notificación para editar"}>
					<span>
						<IconButton
							color="primary"
							disabled={!selectedNotificationId}
							size="medium"
							onClick={() => {
								const notification = notificationsData.notifications.find((n: NotificationType) => n._id === selectedNotificationId);
								if (notification) handleEditClick(notification);
							}}
							sx={{
								border: `1.5px solid ${theme.palette.primary.main}`,
								"&:hover": {
									bgcolor: "primary.lighter",
								},
							}}
						>
							<Edit variant="Bulk" size={20} />
						</IconButton>
					</span>
				</Tooltip>

				<Tooltip title={selectedNotificationId ? "Eliminar notificación" : "Seleccione una notificación para eliminar"}>
					<span>
						<IconButton
							color="error"
							disabled={!selectedNotificationId}
							size="medium"
							onClick={() => setOpenDeleteModal(true)}
							sx={{
								border: `1.5px solid ${theme.palette.error.main}`,
								"&:hover": {
									bgcolor: "error.lighter",
								},
							}}
						>
							<Trash variant="Bulk" size={20} />
						</IconButton>
					</span>
				</Tooltip>
			</Stack>
		</Paper>
	);

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<Stack direction="row" spacing={1}>
					<Tooltip title="Agregar notificación">
						<IconButton
							onClick={handleOpen}
							disabled={notificationsData.isLoader}
							color="secondary" sx={{ color: "secondary.darker" }}
						>
							<Add />
						</IconButton>
					</Tooltip>
				</Stack>
			}
			sx={{
				"& .MuiCardContent-root": {
					p: 0,
				},
			}}
		>
			<ModalNotifications
				open={open}
				setOpen={handleCloseModal}
				folderId={id}
				editMode={!!editNotification}
				notificationData={editNotification}
				folderName={folderName}
			/>
			<AlertNotificationDelete
				title="Eliminar Notificación"
				open={openDeleteModal}
				handleClose={() => setOpenDeleteModal(false)}
				id={selectedNotificationId}
			/>
			<CardContent sx={{ p: 3 }}>
				{notificationsData.isLoader ? (
					<Stack spacing={3}>
						<NotificationSkeleton />
						<NotificationSkeleton />
					</Stack>
				) : notificationsData.notifications.length > 0 ? (
					<>
						<SimpleBar
							sx={{
								height: `${containerHeight}px`,
								transition: "height 0.3s ease-in-out",
								pr: 2,
								mr: -2,
								"& .simplebar-track.simplebar-vertical": {
									width: 8,
								},
								"& .simplebar-scrollbar:before": {
									background: theme.palette.secondary.lighter,
								},
							}}
						>
							<Grid container spacing={2} ref={parent}>
								{displayedNotifications.map((notification: NotificationType, index: number) => (
									<NotificationItem key={notification._id || index} notification={notification} isFirst={index === 0} />
								))}
							</Grid>
						</SimpleBar>
						<FooterActions />
					</>
				) : (
					<EmptyState />
				)}
			</CardContent>
		</MainCard>
	);
};

export default Notifications;
