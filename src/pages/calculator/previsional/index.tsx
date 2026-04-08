import React from "react";
// material-ui
import { Grid } from "@mui/material";

// project-imports
import PrevisionalTabs from "./previsional-tabs";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";

function PrevisionalLayout() {
	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<PrevisionalTabs />
				</Grid>
			</Grid>
		</>
	);
}

export default PrevisionalLayout;
