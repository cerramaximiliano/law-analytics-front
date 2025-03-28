// third-party
import { FormattedMessage } from "react-intl";

// assets
import { Graph, Chart21 } from "iconsax-react";

// type
import { NavItemType } from "types/menu";

// icons
const icons = {
	charts: Chart21,
	chart: Graph,
};

// ==============================|| MENU ITEMS - CHARTS & MAPS ||============================== //

const chartsMap: NavItemType = {
	id: "group-charts-map",
	title: <FormattedMessage id="charts-map" />,
	icon: icons.charts,
	type: "group",
	children: [
		{
			id: "react-chart",
			title: <FormattedMessage id="charts" />,
			type: "collapse",
			icon: icons.chart,
			children: [
				{
					id: "apexchart",
					title: <FormattedMessage id="apexchart" />,
					type: "item",
					url: "/charts/apexchart",
				},
				{
					id: "org-chart",
					title: <FormattedMessage id="org-chart" />,
					type: "item",
					url: "/charts/org-chart",
				},
			],
		},
	],
};

export default chartsMap;
