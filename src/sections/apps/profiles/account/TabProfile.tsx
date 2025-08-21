import React from "react";
// material-ui
import { Theme } from "@mui/material/styles";
import {
	useMediaQuery,
	Chip,
	Divider,
	Grid,
	Link,
	List,
	ListItem,
	ListItemIcon,
	ListItemSecondaryAction,
	Stack,
	Typography,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import LinearWithLabel from "components/@extended/progress/LinearWithLabel";

// assets
import { CallCalling, Gps, Link1, Sms } from "iconsax-react";
import { useSelector } from "store";

// ==============================|| ACCOUNT PROFILE - BASIC ||============================== //

const TabProfile = () => {
	const matchDownMD = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
	const user = useSelector((state) => state.auth.user);

	return (
		<Grid container spacing={3}>
			<Grid item xs={12} sm={5} md={4} xl={3}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<MainCard>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<Stack direction="row" justifyContent="flex-end">
										{user?.subscription && <Chip label={user?.subscription} size="small" color="primary" />}
									</Stack>
									<Stack spacing={2.5} alignItems="center">
										<Avatar alt="Avatar 1" size="xl" src={`${user?.picture}`} />
										<Stack spacing={0.5} alignItems="center">
											<Typography variant="h5">
												{user?.firstName} {user?.lastName}
											</Typography>
											<Typography color="secondary">Usuario</Typography>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Divider />
								</Grid>
								<Grid item xs={12}>
									<Stack direction="row" justifyContent="space-around" alignItems="center">
										<Stack spacing={0.5} alignItems="center">
											<Typography variant="h5">86</Typography>
											<Typography color="secondary">Causas</Typography>
										</Stack>
										<Divider orientation="vertical" flexItem />
										<Stack spacing={0.5} alignItems="center">
											<Typography variant="h5">40</Typography>
											<Typography color="secondary">Clientes</Typography>
										</Stack>
										<Divider orientation="vertical" flexItem />
										<Stack spacing={0.5} alignItems="center">
											<Typography variant="h5">4.5K</Typography>
											<Typography color="secondary">Cálculos</Typography>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Divider />
								</Grid>
								<Grid item xs={12}>
									<List component="nav" aria-label="main mailbox folders" sx={{ py: 0, "& .MuiListItem-root": { p: 0, py: 1 } }}>
										<ListItem>
											<ListItemIcon>
												<Sms size={18} />
											</ListItemIcon>
											<ListItemSecondaryAction>
												<Typography align="right">{user?.email}</Typography>
											</ListItemSecondaryAction>
										</ListItem>
										<ListItem>
											<ListItemIcon>
												<CallCalling size={18} />
											</ListItemIcon>
											<ListItemSecondaryAction>
												<Typography align="right">{user?.contact}</Typography>
											</ListItemSecondaryAction>
										</ListItem>
										<ListItem>
											<ListItemIcon>
												<Gps size={18} />
											</ListItemIcon>
											<ListItemSecondaryAction>
												<Typography align="right">{user?.state}</Typography>
											</ListItemSecondaryAction>
										</ListItem>
										<ListItem>
											<ListItemIcon>
												<Link1 size={18} />
											</ListItemIcon>
											<ListItemSecondaryAction>
												<Link align="right" href="https://google.com" target="_blank">
													{user?.url}
												</Link>
											</ListItemSecondaryAction>
										</ListItem>
									</List>
								</Grid>
							</Grid>
						</MainCard>
					</Grid>
					<Grid item xs={12}>
						<MainCard title="Campos">
							<Grid container spacing={1.25}>
								{user?.skill && (
									<Grid container spacing={2}>
										{(user.skill as any[]).map((skill, index) => (
											<Grid container key={index}>
												<Grid item xs={6}>
													{typeof skill === "object" && skill !== null && "name" in skill ? (
														<Typography color="secondary">{skill.name}</Typography>
													) : (
														<Typography color="secondary">{String(skill)}</Typography>
													)}
												</Grid>
												<Grid item xs={6}>
													<LinearWithLabel value={0} />
												</Grid>
											</Grid>
										))}
									</Grid>
								)}
							</Grid>
						</MainCard>
					</Grid>
				</Grid>
			</Grid>
			<Grid item xs={12} sm={7} md={8} xl={9}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<MainCard title="Datos Personales">
							<List sx={{ py: 0 }}>
								<ListItem divider={!matchDownMD}>
									<Grid container spacing={3}>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">Nombre</Typography>
												<Typography>{user?.firstName}</Typography>
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">Apellido</Typography>
												<Typography>{user?.lastName}</Typography>
											</Stack>
										</Grid>
									</Grid>
								</ListItem>
								<ListItem divider={!matchDownMD}>
									<Grid container spacing={3}>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">Teléfono</Typography>
												<Typography>
													<PatternFormat value={user?.contact} displayType="text" type="text" format="#### ### ###" />
												</Typography>
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">País</Typography>
												<Typography>{user?.country}</Typography>
											</Stack>
										</Grid>
									</Grid>
								</ListItem>
								<ListItem divider={!matchDownMD}>
									<Grid container spacing={3}>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">Email</Typography>
												<Typography>{user?.email}</Typography>
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Stack spacing={0.5}>
												<Typography color="secondary">Código Postal</Typography>
												<Typography>{user?.zipCode}</Typography>
											</Stack>
										</Grid>
									</Grid>
								</ListItem>
								<ListItem>
									<Stack spacing={0.5}>
										<Typography color="secondary">Domicilio</Typography>
										<Typography>{user?.address}</Typography>
									</Stack>
								</ListItem>
							</List>
						</MainCard>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default TabProfile;
