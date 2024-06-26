// material-ui
import { useTheme } from "@mui/material/styles";
import {
	useMediaQuery,
	Grid,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemSecondaryAction,
	Stack,
	TableCell,
	TableRow,
	Typography,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Transitions from "components/@extended/Transitions";

// assets
import { Chart, DollarSquare, TaskSquare, SmsNotification, FolderCross } from "iconsax-react";

// ==============================|| CUSTOMER - VIEW ||============================== //

const FolderView = ({ data }: any) => {
	const theme = useTheme();
	const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
	const notAvailableMsg = "No disponible";
	console.log(data);
	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` }, overflow: "hidden" }}>
			<TableCell colSpan={8} sx={{ p: 2.5, overflow: "hidden" }}>
				<Transitions type="slide" direction="down" in={true}>
					<Grid container spacing={2.5} sx={{ pl: { xs: 0, sm: 5, md: 6, lg: 10, xl: 12 } }}>
						<Grid item xs={12} sm={5} md={4} lg={4} xl={3}>
							<MainCard>
								<Chip
									label={data.status}
									size="small"
									color="primary"
									sx={{
										position: "absolute",
										right: 10,
										top: 10,
										fontSize: "0.675rem",
									}}
								/>
								<Grid container spacing={3}>
									<Grid item xs={12}></Grid>
									<Grid item xs={12}>
										<Stack direction="row" justifyContent="space-around" alignItems="center">
											<Stack spacing={0.5} alignItems="center">
												<Typography variant="h5">{data.folderData || "-"}</Typography>
												<Typography color="secondary">Duración</Typography>
											</Stack>
											<Divider orientation="vertical" flexItem />
											<Stack spacing={0.5} alignItems="center">
												<Typography variant="h5">{data.movements || 0}</Typography>
												<Typography color="secondary">Movimientos</Typography>
											</Stack>
										</Stack>
									</Grid>
									<Grid item xs={12}>
										<Divider />
									</Grid>
									<Grid item xs={12}>
										<List aria-label="main mailbox folders" sx={{ py: 0, "& .MuiListItemIcon-root": { minWidth: 32 } }}>
											<ListItem>
												<ListItemIcon>
													<Chart size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">Cálculos: {data.email || 0}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<DollarSquare size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">Facturación: {`$ ${data.earnings || 0} `}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<SmsNotification size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">Notificaciones: {data.notifications || 0}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<TaskSquare size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">Tareas: {data.tasks || 0}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
										</List>
									</Grid>
								</Grid>
							</MainCard>
						</Grid>
						<Grid item xs={12} sm={7} md={8} lg={8} xl={9}>
							<Stack spacing={2.5}>
								<MainCard title="Detalles de la Causa">
									<List sx={{ py: 0 }}>
										<ListItem divider={!matchDownMD}>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Carátula</Typography>
														<Typography>{data.folderName || notAvailableMsg}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Materia</Typography>
														<Typography>{data.materiaSelect || notAvailableMsg}</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
										<ListItem divider={!matchDownMD}>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Fuero</Typography>
														<Typography>{data.fuero || notAvailableMsg}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Jurisdicción</Typography>
														<Typography>{data.jurisdiccion || notAvailableMsg}</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
										<ListItem>
											<Stack spacing={0.5}>
												<Typography color="secondary">Descripción</Typography>
												<Typography>{data.description || notAvailableMsg}</Typography>
											</Stack>
										</ListItem>
									</List>
								</MainCard>
								<MainCard title="Últimos Movimientos">
									{data.lastMovement ? (
										<Typography color="secondary">{data.lastMovement}</Typography>
									) : (
										<Grid container direction="column" alignItems="center" justifyContent="center" color="secondary">
											<FolderCross color="#5B6B79" />
											<Typography color="secondary">No hay movimientos</Typography>
										</Grid>
									)}
								</MainCard>
							</Stack>
						</Grid>
					</Grid>
				</Transitions>
			</TableCell>
		</TableRow>
	);
};

export default FolderView;
