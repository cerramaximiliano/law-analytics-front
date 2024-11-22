import { useState, Dispatch, SetStateAction, useEffect } from "react";

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
import { dispatch, useSelector } from "store";
import { filterContactsByFolder, updateMultipleContacts } from "store/reducers/contacts";
import { openSnackbar } from "store/reducers/snackbar";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress: (a: any) => void;
};

// ==============================|| INVOICE - SELECT ADDRESS ||============================== //

const ModalMembers = ({ open, setOpen, handlerAddress, folderId }: AddressModalType & { folderId: string }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAddresses, setSelectedAddresses] = useState<any[]>([]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const closeAddressModal = () => {
		setOpen(false);
	};

	const toggleSelection = (address: any) => {
		setSelectedAddresses((prev) =>
			prev.some((selected) => selected.email === address.email)
				? prev.filter((selected) => selected.email !== address.email)
				: [...prev, address],
		);
	};

	const handleVincular = () => {
		const contactsToUpdate = selectedAddresses
			.filter((address) => address._id) // Filtra solo aquellos con id definido
			.map((address) => ({
				id: address._id,
				updateData: { ...address, folderId },
			}));

		if (contactsToUpdate.length === 0) {
			console.error("No hay contactos válidos para actualizar.");
			dispatch(
				openSnackbar({
					open: true,
					message: "Debe seleccionar un contacto para vincular.",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
			closeAddressModal();
			return;
		}

		dispatch(updateMultipleContacts(contactsToUpdate))
			.then((response) => {
				if (response.success) {
					console.log("Contactos actualizados:", response.contacts);

					dispatch(
						openSnackbar({
							open: true,
							message: "Contacto vinculado correctamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: true,
						}),
					);

					dispatch(filterContactsByFolder(folderId));
				}
			})
			.catch((error) => {
				console.error("Error al actualizar contactos:", error);
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al vincular el contacto.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			});

		closeAddressModal();
	};
	// Resetea el estado al abrir el modal
	useEffect(() => {
		if (open) {
			setSelectedAddresses([]);
		}
	}, [open]);

	return (
		<Dialog
			maxWidth="sm"
			open={open}
			onClose={closeAddressModal}
			sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
		>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5">Seleccione Intervinientes</Typography>
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
					<Address handlerAddress={toggleSelection} searchTerm={searchTerm} selectedAddresses={selectedAddresses} />
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
	selectedAddresses: any[];
};

const Address = ({ handlerAddress, searchTerm, selectedAddresses }: AddressProps) => {
	const theme = useTheme();

	const { contacts } = useSelector((state: any) => state.contacts);

	const filteredAddressData = contacts.filter((address: any) => address.name.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<SimpleBar
			sx={{
				height: "420px",
				width: "380px",
				overflowX: "hidden",
				overflowY: "auto",
			}}
		>
			{filteredAddressData.map((address: any, index: number) => (
				<Box
					onClick={() => handlerAddress(address)}
					key={index}
					sx={{
						width: "100%",
						border: "1px solid",
						borderColor: selectedAddresses.some((selected) => selected.email === address.email)
							? theme.palette.primary.lighter
							: "secondary.200",
						borderRadius: 1,
						p: 1.25,
						bgcolor: selectedAddresses.some((selected) => selected.email === address.email) ? theme.palette.primary.lighter : "inherit",
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
