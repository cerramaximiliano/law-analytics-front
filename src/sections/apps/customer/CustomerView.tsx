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
	CircularProgress,
	IconButton,
	Tooltip,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

// project-imports
import MainCard from "components/MainCard";
import Transitions from "components/@extended/Transitions";

// assets
import { Link1, Location, Mobile, Sms } from "iconsax-react";
import { dispatch } from "store";
import React, { useCallback, useEffect, useState } from "react";
import { getFoldersByIds } from "store/reducers/folders";

import { Folder } from "types/folders";
import { Contact } from "types/contact";
import { unlinkFolderFromContact } from "store/reducers/contacts";
import { openSnackbar } from "store/reducers/snackbar";

interface ContactViewProps {
	data: Contact;
}

// ==============================|| CUSTOMER - VIEW ||============================== //
const CustomerView = React.memo(
	({ data }: ContactViewProps) => {
		const theme = useTheme();
		const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));

		const [linkedFolders, setLinkedFolders] = useState<Folder[]>([]);
		const [isLoadingFolders, setIsLoadingFolders] = useState(false);
		const [error, setError] = useState<string | null>(null);
		const [isProcessing, setIsProcessing] = useState<string | null>(null);

		const handleUnlink = useCallback(
			async (folderId: string) => {
				if (!data._id || !folderId) return;

				try {
					setIsProcessing(folderId);
					const result = await dispatch(unlinkFolderFromContact(data._id, folderId));

					if (result.success) {
						// Actualizar el estado local de manera segura sin causar re-renders innecesarios
						setLinkedFolders((prev) => prev.filter((folder) => folder._id !== folderId));

						// Notificar éxito
						dispatch(
							openSnackbar({
								open: true,
								message: "Causa desvinculada correctamente",
								variant: "alert",
								alert: {
									color: "success",
								},
								close: true,
							}),
						);
					} else {
						dispatch(
							openSnackbar({
								open: true,
								message: "Error al desvincular la causa",
								variant: "alert",
								alert: {
									color: "error",
								},
								close: true,
							}),
						);
					}
				} catch (error) {
					console.error("Error al desvincular:", error);

					// Notificar error
					dispatch(
						openSnackbar({
							open: true,
							message: error instanceof Error ? error.message : "Error al desvincular la causa",
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);

					// No modificar el estado local en caso de error
				} finally {
					setIsProcessing(null);
				}
			},
			[data._id],
		);

		const LinkedFoldersSection = useCallback(
			() => (
				<List sx={{ py: 0 }}>
					{isLoadingFolders ? (
						<ListItem>
							<CircularProgress size={20} />
							<Typography ml={2}>Cargando causas vinculadas...</Typography>
						</ListItem>
					) : error ? (
						<ListItem>
							<Typography color="error">{error}</Typography>
						</ListItem>
					) : linkedFolders.length > 0 ? (
						linkedFolders.map((folder) => (
							<ListItem
								key={folder._id}
								sx={{
									borderRadius: 1,
									mb: 1,
									transition: "all 0.3s ease-in-out",
									"&:hover": {
										bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
									},
								}}
							>
								<Stack direction="row" alignItems="center" spacing={1} width="100%" justifyContent="space-between">
									<Stack spacing={0.5} flex={1}>
										<Typography color="secondary">{folder.folderName}</Typography>
										<Typography variant="caption">{folder.status}</Typography>
									</Stack>

									<Tooltip title="Desvincular causa">
										<span>
											{" "}
											{/* Wrapper para mantener el Tooltip cuando está deshabilitado */}
											<IconButton
												size="small"
												onClick={() => handleUnlink(folder._id)}
												disabled={isProcessing === folder._id}
												sx={{
													color: theme.palette.mode === "dark" ? "error.light" : "error.dark",
													"&:hover": {
														bgcolor: theme.palette.mode === "dark" ? "error.darker" : "error.lighter",
													},
												}}
											>
												{isProcessing === folder._id ? <CircularProgress size={18} color="inherit" /> : <Link1 variant="Bulk" size={18} />}
											</IconButton>
										</span>
									</Tooltip>
								</Stack>
							</ListItem>
						))
					) : (
						<ListItem>
							<Typography color="textSecondary">No hay causas vinculadas</Typography>
						</ListItem>
					)}
				</List>
			),
			[linkedFolders, isLoadingFolders, error, isProcessing, handleUnlink, theme.palette.mode],
		);

		useEffect(() => {
			const fetchLinkedFolders = async () => {
				setIsLoadingFolders(true);
				setError(null);

				try {
					// Asegurarse de que data.folderIds existe y es un array
					const folderIds = Array.isArray(data.folderIds) ? data.folderIds : [];

					if (folderIds.length > 0) {
						const result = await dispatch(getFoldersByIds(folderIds));

						if (result.success) {
							setLinkedFolders(result.folders || []);
						} else {
							setError(result.error || "Error al obtener las causas vinculadas");
							setLinkedFolders([]);
						}
					} else {
						setLinkedFolders([]);
					}
				} catch (error) {
					console.error("Error fetching linked folders:", error);
					setError("Error al cargar las causas vinculadas");
					setLinkedFolders([]);
				} finally {
					setIsLoadingFolders(false);
				}
			};

			fetchLinkedFolders();
		}, [data.folderIds]);

		return (
			<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` }, overflow: "hidden" }}>
				<TableCell colSpan={8} sx={{ p: 2.5, overflow: "hidden" }}>
					<Transitions type="slide" direction="down" in={true}>
						<Grid container spacing={2.5} sx={{ pl: { xs: 0, sm: 5, md: 6, lg: 10, xl: 12 } }}>
							<Grid item xs={12} sm={5} md={4} lg={4} xl={3}>
								<Stack spacing={2.5}>
									<MainCard shadow={3}>
										<Grid container spacing={2}>
											<Grid item xs={12}>
												<Stack spacing={2.5} alignItems="center">
													<Stack spacing={0.5} alignItems="center">
														<Typography variant="h5">{"Datos de Contacto"}</Typography>
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
															<Typography align="right">{data.address}</Typography>
														</ListItemSecondaryAction>
													</ListItem>
												</List>
											</Grid>
										</Grid>
									</MainCard>
									<MainCard shadow={3}>
										<Grid container spacing={2}>
											<Grid item xs={12}>
												<Stack spacing={2.5} alignItems="center">
													<Stack spacing={0.5} alignItems="center">
														<Typography variant="h5">{"Causas Vinculadas"}</Typography>
													</Stack>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Divider />
											</Grid>
											<Grid item xs={12}>
												<LinkedFoldersSection />
											</Grid>
										</Grid>
									</MainCard>
								</Stack>
							</Grid>
							<Grid item xs={12} sm={7} md={8} lg={8} xl={9}>
								<Stack spacing={2.5}>
									<MainCard shadow={3} title="Datos Personales">
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
															<Typography>{data.lastName}</Typography>
														</Stack>
													</Grid>
												</Grid>
											</ListItem>
											<ListItem divider={!matchDownMD}>
												<Grid container spacing={3}>
													<Grid item xs={12} md={6}>
														<Stack spacing={0.5}>
															<Typography color="secondary">País</Typography>
															<Typography>{data.nationality}</Typography>
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
	},
	(prevProps, nextProps) => {
		// Custom comparison para evitar re-renders innecesarios
		return (
			prevProps.data._id === nextProps.data._id && JSON.stringify(prevProps.data.folderIds) === JSON.stringify(nextProps.data.folderIds)
		);
	},
);

export default React.memo(CustomerView);
