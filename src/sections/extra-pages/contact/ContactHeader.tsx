// material-ui
import { Box, Container, Stack, Typography } from "@mui/material";

// project imports
import PageBackground from "components/PageBackground";

// ==============================|| CONTACT US - HEADER ||============================== //

function ContactHeader() {
	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				pt: 9,
				pb: 2,
			}}
		>
			<PageBackground />
			<Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
				<Box sx={{ width: { xs: "100%", sm: 252, md: 360, lg: 436 }, py: 6, mx: "auto" }}>
					<Stack spacing={1}>
						<Typography align="center" variant="h2">
							Talk to our Expert
						</Typography>
						<Typography align="center" color="textSecondary">
							Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
						</Typography>
					</Stack>
				</Box>
			</Container>
		</Box>
	);
}

export default ContactHeader;
