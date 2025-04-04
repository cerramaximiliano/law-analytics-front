import { useState, ChangeEvent, MouseEvent } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Button, InputAdornment, Menu, MenuItem, Stack, TextField, useMediaQuery } from "@mui/material";

// types
import { ProductsFilter } from "types/e-commerce";

// project-imports
import SortOptions from "sections/apps/e-commerce/products/SortOptions";
import MainCard from "components/MainCard";

// assets
import { ArrowDown2, FilterSearch, SearchNormal1 } from "iconsax-react";

interface ProductHeaderProps {
	handleDrawerOpen: () => void;
	setFilter: (filter: ProductsFilter) => void;
	filter: ProductsFilter;
}

// ==============================|| PRODUCT - HEADER ||============================== //

const ProductsHeader = ({ filter, handleDrawerOpen, setFilter }: ProductHeaderProps) => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	// sort options
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const openSort = Boolean(anchorEl);
	const handleClickListItem = (event: MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	// search filter
	const handleSearch = async (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | undefined) => {
		const newString = event?.target.value;
		setFilter({ ...filter, search: newString! });
	};

	// sort filter
	const handleMenuItemClick = (event: MouseEvent<HTMLElement>, index: string) => {
		setFilter({ ...filter, sort: index });
		setAnchorEl(null);
	};

	const sortLabel = SortOptions.filter((items) => items.value === filter.sort);

	return (
		<MainCard content={false}>
			<Stack
				direction={matchDownSM ? "column" : "row"}
				alignItems={matchDownSM ? "space-between" : "center"}
				justifyContent={matchDownSM ? "center" : "space-between"}
				sx={{ p: 2 }}
				spacing={2}
			>
				<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
					<Button onClick={handleDrawerOpen} color="secondary" startIcon={<FilterSearch style={{ color: "secondary.200" }} />} size="large">
						Filter
					</Button>

					<TextField
						sx={{ "& .MuiOutlinedInput-input": { pl: 0 } }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} />
								</InputAdornment>
							),
						}}
						value={filter.search}
						placeholder="Search Product"
						size="medium"
						onChange={handleSearch}
					/>
				</Stack>
				<Button
					id="demo-positioned-button"
					aria-controls="demo-positioned-menu"
					aria-haspopup="true"
					aria-expanded={openSort ? "true" : undefined}
					onClick={handleClickListItem}
					variant="outlined"
					size="large"
					color="secondary"
					endIcon={<ArrowDown2 style={{ fontSize: "small" }} />}
					sx={{ color: "text.primary" }}
				>
					{sortLabel.length > 0 && sortLabel[0].label}
				</Button>
				<Menu
					id="demo-positioned-menu"
					aria-labelledby="demo-positioned-button"
					anchorEl={anchorEl}
					open={openSort}
					onClose={handleClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: matchDownSM ? "center" : "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: matchDownSM ? "center" : "right",
					}}
				>
					{SortOptions.map((option, index) => (
						<MenuItem
							sx={{ p: 1.5 }}
							key={index}
							selected={option.value === filter.sort}
							onClick={(event) => handleMenuItemClick(event, option.value)}
						>
							{option.label}
						</MenuItem>
					))}
				</Menu>
			</Stack>
		</MainCard>
	);
};

export default ProductsHeader;
