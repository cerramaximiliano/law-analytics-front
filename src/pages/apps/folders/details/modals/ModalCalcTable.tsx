import React, { useState, Dispatch, SetStateAction } from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Divider,
	Dialog,
	DialogActions,
	DialogTitle,
	DialogContent,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { SearchNormal1 } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";

type CalcModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress: (a: any) => void;
	folderId: any;
};
type CalcProps = {
	handlerAddress: (e: any) => void;
	searchTerm: string;
	selectedAddress: { _id: string } | null;
};
// ==============================|| INVOICE - SELECT ADDRESS ||============================== //

const ModalCalcTable = ({ open, setOpen, handlerAddress, folderId }: CalcModalType) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAddress, setSelectedAddress] = useState<{ _id: string } | null>(null);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const closeAddressModal = () => {
		setOpen(false);
	};

	const handleClick = (address: any) => {
		console.log(address);
		setSelectedAddress(address);
	};

	const handleVincular = () => {
		if (selectedAddress) {
			handlerAddress(selectedAddress);
			closeAddressModal();
		}
	};

	return (
		<Dialog
			maxWidth="sm"
			open={open}
			onClose={closeAddressModal}
			sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
		>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5">Seleccione Cáculo</Typography>
				</Stack>
			</DialogTitle>
			<Divider />
			<DialogContent sx={{ p: 2.5 }}>
				<FormControl sx={{ width: "100%", pb: 2 }}>
					<TextField
						autoFocus
						id="name"
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} />
								</InputAdornment>
							),
						}}
						placeholder="Buscar"
						fullWidth
					/>
				</FormControl>
				<Stack spacing={2}>
					<CalcForm handlerAddress={handleClick} searchTerm={searchTerm} selectedAddress={selectedAddress} />
				</Stack>
			</DialogContent>
			<Divider />
			<DialogActions sx={{ p: 2.5 }}>
				<Button color="error" onClick={closeAddressModal}>
					Cancelar
				</Button>
				<Button onClick={handleVincular} color="primary" variant="contained">
					Vincular
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const CalcForm = ({ handlerAddress, searchTerm, selectedAddress }: CalcProps) => {
	const theme = useTheme();

	const addressData = [
		{
			_id: "3216sse653",
			reclamante: "Ian Carpenter",
			reclamado: "Belle J. Richter",
			amount: 250300,
			date: "25/10/2021",
			type: "Calculado",
			category: "Laboral",
			subcategory: "Laboral",
		},
		{
			_id: "sx358s6846",
			reclamante: "Ian Carpenter",
			reclamado: "Belle J. Richter",
			amount: 250300,
			date: "25/03/2024",
			type: "Calculado",
			category: "Laboral",
			subcategory: "Laboral",
		},
		{
			_id: "efev6548138",
			reclamante: "Christopher P. Iacovelli",
			reclamado: "Belle J. Richter",
			amount: 250300,
			date: "25/10/2022",
			type: "Calculado",
			category: "Laboral",
			subcategory: "Laboral",
		},
		{
			_id: "sadf3546351",
			reclamante: "Ian Carpenter",
			reclamado: "Belle J. Richter",
			amount: 250300,
			date: "25/11/2021",
			type: "Calculado",
			category: "Laboral",
			subcategory: "Laboral",
		},
	];

	const filteredAddressData = addressData.filter((address) => address.reclamante.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<SimpleBar
			sx={{
				minHeight: "250px",
				maxHeight: "250px",
				width: "380px",
				overflowX: "hidden",
				overflowY: "auto",
			}}
		>
			{filteredAddressData.map((address, index) => (
				<Box
					onClick={() => handlerAddress(address)}
					key={index}
					sx={{
						width: "100%",
						border: "1px solid",
						borderColor: selectedAddress && selectedAddress._id === address._id ? theme.palette.primary.lighter : "secondary.200",
						borderRadius: 1,
						p: 1.25,
						bgcolor: selectedAddress && selectedAddress._id === address._id ? theme.palette.primary.lighter : "inherit",
						cursor: "pointer",
						"&:hover": {
							bgcolor: theme.palette.primary.lighter,
							borderColor: theme.palette.primary.lighter,
						},
					}}
				>
					<Typography textAlign="left" variant="subtitle1">
						{address.reclamante}
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.reclamado}
						</Typography>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.date}
						</Typography>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.amount}
						</Typography>
					</Stack>
				</Box>
			))}
		</SimpleBar>
	);
};

export default ModalCalcTable;
