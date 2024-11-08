// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Grid, Chip, Rating, Stack, TableCell, TableRow, Typography } from "@mui/material";

const productImage = require.context("assets/images/e-commerce", true);

// ==============================|| PRODUCT - VIEW ||============================== //

const ProductView = ({ data }: any) => {
	const theme = useTheme();

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` } }}>
			<TableCell colSpan={8} sx={{ p: 2.5 }}>
				<Grid container spacing={2.5} sx={{ pl: { xs: 0, sm: 5, md: 6, lg: 10, xl: 12 } }}>
					<Grid item xs={6} sm={5} md={4} lg={3}>
						<Box sx={{ position: "relative" }}>
							<img
								src={data.image && productImage(`./${data.image}`)}
								alt="product"
								style={{ background: theme.palette.secondary[200], width: "100%" }}
							/>
							<Chip
								label={data.isStock ? "In Stock" : "Out of Stock"}
								color={data.isStock ? "success" : "error"}
								size="small"
								sx={{
									position: "absolute",
									right: 8,
									top: 8,
								}}
							/>
						</Box>
					</Grid>
					<Grid item xs={12} sm={7} md={8} lg={9}>
						<Stack spacing={1} sx={{ px: 2 }}>
							<Typography variant="h5">{data?.name}</Typography>
							<Typography color="textSecondary">{data?.about}</Typography>
							<Rating name="read-only" value={data.rating} readOnly />
							<Box sx={{ width: "80%", pt: 2 }}>
								<Grid container spacing={1}>
									<Grid item xs={4} md={3}>
										<Typography color="textSecondary">Categories</Typography>
									</Grid>
									<Grid item xs={8} md={9}>
										<Stack direction="row" spacing={0.5}>
											{data?.categories?.map((item: any, index: number) => (
												<Typography key={index} variant="h6" sx={{ textTransform: "capitalize" }}>
													{item}
													{data?.categories.length > index + 1 ? "," : ""}
												</Typography>
											))}
										</Stack>
									</Grid>
									<Grid item xs={4} md={3}>
										<Typography color="textSecondary">Qty</Typography>
									</Grid>
									<Grid item xs={8} md={9}>
										<Typography variant="h6">{data?.quantity}</Typography>
									</Grid>
									<Grid item xs={4} md={3}>
										<Typography color="textSecondary">Price</Typography>
									</Grid>
									<Grid item xs={8} md={9}>
										<Typography variant="h5">{data?.salePrice ? `$${data?.salePrice}` : `$${data?.offerPrice}`}</Typography>
									</Grid>
								</Grid>
							</Box>
						</Stack>
					</Grid>
				</Grid>
			</TableCell>
		</TableRow>
	);
};

export default ProductView;
