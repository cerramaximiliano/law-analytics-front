// material-ui
import { useTheme } from "@mui/material/styles";
import {
	useMediaQuery,
	Grid,
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

// third-party
import { PatternFormat } from "react-number-format";

// project-imports
import MainCard from "components/MainCard";
import Transitions from "components/@extended/Transitions";

// assets
import { Location, Mobile, Sms } from "iconsax-react";

// ==============================|| CUSTOMER - VIEW ||============================== //

const CustomerView = ({ data }: any) => {
	const theme = useTheme();
	const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` }, overflow: "hidden" }}>
			<TableCell colSpan={8} sx={{ p: 2.5, overflow: "hidden" }}>
				<Transitions type="slide" direction="down" in={true}>
					<Grid container spacing={2.5} sx={{ pl: { xs: 0, sm: 5, md: 6, lg: 10, xl: 12 } }}>
						<Grid item xs={12} sm={5} md={4} lg={4} xl={3}>
							<MainCard>
								<Grid container spacing={3}>
									<Grid item xs={12}>
										<Stack spacing={2.5} alignItems="center">
											<Stack spacing={0.5} alignItems="center">
												<Typography variant="h5">{"Datos de Contacto	"}</Typography>
												<Typography color="secondary">{data.role}</Typography>
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
													<Sms size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">{data.email}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<Mobile size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">
														<PatternFormat displayType="text" format="+1 (###) ###-####" mask="_" defaultValue={data.phone} />
													</Typography>
												</ListItemSecondaryAction>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<Location size={18} />
												</ListItemIcon>
												<ListItemSecondaryAction>
													<Typography align="right">{data.country}</Typography>
												</ListItemSecondaryAction>
											</ListItem>
										</List>
									</Grid>
								</Grid>
							</MainCard>
						</Grid>
						<Grid item xs={12} sm={7} md={8} lg={8} xl={9}>
							<Stack spacing={2.5}>
								<MainCard title="Datos Personales">
									<List sx={{ py: 0 }}>
										<ListItem divider={!matchDownMD}>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Nombre</Typography>
														<Typography>{data.name}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Apellido</Typography>
														<Typography>
															{data.firstName} {data.lastName}
														</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
										<ListItem divider={!matchDownMD}>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">País</Typography>
														<Typography>{data.country}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Código Postal</Typography>
														<Typography>
															<PatternFormat displayType="text" format="### ###" mask="_" defaultValue={data.zipCode} />
														</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
										<ListItem>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Domicilio</Typography>
														<Typography>{data.address}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">Estado</Typography>
														<Typography>{data.status}</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
										<ListItem>
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">DNI</Typography>
														<Typography>{data.document}</Typography>
													</Stack>
												</Grid>
												<Grid item xs={12} md={6}>
													<Stack spacing={0.5}>
														<Typography color="secondary">CUIT/CUIL</Typography>
														<Typography>{data.cuit}</Typography>
													</Stack>
												</Grid>
											</Grid>
										</ListItem>
									</List>
								</MainCard>
							</Stack>
						</Grid>
					</Grid>
				</Transitions>
			</TableCell>
		</TableRow>
	);
};

export default CustomerView;
