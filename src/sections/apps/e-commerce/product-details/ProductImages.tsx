import { useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, CardMedia, Grid, Stack, useMediaQuery } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// third-party
import Slider from "react-slick";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// assets
import { ArrowLeft2, ArrowRight2, ArrowRotateRight, Heart, SearchZoomIn, SearchZoomOut } from "iconsax-react";

import prod1 from "assets/images/e-commerce/prod-1.png";
import prod2 from "assets/images/e-commerce/prod-2.png";
import prod3 from "assets/images/e-commerce/prod-3.png";
import prod4 from "assets/images/e-commerce/prod-4.png";
import prod5 from "assets/images/e-commerce/prod-5.png";
import prod6 from "assets/images/e-commerce/prod-6.png";
import prod7 from "assets/images/e-commerce/prod-7.png";
import prod8 from "assets/images/e-commerce/prod-8.png";
import prod9 from "assets/images/e-commerce/prod-9.png";

// types
import { ThemeMode } from "types/config";

const prodImage = require.context("assets/images/e-commerce", true);

// ==============================|| PRODUCT DETAILS - IMAGES ||============================== //

const ProductImages = () => {
	const { product } = useSelector((state) => state.product);

	const theme = useTheme();
	const products = [prod1, prod2, prod3, prod4, prod5, prod6, prod7, prod8, prod9];

	const matchDownLG = useMediaQuery(theme.breakpoints.up("lg"));
	const initialImage = product && product?.image ? prodImage(`./${product.image}`) : "";

	const [selected, setSelected] = useState(initialImage);
	const [modal, setModal] = useState(false);

	const [wishlisted, setWishlisted] = useState<boolean>(false);
	const addToFavourite = () => {
		setWishlisted(!wishlisted);
		dispatch(
			openSnackbar({
				open: true,
				message: "Added to favourites",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: false,
			}),
		);
	};

	const lgNo = matchDownLG ? 5 : 4;

	const ArrowUp = ({ currentSlide, slideCount, ...props }: any) => (
		<Box
			{...props}
			className={"prev" + (currentSlide === 0 ? " slick-disabled" : "")}
			aria-hidden="true"
			aria-disabled={currentSlide === 0 ? true : false}
			color="secondary"
			sx={{ cursor: "pointer", borderRadius: 1 }}
		>
			<ArrowLeft2 style={{ color: theme.palette.secondary.light }} />
		</Box>
	);

	const ArrowDown = ({ currentSlide, slideCount, ...props }: any) => (
		<Box
			{...props}
			color="secondary"
			className={"next" + (currentSlide === slideCount - 1 ? " slick-disabled" : "")}
			aria-hidden="true"
			aria-disabled={currentSlide === slideCount - 1 ? true : false}
			sx={{ cursor: "pointer", borderRadius: 1, p: 0.75 }}
		>
			<ArrowRight2 size={18} style={{ color: theme.palette.secondary[400] }} />
		</Box>
	);

	const settings = {
		rows: 1,
		// vertical: !matchDownMD,
		// verticalSwiping: !matchDownMD,
		dots: false,
		centerMode: true,
		swipeToSlide: true,
		focusOnSelect: true,
		centerPadding: "0px",
		slidesToShow: products.length > 3 ? lgNo : products.length,
		prevArrow: <ArrowUp />,
		nextArrow: <ArrowDown />,
	};

	return (
		<>
			<Grid container spacing={0.5}>
				<Grid item xs={12}>
					<MainCard
						content={false}
						border={false}
						boxShadow={false}
						sx={{
							m: "0 auto",
							height: "100%",
							display: "flex",
							alignItems: "center",
							bgcolor: theme.palette.mode === ThemeMode.DARK ? "secondary.lighter" : "secondary.200",
							"& .react-transform-wrapper": { cursor: "crosshair", height: "100%" },
							"& .react-transform-component": { height: "100%" },
						}}
					>
						<TransformWrapper initialScale={1}>
							{({ zoomIn, zoomOut, resetTransform, ...rest }) => (
								<>
									<TransformComponent>
										<CardMedia
											onClick={() => setModal(!modal)}
											component="img"
											image={selected}
											title="Scroll Zoom"
											sx={{ borderRadius: `4px`, position: "relative" }}
										/>
									</TransformComponent>
									<Stack direction="row" className="tools" sx={{ position: "absolute", bottom: 10, right: 10, zIndex: 1 }}>
										<IconButton color="secondary" onClick={() => zoomIn()}>
											<SearchZoomIn style={{ fontSize: "1.15rem" }} />
										</IconButton>
										<IconButton color="secondary" onClick={() => zoomOut()}>
											<SearchZoomOut style={{ fontSize: "1.15rem" }} />
										</IconButton>
										<IconButton color="secondary" onClick={() => resetTransform()}>
											<ArrowRotateRight style={{ fontSize: "1.15rem" }} />
										</IconButton>
									</Stack>
								</>
							)}
						</TransformWrapper>
						<IconButton
							color="secondary"
							sx={{
								ml: "auto",
								position: "absolute",
								top: 12,
								right: 12,
								"&:hover": { background: "transparent" },
							}}
							onClick={addToFavourite}
						>
							{wishlisted ? <Heart variant="Bold" style={{ color: theme.palette.error.main }} /> : <Heart />}
						</IconButton>
					</MainCard>
				</Grid>
				<Grid item xs={12}>
					<Box sx={{ "& .slick-slider": { display: "flex", alignItems: "center", mt: 2 } }}>
						<Slider {...settings}>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item, index) => (
								<Box key={index} onClick={() => setSelected(prodImage(`./prod-${item}.png`))} sx={{ p: 1 }}>
									<Avatar
										size={matchDownLG ? "xl" : "md"}
										src={prodImage(`./thumbs/prod-${item}.png`)}
										variant="rounded"
										sx={{
											m: "0 auto",
											cursor: "pointer",
											bgcolor: theme.palette.secondary[200],
										}}
									/>
								</Box>
							))}
						</Slider>
					</Box>
				</Grid>
			</Grid>
		</>
	);
};

export default ProductImages;
