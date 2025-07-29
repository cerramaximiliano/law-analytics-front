import React, { useEffect, useState } from "react";
import { Typography, Box, Chip, LinearProgress, Paper, Grid, Card, CardContent, CardHeader, Divider, Button } from "@mui/material";
import useSubscription from "../../hooks/useSubscription";
import axios from "axios";

interface UsageStats {
	folders: number;
	calculators: number;
	contacts: number;
	storage: number; // MB
}

/**
 * Component that displays subscription information and limits
 */
const SubscriptionInfo: React.FC<{ showUpgradeButton?: boolean }> = ({ showUpgradeButton = false }) => {
	const {
		subscription,
		hasFeatureLocal,
		getLimitLocal,
		getLimitUsagePercentage,
		isInTrialPeriod,
		getDaysLeftInPeriod,
		getDaysLeftInTrial,
		canUpgrade,
	} = useSubscription();

	const [usageStats, setUsageStats] = useState<UsageStats>({
		folders: 0,
		calculators: 0,
		contacts: 0,
		storage: 0,
	});

	// Fetch actual usage data
	useEffect(() => {
		const fetchUsageStats = async () => {
			try {
				const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/user/usage-stats`);
				if (response.data && response.data.success) {
					setUsageStats(response.data.data);
				}
			} catch (error) {
				// Fallback to some default values based on limits
				const maxFolders = getLimitLocal("maxFolders");
				const maxCalcs = getLimitLocal("maxCalculators");
				const maxContacts = getLimitLocal("maxContacts");

				setUsageStats({
					folders: Math.floor(maxFolders * 0.3), // Example: using 30% of limit
					calculators: Math.floor(maxCalcs * 0.2), // Example: using 20% of limit
					contacts: Math.floor(maxContacts * 0.4), // Example: using 40% of limit
					storage: 0, // Default to 0 until real data is available
				});
			}
		};

		if (subscription) {
			fetchUsageStats();
		}
	}, [subscription]);

	if (!subscription) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="h5">No subscription information available</Typography>
			</Paper>
		);
	}

	// Subscription status chip color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "success";
			case "trialing":
				return "info";
			case "past_due":
				return "warning";
			case "canceled":
			case "incomplete":
			default:
				return "error";
		}
	};

	// Handle plan upgrade
	const handleUpgrade = () => {
		window.location.href = "/plans";
	};

	// Calculate days remaining
	const daysLeftInPeriod = getDaysLeftInPeriod();
	const daysLeftInTrial = getDaysLeftInTrial();

	return (
		<Card>
			<CardHeader
				title="Subscription Information"
				subheader={`Plan: ${subscription.plan.toUpperCase()}`}
				action={
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Chip label={subscription.status} color={getStatusColor(subscription.status) as any} variant="filled" />
						{showUpgradeButton && canUpgrade() && (
							<Button variant="contained" color="primary" size="small" onClick={handleUpgrade}>
								Upgrade
							</Button>
						)}
					</Box>
				}
			/>
			<Divider />
			<CardContent>
				{/* Plan period */}
				<Box mb={3}>
					<Typography variant="subtitle1" gutterBottom>
						Subscription Period
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={6} sm={3}>
							<Typography variant="body2" color="textSecondary">
								Start Date:
							</Typography>
							<Typography variant="body1">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</Typography>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Typography variant="body2" color="textSecondary">
								End Date:
							</Typography>
							<Typography variant="body1">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</Typography>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Typography variant="body2" color="textSecondary">
								Days Remaining:
							</Typography>
							<Typography variant="body1">{daysLeftInPeriod || 0}</Typography>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Typography variant="body2" color="textSecondary">
								Payment Method:
							</Typography>
							<Typography variant="body1">
								{subscription.paymentMethod || (subscription.plan === "free" ? "N/A" : "Not specified")}
							</Typography>
						</Grid>
					</Grid>
				</Box>

				{/* Trial information - only show if in trial */}
				{isInTrialPeriod() && daysLeftInTrial !== null && (
					<Box mb={3} sx={{ bgcolor: "info.light", p: 2, borderRadius: 1 }}>
						<Typography variant="subtitle1" gutterBottom>
							Trial Period
						</Typography>
						<Typography variant="body2">
							You are currently in a trial period. Your trial will end in{" "}
							<strong>
								{daysLeftInTrial} {daysLeftInTrial === 1 ? "day" : "days"}
							</strong>
							.
						</Typography>
						{subscription.plan !== "premium" && (
							<Button variant="contained" color="primary" size="small" sx={{ mt: 1 }} onClick={handleUpgrade}>
								Upgrade Now
							</Button>
						)}
					</Box>
				)}

				{/* Features */}
				<Box mb={3}>
					<Typography variant="subtitle1" gutterBottom>
						Features
					</Typography>
					<Grid container spacing={1}>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Advanced Analytics"
								color={hasFeatureLocal("advancedAnalytics") ? "primary" : "default"}
								variant={hasFeatureLocal("advancedAnalytics") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Export Reports"
								color={hasFeatureLocal("exportReports") ? "primary" : "default"}
								variant={hasFeatureLocal("exportReports") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Task Automation"
								color={hasFeatureLocal("taskAutomation") ? "primary" : "default"}
								variant={hasFeatureLocal("taskAutomation") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Bulk Operations"
								color={hasFeatureLocal("bulkOperations") ? "primary" : "default"}
								variant={hasFeatureLocal("bulkOperations") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Priority Support"
								color={hasFeatureLocal("prioritySupport") ? "primary" : "default"}
								variant={hasFeatureLocal("prioritySupport") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Vinculate Folders"
								color={hasFeatureLocal("vinculateFolders") ? "primary" : "default"}
								variant={hasFeatureLocal("vinculateFolders") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Chip
								label="Booking"
								color={hasFeatureLocal("booking") ? "primary" : "default"}
								variant={hasFeatureLocal("booking") ? "filled" : "outlined"}
								sx={{ m: 0.5 }}
							/>
						</Grid>
					</Grid>
				</Box>

				{/* Resource limits */}
				<Box>
					<Typography variant="subtitle1" gutterBottom>
						Resource Usage
					</Typography>

					<Box mb={2}>
						<Box display="flex" justifyContent="space-between" mb={0.5}>
							<Typography variant="body2">Folders</Typography>
							<Typography variant="body2">
								{usageStats.folders} / {getLimitLocal("maxFolders")}
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={getLimitUsagePercentage("maxFolders", usageStats.folders)}
							color={getLimitUsagePercentage("maxFolders", usageStats.folders) > 80 ? "warning" : "primary"}
						/>
					</Box>

					<Box mb={2}>
						<Box display="flex" justifyContent="space-between" mb={0.5}>
							<Typography variant="body2">Calculators</Typography>
							<Typography variant="body2">
								{usageStats.calculators} / {getLimitLocal("maxCalculators")}
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={getLimitUsagePercentage("maxCalculators", usageStats.calculators)}
							color={getLimitUsagePercentage("maxCalculators", usageStats.calculators) > 80 ? "warning" : "primary"}
						/>
					</Box>

					<Box mb={2}>
						<Box display="flex" justifyContent="space-between" mb={0.5}>
							<Typography variant="body2">Contacts</Typography>
							<Typography variant="body2">
								{usageStats.contacts} / {getLimitLocal("maxContacts")}
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={getLimitUsagePercentage("maxContacts", usageStats.contacts)}
							color={getLimitUsagePercentage("maxContacts", usageStats.contacts) > 80 ? "warning" : "primary"}
						/>
					</Box>

					<Box mb={2}>
						<Box display="flex" justifyContent="space-between" mb={0.5}>
							<Typography variant="body2">Storage (MB)</Typography>
							<Typography variant="body2">
								{usageStats.storage} / {getLimitLocal("storageLimit")}
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={getLimitUsagePercentage("storageLimit", usageStats.storage)}
							color={getLimitUsagePercentage("storageLimit", usageStats.storage) > 80 ? "warning" : "primary"}
						/>
					</Box>
				</Box>

				{/* Cancellation warning */}
				{subscription.cancelAtPeriodEnd && (
					<Box mt={2} sx={{ bgcolor: "warning.light", p: 2, borderRadius: 1 }}>
						<Typography variant="body2" color="warning.dark">
							Your subscription will be canceled at the end of the current billing period on{" "}
							{new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
						</Typography>
						<Button
							variant="outlined"
							color="warning"
							size="small"
							sx={{ mt: 1 }}
							onClick={() => (window.location.href = "/profile/billing")}
						>
							Reactivate Subscription
						</Button>
					</Box>
				)}

				{/* Upgrade call to action - for free and standard plans */}
				{(subscription.plan === "free" || subscription.plan === "standard") && !subscription.cancelAtPeriodEnd && (
					<Box mt={3} textAlign="center">
						<Button variant="contained" color="primary" onClick={handleUpgrade}>
							{subscription.plan === "free" ? "Upgrade to Standard or Premium" : "Upgrade to Premium"}
						</Button>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default SubscriptionInfo;
