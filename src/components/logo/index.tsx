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
// del isotipo se estiran desde la base con un pequeño desfasaje entre sí (efecto onda)
// y el logo se eleva apenas. Se desactiva con prefers-reduced-motion.
const hoverSx: SxProps = {
	"& svg": {
		transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
	},
	"& .la-col": {
		transformBox: "fill-box",
		transformOrigin: "50% 100%",
		transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
	},
	"& .la-col-b": {
		transitionDelay: "0.06s",
	},
	"@media (hover: hover) and (prefers-reduced-motion: no-preference)": {
		"&:hover svg": { transform: "translateY(-2px)" },
		"&:hover .la-col": { transform: "scaleY(1.12)" },
	},
};

const LogoSection = ({ reverse, isIcon, sx, to, animation }: Props) => (
	<ButtonBase disableRipple component={Link} to={!to ? APP_DEFAULT_PATH : to} sx={[hoverSx, sx] as SxProps}>
		{isIcon ? <LogoIcon /> : <Logo reverse={reverse} animation={animation} />}
	</ButtonBase>
);

export default LogoSection;
