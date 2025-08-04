import { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItem,
	ListItemButton,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Radio,
	Typography,
	Box,
	TextField,
	InputAdornment,
	CircularProgress,
	Stack,
	Chip,
	useTheme,
} from "@mui/material";
import { Folder2, SearchNormal1 } from "iconsax-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { getFoldersByUserId } from "store/reducers/folder";

interface FolderSelectionDialogProps {
	open: boolean;
	onSelect: (folder: any) => void;
	onCancel: () => void;
}

function FolderSelectionDialog({ open, onSelect, onCancel }: FolderSelectionDialogProps) {
	const theme = useTheme();
	const dispatch = useDispatch();
	const [selectedFolder, setSelectedFolder] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(false);

	const { folders } = useSelector((state: RootState) => state.folder);
	const { user } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		if (open && user?._id) {
			setLoading(true);
			dispatch(getFoldersByUserId(user._id) as any).finally(() => {
				setLoading(false);
			});
		}
	}, [open, user, dispatch]);

	const handleSelect = () => {
		if (selectedFolder) {
			onSelect(selectedFolder);
		}
	};

	// Filter folders based on search term
	const filteredFolders = folders.filter(
		(folder: any) =>
			folder.folderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			folder.materia?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth disableRestoreFocus>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Folder2 size={24} color={theme.palette.primary.main} />
						<Typography
							variant="h5"
							color="primary"
							sx={{
								color: theme.palette.primary.main,
								fontWeight: 600,
							}}
						>
							Seleccionar Carpeta
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Seleccione una carpeta para autocompletar los datos del documento
					</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent dividers sx={{ px: 3, py: 2 }}>
				<TextField
					fullWidth
					placeholder="Buscar carpeta..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					sx={{ mb: 2 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchNormal1 size={18} />
							</InputAdornment>
						),
					}}
				/>

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 350 }}>
						<CircularProgress />
					</Box>
				) : (
					<List sx={{ maxHeight: 350, minHeight: 350, overflow: "auto" }}>
						{filteredFolders.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 8, minHeight: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
								<Typography color="textSecondary">{searchTerm ? "No se encontraron carpetas" : "No hay carpetas disponibles"}</Typography>
							</Box>
						) : (
							filteredFolders.map((folder: any) => (
								<ListItem key={folder._id} disablePadding>
									<ListItemButton onClick={() => setSelectedFolder(folder)} selected={selectedFolder?._id === folder._id}>
										<Radio edge="start" checked={selectedFolder?._id === folder._id} tabIndex={-1} disableRipple />
										<ListItemAvatar>
											<Avatar>
												<Folder2 size={20} />
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={folder.folderName}
											secondary={
												<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
													{folder.materia && <Chip label={folder.materia} size="small" color="primary" />}
													{folder.judFolder?.numberJudFolder && (
														<Typography variant="caption" color="textSecondary">
															Expte: {folder.judFolder.numberJudFolder}
														</Typography>
													)}
												</Box>
											}
										/>
									</ListItemButton>
								</ListItem>
							))
						)}
					</List>
				)}
			</DialogContent>
			<DialogActions sx={{ p: 2 }}>
				<Button onClick={onCancel} color="secondary">
					Cancelar
				</Button>
				<Button onClick={handleSelect} variant="contained" disabled={!selectedFolder}>
					Seleccionar
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default FolderSelectionDialog;
