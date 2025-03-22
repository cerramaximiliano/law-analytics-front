import { useState, Fragment } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, Chip, Grid, List, ListItem, ListItemText, Stack, Switch, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// plan list
const plans = [
	{
		active: false,
		title: "Starter",
		description: "",
		price: 5.99,
		permission: [0, 1, 2],
	},
	{
		active: true,
		title: "Standard",
		description: "",
		price: 9.99,
		permission: [0, 1, 2, 3, 4],
	},
	{
		active: false,
		title: "Premium",
		description: "",
		price: 15.99,
		permission: [0, 1, 2, 3, 4, 5, 6, 7],
	},
];

const planList = [
	"Calendario",
	"+500 Causas",
	"+1000 Cálculos",
	"+300 Contactos",
	"Seguimientos automatizados",
	"+5 Cuentas Administradores",
	"+10 Cuentas Asociadas",
	"Acceso Clientes",
];

// ==============================|| PRICING ||============================== //

const Pricing = () => {
	const theme = useTheme();
	const [timePeriod, setTimePeriod] = useState(true);

	const priceListDisable = {
		opacity: 0.4,
		textDecoration: "line-through",
	};

	const priceActivePlan = {
		padding: 3,
		borderRadius: 1,
		bgcolor: theme.palette.primary.lighter,
	};
	const price = {
		fontSize: "40px",
		fontWeight: 700,
		lineHeight: 1,
	};
	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<Stack spacing={2} direction={{ xs: "column", md: "row" }} justifyContent="space-between">
					<Stack spacing={0}></Stack>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
							Cobro Anual
						</Typography>
						<Switch checked={timePeriod} onChange={() => setTimePeriod(!timePeriod)} inputProps={{ "aria-label": "container" }} />
						<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
							Cobro Mensual
						</Typography>
					</Stack>
				</Stack>
			</Grid>
			<Grid item container spacing={3} xs={12} alignItems="center">
				{plans.map((plan, index) => (
					<Grid item xs={12} sm={6} md={4} key={index}>
						<MainCard>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<Box sx={plan.active ? priceActivePlan : { padding: 3 }}>
										<Grid container spacing={3}>
											{plan.active && (
												<Grid item xs={12} sx={{ textAlign: "center" }}>
													<Chip label="Popular" color="success" />
												</Grid>
											)}
											<Grid item xs={12}>
												<Stack spacing={0} textAlign="center">
													<Typography variant="h4">{plan.title}</Typography>
													<Typography>{plan.description}</Typography>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={0} alignItems="center">
													{timePeriod && (
														<Typography variant="h2" sx={price}>
															${plan.price}
														</Typography>
													)}
													{!timePeriod &&
														(plan.title === "Free" ? (
															<Typography variant="h2" sx={price}>
																${plan.price}
															</Typography>
														) : (
															<Typography variant="h2" sx={price}>
																${Math.round(plan.price * 12 - plan.price * 0.25)}
															</Typography>
														))}
													<Typography variant="h6" color="textSecondary"></Typography>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Button color={plan.active ? "primary" : "secondary"} variant={plan.active ? "contained" : "outlined"} fullWidth>
													Suscribirme
												</Button>
											</Grid>
										</Grid>
									</Box>
								</Grid>
								<Grid item xs={12}>
									<List
										sx={{
											m: 0,
											p: 0,
											"&> li": {
												px: 0,
												py: 0.625,
											},
										}}
										component="ul"
									>
										{planList.map((list, i) => (
											<Fragment key={i}>
												<ListItem sx={!plan.permission.includes(i) ? priceListDisable : {}}>
													<ListItemText primary={list} sx={{ textAlign: "center" }} />
												</ListItem>
											</Fragment>
										))}
									</List>
								</Grid>
							</Grid>
						</MainCard>
					</Grid>
				))}
			</Grid>
		</Grid>
	);
};

export default Pricing;
