import { Button, ButtonProps } from "@mui/material";
import { styled } from "@mui/material/styles";

// Project-imports
import AnimateButton from "components/@extended/AnimateButton";

// Assets
import GoogleIcon from "assets/images/icons/google.svg";

// Styled Button - exactamente como el botón de Login
const GoogleButton = styled(Button)<ButtonProps>(({ theme }) => ({
	// Usar el color primario del tema
	backgroundColor: theme.palette.primary.main,
	color: theme.palette.primary.contrastText,
	fontWeight: 400,
	boxShadow: "none",

	// Efectos al pasar el mouse
	"&:hover": {
		backgroundColor: theme.palette.primary.dark,
		boxShadow: "none",
	},

	// Ajustes al icono
	"& .MuiButton-startIcon": {
		marginRight: "16px",
		marginLeft: "-4px",
		display: "flex",
		alignItems: "center",
	},

	// Otras propiedades para igualar el botón de Login
	textTransform: "none",
	fontSize: "0.9375rem",
	padding: "6px 16px",
	borderRadius: "8px",
	transition: "all 0.25s ease-in-out",
	height: "42.24px", // Altura exacta del botón Login
		boxSizing: "border-box",
	lineHeight: "1.75",
}));

interface CustomGoogleButtonProps {
	onClick: () => void;
	text?: string;
	disabled?: boolean;
	fullWidth?: boolean;
}

const CustomGoogleButton = ({
	onClick,
	text = "Iniciar sesión con Google",
	disabled = false,
	fullWidth = true,
}: CustomGoogleButtonProps) => {
	return (
		<AnimateButton type="scale">
			<GoogleButton
				variant="contained"
				color="primary"
				startIcon={<img src={GoogleIcon} alt="Google" style={{ width: 16, height: 16 }} />}
				onClick={onClick}
				disabled={disabled}
				fullWidth={fullWidth}
				size="large"
				disableElevation // Importante: asegura que no haya sombra
			>
				{text}
			</GoogleButton>
		</AnimateButton>
	);
};

export default CustomGoogleButton;
