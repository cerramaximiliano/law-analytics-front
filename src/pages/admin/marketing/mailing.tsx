import { useState } from "react";

// material-ui
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Grid,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { Add, Edit2, Trash } from "iconsax-react";

// types
interface Campaign {
	id: string;
	name: string;
	subject: string;
	status: "draft" | "scheduled" | "sent" | "error";
	recipients: number;
	openRate: number;
	sentDate: string;
}

// mock data
const mockCampaigns: Campaign[] = [
	{
		id: "1",
		name: "Boletín mensual - Mayo 2025",
		subject: "Novedades jurídicas del mes",
		status: "sent",
		recipients: 453,
		openRate: 32.4,
		sentDate: "2025-05-01",
	},
	{
		id: "2",
		name: "Webinar Derecho Laboral",
		subject: "Invitación: Nuevo webinar sobre reformas laborales",
		status: "scheduled",
		recipients: 287,
		openRate: 0,
		sentDate: "2025-06-15",
	},
	{
		id: "3",
		name: "Ofertas especiales - Junio",
		subject: "Ofertas especiales en nuestros servicios legales",
		status: "draft",
		recipients: 0,
		openRate: 0,
		sentDate: "",
	},
];

// ==============================|| ADMIN - MAILING CAMPAIGNS ||============================== //

const MailingCampaigns = () => {
	const theme = useTheme();

	// State for campaigns data
	const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

	// State for pagination
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Pagination handlers
	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	// Delete campaign handler
	const handleDeleteCampaign = (id: string) => {
		setCampaigns(campaigns.filter((campaign) => campaign.id !== id));
	};

	// Status chip color mapping
	const getStatusColor = (status: Campaign["status"]) => {
		switch (status) {
			case "draft":
				return { color: "default", label: "Borrador" };
			case "scheduled":
				return { color: "info", label: "Programada" };
			case "sent":
				return { color: "success", label: "Enviada" };
			case "error":
				return { color: "error", label: "Error" };
			default:
				return { color: "default", label: status };
		}
	};

	return (
		<MainCard>
			<Box sx={{ mb: 2 }}>
				<Grid container alignItems="center" justifyContent="space-between">
					<Grid item>
						<Typography variant="h3">Campañas de Email Marketing</Typography>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" startIcon={<Add />} sx={{ textTransform: "none" }}>
							Nueva campaña
						</Button>
					</Grid>
				</Grid>
			</Box>

			<MainCard content={false}>
				<Box sx={{ p: 2 }}>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} sm={6}>
							<TextField fullWidth label="Buscar campaña" placeholder="Buscar por nombre o asunto" size="small" />
						</Grid>
						<Grid item xs={12} sm={6} sx={{ textAlign: { sm: "right" } }}>
							{/* Additional filters could go here */}
						</Grid>
					</Grid>
				</Box>
				<Divider />

				<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
					<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
						<TableHead>
							<TableRow>
								<TableCell>Nombre</TableCell>
								<TableCell>Asunto</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell align="right">Destinatarios</TableCell>
								<TableCell align="right">Tasa de apertura</TableCell>
								<TableCell align="right">Fecha de envío</TableCell>
								<TableCell align="center">Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{campaigns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((campaign) => {
								const statusInfo = getStatusColor(campaign.status);

								return (
									<TableRow hover key={campaign.id} tabIndex={-1}>
										<TableCell>
											<Typography variant="subtitle2">{campaign.name}</Typography>
										</TableCell>
										<TableCell>{campaign.subject}</TableCell>
										<TableCell>
											<Chip label={statusInfo.label} color={statusInfo.color as any} size="small" />
										</TableCell>
										<TableCell align="right">{campaign.recipients}</TableCell>
										<TableCell align="right">{campaign.status === "sent" ? `${campaign.openRate}%` : "-"}</TableCell>
										<TableCell align="right">{campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : "-"}</TableCell>
										<TableCell align="center">
											<Stack direction="row" spacing={1} justifyContent="center">
												<IconButton aria-label="editar" size="small" color="primary" disabled={campaign.status === "sent"}>
													<Edit2 size={18} />
												</IconButton>
												<IconButton aria-label="eliminar" size="small" color="error" onClick={() => handleDeleteCampaign(campaign.id)}>
													<Trash size={18} />
												</IconButton>
											</Stack>
										</TableCell>
									</TableRow>
								);
							})}
							{campaigns.length === 0 && (
								<TableRow>
									<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
										<Typography variant="subtitle1">No hay campañas disponibles</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<TablePagination
					rowsPerPageOptions={[5, 10, 25]}
					component="div"
					count={campaigns.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					labelRowsPerPage="Filas por página:"
					labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
				/>
			</MainCard>

			<Grid container spacing={3} sx={{ mt: 2 }}>
				<Grid item xs={12} md={6} lg={4}>
					<Card>
						<CardHeader title="Estadísticas de campañas" />
						<CardContent>
							<Stack spacing={2}>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Total de campañas
									</Typography>
									<Typography variant="h4">{campaigns.length}</Typography>
								</Box>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Tasa de apertura promedio
									</Typography>
									<Typography variant="h4">
										{campaigns.filter((c) => c.status === "sent").length
											? (
													campaigns.filter((c) => c.status === "sent").reduce((acc, curr) => acc + curr.openRate, 0) /
													campaigns.filter((c) => c.status === "sent").length
											  ).toFixed(1) + "%"
											: "0%"}
									</Typography>
								</Box>
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Destinatarios totales
									</Typography>
									<Typography variant="h4">{campaigns.reduce((acc, curr) => acc + curr.recipients, 0)}</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={6} lg={8}>
					<Card>
						<CardHeader title="Estado de campañas" />
						<CardContent>
							<Grid container spacing={2}>
								{["draft", "scheduled", "sent", "error"].map((status) => {
									const count = campaigns.filter((c) => c.status === status).length;
									const statusInfo = getStatusColor(status as Campaign["status"]);

									return (
										<Grid item xs={6} sm={3} key={status}>
											<Box
												sx={{
													p: 2.5,
													bgcolor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.grey[50],
													borderRadius: 2,
													textAlign: "center",
												}}
											>
												<Typography variant="h4">{count}</Typography>
												<Chip label={statusInfo.label} color={statusInfo.color as any} size="small" sx={{ mt: 1 }} />
											</Box>
										</Grid>
									);
								})}
							</Grid>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default MailingCampaigns;
