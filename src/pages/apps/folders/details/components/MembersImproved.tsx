import {
	Stack,
	Skeleton,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Typography,
	Dialog,
	Box,
	Paper,
	useTheme,
	alpha,
	Chip,
	Menu,
	MenuItem,
	ListItemIcon,
	Divider,
	Button,
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import SimpleBar from "components/third-party/SimpleBar";
import { UserSquare, Trash, Link1, More, Profile, UserAdd } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import React, { useCallback, useState, useEffect } from "react";
import AddCustomer from "sections/apps/customer/AddCustomer";
import ModalMembers from "../modals/ModalMembers";
import ContactProfileModal from "../modals/ContactProfileModal";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion } from "framer-motion";

import { Contact } from "types/contact";
import { deleteContact, unlinkFolderFromContact, filterContactsByFolder } from "store/reducers/contacts";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";

interface MembersProps {
	title: string;
	membersData: Contact[];
	isLoader: boolean;
	folderId: string;
}

const getColorByRole = (role: string) => {
	switch (role) {
		case "Abogado":
			return "primary";
		case "Cliente":
			return "secondary";
		case "Causante":
			return "error";
		case "Mediador/Conciliador":
			return "warning";
		case "Perito":
			return "success";
		case "Contrario":
			return "info";
		case "Entidad":
			return "default";
		default:
			return "default";
	}
};

const getRoleIcon = (role: string) => {
	switch (role) {
		case "Abogado":
			return "⚖️";
		case "Cliente":
			return "👤";
		case "Causante":
			return "📋";
		case "Mediador/Conciliador":
			return "🤝";
		case "Perito":
			return "🔍";
		case "Contrario":
			return "⚔️";
		case "Entidad":
			return "🏢";
		default:
			return "👥";
	}
};

const MembersImproved: React.FC<MembersProps> = ({ title, membersData, isLoader, folderId }) => {
	const theme = useTheme();
	// Get selectedContacts from Redux store (contacts filtered by folder)
	const selectedContacts = useSelector((state: any) => state.contacts.selectedContacts || []);
	const [add, setAdd] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedMember, setSelectedMember] = useState<Contact | null>(null);
	const [profileModalOpen, setProfileModalOpen] = useState(false);

	// Efecto para manejar cierre de modales cuando hay errores 403
	useEffect(() => {
		const handlePlanRestriction = () => {
			if (add) {
				setAdd(false);
			}
			if (openModal) {
				setOpenModal(false);
			}
		};

		const checkGlobalFlag = () => {
			if ((window as any).FORCE_CLOSE_ALL_MODALS) {
				if (add) {
					setAdd(false);
				}
				if (openModal) {
					setOpenModal(false);
				}
			}
		};

		window.addEventListener("planRestrictionError", handlePlanRestriction);
		const intervalId = setInterval(checkGlobalFlag, 200);

		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
			clearInterval(intervalId);
		};
	}, [add, openModal]);

	const handleAdd = useCallback(() => {
		if (!isLoader) {
			setAdd((prev) => !prev);
		}
	}, [isLoader]);

	const handleOpen = useCallback(() => {
		setOpenModal((prev) => !prev);
	}, []);

	const handlerAddress = useCallback(
		(newMember: any) => {
			// When adding a new member, we should trigger a refresh of the contacts
			// The Redux store will handle the actual state update
			dispatch(filterContactsByFolder(folderId));
		},
		[folderId],
	);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Contact) => {
		setAnchorEl(event.currentTarget);
		setSelectedMember(member);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleViewProfile = () => {
		setProfileModalOpen(true);
		handleMenuClose();
	};

	const handleProfileModalClose = () => {
		setProfileModalOpen(false);
		setSelectedMember(null);
	};

	const handleDelete = useCallback(
		async (contactId: string) => {
			dispatch(deleteContact(contactId))
				.then((response) => {
					if (response.success) {
						dispatch(
							openSnackbar({
								open: true,
								message: "Contacto eliminado correctamente.",
								variant: "alert",
								alert: {
									color: "success",
								},
								close: true,
							}),
						);
						// Refresh the contacts list from Redux
						dispatch(filterContactsByFolder(folderId));
					} else {
						const errorMessage =
							typeof response.error === "string" ? response.error : response.error?.message || "Error al eliminar el contacto.";
						dispatch(
							openSnackbar({
								open: true,
								message: errorMessage,
								variant: "alert",
								alert: {
									color: "error",
								},
								close: true,
							}),
						);
					}
				})
				.catch((_error) => {
					dispatch(
						openSnackbar({
							open: true,
							message: "Error inesperado al eliminar el contacto.",
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);
				});
			handleMenuClose();
		},
		[folderId],
	);

	const handleUnlink = async (contactId: string) => {
		try {
			const result = await dispatch(unlinkFolderFromContact(contactId, folderId));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Contacto desvinculado correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);

				// Refresh the contacts list from Redux
				dispatch(filterContactsByFolder(folderId));
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al desvincular el contacto",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error inesperado al desvincular el contacto",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
		}
		handleMenuClose();
	};

	const EmptyState = () => (
		<Box sx={{ textAlign: "center", py: 4 }}>
			<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
				<Avatar
					color="error"
					variant="rounded"
					sx={{
						width: 64,
						height: 64,
						bgcolor: alpha(theme.palette.error.main, 0.1),
						color: "error.main",
						mx: "auto",
						mb: 2,
					}}
				>
					<UserSquare variant="Bold" size={32} />
				</Avatar>
			</motion.div>
			<Typography variant="subtitle1" color="textSecondary" gutterBottom>
				No hay intervinientes registrados
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 320, mx: "auto" }}>
				Agrega los contactos relacionados con este expediente como clientes, abogados, peritos y más
			</Typography>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			title={
				title ? (
					<List disablePadding>
						<ListItem sx={{ p: 0 }}>
							<ListItemAvatar>
								<Avatar color="success" variant="rounded">
									<UserSquare variant="Bold" />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								sx={{ my: 0 }}
								primary="Intervinientes"
								secondary={<Typography variant="subtitle1">Personas relacionadas con el expediente</Typography>}
							/>
						</ListItem>
					</List>
				) : null
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 2.5,
				},
			}}
		>
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleAdd}
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			>
				<AddCustomer open={add} onCancel={handleAdd} onAddMember={handlerAddress} mode="add" />
			</Dialog>
			<ModalMembers
				open={openModal}
				setOpen={setOpenModal}
				handlerAddress={handlerAddress}
				folderId={folderId}
				membersData={selectedContacts}
			/>

			{/* Actions Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			>
				<MenuItem onClick={handleViewProfile}>
					<ListItemIcon>
						<Profile size={18} />
					</ListItemIcon>
					<Typography variant="body2">Ver perfil</Typography>
				</MenuItem>
				<Divider />
				<MenuItem onClick={() => selectedMember && handleUnlink(selectedMember._id)}>
					<ListItemIcon>
						<Link1 size={18} color={theme.palette.warning.main} />
					</ListItemIcon>
					<Typography variant="body2" color="warning.main">
						Desvincular
					</Typography>
				</MenuItem>
				<MenuItem onClick={() => selectedMember && handleDelete(selectedMember._id)}>
					<ListItemIcon>
						<Trash size={18} color={theme.palette.error.main} />
					</ListItemIcon>
					<Typography variant="body2" color="error">
						Eliminar
					</Typography>
				</MenuItem>
			</Menu>

			<Box sx={{ p: 2.5 }}>
				{isLoader ? (
					<Stack spacing={2}>
						{[1, 2, 3].map((index) => (
							<Paper key={index} sx={{ p: 2 }}>
								<Stack direction="row" spacing={2} alignItems="center">
									<Skeleton variant="circular" width={48} height={48} />
									<Box flex={1}>
										<Skeleton width="60%" height={20} sx={{ mb: 0.5 }} />
										<Skeleton width="40%" height={16} />
									</Box>
									<Skeleton variant="circular" width={30} height={30} />
								</Stack>
							</Paper>
						))}
					</Stack>
				) : selectedContacts.length === 0 ? (
					<>
						<EmptyState />
						<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
							<Button
								variant="contained"
								fullWidth
								color="primary"
								startIcon={<UserAdd size={18} />}
								onClick={handleAdd}
								disabled={isLoader}
							>
								Nuevo Interviniente
							</Button>
							<Button
								variant="outlined"
								fullWidth
								color="primary"
								startIcon={<Link1 size={18} />}
								onClick={handleOpen}
								disabled={isLoader}
							>
								Vincular Existente
							</Button>
						</Stack>
					</>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", height: { xs: "60vh", sm: "500px" } }}>
						<>
							{/* Members List - Scrollable */}
							<Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
								<SimpleBar style={{ height: "100%" }}>
									<Stack spacing={1.5} ref={parent}>
										{selectedContacts.map((member: Contact, index: number) => (
											<motion.div
												key={member._id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
											>
												<Paper
													elevation={0}
													sx={{
														p: 2,
														border: `1px solid ${theme.palette.divider}`,
														borderRadius: 2,
														transition: "all 0.2s ease",
														"&:hover": {
															borderColor: theme.palette.primary.main,
															bgcolor: alpha(theme.palette.primary.main, 0.02),
															transform: "translateY(-2px)",
															boxShadow: theme.shadows[2],
														},
													}}
												>
													<Stack direction="row" alignItems="center" spacing={2}>
														<Avatar
															alt={member.name}
															src={member.avatar}
															variant="rounded"
															size="md"
															color={getColorByRole(member.role)}
															sx={{
																width: 48,
																height: 48,
																fontSize: "1.5rem",
															}}
														>
															{!member.avatar && getRoleIcon(member.role)}
														</Avatar>
														<Box flex={1} minWidth={0}>
															<Typography variant="subtitle1" fontWeight={600} noWrap>
																{`${member.name || ""} ${member.lastName || ""}`}
															</Typography>
															<Stack direction="row" spacing={1} alignItems="center">
																<Chip
																	label={member.role}
																	size="small"
																	color={getColorByRole(member.role)}
																	sx={{
																		height: 24,
																		fontSize: "0.75rem",
																		fontWeight: 500,
																		...(getColorByRole(member.role) === "warning" && {
																			color: "black",
																			"& .MuiChip-label": {
																				color: "black",
																			},
																		}),
																	}}
																/>
																{member.email && (
																	<Typography variant="caption" color="text.secondary" noWrap>
																		{member.email}
																	</Typography>
																)}
															</Stack>
														</Box>
														<IconButton
															size="small"
															onClick={(e) => handleMenuOpen(e, member)}
															sx={{
																color: "text.secondary",
																"&:hover": {
																	bgcolor: alpha(theme.palette.primary.main, 0.1),
																	color: "primary.main",
																},
															}}
														>
															<More size={18} />
														</IconButton>
													</Stack>
												</Paper>
											</motion.div>
										))}
									</Stack>
								</SimpleBar>
							</Box>
							{/* Action Buttons - Fixed at bottom */}
							<Stack direction="row" spacing={2} sx={{ mt: 2, flexShrink: 0 }}>
								<Button
									variant="contained"
									fullWidth
									color="primary"
									startIcon={<UserAdd size={18} />}
									onClick={handleAdd}
									disabled={isLoader}
								>
									Nuevo Interviniente
								</Button>
								<Button
									variant="outlined"
									fullWidth
									color="primary"
									startIcon={<Link1 size={18} />}
									onClick={handleOpen}
									disabled={isLoader}
								>
									Vincular Existente
								</Button>
							</Stack>
						</>
					</Box>
				)}
			</Box>

			{/* Contact Profile Modal */}
			<ContactProfileModal open={profileModalOpen} onClose={handleProfileModalClose} contact={selectedMember} />
		</MainCard>
	);
};

export default MembersImproved;
