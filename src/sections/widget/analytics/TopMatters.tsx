import React from "react";
import { Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "store";
import MainCard from "components/MainCard";

const TopMatters = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	// Try to get matters distribution from multiple possible locations
	const distribution = data?.matters?.distribution || data?.folders?.byMatter?.distribution || {};

	console.log("📊 [TopMatters] matters from data.matters:", data?.matters);
	console.log("📊 [TopMatters] matters from folders.byMatter:", data?.folders?.byMatter);
	console.log("📊 [TopMatters] final distribution:", distribution);

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
