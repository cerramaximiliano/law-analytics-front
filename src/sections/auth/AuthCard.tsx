import React from "react";
// material-ui
import { Box } from "@mui/material";

// project-imports
import MainCard, { MainCardProps } from "components/MainCard";

// ==============================|| AUTHENTICATION - CARD ||============================== //

const AuthCard = ({ children, ...other }: MainCardProps) => (
	<MainCard
		sx={{
			maxWidth: { xs: "calc(100vw - 32px)", sm: 400, md: 420 },
			width: "100%",
			margin: { xs: 2, md: 3 },
			"& > *": {
				flexGrow: 1,
				flexBasis: "50%",
			},
		}}
		content={false}
		{...other}
	>
		<Box sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, py: { xs: 2, sm: 2.5, md: 3 } }}>{children}</Box>
	</MainCard>
);

export default AuthCard;
