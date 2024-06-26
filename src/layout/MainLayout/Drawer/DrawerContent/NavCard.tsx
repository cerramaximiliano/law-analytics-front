// material-ui
import { Button, Link, CardMedia, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import avatar from "assets/images/users/customer-support-1.png";
import AnimateButton from "components/@extended/AnimateButton";

// ==============================|| DRAWER CONTENT - NAV CARD ||============================== //

const NavCard = () => (
	<MainCard sx={{ bgcolor: "secondary.lighter", m: 3 }}>
		<Stack alignItems="center" spacing={2.5}>
			<CardMedia component="img" image={avatar} />
			<Stack alignItems="center">
				<Typography variant="h5">¿Necesita ayuda?</Typography>
				<Typography variant="h6" color="secondary">
					Respuesta en 24 horas
				</Typography>
			</Stack>
			<AnimateButton>
				<Button variant="shadow" size="small" component={Link} href="https://phoenixcoded.authordesk.app/" target="_blank">
					Soporte
				</Button>
			</AnimateButton>
		</Stack>
	</MainCard>
);

export default NavCard;
