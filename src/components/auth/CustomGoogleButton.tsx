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
	},

	// Otras propiedades para igualar el botón de Login
	textTransform: "none",
	fontSize: "1rem",
	padding: "8px 22px",
	borderRadius: "8px",
	transition: "all 0.25s ease-in-out",
	minHeight: "42px", // Altura exacta del botón MUI de tamaño grande
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
				startIcon={<img src={GoogleIcon} alt="Google" style={{ width: 20, height: 20 }} />}
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
