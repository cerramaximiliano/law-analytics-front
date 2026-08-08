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

// Micro-interacción "destello": al hacer hover, una banda de luz diagonal barre el
// isotipo una vez, como un reflejo. La banda (.la-shine) vive dentro de la máscara
// del ícono en LogoMain/LogoIcon, así el brillo respeta el recorte de las columnas.
const shineSweep = keyframes`
	0% { transform: translateX(0); opacity: 1; }
	100% { transform: translateX(700px); opacity: 1; }
`;

const hoverSx: SxProps = {
	"& .la-shine": { opacity: 0 },
	"@media (hover: hover) and (prefers-reduced-motion: no-preference)": {
		"&:hover .la-shine": {
			animation: `${shineSweep} 0.7s ease`,
		},
	},
};

const LogoSection = ({ reverse, isIcon, sx, to, animation }: Props) => (
	<ButtonBase disableRipple component={Link} to={!to ? APP_DEFAULT_PATH : to} sx={[hoverSx, sx] as SxProps}>
		{isIcon ? <LogoIcon /> : <Logo reverse={reverse} animation={animation} />}
	</ButtonBase>
);

export default LogoSection;
