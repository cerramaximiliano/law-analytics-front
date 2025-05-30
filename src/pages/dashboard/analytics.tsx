import { Grid } from "@mui/material";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

// project imports
import { AppDispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import useAuth from "hooks/useAuth";

// widgets
import AverageResolutionTime from "sections/widget/analytics/AverageResolutionTime";
import TaskCompletionRate from "sections/widget/analytics/TaskCompletionRate";
import TaskDistributionByPriority from "sections/widget/analytics/TaskDistributionByPriority";
import CalculatorTypeBreakdown from "sections/widget/analytics/CalculatorTypeBreakdown";
import AmountsByFolderStatus from "sections/widget/analytics/AmountsByFolderStatus";
import DailyWeeklyActivity from "sections/widget/analytics/DailyWeeklyActivity";
import RecentActivityFeed from "sections/widget/analytics/RecentActivityFeed";
import TopMatters from "sections/widget/analytics/TopMatters";
import FoldersByMatter from "sections/widget/analytics/FoldersByMatter";
import NotificationStatus from "sections/widget/analytics/NotificationStatus";
import DeadlineProjections from "sections/widget/analytics/DeadlineProjections";
import FolderClosingTrends from "sections/widget/analytics/FolderClosingTrends";

// ==============================|| DASHBOARD - ANALYTICS ||============================== //

const DashboardAnalytics = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { user } = useAuth();

	useEffect(() => {
		if (user?.id) {
			// Fetch all sections for analytics
			dispatch(getUnifiedStats(user.id, "all", false));
		}
	}, [dispatch, user?.id]);

	return (
		<Grid container spacing={3}>
			{/* Row 1 - Key Metrics */}
			<Grid item xs={12} md={6} lg={3}>
				<AverageResolutionTime />
			</Grid>
			<Grid item xs={12} md={6} lg={3}>
				<TaskCompletionRate />
			</Grid>
			<Grid item xs={12} md={6} lg={3}>
				<TaskDistributionByPriority />
			</Grid>
			<Grid item xs={12} md={6} lg={3}>
				<CalculatorTypeBreakdown />
			</Grid>

			{/* Row 2 - Financial and Activity */}
			<Grid item xs={12} lg={8}>
				<AmountsByFolderStatus />
			</Grid>
			<Grid item xs={12} lg={4}>
				<NotificationStatus />
			</Grid>

			{/* Row 3 - Trends and Activity */}
			<Grid item xs={12} lg={8}>
				<DailyWeeklyActivity />
			</Grid>
			<Grid item xs={12} lg={4}>
				<RecentActivityFeed />
			</Grid>

			{/* Row 4 - Matters and Folders */}
			<Grid item xs={12} lg={6}>
				<TopMatters />
			</Grid>
			<Grid item xs={12} lg={6}>
				<FoldersByMatter />
			</Grid>

			{/* Row 5 - Projections and Trends */}
			<Grid item xs={12} lg={6}>
				<DeadlineProjections />
			</Grid>
			<Grid item xs={12} lg={6}>
				<FolderClosingTrends />
			</Grid>
		</Grid>
	);
};

export default DashboardAnalytics;
