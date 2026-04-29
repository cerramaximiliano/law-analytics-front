import React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { SearchNormal1, TickCircle, MinusCirlce } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { useSelector, useDispatch } from "store";
import { Folder } from "types/folders";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { linkFoldersToContact, unlinkFolderFromContact } from "store/reducers/contacts";

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
	const [isSaving, setIsSaving] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
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

	// Pre-seleccionar carpetas ya vinculadas cuando se abre el modal
	useEffect(() => {
		if (openLink) {
			setSelectedFolderIds(new Set(folderIds || []));
			setSearchTerm("");
		}
	}, [openLink]); // eslint-disable-line react-hooks/exhaustive-deps

	const originalFolderIds = useMemo(() => new Set(folderIds || []), [folderIds]);

	const handleFolderToggle = (folder: Folder) => {
		setSelectedFolderIds((prev) => {
			const next = new Set(prev);
			if (next.has(folder._id)) {
				next.delete(folder._id);
			} else {
				next.add(folder._id);
			}
			return next;
		});
	};

	const toLink = useMemo(() => [...selectedFolderIds].filter((id) => !originalFolderIds.has(id)), [selectedFolderIds, originalFolderIds]);

	const toUnlink = useMemo(() => [...originalFolderIds].filter((id) => !selectedFolderIds.has(id)), [selectedFolderIds, originalFolderIds]);

	const hasChanges = toLink.length > 0 || toUnlink.length > 0;

	const handleSave = async () => {
		if (!hasChanges) return;
		setIsSaving(true);
		try {
			// Vincular nuevas carpetas
			if (toLink.length > 0) {
				const result = await dispatch(linkFoldersToContact(contactId, toLink));
				if (!result.success) throw new Error(result.error || "Error al vincular carpetas");
			}

			// Desvincular carpetas removidas (una por una según la API)
			for (const folderId of toUnlink) {
				const result = await dispatch(unlinkFolderFromContact(contactId, folderId));
				if (!result.success) throw new Error(result.error || "Error al desvincular carpeta");
			}

			dispatch(
				openSnackbar({
					open: true,
					message: "Carpetas actualizadas correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			onCancelLink();
		} catch (error: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: error?.message || "Error al actualizar las carpetas",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const filteredFolders = folders.filter((folder: Folder) => folder.folderName.toLowerCase().includes(searchTerm.toLowerCase()));

	const linkedCount = selectedFolderIds.size;

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
						Gestionar Carpetas
					</Typography>
					<Stack direction="row" spacing={1.5} alignItems="center">
						{toUnlink.length > 0 && <Chip label={`-${toUnlink.length} a desvincular`} size="small" color="error" variant="outlined" />}
						{toLink.length > 0 && <Chip label={`+${toLink.length} a vincular`} size="small" color="success" variant="outlined" />}
						<Typography color="textSecondary" variant="subtitle2">
							{linkedCount} vinculada{linkedCount !== 1 ? "s" : ""}
						</Typography>
					</Stack>
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
				<FormControl sx={{ width: "100%", mb: 3 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} color={theme.palette.primary.main} />
								</InputAdornment>
							),
							sx: {
								bgcolor: theme.palette.background.paper,
								"&:hover": { bgcolor: theme.palette.action.hover },
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
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
							<CircularProgress />
						</Box>
					) : (
						<Stack spacing={1.5}>
							{filteredFolders.length > 0 ? (
								filteredFolders.map((folder: Folder) => {
									const isSelected = selectedFolderIds.has(folder._id);
									const wasLinked = originalFolderIds.has(folder._id);
									const willUnlink = wasLinked && !isSelected;
									const willLink = !wasLinked && isSelected;

									let borderColor = "divider";
									let bgcolor = "background.paper";
									if (willUnlink) {
										borderColor = theme.palette.error.main;
										bgcolor = theme.palette.error.lighter;
									} else if (willLink) {
										borderColor = theme.palette.success.main;
										bgcolor = theme.palette.success.lighter;
									} else if (isSelected) {
										borderColor = theme.palette.primary.main;
										bgcolor = theme.palette.primary.lighter;
									}

									return (
										<Box
											key={folder._id}
											onClick={() => handleFolderToggle(folder)}
											sx={{
												width: "100%",
												border: "1px solid",
												borderColor,
												borderRadius: 1,
												p: 2,
												cursor: "pointer",
												bgcolor,
												transition: "all 0.2s ease",
												"&:hover": {
													borderColor: willUnlink
														? theme.palette.error.dark
														: isSelected
														? theme.palette.primary.main
														: theme.palette.primary.light,
												},
												position: "relative",
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
													{willUnlink && (
														<MinusCirlce variant="Bold" size={22} style={{ color: theme.palette.error.main, flexShrink: 0 }} />
													)}
													{isSelected && !willUnlink && (
														<TickCircle
															variant="Bold"
															size={22}
															style={{ color: willLink ? theme.palette.success.main : theme.palette.primary.main, flexShrink: 0 }}
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
									<Typography color="textSecondary">{searchTerm ? "No se encontraron carpetas" : "No hay carpetas disponibles"}</Typography>
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
				<Button color="inherit" onClick={onCancelLink} disabled={isSaving} sx={{ color: theme.palette.text.secondary }}>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					color="primary"
					variant="contained"
					disabled={!hasChanges || isSaving}
					sx={{ minWidth: 120, py: 1.25, fontWeight: 600 }}
				>
					{isSaving ? <CircularProgress size={18} color="inherit" /> : "Guardar cambios"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default LinkToCause;
