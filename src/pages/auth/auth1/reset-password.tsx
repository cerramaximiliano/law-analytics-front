import React from "react";
// material-ui
import { Grid } from "@mui/material";

// project-imports
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthResetPassword from "sections/auth/auth-forms/AuthResetPassword";

// ================================|| RESET PASSWORD ||================================ //

const ResetPassword = () => (
	<AuthWrapper>
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<AuthResetPassword />
			</Grid>
		</Grid>
	</AuthWrapper>
);

export default ResetPassword;
