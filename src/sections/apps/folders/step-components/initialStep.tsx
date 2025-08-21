import React from "react";
import { Grid, Stack, DialogContent, Card, CardContent, CardActionArea, Typography, Box } from "@mui/material";
import { DocumentDownload, DocumentText1 } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";

interface FormValues {
	entryMethod: "manual" | "automatic";
}

const InitialStep = () => {
	const theme = useTheme();
	const { setFieldValue, values } = useFormikContext<FormValues>();

	const handleSelectEntryMethod = (method: "manual" | "automatic") => {
		setFieldValue("entryMethod", method);
	};

	return (
		<DialogContent sx={{ p: 2.5 }}>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12}>
					<Typography variant="h6" color="textPrimary" sx={{ mb: 2 }}>
						Seleccione el método de ingreso
					</Typography>
				</Grid>
				<Grid item xs={12} sm={6}>
					<Card
						sx={{
							borderRadius: 2,
							border: values.entryMethod === "manual" ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
							backgroundColor: values.entryMethod === "manual" ? theme.palette.primary.lighter : "inherit",
							transition: "all 0.3s ease",
							height: "100%",
						}}
					>
						<CardActionArea onClick={() => handleSelectEntryMethod("manual")} sx={{ p: 2, height: "100%" }}>
							<CardContent sx={{ p: 0, height: "100%" }}>
								<Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
									<Box
										sx={{
											p: 2,
											bgcolor: values.entryMethod === "manual" ? theme.palette.primary.light : theme.palette.background.paper,
											borderRadius: "50%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<DocumentText1
											size={40}
											color={values.entryMethod === "manual" ? theme.palette.common.white : theme.palette.primary.main}
											variant={values.entryMethod === "manual" ? "Bold" : "Linear"}
										/>
									</Box>
									<Typography variant="h5" color={values.entryMethod === "manual" ? "primary" : "textPrimary"}>
										Ingreso Manual
									</Typography>
									<Typography variant="body2" color="textSecondary" align="center">
										Ingrese manualmente todos los datos de la causa
									</Typography>
								</Stack>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6}>
					<Card
						sx={{
							borderRadius: 2,
							border: values.entryMethod === "automatic" ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
							backgroundColor: values.entryMethod === "automatic" ? theme.palette.primary.lighter : "inherit",
							transition: "all 0.3s ease",
							height: "100%",
						}}
					>
						<CardActionArea onClick={() => handleSelectEntryMethod("automatic")} sx={{ p: 2, height: "100%" }}>
							<CardContent sx={{ p: 0, height: "100%" }}>
								<Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
									<Box
										sx={{
											p: 2,
											bgcolor: values.entryMethod === "automatic" ? theme.palette.primary.light : theme.palette.background.paper,
											borderRadius: "50%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<DocumentDownload
											size={40}
											color={values.entryMethod === "automatic" ? theme.palette.common.white : theme.palette.primary.main}
											variant={values.entryMethod === "automatic" ? "Bold" : "Linear"}
										/>
									</Box>
									<Typography variant="h5" color={values.entryMethod === "automatic" ? "primary" : "textPrimary"}>
										Ingreso Automático
									</Typography>
									<Typography variant="body2" color="textSecondary" align="center">
										Importar causa desde plataformas judiciales
									</Typography>
								</Stack>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>
			</Grid>
		</DialogContent>
	);
};

export default InitialStep;
