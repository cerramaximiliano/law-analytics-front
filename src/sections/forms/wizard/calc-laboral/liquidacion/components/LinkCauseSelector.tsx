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
	Tabs,
	Tab,
	alpha,
	useTheme,
} from "@mui/material";
import { DocumentCloud, SearchNormal1, People, Edit2 } from "iconsax-react";
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

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`method-tabpanel-${index}`}
			aria-labelledby={`method-tab-${index}`}
			{...other}
			style={{ height: "100%" }}
		>
			{value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `method-tab-${index}`,
		"aria-controls": `method-tabpanel-${index}`,
	};
}

const LinkCauseSelector: React.FC<LinkCauseSelectorProps> = ({ requiereField, requeridoField, onMethodChange }) => {
	const theme = useTheme();
	const [tabValue, setTabValue] = useState(0);
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

	// Manejar cambio de tab
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		const method = newValue === 0 ? "manual" : "causa";
		setTabValue(newValue);

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

	const boxHeight = 110; // Altura fija para los dos paneles, ligeramente reducida para mejor integración

	return (
		<>
			<Box
				sx={{
					width: "100%",
					mb: 3.5,
				}}
			>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					variant="fullWidth"
					sx={{
						mb: 0.5,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
						"& .MuiTabs-indicator": {
							height: 3,
						},
					}}
				>
					<Tab
						icon={<Edit2 size={20} />}
						label="Ingreso Manual"
						{...a11yProps(0)}
						sx={{
							py: 1.5,
							fontWeight: tabValue === 0 ? 600 : 400,
							"& .MuiTab-iconWrapper": {
								marginRight: 1,
							},
						}}
					/>
					<Tab
						icon={<DocumentCloud size={20} />}
						label="Seleccionar Carpeta"
						{...a11yProps(1)}
						sx={{
							py: 1.5,
							fontWeight: tabValue === 1 ? 600 : 400,
							"& .MuiTab-iconWrapper": {
								marginRight: 1,
							},
						}}
					/>
				</Tabs>

				<TabPanel value={tabValue} index={0}>
					<Box
						sx={{
							p: 2,
							height: boxHeight,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							bgcolor: alpha(theme.palette.primary.lighter, 0.15),
						}}
					>
						<Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
							<People size={32} color={theme.palette.text.secondary} />
							<Typography variant="h6" color="textSecondary">
								Ingreso manual de datos
							</Typography>
							<Typography variant="body2" color="textSecondary" align="center">
								Los campos Reclamante y Reclamado deben completarse manualmente
							</Typography>
						</Stack>
					</Box>
				</TabPanel>

				<TabPanel value={tabValue} index={1}>
					{selectedFolder ? (
						<Box
							sx={{
								p: 2,
								height: boxHeight,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.default, 0.5),
							}}
						>
							<Stack spacing={2}>
								<Stack direction="row" alignItems="center" spacing={2}>
									<DocumentCloud size={24} color={theme.palette.primary.main} />
									<Typography variant="h6" color="primary" sx={{ flex: 1 }}>
										{selectedFolder.folderName}
									</Typography>
									<Button size="small" variant="outlined" color="primary" onClick={handleChangeFolder}>
										Cambiar
									</Button>
								</Stack>

								<Box
									sx={{
										p: 1.25,
										borderRadius: 0.75,
										bgcolor: theme.palette.background.paper,
										border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
										boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
									}}
								>
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Materia:
										</Typography>
										<Typography variant="body2" color="textSecondary">
											{selectedFolder.materia}
										</Typography>
									</Stack>
									{selectedFolder.description && (
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												Descripción:
											</Typography>
											<Tooltip title={selectedFolder.description}>
												<Typography
													variant="body2"
													color="textSecondary"
													sx={{
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
														maxWidth: "250px",
													}}
												>
													{selectedFolder.description}
												</Typography>
											</Tooltip>
										</Stack>
									)}
								</Box>
							</Stack>
						</Box>
					) : (
						<Box
							sx={{
								p: 2,
								height: boxHeight,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								bgcolor: alpha(theme.palette.primary.lighter, 0.15),
								borderRadius: 1,
							}}
						>
							<Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
								<DocumentCloud size={32} color={theme.palette.text.secondary} />
								<Typography variant="h6" color="textSecondary">
									No hay carpeta seleccionada
								</Typography>
								<Button variant="contained" color="primary" onClick={() => setOpenModal(true)} startIcon={<DocumentCloud />}>
									Seleccionar Carpeta
								</Button>
							</Stack>
						</Box>
					)}
				</TabPanel>
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
