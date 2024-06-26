import { useState, useEffect } from "react";
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
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import Avatar from "components/@extended/Avatar";
import { Calculator } from "iconsax-react";
import ModalCalcTable from "../modals/ModalCalcTable";
import ModalCalcData from "../modals/ModalCalcData";

export type CalcAmounts = {
	date: string;
	type: "Calculado" | "Reclamado" | "Ofertado";
	amount: number;
	user: "Actora" | "Demandada";
	link?: string;
	description?: string;
};

const CalcTable = (props: { title: string; folderData: { folderName: string; monto: number }; tableData: CalcAmounts[] }) => {
	const { title, folderData, tableData } = props;
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const [data, setData] = useState(tableData);
	const { id } = useParams();
	const [latestOfferedAmount, setLatestOfferedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	console.log(isLoading, setIsLoading);
	const addItem = (newEvent: CalcAmounts) => {
		setData((prevEvents) => [...prevEvents, newEvent]);
	};

	// Ordena los datos por fecha descendente
	const sortedData = data.slice().sort((a, b) => {
		const dateA = moment(a.date, "DD/MM/YYYY");
		const dateB = moment(b.date, "DD/MM/YYYY");
		return dateB.diff(dateA);
	});

	// UseEffect to update the latest offered amount
	useEffect(() => {
		const latestOffered = sortedData.find((item) => item.type === "Ofertado");
		if (latestOffered) {
			setLatestOfferedAmount(latestOffered.amount);
		} else {
			setLatestOfferedAmount(null);
		}
	}, [data, sortedData]);

	return (
		<MainCard
			title={
				<List disablePadding>
					<ListItem sx={{ p: 0 }}>
						{isLoading ? (
							<Skeleton variant="rectangular" width={40} height={40} style={{ marginRight: 10 }} />
						) : (
							<ListItemAvatar>
								<Avatar color="success" variant="rounded">
									<Calculator variant="Bold" />
								</Avatar>
							</ListItemAvatar>
						)}
						{isLoading ? (
							<Grid>
								<Skeleton variant="rectangular" width={120} height={16} style={{ marginBottom: 5 }} />
								<Skeleton variant="rectangular" width={120} height={16} />
							</Grid>
						) : (
							<ListItemText
								sx={{ my: 0 }}
								primary={title}
								secondary={<Typography variant="subtitle1">{folderData.folderName || ""}</Typography>}
							/>
						)}
					</ListItem>
				</List>
			}
			content={false}
		>
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} handlerAddress={addItem} />
			<ModalCalcTable open={open} setOpen={setOpen} folderId={id} handlerAddress={addItem} />
			<CardContent>
				<Grid sx={{ pb: 2 }} container direction="row" justifyContent="space-around" alignItems="center">
					<Grid item>
						<Grid container direction="column" spacing={0} alignItems="center" justifyContent="center">
							{isLoading ? (
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
										<Typography variant="h5">{`$${folderData.monto}`}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Grid>
					<Grid item>
						<Grid container direction="column" spacing={0} alignItems="center" justifyContent="center">
							{isLoading ? (
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
										<Typography variant="h5">{latestOfferedAmount !== null ? `$${latestOfferedAmount}` : "No ofertado"}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Grid>
				</Grid>
				<SimpleBar
					sx={{
						maxHeight: 250,
					}}
				>
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
									<TableCell style={{ paddingLeft: 6 }}>{isLoading ? <Skeleton /> : "Fecha"}</TableCell>
									<TableCell sx={{ p: 1 }}>{isLoading ? <Skeleton /> : "Tipo"}</TableCell>
									<TableCell sx={{ p: 1 }}>{isLoading ? <Skeleton /> : "Parte"}</TableCell>
									<TableCell style={{ paddingRight: 6 }} align="right">
										{isLoading ? <Skeleton /> : "Monto"}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{sortedData.length > 0 ? (
									sortedData.map((row, index) => (
										<TableRow hover key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
											<TableCell style={{ paddingLeft: 6 }} sx={{ p: 1 }}>
												<Typography variant="body2">
													{isLoading ? (
														<>
															<Skeleton width={60} />
														</>
													) : (
														<>{row.date}</>
													)}{" "}
												</Typography>
											</TableCell>
											<TableCell sx={{ p: 1 }}>
												<Typography variant="body2">
													{isLoading ? (
														<>
															<Skeleton width={60} />
														</>
													) : (
														<>{row.type}</>
													)}
												</Typography>
											</TableCell>
											<TableCell sx={{ p: 1 }}>
												<Typography variant="body2">
													{isLoading ? (
														<>
															<Skeleton width={60} />
														</>
													) : (
														<>{row.user}</>
													)}
												</Typography>
											</TableCell>
											<TableCell style={{ paddingRight: 6 }} sx={{ p: 1 }} align="right">
												<Typography variant="body2">
													{" "}
													{isLoading ? (
														<>
															<Skeleton width={60} />
														</>
													) : (
														<>{row.amount}</>
													)}
												</Typography>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={4} align="center">
											<>
												<Grid container justifyContent="center">
													<Avatar color="error" variant="rounded">
														<Calculator variant="Bold" />
													</Avatar>
												</Grid>
												<Typography variant="body1" color="text.secondary" align="center">
													No hay datos disponibles
												</Typography>
											</>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</SimpleBar>
				<Stack direction="row" justifyContent={"right"} spacing={2} marginTop={2}>
					<Grid item>
						<Button onClick={() => setOpen(true)} disabled={isLoading}>
							Vincular
						</Button>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" onClick={() => setOpenItemModal(true)} disabled={isLoading}>
							Agregar
						</Button>
					</Grid>
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default CalcTable;
