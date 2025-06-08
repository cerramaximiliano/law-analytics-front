// material-ui
import { Grid } from "@mui/material";
// project-imports

import InteresesTabs from "./intereses-tabs";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";

function InteresesLayouts() {
	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<InteresesTabs />
				</Grid>
			</Grid>
		</>
	);
}
export default InteresesLayouts;
