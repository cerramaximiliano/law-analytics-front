import React from "react";
import { Link } from "react-router-dom";
import { To } from "history";

// material-ui
import { ButtonBase } from "@mui/material";
import { SxProps } from "@mui/system";

// project-imports
import Logo, { LogoAnimation } from "./LogoMain";
import LogoIcon from "./LogoIcon";
import { APP_DEFAULT_PATH } from "config";

// ==============================|| MAIN LOGO ||============================== //

interface Props {
	reverse?: boolean;
	isIcon?: boolean;
	sx?: SxProps;
	to?: To;
	animation?: LogoAnimation;
}

const LogoSection = ({ reverse, isIcon, sx, to, animation }: Props) => (
	<ButtonBase disableRipple component={Link} to={!to ? APP_DEFAULT_PATH : to} sx={sx}>
		{isIcon ? <LogoIcon /> : <Logo reverse={reverse} animation={animation} />}
	</ButtonBase>
);

export default LogoSection;
