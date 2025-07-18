// material-ui
import { Box, FormControl, InputAdornment, OutlinedInput } from "@mui/material";

// project imports
import { useDispatch } from "store";
import { openSearch } from "store/reducers/search";

// assets
import { SearchNormal1 } from "iconsax-react";

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

const Search = () => {
	const dispatch = useDispatch();

	const handleClick = () => {
		dispatch(openSearch());
	};

	return (
		<Box sx={{ width: "100%", ml: { xs: 0, md: 2 } }}>
			<FormControl sx={{ width: { xs: "100%", md: 224 } }}>
				<OutlinedInput
					id="header-search"
					startAdornment={
						<InputAdornment position="start" sx={{ mr: -0.5 }}>
							<SearchNormal1 size={16} />
						</InputAdornment>
					}
					aria-describedby="header-search-text"
					inputProps={{
						"aria-label": "weight",
					}}
					placeholder="Ctrl + K"
					sx={{
						"& .MuiOutlinedInput-input": { p: 1.5 },
						cursor: "pointer",
					}}
					onClick={handleClick}
					readOnly
				/>
			</FormControl>
		</Box>
	);
};

export default Search;
