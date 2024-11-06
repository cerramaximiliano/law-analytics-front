import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, CardMedia, Container, Grid, Rating, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";

// assets
import AnimateButton from "components/@extended/AnimateButton";

import calculator from "assets/images/landing/calculator.svg";
import notifications from "assets/images/landing/notifications.svg";
import folder from "assets/images/landing/folder.svg";
import calendar from "assets/images/landing/calendar.svg";
// ==============================|| LANDING - HeaderPage ||============================== //

const HeaderPage = () => {
	const theme = useTheme();

	return (
		<Container sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
			<Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ pt: { md: 0, xs: 8 }, pb: { md: 0, xs: 5 } }}>
				<Grid item xs={12} md={9}>
					<Grid container spacing={3} sx={{ textAlign: "center" }}>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
								}}
							>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "1.825rem", sm: "2rem", md: "3.4375rem" },
										fontWeight: 700,
										lineHeight: 1.2,
									}}
								>
									<span>Explore las</span>
									<Box
										component="span"
										sx={{
											background: "linear-gradient(90deg, rgb(37, 161, 244), rgb(249, 31, 169), rgb(37, 161, 244)) 0 0 / 400% 100%",
											color: "transparent",
											WebkitBackgroundClip: "text",
											backgroundClip: "text",
											animation: "move-bg 24s infinite linear",
											"@keyframes move-bg": {
												"100%": {
													backgroundPosition: "400% 0",
												},
											},
										}}
									>
										<span> Herramientas Legales </span>
									</Box>
									<span> más Potentes del Mercado</span>
								</Typography>
							</motion.div>
						</Grid>
						<Grid container justifyContent="center" item xs={12}>
							<Grid item xs={8}>
								<motion.div
									initial={{ opacity: 0, translateY: 550 }}
									animate={{ opacity: 1, translateY: 0 }}
									transition={{
										type: "spring",
										stiffness: 150,
										damping: 30,
										delay: 0.2,
									}}
								>
									<Typography
										variant="h6"
										component="div"
										sx={{
											fontSize: { xs: "0.875rem", md: "1rem" },
											fontWeight: 400,
											lineHeight: { xs: 1.4, md: 1.4 },
										}}
									>
										Law||Analytics es uno de las herramientas legales más potentes del mercado legal hoy disponible.
									</Typography>
								</motion.div>
							</Grid>
						</Grid>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.4,
								}}
							>
								<Grid container spacing={2} justifyContent="center">
									<Grid item>
										<AnimateButton>
											<Button component={RouterLink} to="/login" target="_blank" size="large" color="primary" variant="contained">
												Inicie Gratis
											</Button>
										</AnimateButton>
									</Grid>
								</Grid>
							</motion.div>
						</Grid>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.6,
								}}
							>
								<Grid container spacing={3} justifyContent="center">
									<Grid
										item
										sx={{
											position: "relative",
											"&:after": {
												content: '""',
												position: "absolute",
												height: 30,
												bottom: 10,
												left: "auto",
												right: "-12px",
												width: "1px",
												background: theme.palette.divider,
											},
										}}
									>
										<Rating name="read-only" value={4.5} size="small" readOnly />
										<Typography variant="h4">
											4.7/5
											<span
												style={{
													fontSize: "75%",
													fontWeight: 400,
													margin: 5,
													color: theme.palette.text.secondary,
												}}
											>
												Ratings
											</span>
										</Typography>
									</Grid>
									<Grid item>
										<Typography variant="h5">
											<span
												style={{
													fontSize: "75%",
													fontWeight: 400,
													color: theme.palette.text.secondary,
												}}
											>
												Usuarios
											</span>
										</Typography>
										<Typography variant="h4">500+</Typography>
									</Grid>
								</Grid>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
			<Box
				sx={{
					display: "flex",
					position: "absolute",
					bottom: { xs: -30, sm: 0 },
					left: 0,
					right: 0,
					alignItems: "center",
					justifyContent: "center",
					background: theme.palette.background.paper,
					borderTop: `1px solid ${theme.palette.divider}`,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid
					container
					spacing={0}
					justifyContent="center"
					sx={{
						"& > .MuiGrid-item": {
							borderRight: `1px solid ${theme.palette.divider}`,
							"&:first-of-type": {
								borderLeft: `1px solid ${theme.palette.divider}`,
							},
							"& img": {
								padding: 1.3,
							},
						},
					}}
				>
					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 0.8,
							}}
						>
							<CardMedia component="img" image={folder} sx={{ width: "auto" }} />
						</motion.div>
					</Grid>

					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1,
							}}
						>
							<CardMedia component="img" image={calendar} sx={{ width: "auto" }} />
						</motion.div>
					</Grid>
					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1.1,
							}}
						>
							<CardMedia component="img" image={notifications} sx={{ width: "auto" }} />
						</motion.div>
					</Grid>
					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1.2,
							}}
						>
							<CardMedia component="img" image={calculator} sx={{ width: "auto" }} />
						</motion.div>
					</Grid>
					{/* 					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1.3,
							}}
						>
							<CardMedia component="img" image={} sx={{ width: "auto" }} />
						</motion.div>
					</Grid>
 */}
					{/* 					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1.3,
							}}
						>
							<CardMedia component="img" image={} sx={{ width: "auto" }} />
						</motion.div>
					</Grid> */}
					{/* 					<Grid item>
						<motion.div
							initial={{ opacity: 0, translateY: 550 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{
								type: "spring",
								stiffness: 150,
								damping: 30,
								delay: 1.3,
							}}
						>
							<CardMedia component="img" image={} sx={{ width: "auto" }} />
						</motion.div>
					</Grid> */}
				</Grid>
			</Box>
		</Container>
	);
};
export default HeaderPage;
