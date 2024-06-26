import { Link as RouterLink, useParams } from "react-router-dom";
import { dispatch, useSelector } from "store";
import { Skeleton, Button, CardContent, Grid, IconButton, Link, Typography, Stack, Tooltip } from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { ColorProps } from "types/extended";
import { Add, Maximize4, TableDocument, DocumentText, Judge, NotificationStatus, Status } from "iconsax-react";
import ModalMovements from "../modals/ModalMovements";
import { useEffect, useState } from "react";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { fetchMovementsData } from "store/reducers/movements";

interface MovementsProps {
	title: string;
}

const Movements = ({ title }: MovementsProps) => {
	const [open, setOpen] = useState(false);
	const [showAll, setShowAll] = useState(false);

	const { id } = useParams();

	const movementsData = useSelector((state: any) => state.movements);
	const handleOpen = () => {
		if (movementsData.isLoader === true) {
			return;
		} else {
			setOpen(true);
		}
	};
	useEffect(() => {
		if (id) {
			const fetchData = async () => {
				await dispatch(fetchMovementsData(id));
			};
			fetchData();
		}
	}, [id, dispatch]);

	const toggleShowAll = () => {
		setShowAll((prevShowAll) => !prevShowAll);
	};
	const [parent] = useAutoAnimate({ duration: 200 });

	// Función para obtener el icono y color basados en la propiedad movement
	const getIconAndColor = (movement?: string): { icon: React.ReactElement; color: ColorProps } => {
		switch (movement) {
			case "Escrito-Actor":
				return { icon: <DocumentText />, color: "success" };
			case "Escrito-Demandado":
				return { icon: <DocumentText />, color: "error" };
			case "Despacho":
				return { icon: <Judge />, color: "secondary" };
			case "Cédula":
			case "Oficio":
				return { icon: <NotificationStatus />, color: "primary" };
			case "Evento":
				return { icon: <Status />, color: "warning" };
			default:
				return { icon: <TableDocument />, color: "default" };
		}
	};
	const displayedMovements = showAll ? movementsData.movements : movementsData.movements.slice(0, 2);

	return (
		<MainCard
			title={title}
			content={false}
			secondary={
				<>
					<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleOpen}>
						<Add />
					</IconButton>
					<IconButton color="secondary" sx={{ color: "secondary.darker" }}>
						<Maximize4 />
					</IconButton>
				</>
			}
		>
			<ModalMovements open={open} setOpen={setOpen} folderId={id} />
			{movementsData.isLoader ? (
				<>
					<CardContent>
						<Stack direction={"row"}>
							<Grid>
								<Skeleton width={80} />
								<Skeleton width={80} />
								<Skeleton width={80} />
							</Grid>
							<Grid>
								<Skeleton variant="rectangular" width={32} height={32} style={{ marginTop: 20, marginLeft: 10, marginRight: 10 }} />
							</Grid>
							<Grid>
								<Skeleton width={80} />
								<Skeleton width={80} />
								<Skeleton width={80} />
							</Grid>
						</Stack>
						<Grid height={50}></Grid>
						<Stack direction={"row"}>
							<Grid>
								<Skeleton width={80} />
								<Skeleton width={80} />
								<Skeleton width={80} />
							</Grid>
							<Grid>
								<Skeleton variant="rectangular" width={32} height={32} style={{ marginTop: 20, marginLeft: 10, marginRight: 10 }} />
							</Grid>
							<Grid>
								<Skeleton width={80} />
								<Skeleton width={80} />
								<Skeleton width={80} />
							</Grid>
						</Stack>
					</CardContent>
				</>
			) : (
				<CardContent>
					{movementsData.movements.length > 0 ? (
						<SimpleBar
							sx={{
								overflowX: "hidden",
								maxHeight: "350px",
								overflowY: "auto",
							}}
						>
							<Grid
								container
								spacing={3}
								alignItems="center"
								sx={{
									position: "relative",
									"&>*": {
										position: "relative",
										zIndex: "5",
									},
									"&:after": {
										content: '""',
										position: "absolute",
										top: 8,
										left: 114,
										width: 2,
										height: "100%",
										bgcolor: "divider",
										zIndex: "1",
									},
								}}
								ref={parent}
							>
								{displayedMovements.map((message: any, index: any) => {
									const { icon, color } = getIconAndColor(message.movement);
									return (
										<Grid item xs={12} key={index}>
											<Grid container spacing={2}>
												<Grid item>
													<Grid container spacing={2} alignItems="center">
														<Grid item xs zeroMinWidth>
															<Stack>
																<Typography align="left" variant="caption" color="secondary">
																	{message.time}
																</Typography>
															</Stack>
														</Grid>
														<Grid item>
															<Avatar color={color}>
																<Tooltip title={message.movement}>{icon}</Tooltip>
															</Avatar>
														</Grid>
													</Grid>
												</Grid>
												<Grid item xs zeroMinWidth>
													<Grid container spacing={1}>
														<Grid item xs={12}>
															<Typography component="div" align="left" variant="subtitle1">
																{message.title}
															</Typography>
															<Typography color="secondary" align="left" variant="caption">
																{message.description}{" "}
																{message.link && (
																	<Link component={RouterLink} to={message.link} underline="hover">
																		{message.link}
																	</Link>
																)}
															</Typography>
														</Grid>
													</Grid>
												</Grid>
											</Grid>
										</Grid>
									);
								})}
							</Grid>
						</SimpleBar>
					) : (
						<>
							<Grid container justifyContent="center">
								<Avatar color="error" variant="rounded">
									<TableDocument variant="Bold" />
								</Avatar>
							</Grid>
							<Typography variant="body1" color="text.secondary" align="center">
								No hay movimientos.
							</Typography>
						</>
					)}
					<Grid marginTop={2}>
						<Button variant="outlined" fullWidth color="secondary" onClick={toggleShowAll} disabled={movementsData.movements.length === 0}>
							{showAll ? "Ver Menos" : "Ver Todos"}
						</Button>
					</Grid>
				</CardContent>
			)}
		</MainCard>
	);
};

export default Movements;
