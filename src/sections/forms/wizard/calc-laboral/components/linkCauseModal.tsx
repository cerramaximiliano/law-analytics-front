import React, { useState, useEffect } from "react";
import {
	Box,
	Button,
	Divider,
	Dialog,
	DialogActions,
	DialogTitle,
	DialogContent,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Add, SearchNormal1, TickCircle } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { getFoldersByUserId } from "store/reducers/folders";
import { updateCalculator } from "store/reducers/calculator";
import { Folder } from "types/folders";

interface LinkCauseModalProps {
	open: boolean;
	onClose: () => void;
	calculationId: string;
	folderId?: string;
}
interface GetFoldersResponse {
	success: boolean;
	folders?: Folder[];
	error?: any;
}

const LinkCauseModal: React.FC<LinkCauseModalProps> = ({ open, onClose, calculationId, folderId }) => {
	const theme = useTheme();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
	const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

	const userId = useSelector((state) => state.auth.user?._id);

	useEffect(() => {
		const fetchFolders = async () => {
			try {
				if (userId) {
					const response = (await dispatch(getFoldersByUserId(userId))) as unknown as GetFoldersResponse;
					if (response.success && response.folders) {
						setFolders(response.folders);
						if (folderId) {
							const current = response.folders.find((f) => f._id === folderId);
							if (current) {
								setCurrentFolder(current);
							}
						}
					}
				}
			} catch (error) {
				console.log(error);
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al cargar las causas",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		};

		if (open) {
			fetchFolders();
			setSelectedFolder(null);
			setSearchTerm("");
			setShowUnlinkDialog(!!folderId);
		}
	}, [open, userId, dispatch, folderId]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const filteredFolders = folders.filter((folder) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			folder.folderName.toLowerCase().includes(searchLower) ||
			folder.materia.toLowerCase().includes(searchLower) ||
			(folder.description || "").toLowerCase().includes(searchLower)
		);
	});

	const handleUnlink = async () => {
		try {
			const result = await dispatch(
				updateCalculator(calculationId, {
					folderId: null,
					folderName: null,
				}),
			);

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Causa desvinculada correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
				setShowUnlinkDialog(false);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al desvincular la causa",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			console.error("Error al desvincular la causa:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error inesperado al desvincular la causa",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleLink = async () => {
		if (!selectedFolder) return;

		try {
			const calculatorData = {
				folderId: selectedFolder._id,
				folderName: selectedFolder.folderName,
			};

			const result = await dispatch(updateCalculator(calculationId, calculatorData));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Cálculo vinculado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
				onClose();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al vincular el cálculo",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			console.error("Error al vincular el cálculo:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error inesperado al vincular el cálculo",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	if (showUnlinkDialog && currentFolder) {
		return (
			<Dialog
				open={open}
				onClose={onClose}
				PaperProps={{
					sx: {
						width: "450px",
						p: 0,
					},
				}}
			>
				<DialogTitle>
					<Stack spacing={1}>
						<Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
							Cambiar Vinculación
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Este cálculo ya tiene una causa vinculada
						</Typography>
					</Stack>
				</DialogTitle>
				<Divider />

				<DialogContent sx={{ p: 2.5 }}>
					<Stack spacing={2}>
						<Box
							sx={{
								p: 2.5,
								border: `2px solid ${theme.palette.primary.main}`,
								borderRadius: 2,
								bgcolor: theme.palette.primary.lighter,
								boxShadow: `0 0 10px 0 ${theme.palette.primary.lighter}`,
							}}
						>
							<Stack spacing={2}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<TickCircle
										size={24}
										variant="Bold"
										style={{
											color: theme.palette.primary.main,
										}}
									/>
									<Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
										Causa Actual
									</Typography>
								</Stack>

								<Stack spacing={1}>
									<Typography
										variant="h6"
										sx={{
											color: theme.palette.primary.darker,
											fontWeight: "bold",
										}}
									>
										{currentFolder.folderName}
									</Typography>
									<Stack
										direction="row"
										spacing={1}
										alignItems="center"
										sx={{
											bgcolor: theme.palette.background.paper,
											p: 1,
											borderRadius: 1,
										}}
									>
										<Typography
											variant="body2"
											sx={{
												color: theme.palette.text.secondary,
												fontWeight: 500,
											}}
										>
											Materia:
										</Typography>
										<Typography variant="body2">{currentFolder.materia}</Typography>
									</Stack>
								</Stack>
							</Stack>
						</Box>

						<Box
							sx={{
								p: 2,
								borderRadius: 1,
								bgcolor: theme.palette.warning.lighter,
								border: `1px solid ${theme.palette.warning.light}`,
							}}
						>
							<Stack spacing={1}>
								<Typography
									variant="body2"
									sx={{
										color: theme.palette.warning.dark,
										fontWeight: 500,
									}}
								>
									¿Qué desea hacer?
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Para vincular una nueva causa, primero debe desvincular la causa actual.
								</Typography>
							</Stack>
						</Box>
					</Stack>
				</DialogContent>

				<Divider />

				<DialogActions
					sx={{
						p: 2.5,
						bgcolor: theme.palette.background.default,
						borderBottomLeftRadius: "inherit",
						borderBottomRightRadius: "inherit",
					}}
				>
					<Button
						color="inherit"
						onClick={onClose}
						sx={{
							color: theme.palette.text.secondary,
							"&:hover": {
								bgcolor: theme.palette.action.hover,
							},
						}}
					>
						Cancelar
					</Button>
					<Button onClick={handleUnlink} variant="contained" color="primary" startIcon={<Add style={{ transform: "rotate(45deg)" }} />}>
						Desvincular Causa
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
	// ... imports y código anterior ...

	// El modal principal (cuando no hay causa vinculada)
	return (
		<Dialog
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: "600px",
					maxWidth: "600px",
					p: 0,
				},
			}}
			sx={{
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle sx={{ bgcolor: theme.palette.primary.lighter, pb: 2 }}>
				<Stack spacing={1}>
					<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
						Seleccione Causa
					</Typography>
					<Typography variant="body2" color="textSecondary">
						{selectedFolder ? "1 causa seleccionada" : "Seleccione la causa a la que desea vincular este cálculo"}
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 2.5, width: "100%" }}>
				{selectedFolder && (
					<Box sx={{ mb: 2.5 }}>
						<Stack spacing={1}>
							<Typography variant="subtitle2" color="textSecondary">
								Causa Seleccionada:
							</Typography>
							<Box
								sx={{
									p: 2,
									border: `2px solid ${theme.palette.primary.main}`,
									borderRadius: 2,
									bgcolor: theme.palette.primary.lighter,
									boxShadow: `0 0 10px 0 ${theme.palette.primary.lighter}`,
								}}
							>
								<Stack direction="row" alignItems="center" spacing={2}>
									<TickCircle size={24} variant="Bold" style={{ color: theme.palette.primary.main }} />
									<Typography
										variant="subtitle1"
										sx={{
											color: theme.palette.primary.darker,
											fontWeight: 600,
											flex: 1,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{`${selectedFolder.folderName} - ${selectedFolder.materia}`}
									</Typography>
									<Button
										size="small"
										color="primary"
										onClick={() => setSelectedFolder(null)}
										startIcon={<Add style={{ transform: "rotate(45deg)" }} />}
									>
										Quitar
									</Button>
								</Stack>
							</Box>
						</Stack>
					</Box>
				)}

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
						placeholder="Buscar causas..."
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
						{filteredFolders.length > 0 ? (
							filteredFolders.map((folder) => {
								const isSelected = selectedFolder?._id === folder._id;
								return (
									<Box
										key={folder._id}
										onClick={() => setSelectedFolder(isSelected ? null : folder)}
										sx={{
											width: "100%",
											border: "1px solid",
											borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
											borderRadius: 2,
											p: 2,
											cursor: "pointer",
											bgcolor: isSelected ? `${theme.palette.primary.lighter}` : theme.palette.background.paper,
											transition: "all 0.3s ease",
											"&:hover": {
												borderColor: theme.palette.primary.main,
												bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.primary.lighter + "80",
												transform: "translateY(-2px)",
												boxShadow: `0 4px 8px ${theme.palette.primary.lighter}`,
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
															color: isSelected ? theme.palette.primary.darker : "inherit",
															fontWeight: isSelected ? 600 : 500,
														}}
													>
														{folder.folderName}
													</Typography>
												</Tooltip>
												{isSelected && <TickCircle variant="Bold" size={24} style={{ color: theme.palette.primary.main }} />}
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
														maxWidth: "150px",
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
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
								);
							})
						) : (
							<Box
								sx={{
									textAlign: "center",
									py: 4,
									bgcolor: theme.palette.background.paper,
									borderRadius: 2,
									border: `1px dashed ${theme.palette.divider}`,
								}}
							>
								<Typography color="textSecondary">No se encontraron causas</Typography>
							</Box>
						)}
					</Stack>
				</SimpleBar>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5, bgcolor: theme.palette.background.default }}>
				<Button
					color="inherit"
					onClick={onClose}
					sx={{
						color: theme.palette.text.secondary,
						"&:hover": {
							bgcolor: theme.palette.action.hover,
						},
					}}
				>
					Cancelar
				</Button>
				<Button onClick={handleLink} color="primary" variant="contained" disabled={!selectedFolder}>
					Vincular Causa
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default LinkCauseModal;
