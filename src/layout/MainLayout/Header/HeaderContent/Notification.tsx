import { useRef, useState } from "react";

// material-ui
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

// project-imports
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import Transitions from "components/@extended/Transitions";

// assets
import { Gift, MessageText1, Notification, Setting2 } from "iconsax-react";
import Avatar from "components/@extended/Avatar";

// types
import { ThemeMode } from "types/config";
import { useSelector } from "store";



const actionSX = {
	mt: "6px",
	ml: 1,
	top: "auto",
	right: "auto",
	alignSelf: "flex-start",

	transform: "none",
};

type AvatarTypeProps = "filled" | "outlined" | "combined" | undefined;
type TypographyVariant =
	| "h6"
	| "button"
	| "caption"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "inherit"
	| "subtitle1"
	| "subtitle2"
	| "body1"
	| "body2"
	| "overline"
	| undefined;
interface Alert {
	avatarType?: AvatarTypeProps;
	avatarIcon?: "Gift" | "MessageText1" | "Setting2";
	avatarSize?: number;
	avatarInitial?: string;
	primaryText: string;
	primaryVariant: TypographyVariant;
	secondaryText: string;
	actionText: string;
}

const notificationsArray: Alert[] = [
	{
		avatarType: "filled",
		avatarIcon: "Gift",
		avatarSize: 20,
		primaryText: "It's Cristina danny's birthday today.",
		primaryVariant: "h6",
		secondaryText: "2 min ago",
		actionText: "3:00 AM",
	},
	{
		avatarType: "outlined",
		avatarIcon: "MessageText1",
		avatarSize: 20,
		primaryText: "Aida Burg commented your post.",
		primaryVariant: "h6",
		secondaryText: "5 August",
		actionText: "6:00 PM",
	},
	{
		avatarType: undefined, // Cambiado de "default" a undefined
		avatarIcon: "Setting2",
		avatarSize: 20,
		primaryText: "Your Profile is Complete 60%",
		primaryVariant: "h6",
		secondaryText: "7 hours ago",
		actionText: "2:45 PM",
	},
	{
		avatarType: "combined",
		avatarInitial: "C",
		primaryText: "Cristina Danny invited to join Meeting.",
		primaryVariant: "h6",
		secondaryText: "Daily scrum meeting time",
		actionText: "9:10 PM",
	},
];

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

const NotificationPage = () => {
	const theme = useTheme();
	const matchesXs = useMediaQuery(theme.breakpoints.down("md"));

	const anchorRef = useRef<any>(null);
	const [read] = useState(2);
	const [open, setOpen] = useState(false);
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

	const notificationData = useSelector(state => state.notifications)
	console.log(notificationData)

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
										<Link href="#" variant="h6" color="primary">
											Marcar como leídas
										</Link>
									</Stack>
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
										{notificationsArray.map((notification, index) => (
											<ListItemButton key={index}>
												<ListItemAvatar>
													<Avatar type={notification.avatarType}>
														{notification.avatarIcon === "Gift" && <Gift size={notification.avatarSize} variant="Bold" />}
														{notification.avatarIcon === "MessageText1" && <MessageText1 size={notification.avatarSize} variant="Bold" />}
														{notification.avatarIcon === "Setting2" && <Setting2 size={notification.avatarSize} variant="Bold" />}
														{notification.avatarInitial && notification.avatarInitial}
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={
														<Typography variant={notification.primaryVariant}>
															{notification.primaryText.includes("birthday") && (
																<>
																	It&apos;s{" "}
																	<Typography component="span" variant="subtitle1">
																		Cristina danny&apos;s
																	</Typography>{" "}
																	birthday today.
																</>
															)}
															{notification.primaryText.includes("commented") && (
																<>
																	<Typography component="span" variant="subtitle1">
																		Aida Burg
																	</Typography>{" "}
																	commented your post.
																</>
															)}
															{notification.primaryText.includes("Profile") && (
																<>
																	Your Profile is Complete &nbsp;
																	<Typography component="span" variant="subtitle1">
																		60%
																	</Typography>
																</>
															)}
															{notification.primaryText.includes("invited") && (
																<>
																	<Typography component="span" variant="subtitle1">
																		Cristina Danny
																	</Typography>{" "}
																	invited to join{" "}
																	<Typography component="span" variant="subtitle1">
																		Meeting.
																	</Typography>
																</>
															)}
														</Typography>
													}
													secondary={notification.secondaryText}
												/>
												<ListItemSecondaryAction>
													<Typography variant="caption" noWrap>
														{notification.actionText}
													</Typography>
												</ListItemSecondaryAction>
											</ListItemButton>
										))}
									</List>
									<Stack direction="row" justifyContent="center">
										<Link href="#" variant="h6" color="primary">
											Ver todas
										</Link>
									</Stack>
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
