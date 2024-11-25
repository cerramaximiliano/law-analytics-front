import { useState, Dispatch, SetStateAction, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
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
import { SearchNormal1, TickCircle } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { dispatch, useSelector } from "store";
import { filterContactsByFolder, updateMultipleContacts } from "store/reducers/contacts";
import { openSnackbar } from "store/reducers/snackbar";

interface Contact {
	_id: string;
	name: string;
	lastName?: string;
	email: string;
	phone: string;
	address?: string;
}

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress: (address: Contact) => void;
	folderId: string;
	membersData: Contact[];
};

const ModalMembers = ({ open, setOpen, handlerAddress, folderId, membersData }: AddressModalType) => {
	const theme = useTheme();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAddresses, setSelectedAddresses] = useState<Contact[]>([]);
	const { contacts } = useSelector((state: any) => state.contacts);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const closeAddressModal = () => {
		setOpen(false);
	};

	const toggleSelection = (address: Contact) => {
		setSelectedAddresses((prev) =>
			prev.some((selected) => selected.email === address.email)
				? prev.filter((selected) => selected.email !== address.email)
				: [...prev, address],
		);
	};

	const handleVincular = async () => {
		try {
			const contactsToUpdate = selectedAddresses
				.filter((address) => address._id)
				.map((address) => ({
					id: address._id,
					updateData: { ...address, folderIds: [folderId] },
				}));

			if (contactsToUpdate.length === 0) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Debe seleccionar un contacto para vincular.",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
				closeAddressModal();
				return;
			}

			const result = await dispatch(updateMultipleContacts(contactsToUpdate));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message:
							contactsToUpdate.length === 1
								? "Contacto vinculado correctamente."
								: `${result.contacts?.length} contactos vinculados correctamente.`,
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);

				dispatch(filterContactsByFolder(folderId));
			} else if (result.contacts?.length) {
				dispatch(
					openSnackbar({
						open: true,
						message: `Contacto vinculado correctamente.`,
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);

				if (result.errors) {
					console.error("Errores específicos:", result.errors);
				}

				dispatch(filterContactsByFolder(folderId));
			} else {
				let errorMessage = "Error al vincular los contactos";

				if (result.errors && result.errors.length > 0) {
					errorMessage = result.errors[0].message || errorMessage;
				} else if (result.error) {
					errorMessage = result.error;
				}

				dispatch(
					openSnackbar({
						open: true,
						message: errorMessage,
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			console.error("Error inesperado al vincular contactos:", error);

			let errorMessage = "Error inesperado al vincular los contactos";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			dispatch(
				openSnackbar({
					open: true,
					message: errorMessage,
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			closeAddressModal();
		}
	};

	useEffect(() => {
		if (open) {
			setSelectedAddresses([]);
			setSearchTerm("");
		}
	}, [open]);

	const filteredContacts = contacts.filter((contact: Contact) => {
		const matchesSearch =
			contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			contact.email.toLowerCase().includes(searchTerm.toLowerCase());

		const isNotMember = !membersData.some((member) => member._id === contact._id);

		return matchesSearch && isNotMember;
	});

	return (
		<Dialog
			maxWidth="sm"
			open={open}
			onClose={closeAddressModal}
			sx={{
				"& .MuiDialog-paper": { p: 0 },
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5">Seleccione Contactos</Typography>
					<Typography color="textSecondary" variant="subtitle2">
						{selectedAddresses.length} seleccionados
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 2.5 }}>
				{selectedAddresses.length > 0 && (
					<Box sx={{ mb: 2 }}>
						<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
							{selectedAddresses.map((address) => (
								<Chip
									key={address.email}
									label={`${address.name} ${address.lastName || ""}`}
									onDelete={() => toggleSelection(address)}
									color="primary"
									variant="outlined"
								/>
							))}
						</Stack>
					</Box>
				)}

				<FormControl sx={{ width: "100%", pb: 2 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} />
								</InputAdornment>
							),
						}}
						placeholder="Buscar intervinientes..."
						fullWidth
					/>
				</FormControl>

				<SimpleBar
					sx={{
						maxHeight: "420px",
						width: "100%",
						overflowX: "hidden",
						overflowY: "auto",
					}}
				>
					<Stack spacing={1}>
						{filteredContacts.length > 0 ? (
							filteredContacts.map((contact: Contact) => {
								const isSelected = selectedAddresses.some((selected) => selected.email === contact.email);
								return (
									<Box
										key={contact.email}
										onClick={() => toggleSelection(contact)}
										sx={{
											width: "100%",
											border: "1px solid",
											borderColor: isSelected ? theme.palette.primary.main : "divider",
											borderRadius: 1,
											p: 2,
											cursor: "pointer",
											bgcolor: isSelected ? `${theme.palette.primary.lighter}` : "background.paper",
											transition: "all 0.3s ease",
											"&:hover": {
												borderColor: theme.palette.primary.main,
												bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.primary.lighter + "80",
											},
											position: "relative",
										}}
									>
										<Stack spacing={1}>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Typography variant="h6" sx={{ flex: 1 }}>
													{`${contact.name} ${contact.lastName || ""}`}
												</Typography>
												{isSelected && <TickCircle variant="Bold" size={24} style={{ color: theme.palette.primary.main }} />}
											</Stack>
											<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ color: "text.secondary" }}>
												{contact.address && <Typography variant="body2">{contact.address}</Typography>}
												<Typography variant="body2">{contact.phone}</Typography>
												<Typography variant="body2">{contact.email}</Typography>
											</Stack>
										</Stack>
									</Box>
								);
							})
						) : (
							<Box sx={{ textAlign: "center", py: 3 }}>
								<Typography color="textSecondary">No se encontraron intervinientes</Typography>
							</Box>
						)}
					</Stack>
				</SimpleBar>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5 }}>
				<Button color="error" onClick={closeAddressModal}>
					Cancelar
				</Button>
				<Button onClick={handleVincular} color="primary" variant="contained" disabled={selectedAddresses.length === 0}>
					Vincular {selectedAddresses.length > 0 && `(${selectedAddresses.length})`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ModalMembers;
