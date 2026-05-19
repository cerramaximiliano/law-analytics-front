import React from "react";
import { useState, useEffect } from "react";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Box,
	Button,
	DialogActions,
	DialogTitle,
	DialogContent,
	FormControl,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	Tooltip,
	CircularProgress,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";

// third-party
import { SearchNormal1, TickCircle, UserAdd } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { dispatch, useSelector } from "store";
import { filterContactsByFolder, updateMultipleContacts } from "store/reducers/contacts";
import { openSnackbar } from "store/reducers/snackbar";
import { BRAND_BLUE } from "themes/dashboardTokens";

//types
import { MembersModalType, Contact } from "types/movements";

const ModalMembers = ({ open, setOpen, handlerAddress, folderId, membersData }: MembersModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAddresses, setSelectedAddresses] = useState<Contact[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const { contacts } = useSelector((state: any) => state.contacts);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const closeAddressModal = () => {
		setOpen(false);
	};

	const toggleSelection = (address: Contact) => {
		setSelectedAddresses((prev) =>
			prev.some((selected) => selected._id === address._id) ? prev.filter((selected) => selected._id !== address._id) : [...prev, address],
		);
	};

	const handleVincular = async () => {
		setIsLoading(true);
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
				setIsLoading(false);
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
				closeAddressModal();
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
				}

				dispatch(filterContactsByFolder(folderId));
				closeAddressModal();
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
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			setSelectedAddresses([]);
			setSearchTerm("");
		}
	}, [open]);

	const filteredContacts = contacts.filter((contact: Contact) => {
		const search = searchTerm.toLowerCase();
		const matchesSearch =
			(contact.name || "").toLowerCase().includes(search) ||
			(contact.lastName || "").toLowerCase().includes(search) ||
			(contact.email || "").toLowerCase().includes(search);

		const isNotMember = !membersData.some((member) => member._id === contact._id);

		return matchesSearch && isNotMember;
	});

	return (
		<ResponsiveDialog
			maxWidth="sm"
			fullWidth
			open={open}
			onClose={closeAddressModal}
			PaperProps={{
				sx: {
					p: 0,
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					display: "flex",
					flexDirection: "column",
					maxHeight: { xs: "90vh", sm: "85vh" },
					overflow: "hidden",
				},
			}}
			sx={{ "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
		>
			<DialogTitle
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					flexShrink: 0,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<UserAdd size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							Vincular contactos
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Seleccioná contactos
					</Typography>
				</Stack>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.5,
						px: 0.875,
						py: 0.25,
						borderRadius: 0.75,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						flexShrink: 0,
					}}
				>
					<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.7rem",
							fontWeight: 700,
							color: BRAND_BLUE,
							letterSpacing: "-0.005em",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{selectedAddresses.length}
					</Typography>
				</Box>
			</DialogTitle>

			<DialogContent
				sx={{
					p: 0,
					width: "100%",
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					flex: 1,
				}}
			>
				<Box sx={{ p: 2.5, pb: 0 }}>
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
											<Tooltip key={address._id} title={`${address.name} ${address.lastName || ""}`}>
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
				</Box>

				<Box sx={{ flex: 1, minHeight: 0, px: 2.5, pb: 2.5 }}>
					<SimpleBar
						sx={{
							maxHeight: { xs: "40vh", sm: "45vh" },
							width: "100%",
							overflowX: "hidden",
						}}
					>
						<Stack spacing={1.5}>
							{filteredContacts.length > 0 ? (
								filteredContacts.map((contact: Contact) => {
									const isSelected = selectedAddresses.some((selected) => selected._id === contact._id);
									return (
										<Box
											key={contact._id}
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
				</Box>
			</DialogContent>

			<DialogActions
				sx={{
					px: 2.5,
					py: 1.75,
					borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					flexShrink: 0,
				}}
			>
				<Button
					onClick={closeAddressModal}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						color: "text.secondary",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
						"&:hover": {
							color: BRAND_BLUE,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							borderColor: alpha(BRAND_BLUE, 0.28),
						},
					}}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleVincular}
					variant="contained"
					disabled={selectedAddresses.length === 0 || isLoading}
					startIcon={isLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						bgcolor: BRAND_BLUE,
						color: "#fff",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						boxShadow: "none",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
					}}
				>
					{isLoading ? "Vinculando…" : `Vincular (${selectedAddresses.length})`}
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ModalMembers;
