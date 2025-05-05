import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import { RootState, useSelector, dispatch } from "store";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Divider, FormLabel, Grid, TextField, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import ProfileTab from "./ProfileTab";

// assets
import { Camera, Profile } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { updatePicture } from "store/reducers/auth";

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
				const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/cloudinary/upload-avatar`, formData, {
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
			} catch (error) {
				console.error("Error al subir la imagen:", error);
			}
		} else {
			console.warn("No se encontró un userId o archivo para enviar");
		}
	};

	// Actualizar el avatar local cuando se seleccione una imagen
	useEffect(() => {
		if (selectedImage) {
			setAvatar(URL.createObjectURL(selectedImage));
		}
	}, [selectedImage]);

	const userStats = useSelector((state: RootState) => state.userStats.data);

	const causasCount = userStats?.counts?.folders || 0;
	const clientesCount = userStats?.counts?.contacts || 0;
	const calculosCount = userStats?.counts?.calculators || 0;

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
								<Avatar 
									alt={userName} 
									sx={{ width: 124, height: 124, border: "1px dashed" }}
								>
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
					<Stack direction="row" justifyContent="space-around" alignItems="center">
						<Stack spacing={0.5} alignItems="center">
							<Typography variant="h5">{causasCount}</Typography>
							<Typography color="secondary">Causas</Typography>
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
			</Grid>
		</MainCard>
	);
};

export default ProfileTabs;