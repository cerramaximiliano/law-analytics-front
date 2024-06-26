// material-ui
import { Grid, Stack, Typography } from "@mui/material";

// project-imports
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthCodeVerification from "sections/auth/auth-forms/AuthCodeVerification";

// ================================|| CODE VERIFICATION ||================================ //

const CodeVerification = () => (
	<AuthWrapper>
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<Stack spacing={1}>
					<Typography variant="h3">Ingrese el Código de Verificación</Typography>
					<Typography color="secondary">Te lo enviamos a tu email.</Typography>
				</Stack>
			</Grid>
			<Grid item xs={12}>
				<Typography>Enviamos un código a tu correo.</Typography>
			</Grid>
			<Grid item xs={12}>
				<AuthCodeVerification />
			</Grid>
		</Grid>
	</AuthWrapper>
);

export default CodeVerification;
