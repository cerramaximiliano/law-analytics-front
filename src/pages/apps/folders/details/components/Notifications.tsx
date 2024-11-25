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
import { Stack, Skeleton, Grid, Button, IconButton, CardContent, Tooltip } from "@mui/material";
import Avatar from "components/@extended/Avatar";
import MainCard from "components/MainCard";
import { Maximize4, Add, Notification1, SmsNotification, NotificationStatus } from "iconsax-react";
import ModalNotifications from "../modals/ModalNotifications";
import { useParams } from "react-router";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { dispatch, useSelector } from "store";
import { fetchNotificationsData } from "store/reducers/notifications";

export interface TimelineEvent {
	date: string;
	dateExpiration?: string;
	title: string;
	notification: "Cédula" | "Carta Documento" | "Telegrama" | "Notarial";
	user: "Actora" | "Demandada" | "Organismo";
	description: string;
	icon?: React.ReactElement;
	iconColor?: string;
}

interface NotificationsProps {
	title: string;
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

const Notifications: React.FC<NotificationsProps> = ({ title }) => {
	const [open, setOpen] = useState(false);
	const [showAll, setShowAll] = useState(false);
	const [parent] = useAutoAnimate({ duration: 200 });

	const { id } = useParams();
	const notificationsData = useSelector((state: any) => state.notifications);

	const handleOpen = () => {
		if (notificationsData.isLoader === true) {
			return;
		} else {
			setOpen(true);
		}
	};

	useEffect(() => {
		if (id) {
			const fetchData = async () => {
				await dispatch(fetchNotificationsData(id));
			};
			fetchData();
		}
	}, [id, dispatch]);

	const toggleShowAll = () => {
		setShowAll((prevShowAll) => !prevShowAll);
	};

	const displayedNotifications = showAll ? notificationsData.notifications : notificationsData.notifications.slice(0, 2);

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<>
					<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleOpen}>
						<Add />
					</IconButton>
					<IconButton color="secondary" sx={{ color: "secondary.darker" }}>
						<Maximize4 />
					</IconButton>
				</>
			}
		>
			<ModalNotifications open={open} setOpen={setOpen} folderId={id} />
			{notificationsData.isLoader ? (
				<CardContent>
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
					<Grid height={50}></Grid>
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
				</CardContent>
			) : (
				<CardContent>
					{notificationsData.notifications.length > 0 ? (
						<SimpleBar
							sx={{
								overflowX: "hidden",
								maxHeight: "350px",
								overflowY: "auto",
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
										"& .MuiSvgIcon-root": { fontSize: "1.2rem" },
									},
									"& .MuiTimelineContent-root": {
										borderRadius: 1,
										bgcolor: "secondary.lighter",
										height: "100%",
									},
									"& .MuiTimelineConnector-root": {
										border: "1px dashed",
										borderColor: "secondary.light",
										bgcolor: "transparent",
									},
								}}
							>
								{displayedNotifications.map((event: any, index: any) => {
									const { icon, iconColor } = getIconAndColor(event.notification, event.user);
									return (
										<TimelineItem key={index}>
											<TimelineOppositeContent align="right" variant="caption" color="text.secondary" sx={{ padding: "0px" }}>
												{event.date}
											</TimelineOppositeContent>
											<TimelineSeparator>
												<Tooltip title={`${event.notification}/${event.user}`}>
													<TimelineDot sx={{ color: `${iconColor}.darker`, bgcolor: `${iconColor}.lighter` }}>{icon}</TimelineDot>
												</Tooltip>
												<TimelineConnector />
											</TimelineSeparator>
											<TimelineContent sx={{ padding: "5px", marginBottom: "20px" }} noWrap={false}>
												<Typography variant="subtitle1" component="span">
													{event.title}
												</Typography>
												<Typography variant="body2" color="textSecondary">
													{event.description}
												</Typography>
											</TimelineContent>
										</TimelineItem>
									);
								})}
							</Timeline>
						</SimpleBar>
					) : (
						<>
							<Grid container justifyContent="center">
								<Avatar color="error" variant="rounded">
									<Notification1 variant="Bold" />
								</Avatar>
							</Grid>
							<Typography variant="body1" color="text.secondary" align="center">
								No hay notificaciones.
							</Typography>
						</>
					)}
					<Grid marginTop={2}>
						<Button variant="outlined" fullWidth color="secondary" onClick={toggleShowAll}>
							{showAll ? "Ver Menos" : "Ver Todos"}
						</Button>
					</Grid>
				</CardContent>
			)}
		</MainCard>
	);
};

export default Notifications;
