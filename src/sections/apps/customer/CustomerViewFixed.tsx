// material-ui
import { Grid, Stack, TableCell, TableRow, Typography, CircularProgress, Box, Paper, Chip } from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";
import { useNavigate } from "react-router-dom";

// project-imports
import Transitions from "components/@extended/Transitions";

// assets
import { Call, Location, Buildings2, Calendar } from "iconsax-react";
import { dispatch, useSelector } from "store";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getFoldersByIds } from "store/reducers/folder";
import axios from "axios";
import { useRequestQueueRefresh } from "hooks/useRequestQueueRefresh";

import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import dayjs from "utils/dayjs-config";

interface ContactViewProps {
	data: Contact;
}

const CustomerViewFixed: React.FC<ContactViewProps> = ({ data }) => {
	const navigate = useNavigate();
	const [folders, setFolders] = useState<FolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isArchived = data.status === "archived";
	const notAvailableMsg = "No disponible";

	// Access Redux store for fallback
	const allFoldersFromStore = useSelector((state) => state.folder.folders);

	// Use refs to track mounting and loading states
	const isMountedRef = useRef(true);
	const isLoadingRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Función para cargar folders - extraída como callback
	const loadFoldersAsync = useCallback(async () => {
		// Prevent concurrent loads
		if (isLoadingRef.current) {
			return;
		}

		isLoadingRef.current = true;

		try {
			// Comprehensive validation
			let shouldLoadFolders = false;

			if (data.folderIds === null) {
				// folderIds is null
			} else if (data.folderIds === undefined) {
				// folderIds is undefined
			} else if (!Array.isArray(data.folderIds)) {
				// folderIds is not an array
			} else if (data.folderIds.length === 0) {
				// folderIds is empty array
			} else {
				shouldLoadFolders = true;
			}

			if (!shouldLoadFolders) {
				if (isMountedRef.current) {
					setLoading(false);
					setFolders([]);
				}
				return;
			}

			// Set timeout for loading
			timeoutRef.current = setTimeout(() => {
				if (isMountedRef.current && isLoadingRef.current) {
					setError("Tiempo de espera agotado");
					setLoading(false);
					isLoadingRef.current = false;
				}
			}, 15000); // 15 seconds timeout

			// Log the actual dispatch call
			let response;
			try {
				// Create a promise that will resolve with the dispatch result
				const dispatchPromise = dispatch(getFoldersByIds(data.folderIds as string[]));

				// Add additional logging to see what's happening

				// Wait for the response with a race condition against a timeout
				response = (await Promise.race([
					dispatchPromise,
					new Promise((_, reject) => setTimeout(() => reject(new Error("Dispatch timeout after 10s")), 10000)),
				])) as any;
			} catch (dispatchError) {
				// If it's a timeout, log it specifically
				if (dispatchError instanceof Error && dispatchError.message.includes("timeout")) {
					// Try fallback: check if folders exist in Redux store already
					try {
						if (allFoldersFromStore && allFoldersFromStore.length > 0 && data.folderIds) {
							const matchingFolders = allFoldersFromStore.filter((f: any) => data.folderIds && data.folderIds.includes(f._id));

							if (matchingFolders.length > 0) {
								// Clear timeout before returning
								if (timeoutRef.current) {
									clearTimeout(timeoutRef.current);
									timeoutRef.current = null;
								}
								setFolders(matchingFolders);
								setError(null);
								setLoading(false);
								isLoadingRef.current = false;
								return;
							}
						}
					} catch (fallbackError) {}

					// Second fallback: Direct API call

					try {
						const directResponse = await axios.post(
							`${process.env.REACT_APP_BASE_URL}/api/folders/batch`,
							{ folderIds: data.folderIds },
							{
								timeout: 5000,
								withCredentials: true,
							},
						);

						if (directResponse.data?.folders) {
							// Clear timeout before returning
							if (timeoutRef.current) {
								clearTimeout(timeoutRef.current);
								timeoutRef.current = null;
							}
							setFolders(directResponse.data.folders);
							setError(null);
							setLoading(false);
							isLoadingRef.current = false;
							return;
						}
					} catch (directApiError) {}
				}

				throw dispatchError;
			}

			// Clear timeout on response
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			if (!isMountedRef.current) {
				return;
			}

			if (response?.success && Array.isArray(response.folders)) {
				setFolders(response.folders);
				setError(null);
			} else if (response && !response.success) {
				setError(response.error || "Error al cargar las causas");
				setFolders([]);
			} else {
				setError("Respuesta inesperada del servidor");
				setFolders([]);
			}
		} catch (err) {
			// Clear timeout on error
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			if (isMountedRef.current) {
				const errorMsg = err instanceof Error ? err.message : "Error desconocido";
				setError(`Error al cargar causas: ${errorMsg}`);
				setFolders([]);
			}
		} finally {
			if (isMountedRef.current) {
				setLoading(false);
			}
			isLoadingRef.current = false;
		}
	}, [data.folderIds, allFoldersFromStore]);

	// useEffect para cargar folders al montar o cuando cambien las dependencias
	useEffect(() => {
		// Always set mounted on effect run
		isMountedRef.current = true;
		isLoadingRef.current = false;

		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		// Reset states
		setLoading(true);
		setError(null);
		setFolders([]);

		// Execute the async function
		loadFoldersAsync().catch((err) => {
			if (isMountedRef.current) {
				setLoading(false);
				setError("Error inesperado");
			}
		});

		// Cleanup
		return () => {
			isMountedRef.current = false;
			isLoadingRef.current = false;

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [data._id, data.folderIds, loadFoldersAsync]); // Include folderIds in deps to handle updates

	// Refrescar folders cuando se procesen las peticiones encoladas
	useRequestQueueRefresh(() => {
		// Reset states before reloading
		setLoading(true);
		setError(null);
		setFolders([]);

		loadFoldersAsync().catch((err) => {
			if (isMountedRef.current) {
				setLoading(false);
				setError("Error inesperado al refrescar");
			}
		});
	}, [loadFoldersAsync]);

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

						{/* Debug info in development */}
						{process.env.NODE_ENV === "development" && (
							<Box sx={{ mb: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
								<Typography variant="caption" component="pre">
									{JSON.stringify(
										{
											folderIds: data.folderIds,
											type: typeof data.folderIds,
											isArray: Array.isArray(data.folderIds),
											length: Array.isArray(data.folderIds) ? data.folderIds.length : "N/A",
										},
										null,
										2,
									)}
								</Typography>
							</Box>
						)}

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
													<Box
														key={folder._id}
														onClick={() => navigate(`/apps/folders/details/${folder._id}`)}
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
															p: 1,
															borderRadius: 1,
															cursor: "pointer",
															transition: "all 0.2s ease",
															"&:hover": {
																bgcolor: "action.hover",
																transform: "translateX(4px)",
															},
														}}
													>
														<Typography variant="body2" sx={{ flex: 1 }}>
															• {folder.folderName}
														</Typography>
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

export default CustomerViewFixed;
