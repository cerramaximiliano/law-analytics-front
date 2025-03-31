// Movements.tsx
import { Link as RouterLink, useParams } from "react-router-dom";
import { dispatch, useSelector } from "store";
import {
	Skeleton,
	Button,
	CardContent,
	Grid,
	IconButton,
	Link,
	Typography,
	Stack,
	Tooltip,
	Box,
	Chip,
	useTheme,
	Paper,
	Badge,
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { ColorProps } from "types/extended";
import {
	Add,
	TableDocument,
	DocumentText,
	Judge,
	NotificationStatus,
	Status,
	Link2,
	ArrowUp,
	ArrowDown,
	Edit,
	Trash,
	Calendar,
} from "iconsax-react";
import ModalMovements from "../modals/ModalMovements";
import { useEffect, useState } from "react";
import SimpleBar from "components/third-party/SimpleBar";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getMovementsByFolderId } from "store/reducers/movements";
import { es } from "date-fns/locale";
import { parse, format } from "date-fns";
import AlertMemberDelete from "../modals/alertMemberDelete";
import { Movement } from "types/movements";

interface MovementsProps {
	title: string;
	folderName?: string;
}

const parseDate = (dateString: string) => {
	try {
		return parse(dateString, "dd/MM/yyyy", new Date());
	} catch (error) {
		return new Date(0);
	}
};

const formatDate = (dateString: string) => {
	try {
		const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		return format(parsedDate, "dd/MM/yyyy", { locale: es });
	} catch (error) {
		return dateString;
	}
};

const EmptyState = () => (
	<Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "transparent" }}>
		<Stack spacing={3} alignItems="center">
			<Avatar
				color="error"
				variant="rounded"
				sx={{
					width: 80,
					height: 80,
					bgcolor: "error.lighter",
					transition: "transform 0.3s ease-in-out",
					"&:hover": {
						transform: "scale(1.1)",
					},
				}}
			>
				<TableDocument variant="Bulk" size={40} />
			</Avatar>
			<Box>
				<Typography variant="h5" gutterBottom>
					No hay movimientos registrados
				</Typography>
				<Typography variant="body2" color="textSecondary">
					Comienza agregando un nuevo movimiento usando el botón +
				</Typography>
			</Box>
		</Stack>
	</Paper>
);

const MovementsLoader = () => (
	<Stack spacing={3} px={3}>
		{[1, 2].map((item) => (
			<Paper key={item} elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
				<Stack direction="row" spacing={3} alignItems="flex-start">
					<Stack spacing={1} alignItems="center" width={100}>
						<Skeleton width={70} height={20} />
						<Skeleton variant="circular" width={48} height={48} />
					</Stack>
					<Stack spacing={1.5} flex={1}>
						<Skeleton variant="text" width="70%" height={28} />
						<Skeleton variant="text" width="90%" height={20} />
						<Skeleton variant="rounded" width="40%" height={32} />
					</Stack>
				</Stack>
			</Paper>
		))}
	</Stack>
);

const Movements = ({ title, folderName = "" }: MovementsProps) => {
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

	const sortedMovements = [...movementsData.movements].sort((a, b) => {
		const dateA = parseDate(a.time);
		const dateB = parseDate(b.time);
		return dateB.getTime() - dateA.getTime();
	});

	const displayedMovements = showAll ? sortedMovements : sortedMovements.slice(0, 2);

	const MovementItem = ({ message, isFirst, isLast }: any) => {
		const { icon, color } = getIconAndColor(message.movement);
		const isSelected = selectedMovementId === message._id;
		const hasExpiration = !!message.dateExpiration;
		const badgeColor = color === "inherit" ? "default" : color;

		return (
			<Grid item xs={12}>
				<Paper
					elevation={isSelected ? 2 : 0}
					onClick={() => handleMovementSelect(message._id)}
					sx={{
						p: 2.5,
						transition: "all 0.3s ease-in-out",
						cursor: "pointer",
						position: "relative",
						bgcolor: isSelected ? "primary.lighter" : "background.paper",
						borderLeft: `4px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
						"&:hover": {
							bgcolor: isSelected ? "primary.lighter" : "action.hover",
							transform: "translateX(4px)",
							boxShadow: theme.shadows[2],
						},
					}}
				>
					<Grid container spacing={3}>
						<Grid item>
							<Stack spacing={1} alignItems="center">
								<Typography
									variant="caption"
									color="secondary"
									sx={{
										fontWeight: 500,
										bgcolor: "secondary.lighter",
										px: 1.5,
										py: 0.5,
										borderRadius: 1,
										whiteSpace: "nowrap",
									}}
								>
									{formatDate(message.time)}
								</Typography>
								<Badge
									variant="dot"
									color={badgeColor}
									invisible={!isFirst}
									sx={{
										"& .MuiBadge-badge": {
											top: -4,
											right: -4,
										},
									}}
								>
									<Avatar
										color={color}
										sx={{
											width: 48,
											height: 48,
											transition: "transform 0.2s ease",
											"&:hover": {
												transform: "scale(1.1)",
											},
										}}
									>
										<Tooltip title={message.movement}>{icon}</Tooltip>
									</Avatar>
								</Badge>
							</Stack>
						</Grid>
						<Grid item xs>
							<Stack spacing={1.5}>
								<Typography
									variant="h6"
									sx={{
										fontSize: "1.1rem",
										fontWeight: isSelected ? 600 : 500,
									}}
								>
									{message.title}
								</Typography>
								{message.description && (
									<Typography
										color="textSecondary"
										sx={{
											fontSize: "0.95rem",
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
										}}
									>
										{message.description}
									</Typography>
								)}
								<Stack direction="row" spacing={2} alignItems="center">
									{message.link && (
										<Link
											component={RouterLink}
											to={message.link}
											underline="none"
											onClick={(e) => e.stopPropagation()}
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 1,
												color: "primary.main",
												fontSize: "0.9rem",
												fontWeight: 500,
												px: 2,
												py: 0.75,
												borderRadius: 1,
												bgcolor: "primary.lighter",
												transition: "all 0.2s ease",
												"&:hover": {
													bgcolor: "primary.light",
													transform: "translateY(-2px)",
												},
											}}
										>
											<Link2 size={18} />
											Ver documento
										</Link>
									)}
									{hasExpiration && (
										<Chip
											icon={<Calendar variant="Bold" size={16} />}
											label={`Vence: ${formatDate(message.dateExpiration)}`}
											color="warning"
											variant="outlined"
											size="small"
											sx={{
												borderRadius: 1,
												"& .MuiChip-label": {
													px: 1,
													fontSize: "0.85rem",
												},
											}}
										/>
									)}
								</Stack>
							</Stack>
						</Grid>
					</Grid>
				</Paper>
			</Grid>
		);
	};

	const FooterActions = () => (
		<Paper
			elevation={0}
			sx={{
				mt: 3,
				pt: 2,
				px: 2,
				pb: 2,
				borderTop: `1px solid ${theme.palette.divider}`,
				bgcolor: "background.default",
				borderBottomLeftRadius: theme.shape.borderRadius,
				borderBottomRightRadius: theme.shape.borderRadius,
			}}
		>
			<Stack direction="row" spacing={2} alignItems="center">
				<Button
					variant="outlined"
					color="secondary"
					onClick={toggleShowAll}
					endIcon={showAll ? <ArrowUp /> : <ArrowDown />}
					sx={{
						flexGrow: 1,
						py: 1,
						fontWeight: 500,
						borderWidth: 1.5,
						"&:hover": {
							borderWidth: 1.5,
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
							size="medium"
							onClick={() => {
								const movement = movementsData.movements.find((m: Movement) => m._id === selectedMovementId);
								if (movement) handleEditClick(movement);
							}}
							sx={{
								border: `1.5px solid ${theme.palette.primary.main}`,
								"&:hover": {
									bgcolor: "primary.lighter",
								},
							}}
						>
							<Edit variant="Bulk" size={20} />
						</IconButton>
					</span>
				</Tooltip>

				<Tooltip title={selectedMovementId ? "Eliminar movimiento" : "Seleccione un movimiento para eliminar"}>
					<span>
						<IconButton
							color="error"
							disabled={!selectedMovementId}
							size="medium"
							onClick={(e) => {
								e.stopPropagation();
								handleClose();
								setOpenModal(!openModal);
							}}
							sx={{
								border: `1.5px solid ${theme.palette.error.main}`,
								"&:hover": {
									bgcolor: "error.lighter",
								},
							}}
						>
							<Trash variant="Bulk" size={20} />
						</IconButton>
					</span>
				</Tooltip>
			</Stack>
		</Paper>
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
						<IconButton onClick={handleOpen} disabled={movementsData.isLoader} color="secondary" sx={{ color: "secondary.darker" }}>
							<Add />
						</IconButton>
					</Tooltip>
				</Stack>
			}
			sx={{
				"& .MuiCardContent-root": {
					p: 0,
				},
			}}
		>
			<ModalMovements
				open={open}
				setOpen={setOpen}
				folderId={id}
				editMode={!!editMovement}
				movementData={editMovement}
				folderName={folderName}
			/>
			<AlertMemberDelete title="" open={openModal} handleClose={handleClose} id={selectedMovementId} />
			<CardContent sx={{ p: 3 }}>
				{movementsData.isLoader ? (
					<MovementsLoader />
				) : movementsData.movements.length > 0 ? (
					<>
						<SimpleBar
							sx={{
								height: `${containerHeight}px`,
								transition: "height 0.3s ease-in-out",
								pr: 2,
								mr: -2,
								"& .simplebar-track.simplebar-vertical": {
									width: 8,
								},
								"& .simplebar-scrollbar:before": {
									background: theme.palette.secondary.lighter,
								},
							}}
						>
							<Grid container spacing={2} ref={parent}>
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
