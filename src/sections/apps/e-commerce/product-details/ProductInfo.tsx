import { useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Button,
	ButtonBase,
	Chip,
	FormControlLabel,
	FormHelperText,
	Grid,
	Radio,
	RadioGroup,
	Rating,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";

// third-party
import { useFormik, Form, FormikProvider } from "formik";
import * as yup from "yup";

// types
import { ColorsOptionsProps, Products } from "types/e-commerce";

// project-imports
import ColorOptions from "../products/ColorOptions";
import Avatar from "components/@extended/Avatar";
import { dispatch, useSelector } from "store";
import { addProduct } from "store/reducers/cart";
import { openSnackbar } from "store/reducers/snackbar";

// assets
import { Add, Minus, ShopAdd, ShoppingCart } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// product color select
function getColor(color: string) {
	return ColorOptions.filter((item) => item.value === color);
}

const validationSchema = yup.object({
	color: yup.string().required("Color selection is required"),
});

// ==============================|| COLORS OPTION ||============================== //

const Colors = ({ checked, colorsData }: { checked?: boolean; colorsData: ColorsOptionsProps[] }) => {
	const theme = useTheme();
	return (
		<Grid item>
			<Tooltip title={colorsData.length && colorsData[0] && colorsData[0].label ? colorsData[0].label : ""}>
				<ButtonBase
					sx={{
						borderRadius: "50%",
						"&:focus-visible": {
							outline: `2px solid ${theme.palette.secondary.dark}`,
							outlineOffset: 2,
						},
					}}
				>
					<Avatar
						color="inherit"
						size="sm"
						sx={{
							bgcolor: colorsData[0]?.bg,
							color: theme.palette.mode === ThemeMode.DARK ? "secondary.800" : "secondary.lighter",
							border: "3px solid",
							borderColor: checked ? theme.palette.secondary.light : theme.palette.background.paper,
						}}
					>
						{" "}
					</Avatar>
				</ButtonBase>
			</Tooltip>
		</Grid>
	);
};

// ==============================|| PRODUCT DETAILS - INFORMATION ||============================== //

const ProductInfo = ({ product }: { product: Products }) => {
	const theme = useTheme();
	const history = useNavigate();

	const [value, setValue] = useState<number>(1);
	const cart = useSelector((state) => state.cart);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			id: product.id,
			name: product.name,
			image: product.image,
			salePrice: product.salePrice,
			offerPrice: product.offerPrice,
			color: "",
			size: "",
			quantity: 1,
		},
		validationSchema,
		onSubmit: (values) => {
			values.quantity = value;
			dispatch(addProduct(values, cart.checkout.products));
			dispatch(
				openSnackbar({
					open: true,
					message: "Submit Success",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);

			history("/apps/e-commerce/checkout");
		},
	});

	const { errors, values, handleSubmit, handleChange } = formik;

	const addCart = () => {
		values.color = values.color ? values.color : "primaryDark";
		values.quantity = value;
		dispatch(addProduct(values, cart.checkout.products));
		dispatch(
			openSnackbar({
				open: true,
				message: "Add To Cart Success",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: false,
			}),
		);
	};

	return (
		<Stack spacing={1}>
			<Stack direction="row" spacing={1} alignItems="center">
				<Rating name="simple-controlled" value={product.rating} precision={0.1} readOnly />
				<Typography color="textSecondary">({product.rating?.toFixed(1)})</Typography>
			</Stack>
			<Typography variant="h3">{product.name}</Typography>
			<Chip
				size="small"
				label={product.isStock ? "In Stock" : "Out of Stock"}
				sx={{
					width: "fit-content",
					borderRadius: "4px",
					color: product.isStock ? "success.main" : "error.main",
					bgcolor: product.isStock ? "success.lighter" : "error.lighter",
				}}
			/>
			<Typography color="textSecondary">{product.about}</Typography>
			<FormikProvider value={formik}>
				<Form autoComplete="off" noValidate onSubmit={handleSubmit}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Stack spacing={1}>
								<Typography color="textSecondary">Color</Typography>
								<RadioGroup row value={values.color} onChange={handleChange} aria-label="colors" name="color" id="color">
									{product.colors &&
										product.colors.map((item, index) => {
											const colorsData = getColor(item);
											return (
												<FormControlLabel
													key={index}
													value={item}
													control={
														<Radio
															sx={{ p: 0.25 }}
															checkedIcon={<Colors checked colorsData={colorsData} />}
															icon={<Colors colorsData={colorsData} />}
														/>
													}
													label=""
													sx={{ ml: -0.25 }}
												/>
											);
										})}
								</RadioGroup>
								{errors.color && (
									<FormHelperText error id="standard-label-color">
										{errors.color}
									</FormHelperText>
								)}
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack justifyContent="flex-end" spacing={1}>
								<Typography color="textSecondary">Quantity</Typography>
								<Stack direction="row">
									<TextField
										name="rty-incre"
										value={value > 0 ? value : ""}
										onChange={(e: any) => setValue(Number(e.target.value))}
										sx={{
											"& .MuiOutlinedInput-input": { p: 1.75 },
											width: "33%",
											"& .MuiOutlinedInput-root": { borderRadius: 0 },
										}}
									/>
									<Stack>
										<Button
											key="one"
											color="secondary"
											variant="outlined"
											onClick={() => setValue(value + 1)}
											sx={{
												px: 0.25,
												py: 0.25,
												minWidth: "0px !important",
												borderRadius: 0,
												borderLeft: "none",
												borderColor: theme.palette.secondary[400],
												"&:hover": {
													borderLeft: "none",
													borderColor: theme.palette.secondary[400],
												},
												"&.Mui-disabled": {
													borderLeft: "none",
													borderColor: theme.palette.secondary.light,
												},
											}}
										>
											<Add />
										</Button>
										<Button
											key="three"
											color="secondary"
											variant="outlined"
											disabled={value <= 1}
											onClick={() => setValue(value - 1)}
											sx={{
												px: 0.5,
												py: 0.35,
												minWidth: "0px !important",
												borderRadius: 0,
												borderTop: "none",
												borderLeft: "none",
												borderColor: theme.palette.secondary[400],
												"&:hover": {
													borderTop: "none",
													borderLeft: "none",
													borderColor: theme.palette.secondary[400],
												},
												"&.Mui-disabled": {
													borderTop: "none",
													borderLeft: "none",
													borderColor: theme.palette.secondary.light,
												},
											}}
										>
											<Minus />
										</Button>
									</Stack>
								</Stack>
								{value === 0 && (
									<FormHelperText sx={{ color: theme.palette.error.main }}>Please select quantity more than 0</FormHelperText>
								)}
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack direction="row" alignItems="center" spacing={1}>
								<Typography variant="h3">${product.offerPrice}</Typography>
								{product.salePrice && (
									<Typography variant="h4" color="textSecondary" sx={{ textDecoration: "line-through", opacity: 0.5, fontWeight: 400 }}>
										${product.salePrice}
									</Typography>
								)}
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
								<Button
									type="submit"
									disabled={value < 1 || !product.isStock}
									color="primary"
									variant="contained"
									size="large"
									startIcon={<ShoppingCart />}
								>
									{!product.isStock ? "Sold Out" : "Buy Now"}
								</Button>

								{product.isStock && value > 0 && (
									<Button color="secondary" variant="outlined" size="large" onClick={addCart} startIcon={<ShopAdd variant="Bold" />}>
										Add to Cart
									</Button>
								)}
							</Stack>
						</Grid>
					</Grid>
				</Form>
			</FormikProvider>
		</Stack>
	);
};

export default ProductInfo;
