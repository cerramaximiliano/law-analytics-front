// material-ui
//import { useTheme } from "@mui/material/styles";

import { Stack, Typography } from "@mui/material";

//import { fontFamily } from "@mui/system";
/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

const LogoMain = ({ reverse, ...others }: { reverse?: boolean }) => {
	//const theme = useTheme();
	return (
		/**
		 * if you want to use image instead of svg uncomment following, and comment out <svg> element.
		 *
		 * <img src={theme.palette.mode === ThemeMode.DARK ? logoDark : logo} alt="icon logo" width="100" />
		 *
		 */
		<>
			<Stack>
				<Typography variant="h3">Law||Analytics</Typography>
			</Stack>
		</>
	);
};

export default LogoMain;
