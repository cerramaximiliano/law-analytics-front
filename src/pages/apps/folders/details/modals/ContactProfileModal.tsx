import React from "react";
import { DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack, useTheme, alpha, Grid } from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { Call, Sms, Location, Building, Briefcase, User, DocumentText, Profile } from "iconsax-react";
import { Contact } from "types/contact";
import { BRAND_BLUE, LIVE_GREEN } from "themes/dashboardTokens";

interface ContactProfileModalProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
}

const ContactProfileModal: React.FC<ContactProfileModalProps> = ({ open, onClose, contact }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	if (!contact) return null;

	const role = Array.isArray(contact?.role) ? contact.role[0] : contact?.role || "";
	const fullName = `${contact.name || ""} ${contact.lastName || ""}`.trim();
	const initials = `${(contact.name || "").charAt(0)}${(contact.lastName || "").charAt(0)}`.toUpperCase();
	const isActive = contact.status === "active";
	const activeAccent = isActive ? LIVE_GREEN : theme.palette.text.disabled;

	const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => {
		if (!value) return null;
		return (
			<Stack direction="row" spacing={1.25} alignItems="flex-start">
				<Box
					sx={{
						width: 28,
						height: 28,
						borderRadius: 0.75,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
						color: BRAND_BLUE,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0 }}>
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{label}
					</Typography>
					<Typography
						sx={{
							fontSize: "0.85rem",
							fontWeight: 500,
							color: "text.primary",
							letterSpacing: "-0.005em",
							wordBreak: "break-word",
						}}
					>
						{value}
					</Typography>
				</Stack>
			</Stack>
		);
	};

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					p: 0,
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
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
					<Profile size={18} variant="Bulk" />
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
							Detalle
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Perfil del contacto
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5 }}>
				{/* Header — avatar + name + status pills */}
				<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
					<Box
						sx={{
							width: 64,
							height: 64,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
							color: BRAND_BLUE,
							fontSize: "1.4rem",
							fontWeight: 600,
							letterSpacing: "-0.02em",
							flexShrink: 0,
						}}
					>
						{initials || <Profile size={28} variant="Bulk" />}
					</Box>
					<Stack spacing={0.625} sx={{ minWidth: 0 }}>
						<Typography
							sx={{
								fontSize: "1.15rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								lineHeight: 1.2,
							}}
						>
							{fullName || "Sin nombre"}
						</Typography>
						<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
							{role && (
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.5,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 600,
											color: BRAND_BLUE,
											letterSpacing: "0.04em",
											textTransform: "uppercase",
											lineHeight: 1,
										}}
									>
										{role}
									</Typography>
								</Box>
							)}
							{contact.status && (
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.5,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(activeAccent, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(activeAccent, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: activeAccent }} />
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 600,
											color: activeAccent,
											letterSpacing: "0.04em",
											textTransform: "uppercase",
											lineHeight: 1,
										}}
									>
										{isActive ? "Activo" : "Inactivo"}
									</Typography>
								</Box>
							)}
						</Stack>
					</Stack>
				</Stack>

				{/* Contact info — 2 columns */}
				<Box
					sx={{
						p: 2,
						borderRadius: 1.5,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Stack spacing={1.5}>
								<InfoItem icon={<User size={14} variant="Bulk" />} label="Documento" value={contact.document} />
								<InfoItem icon={<User size={14} variant="Bulk" />} label="CUIT" value={contact.cuit} />
								<InfoItem icon={<Call size={14} variant="Bulk" />} label="Teléfono" value={contact.phone} />
								<InfoItem icon={<Sms size={14} variant="Bulk" />} label="Email" value={contact.email} />
							</Stack>
						</Grid>
						<Grid item xs={12} md={6}>
							<Stack spacing={1.5}>
								<InfoItem icon={<Location size={14} variant="Bulk" />} label="Dirección" value={contact.address} />
								<InfoItem icon={<Building size={14} variant="Bulk" />} label="Ciudad" value={contact.city} />
								<InfoItem icon={<Briefcase size={14} variant="Bulk" />} label="Provincia" value={contact.state} />
							</Stack>
						</Grid>
					</Grid>
				</Box>

				{/* Additional info */}
				{(contact.activity || contact.company || contact.nationality) && (
					<Box
						sx={{
							mt: 2,
							p: 2,
							borderRadius: 1.5,
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						}}
					>
						<Stack direction="row" spacing={0.625} alignItems="center" mb={1.25}>
							<DocumentText size={12} variant="Bulk" color={BRAND_BLUE} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Información adicional
							</Typography>
						</Stack>
						<Stack spacing={1}>
							{contact.activity && (
								<Stack direction="row" spacing={1} alignItems="baseline">
									<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "-0.005em", minWidth: 90 }}>
										Actividad
									</Typography>
									<Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
										{contact.activity}
									</Typography>
								</Stack>
							)}
							{contact.company && (
								<Stack direction="row" spacing={1} alignItems="baseline">
									<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "-0.005em", minWidth: 90 }}>
										Empresa
									</Typography>
									<Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
										{contact.company}
									</Typography>
								</Stack>
							)}
							{contact.nationality && (
								<Stack direction="row" spacing={1} alignItems="baseline">
									<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "-0.005em", minWidth: 90 }}>
										Nacionalidad
									</Typography>
									<Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
										{contact.nationality}
									</Typography>
								</Stack>
							)}
						</Stack>
					</Box>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Button
					onClick={onClose}
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
					Cerrar
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ContactProfileModal;
