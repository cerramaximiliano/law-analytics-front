import React from "react";
import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import { RootState, useSelector, dispatch } from "store";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, FormLabel, LinearProgress, Stack, TextField, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import ProfileTab from "./ProfileTab";
import { useTeam } from "contexts/TeamContext";

// assets
import { Camera, Profile, People } from "iconsax-react";

// types
import { updatePicture } from "store/reducers/auth";
import { cleanPlanDisplayName } from "utils/planPricingUtils";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| USER PROFILE - TABS ||============================== //

interface Props {
	focusInput: () => void;
}

const ProfileTabs = ({ focusInput }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
	const user = useSelector((state: RootState) => state.auth.user);
	const picture = user?.picture;

	const [avatar, setAvatar] = useState<string | undefined>(picture);

	const userName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
	const userDesignation = user?.designation || "Usuario";

	useEffect(() => {
		if (user?.picture) {
			setAvatar(user.picture);
		}
	}, [user?.picture]);

	const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		const userId = user?._id;
		if (file && userId) {
			setSelectedImage(file);

			const formData = new FormData();
			formData.append("image", file);
			formData.append("userId", userId);

			try {
				const response = await axios.post(`${import.meta.env.VITE_BASE_URL || ""}/cloudinary/upload-avatar`, formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				if (response.data?.url) {
					const newPictureUrl = response.data.url;
					setAvatar(newPictureUrl);
					dispatch(updatePicture(newPictureUrl));
				}
			} catch (error) {}
		}
	};

	useEffect(() => {
		if (selectedImage) {
			setAvatar(URL.createObjectURL(selectedImage));
		}
	}, [selectedImage]);

	const { isTeamMode, isOwner, activeTeam } = useTeam();
	const userStats = useSelector((state: RootState) => state.userStats.data);

	const shouldUseTeamStats = isTeamMode && !isOwner && activeTeam?.ownerStats;
	const teamStats = activeTeam?.ownerStats;

	const causasCount = shouldUseTeamStats ? teamStats?.counts?.folders || 0 : userStats?.counts?.folders || 0;
	const clientesCount = shouldUseTeamStats ? teamStats?.counts?.contacts || 0 : userStats?.counts?.contacts || 0;
	const calculosCount = shouldUseTeamStats ? teamStats?.counts?.calculators || 0 : userStats?.counts?.calculators || 0;

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const storageUsed = shouldUseTeamStats ? teamStats?.storage?.total || 0 : userStats?.storage?.total || 0;
	const storageLimit = shouldUseTeamStats ? teamStats?.storage?.limit || 52428800 : userStats?.storage?.limit || 52428800;

	const storagePercentage = shouldUseTeamStats
		? teamStats?.storage?.usedPercentage || 0
		: userStats?.storage?.usedPercentage !== undefined
		? userStats.storage.usedPercentage
		: storageLimit > 0
		? Math.min((storageUsed / storageLimit) * 100, 100)
		: 0;

	const storageBreakdown = shouldUseTeamStats ? teamStats?.storage : userStats?.storage;

	const storageColor = storagePercentage < 60 ? BRAND_BLUE : storagePercentage < 80 ? STALE_AMBER : theme.palette.error.main;

	const statItem = (label: string, value: number, tone: "primary" | "green" | "amber") => {
		const color = tone === "primary" ? BRAND_BLUE : tone === "green" ? LIVE_GREEN : STALE_AMBER;
		return (
			<Stack
				spacing={0.25}
				alignItems="center"
				sx={{
					flex: 1,
					px: 0.5,
					py: 1,
					borderRadius: 1,
					bgcolor: alpha(color, isDark ? 0.1 : 0.05),
					border: `1px solid ${alpha(color, isDark ? 0.22 : 0.14)}`,
				}}
			>
				<Typography
					sx={{
						fontSize: "1.05rem",
						fontWeight: 700,
						letterSpacing: "-0.015em",
						color,
						fontVariantNumeric: "tabular-nums",
						lineHeight: 1.1,
					}}
				>
					{value}
				</Typography>
				<Typography
					sx={{
						fontSize: "0.58rem",
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "text.secondary",
					}}
				>
					{label}
				</Typography>
			</Stack>
		);
	};

	return (
		<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
			<Stack spacing={2.5}>
				{/* Avatar + identidad */}
				<Stack spacing={1.5} alignItems="center">
					<FormLabel
						htmlFor="change-avtar"
						sx={{
							position: "relative",
							borderRadius: "50%",
							overflow: "hidden",
							"&:hover .MuiBox-root.avatar-overlay": { opacity: 1 },
							cursor: "pointer",
						}}
					>
						{avatar ? (
							<Avatar
								alt={userName}
								src={avatar}
								sx={{
									width: 112,
									height: 112,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								}}
							/>
						) : (
							<Avatar
								alt={userName}
								sx={{
									width: 112,
									height: 112,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
								}}
							>
								<Profile size={48} variant="Bulk" />
							</Avatar>
						)}
						<Box
							className="avatar-overlay"
							sx={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: "100%",
								borderRadius: "50%",
								bgcolor: alpha("#000", 0.55),
								opacity: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "opacity 0.15s ease",
							}}
						>
							<Stack spacing={0.5} alignItems="center">
								<Camera size={22} color="#fff" />
								<Typography sx={{ color: "#fff", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "-0.005em" }}>
									Cambiar
								</Typography>
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
					<Stack spacing={0.25} alignItems="center" sx={{ width: "100%" }}>
						<Typography
							sx={{
								fontSize: "1rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textAlign: "center",
								textWrap: "balance",
							}}
						>
							{userName}
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{userDesignation}</Typography>
					</Stack>
				</Stack>

				{/* Indicador de equipo */}
				{isTeamMode && (
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.75,
							alignSelf: "center",
							px: 1,
							py: 0.375,
							borderRadius: 0.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						}}
					>
						<People size={12} color={BRAND_BLUE} variant="Bulk" />
						<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.04em", lineHeight: 1 }}>
							Recursos · {activeTeam?.name}
						</Typography>
					</Box>
				)}

				{/* Stats */}
				<Stack direction="row" spacing={0.875}>
					{statItem("Carpetas", causasCount, "primary")}
					{statItem("Contactos", clientesCount, "green")}
					{statItem("Cálculos", calculosCount, "amber")}
				</Stack>

				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />

				{/* Tabs nav */}
				<ProfileTab />

				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />

				{/* Storage */}
				<Stack spacing={1.25}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Stack spacing={0.25}>
							<Stack direction="row" alignItems="center" spacing={0.875}>
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Almacenamiento
								</Typography>
								{isTeamMode && (
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.375,
											px: 0.625,
											py: 0.125,
											borderRadius: 0.5,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
										}}
									>
										<People size={10} color={BRAND_BLUE} variant="Linear" />
										<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, color: BRAND_BLUE, lineHeight: 1.4 }}>Equipo</Typography>
									</Box>
								)}
							</Stack>
							{userStats?.planInfo?.planName && (
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
									{cleanPlanDisplayName(userStats.planInfo.planName)}
								</Typography>
							)}
						</Stack>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.5,
								px: 0.875,
								py: 0.25,
								borderRadius: 0.75,
								bgcolor: alpha(storageColor, isDark ? 0.16 : 0.1),
								border: `1px solid ${alpha(storageColor, isDark ? 0.32 : 0.22)}`,
							}}
						>
							<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: storageColor }} />
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 600,
									color: storageColor,
									letterSpacing: "0.01em",
									lineHeight: 1,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{storagePercentage.toFixed(1)}%
							</Typography>
						</Box>
					</Stack>
					<LinearProgress
						variant="determinate"
						value={storagePercentage}
						sx={{
							height: 6,
							borderRadius: 1,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
							"& .MuiLinearProgress-bar": {
								borderRadius: 1,
								bgcolor: storageColor,
							},
						}}
					/>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
							{formatBytes(storageUsed)} usados
						</Typography>
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
							{formatBytes(storageLimit)} totales
						</Typography>
					</Stack>

					{storageBreakdown && (
						<Stack spacing={0.625} sx={{ pt: 0.5 }}>
							<Typography
								sx={{
									fontSize: "0.58rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Desglose
							</Typography>
							{[
								{ label: "Carpetas", value: storageBreakdown.folders || 0 },
								{ label: "Contactos", value: storageBreakdown.contacts || 0 },
								{ label: "Cálculos", value: storageBreakdown.calculators || 0 },
							].map((row) => (
								<Stack key={row.label} direction="row" justifyContent="space-between" alignItems="center">
									<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
										{row.label}
									</Typography>
									<Typography
										sx={{
											fontSize: "0.72rem",
											fontWeight: 600,
											color: "text.primary",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{formatBytes(row.value)}
									</Typography>
								</Stack>
							))}
						</Stack>
					)}
				</Stack>
			</Stack>
		</MainCard>
	);
};

export default ProfileTabs;
