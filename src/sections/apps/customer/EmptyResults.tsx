import { Stack, Typography, Box } from "@mui/material";
import { Archive } from "iconsax-react";

interface EmptyResultsProps {
	message: string;
}

const EmptyResults = ({ message }: EmptyResultsProps) => {
	return (
		<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 5, px: 2 }}>
			<Box sx={{ p: 2, bgcolor: "primary.lighter", borderRadius: "50%" }}>
				<Archive size={32} variant="Bulk" style={{ color: "var(--mui-palette-primary-main)" }} />
			</Box>
			<Typography variant="h5" color="textSecondary">
				{message}
			</Typography>
			<Typography variant="body2" color="textSecondary">
				Los elementos archivados aparecerán aquí
			</Typography>
		</Stack>
	);
};

export default EmptyResults;
