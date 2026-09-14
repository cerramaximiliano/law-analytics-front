import React, { useState, useEffect } from "react";
import {
	Box,
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
	Radio,
	RadioGroup,
	FormControlLabel,
	CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { DocumentCloud, SearchNormal1, Edit2, DocumentText1, Folder2 } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { useSelector, dispatch } from "store";
import { getFoldersByUserId, getFoldersByGroupId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { Folder } from "types/folders";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";

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
	const isDark = theme.palette.mode === "dark";
	const [selectedMethod, setSelectedMethod] = useState<"manual" | "causa">("manual");
	const [openModal, setOpenModal] = useState(false);
	const [folders, setFolders] = useState<Folder[]>([]);
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const userId = useSelector((state) => state.auth.user?._id);
	const { isTeamMode, activeTeam } = useTeam();

	useEffect(() => {
		if (openModal) {
			fetchFolders();
		}
	}, [openModal, userId, isTeamMode, activeTeam?._id]);

	// Manejar cambio de tab
	const handleMethodClick = (method: "manual" | "causa") => {
		setSelectedMethod(method);

		if (method === "causa" && selectedFolder) {
			onMethodChange(method, selectedFolder, {
				folderId: selectedFolder._id,
				folderName: selectedFolder.folderName,
			});
		} else {
			onMethodChange(method, method === "causa" ? selectedFolder : null);
		}

		if (method === "manual" && selectedFolder) {
			setSelectedFolder(null);
		} else if (method === "causa" && !selectedFolder) {
			setOpenModal(true);
		}
	};

	const fetchFolders = async () => {
		setIsLoading(true);

		try {
			let response: GetFoldersResponse;

			if (isTeamMode && activeTeam?._id) {
				response = (await dispatch(getFoldersByGroupId(activeTeam._id))) as unknown as GetFoldersResponse;
			} else if (userId) {
				response = (await dispatch(getFoldersByUserId(userId))) as unknown as GetFoldersResponse;
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
				return;
			}

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

	const handleSelectFolder = (folder: Folder) => {
		setSelectedFolder(folder);
		setSelectedMethod("causa");

		onMethodChange("causa", folder, {
			folderId: folder._id,
			folderName: folder.folderName,
		});

		setOpenModal(false);
	};

	const handleChangeFolder = () => {
		setOpenModal(true);
	};

	// Estilo brand-aware compartido para los Radio
	const radioSx = {
		color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.3),
		"&.Mui-checked": { color: BRAND_BLUE },
	};

	// Botón brand sober reusable.
	const brandButtonSx = {
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const ghostButtonSx = {
		textTransform: "none" as const,
		color: "text.secondary",
		fontWeight: 500,
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06),
			color: BRAND_BLUE,
		},
	};

	return (
		<>
			<Box sx={{ width: "100%", mb: 1.5 }}>
				<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary", mb: 0.75 }}>
					Método de ingreso
				</Typography>

				<Box
					sx={{
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						p: 1.25,
					}}
				>
					<RadioGroup value={selectedMethod} onChange={(e) => handleMethodClick(e.target.value as "manual" | "causa")}>
						<Stack spacing={0.75}>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.75, sm: 1.5 }} alignItems={{ xs: "flex-start", sm: "center" }}>
								<FormControlLabel
									value="manual"
									control={<Radio size="small" sx={radioSx} />}
									label={
										<Stack direction="row" spacing={0.625} alignItems="center">
											<Edit2 size={14} variant="Bulk" color={selectedMethod === "manual" ? BRAND_BLUE : theme.palette.text.secondary} />
											<Typography
												sx={{
													fontSize: "0.82rem",
													fontWeight: selectedMethod === "manual" ? 600 : 500,
													color: selectedMethod === "manual" ? "text.primary" : "text.secondary",
												}}
											>
												Ingreso manual
											</Typography>
										</Stack>
									}
									sx={{ m: 0 }}
								/>

								<FormControlLabel
									value="causa"
									control={<Radio size="small" sx={radioSx} />}
									label={
										<Stack direction="row" spacing={0.625} alignItems="center">
											<DocumentCloud size={14} variant="Bulk" color={selectedMethod === "causa" ? BRAND_BLUE : theme.palette.text.secondary} />
											<Typography
												sx={{
													fontSize: "0.82rem",
													fontWeight: selectedMethod === "causa" ? 600 : 500,
													color: selectedMethod === "causa" ? "text.primary" : "text.secondary",
												}}
											>
												Seleccionar carpeta
											</Typography>
										</Stack>
									}
									sx={{ m: 0 }}
								/>

								{!selectedFolder && selectedMethod === "causa" && (
									<Button size="small" onClick={handleChangeFolder} sx={{ ml: { sm: "auto" }, ...brandButtonSx, px: 1.5, py: 0.5 }}>
										Elegir carpeta
									</Button>
								)}
							</Stack>

							{/* Info de carpeta seleccionada */}
							{selectedFolder && selectedMethod === "causa" && (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.25,
										p: 1.25,
										borderRadius: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									}}
								>
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: 1,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<DocumentText1 size={14} variant="Bulk" />
									</Box>
									<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												color: "text.primary",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{selectedFolder.folderName}
										</Typography>
										<Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
											<Box
												sx={{
													display: "inline-flex",
													alignItems: "center",
													px: 0.625,
													py: 0.125,
													borderRadius: 0.625,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
													flexShrink: 0,
												}}
											>
												<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.04em", color: BRAND_BLUE, lineHeight: 1 }}>
													{selectedFolder.materia}
												</Typography>
											</Box>
											{selectedFolder.description && (
												<Tooltip title={selectedFolder.description} arrow placement="top">
													<Typography
														sx={{
															fontSize: "0.72rem",
															color: "text.secondary",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
															maxWidth: 180,
														}}
													>
														{selectedFolder.description}
													</Typography>
												</Tooltip>
											)}
										</Stack>
									</Stack>
									<Button size="small" onClick={handleChangeFolder} sx={{ flexShrink: 0, ...ghostButtonSx, fontSize: "0.74rem", px: 1 }}>
										Cambiar
									</Button>
								</Box>
							)}
						</Stack>
					</RadioGroup>
				</Box>
			</Box>

			{/* Modal de selección de carpeta — brand-aware */}
			<ResponsiveDialog
				maxWidth="sm"
				open={openModal}
				onClose={() => setOpenModal(false)}
				PaperProps={{ sx: { p: 0 } }}
			>
				<DialogTitle
					sx={{
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						p: { xs: 1.75, sm: 2 },
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1.25,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<Folder2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "1.05rem",
									fontWeight: 600,
									letterSpacing: "-0.015em",
									lineHeight: 1.2,
									color: "text.primary",
								}}
							>
								Seleccionar carpeta
							</Typography>
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.4 }}>
								Elegí la carpeta para completar automáticamente los datos del cálculo.
							</Typography>
						</Stack>
					</Stack>
				</DialogTitle>

				<DialogContent sx={{ p: { xs: 2, sm: 2.5 }, width: "100%", overflow: "hidden" }}>
					<FormControl sx={{ width: "100%", mb: 2 }}>
						<TextField
							autoFocus
							value={searchTerm}
							onChange={handleSearchChange}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={16} color={BRAND_BLUE} />
									</InputAdornment>
								),
							}}
							placeholder="Buscar por carátula, materia o descripción…"
							fullWidth
							size="small"
							sx={{
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
									transition: "border-color 0.15s ease",
								},
								"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
								},
								"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, 0.55),
									borderWidth: 1,
								},
							}}
						/>
					</FormControl>

					<SimpleBar
						sx={{
							height: "420px",
							width: "100%",
							overflowX: "hidden",
							overflowY: "auto",
						}}
					>
						<Stack spacing={1} sx={{ p: 0.25 }}>
							{!isLoading && filteredFolders.length > 0 ? (
								filteredFolders.map((folder) => (
									<Box
										key={folder._id}
										onClick={() => handleSelectFolder(folder)}
										sx={{
											width: "100%",
											borderRadius: 1.5,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
											bgcolor: theme.palette.background.paper,
											p: 1.5,
											cursor: "pointer",
											transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease",
											"&:hover": {
												borderColor: alpha(BRAND_BLUE, isDark ? 0.45 : 0.32),
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
											},
											"&:active": { transform: "scale(0.997)" },
										}}
									>
										<Stack spacing={0.75}>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Box
													sx={{
														width: 24,
														height: 24,
														borderRadius: 0.875,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
														color: BRAND_BLUE,
														flexShrink: 0,
													}}
												>
													<DocumentText1 size={14} variant="Bulk" />
												</Box>
												<Tooltip title={folder.folderName} arrow placement="top">
													<Typography
														sx={{
															flex: 1,
															fontSize: "0.92rem",
															fontWeight: 600,
															letterSpacing: "-0.01em",
															color: "text.primary",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{folder.folderName}
													</Typography>
												</Tooltip>
											</Stack>
											<Stack direction="row" spacing={0.875} alignItems="center" sx={{ pl: 4 }}>
												<Box
													sx={{
														display: "inline-flex",
														alignItems: "center",
														px: 0.75,
														py: 0.2,
														borderRadius: 0.625,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
													}}
												>
													<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.04em", color: BRAND_BLUE, lineHeight: 1 }}>
														{folder.materia}
													</Typography>
												</Box>
												{folder.description && (
													<Tooltip title={folder.description} arrow placement="top">
														<Typography
															sx={{
																fontSize: "0.74rem",
																color: "text.secondary",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
																maxWidth: 240,
																flex: 1,
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
										position: "relative",
										overflow: "hidden",
										textAlign: "center",
										minHeight: 380,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderRadius: 1.5,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
										border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
									}}
								>
									<Box
										aria-hidden
										sx={{
											position: "absolute",
											inset: 0,
											background: `radial-gradient(circle at center, ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)} 0%, transparent 60%)`,
											pointerEvents: "none",
										}}
									/>
									<Stack spacing={1.5} alignItems="center" sx={{ position: "relative", zIndex: 1, px: 3 }}>
										{isLoading ? (
											<>
												<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
												<Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Cargando carpetas…</Typography>
											</>
										) : (
											<>
												<Box
													sx={{
														width: 64,
														height: 64,
														borderRadius: "50%",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
														color: BRAND_BLUE,
													}}
												>
													<Folder2 size={32} variant="Bulk" />
												</Box>
												<Stack spacing={0.5} alignItems="center">
													<Typography
														sx={{
															fontSize: "0.95rem",
															fontWeight: 600,
															letterSpacing: "-0.01em",
															color: "text.primary",
														}}
													>
														{searchTerm ? "No encontramos carpetas" : "Todavía no hay carpetas"}
													</Typography>
													<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", maxWidth: 280, lineHeight: 1.5, textWrap: "pretty" }}>
														{searchTerm
															? "Probá con otra carátula, materia o descripción."
															: "Cuando tengas carpetas creadas, las vas a poder seleccionar acá."}
													</Typography>
												</Stack>
											</>
										)}
									</Stack>
								</Box>
							)}
						</Stack>
					</SimpleBar>
				</DialogContent>

				<DialogActions
					sx={{
						p: { xs: 1.5, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					}}
				>
					<Button onClick={() => setOpenModal(false)} sx={ghostButtonSx}>
						Cancelar
					</Button>
				</DialogActions>
			</ResponsiveDialog>
		</>
	);
};

export default LinkCauseSelector;
