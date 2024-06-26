// material-ui
import { Grid } from "@mui/material";
// project-imports

import InteresesTabs from "./intereses-tabs";

function InteresesLayouts() {
	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<InteresesTabs />
			</Grid>
		</Grid>
	);
}
export default InteresesLayouts;
