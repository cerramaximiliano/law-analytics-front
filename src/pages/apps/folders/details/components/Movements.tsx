//Movements.tsx
import { Link as RouterLink, useParams } from "react-router-dom";
import { dispatch, useSelector } from "store";
import { Skeleton, Button, CardContent, Grid, IconButton, Link, Typography, Stack, Tooltip, Box, Chip, useTheme } from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { ColorProps } from "types/extended";
import { Add, TableDocument, DocumentText, Judge, NotificationStatus, Status, Link2, ArrowUp, ArrowDown, Edit, Trash } from "iconsax-react";
import ModalMovements from "../modals/ModalMovements";
import { useEffect, useState } from "react";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getMovementsByFolderId } from "store/reducers/movements";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AlertMemberDelete from "../modals/alertMemberDelete";

import { Movement } from "types/movements";

interface MovementsProps {
	title: string;
}

const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString);
		return format(date, "d 'de' MMMM, yyyy", { locale: es });
	} catch (error) {
		return dateString;
	}
};

const EmptyState = () => (
	<Stack spacing={2} alignItems="center" py={4}>
		<Avatar
			color="error"
			variant="rounded"
			sx={{
				width: 64,
				height: 64,
				bgcolor: "error.lighter",
			}}
		>
			<TableDocument variant="Bold" size={32} />
		</Avatar>
		<Typography variant="subtitle1" color="textSecondary" align="center">
			No hay movimientos registrados
		</Typography>
		<Typography variant="body2" color="textSecondary" align="center">
			Comienza agregando un nuevo movimiento usando el botón +
		</Typography>
	</Stack>
);

const MovementsLoader = () => (
	<Stack spacing={3} px={2}>
		{[1, 2].map((item) => (
			<Stack key={item} direction="row" spacing={2} alignItems="flex-start">
				<Stack spacing={1} alignItems="center" width={100}>
					<Skeleton width={60} height={16} />
					<Skeleton variant="circular" width={40} height={40} />
				</Stack>
				<Stack spacing={1} flex={1}>
					<Skeleton variant="text" width="60%" height={24} />
					<Skeleton variant="text" width="90%" height={16} />
					<Skeleton variant="text" width="40%" height={16} />
				</Stack>
			</Stack>
		))}
	</Stack>
);

const Movements = ({ title }: MovementsProps) => {
	const theme = useTheme();
	const [open, setOpen] = useState<boolean>(false);

	const [openModal, setOpenModal] = useState(false);

	const [editMovement, setEditMovement] = useState<Movement | null>(null);

	const [showAll, setShowAll] = useState(false);
	const [containerHeight, setContainerHeight] = useState(250);
	const [parent] = useAutoAnimate({ duration: 200 });

	const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
	const { id } = useParams();
	const movementsData = useSelector((state: any) => state.movements);

	const handleClose = () => {
		setOpenModal(!openModal);
	};

	const handleOpen = () => {
		if (!movementsData.isLoader) {
			setOpen(true);
		}
	};

	const handleEditClick = (movement: Movement) => {
		setEditMovement(movement);
		setOpen(true);
	};

	const handleMovementSelect = (movementId: string) => {
		setSelectedMovementId((currentId) => (currentId === movementId ? null : movementId));
	};

	useEffect(() => {
		if (id) {
			const fetchData = async () => {
				await dispatch(getMovementsByFolderId(id));
			};
			fetchData();
		}
	}, [id]);

	const toggleShowAll = () => {
		setShowAll((prev) => !prev);
		setContainerHeight((prev) => (prev === 250 ? movementsData.movements.length * 110 : 250));
	};

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

	const MovementItem = ({ message, isFirst, isLast }: any) => {
		const { icon, color } = getIconAndColor(message.movement);
		const isSelected = selectedMovementId === message._id;

		return (
			<Grid item xs={12}>
				<Box
					onClick={() => handleMovementSelect(message._id)}
					sx={{
						p: 2,
						transition: "all 0.3s ease-in-out",
						borderRadius: 1,
						cursor: "pointer",
						position: "relative",
						bgcolor: isSelected ? "primary.lighter" : "transparent",
						borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : "4px solid transparent",
						"&:hover": {
							bgcolor: isSelected ? "primary.lighter" : "action.hover",
							transform: "translateX(4px)",
						},
					}}
				>
					<Grid container spacing={2}>
						<Grid item>
							<Stack spacing={0.5} alignItems="center">
								<Typography variant="caption" color="secondary" sx={{ whiteSpace: "nowrap" }}>
									{formatDate(message.time)}
								</Typography>
								<Avatar
									color={color}
									sx={{
										position: "relative",
										"&:after": {
											content: '""',
											position: "absolute",
											width: 10,
											height: 10,
											borderRadius: "50%",
											bgcolor: `${color}.main`,
											top: -5,
											right: -5,
											display: isFirst ? "block" : "none",
										},
									}}
								>
									<Tooltip title={message.movement}>{icon}</Tooltip>
								</Avatar>
							</Stack>
						</Grid>
						<Grid item xs>
							<Stack spacing={1}>
								<Typography variant="subtitle1">{message.title}</Typography>
								{message.description && (
									<Typography
										color="textSecondary"
										variant="body2"
										sx={{
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
										}}
									>
										{message.description}
									</Typography>
								)}
								{message.link && (
									<Link
										component={RouterLink}
										to={message.link}
										underline="hover"
										onClick={(e) => e.stopPropagation()}
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.5,
											color: "primary.main",
											"&:hover": {
												color: "primary.dark",
											},
										}}
									>
										<Link2 size={16} />
										Ver documento
									</Link>
								)}
								{message.dateExpiration && (
									<Chip
										size="small"
										label={`Vence: ${formatDate(message.dateExpiration)}`}
										color="warning"
										variant="outlined"
										sx={{ alignSelf: "flex-start" }}
									/>
								)}
							</Stack>
						</Grid>
					</Grid>
				</Box>
			</Grid>
		);
	};

	const FooterActions = () => (
		<Box
			sx={{
				mt: 2,
				pt: 2,
				borderTop: 1,
				borderColor: "divider",
				display: "flex",
				alignItems: "center",
				gap: 2,
			}}
		>
			<Button
				variant="outlined"
				color="secondary"
				onClick={toggleShowAll}
				endIcon={showAll ? <ArrowUp /> : <ArrowDown />}
				sx={{
					flexGrow: 1,
					"&:hover": {
						bgcolor: "secondary.lighter",
					},
				}}
			>
				{showAll ? "Mostrar menos" : `Ver todos (${movementsData.movements.length})`}
			</Button>

			<Tooltip title={selectedMovementId ? "Editar movimiento" : "Seleccione un movimiento para editar"}>
				<span>
					<IconButton
						color="primary"
						disabled={!selectedMovementId}
						size="small"
						onClick={() => {
							const movement = movementsData.movements.find((m: Movement) => m._id === selectedMovementId);
							if (movement) handleEditClick(movement);
						}}
						sx={{
							"&:hover": {
								bgcolor: "primary.lighter",
							},
						}}
					>
						<Edit variant="Bulk" />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip title={selectedMovementId ? "Eliminar movimiento" : "Seleccione un movimiento para eliminar"}>
				<span>
					<IconButton
						color="error"
						disabled={!selectedMovementId}
						size="small"
						sx={{
							"&:hover": {
								bgcolor: "error.lighter",
							},
						}}
						onClick={(e) => {
							e.stopPropagation();
							handleClose();
							setOpenModal(!openModal);
						}}
					>
						<Trash variant="Bulk" />
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);

	useEffect(() => {
		setSelectedMovementId(null);
	}, [movementsData.movements]);

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<Stack direction="row" spacing={1}>
					<Tooltip title="Agregar movimiento">
						<IconButton onClick={handleOpen} disabled={movementsData.isLoader}>
							<Add />
						</IconButton>
					</Tooltip>
				</Stack>
			}
		>
			<ModalMovements open={open} setOpen={setOpen} folderId={id} editMode={!!editMovement} movementData={editMovement} />
			<AlertMemberDelete title={""} open={openModal} handleClose={handleClose} id={selectedMovementId} />
			<CardContent>
				{movementsData.isLoader ? (
					<MovementsLoader />
				) : movementsData.movements.length > 0 ? (
					<>
						<SimpleBar
							sx={{
								overflowX: "hidden",
								height: `${containerHeight}px`,
								transition: "height 0.3s ease-in-out",
								overflowY: "auto",
								pr: 2,
								"& .simplebar-track.simplebar-vertical": {
									width: "8px",
								},
								"& .simplebar-scrollbar:before": {
									background: theme.palette.secondary.lighter,
								},
							}}
						>
							<Grid
								container
								spacing={2}
								sx={{
									position: "relative",
									"&:after": {
										content: '""',
										position: "absolute",
										top: 16,
										left: 120,
										width: 2,
										height: "calc(100% - 32px)",
										background: `linear-gradient(${theme.palette.divider} 50%, transparent 100%)`,
										zIndex: 1,
									},
								}}
								ref={parent}
							>
								{displayedMovements.map((message: any, index: number) => (
									<MovementItem
										key={message._id || index}
										message={message}
										isFirst={index === 0}
										isLast={index === displayedMovements.length - 1}
									/>
								))}
							</Grid>
						</SimpleBar>
						<FooterActions />
					</>
				) : (
					<EmptyState />
				)}
			</CardContent>
		</MainCard>
	);
};

export default Movements;
