import React from "react";
// material-ui
import { Grid } from "@mui/material";
// project-imports

import LaborTabs from "./labor-tabs";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import SEO from "components/SEO/SEO";

function LaborLayouts() {
	return (
		<>
			<SEO path="/calculator/labor" />
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<LaborTabs />
				</Grid>
			</Grid>
		</>
	);
}
export default LaborLayouts;
