import { useState, useEffect } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogTitle,
	DialogContent,
	Divider,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Chip,
	CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SearchNormal1, TickCircle } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { useSelector, dispatch } from "store";
import { Folder } from "types/folders";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { linkFoldersToContact } from "store/reducers/contacts";

interface LinkToCauseProps {
	openLink: boolean;
	onCancelLink: () => void;
	contactId: string;
	folderIds: string[];
}

const LinkToCause = ({ openLink, onCancelLink, contactId, folderIds }: LinkToCauseProps) => {
	const theme = useTheme();
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFolders, setSelectedFolders] = useState<Folder[]>([]);
	const { folders } = useSelector((state) => state.folder);
	const { user } = useSelector((state) => state.auth);

	// Cargar folders si no existen
	useEffect(() => {
		const loadFolders = async () => {
			if (folders.length === 0 && user?._id && openLink) {
				setIsLoading(true);
				try {
					await dispatch(getFoldersByUserId(user._id));
				} catch (error) {
					console.error("Error loading folders:", error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		loadFolders();
	}, [folders.length, user?._id, openLink]);

	// Resetear selección cuando se abre el modal
	useEffect(() => {
		if (openLink) {
			setSelectedFolders([]);
			setSearchTerm("");
		}
	}, [openLink]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const handleFolderSelect = (folder: Folder) => {
		setSelectedFolders((prev) => {
			const isSelected = prev.some((f) => f._id === folder._id);
			if (isSelected) {
				return prev.filter((f) => f._id !== folder._id);
			} else {
				return [...prev, folder];
			}
		});
	};

	// En LinkToCause.tsx

	const handleLink = async () => {
		if (selectedFolders.length > 0) {
			const folderIds = selectedFolders.map((folder) => folder._id);

			try {
				const result = await dispatch(linkFoldersToContact(contactId, folderIds));

				if (result.success) {
					dispatch(
						openSnackbar({
							open: true,
							message: "Causas vinculadas correctamente",
							variant: "alert",
							alert: { color: "success" },
							close: true,
						}),
					);
					onCancelLink();
				} else {
					dispatch(
						openSnackbar({
							open: true,
							message: result.error || "Error al vincular las causas",
							variant: "alert",
							alert: { color: "error" },
							close: true,
						}),
					);
				}
			} catch (error) {
				console.error("Error en handleLink:", error);
				dispatch(
					openSnackbar({
						open: true,
						message: "Error inesperado al vincular las causas",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		}
	};

	const removeFolder = (folderId: string) => {
		setSelectedFolders((prev) => prev.filter((f) => f._id !== folderId));
	};

	const filteredFolders = folders.filter((folder: Folder) => {
		const nameMatches = folder.folderName.toLowerCase().includes(searchTerm.toLowerCase());
		const isNotLinked = !folderIds?.includes(folder._id); // Agregado operador opcional
		return nameMatches && isNotLinked;
	});

	return (
		<Dialog
			maxWidth="sm"
			open={openLink}
			onClose={onCancelLink}
			sx={{
				"& .MuiDialog-paper": { p: 0 },
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5">Seleccione Causas</Typography>
					<Typography color="textSecondary" variant="subtitle2">
						{selectedFolders.length} seleccionadas
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 2.5 }}>
				{selectedFolders.length > 0 && (
					<Box sx={{ mb: 2 }}>
						<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
							{selectedFolders.map((folder) => (
								<Chip
									key={folder._id}
									label={folder.folderName}
									onDelete={() => removeFolder(folder._id)}
									color="primary"
									variant="outlined"
								/>
							))}
						</Stack>
					</Box>
				)}

				<FormControl sx={{ width: "100%", pb: 2 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} />
								</InputAdornment>
							),
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
					{isLoading ? (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								py: 3,
							}}
						>
							<CircularProgress />
						</Box>
					) : (
						<Stack spacing={1}>
							{filteredFolders.length > 0 ? (
								filteredFolders.map((folder: Folder) => {
									const isSelected = selectedFolders.some((f) => f._id === folder._id);
									return (
										<Box
											key={folder._id}
											onClick={() => handleFolderSelect(folder)}
											sx={{
												width: "100%",
												border: "1px solid",
												borderColor: isSelected ? theme.palette.primary.main : "divider",
												borderRadius: 1,
												p: 2,
												cursor: "pointer",
												bgcolor: isSelected ? `${theme.palette.primary.lighter}` : "background.paper",
												transition: "all 0.3s ease",
												"&:hover": {
													borderColor: theme.palette.primary.main,
													bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.primary.lighter + "80",
												},
												position: "relative",
											}}
										>
											<Stack spacing={1}>
												<Stack direction="row" alignItems="center" spacing={1}>
													<Typography variant="h6" sx={{ flex: 1 }}>
														{folder.folderName}
													</Typography>
													{isSelected && (
														<TickCircle
															variant="Bold"
															size={24}
															style={{
																color: theme.palette.primary.main,
															}}
														/>
													)}
												</Stack>
												<Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
													<Typography variant="body2">Estado: {folder.status || "Sin estado"}</Typography>
													{folder.materia && <Typography variant="body2">Materia: {folder.materia}</Typography>}
												</Stack>
											</Stack>
										</Box>
									);
								})
							) : (
								<Box sx={{ textAlign: "center", py: 3 }}>
									<Typography color="textSecondary">{searchTerm ? "No se encontraron causas" : "No hay causas disponibles"}</Typography>
								</Box>
							)}
						</Stack>
					)}
				</SimpleBar>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5 }}>
				<Button color="error" onClick={onCancelLink} disabled={isLoading}>
					Cancelar
				</Button>
				<Button onClick={handleLink} color="primary" variant="contained" disabled={selectedFolders.length === 0 || isLoading}>
					Vincular {selectedFolders.length > 0 && `(${selectedFolders.length})`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default LinkToCause;
