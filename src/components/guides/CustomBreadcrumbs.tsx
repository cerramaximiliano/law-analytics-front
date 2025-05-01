import { Link } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Grid, Typography } from "@mui/material";
import MuiBreadcrumbs from "@mui/material/Breadcrumbs";

// assets
import { ArrowRight2, Home3 } from "iconsax-react";

// ==============================|| CUSTOM BREADCRUMBS ||============================== //

export interface BreadcrumbItem {
	title: string;
	to?: string;
}

interface CustomBreadcrumbsProps {
	items: BreadcrumbItem[];
}

const CustomBreadcrumbs = ({ items }: CustomBreadcrumbsProps) => {
	const theme = useTheme();

	const iconSX = {
		marginRight: theme.spacing(0.75),
		marginTop: `-${theme.spacing(0.25)}`,
		width: "1rem",
		height: "1rem",
		color: theme.palette.secondary.main,
	};

	return (
		<Grid container direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={0.5}>
			<Grid item>
				<MuiBreadcrumbs aria-label="breadcrumb" maxItems={8} separator={<ArrowRight2 size={12} />}>
					{items.map((item, index) => {
						if (index === 0) {
							return (
								<Typography
									key={index}
									component={Link}
									to={item.to || "/"}
									variant="h6"
									sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}
									color="textPrimary"
								>
									{index === 0 && <Home3 style={iconSX} />}
									{item.title}
								</Typography>
							);
						} else if (index === items.length - 1) {
							return (
								<Typography key={index} variant="h6" color="secondary" sx={{ display: "flex", alignItems: "center" }}>
									{item.title}
								</Typography>
							);
						} else {
							return (
								<Typography
									key={index}
									component={Link}
									to={item.to || "#"}
									variant="h6"
									sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}
									color="secondary"
								>
									{item.title}
								</Typography>
							);
						}
					})}
				</MuiBreadcrumbs>
			</Grid>
		</Grid>
	);
};

export default CustomBreadcrumbs;
