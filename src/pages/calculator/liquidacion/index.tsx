import React from "react";
import { Grid, Stack, Typography } from "@mui/material";

import MainCard from "components/MainCard";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import LiquidacionWizard from "sections/forms/wizard/calc-liquidacion";

// Liquidación encadenada: capital, intereses, pagos a cuenta, honorarios, IVA y tasa de justicia.
function LiquidacionLayout() {
	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<MainCard>
						<Stack spacing={0.5} sx={{ mb: 2.5 }}>
							<Typography sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 600, letterSpacing: "-0.02em" }}>
								Liquidación
							</Typography>
							<Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
								Capital, intereses por tramos, pagos a cuenta, honorarios en UMA (ley 27.423), IVA y tasa de justicia, en una sola planilla.
							</Typography>
						</Stack>
						<LiquidacionWizard />
					</MainCard>
				</Grid>
			</Grid>
		</>
	);
}

export default LiquidacionLayout;
