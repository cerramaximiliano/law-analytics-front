// material-ui
import { Grid, Stack, TableCell, TableRow, Typography, CircularProgress, Box, Paper, Chip } from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

// project-imports
import Transitions from "components/@extended/Transitions";

// assets
import { Call, Location, Buildings2, Calendar } from "iconsax-react";
import { dispatch, useSelector } from "store";
import React, { useEffect, useState, useCallback } from "react";
import { getFoldersByIds, GetFoldersByIdsResponse } from "store/reducers/folder";

import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import dayjs from "utils/dayjs-config";

interface ContactViewProps {
	data: Contact;
}

const CustomerViewRobust: React.FC<ContactViewProps> = ({ data }) => {
	const [folders, setFolders] = useState<FolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isArchived = data.status === "archived";
	const notAvailableMsg = "No disponible";
	const isMountedRef = React.useRef(true);

	// Monitor the Redux folders loader state
	const foldersIsLoading = useSelector((state) => state.folder.isLoader);
	const allFoldersFromStore = useSelector((state) => state.folder.folders);

	// Function to safely call getFoldersByIds with timeout and cleanup
	const safeGetFoldersByIds = useCallback(async (folderIds: string[]): Promise<GetFoldersByIdsResponse> => {
		let timeoutId: NodeJS.Timeout | null = null;

		try {
			// Create a promise that will reject after timeout
			const timeoutPromise = new Promise((_, reject) => {
				timeoutId = setTimeout(() => {
					reject(new Error("Timeout: getFoldersByIds took too long"));
				}, 20000); // 20 seconds timeout
			});

			// Race between the actual call and timeout
			const result = (await Promise.race([dispatch(getFoldersByIds(folderIds)), timeoutPromise])) as GetFoldersByIdsResponse;

			// Clear timeout if successful
			if (timeoutId) clearTimeout(timeoutId);

			return result;
		} catch (error) {
			// Clear timeout on error
			if (timeoutId) clearTimeout(timeoutId);

			// Force reset the loader state in Redux

			dispatch({ type: "folders/SET_FOLDER_ERROR", payload: "Error al cargar carpetas" });

			throw error;
		}
	}, []);

	useEffect(() => {
		isMountedRef.current = true;

		// Reset states when data changes
		setLoading(true);
		setError(null);
		setFolders([]);

		const loadFoldersWithCleanup = async () => {
			// Check if folderIds exists and is a valid array with items
			if (!data.folderIds || !Array.isArray(data.folderIds) || data.folderIds.length === 0) {
				if (isMountedRef.current) {
					setLoading(false);
				}
				return;
			}

			try {
				// Try to get folders with our safe wrapper
				const response = await safeGetFoldersByIds(data.folderIds);

				if (!isMountedRef.current) {
					return;
				}

				if (response?.success && response.folders) {
					setFolders(response.folders);
					setError(null);
				} else {
					// Fallback: Try to find folders in the store

					if (allFoldersFromStore && allFoldersFromStore.length > 0) {
						const matchingFolders = allFoldersFromStore.filter((f: any) => data.folderIds && data.folderIds.includes(f._id));

						if (matchingFolders.length > 0) {
							setFolders(matchingFolders);
							setError(null);
						} else {
							setError("No se encontraron las carpetas asociadas");
						}
					} else {
						setError(response?.error || "Error al cargar las carpetas");
					}
				}
			} catch (error) {
				if (!isMountedRef.current) return;

				// Final fallback: Check store
				if (allFoldersFromStore && allFoldersFromStore.length > 0) {
					const matchingFolders = allFoldersFromStore.filter((f: any) => data.folderIds && data.folderIds.includes(f._id));

					if (matchingFolders.length > 0) {
						setFolders(matchingFolders);
						setError(null);
						return;
					}
				}

				setError(error instanceof Error ? error.message : "Error desconocido al cargar carpetas");
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}

				// Ensure the Redux loader is reset after a delay
				setTimeout(() => {
					if (foldersIsLoading) {
						dispatch({ type: "folders/SET_FOLDER_ERROR", payload: "" });
					}
				}, 1000);
			}
		};

		loadFoldersWithCleanup();

		// Cleanup
		return () => {
			isMountedRef.current = false;

			// If loader is still true when unmounting, force reset
			if (foldersIsLoading) {
				dispatch({ type: "folders/SET_FOLDER_ERROR", payload: "" });
			}
		};
	}, [data._id, data.folderIds, safeGetFoldersByIds, allFoldersFromStore, foldersIsLoading]);

	// Info cards - Horizontal layout similar to TaskView
	const InfoCard = ({ icon, label, value, color = "textSecondary" }: any) => (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
			<Box sx={{ color: "primary.main" }}>{icon}</Box>
			<Box>
				<Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
					{label}
				</Typography>
				<Typography variant="body2" color={color} sx={{ fontWeight: 500 }}>
					{value || notAvailableMsg}
				</Typography>
			</Box>
		</Box>
	);

	const getFormattedPhone = (phone: string | undefined) => {
		if (!phone) return null;
		return (
			<PatternFormat
				displayType="text"
				format="(+##) ###-###-####"
				mask="_"
				defaultValue={phone}
				renderText={(value) => <Typography variant="body2">{value}</Typography>}
			/>
		);
	};

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` } }}>
			<TableCell colSpan={8} sx={{ p: 2.5 }}>
				<Transitions type="slide" direction="down" in={true}>
					<Box>
						{/* Header with title and status */}
						<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
							<Typography variant="h5">{data.name || notAvailableMsg}</Typography>
							{isArchived && <Chip size="small" label="Archivado" color="default" />}
						</Stack>

						{/* Info cards - Horizontal layout */}
						<Grid container spacing={3} sx={{ mb: 3 }}>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Call size="20" />} label="Teléfono" value={getFormattedPhone(data.phone)} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Location size="20" />} label="Dirección" value={data.address} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Buildings2 size="20" />} label="Rol" value={data.role} />
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<InfoCard icon={<Calendar size="20" />} label="Fecha de Registro" value={dayjs().format("DD/MM/YYYY")} />
							</Grid>
						</Grid>

						{/* Main content - 2 columns */}
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, minHeight: "fit-content", overflow: "visible" }}>
									<Stack spacing={2}>
										<Typography variant="subtitle1" color="primary" fontWeight={600}>
											Información Personal
										</Typography>

										<Stack spacing={1.5}>
											<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: { sm: 120 }, flexShrink: 0 }}>
													Nombre Completo:
												</Typography>
												<Typography variant="body2" sx={{ wordBreak: "break-word" }}>
													{data.name || notAvailableMsg}
												</Typography>
											</Stack>

											<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: { sm: 120 }, flexShrink: 0 }}>
													Email:
												</Typography>
												<Typography variant="body2" sx={{ wordBreak: "break-word" }}>
													{data.email || notAvailableMsg}
												</Typography>
											</Stack>

											<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
												<Typography variant="body2" color="textSecondary" sx={{ minWidth: { sm: 120 }, flexShrink: 0 }}>
													Notas:
												</Typography>
												<Typography variant="body2" sx={{ wordBreak: "break-word" }}>
													Sin notas
												</Typography>
											</Stack>
										</Stack>
									</Stack>
								</Paper>
							</Grid>

							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, minHeight: "fit-content", overflow: "visible" }}>
									<Stack spacing={2}>
										<Typography variant="subtitle1" color="primary" fontWeight={600}>
											Causas Asociadas
										</Typography>

										{loading ? (
											<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
												<CircularProgress size={24} />
											</Box>
										) : error ? (
											<Typography variant="body2" color="error">
												{error}
											</Typography>
										) : folders.length > 0 ? (
											<Stack spacing={1}>
												{folders.map((folder) => (
													<Box key={folder._id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
														<Typography variant="body2">• {folder.folderName}</Typography>
														<Chip size="small" label={folder.status} color="primary" variant="outlined" />
													</Box>
												))}
											</Stack>
										) : (
											<Typography variant="body2" color="textSecondary">
												Sin causas asociadas
											</Typography>
										)}
									</Stack>
								</Paper>
							</Grid>
						</Grid>
					</Box>
				</Transitions>
			</TableCell>
		</TableRow>
	);
};

export default CustomerViewRobust;
