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
} from "@mui/material";
import MainCard from "components/MainCard";
import SimpleBar from "components/third-party/SimpleBar";
import Avatar from "components/@extended/Avatar";
import { Calculator } from "iconsax-react";
import ModalCalcTable from "../modals/ModalCalcTable";
import ModalCalcData from "../modals/ModalCalcData";

interface LoadingContentProps {
	isLoading: boolean;
	content: React.ReactNode;
	skeleton: React.ReactNode;
}

export type CalcAmounts = {
	date: string;
	type: "Calculado" | "Reclamado" | "Ofertado";
	amount: number;
	user: "Actora" | "Demandada";
	link?: string;
	description?: string;
};

{
	/* <ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} handlerAddress={addItem} />
<ModalCalcTable open={open} setOpen={setOpen} folderId={id} handlerAddress={addItem} /> */
}

const LoadingContent = ({ isLoading, content, skeleton }: LoadingContentProps): JSX.Element =>
	isLoading ? <>{skeleton}</> : <>{content}</>;

const CalcTable = ({
	title,
	folderData,
	tableData,
}: {
	title: string;
	folderData: { folderName: string; monto: number };
	tableData: CalcAmounts[];
}) => {
	const [open, setOpen] = useState(false);
	const [openItemModal, setOpenItemModal] = useState(false);
	const [data, setData] = useState(tableData);
	const { id } = useParams();
	const [latestOfferedAmount, setLatestOfferedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	console.log(isLoading, setIsLoading);

	const sortedData = useMemo(() => data.slice().sort((a, b) => moment(b.date, "DD/MM/YYYY").diff(moment(a.date, "DD/MM/YYYY"))), [data]);

	useEffect(() => {
		if (tableData.length > 0 || folderData) {
			setIsLoading(false);
		}
	}, [tableData, folderData]);

	useEffect(() => {
		const latestOffered = sortedData.find((item) => item.type === "Ofertado");
		setLatestOfferedAmount(latestOffered?.amount ?? null);
	}, [sortedData]);

	const showEmptyState = !isLoading && sortedData.length === 0;

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

	const addItem = (newEvent: CalcAmounts) => {
		setData((prevEvents) => [...prevEvents, newEvent]);
	};

	return (
		<MainCard
			shadow={3}
			title={
				<List disablePadding>
					<ListItem sx={{ p: 0 }}>
						<LoadingContent
							isLoading={isLoading}
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
							isLoading={isLoading}
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
			<ModalCalcData open={openItemModal} setOpen={setOpenItemModal} folderId={id} handlerAddress={addItem} />
			<ModalCalcTable open={open} setOpen={setOpen} folderId={id} handlerAddress={addItem} />
			<CardContent>
				{/* ... Grid de montos ... */}
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
										<Typography variant="h5">{`${folderData.monto ? `$${folderData.monto}` : "No Disponible"}`}</Typography>
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
									{["Fecha", "Tipo", "Parte", "Monto"].map((header, index) => (
										<TableCell key={header} sx={{ p: 1 }} align={index === 3 ? "right" : "left"}>
											<LoadingContent isLoading={isLoading} content={header} skeleton={<Skeleton />} />
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{showEmptyState ? (
									<EmptyState />
								) : (
									sortedData.map((row, index) => (
										<TableRow key={index} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
											{Object.entries(row)
												.slice(0, 4)
												.map(([key, value], cellIndex) => (
													<TableCell key={`${index}-${key}`} sx={{ p: 1 }} align={cellIndex === 3 ? "right" : "left"}>
														<LoadingContent
															isLoading={isLoading}
															content={<Typography variant="body2">{value}</Typography>}
															skeleton={<Skeleton width={60} />}
														/>
													</TableCell>
												))}
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

{
	/* <Grid sx={{ pb: 2 }} container direction="row" justifyContent="space-around" alignItems="center">
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
</Grid> */
}

{
	/* <Stack direction="row" justifyContent={"right"} spacing={2} marginTop={2}>
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
				</Stack> */
}

/* 				"&.MuiTable-root": {
					paddingLeft: "1px",
					paddingRight: "1px",
					borderCollapse: "separate",
				}, */
