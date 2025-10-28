import React from "react";
// material-ui
import {
	Alert,
	Button,
	Chip,
	Divider,
	Grid,
	InputLabel,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import IconButton from "components/@extended/IconButton";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";

// assets
import { InfoCircle, More } from "iconsax-react";
import { useSelector } from "store";
import { useTheme } from "@mui/material/styles";

import { avatarImage } from "utils/imageLoader";

// ==============================|| ACCOUNT PROFILE - ROLE ||============================== //

const TabRole = () => {
	const theme = useTheme();
	const auth = useSelector((state) => state.auth);
	const users = auth.user?.users;

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<Alert
					severity="info"
					icon={<InfoCircle variant="Bulk" size={24} color={theme.palette.info.main} />}
					sx={{ mb: 3 }}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
						Funcionalidad en desarrollo
					</Typography>
					<Typography variant="body2">
						La gestión de cuentas grupales y la invitación de miembros estará disponible próximamente. Esta función permitirá colaborar
						con otros usuarios en tu cuenta.
					</Typography>
				</Alert>
			</Grid>
			<Grid item xs={12}>
				<MainCard title="Invitar Miembros a la Cuenta" content={false}>
					<Stack spacing={2.5} sx={{ p: 2.5 }}>
						<Typography variant="h4">
							{auth.user?.role === "USER_ROLE"
								? "0/0 "
								: auth.user?.role === "ADMIN_ROLE" && auth.user?.subscription === "FREE"
								? `${auth.user?.users?.length}/5 `
								: "0/0 "}
							<Typography variant="subtitle1" component="span">
								miembros disponibles en tu plan.
							</Typography>
						</Typography>
						<Divider />
						<Stack
							spacing={3}
							direction="row"
							justifyContent="space-between"
							alignItems="flex-end"
							sx={{ width: { xs: 1, md: "80%", lg: "60%" } }}
						>
							<Stack spacing={1} sx={{ width: `calc(100% - 110px)` }}>
								<InputLabel htmlFor="outlined-email">Correo Electrónico</InputLabel>
								<TextField
									fullWidth
									id="outlined-email"
									variant="outlined"
									placeholder="Ingrese el correo del invitado"
									disabled
									helperText="Funcionalidad no disponible actualmente"
								/>
							</Stack>
							<Button variant="contained" size="large" disabled>
								Enviar
							</Button>
						</Stack>
					</Stack>
					<TableContainer>
						<Table sx={{ minWidth: 350 }} aria-label="simple table">
							<TableHead>
								<TableRow>
									<TableCell sx={{ pl: 3 }}>Miembro</TableCell>
									<TableCell>Rol</TableCell>
									<TableCell align="right">Estado</TableCell>
									<TableCell align="right" />
								</TableRow>
							</TableHead>
							<TableBody>
								{users && users.length > 0 ? (
									users.map((row) => (
										<TableRow hover key={row.name}>
											<TableCell sx={{ pl: 3 }} component="th">
												<Stack direction="row" alignItems="center" spacing={1.25}>
													<Avatar alt="Avatar 1" src={avatarImage(`./${row.avatar}`)} />
													<Stack spacing={0}>
														<Typography variant="subtitle1">{row.name}</Typography>
														<Typography variant="caption" color="secondary">
															{row.email}
														</Typography>
													</Stack>
												</Stack>
											</TableCell>
											<TableCell>
												{row.role === "ADMIN_ROLE" && <Chip size="small" color="primary" label="Administrador" />}
												{row.role === "USER_ROLE" && <Chip size="small" variant="light" color="info" label="Usuario" />}
											</TableCell>
											<TableCell align="right">
												{!row.status ? (
													<Stack direction="row" alignItems="center" spacing={1.25} justifyContent="flex-end">
														<Button size="small" color="error">
															Reenviar
														</Button>
														<Chip size="small" color="info" variant="outlined" label="Invited" />
													</Stack>
												) : (
													<Chip size="small" color="success" label="Joined" />
												)}
											</TableCell>
											<TableCell align="right">
												<IconButton size="small" color="secondary">
													<More style={{ fontSize: "1.15rem", transform: "rotate(90deg)" }} />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={4} align="center">
											<Typography variant="body1" color="textSecondary">
												No hay miembros disponibles
											</Typography>
											{auth.user?.subscription === "FREE" && (
												<>
													<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
														Su plan no le permite agregar miembros
													</Typography>
													<Button variant="contained" color="primary" sx={{ mt: 2 }} href="/price/price1">
														Actualizar Plan
													</Button>
												</>
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</MainCard>
			</Grid>
		</Grid>
	);
};

export default TabRole;
