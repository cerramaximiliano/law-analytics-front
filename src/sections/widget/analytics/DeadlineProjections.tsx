import React from "react";
import { Typography, Box, CircularProgress, Stack, Card, CardContent, Grid, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { Calendar, Clock, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const DeadlineProjections = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Usar upcomingDeadlines de folders si está disponible, sino usar dashboard.deadlines como fallback
	const upcomingDeadlines = data?.folders?.upcomingDeadlines;
	const dashboardDeadlines = data?.dashboard?.deadlines;

	// Mapear los datos correctamente según la fuente
	const deadlines = upcomingDeadlines ? {
		nextWeek: upcomingDeadlines.next7Days || 0,
		next15Days: upcomingDeadlines.next15Days || 0,
		next30Days: upcomingDeadlines.next30Days || 0,
	} : dashboardDeadlines || { nextWeek: 0, next15Days: 0, next30Days: 0 };

	const description = descriptions?.folders?.upcomingDeadlines || descriptions?.dashboard?.deadlines?.nextWeek;

	const deadlineItems = [
		{
			label: "Próximos 7 Días",
			count: deadlines.nextWeek,
			color: "error.main",
			bgColor: "error.lighter",
			icon: <Clock size={20} />,
			description: descriptions?.dashboard?.deadlines?.nextWeek || "Vencimientos en los próximos 7 días",
		},
		{
			label: "Próximos 15 Días",
			count: deadlines.next15Days,
			color: "warning.main",
			bgColor: "warning.lighter",
			icon: <Calendar size={20} />,
			description: descriptions?.dashboard?.deadlines?.next15Days || "Vencimientos en los próximos 15 días",
		},
		{
			label: "Próximos 30 Días",
			count: deadlines.next30Days,
			color: "success.main",
			bgColor: "success.lighter",
			icon: <Calendar size={20} />,
			description: descriptions?.dashboard?.deadlines?.next30Days || "Vencimientos en los próximos 30 días",
		},
	];

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography variant="h4">Proyección de Vencimientos</Typography>
					{description && (
						<Tooltip title={description} arrow placement="top">
							<IconButton size="small" sx={{ p: 0.5 }}>
								<InfoCircle size={16} color="#8c8c8c" />
							</IconButton>
						</Tooltip>
					)}
				</Box>
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
										<Stack spacing={1} flex={1}>
											<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
												<Typography variant="body2" color="textSecondary">
													{item.label}
												</Typography>
												{item.description && (
													<Tooltip title={item.description} arrow placement="top">
														<IconButton size="small" sx={{ p: 0.25 }}>
															<InfoCircle size={14} color="#8c8c8c" />
														</IconButton>
													</Tooltip>
												)}
											</Box>
											<Typography variant="h4" color={item.color}>
												{item.count}
											</Typography>
											<Typography variant="caption" color="textSecondary">
												{item.count === 1 ? 'vencimiento' : 'vencimientos'}
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
