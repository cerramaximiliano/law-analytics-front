// material-ui
//import { useTheme } from "@mui/material/styles";
import { Stack, Typography } from "@mui/material";
/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoIconDark from 'assets/images/logo-icon-dark.svg';
 * import logoIcon from 'assets/images/logo-icon.svg';
 *
 */

// ==============================|| LOGO ICON SVG ||============================== //

const LogoIcon = () => {
	//const theme = useTheme();

	return (
		/**
		 * if you want to use image instead of svg uncomment following, and comment out <svg> element.
		 *
		 * <img src={theme.palette.mode === ThemeMode.DARK ? logoIconDark : logoIcon} alt="icon logo" width="100" />
		 *
		 */
		<>
			<Stack>
				<Typography variant="h3">||</Typography>
			</Stack>
		</>
	);
};

export default LogoIcon;
