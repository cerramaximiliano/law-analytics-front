import React from "react";
import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import { RootState, useSelector, dispatch } from "store";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Divider, FormLabel, Grid, TextField, Stack, Typography, LinearProgress, Chip } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import ProfileTab from "./ProfileTab";
import { useTeam } from "contexts/TeamContext";

// assets
import { Camera, Profile, People } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { updatePicture } from "store/reducers/auth";
import { cleanPlanDisplayName } from "utils/planPricingUtils";

// ==============================|| USER PROFILE - TABS ||============================== //

interface Props {
	focusInput: () => void;
}

const ProfileTabs = ({ focusInput }: Props) => {
	const theme = useTheme();
	const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
	const user = useSelector((state: RootState) => state.auth.user);
	const picture = user?.picture;

	// Use the Profile component as default instead of the default.png image
	const [avatar, setAvatar] = useState<string | undefined>(picture);

	// Usar datos del usuario en lugar de hardcodearlos
	const userName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
	const userDesignation = user?.designation || "Usuario";

	// Actualizar avatar cuando cambie la imagen del usuario en el estado global
	useEffect(() => {
		if (user?.picture) {
			setAvatar(user.picture);
		}
	}, [user?.picture]);

	const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		const userId = user?._id; // Obtén el userId desde el estado global o el contexto
		if (file && userId) {
			setSelectedImage(file); // Actualiza el estado para vista previa

			// Crear un FormData para enviar el archivo y el userId al backend
			const formData = new FormData();
			formData.append("image", file);
			formData.append("userId", userId); // Añade el userId al FormData

			try {
				// Enviar la imagen al backend
				const response = await axios.post(`${import.meta.env.VITE_BASE_URL || ""}/cloudinary/upload-avatar`, formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});

				// Actualiza la URL de avatar con la URL de Cloudinary
				if (response.data?.url) {
					const newPictureUrl = response.data.url;
					setAvatar(newPictureUrl); // Actualiza la vista previa del avatar
					dispatch(updatePicture(newPictureUrl));
				}
			} catch (error) {}
		} else {
		}
	};

	// Actualizar el avatar local cuando se seleccione una imagen
	useEffect(() => {
		if (selectedImage) {
			setAvatar(URL.createObjectURL(selectedImage));
		}
	}, [selectedImage]);

	// Team context para determinar qué stats mostrar
	const { isTeamMode, isOwner, activeTeam } = useTeam();

	const userStats = useSelector((state: RootState) => state.userStats.data);

	// Determinar qué stats usar:
	// - Si NO está en modo equipo: usar userStats (cuenta personal)
	// - Si está en modo equipo Y es owner: usar userStats (ya incluye todo el equipo)
	// - Si está en modo equipo Y es miembro: usar ownerStats del equipo
	const shouldUseTeamStats = isTeamMode && !isOwner && activeTeam?.ownerStats;
	const teamStats = activeTeam?.ownerStats;

	const causasCount = shouldUseTeamStats
		? (teamStats?.counts?.folders || 0)
		: (userStats?.counts?.folders || 0);
	const clientesCount = shouldUseTeamStats
		? (teamStats?.counts?.contacts || 0)
		: (userStats?.counts?.contacts || 0);
	const calculosCount = shouldUseTeamStats
		? (teamStats?.counts?.calculators || 0)
		: (userStats?.counts?.calculators || 0);

	// Funciones helper para formatear bytes
	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// Usar los valores según el contexto
	const storageUsed = shouldUseTeamStats
		? (teamStats?.storage?.total || 0)
		: (userStats?.storage?.total || 0);
	const storageLimit = shouldUseTeamStats
		? (teamStats?.storage?.limit || 52428800)
		: (userStats?.storage?.limit || 52428800); // Default 50MB si no viene de la API

	// Calcular porcentaje
	const storagePercentage = shouldUseTeamStats
		? (teamStats?.storage?.usedPercentage || 0)
		: (userStats?.storage?.usedPercentage !== undefined
			? userStats.storage.usedPercentage
			: storageLimit > 0
			? Math.min((storageUsed / storageLimit) * 100, 100)
			: 0);

	// Storage breakdown según contexto
	const storageBreakdown = shouldUseTeamStats
		? teamStats?.storage
		: userStats?.storage;

	// Determinar color de la barra según el uso
	const getStorageColor = (percentage: number) => {
		if (percentage < 60) return "primary";
		if (percentage < 80) return "warning";
		return "error";
	};

	return (
		<MainCard>
			<Grid container spacing={6}>
				<Grid item xs={12}>
					<Stack spacing={2.5} alignItems="center">
						<FormLabel
							htmlFor="change-avtar"
							sx={{
								position: "relative",
								borderRadius: "50%",
								overflow: "hidden",
								"&:hover .MuiBox-root": { opacity: 1 },
								cursor: "pointer",
							}}
						>
							{avatar ? (
								<Avatar alt={userName} src={avatar} sx={{ width: 124, height: 124, border: "1px dashed" }} />
							) : (
								<Avatar alt={userName} sx={{ width: 124, height: 124, border: "1px dashed" }}>
									<Profile size="64" color={theme.palette.primary.main} />
								</Avatar>
							)}
							<Box
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
									backgroundColor: theme.palette.mode === ThemeMode.DARK ? "rgba(255, 255, 255, .75)" : "rgba(0,0,0,.65)",
									width: "100%",
									height: "100%",
									opacity: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Stack spacing={0.5} alignItems="center">
									<Camera style={{ color: theme.palette.secondary.lighter, fontSize: "2rem" }} />
									<Typography sx={{ color: "secondary.lighter" }}>Subir</Typography>
								</Stack>
							</Box>
						</FormLabel>
						<TextField
							type="file"
							id="change-avtar"
							placeholder="Outlined"
							variant="outlined"
							sx={{ display: "none" }}
							onChange={handleImageUpload}
						/>
						<Stack spacing={0.5} alignItems="center">
							<Typography variant="h5">{userName}</Typography>
							<Typography color="secondary">{userDesignation}</Typography>
						</Stack>
					</Stack>
				</Grid>
				<Grid item sm={3} sx={{ display: { sm: "block", md: "none" } }} />
				<Grid item xs={12} sm={6} md={12}>
					{/* Indicador de recursos del equipo */}
					{isTeamMode && (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
							<People size={16} color={theme.palette.primary.main} />
							<Typography variant="caption" color="primary.main" fontWeight={500}>
								Recursos del equipo {activeTeam?.name}
							</Typography>
						</Stack>
					)}
					<Stack direction="row" justifyContent="space-around" alignItems="center">
						<Stack spacing={0.5} alignItems="center">
							<Typography variant="h5">{causasCount}</Typography>
							<Typography color="secondary">Carpetas</Typography>
						</Stack>
						<Divider orientation="vertical" flexItem />
						<Stack spacing={0.5} alignItems="center">
							<Typography variant="h5">{clientesCount}</Typography>
							<Typography color="secondary">Contactos</Typography>
						</Stack>
						<Divider orientation="vertical" flexItem />
						<Stack spacing={0.5} alignItems="center">
							<Typography variant="h5">{calculosCount}</Typography>
							<Typography color="secondary">Cálculos</Typography>
						</Stack>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<ProfileTab />
				</Grid>
				<Grid item xs={12}>
					<Divider />
				</Grid>
				<Grid item xs={12}>
					<Stack spacing={2}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack spacing={0.5}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<Typography variant="h6">Almacenamiento</Typography>
									{isTeamMode && (
										<Chip
											icon={<People size={12} />}
											label="Equipo"
											size="small"
											color="primary"
											variant="outlined"
											sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }}
										/>
									)}
								</Stack>
								{userStats?.planInfo?.planName && (
									<Typography variant="caption" color="text.secondary">
										{cleanPlanDisplayName(userStats.planInfo.planName)}
									</Typography>
								)}
							</Stack>
							<Chip
								label={`${storagePercentage.toFixed(1)}%`}
								color={getStorageColor(storagePercentage) as any}
								size="small"
								variant="outlined"
							/>
						</Stack>
						<LinearProgress
							variant="determinate"
							value={storagePercentage}
							color={getStorageColor(storagePercentage) as any}
							sx={{
								height: 8,
								borderRadius: 1,
								backgroundColor: theme.palette.grey[300],
								"& .MuiLinearProgress-bar": {
									borderRadius: 1,
								},
							}}
						/>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="caption" color="text.secondary">
								{formatBytes(storageUsed)} utilizados
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{formatBytes(storageLimit)} totales
							</Typography>
						</Stack>
						{storageBreakdown && (
							<Stack spacing={1} sx={{ mt: 1 }}>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
									Desglose por tipo:
								</Typography>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={4}>
										<Stack spacing={0.5}>
											<Typography variant="caption" color="text.secondary">
												Carpetas
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 500 }}>
												{formatBytes(storageBreakdown.folders || 0)}
											</Typography>
										</Stack>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Stack spacing={0.5}>
											<Typography variant="caption" color="text.secondary">
												Contactos
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 500 }}>
												{formatBytes(storageBreakdown.contacts || 0)}
											</Typography>
										</Stack>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Stack spacing={0.5}>
											<Typography variant="caption" color="text.secondary">
												Cálculos
											</Typography>
											<Typography variant="caption" sx={{ fontWeight: 500 }}>
												{formatBytes(storageBreakdown.calculators || 0)}
											</Typography>
										</Stack>
									</Grid>
								</Grid>
							</Stack>
						)}
					</Stack>
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default ProfileTabs;
