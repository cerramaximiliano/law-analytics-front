import React from "react";
// material-ui
import { Grid } from "@mui/material";
// project-imports

import CivilTabs from "./civil-tabs";

function CivilLayouts() {
	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<CivilTabs />
			</Grid>
		</Grid>
	);
}
export default CivilLayouts;
