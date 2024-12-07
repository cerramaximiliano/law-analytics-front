//Notifications.tsx
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import {
	Timeline,
	TimelineConnector,
	TimelineContent,
	TimelineDot,
	TimelineItem,
	TimelineOppositeContent,
	TimelineSeparator,
} from "@mui/lab";
import { Stack, Skeleton, Grid, Button, IconButton, CardContent, Tooltip, Box } from "@mui/material";
import Avatar from "components/@extended/Avatar";
import MainCard from "components/MainCard";
import { Add, Notification1, SmsNotification, NotificationStatus, Edit, Trash, ArrowUp, ArrowDown } from "iconsax-react";
import ModalNotifications from "../modals/ModalNotifications";
import { useParams } from "react-router";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { dispatch, useSelector } from "store";
import { getNotificationsByFolderId } from "store/reducers/notifications";
import { NotificationType } from "types/notifications";
import AlertNotificationDelete from "../modals/alertNotificationDelete";

interface NotificationsProps {
	title: string;
	folderName?: string;
}

const getIconAndColor = (notification: string, user: string) => {
	let icon, iconColor;

	switch (notification) {
		case "Carta Documento":
		case "Telegrama":
			icon = <SmsNotification />;
			iconColor = user === "Actora" ? "success" : user === "Demandada" ? "error" : "default";
			break;
		case "Cédula":
			icon = <Notification1 />;
			iconColor = "primary";
			break;
		case "Notarial":
			icon = <NotificationStatus />;
			iconColor = "warning";
			break;
		default:
			icon = <Notification1 />;
			iconColor = "secondary";
	}

	return { icon, iconColor };
};

const EmptyState = () => (
	<Stack
		spacing={2}
		alignItems="center"
		justifyContent="center"
		py={4}
		sx={{
			height: "100%",
			minHeight: 250, // Para mantener consistencia con el contenedor normal
			width: "100%",
			textAlign: "center",
		}}
	>
		<Avatar
			color="error"
			variant="rounded"
			sx={{
				width: 64,
				height: 64,
				bgcolor: "error.lighter",
			}}
		>
			<Notification1 variant="Bold" size={32} />
		</Avatar>
		<Typography variant="subtitle1" color="textSecondary" align="center">
			No hay notificaciones registradas
		</Typography>
		<Typography
			variant="body2"
			color="textSecondary"
			align="center"
			sx={{ maxWidth: "80%" }} // Para asegurar que el texto largo se mantenga centrado
		>
			Comienza agregando una nueva notificación usando el botón +
		</Typography>
	</Stack>
);
const LoaderComponent = () => (
	<Stack direction={"row"}>
		<Grid>
			<Skeleton width={80} />
			<Skeleton width={80} />
			<Skeleton width={80} />
		</Grid>
		<Grid>
			<Skeleton variant="rectangular" width={32} height={32} style={{ marginTop: 20, marginLeft: 10, marginRight: 10 }} />
		</Grid>
		<Grid>
			<Skeleton width={80} />
			<Skeleton width={80} />
			<Skeleton width={80} />
		</Grid>
	</Stack>
);

const Notifications: React.FC<NotificationsProps> = ({ title, folderName }) => {

	const [open, setOpen] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	const [editNotification, setEditNotification] = useState<NotificationType | null>(null);
	const [showAll, setShowAll] = useState(false);
	const [containerHeight, setContainerHeight] = useState(250);
	const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
	const [parent] = useAutoAnimate({ duration: 200 });

	const { id } = useParams();
	const notificationsData = useSelector((state: any) => state.notifications);

	console.log(notificationsData);

	const handleCloseModal = () => {
		setOpen(false);
		setEditNotification(null);
	};

	const handleOpen = () => {
		if (notificationsData.isLoader) {
			return;
		}
		setEditNotification(null); // Reiniciamos el estado de edición
		setOpen(true);
	};

	const handleEditClick = (notification: NotificationType) => {
		setEditNotification(notification);
		setOpen(true);
	};

	const handleNotificationSelect = (notificationId: string) => {
		setSelectedNotificationId((currentId) => (currentId === notificationId ? null : notificationId));
	};

	useEffect(() => {
		if (id) {
			dispatch(getNotificationsByFolderId(id));
		}
	}, [id]);

	useEffect(() => {
		setSelectedNotificationId(null);
	}, [notificationsData.notifications]);

	const toggleShowAll = () => {
		setShowAll((prev) => !prev);
		setContainerHeight((prev) => (prev === 250 ? notificationsData.notifications.length * 110 : 250));
	};

	const displayedNotifications = showAll ? notificationsData.notifications : notificationsData.notifications.slice(0, 2);

	const FooterActions = () => (
		<Box
			sx={{
				mt: 2,
				pt: 2,
				borderTop: 1,
				borderColor: "divider",
				display: "flex",
				alignItems: "center",
				gap: 2,
			}}
		>
			<Button
				variant="outlined"
				color="secondary"
				onClick={toggleShowAll}
				endIcon={showAll ? <ArrowUp /> : <ArrowDown />}
				sx={{
					flexGrow: 1,
					"&:hover": {
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
						size="small"
						onClick={() => {
							const notification = notificationsData.notifications.find((n: NotificationType) => n._id === selectedNotificationId);
							if (notification) handleEditClick(notification);
						}}
						sx={{
							"&:hover": {
								bgcolor: "primary.lighter",
							},
						}}
					>
						<Edit variant="Bulk" />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip title={selectedNotificationId ? "Eliminar notificación" : "Seleccione una notificación para eliminar"}>
				<span>
					<IconButton
						color="error"
						disabled={!selectedNotificationId}
						size="small"
						onClick={() => setOpenDeleteModal(true)}
						sx={{
							"&:hover": {
								bgcolor: "error.lighter",
							},
						}}
					>
						<Trash variant="Bulk" />
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<Stack direction="row" spacing={1}>
					<Tooltip title="Agregar notificación">
						<IconButton onClick={handleOpen} disabled={notificationsData.isLoader}>
							<Add />
						</IconButton>
					</Tooltip>
				</Stack>
			}
		>
			<ModalNotifications
				open={open}
				setOpen={handleCloseModal} // Usamos la nueva función
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
			<CardContent>
				{notificationsData.isLoader ? (
					<Stack spacing={3}>
						<LoaderComponent />
						<LoaderComponent />
					</Stack>
				) : notificationsData.notifications.length > 0 ? (
					<>
						<SimpleBar
							sx={{
								overflowX: "hidden",
								height: `${containerHeight}px`,
								transition: "height 0.3s ease-in-out",
								overflowY: "auto",
								"& .simplebar-track.simplebar-vertical": {
									width: "8px",
								},
								"& .simplebar-scrollbar:before": {
									background: "secondary.lighter",
								},
							}}
						>
							<Timeline
								position="alternate"
								ref={parent}
								sx={{
									padding: "0px",
									"& .MuiTimelineItem-root": { minHeight: 90 },
									"& .MuiTimelineOppositeContent-root": { mt: 0.5 },
									"& .MuiTimelineDot-root": {
										borderRadius: 1.25,
										boxShadow: "none",
										margin: 0,
										ml: 1.25,
										mr: 1.25,
										p: 1,
										cursor: "pointer",
										"&:hover": {
											bgcolor: "action.hover",
										},
									},
									"& .MuiTimelineContent-root": {
										borderRadius: 1,
										height: "100%",
										cursor: "pointer",
										transition: "all 0.3s ease-in-out",
										"&:hover": {
											transform: "translateX(4px)",
										},
									},
									"& .MuiTimelineConnector-root": {
										border: "1px dashed",
										borderColor: "secondary.light",
										bgcolor: "transparent",
									},
								}}
							>
								{displayedNotifications.map((event: NotificationType, index: number) => {
									const { icon, iconColor } = getIconAndColor(event.notification || "", event.user || "");
									const isSelected = selectedNotificationId === event._id;

									return (
										<TimelineItem key={event._id || index} onClick={() => handleNotificationSelect(event._id!)}>
											<TimelineOppositeContent align="right" variant="caption" color="text.secondary" sx={{ padding: "0px" }}>
												{event.time}
											</TimelineOppositeContent>
											<TimelineSeparator>
												<Tooltip title={`${event.notification}/${event.user}`}>
													<TimelineDot
														sx={{
															color: `${iconColor}.darker`,
															bgcolor: isSelected ? `${iconColor}.main` : `${iconColor}.lighter`,
														}}
													>
														{icon}
													</TimelineDot>
												</Tooltip>
												<TimelineConnector />
											</TimelineSeparator>
											<TimelineContent
												sx={{
													padding: "5px",
													marginBottom: "20px",
													borderLeft: isSelected ? "4px solid" : "none",
													borderColor: "primary.main",
												}}
											>
												<Typography variant="subtitle1" component="span">
													{event.title}
												</Typography>
												<Typography variant="body2" color="textSecondary">
													{event.description}
												</Typography>
												{event.dateExpiration && (
													<Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
														Vence: {event.dateExpiration}
													</Typography>
												)}
											</TimelineContent>
										</TimelineItem>
									);
								})}
							</Timeline>
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
