import { Link } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Button, Grid, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ProfileRadialChart from "./ProfileRadialChart";

// assets
import BackLeft from "assets/images/profile/UserProfileBackLeft";
import BackRight from "assets/images/profile/UserProfileBackRight";

// types
import { ThemeMode } from "types/config";

// ==============================|| USER PROFILE - TOP CARD ||============================== //

interface Props {
	focusInput: () => void;
}

const ProfileCard = ({ focusInput }: Props) => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	return (
		<MainCard
			border={false}
			content={false}
			sx={{
				bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.700" : "primary.lighter",
				position: "relative",
			}}
		>
			<Box sx={{ position: "absolute", bottom: "-7px", left: 0, zIndex: 1 }}>
				<BackLeft />
			</Box>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 5 }}>
				<Grid item>
					<Stack direction="row" spacing={matchDownSM ? 1 : 2} alignItems="center">
						<Box sx={{ ml: { xs: 0, sm: 1 } }}>
							<ProfileRadialChart />
						</Box>
						<Stack spacing={0.75}>
							<Typography variant="h5">Editar tu Perfil</Typography>
							<Typography variant="body2" color="secondary">
								Completa tu perfil para desbloquear aplicativos
							</Typography>
						</Stack>
					</Stack>
				</Grid>
				<Grid item sx={{ mx: matchDownSM ? 2 : 3, my: matchDownSM ? 1 : 0, mb: matchDownSM ? 2 : 0 }} xs={matchDownSM ? 12 : "auto"}>
					<Button variant="contained" fullWidth={matchDownSM} component={Link} to="/apps/profiles/user/personal" onClick={focusInput}>
						Editar Perfil
					</Button>
				</Grid>
			</Grid>
			<Box sx={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
				<BackRight />
			</Box>
		</MainCard>
	);
};

export default ProfileCard;
