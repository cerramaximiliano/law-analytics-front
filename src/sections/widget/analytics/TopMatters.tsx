import { Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "store";
import MainCard from "components/MainCard";

const TopMatters = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	// Convert distribution object to array format for display
	const distribution = data?.matters?.distribution || {};
	const topMatters = Object.entries(distribution)
		.map(([matter, count]) => ({ matter, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return (
		<MainCard>
			<Typography variant="h4" sx={{ mb: 2 }}>
				Principales Asuntos
			</Typography>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : topMatters.length > 0 ? (
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Asunto</TableCell>
								<TableCell align="center">Carpetas</TableCell>
								<TableCell align="center">Estado</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{topMatters.map((matter, index) => (
								<TableRow key={index}>
									<TableCell>{matter.matter}</TableCell>
									<TableCell align="center">{matter.count}</TableCell>
									<TableCell align="center">
										<Chip label="activo" size="small" color="success" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			) : (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Typography variant="body1" color="textSecondary">
						No hay asuntos disponibles
					</Typography>
				</Box>
			)}
		</MainCard>
	);
};

export default TopMatters;
