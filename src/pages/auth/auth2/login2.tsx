import { Link } from "react-router-dom";

// material-ui
import { Grid, Stack, Typography } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthSocButton from "sections/auth/AuthSocButton";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper2 from "sections/auth/AuthWrapper2";
import AuthLogin from "sections/auth/auth-forms/AuthLogin";

// assets
import imgFacebook from "assets/images/auth/facebook.svg";
import imgTwitter from "assets/images/auth/twitter.svg";
import imgGoogle from "assets/images/auth/google.svg";

// ================================|| LOGIN ||================================ //

const Login2 = () => {
	const { isLoggedIn } = useAuth();

	return (
		<AuthWrapper2>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo />
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={1}>
						<Grid item xs={12}>
							<AuthSocButton>
								<img src={imgFacebook} alt="Facebook" style={{ margin: "0 10px" }} /> Sign In with Facebook
							</AuthSocButton>
						</Grid>
						<Grid item xs={12}>
							<AuthSocButton>
								<img src={imgTwitter} alt="Facebook" style={{ margin: "0 10px" }} /> Sign In with Twitter
							</AuthSocButton>
						</Grid>
						<Grid item xs={12}>
							<AuthSocButton>
								<img src={imgGoogle} alt="Facebook" style={{ margin: "0 10px" }} /> Sign In with Google
							</AuthSocButton>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="body1">OR</Typography>
					</AuthDivider>
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Login</Typography>
						<Typography
							component={Link}
							to={isLoggedIn ? "/auth/register2" : "/register2"}
							variant="body1"
							sx={{ textDecoration: "none" }}
							color="primary"
						>
							Don&apos;t have an account?
						</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<AuthLogin forgot="/auth/forgot-password2" />
				</Grid>
			</Grid>
		</AuthWrapper2>
	);
};

export default Login2;
