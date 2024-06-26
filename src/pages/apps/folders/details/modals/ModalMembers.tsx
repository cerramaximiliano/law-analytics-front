import { useState, Dispatch, SetStateAction } from "react";

// material-ui
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

// third-party
import { SearchNormal1 } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress: (a: any) => void;
};

// ==============================|| INVOICE - SELECT ADDRESS ||============================== //

const ModalMembers = ({ open, setOpen, handlerAddress }: AddressModalType) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAddress, setSelectedAddress] = useState<{ email: string } | null>(null);

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
					<Typography variant="h5">Seleccione Interviniente</Typography>
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
					<Address handlerAddress={handleClick} searchTerm={searchTerm} selectedAddress={selectedAddress} />
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

type AddressProps = {
	handlerAddress: (e: any) => void;
	searchTerm: string;
	selectedAddress: { email: string } | null;
};

const Address = ({ handlerAddress, searchTerm, selectedAddress }: AddressProps) => {
	const theme = useTheme();

	const addressData = [
		{
			name: "Ian Carpenter",
			address: "1754 Ureate, RhodSA5 5BO",
			phone: "+91 1234567890",
			email: "iacrpt65@gmail.com",
		},
		{
			name: "Belle J. Richter",
			address: "1300 Mine RoadQuemado, NM 87829",
			phone: "305-829-7809",
			email: "belljrc23@gmail.com",
		},
		{
			name: "Ritika Yohannan",
			address: "3488 Arbutus DriveMiami, FL",
			phone: "+91 1234567890",
			email: "rtyhn65@gmail.com",
		},
		{
			name: "Jesse G. Hassen",
			address: "3488 Arbutus DriveMiami, FL 33012",
			phone: "+91 1234567890",
			email: "jessghs78@gmail.com",
		},
		{
			name: "Christopher P. Iacovelli",
			address: "4388 House DriveWesrville, OH",
			phone: "+91 1234567890",
			email: "crpthl643@gmail.com",
		},
		{
			name: "Thomas D. Johnson",
			address: "4388 House DriveWestville, OH +91",
			phone: "1234567890",
			email: "thomshj56@gmail.com",
		},
	];

	const filteredAddressData = addressData.filter((address) => address.name.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<SimpleBar
			sx={{
				height: "420px",
				width: "380px",
				overflowX: "hidden",
				overflowY: "auto",
			}}
		>
			{filteredAddressData.map((address) => (
				<Box
					onClick={() => handlerAddress(address)}
					key={address.email}
					sx={{
						width: "100%",
						border: "1px solid",
						borderColor: selectedAddress && selectedAddress.email === address.email ? theme.palette.primary.lighter : "secondary.200",
						borderRadius: 1,
						p: 1.25,
						bgcolor: selectedAddress && selectedAddress.email === address.email ? theme.palette.primary.lighter : "inherit",
						cursor: "pointer",
						"&:hover": {
							bgcolor: theme.palette.primary.lighter,
							borderColor: theme.palette.primary.lighter,
						},
					}}
				>
					<Typography textAlign="left" variant="subtitle1">
						{address.name}
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.address}
						</Typography>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.phone}
						</Typography>
						<Typography textAlign="left" variant="body2" color="secondary">
							{address.email}
						</Typography>
					</Stack>
				</Box>
			))}
		</SimpleBar>
	);
};

export default ModalMembers;
