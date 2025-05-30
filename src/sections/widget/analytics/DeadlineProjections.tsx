import { Typography, Box, CircularProgress, Stack, Card, CardContent, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { Calendar, Clock } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const DeadlineProjections = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	const deadlines = data?.dashboard?.deadlines || { nextWeek: 0, next15Days: 0, next30Days: 0 };

	const deadlineItems = [
		{
			label: "Próxima Semana",
			count: deadlines.nextWeek,
			color: "error.main",
			bgColor: "error.lighter",
			icon: <Clock size={20} />,
		},
		{
			label: "Próximos 15 Días",
			count: deadlines.next15Days,
			color: "warning.main",
			bgColor: "warning.lighter",
			icon: <Calendar size={20} />,
		},
		{
			label: "Próximos 30 Días",
			count: deadlines.next30Days,
			color: "success.main",
			bgColor: "success.lighter",
			icon: <Calendar size={20} />,
		},
	];

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h4">Proyección de Vencimientos</Typography>
				<Calendar size={24} />
			</Box>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={2}>
					{deadlineItems.map((item, index) => (
						<Grid item xs={12} key={index}>
							<Card variant="outlined">
								<CardContent>
									<Stack direction="row" alignItems="center" justifyContent="space-between">
										<Stack spacing={1}>
											<Typography variant="body2" color="textSecondary">
												{item.label}
											</Typography>
											<Typography variant="h4" color={item.color}>
												{item.count}
											</Typography>
										</Stack>
										<Box
											sx={{
												width: 40,
												height: 40,
												borderRadius: 1,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: item.bgColor,
												color: item.color,
											}}
										>
											{item.icon}
										</Box>
									</Stack>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}
		</MainCard>
	);
};

export default DeadlineProjections;
