import React, { useState, useEffect } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
	alpha,
	useTheme,
	Grid,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { DocumentCloud, SearchNormal1, People, Edit2, ArrowRight } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { useSelector, dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { Folder } from "types/folders";

interface LinkCauseSelectorProps {
	requiereField: string;
	requeridoField: string;
	onMethodChange: (
		method: "manual" | "causa",
		selectedFolder: Folder | null,
		folderData?: { folderId: string; folderName: string },
	) => void;
}

interface GetFoldersResponse {
	success: boolean;
	folders?: Folder[];
	error?: any;
}

const LinkCauseSelector: React.FC<LinkCauseSelectorProps> = ({ requiereField, requeridoField, onMethodChange }) => {
	const theme = useTheme();
	const [selectedMethod, setSelectedMethod] = useState<"manual" | "causa">("manual");
	const [openModal, setOpenModal] = useState(false);
	const [folders, setFolders] = useState<Folder[]>([]);
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Obtener el ID del usuario desde Redux
	const userId = useSelector((state) => state.auth.user?._id);

	// Efecto para cargar carpetas cuando se abre el modal
	useEffect(() => {
		if (openModal) {
			fetchFolders();
		}
	}, [openModal, userId]);

	// Manejar click en método
	const handleMethodClick = (method: "manual" | "causa") => {
		setSelectedMethod(method);

		// Notificar al componente padre sobre el cambio
		if (method === "causa" && selectedFolder) {
			// Pasar los datos de carpeta (folderId y folderName) cuando hay una carpeta seleccionada
			onMethodChange(method, selectedFolder, {
				folderId: selectedFolder._id,
				folderName: selectedFolder.folderName,
			});
		} else {
			onMethodChange(method, method === "causa" ? selectedFolder : null);
		}

		// Si cambia a manual y hay una carpeta seleccionada, resetear la selección
		if (method === "manual" && selectedFolder) {
			setSelectedFolder(null);
		}
		// Si cambia a causa pero no hay carpeta seleccionada, abrir el modal
		else if (method === "causa" && !selectedFolder) {
			setOpenModal(true);
		}
	};

	// Obtener carpetas del usuario
	const fetchFolders = async () => {
		setIsLoading(true);

		try {
			if (userId) {
				const response = (await dispatch(getFoldersByUserId(userId))) as unknown as GetFoldersResponse;

				if (response.success && response.folders) {
					setFolders(response.folders);
				} else {
					dispatch(
						openSnackbar({
							open: true,
							message: "No se encontraron carpetas disponibles",
							variant: "alert",
							alert: { color: "warning" },
							close: true,
						}),
					);
				}
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: "Necesita iniciar sesión para acceder a las carpetas",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cargar las carpetas",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Manejar búsqueda
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	// Filtrar carpetas según término de búsqueda
	const filteredFolders = folders.filter((folder) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			folder.folderName.toLowerCase().includes(searchLower) ||
			folder.materia.toLowerCase().includes(searchLower) ||
			(folder.description || "").toLowerCase().includes(searchLower)
		);
	});

	// Manejar selección de carpeta
	const handleSelectFolder = (folder: Folder) => {
		setSelectedFolder(folder);
		setSelectedMethod("causa");

		// Notificar al componente padre sobre el cambio con los datos de folderId y folderName
		onMethodChange("causa", folder, {
			folderId: folder._id,
			folderName: folder.folderName,
		});

		// Cerrar el modal
		setOpenModal(false);
	};

	// Cambiar selección de carpeta
	const handleChangeFolder = () => {
		// Abrir el modal para seleccionar una nueva carpeta
		setOpenModal(true);
	};

	return (
		<>
			<Box sx={{ width: "100%", mb: 3 }}>
				<Typography variant="h6" color="textPrimary" sx={{ mb: 2 }}>
					Método de ingreso
				</Typography>

				<Grid container spacing={2}>
					{/* Opción Ingreso Manual */}
					<Grid item xs={12}>
						<ListItemButton
							onClick={() => handleMethodClick("manual")}
							sx={{
								border: 1,
								borderColor: selectedMethod === "manual" ? theme.palette.primary.main : theme.palette.divider,
								borderRadius: 2,
								p: 2,
								display: "flex",
								alignItems: "center",
								backgroundColor: selectedMethod === "manual" ? alpha(theme.palette.primary.main, 0.05) : "transparent",
								"&:hover": {
									backgroundColor: alpha(theme.palette.primary.main, 0.08),
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<ListItemIcon sx={{ minWidth: 60 }}>
								<Box
									sx={{
										p: 1.5,
										borderRadius: 1,
										bgcolor: selectedMethod === "manual" ? alpha(theme.palette.primary.main, 0.1) : theme.palette.background.default,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Edit2 size={24} color={selectedMethod === "manual" ? theme.palette.primary.main : theme.palette.text.secondary} />
								</Box>
							</ListItemIcon>
							<ListItemText
								primary="Ingreso Manual"
								secondary="Complete manualmente los campos Reclamante y Reclamado"
								primaryTypographyProps={{ fontWeight: 600 }}
							/>
							<Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
								<ArrowRight size={24} color={theme.palette.text.secondary} />
							</Box>
						</ListItemButton>
					</Grid>

					{/* Opción Seleccionar Carpeta */}
					<Grid item xs={12}>
						<ListItemButton
							onClick={() => handleMethodClick("causa")}
							sx={{
								border: 1,
								borderColor: selectedMethod === "causa" ? theme.palette.primary.main : theme.palette.divider,
								borderRadius: 2,
								p: 2,
								display: "flex",
								alignItems: "center",
								backgroundColor: selectedMethod === "causa" ? alpha(theme.palette.primary.main, 0.05) : "transparent",
								"&:hover": {
									backgroundColor: alpha(theme.palette.primary.main, 0.08),
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<ListItemIcon sx={{ minWidth: 60 }}>
								<Box
									sx={{
										p: 1.5,
										borderRadius: 1,
										bgcolor: selectedMethod === "causa" ? alpha(theme.palette.primary.main, 0.1) : theme.palette.background.default,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<DocumentCloud
										size={24}
										color={selectedMethod === "causa" ? theme.palette.primary.main : theme.palette.text.secondary}
									/>
								</Box>
							</ListItemIcon>
							<ListItemText
								primary={selectedFolder ? selectedFolder.folderName : "Seleccionar Carpeta"}
								secondary={
									selectedFolder
										? `${selectedFolder.materia}${selectedFolder.description ? ` - ${selectedFolder.description}` : ""}`
										: "Importar datos desde una carpeta existente"
								}
								primaryTypographyProps={{ fontWeight: 600 }}
								secondaryTypographyProps={{
									sx: {
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										maxWidth: "400px",
									},
								}}
							/>
							<Box sx={{ display: "flex", alignItems: "center", ml: "auto", gap: 1 }}>
								{selectedFolder && (
									<Button size="small" variant="outlined" color="primary" onClick={handleChangeFolder}>
										Cambiar
									</Button>
								)}
								<ArrowRight size={24} color={theme.palette.text.secondary} />
							</Box>
						</ListItemButton>
					</Grid>
				</Grid>
			</Box>

			{/* Modal de selección de carpeta */}
			<Dialog
				open={openModal}
				onClose={() => setOpenModal(false)}
				PaperProps={{
					sx: {
						width: "600px",
						maxWidth: "600px",
						p: 0,
					},
				}}
			>
				<DialogTitle sx={{ bgcolor: theme.palette.primary.lighter, pb: 2 }}>
					<Stack spacing={1}>
						<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
							Seleccionar Carpeta
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Seleccione la carpeta para completar automáticamente los datos
						</Typography>
					</Stack>
				</DialogTitle>
				<Divider />

				<DialogContent sx={{ p: 2.5, width: "100%" }}>
					<FormControl sx={{ width: "100%", mb: 2.5 }}>
						<TextField
							autoFocus
							value={searchTerm}
							onChange={handleSearchChange}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={18} color={theme.palette.primary.main} />
									</InputAdornment>
								),
								sx: {
									bgcolor: theme.palette.background.paper,
									"&:hover": {
										bgcolor: theme.palette.action.hover,
									},
								},
							}}
							placeholder="Buscar carpetas..."
							fullWidth
						/>
					</FormControl>

					<SimpleBar
						sx={{
							maxHeight: "420px",
							width: "100%",
							overflowX: "hidden",
							overflowY: "auto",
						}}
					>
						<Stack spacing={1.5}>
							{!isLoading && filteredFolders.length > 0 ? (
								filteredFolders.map((folder) => (
									<Box
										key={folder._id}
										onClick={() => handleSelectFolder(folder)}
										sx={{
											width: "100%",
											border: "1px solid",
											borderColor: theme.palette.divider,
											borderRadius: 1,
											p: 2,
											cursor: "pointer",
											bgcolor: theme.palette.background.paper,
											transition: "all 0.3s ease",
											"&:hover": {
												borderColor: theme.palette.primary.main,
												bgcolor: alpha(theme.palette.primary.main, 0.08),
												transform: "translateY(-2px)",
												boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
											},
										}}
									>
										<Stack spacing={1.5}>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Tooltip title={folder.folderName}>
													<Typography
														variant="h6"
														sx={{
															flex: 1,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{folder.folderName}
													</Typography>
												</Tooltip>
											</Stack>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													color: "text.secondary",
													bgcolor: theme.palette.background.default,
													p: 1,
													borderRadius: 1,
												}}
											>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 500,
													}}
												>
													{folder.materia}
												</Typography>
												{folder.description && (
													<Tooltip title={folder.description}>
														<Typography
															variant="body2"
															sx={{
																maxWidth: "250px",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{folder.description}
														</Typography>
													</Tooltip>
												)}
											</Stack>
										</Stack>
									</Box>
								))
							) : (
								<Box
									sx={{
										textAlign: "center",
										py: 4,
										bgcolor: theme.palette.background.paper,
										borderRadius: 1,
										border: `1px dashed ${theme.palette.divider}`,
									}}
								>
									{isLoading ? (
										<Typography>Cargando carpetas...</Typography>
									) : (
										<Typography color="textSecondary">No se encontraron carpetas</Typography>
									)}
								</Box>
							)}
						</Stack>
					</SimpleBar>
				</DialogContent>

				<DialogActions sx={{ p: 2.5, bgcolor: theme.palette.background.default }}>
					<Button
						color="error"
						onClick={() => setOpenModal(false)}
						sx={{
							color: theme.palette.text.secondary,
							"&:hover": {
								bgcolor: theme.palette.action.hover,
							},
						}}
					>
						Cancelar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default LinkCauseSelector;
