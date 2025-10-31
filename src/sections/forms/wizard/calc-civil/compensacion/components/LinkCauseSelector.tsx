import React, { useState, useEffect } from "react";
import {
	Box,
	Button,
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
	Radio,
	RadioGroup,
	FormControlLabel,
	Chip,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { DocumentCloud, SearchNormal1, Edit2 } from "iconsax-react";
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
			<Box sx={{ width: "100%", mb: 1.5 }}>
				<Typography variant="subtitle2" color="textPrimary" sx={{ mb: 0.75, fontWeight: 600 }}>
					Método de ingreso
				</Typography>

				<Box
					sx={{
						border: 1,
						borderColor: theme.palette.divider,
						borderRadius: 1,
						p: 1,
						bgcolor: theme.palette.background.paper,
					}}
				>
					<RadioGroup value={selectedMethod} onChange={(e) => handleMethodClick(e.target.value as "manual" | "causa")}>
						<Stack spacing={0.75}>
							{/* Opciones horizontales */}
							<Stack direction="row" spacing={1.5} alignItems="center">
								{/* Opción Manual */}
								<FormControlLabel
									value="manual"
									control={<Radio size="small" />}
									label={
										<Stack direction="row" spacing={0.5} alignItems="center">
											<Edit2 size={16} color={theme.palette.text.secondary} />
											<Typography variant="body2">Ingreso Manual</Typography>
										</Stack>
									}
									sx={{ m: 0 }}
								/>

								{/* Opción Carpeta */}
								<FormControlLabel
									value="causa"
									control={<Radio size="small" />}
									label={
										<Stack direction="row" spacing={0.5} alignItems="center">
											<DocumentCloud size={16} color={theme.palette.text.secondary} />
											<Typography variant="body2">Seleccionar Carpeta</Typography>
										</Stack>
									}
									sx={{ m: 0 }}
								/>

								{/* Botón Elegir */}
								{!selectedFolder && selectedMethod === "causa" && (
									<Button
										size="small"
										variant="outlined"
										onClick={handleChangeFolder}
										sx={{ ml: "auto", textTransform: "none", py: 0.25, px: 1.5 }}
									>
										Elegir
									</Button>
								)}
							</Stack>

							{/* Info de carpeta seleccionada */}
							{selectedFolder && selectedMethod === "causa" && (
								<Box
									sx={{
										pl: 1.5,
										pr: 1,
										py: 0.75,
										borderLeft: `2px solid ${theme.palette.primary.main}`,
										bgcolor: alpha(theme.palette.primary.main, 0.04),
										borderRadius: "0 4px 4px 0",
									}}
								>
									<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
										<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
											<Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
												{selectedFolder.folderName}
											</Typography>
											<Chip label={selectedFolder.materia} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
											{selectedFolder.description && (
												<Tooltip title={selectedFolder.description}>
													<Typography
														variant="caption"
														color="textSecondary"
														sx={{
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
															maxWidth: "150px",
														}}
													>
														{selectedFolder.description}
													</Typography>
												</Tooltip>
											)}
										</Stack>
										<Button size="small" variant="outlined" onClick={handleChangeFolder} sx={{ flexShrink: 0, py: 0.25, px: 1 }}>
											Cambiar
										</Button>
									</Stack>
								</Box>
							)}
						</Stack>
					</RadioGroup>
				</Box>
			</Box>

			{/* Modal de selección de carpeta */}
			<ResponsiveDialog
				maxWidth="sm"
				open={openModal}
				onClose={() => setOpenModal(false)}
				PaperProps={{
					sx: {
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
			</ResponsiveDialog>
		</>
	);
};

export default LinkCauseSelector;
