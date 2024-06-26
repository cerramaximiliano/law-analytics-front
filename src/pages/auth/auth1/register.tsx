import { Link } from "react-router-dom";

// material-ui
import { Grid, Stack, Typography } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthSocButton from "sections/auth/AuthSocButton";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import FirebaseRegister from "sections/auth/auth-forms/AuthRegister";

// assets
import imgGoogle from "assets/images/auth/google.svg";

// ================================|| REGISTER ||================================ //

const Register = () => {
	const { isLoggedIn } = useAuth();

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo />
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={1}>
						<Grid item xs={12}>
							<AuthSocButton>
								<img src={imgGoogle} alt="Facebook" style={{ margin: "0 10px" }} /> Sign In con Google
							</AuthSocButton>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="body1">O</Typography>
					</AuthDivider>
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Sign up</Typography>
						<Typography
							component={Link}
							to={isLoggedIn ? "/auth/login" : "/login"}
							variant="body1"
							sx={{ textDecoration: "none" }}
							color="primary"
						>
							¿Ya tienes una cuenta?
						</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<FirebaseRegister />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Register;
