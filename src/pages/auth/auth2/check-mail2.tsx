import { Link } from "react-router-dom";

// material-ui
import { Box, Button, Grid, Typography } from "@mui/material";

// project-imports
import useAuth from "hooks/useAuth";
import AnimateButton from "components/@extended/AnimateButton";
import AuthWrapper2 from "sections/auth/AuthWrapper2";

// ================================|| CHECK MAIL ||================================ //

const CheckMail = () => {
	const { isLoggedIn } = useAuth();

	return (
		<AuthWrapper2>
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Box sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Hi, Check Your Mail</Typography>
						<Typography color="secondary" sx={{ mb: 0.5, mt: 1.25 }}>
							We have sent a password recover instructions to your email.
						</Typography>
					</Box>
				</Grid>
				<Grid item xs={12}>
					<AnimateButton>
						<Button
							component={Link}
							to={isLoggedIn ? "/auth/login2" : "/login2"}
							disableElevation
							fullWidth
							size="large"
							type="submit"
							variant="contained"
							color="primary"
						>
							Sign in
						</Button>
					</AnimateButton>
				</Grid>
			</Grid>
		</AuthWrapper2>
	);
};

export default CheckMail;
