import React from "react";
import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	FormLabel,
	Grid,
	InputLabel,
	//MenuItem,
	//Select,
	//SelectChangeEvent,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

// project-imports
import Avatar from "components/@extended/Avatar";
import MainCard from "components/MainCard";
//import { facebookColor, linkedInColor } from "config";

// assets
import {
	//Apple,
	Camera,
	//Facebook, Google
} from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { dispatch, useSelector } from "store";
import { updatePicture } from "store/reducers/auth";

const avatarImage = require.context("assets/images/users", true);
// ==============================|| ACCOUNT PROFILE - PERSONAL ||============================== //

const TabPersonal = () => {
	const theme = useTheme();
	const user = useSelector((state) => state.auth.user);

	const picture = user?.picture;
	const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
	const [avatar, setAvatar] = useState<string | undefined>(picture || avatarImage(`./default.png`));

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
			} catch (error) {}
		} else {
		}
	};

	useEffect(() => {
		if (selectedImage) {
			setAvatar(URL.createObjectURL(selectedImage));
		}
	}, [selectedImage]);

	return (
		<Grid container spacing={3}>
			<Grid item xs={12} sm={6}>
				<MainCard title="Información Personal">
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={2.5} alignItems="center" sx={{ m: 3 }}>
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
									<Avatar alt="Avatar 1" src={avatar} sx={{ width: 76, height: 76 }} />
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
											<Camera style={{ color: theme.palette.secondary.lighter, fontSize: "1.5rem" }} />
											<Typography sx={{ color: "secondary.lighter" }} variant="caption">
												Upload
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
							</Stack>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="personal-first-name">Nombre</InputLabel>
								<TextField fullWidth defaultValue={user?.firstName} id="personal-first-name" placeholder="Ingrese nombre" autoFocus />
							</Stack>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="personal-first-name">Apellido</InputLabel>
								<TextField fullWidth defaultValue={user?.lastName} id="personal-first-name" placeholder="Ingrese apellido" />
							</Stack>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="personal-location">País</InputLabel>
								<TextField fullWidth defaultValue={user?.country} id="personal-location" placeholder="País" />
							</Stack>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="personal-zipcode">Código Postal</InputLabel>
								<TextField fullWidth defaultValue={user?.zipCode} id="personal-zipcode" placeholder="Ingrese Código Postal" />
							</Stack>
						</Grid>
					</Grid>
				</MainCard>
			</Grid>
			<Grid item xs={12} sm={6}>
				<Grid container spacing={3}>
					{/* 					<Grid item xs={12}>
						<MainCard title="Social Network">
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Button
										size="small"
										startIcon={<Google variant="Bold" style={{ color: theme.palette.error.main }} />}
										sx={{ color: theme.palette.error.main, "&:hover": { bgcolor: "transparent" } }}
									>
										Google
									</Button>
									<Button color="error">Connect</Button>
								</Stack>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Button
										size="small"
										startIcon={<Facebook variant="Bold" style={{ color: facebookColor }} />}
										sx={{ color: facebookColor, "&:hover": { bgcolor: "transparent" } }}
									>
										Facebook
									</Button>
									<Typography variant="subtitle1" sx={{ color: facebookColor }}>
										Anshan Handgun
									</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Button
										size="small"
										startIcon={<Apple variant="Bold" style={{ color: linkedInColor }} />}
										sx={{ color: linkedInColor, "&:hover": { bgcolor: "transparent" } }}
									>
										Apple
									</Button>
									<Button color="error">Connect</Button>
								</Stack>
							</Stack>
						</MainCard>
					</Grid> */}
					<Grid item xs={12}>
						<MainCard title="Información de Contacto">
							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-phone">Teléfono</InputLabel>
										<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
											<PatternFormat
												format="+1 (###) ###-####"
												mask="_"
												fullWidth
												customInput={TextField}
												placeholder="Ingrese teléfono"
												defaultValue={user?.contact}
												onBlur={() => {}}
												onChange={() => {}}
											/>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={12} md={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-email">Email</InputLabel>
										<TextField
											type="email"
											fullWidth
											defaultValue={user?.email}
											id="personal-email"
											placeholder="Ingrese correo electrónico"
										/>
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-email">URL</InputLabel>
										<TextField fullWidth defaultValue={user?.url} id="personal-url" placeholder="Ingrese su URL" />
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-address">Domicilio</InputLabel>
										<TextField fullWidth defaultValue={user?.address} id="personal-address" placeholder="Ingrese un domicilio" />
									</Stack>
								</Grid>
							</Grid>
						</MainCard>
					</Grid>
				</Grid>
			</Grid>
			<Grid item xs={12}>
				<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
					<Button variant="outlined" color="secondary">
						Cancelar
					</Button>
					<Button variant="contained">Actualizar Perfil</Button>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default TabPersonal;
