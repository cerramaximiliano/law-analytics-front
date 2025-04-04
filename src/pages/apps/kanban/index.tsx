import { useEffect, useState, SyntheticEvent } from "react";
import { useLocation, Link, Outlet } from "react-router-dom";

// material-ui
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { getUserStory, getUserStoryOrder, getProfiles, getComments, getItems, getColumns, getColumnsOrder } from "store/reducers/kanban";

// project-imports
import Loader from "components/Loader";

import { dispatch } from "store";
import { openDrawer } from "store/reducers/menu";

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

// ==============================|| APPLICATION - KANBAN ||============================== //

export default function KanbanPage() {
	const { pathname } = useLocation();
	const [loading, setLoading] = useState<boolean>(true);

	let selectedTab = 0;
	switch (pathname) {
		case "/apps/kanban/backlogs":
			selectedTab = 1;
			break;
		case "/apps/kanban/board":
		default:
			selectedTab = 0;
	}

	const [value, setValue] = useState(selectedTab);
	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	useEffect(() => {
		dispatch(openDrawer(false));

		const items = dispatch(getItems());
		const columns = dispatch(getColumns());
		const columnOrder = dispatch(getColumnsOrder());
		const profile = dispatch(getProfiles());
		const comments = dispatch(getComments());
		const story = dispatch(getUserStory());
		const storyOrder = dispatch(getUserStoryOrder());

		Promise.all([items, columns, columnOrder, profile, comments, story, storyOrder]).then(() => setLoading(false));

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (loading) return <Loader />;

	return (
		<Box sx={{ display: "flex" }}>
			<Grid container spacing={1}>
				<Grid item xs={12}>
					<Tabs value={value} variant="scrollable" onChange={handleChange}>
						<Tab component={Link} to="/apps/kanban/board" label={value === 0 ? "Board" : "View as Board"} {...a11yProps(0)} />
						<Tab component={Link} to="/apps/kanban/backlogs" label={value === 1 ? "Backlogs" : "View as Backlog"} {...a11yProps(1)} />
					</Tabs>
				</Grid>
				<Grid item xs={12}>
					<Outlet />
				</Grid>
			</Grid>
		</Box>
	);
}
