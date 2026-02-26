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
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Tab,
	Alert,
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import SimpleBar from "components/third-party/SimpleBar";
import { UserSquare, Trash, Link1, More, Profile, UserAdd, ArrowDown2, User, Briefcase, Archive } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import { Link as RouterLink } from "react-router-dom";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import AddCustomer from "sections/apps/customer/AddCustomer";
import ModalMembers from "../modals/ModalMembers";
import ContactProfileModal from "../modals/ContactProfileModal";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion } from "framer-motion";

import { Contact, ParteRepresentada } from "types/contact";
import { deleteContact, unlinkFolderFromContact, filterContactsByFolder, archiveContacts } from "store/reducers/contacts";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";

interface MembersProps {
	title: string;
	membersData: Contact[];
	isLoader: boolean;
	folderId: string;
}

// Helper para obtener el primer rol (para contactos con múltiples roles)
const getFirstRole = (role: string | string[]): string => {
	if (Array.isArray(role)) {
		return role[0] || "";
	}
	return role || "";
};

// Helper para mostrar roles como string
const formatRoles = (role: string | string[]): string => {
	if (Array.isArray(role)) {
		return role.join(", ");
	}
	return role || "";
};

const getColorByRole = (role: string | string[]) => {
	const firstRole = getFirstRole(role);
	switch (firstRole) {
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
		// Roles de intervinientes PJN
		case "LETRADO APODERADO":
		case "LETRADO PATROCINANTE":
		case "LETRADO":
			return "primary";
		case "ACTOR":
			return "success";
		case "DEMANDADO":
			return "error";
		case "TERCERO":
			return "warning";
		default:
			return "default";
	}
};

const getRoleIcon = (role: string | string[]) => {
	const firstRole = getFirstRole(role);
	switch (firstRole) {
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
		// Roles de intervinientes PJN
		case "LETRADO APODERADO":
		case "LETRADO PATROCINANTE":
		case "LETRADO":
			return "⚖️";
		case "ACTOR":
			return "👤";
		case "DEMANDADO":
			return "👥";
		case "TERCERO":
			return "🔷";
		default:
			return "👥";
	}
};

const MembersImproved: React.FC<MembersProps> = ({ title, membersData, isLoader, folderId }) => {
	const theme = useTheme();
	const { canDelete, canUpdate, canCreate } = useTeam();
	// Get selectedContacts and archivedByFolderCount from Redux store
	const selectedContacts = useSelector((state: any) => state.contacts.selectedContacts || []);
	const archivedByFolderCount = useSelector((state: any) => state.contacts.archivedByFolderCount || 0);
	const [add, setAdd] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedMember, setSelectedMember] = useState<Contact | null>(null);
	const [profileModalOpen, setProfileModalOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"accordion" | "list">("accordion");

	// Helper para verificar si un contacto tiene un tipo de interviniente
	const contactHasTipo = (contact: Contact, tipo: "PARTE" | "LETRADO"): boolean => {
		const tipoInterv = contact.intervinienteRef?.tipoInterviniente;
		if (!tipoInterv) return false;
		if (Array.isArray(tipoInterv)) return tipoInterv.includes(tipo);
		return tipoInterv === tipo;
	};

	// Separar contactos por tipo: intervinientes (partes/letrados) vs manuales
	// Un contacto puede ser PARTE y LETRADO a la vez (auto-representación)
	const { partes, letrados, manuales, hasIntervinientes } = useMemo(() => {
		const partesArr: Contact[] = [];
		const letradosArr: Contact[] = [];
		const manualesArr: Contact[] = [];

		for (const contact of selectedContacts) {
			if (contact.importSource === "interviniente" && contact.intervinienteRef) {
				const esParte = contactHasTipo(contact, "PARTE");
				const esLetrado = contactHasTipo(contact, "LETRADO");

				// Si es PARTE, agregarlo a partes (aunque también sea LETRADO)
				if (esParte) {
					partesArr.push(contact);
				}
				// Si es LETRADO (y solo LETRADO, no mixto), agregarlo a letrados
				// Los mixtos ya están en partes y aparecerán como su propio letrado
				if (esLetrado && !esParte) {
					letradosArr.push(contact);
				}
				// Si no tiene ningún tipo definido
				if (!esParte && !esLetrado) {
					manualesArr.push(contact);
				}
			} else {
				manualesArr.push(contact);
			}
		}

		return {
			partes: partesArr,
			letrados: letradosArr,
			manuales: manualesArr,
			hasIntervinientes: partesArr.length > 0 || letradosArr.length > 0,
		};
	}, [selectedContacts]);

	// Obtener letrados que representan a una parte específica
	// Incluye auto-referencias (cuando la parte se representa a sí misma)
	const getLetradosPorParte = useCallback(
		(parteNombre: string, parteContactId?: string) => {
			const result: { contact: Contact; parteRep: ParteRepresentada; isSelf: boolean }[] = [];

			// Buscar en letrados "puros" (solo LETRADO)
			for (const letrado of letrados) {
				const parteRep = letrado.intervinienteRef?.partesRepresentadas?.find(
					(pr) => pr.nombre === parteNombre || (pr.contactId && parteContactId && pr.contactId === parteContactId)
				);
				if (parteRep) {
					result.push({ contact: letrado, parteRep, isSelf: false });
				}
			}

			// Buscar auto-referencias en la propia parte (si es PARTE+LETRADO)
			const parteContact = partes.find((p) => p.name === parteNombre || p._id === parteContactId);
			if (parteContact && contactHasTipo(parteContact, "LETRADO")) {
				const selfRep = parteContact.intervinienteRef?.partesRepresentadas?.find(
					(pr) => pr.isSelfRepresented || pr.contactId === parteContact._id
				);
				if (selfRep) {
					result.push({ contact: parteContact, parteRep: selfRep, isSelf: true });
				}
			}

			return result;
		},
		[letrados, partes]
	);

	// Letrados sin parte asignada o cuyas partes ya no existen
	const letradosSinParte = useMemo(() => {
		return letrados.filter((letrado) => {
			const partesRep = letrado.intervinienteRef?.partesRepresentadas;

			// Si no tiene partesRepresentadas, es "sin parte"
			if (!partesRep || partesRep.length === 0) {
				return true;
			}

			// Si tiene partesRepresentadas, verificar si alguna parte existe
			// Una parte "existe" si hay un contacto con ese nombre o contactId en el array de partes
			const tieneParteExistente = partesRep.some((pr) => {
				// Si tiene contactId válido, buscar por ID
				if (pr.contactId) {
					return partes.some((p) => p._id === pr.contactId);
				}
				// Si contactId es null, buscar por nombre
				return partes.some((p) => p.name === pr.nombre);
			});

			// Si ninguna de sus partes existe, mostrarlo en "Otros Letrados"
			return !tieneParteExistente;
		});
	}, [letrados, partes]);

	// Color del chip según tipo de parte
	const getParteChipColor = (tipo: string): "primary" | "error" | "warning" | "info" => {
		switch (tipo?.toUpperCase()) {
			case "ACTOR":
				return "primary";
			case "DEMANDADO":
				return "error";
			case "TERCERO":
				return "warning";
			default:
				return "info";
		}
	};

	// Color del chip según tipo de letrado
	const getLetradoChipColor = (tipo: string): "primary" | "secondary" | "success" => {
		if (tipo?.includes("APODERADO")) return "primary";
		if (tipo?.includes("PATROCINANTE")) return "secondary";
		return "success";
	};

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

	const handleArchive = async (contactId: string, userId: string) => {
		try {
			const result = await dispatch(archiveContacts(userId, [contactId]));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Contacto archivado correctamente",
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
						message: result.message || "Error al archivar el contacto",
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
					message: "Error inesperado al archivar el contacto",
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
				<AddCustomer open={add} onCancel={handleAdd} onAddMember={handlerAddress} mode="add" folderId={folderId} />
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
				{canUpdate && selectedMember?.importSource !== "interviniente" && (
					<>
						<Divider />
						<MenuItem onClick={() => selectedMember && handleUnlink(selectedMember._id)}>
							<ListItemIcon>
								<Link1 size={18} color={theme.palette.warning.main} />
							</ListItemIcon>
							<Typography variant="body2" color="warning.main">
								Desvincular
							</Typography>
						</MenuItem>
					</>
				)}
				{canUpdate && selectedMember?.importSource === "interviniente" && (
					<>
						<Divider />
						<MenuItem onClick={() => selectedMember && handleArchive(selectedMember._id, selectedMember.userId)}>
							<ListItemIcon>
								<Archive size={18} color={theme.palette.warning.main} />
							</ListItemIcon>
							<Typography variant="body2" color="warning.main">
								Archivar
							</Typography>
						</MenuItem>
					</>
				)}
				{canDelete && (
					<MenuItem onClick={() => selectedMember && handleDelete(selectedMember._id)}>
						<ListItemIcon>
							<Trash size={18} color={theme.palette.error.main} />
						</ListItemIcon>
						<Typography variant="body2" color="error">
							Eliminar
						</Typography>
					</MenuItem>
				)}
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
						{canCreate && (
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
								<Button variant="outlined" fullWidth color="primary" startIcon={<Link1 size={18} />} onClick={handleOpen} disabled={isLoader}>
									Vincular Existente
								</Button>
							</Stack>
						)}
					</>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", height: { xs: "60vh", sm: "500px" } }}>
						<>
							{/* Tabs para cambiar vista solo si hay intervinientes */}
							{hasIntervinientes && (
								<Tabs
									value={viewMode}
									onChange={(_, newValue) => setViewMode(newValue)}
									sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
								>
									<Tab
										value="accordion"
										label="Vista por Partes"
										icon={<User size={16} />}
										iconPosition="start"
										sx={{ minHeight: 48 }}
									/>
									<Tab
										value="list"
										label="Lista Completa"
										icon={<Briefcase size={16} />}
										iconPosition="start"
										sx={{ minHeight: 48 }}
									/>
								</Tabs>
							)}

							{/* Vista Acordeón - Partes con Letrados anidados */}
							{viewMode === "accordion" && hasIntervinientes ? (
								<Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
									<SimpleBar style={{ height: "100%" }}>
										<Stack spacing={1}>
											{/* Partes como acordeones */}
											{partes.map((parte, index) => {
												const letradosDeParte = getLetradosPorParte(parte.name);
												const tipoParte = parte.intervinienteRef?.tipoParte || getFirstRole(parte.role);

												return (
													<Accordion key={parte._id} defaultExpanded={index === 0}>
														<AccordionSummary
															expandIcon={<ArrowDown2 size={18} />}
															sx={{
																"& .MuiAccordionSummary-content": {
																	alignItems: "center",
																},
															}}
														>
															<Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
																<Avatar
																	alt={parte.name}
																	src={parte.avatar}
																	variant="rounded"
																	size="sm"
																	color={getParteChipColor(tipoParte)}
																>
																	{!parte.avatar && <User size={16} />}
																</Avatar>
																<Chip
																	label={tipoParte}
																	color={getParteChipColor(tipoParte)}
																	size="small"
																	sx={{ fontWeight: 500 }}
																/>
																{contactHasTipo(parte, "LETRADO") && (
																	<Chip
																		label="También Letrado"
																		color="secondary"
																		size="small"
																		variant="outlined"
																		sx={{ fontWeight: 500 }}
																	/>
																)}
																<Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
																	{`${parte.name || ""} ${parte.lastName || ""}`}
																</Typography>
																{letradosDeParte.length > 0 && (
																	<Chip
																		label={`${letradosDeParte.length} letrado${letradosDeParte.length > 1 ? "s" : ""}`}
																		size="small"
																		variant="outlined"
																		color="primary"
																	/>
																)}
																<IconButton
																	size="small"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleMenuOpen(e, parte);
																	}}
																	sx={{ color: "text.secondary" }}
																>
																	<More size={16} />
																</IconButton>
															</Stack>
														</AccordionSummary>
														<AccordionDetails sx={{ pt: 0 }}>
															{/* Datos de la parte */}
															<Box sx={{ mb: 2 }}>
																<Stack direction="row" spacing={4}>
																	{parte.intervinienteRef?.tomoFolio && (
																		<Typography variant="body2" color="textSecondary">
																			<strong>Tomo/Folio:</strong> {parte.intervinienteRef.tomoFolio}
																		</Typography>
																	)}
																	{parte.intervinienteRef?.iej && (
																		<Typography variant="body2" color="textSecondary">
																			<strong>IEJ:</strong> {parte.intervinienteRef.iej}
																		</Typography>
																	)}
																	{parte.type && (
																		<Typography variant="body2" color="textSecondary">
																			<strong>Tipo:</strong> {parte.type}
																		</Typography>
																	)}
																</Stack>
															</Box>

															{/* Letrados de esta parte */}
															{letradosDeParte.length > 0 && (
																<Box>
																	<Divider sx={{ my: 1 }} />
																	<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
																		Letrados ({letradosDeParte.length})
																	</Typography>
																	<TableContainer component={Paper} variant="outlined">
																		<Table size="small">
																			<TableHead>
																				<TableRow>
																					<TableCell>Tipo</TableCell>
																					<TableCell>Nombre</TableCell>
																					<TableCell>Matrícula</TableCell>
																					<TableCell>Estado IEJ</TableCell>
																					<TableCell align="right">Acciones</TableCell>
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				{letradosDeParte.map(({ contact, parteRep, isSelf }) => {
																					const rolLetrado = parteRep.role || getFirstRole(contact.role) || "LETRADO";
																					return (
																						<TableRow key={`${contact._id}-${isSelf ? "self" : "ext"}`}>
																							<TableCell>
																								<Chip
																									label={rolLetrado}
																									color={getLetradoChipColor(rolLetrado)}
																									size="small"
																									variant="outlined"
																								/>
																							</TableCell>
																							<TableCell>
																								<Stack direction="row" spacing={1} alignItems="center">
																									<Typography variant="body2" fontWeight={500}>
																										{`${contact.name || ""} ${contact.lastName || ""}`}
																									</Typography>
																									{isSelf && (
																										<Typography variant="caption" color="textSecondary" fontStyle="italic">
																											(se representa a sí mismo)
																										</Typography>
																									)}
																								</Stack>
																							</TableCell>
																							<TableCell>
																								<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
																									{contact.intervinienteRef?.matricula || "-"}
																								</Typography>
																							</TableCell>
																							<TableCell>
																								{contact.intervinienteRef?.estadoIej ? (
																									<Chip
																										label={contact.intervinienteRef.estadoIej}
																										size="small"
																										color={contact.intervinienteRef.estadoIej === "CONSTITUIDO" ? "success" : "default"}
																									/>
																								) : (
																									"-"
																								)}
																							</TableCell>
																							<TableCell align="right">
																								{!isSelf && (
																									<IconButton
																										size="small"
																										onClick={(e) => handleMenuOpen(e, contact)}
																										sx={{ color: "text.secondary" }}
																									>
																										<More size={16} />
																									</IconButton>
																								)}
																							</TableCell>
																						</TableRow>
																					);
																				})}
																			</TableBody>
																		</Table>
																	</TableContainer>
																</Box>
															)}

															{letradosDeParte.length === 0 && (
																<Typography variant="body2" color="textSecondary" fontStyle="italic">
																	Sin letrados registrados para esta parte
																</Typography>
															)}
														</AccordionDetails>
													</Accordion>
												);
											})}

											{/* Letrados sin parte asignada */}
											{letradosSinParte.length > 0 && (
												<Box sx={{ mt: 2 }}>
													<Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
														<Briefcase size={20} />
														Otros Letrados
													</Typography>
													<TableContainer component={Paper} variant="outlined">
														<Table size="small">
															<TableHead>
																<TableRow>
																	<TableCell>Tipo</TableCell>
																	<TableCell>Nombre</TableCell>
																	<TableCell>Matrícula</TableCell>
																	<TableCell>Estado IEJ</TableCell>
																	<TableCell align="right">Acciones</TableCell>
																</TableRow>
															</TableHead>
															<TableBody>
																{letradosSinParte.map((letrado) => (
																	<TableRow key={letrado._id}>
																		<TableCell>
																			<Chip
																				label={formatRoles(letrado.role)}
																				color={getLetradoChipColor(getFirstRole(letrado.role))}
																				size="small"
																				variant="outlined"
																			/>
																		</TableCell>
																		<TableCell>
																			<Typography variant="body2" fontWeight={500}>
																				{`${letrado.name || ""} ${letrado.lastName || ""}`}
																			</Typography>
																		</TableCell>
																		<TableCell>
																			<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
																				{letrado.intervinienteRef?.matricula || "-"}
																			</Typography>
																		</TableCell>
																		<TableCell>
																			{letrado.intervinienteRef?.estadoIej ? (
																				<Chip
																					label={letrado.intervinienteRef.estadoIej}
																					size="small"
																					color={letrado.intervinienteRef.estadoIej === "CONSTITUIDO" ? "success" : "default"}
																				/>
																			) : (
																				"-"
																			)}
																		</TableCell>
																		<TableCell align="right">
																			<IconButton
																				size="small"
																				onClick={(e) => handleMenuOpen(e, letrado)}
																				sx={{ color: "text.secondary" }}
																			>
																				<More size={16} />
																			</IconButton>
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</TableContainer>
												</Box>
											)}

											{/* Contactos manuales */}
											{manuales.length > 0 && (
												<Box sx={{ mt: 2 }}>
													<Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
														<UserAdd size={20} />
														Contactos Manuales
													</Typography>
													<Stack spacing={1.5}>
														{manuales.map((member, index) => (
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
																			sx={{ width: 40, height: 40 }}
																		>
																			{!member.avatar && getRoleIcon(member.role)}
																		</Avatar>
																		<Box flex={1} minWidth={0}>
																			<Typography variant="subtitle1" fontWeight={600} noWrap>
																				{`${member.name || ""} ${member.lastName || ""}`}
																			</Typography>
																			<Chip
																				label={formatRoles(member.role)}
																				size="small"
																				color={getColorByRole(member.role)}
																				sx={{ height: 20, fontSize: "0.7rem" }}
																			/>
																		</Box>
																		<IconButton
																			size="small"
																			onClick={(e) => handleMenuOpen(e, member)}
																			sx={{ color: "text.secondary" }}
																		>
																			<More size={16} />
																		</IconButton>
																	</Stack>
																</Paper>
															</motion.div>
														))}
													</Stack>
												</Box>
											)}
										</Stack>
									</SimpleBar>
								</Box>
							) : (
								/* Vista Lista - Todos los contactos */
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
																		label={formatRoles(member.role)}
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
							)}
							{/* Indicador de contactos archivados */}
							{archivedByFolderCount > 0 && (
								<Alert
									severity="info"
									icon={<Archive size={18} />}
									sx={{ mt: 2 }}
									action={
										<Button
											component={RouterLink}
											to="/apps/customer/customer-list"
											color="inherit"
											size="small"
											sx={{
												fontWeight: 600,
												textTransform: "none",
												whiteSpace: "nowrap",
											}}
										>
											Ver en Contactos
										</Button>
									}
								>
									{archivedByFolderCount} contacto{archivedByFolderCount > 1 ? "s" : ""} archivado{archivedByFolderCount > 1 ? "s" : ""}
								</Alert>
							)}
							{/* Action Buttons - Fixed at bottom (solo para usuarios con permisos de crear) */}
							{canCreate && (
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
							)}
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
