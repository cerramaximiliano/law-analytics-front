import React from "react";
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
import { useSelector, useDispatch } from "store";
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
	const dispatch = useDispatch();
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
				} finally {
					setIsLoading(false);
				}
			}
		};

		loadFolders();
	}, [folders.length, user?._id, openLink, dispatch]);

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
		const isNotLinked = !folderIds?.includes(folder._id);
		return nameMatches && isNotLinked;
	});

	return (
		<Dialog
			maxWidth="md"
			fullWidth
			open={openLink}
			onClose={onCancelLink}
			sx={{
				"& .MuiDialog-paper": {
					p: 0,
					borderRadius: 2,
					boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
				},
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
						Seleccione Causas
					</Typography>
					<Typography color="textSecondary" variant="subtitle2">
						{selectedFolders.length} seleccionadas
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent
				sx={{
					p: 3,
					maxHeight: "70vh",
					overflowY: "auto",
				}}
			>
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
									sx={{
										maxWidth: "200px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										"&:hover": {
											bgcolor: `${theme.palette.primary.lighter} !important`,
										},
									}}
								/>
							))}
						</Stack>
					</Box>
				)}

				<FormControl sx={{ width: "100%", mb: 3 }}>
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
						<Stack spacing={1.5}>
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
												maxWidth: "100%",
											}}
										>
											<Stack spacing={1}>
												<Stack direction="row" alignItems="center" spacing={1}>
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
													<Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
														Estado: {folder.status || "Sin estado"}
													</Typography>
													{folder.materia && (
														<Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
															Materia: {folder.materia}
														</Typography>
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
										border: "1px dashed",
										borderColor: theme.palette.divider,
									}}
								>
									<Typography color="textSecondary">{searchTerm ? "No se encontraron causas" : "No hay causas disponibles"}</Typography>
								</Box>
							)}
						</Stack>
					)}
				</SimpleBar>
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button
					color="inherit"
					onClick={onCancelLink}
					disabled={isLoading}
					sx={{
						color: theme.palette.text.secondary,
						"&:hover": {
							bgcolor: theme.palette.action.hover,
						},
					}}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleLink}
					color="primary"
					variant="contained"
					disabled={selectedFolders.length === 0 || isLoading}
					sx={{
						minWidth: 120,
						py: 1.25,
						fontWeight: 600,
					}}
				>
					Vincular {selectedFolders.length > 0 && `(${selectedFolders.length})`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default LinkToCause;
