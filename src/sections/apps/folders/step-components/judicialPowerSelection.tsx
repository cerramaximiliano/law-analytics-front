import { Grid, Stack, Alert, Typography, Box, Chip, ListItemButton, ListItemIcon, ListItemText, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";
import { ArrowRight, Lock } from "iconsax-react";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

interface FormValues {
	judicialPower?: "nacional" | "buenosaires";
}

const JudicialPowerSelection = () => {
	const theme = useTheme();
	const { setFieldValue, values } = useFormikContext<FormValues>();

	const handleSelectJudicialPower = (power: "nacional" | "buenosaires") => {
		// Only allow selecting "nacional" since Buenos Aires is not available yet
		if (power === "nacional") {
			setFieldValue("judicialPower", power);
		}
	};

	return (
		<Grid container spacing={3} justifyContent="center">
			<Grid item xs={12}>
				<Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
					Seleccione el poder judicial
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
					Elija el poder judicial del cual desea importar la causa
				</Typography>
			</Grid>

			{/* Poder Judicial de la Nación */}
			<Grid item xs={12}>
				<ListItemButton
					onClick={() => handleSelectJudicialPower("nacional")}
					sx={{
						border: 1,
						borderColor: values.judicialPower === "nacional" ? theme.palette.primary.main : theme.palette.divider,
						borderRadius: 2,
						p: 2,
						backgroundColor: values.judicialPower === "nacional" ? alpha(theme.palette.primary.main, 0.05) : "transparent",
						"&:hover": {
							backgroundColor: alpha(theme.palette.primary.main, 0.08),
							borderColor: theme.palette.primary.main,
						},
					}}
				>
					<ListItemIcon sx={{ minWidth: 80 }}>
						<Box
							sx={{
								backgroundColor: "#222E43",
								borderRadius: 1,
								p: 1,
								width: 60,
								height: 60,
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<img
								src="https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png"
								alt="Poder Judicial de la Nación"
								style={{
									maxHeight: "100%",
									maxWidth: "100%",
									objectFit: "contain",
								}}
							/>
						</Box>
					</ListItemIcon>
					<ListItemText
						primary="Poder Judicial de la Nación"
						secondary="Acceda a causas federales y nacionales"
						primaryTypographyProps={{ fontWeight: 600 }}
					/>
					<ArrowRight size={24} color={theme.palette.text.secondary} />
				</ListItemButton>
			</Grid>

			{/* Poder Judicial de Buenos Aires */}
			<Grid item xs={12}>
				<ListItemButton
					onClick={() => handleSelectJudicialPower("buenosaires")}
					sx={{
						border: 1,
						borderColor: "divider",
						borderRadius: 2,
						p: 2,
						cursor: "pointer",
						"&:hover": {
							backgroundColor: alpha(theme.palette.primary.main, 0.05),
							borderColor: theme.palette.primary.main,
						},
					}}
				>
					<ListItemIcon sx={{ minWidth: 80 }}>
						<Box
							sx={{
								backgroundColor: "#f8f8f8",
								borderRadius: 1,
								p: 1,
								width: 60,
								height: 60,
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<img
								src={logoPJBuenosAires}
								alt="Poder Judicial de Buenos Aires"
								style={{
									maxHeight: "100%",
									maxWidth: "100%",
									objectFit: "contain",
								}}
							/>
						</Box>
					</ListItemIcon>
					<Box sx={{ flexGrow: 1 }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Typography variant="body1" fontWeight={600}>
								Poder Judicial de la Provincia de Buenos Aires
							</Typography>
							<Chip label="Próximamente" size="small" color="primary" variant="outlined" />
						</Stack>
						<Typography variant="body2" color="text.secondary">
							Vincule causas del fuero provincial
						</Typography>
					</Box>
					<Lock size={24} color={theme.palette.primary.main} />
				</ListItemButton>
			</Grid>

			<Grid item xs={12}>
				<Alert severity="info">Los datos de la causa se importarán automáticamente desde el sistema del poder judicial seleccionado.</Alert>
			</Grid>
		</Grid>
	);
};

export default JudicialPowerSelection;
