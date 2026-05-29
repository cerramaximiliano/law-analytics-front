import React from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, ButtonBase, CardContent, Chip, ClickAwayListener, Grid, Paper, Popper, Stack, Tooltip, Typography } from "@mui/material";

// project-imports
import ProfileTab from "./ProfileTab";
import Avatar from "components/@extended/Avatar";
import MainCard from "components/MainCard";
import Transitions from "components/@extended/Transitions";
import IconButton from "components/@extended/IconButton";
import useAuth from "hooks/useAuth";
import { BRAND_BLUE, PREMIUM_GOLD } from "themes/dashboardTokens";

// assets
import { Profile, Logout } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { useSelector } from "store";
import { AuthProps } from "types/auth";

// Mapeo legible de los planes de suscripción. La fuente principal es la slice
// `state.auth.subscription.plan` (lowercase, tipado en types/user.ts:63). El
// `user.subscription` string es un campo legado que algunos flows usan en
// uppercase, así que normalizamos a lowercase y aceptamos ambas fuentes.
const PLAN_LABELS: Record<string, { label: string; tier: "free" | "standard" | "premium" }> = {
	free: { label: "Gratuito", tier: "free" },
	standard: { label: "Estándar", tier: "standard" },
	premium: { label: "Premium", tier: "premium" },
};

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

const ProfilePage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isDark = theme.palette.mode === ThemeMode.DARK;

	const { logout } = useAuth();

	const authState = useSelector((state: { auth: AuthProps }) => state.auth);
	// Prioriza la slice tipada; fallback al string legado del user.
	const planKey = (authState.subscription?.plan ?? authState.user?.subscription)?.toLowerCase();
	const plan = planKey ? PLAN_LABELS[planKey] : undefined;

	const handleLogout = async () => {
		try {
			await logout();
			navigate(`/login`, {
				state: {
					from: "",
				},
			});
		} catch (err) {}
	};

	const anchorRef = useRef<any>(null);
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

	return (
		<Box sx={{ flexShrink: 0, ml: 0.75 }}>
			<ButtonBase
				sx={{
					p: 0.25,
					borderRadius: 1,
					"&:hover": {
						bgcolor: theme.palette.mode === ThemeMode.DARK ? "secondary.light" : "secondary.lighter",
					},
					"&:focus-visible": {
						outline: `2px solid ${theme.palette.secondary.dark}`,
						outlineOffset: 2,
					},
				}}
				aria-label="open profile"
				ref={anchorRef}
				aria-controls={open ? "profile-grow" : undefined}
				aria-haspopup="true"
				onClick={handleToggle}
			>
				{authState.user?.picture ? (
					// Si hay una imagen de perfil, úsala
					<Avatar alt="profile user" src={authState.user.picture} />
				) : authState.user?.name ? (
					// Si no hay imagen de perfil pero existe el nombre, usa la primera letra del nombre
					<Avatar color="error" type="filled" alt="profile user" size="sm">
						{authState.user.name.charAt(0).toUpperCase()}
					</Avatar>
				) : (
					// Si no hay imagen ni nombre, renderiza el componente <Profile />
					<Avatar alt="profile user" size="sm" type="filled">
						<Profile />
					</Avatar>
				)}
			</ButtonBase>
			<Popper
				placement="bottom-end"
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
								offset: [0, 9],
							},
						},
					],
				}}
			>
				{({ TransitionProps }) => (
					<Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
						<Paper
							sx={{
								boxShadow: theme.customShadows.z1,
								width: 320,
								minWidth: 260,
								maxWidth: 320,
								[theme.breakpoints.down("md")]: {
									maxWidth: 280,
								},
								borderRadius: 1.5,
							}}
						>
							<ClickAwayListener onClickAway={handleClose}>
								<MainCard border={false} content={false}>
									<CardContent sx={{ px: 2.5, pt: 3 }}>
										<Grid container justifyContent="space-between" alignItems="center">
											<Grid item>
												<Stack direction="row" spacing={1.25} alignItems="center">
													{authState.user?.picture ? (
														// Si hay una imagen de perfil, úsala
														<Avatar alt="profile user" src={authState.user.picture} />
													) : authState.user?.name ? (
														// Si no hay imagen de perfil pero existe el nombre, usa la primera letra del nombre
														<Avatar color="error" type="filled" alt="profile user" size="sm">
															{authState.user.name.charAt(0).toUpperCase()}
														</Avatar>
													) : (
														// Si no hay imagen ni nombre, renderiza el componente <Profile />
														<Avatar alt="profile user" size="sm" type="filled">
															<Profile />
														</Avatar>
													)}

													<Stack spacing={0.4}>
														<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
															{authState.user?.name || ""}
														</Typography>
														{plan && (
															<Chip
																label={plan.label}
																size="small"
																sx={{
																	height: 20,
																	alignSelf: "flex-start",
																	fontSize: "0.65rem",
																	fontWeight: 600,
																	letterSpacing: "0.04em",
																	"& .MuiChip-label": { px: 0.85 },
																	...(plan.tier === "premium"
																		? {
																				bgcolor: alpha(PREMIUM_GOLD, isDark ? 0.18 : 0.1),
																				color: PREMIUM_GOLD,
																				border: `1px solid ${alpha(PREMIUM_GOLD, isDark ? 0.36 : 0.22)}`,
																		  }
																		: plan.tier === "standard"
																		? {
																				bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
																				color: BRAND_BLUE,
																				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
																		  }
																		: {
																				bgcolor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05),
																				color: "text.secondary",
																				border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.1)}`,
																		  }),
																}}
															/>
														)}
													</Stack>
												</Stack>
											</Grid>
											<Grid item>
												<Tooltip title="Cerrar sesión">
													<IconButton
														size="large"
														color="secondary"
														sx={{
															p: 1,
															color: "text.secondary",
															transition: "color 150ms, background-color 150ms",
															"&:hover": {
																color: theme.palette.error.main,
																bgcolor: alpha(theme.palette.error.main, 0.08),
															},
														}}
														onClick={handleLogout}
													>
														<Logout variant="Bulk" />
													</IconButton>
												</Tooltip>
											</Grid>
										</Grid>
									</CardContent>

									<Box sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
										<ProfileTab handleLogout={handleLogout} handleClose={() => setOpen(false)} />
									</Box>
								</MainCard>
							</ClickAwayListener>
						</Paper>
					</Transitions>
				)}
			</Popper>
		</Box>
	);
};

export default ProfilePage;
