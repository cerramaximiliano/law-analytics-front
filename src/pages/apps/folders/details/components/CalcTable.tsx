import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import moment from "moment";
import {
	Skeleton,
	Button,
	CardContent,
	Grid,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	IconButton,
	Tooltip,
	Zoom,
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import Avatar from "components/@extended/Avatar";
import { Calculator } from "iconsax-react";
import ModalCalcTable from "../modals/ModalCalcTable";
import ModalCalcData from "../modals/ModalCalcData";
import { dispatch, useSelector } from "store";
import { deleteCalculator, getCalculatorsByFolderId } from "store/reducers/calculator";
import { Trash } from "iconsax-react";
import { enqueueSnackbar } from "notistack";

// types
import { CalculatorType, LoadingContentProps } from "types/calculator";

const formatAmount = (amount: number | null | undefined): string => {
	if (amount == null) return "No Disponible";
	return `$${amount.toLocaleString("es-AR")}`;
};

const LoadingContent = ({ isLoader, content, skeleton }: LoadingContentProps): JSX.Element => (isLoader ? <>{skeleton}</> : <>{content}</>);

const CalcTable = ({ title, folderData }: { title: string; folderData: { folderName: string; monto: number } }) => {
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const { calculators, isLoader } = useSelector((state) => state.calculator);

	const { id } = useParams();
	const [latestOfferedAmount, setLatestOfferedAmount] = useState<number | null>(null);

	const sortedData = useMemo(
		() =>
			calculators.slice().sort((a: CalculatorType, b: CalculatorType) => moment(b.date, "DD/MM/YYYY").diff(moment(a.date, "DD/MM/YYYY"))),
		[calculators],
	);

	useEffect(() => {
		if (id) {
			dispatch(getCalculatorsByFolderId(id));
		}
	}, [id]);

	useEffect(() => {
		const latestOffered = sortedData.find((item: CalculatorType) => item.type === "Ofertado");
		setLatestOfferedAmount(latestOffered?.amount ?? null);
	}, [sortedData]);

	const showEmptyState = !isLoader && sortedData.length === 0;

	const EmptyState = () => (
		<TableRow>
			<TableCell colSpan={4} align="center">
				<Stack spacing={2} alignItems="center" py={4}>
					<Avatar color="error" variant="rounded" sx={{ width: 64, height: 64, bgcolor: "error.lighter" }}>
						<Calculator variant="Bold" />
					</Avatar>
					<Typography variant="subtitle1" color="textSecondary" align="center">
						No hay datos disponibles
					</Typography>
					<Typography variant="body2" color="textSecondary" align="center">
						Comienza agregando un nuevo elemento usando el botón Agregar
					</Typography>
				</Stack>
			</TableCell>
		</TableRow>
	);

	const handleDelete = async (id: string) => {
		try {
			const result = await dispatch(deleteCalculator(id));
			if (result.success) {
				enqueueSnackbar("Cálculo eliminado correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			} else {
				enqueueSnackbar(result.error || "Error al eliminar el cálculo", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			enqueueSnackbar("Error inesperado al eliminar el cálculo", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		}
	};

	return (
		<MainCard
			shadow={3}
			title={
				<List disablePadding>
					<ListItem sx={{ p: 0 }}>
						<LoadingContent
							isLoader={isLoader}
							content={
								<ListItemAvatar>
									<Avatar color="success" variant="rounded">
										<Calculator variant="Bold" />
									</Avatar>
								</ListItemAvatar>
							}
							skeleton={<Skeleton variant="rectangular" width={40} height={40} style={{ marginRight: 10 }} />}
						/>
						<LoadingContent
							isLoader={isLoader}
							content={
								<ListItemText
									sx={{ my: 0 }}
									primary={title}
									secondary={<Typography variant="subtitle1">{folderData?.folderName}</Typography>}
								/>
							}
							skeleton={
								<Grid>
									<Skeleton variant="rectangular" width={120} height={16} style={{ marginBottom: 5 }} />
									<Skeleton variant="rectangular" width={120} height={16} />
								</Grid>
							}
						/>
					</ListItem>
				</List>
			}
			content={false}
		>
			{/* ... Modales ... */}
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} folderName={folderData?.folderName} />
			<ModalCalcTable open={open} setOpen={setOpen} folderName={folderData?.folderName} folderId={id} />
			<CardContent>
				{/* ... Grid de montos ... */}
				<Grid sx={{ pb: 2 }} container direction="row" justifyContent="space-around" alignItems="center">
					<Grid item>
						<Grid container direction="column" spacing={0} alignItems="center" justifyContent="center">
							{isLoader ? (
								<>
									<Skeleton width={80} />
									<Skeleton width={80} />
								</>
							) : (
								<>
									<Grid item>
										<Typography variant="subtitle2" color="secondary">
											Monto Reclamo
										</Typography>
									</Grid>
									<Grid item>
										<Typography variant="h5">{formatAmount(folderData?.monto || null)}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Grid>
					<Grid item>
						<Grid container direction="column" spacing={0} alignItems="center" justifyContent="center">
							{isLoader ? (
								<>
									<Skeleton width={80} />
									<Skeleton width={80} />
								</>
							) : (
								<>
									<Grid item>
										<Typography variant="subtitle2" color="secondary">
											Ofrecimiento
										</Typography>
									</Grid>
									<Grid item>
										<Typography variant="h5">{latestOfferedAmount !== null ? formatAmount(latestOfferedAmount) : "No ofertado"}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Grid>
				</Grid>
				<SimpleBar sx={{ maxHeight: 250 }}>
					<TableContainer>
						<Table
							size="small"
							sx={{
								"&.MuiTable-root": {
									paddingLeft: "1px",
									paddingRight: "1px",
									borderCollapse: "separate",
								},
							}}
						>
							<TableHead>
								<TableRow>
									{["Fecha", "Tipo", "Parte", "Monto", ""].map((header, index) => (
										<TableCell key={header} sx={{ p: 1 }} align={index >= 3 ? "right" : "left"}>
											<LoadingContent isLoader={isLoader} content={header} skeleton={<Skeleton />} />
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{showEmptyState ? (
									<EmptyState />
								) : (
									sortedData.map((row: CalculatorType, index: number) => (
										<TableRow key={index} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
											{Object.entries({
												date: row.date || "N/D",
												type: row.type || "N/D",
												user: row.user || "N/D",
												amount: row.amount || "N/D",
											}).map(([key, value], cellIndex) => (
												<>
													<TableCell key={`${index}-${key}`} sx={{ p: 1 }} align={cellIndex === 3 ? "right" : "left"}>
														<LoadingContent
															isLoader={isLoader}
															content={
																<Typography variant="body2">{cellIndex === 3 ? formatAmount(value as number) : String(value)}</Typography>
															}
															skeleton={<Skeleton width={60} />}
														/>
													</TableCell>
												</>
											))}
											<TableCell align="right" sx={{ p: 1 }}>
												<LoadingContent
													isLoader={isLoader}
													content={
														<Tooltip title="Eliminar cálculo">
															<IconButton
																color="error"
																size="small"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDelete(row._id);
																}}
																sx={{
																	"&:hover": {
																		bgcolor: "error.lighter",
																	},
																}}
															>
																<Trash variant="Bulk" size={18} />
															</IconButton>
														</Tooltip>
													}
													skeleton={<Skeleton width={40} />}
												/>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</SimpleBar>
				{/* ... Stack de botones ... */}
				<Stack direction="row" justifyContent={"right"} spacing={2} marginTop={2}>
					<Grid item>
						<Button onClick={() => setOpen(true)} disabled={isLoader}>
							Vincular
						</Button>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" onClick={() => setOpenItemModal(true)} disabled={isLoader}>
							Agregar
						</Button>
					</Grid>
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default CalcTable;
