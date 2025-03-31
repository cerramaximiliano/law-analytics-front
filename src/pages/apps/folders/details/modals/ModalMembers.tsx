import { useState, useEffect } from "react";

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
	Tooltip,
} from "@mui/material";

// third-party
import { SearchNormal1, TickCircle, UserAdd } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { dispatch, useSelector } from "store";
import { filterContactsByFolder, updateMultipleContacts } from "store/reducers/contacts";
import { openSnackbar } from "store/reducers/snackbar";

//types
import { MembersModalType, Contact } from "types/movements";

const ModalMembers = ({ open, setOpen, handlerAddress, folderId, membersData }: MembersModalType) => {
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
			PaperProps={{
				sx: {
					width: "600px",
					maxWidth: "600px",
					p: 0,
					borderRadius: 2,
					boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
				},
			}}
			sx={{
				"& .MuiDialog-paper": { p: 0 },
				"& .MuiBackdrop-root": { opacity: "0.5 !important" },
			}}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Stack direction="row" alignItems="center" spacing={1}>
						<UserAdd size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
							Seleccione Contactos
						</Typography>
					</Stack>
					<Typography color="textSecondary" variant="subtitle2">
						{selectedAddresses.length} seleccionados
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent
				sx={{
					p: 2.5,
					width: "100%",
					overflow: "visible",
				}}
			>
				{selectedAddresses.length > 0 && (
					<Box sx={{ mb: 2.5 }}>
						<Stack spacing={1}>
							<Typography variant="subtitle2" color="textSecondary">
								Contactos Seleccionados:
							</Typography>
							<Box
								sx={{
									p: 2,
									border: `2px solid ${theme.palette.primary.main}`,
									borderRadius: 2,
									bgcolor: theme.palette.primary.lighter,
								}}
							>
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									{selectedAddresses.map((address) => (
										<Tooltip key={address.email} title={`${address.name} ${address.lastName || ""}`}>
											<Box
												sx={{
													p: 1,
													bgcolor: theme.palette.background.paper,
													borderRadius: 1,
													border: "1px solid",
													borderColor: theme.palette.primary.main,
													display: "flex",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Typography variant="body2">{`${address.name} ${address.lastName || ""}`}</Typography>
											</Box>
										</Tooltip>
									))}
								</Stack>
							</Box>
						</Stack>
					</Box>
				)}

				<FormControl sx={{ width: "100%", mb: 2.5 }}>
					<TextField
						autoFocus
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={18} color={theme.palette.primary.main} />
								</InputAdornment>
							),
							sx: {
								bgcolor: theme.palette.background.paper,
								"&:hover": {
									bgcolor: theme.palette.action.hover,
								},
							},
						}}
						placeholder="Buscar intervinientes..."
						fullWidth
					/>
				</FormControl>

				<SimpleBar
					sx={{
						maxHeight: "500px",
						width: "100%",
						overflowX: "hidden",
						overflowY: "auto",
						position: "relative",
					}}
				>
					<Stack spacing={1.5}>
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
											borderRadius: 2,
											p: 3,
											cursor: "pointer",
											bgcolor: isSelected ? `${theme.palette.primary.lighter}` : "background.paper",
											transition: "all 0.2s ease-in-out",
											"&:hover": {
												borderColor: theme.palette.primary.main,
												bgcolor: isSelected ? theme.palette.primary.lighter : theme.palette.primary.lighter + "80",
												transform: "translateY(-2px)",
												boxShadow: `0 4px 8px ${theme.palette.primary.lighter}`,
												zIndex: 10,
												marginTop: "10px",
												marginBottom: "6px",
											},
										}}
									>
										<Stack spacing={1.5}>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Tooltip title={`${contact.name} ${contact.lastName || ""}`}>
													<Typography
														variant="subtitle1"
														sx={{
															flex: 1,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
															fontWeight: isSelected ? 600 : 500,
														}}
													>
														{`${contact.name} ${contact.lastName || ""}`}
													</Typography>
												</Tooltip>
												{isSelected && (
													<TickCircle
														variant="Bold"
														size={24}
														style={{
															color: theme.palette.primary.main,
														}}
													/>
												)}
											</Stack>
											<Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
												{contact.address && <Typography variant="body2">{contact.address}</Typography>}
												<Typography variant="body2">{contact.phone}</Typography>
												<Typography variant="body2">{contact.email}</Typography>
											</Stack>
										</Stack>
									</Box>
								);
							})
						) : (
							<Box
								sx={{
									textAlign: "center",
									py: 4,
									bgcolor: theme.palette.background.paper,
									borderRadius: 2,
									border: "1px dashed",
									borderColor: theme.palette.divider,
								}}
							>
								<Typography color="textSecondary">No se encontraron intervinientes</Typography>
							</Box>
						)}
					</Stack>
				</SimpleBar>
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button color="error" onClick={closeAddressModal}>
					Cancelar
				</Button>
				<Button onClick={handleVincular} color="primary" variant="contained" disabled={selectedAddresses.length === 0}>
					Vincular ({selectedAddresses.length})
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ModalMembers;
