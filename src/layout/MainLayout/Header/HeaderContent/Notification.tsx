import { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
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

import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import Transitions from "components/@extended/Transitions";
import { Gift, MessageText1, Notification, Setting2, Add } from "iconsax-react";
import Avatar from "components/@extended/Avatar";
import { ThemeMode } from "types/config";
import { dispatch, useSelector } from "store";
import { fetchUserAlerts, deleteUserAlert } from "store/reducers/alerts";
import { Alert } from "types/alert";

const actionSX = {
	mt: "6px",
	ml: 1,
	top: "auto",
	right: "auto",
	alignSelf: "flex-start",
	transform: "none",
};

const NotificationPage = () => {
	const theme = useTheme();
	const matchesXs = useMediaQuery(theme.breakpoints.down("md"));
	const anchorRef = useRef<any>(null);
	const [read, setRead] = useState(0);
	const [open, setOpen] = useState(false);
	const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

	const handleToggle = () => {
		setOpen((prevOpen) => !prevOpen);
	};

	const handleClose = (event: MouseEvent | TouchEvent) => {
		if (anchorRef.current && anchorRef.current.contains(event.target)) {
			return;
		}
		setOpen(false);
	};

	const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? "secondary.200" : "secondary.200";
	const iconBackColor = theme.palette.mode === ThemeMode.DARK ? "background.default" : "secondary.100";

	const userId = useSelector((state) => state.auth.user?._id || "");
	const alertsData = useSelector((state) => state.alerts.alerts);

	const handleDeleteNotification = async (userId: string, alertId: string) => {
		console.log("delete action");
		try {
			const result = await dispatch(deleteUserAlert(userId, alertId));
			console.log(result);
		} catch (error) {
			console.error("Error deleting notification:", error);
		}
	};

	useEffect(() => {
		setLocalAlerts(alertsData);
		setRead(alertsData.length);
	}, [alertsData]);

	useEffect(() => {
		const alertData = async () => {
			return userId && (await dispatch(fetchUserAlerts(userId)));
		};
		alertData();
	}, [dispatch, userId]);

	return (
		<Box sx={{ flexShrink: 0, ml: 0.5 }}>
			<IconButton
				color="secondary"
				variant="light"
				aria-label="open profile"
				ref={anchorRef}
				aria-controls={open ? "profile-grow" : undefined}
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
										{localAlerts.length > 0 && (
											<Link href="#" variant="h6" color="primary">
												Marcar como leídas
											</Link>
										)}
									</Stack>

									{localAlerts.length > 0 ? (
										<>
											<List
												component="nav"
												sx={{
													"& .MuiListItemButton-root": {
														p: 1.5,
														my: 1.5,
														border: `1px solid ${theme.palette.divider}`,
														"&:hover": {
															bgcolor: "primary.lighter",
															borderColor: theme.palette.primary.light,
														},
														"& .MuiListItemSecondaryAction-root": { ...actionSX, position: "relative" },
													},
												}}
											>
												{localAlerts.map((notification: Alert, index: number) => (
													<ListItemButton key={index}>
														<ListItemAvatar>
															<Avatar type={notification.avatarType}>
																{notification.avatarIcon === "Gift" && <Gift size={notification.avatarSize} variant="Bold" />}
																{notification.avatarIcon === "MessageText1" && (
																	<MessageText1 size={notification.avatarSize} variant="Bold" />
																)}
																{notification.avatarIcon === "Setting2" && <Setting2 size={notification.avatarSize} variant="Bold" />}
																{notification.avatarInitial && notification.avatarInitial}
															</Avatar>
														</ListItemAvatar>
														<ListItemText
															primary={<Typography variant={notification.primaryVariant}>{notification.primaryText}</Typography>}
															secondary={notification.secondaryText}
														/>
														<ListItemSecondaryAction>
															<IconButton shape="rounded" color="error" onClick={() => handleDeleteNotification(userId, notification._id)}>
																<Add style={{ transform: "rotate(45deg)" }} />
															</IconButton>
														</ListItemSecondaryAction>
													</ListItemButton>
												))}
											</List>
											<Stack direction="row" justifyContent="center">
												<Link href="#" variant="h6" color="primary">
													Ver todas
												</Link>
											</Stack>
										</>
									) : (
										<Stack
											direction="row"
											justifyContent="center"
											alignItems="center"
											sx={{
												py: 4,
												px: 2,
												borderRadius: 1,
												bgcolor: theme.palette.background.default,
											}}
										>
											<Typography variant="h6" color="textSecondary">
												No hay notificaciones
											</Typography>
										</Stack>
									)}
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
