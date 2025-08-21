import React from "react";
import { Stack, Skeleton, Grid, CardContent, Button, List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import SimpleBar from "components/third-party/SimpleBar";
import { Add, MoneyForbidden, MoneyRecive, MoneySend } from "iconsax-react";
import { useState } from "react";
import ModalPayment from "../modals/ModalPayment";
import { useParams } from "react-router";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type PaymentDataType = {
	name: string;
	amount: string;
	change?: string;
	image?: string;
	changeColor: string;
	type: string;
	date: string;
};

const Payment = (props: { title: string; payments: PaymentDataType[] }) => {
	const { title, payments: initialPayments } = props;
	const { id } = useParams();
	const [open, setOpen] = useState(false);
	const [payments, setPayments] = useState<PaymentDataType[]>(initialPayments);
	const [showAll, setShowAll] = useState(false);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [isLoading] = useState(true);

	const handleOpen = () => {
		if (isLoading === true) {
			return;
		} else {
			setOpen(true);
		}
	};

	const handleAddPayment = (newPayment: PaymentDataType) => {
		setPayments((prevPayments) => [...prevPayments, newPayment]);
	};

	const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	const displayedPayments = showAll ? sortedPayments : sortedPayments.slice(0, 3);

	const toggleShowAll = () => {
		setShowAll((prevShowAll) => !prevShowAll);
	};

	return (
		<MainCard
			title={title}
			content={false}
			secondary={
				<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleOpen}>
					<Add />
				</IconButton>
			}
		>
			<ModalPayment open={open} setOpen={setOpen} handlerAddress={handleAddPayment} folderId={id} />
			<CardContent>
				{isLoading ? (
					<>
						<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
							<Grid>
								<Skeleton variant="rectangular" width={40} height={40} />
							</Grid>
							<Grid style={{ marginLeft: 20 }}>
								<Skeleton width={100} />
								<Skeleton width={100} />
							</Grid>
						</Stack>
						<Stack direction={"row"} style={{ marginLeft: 24, marginRight: 24, marginTop: 12, marginBottom: 12 }}>
							<Grid>
								<Skeleton variant="rectangular" width={40} height={40} />
							</Grid>
							<Grid style={{ marginLeft: 20 }}>
								<Skeleton width={100} />
								<Skeleton width={100} />
							</Grid>
						</Stack>
					</>
				) : (
					<>
						<SimpleBar
							sx={{
								overflowX: "hidden",
								maxHeight: "388px",
								overflowY: "auto",
							}}
						>
							<List disablePadding sx={{ "& .MuiListItem-root": { px: 3, py: 1.5 } }} ref={parent}>
								{displayedPayments.length > 0 ? (
									displayedPayments.map((payment, index) => (
										<ListItem key={index} divider>
											<ListItemAvatar>
												{payment.type === "Ingreso" ? (
													<Avatar variant="rounded" color="success">
														<MoneyRecive />
													</Avatar>
												) : (
													<Avatar variant="rounded" color="error">
														<MoneySend />
													</Avatar>
												)}
											</ListItemAvatar>
											<ListItemText
												primary={payment.name}
												secondary={
													<Typography variant="subtitle1">
														{`$${payment.amount}`}{" "}
														<Typography variant="caption" color={payment.changeColor} component="span">
															{payment.change}
														</Typography>
													</Typography>
												}
											/>
										</ListItem>
									))
								) : (
									<>
										<Grid container justifyContent="center">
											<Avatar color="error" variant="rounded">
												<MoneyForbidden variant="Bold" />
											</Avatar>
										</Grid>
										<Typography variant="body1" color="text.secondary" align="center">
											No hay datos
										</Typography>
									</>
								)}
							</List>
						</SimpleBar>
					</>
				)}

				<Grid marginTop={2}>
					<Button
						variant="outlined"
						fullWidth
						color="secondary"
						onClick={toggleShowAll}
						disabled={displayedPayments.length === 0 || isLoading}
					>
						{showAll ? "Ver Menos" : "Ver Todos"}
					</Button>
				</Grid>
			</CardContent>
		</MainCard>
	);
};

export default Payment;
