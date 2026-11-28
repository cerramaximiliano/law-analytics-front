import React from "react";
// material-ui
import { Button, Grid } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// project-imports
import MainCard from "components/MainCard";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import HaberCajaCalculadora from "./components/HaberCajaCalculadora";

// assets
import { ArrowLeft } from "iconsax-react";

// ==============================|| HABER DE CAJA (Ley 24.241) ||============================== //

function HaberCajaLayout() {
	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<MainCard
						title="Haber de caja"
						secondary={
							<Button component={RouterLink} to="/apps/calc/previsional" size="small" startIcon={<ArrowLeft size={16} />}>
								Calculadora previsional
							</Button>
						}
					>
						<HaberCajaCalculadora />
					</MainCard>
				</Grid>
			</Grid>
		</>
	);
}

export default HaberCajaLayout;
