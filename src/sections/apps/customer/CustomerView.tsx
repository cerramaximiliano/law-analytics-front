// material-ui
import { Grid, Stack, TableCell, TableRow, Typography, CircularProgress, Box, Paper, Chip } from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";
import { useNavigate } from "react-router-dom";

// project-imports
import Transitions from "components/@extended/Transitions";

// assets
import { Call, Location, Buildings2, Calendar } from "iconsax-react";
import { dispatch } from "store";
import React, { useEffect, useState } from "react";
import { getFoldersByIds } from "store/reducers/folder";

import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import dayjs from "utils/dayjs-config";

interface ContactViewProps {
	data: Contact;
}

const CustomerView: React.FC<ContactViewProps> = ({ data }) => {
	const navigate = useNavigate();
	const [folders, setFolders] = useState<FolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isArchived = data.status === "archived";
	const notAvailableMsg = "No disponible";
	const isMountedRef = React.useRef(true);
	const loadingRef = React.useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		// Reset states when component mounts or data changes
		setLoading(true);
		loadingRef.current = true;
		setError(null);
		setFolders([]);

		// Check if folderIds exists and is a valid array with items
		if (data.folderIds && Array.isArray(data.folderIds) && data.folderIds.length > 0) {
			// Create a timeout to ensure we eventually stop loading
			const timeoutId = setTimeout(() => {
				if (isMountedRef.current && loadingRef.current) {
					setError("Tiempo de espera agotado al cargar las causas");
					setLoading(false);
					loadingRef.current = false;
				}
			}, 10000); // 10 second timeout

			// Load folders asynchronously
			loadFolders().finally(() => {
				clearTimeout(timeoutId);
			});
		} else {
			// No folders to load, set loading to false immediately

			setLoading(false);
			loadingRef.current = false;
		}

		// Cleanup function to prevent state updates on unmounted component
		return () => {
			isMountedRef.current = false;
		};
	}, [data._id]); // Changed dependency to data._id to avoid issues with array references

	const loadFolders = async () => {
		try {
			// Don't set loading again as it's already set in useEffect
			if (!isMountedRef.current) {
				return;
			}

			// Extra validation before calling API
			if (!data.folderIds || !Array.isArray(data.folderIds) || data.folderIds.length === 0) {
				if (isMountedRef.current) {
					setFolders([]);
					setLoading(false);
				}
				return;
			}

			const response = await dispatch(getFoldersByIds(data.folderIds));

			// Only update state if component is still mounted
			if (isMountedRef.current) {
				if (response && response.success && response.folders) {
					setFolders(response.folders);
					setError(null);
				} else if (response && !response.success) {
					// Handle API error response

					setFolders([]);
					setError(response.error || "No se pudieron cargar las causas");
				} else {
					// Handle unexpected response format

					setFolders([]);
					setError("Respuesta inesperada del servidor");
				}
			} else {
			}
		} catch (err) {
			// Only update state if component is still mounted
			if (isMountedRef.current) {
				const errorMessage = err instanceof Error ? err.message : "Error al cargar causas";
				setError(errorMessage);
				setFolders([]);
			}
		} finally {
			// Always clear loading state if component is still mounted

			if (isMountedRef.current) {
				setLoading(false);
				loadingRef.current = false;
			}
		}
	};

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
					<Box
						sx={{
							opacity: 1,
							animation: "fadeIn 0.4s ease-in-out",
							"@keyframes fadeIn": {
								from: {
									opacity: 0,
									transform: "translateY(-10px)",
								},
								to: {
									opacity: 1,
									transform: "translateY(0)",
								},
							},
						}}
					>
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

export default CustomerView;
