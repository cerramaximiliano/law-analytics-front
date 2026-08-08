import React from "react";
import { Link } from "react-router-dom";
import { To } from "history";

// material-ui
import { ButtonBase } from "@mui/material";
import { keyframes } from "@mui/material/styles";
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

// Micro-interacción "mini-trazo": al hacer hover sobre el logo, el contorno del
// isotipo se redibuja rápido por encima del relleno y se desvanece — la misma
// identidad del efecto trazo de login y las vistas públicas, en dosis chica.
// El overlay .la-hover-trace vive en LogoMain/LogoIcon (invisible por defecto).
const hoverTrace = keyframes`
	0% { stroke-dashoffset: 1; opacity: 1; }
	70% { stroke-dashoffset: 0; opacity: 1; }
	100% { stroke-dashoffset: 0; opacity: 0; }
`;

const hoverSx: SxProps = {
	"& .la-hover-trace": {
		strokeDasharray: 1,
		strokeDashoffset: 1,
		opacity: 0,
	},
	"@media (hover: hover) and (prefers-reduced-motion: no-preference)": {
		"&:hover .la-hover-trace": {
			animation: `${hoverTrace} 0.55s ease-out`,
		},
	},
};

const LogoSection = ({ reverse, isIcon, sx, to, animation }: Props) => (
	<ButtonBase disableRipple component={Link} to={!to ? APP_DEFAULT_PATH : to} sx={[hoverSx, sx] as SxProps}>
		{isIcon ? <LogoIcon /> : <Logo reverse={reverse} animation={animation} />}
	</ButtonBase>
);

export default LogoSection;
