// material-ui
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Button, Stack } from "@mui/material";

// project-imports
import useAuth from "hooks/useAuth";

// assets
import Google from "assets/images/icons/google.svg";

// ==============================|| FIREBASE - SOCIAL BUTTON ||============================== //

const FirebaseSocial = () => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	// @ts-ignore
	const { firebaseGoogleSignIn } = useAuth();
	const googleHandler = async () => {
		try {
			await firebaseGoogleSignIn();
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<Stack
			direction="row"
			spacing={matchDownSM ? 1 : 2}
			justifyContent={matchDownSM ? "space-around" : "space-between"}
			sx={{ "& .MuiButton-startIcon": { mr: matchDownSM ? 0 : 1, ml: matchDownSM ? 0 : -0.5 } }}
		>
			<Button
				variant="outlined"
				color="secondary"
				fullWidth={!matchDownSM}
				startIcon={<img src={Google} alt="Google" />}
				onClick={googleHandler}
			>
				{!matchDownSM && "Google"}
			</Button>
		</Stack>
	);
};

export default FirebaseSocial;
