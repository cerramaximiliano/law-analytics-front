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

// Micro-interacción: al hacer hover sobre el logo (siempre es un link), las columnas
// del isotipo se estiran apenas desde la base. Se desactiva con prefers-reduced-motion.
const hoverSx: SxProps = {
	"& .la-col": {
		transformBox: "fill-box",
		transformOrigin: "50% 100%",
		transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
	},
	"@media (hover: hover) and (prefers-reduced-motion: no-preference)": {
		"&:hover .la-col": { transform: "scaleY(1.045)" },
	},
};

const LogoSection = ({ reverse, isIcon, sx, to, animation }: Props) => (
	<ButtonBase disableRipple component={Link} to={!to ? APP_DEFAULT_PATH : to} sx={[hoverSx, sx] as SxProps}>
		{isIcon ? <LogoIcon /> : <Logo reverse={reverse} animation={animation} />}
	</ButtonBase>
);

export default LogoSection;
