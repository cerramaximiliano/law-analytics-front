// pages/teams/accept-invitation.tsx
import { useState, useEffect, SyntheticEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Box,
	Container,
	Paper,
	Typography,
	Stack,
	Button,
	Alert,
	CircularProgress,
	Avatar,
	Divider,
	Skeleton,
	OutlinedInput,
	InputAdornment,
	FormControl,
	Grid,
	TextField,
} from "@mui/material";
import { People, TickCircle, CloseCircle, Sms, Lock, Login, Warning2, Logout, Eye, EyeSlash } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { getUserTeams } from "store/reducers/teams";
import axios from "utils/axios";
import Logo from "components/logo";
import { RoleBadge, ResourceMigrationSection } from "sections/apps/teams";
import { useTeam } from "contexts/TeamContext";
import IconButton from "components/@extended/IconButton";
import { strengthColor, strengthIndicator } from "utils/password-strength";
import { StringColorProps } from "types/password";

interface InvitationDetails {
	teamName: string;
	teamDescription?: string;
	inviterName: string;
	inviterEmail: string;
	role: "admin" | "editor" | "viewer";
	email: string;
	expiresAt: string;
	userExists: boolean;
}

interface ResourceSummary {
	folders: number;
	calculators: number;
	contacts: number;
	notes: number;
	events: number;
	tasks: number;
	documents: number;
	movements: number;
	availabilities: number;
	totalStorage: number;
}

interface ExceededLimit {
	resource: string;
	displayName: string;
	current: number;
	toMigrate: number;
	afterMigration: number;
	limit: number;
	exceeded: number;
	unit?: string;
}

type FlowState =
	| "loading"
	| "error"
	| "logged-in"
	| "verify-code"
	| "register"
	| "success"
	| "expired"
	| "handle-resources"
	| "limits-exceeded" // Resource migration would exceed plan limits
	| "already-in-team"; // User is already a member of another team

interface CurrentTeamInfo {
	_id: string;
	name: string;
	role: string;
}

// Helper to translate plan names to Spanish
const getPlanDisplayName = (planName: string | null): string => {
	if (!planName) return "Desconocido";
	const planNames: Record<string, string> = {
		free: "Gratuito",
		standard: "Estándar",
		premium: "Premium",
	};
	return planNames[planName.toLowerCase()] || planName;
};

export default function AcceptInvitationPage() {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const auth = useSelector((state) => state.auth);
	const isLoggedIn = auth.isLoggedIn;
	const { refreshTeams } = useTeam();

	const [flowState, setFlowState] = useState<FlowState>("loading");
	const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasAccepted, setHasAccepted] = useState(false); // Prevents re-verification after success

	// For resource handling flow
	const [resourceSummary, setResourceSummary] = useState<ResourceSummary | null>(null);
	const [groupId, setGroupId] = useState<string | null>(null);
	const [exceededLimits, setExceededLimits] = useState<ExceededLimit[]>([]);
	const [ownerPlanName, setOwnerPlanName] = useState<string | null>(null);

	// For already-in-team flow
	const [currentTeamInfo, setCurrentTeamInfo] = useState<CurrentTeamInfo | null>(null);

	// For verification code flow
	const [verificationCode, setVerificationCode] = useState("");
	const [codeSent, setCodeSent] = useState(false);

	// For registration flow
	const [registerPassword, setRegisterPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [level, setLevel] = useState<StringColorProps>();

	// Verify token on mount (skip if already accepted)
	useEffect(() => {
		// Don't re-verify if invitation was already accepted
		if (hasAccepted) return;

		const verifyToken = async () => {
			if (!token) {
				setError("Token de invitación no válido");
				setFlowState("error");
				return;
			}

			try {
				const response = await axios.get(`/api/groups/invitations/verify/${token}`);

				if (response.data.success) {
					// Map backend response to frontend expected format
					const invitationData = response.data.invitation;
					const details: InvitationDetails = {
						teamName: invitationData.groupName,
						teamDescription: invitationData.groupDescription,
						inviterName: invitationData.invitedBy,
						inviterEmail: "", // Not provided by backend
						role: invitationData.role,
						email: invitationData.email,
						expiresAt: invitationData.expiresAt,
						userExists: response.data.userExists,
					};
					setInvitation(details);

					// Check if invitation is expired
					if (new Date(details.expiresAt) < new Date()) {
						setFlowState("expired");
						return;
					}

					// Determine flow based on auth state
					if (isLoggedIn) {
						setFlowState("logged-in");
					} else if (response.data.userExists) {
						setFlowState("verify-code");
					} else {
						setFlowState("register");
					}
				} else {
					setError(response.data.message || "Invitación no válida");
					setFlowState("error");
				}
			} catch (err: any) {
				const message = err.response?.data?.message || "Error al verificar la invitación";
				setError(message);
				setFlowState("error");
			}
		};

		verifyToken();
	}, [token, isLoggedIn, hasAccepted]);

	// Accept invitation (logged in user)
	const handleAccept = async (skipResourceCheck = false) => {
		setIsSubmitting(true);
		setError(null);

		try {
			const response = await axios.post(`/api/groups/invitations/accept/${token}`, {
				skipResourceCheck,
			});

			if (response.data.success) {
				setHasAccepted(true);
				setFlowState("success");
			} else {
				setError(response.data.message || "Error al aceptar la invitación");
			}
		} catch (err: any) {
			// Handle ALREADY_IN_TEAM error (409)
			if (err.response?.status === 409 && err.response?.data?.code === "ALREADY_IN_TEAM") {
				setCurrentTeamInfo({
					_id: err.response.data.currentTeam._id,
					name: err.response.data.currentTeam.name,
					role: err.response.data.currentRole,
				});
				setFlowState("already-in-team");
			}
			// Handle USER_HAS_RESOURCES error (409)
			else if (err.response?.status === 409 && err.response?.data?.code === "USER_HAS_RESOURCES") {
				setResourceSummary(err.response.data.resourceSummary);
				setGroupId(err.response.data.groupId);
				setFlowState("handle-resources");
			}
			// Handle expired/invalid session (400 - "Datos insuficientes")
			// This happens when Redux shows isLoggedIn but the actual session has expired
			else if (err.response?.status === 400 && err.response?.data?.message?.includes("Datos insuficientes")) {
				// Session is stale - redirect to verify-code flow if user exists
				if (invitation?.userExists) {
					setFlowState("verify-code");
					setError("Tu sesión ha expirado. Por favor inicia sesión o verifica tu identidad.");
				} else {
					setFlowState("register");
					setError("Tu sesión ha expirado. Por favor crea una cuenta para continuar.");
				}
			} else {
				setError(err.response?.data?.message || "Error al aceptar la invitación");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Migrate resources to team
	const handleMigrateResources = async (asArchived = false) => {
		if (!groupId) return;

		setIsSubmitting(true);
		setError(null);

		try {
			// Migrate resources (optionally as archived)
			const migrateResponse = await axios.post(`/api/groups/${groupId}/migrate-resources`, {
				migrateAsArchived: asArchived,
			});

			if (migrateResponse.data.success) {
				// Then accept invitation with skipResourceCheck
				await handleAccept(true);
			} else {
				setError(migrateResponse.data.message || "Error al migrar recursos");
			}
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || "Error al migrar los recursos";

			// Handle PLAN_LIMITS_EXCEEDED error (403)
			if (err.response?.status === 403 && err.response?.data?.code === "PLAN_LIMITS_EXCEEDED") {
				setExceededLimits(err.response.data.exceededLimits || []);
				setOwnerPlanName(err.response.data.planName);
				setFlowState("limits-exceeded");
				setIsSubmitting(false);
				return;
			}

			// Handle STORAGE_LIMIT_EXCEEDED error (403)
			if (err.response?.status === 403 && err.response?.data?.code === "STORAGE_LIMIT_EXCEEDED") {
				setExceededLimits(err.response.data.exceededLimits || []);
				setOwnerPlanName(err.response.data.planName);
				setFlowState("limits-exceeded");
				setError("No hay suficiente espacio de almacenamiento en el equipo para migrar tus recursos.");
				setIsSubmitting(false);
				return;
			}

			// If no resources to migrate (already migrated), proceed to accept
			if (errorMessage.includes("No tienes recursos") || err.response?.status === 400) {
				await handleAccept(true);
			} else {
				setError(errorMessage);
				setIsSubmitting(false);
			}
		}
	};

	// Migrate resources as archived (bypasses count limits, only checks storage)
	const handleMigrateAsArchived = async () => {
		await handleMigrateResources(true);
	};

	// Delete resources
	const handleDeleteResources = async () => {
		setIsSubmitting(true);
		setError(null);

		try {
			// First, delete resources
			const deleteResponse = await axios.delete("/api/groups/delete-my-resources", {
				data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
			});

			if (deleteResponse.data.success) {
				// Then accept invitation with skipResourceCheck
				await handleAccept(true);
			} else {
				setError(deleteResponse.data.message || "Error al eliminar recursos");
			}
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || "Error al eliminar los recursos";

			// If no resources to delete, proceed to accept
			if (errorMessage.includes("No tienes recursos") || err.response?.status === 400) {
				await handleAccept(true);
			} else {
				setError(errorMessage);
				setIsSubmitting(false);
			}
		}
	};

	// Cancel resource handling and decline
	const handleCancelResourceHandling = () => {
		handleDecline();
	};

	// Send verification code
	const handleSendCode = async () => {
		if (!invitation) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await axios.post(`/api/groups/invitations/send-code/${token}`, {
				email: invitation.email,
			});

			if (response.data.success) {
				setCodeSent(true);
			} else {
				setError(response.data.message || "Error al enviar el código");
			}
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al enviar el código de verificación");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Verify code and accept
	const handleVerifyAndAccept = async () => {
		if (!verificationCode || verificationCode.length !== 6) {
			setError("Ingresa el código de 6 dígitos");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await axios.post(`/api/groups/invitations/accept/${token}`, {
				email: invitation?.email,
				verificationCode,
			});

			if (response.data.success) {
				// If session tokens are returned, store them
				if (response.data.tokens) {
					localStorage.setItem("accessToken", response.data.tokens.accessToken);
				}
				setHasAccepted(true);
				setFlowState("success");
			} else {
				setError(response.data.message || "Código incorrecto");
			}
		} catch (err: any) {
			// Handle ALREADY_IN_TEAM error for verify flow too
			if (err.response?.status === 409 && err.response?.data?.code === "ALREADY_IN_TEAM") {
				setCurrentTeamInfo({
					_id: err.response.data.currentTeam._id,
					name: err.response.data.currentTeam.name,
					role: err.response.data.currentRole,
				});
				setFlowState("already-in-team");
			}
			// Handle USER_HAS_RESOURCES error for verify flow too
			else if (err.response?.status === 409 && err.response?.data?.code === "USER_HAS_RESOURCES") {
				setResourceSummary(err.response.data.resourceSummary);
				setGroupId(err.response.data.groupId);
				setFlowState("handle-resources");
			} else {
				setError(err.response?.data?.message || "Error al verificar el código");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Register and accept
	const handleRegisterAndAccept = async () => {
		if (!registerPassword) {
			setError("Por favor ingresa una contraseña");
			return;
		}

		if (registerPassword.length < 8) {
			setError("La contraseña debe tener al menos 8 caracteres");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await axios.post(`/api/groups/invitations/accept/${token}`, {
				email: invitation?.email,
				password: registerPassword,
				isNewUser: true,
			});

			if (response.data.success) {
				// If registration requires email verification
				if (response.data.requiresEmailVerification) {
					// Redirect to code verification page with email
					const groupIdParam = response.data.group?._id ? `&groupId=${response.data.group._id}` : "";
					window.location.href = `/code-verification?email=${encodeURIComponent(invitation?.email || "")}&mode=register${groupIdParam}`;
					return;
				} else {
					// If session tokens are returned, store them
					if (response.data.tokens) {
						localStorage.setItem("accessToken", response.data.tokens.accessToken);
					}
					setHasAccepted(true);
					setFlowState("success");
				}
			} else {
				setError(response.data.message || "Error al registrar");
			}
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al crear la cuenta");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Decline invitation
	const handleDecline = async () => {
		setIsSubmitting(true);

		try {
			await axios.post(`/api/groups/invitations/decline/${token}`);
			navigate("/");
		} catch (err) {
			navigate("/");
		}
	};

	// Password handlers
	const handleClickShowPassword = () => setShowPassword(!showPassword);
	const handleMouseDownPassword = (event: SyntheticEvent) => event.preventDefault();
	const changePassword = (value: string) => {
		setRegisterPassword(value);
		const temp = strengthIndicator(value);
		setLevel(strengthColor(temp));
	};

	// Navigate to team (refresh teams first to ensure context is updated)
	const handleGoToTeam = async () => {
		try {
			// Refresh teams in both context and redux store
			await Promise.all([refreshTeams(), dispatch(getUserTeams() as any)]);
		} catch (err) {
			// Continue even if refresh fails - the page will load teams on mount
		}
		navigate("/apps/profiles/account/role");
	};

	// Render content based on flow state
	const renderContent = () => {
		if (flowState === "loading") {
			return (
				<Stack spacing={3}>
					{/* Header Skeleton */}
					<Stack direction="row" spacing={2} alignItems="center">
						<Skeleton variant="circular" width={56} height={56} />
						<Box sx={{ flex: 1 }}>
							<Skeleton variant="text" width="60%" height={32} />
							<Skeleton variant="text" width="40%" height={20} />
						</Box>
					</Stack>

					<Divider />

					{/* Details Skeleton */}
					<Stack spacing={2}>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Skeleton variant="text" width={100} />
							<Skeleton variant="text" width={120} />
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Skeleton variant="text" width={60} />
							<Skeleton variant="rounded" width={80} height={24} />
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Skeleton variant="text" width={50} />
							<Skeleton variant="text" width={180} />
						</Box>
					</Stack>

					<Divider />

					{/* Buttons Skeleton */}
					<Stack spacing={2}>
						<Skeleton variant="rounded" height={42} />
						<Skeleton variant="rounded" height={36} />
					</Stack>
				</Stack>
			);
		}

		if (flowState === "error") {
			return (
				<Stack spacing={3} alignItems="center">
					<CloseCircle size={64} color="red" variant="Bulk" />
					<Typography variant="h5" textAlign="center">
						Invitación no válida
					</Typography>
					<Alert severity="error">{error}</Alert>
					<Button variant="contained" onClick={() => navigate("/")}>
						Ir al inicio
					</Button>
				</Stack>
			);
		}

		if (flowState === "expired") {
			return (
				<Stack spacing={3} alignItems="center">
					<CloseCircle size={64} color="orange" variant="Bulk" />
					<Typography variant="h5" textAlign="center">
						Invitación expirada
					</Typography>
					<Typography color="text.secondary" textAlign="center">
						Esta invitación ha expirado. Solicita una nueva invitación al propietario del equipo.
					</Typography>
					<Button variant="contained" onClick={() => navigate("/")}>
						Ir al inicio
					</Button>
				</Stack>
			);
		}

		if (flowState === "success") {
			return (
				<Stack spacing={3} alignItems="center">
					<TickCircle size={64} color="green" variant="Bulk" />
					<Typography variant="h5" textAlign="center">
						Te has unido al equipo
					</Typography>
					<Typography color="text.secondary" textAlign="center">
						Ahora tienes acceso a los recursos compartidos de <strong>{invitation?.teamName}</strong>
					</Typography>
					<Button variant="contained" onClick={handleGoToTeam}>
						Ir al equipo
					</Button>
				</Stack>
			);
		}

		// Already in another team
		if (flowState === "already-in-team" && currentTeamInfo) {
			const roleLabels: Record<string, string> = {
				owner: "propietario",
				admin: "administrador",
				editor: "editor",
				viewer: "visualizador",
			};
			const roleLabel = roleLabels[currentTeamInfo.role] || "miembro";

			return (
				<Stack spacing={3}>
					{/* Header */}
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar sx={{ width: 56, height: 56, bgcolor: "warning.lighter" }}>
							<Warning2 size={28} color="#ed6c02" variant="Bulk" />
						</Avatar>
						<Box>
							<Typography variant="h5" color="warning.main">
								Ya perteneces a un equipo
							</Typography>
							<Typography variant="body2" color="text.secondary">
								No puedes unirte a múltiples equipos
							</Typography>
						</Box>
					</Stack>

					<Divider />

					<Alert severity="warning" icon={<Warning2 size={20} />}>
						<Typography variant="subtitle2" fontWeight={600}>
							Actualmente eres {roleLabel} del equipo "{currentTeamInfo.name}"
						</Typography>
						<Typography variant="body2" sx={{ mt: 1 }}>
							Para unirte al equipo <strong>{invitation?.teamName}</strong>, primero debes abandonar tu equipo actual.
						</Typography>
					</Alert>

					<Divider />

					<Typography variant="body2" color="text.secondary">
						Opciones disponibles:
					</Typography>
					<Stack spacing={1} sx={{ pl: 2 }}>
						<Typography variant="body2" color="text.secondary">
							• <strong>Ir a tu equipo actual</strong> y abandonarlo desde la configuración
						</Typography>
						<Typography variant="body2" color="text.secondary">
							• <strong>Rechazar esta invitación</strong> y permanecer en tu equipo actual
						</Typography>
					</Stack>

					<Divider />

					<Stack spacing={2}>
						<Button variant="contained" onClick={() => navigate("/apps/profiles/account/role")} startIcon={<Logout size={20} />}>
							Ir a mi equipo actual
						</Button>
						<Button variant="outlined" color="error" onClick={handleDecline}>
							Rechazar invitación
						</Button>
					</Stack>
				</Stack>
			);
		}

		// Limits exceeded - cannot migrate
		if (flowState === "limits-exceeded" && exceededLimits.length > 0) {
			return (
				<Stack spacing={3}>
					{/* Warning Header */}
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar sx={{ width: 56, height: 56, bgcolor: "warning.lighter" }}>
							<Warning2 size={28} color="#ed6c02" variant="Bulk" />
						</Avatar>
						<Box>
							<Typography variant="h5" color="warning.main">
								Límites del plan excedidos
							</Typography>
							<Typography variant="body2" color="text.secondary">
								No es posible migrar tus recursos al equipo <strong>{invitation?.teamName}</strong>
							</Typography>
						</Box>
					</Stack>

					<Divider />

					<Alert severity="warning" icon={<Warning2 size={20} />}>
						<Typography variant="subtitle2" fontWeight={600}>
							El plan del equipo ({getPlanDisplayName(ownerPlanName)}) no tiene capacidad suficiente
						</Typography>
						<Typography variant="body2" sx={{ mt: 1 }}>
							Migrar tus recursos excedería los siguientes límites:
						</Typography>
					</Alert>

					{/* Exceeded limits table */}
					<Stack spacing={1}>
						{exceededLimits.map((limit) => (
							<Paper
								key={limit.resource}
								variant="outlined"
								sx={{
									p: 2,
									borderColor: "error.light",
									bgcolor: "error.lighter",
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography fontWeight={600}>{limit.displayName}</Typography>
									<Typography color="error.main" fontWeight={600}>
										{limit.afterMigration} / {limit.limit} {limit.unit || ""}
									</Typography>
								</Stack>
								<Typography variant="caption" color="text.secondary">
									Actuales: {limit.current} + A migrar: {limit.toMigrate} = {limit.afterMigration} (excede por {limit.exceeded})
								</Typography>
							</Paper>
						))}
					</Stack>

					<Divider />

					{/* Primary action: Migrate as archived */}
					<Alert severity="success" sx={{ py: 1 }}>
						<Typography variant="subtitle2" fontWeight={600}>
							Solución recomendada: Migrar como archivados
						</Typography>
						<Typography variant="body2" sx={{ mt: 0.5 }}>
							Tus recursos se transferirán al equipo en estado archivado. No ocuparán cuota de recursos activos y podrás desarchivarlos
							cuando haya capacidad disponible.
						</Typography>
					</Alert>

					<Button
						variant="contained"
						color="primary"
						size="large"
						onClick={handleMigrateAsArchived}
						disabled={isSubmitting}
						startIcon={isSubmitting ? <CircularProgress size={20} /> : <TickCircle size={20} />}
						fullWidth
					>
						{isSubmitting ? "Migrando..." : "Migrar como archivados"}
					</Button>

					<Divider />

					<Typography variant="body2" color="text.secondary">
						Otras opciones:
					</Typography>
					<Stack spacing={1} sx={{ pl: 2 }}>
						<Typography variant="body2" color="text.secondary">
							• <strong>Eliminar algunos de tus recursos</strong> para reducir la cantidad a migrar
						</Typography>
						<Typography variant="body2" color="text.secondary">
							• <strong>Contactar al propietario del equipo</strong> para que actualice su plan
						</Typography>
						<Typography variant="body2" color="text.secondary">
							• <strong>Eliminar todos tus recursos</strong> y unirte sin migrar
						</Typography>
					</Stack>

					<Divider />

					<Stack spacing={2}>
						<Button variant="outlined" onClick={() => setFlowState("handle-resources")}>
							Volver a opciones
						</Button>
						<Button variant="text" color="error" onClick={handleDecline}>
							Rechazar invitación
						</Button>
					</Stack>
				</Stack>
			);
		}

		// Handle resources flow
		if (flowState === "handle-resources" && resourceSummary) {
			return (
				<Stack spacing={3}>
					{/* Team Header */}
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
							<People size={28} />
						</Avatar>
						<Box>
							<Typography variant="h5">{invitation?.teamName}</Typography>
							<Typography variant="body2" color="text.secondary">
								Unirse como <RoleBadge role={invitation?.role || "viewer"} size="small" />
							</Typography>
						</Box>
					</Stack>

					<Divider />

					{error && (
						<Alert severity="error" onClose={() => setError(null)}>
							{error}
						</Alert>
					)}

					<ResourceMigrationSection
						resourceSummary={resourceSummary}
						teamName={invitation?.teamName || ""}
						onMigrate={handleMigrateResources}
						onDelete={handleDeleteResources}
						onCancel={handleCancelResourceHandling}
						isSubmitting={isSubmitting}
					/>
				</Stack>
			);
		}

		// Show invitation details
		return (
			<Stack spacing={3}>
				{/* Invitation Header */}
				<Stack direction="row" spacing={2} alignItems="center">
					<Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
						<People size={28} />
					</Avatar>
					<Box>
						<Typography variant="h5">{invitation?.teamName}</Typography>
						{invitation?.teamDescription && (
							<Typography variant="body2" color="text.secondary">
								{invitation.teamDescription}
							</Typography>
						)}
					</Box>
				</Stack>

				<Divider />

				{/* Invitation Details */}
				<Stack spacing={2}>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography color="text.secondary">Invitado por:</Typography>
						<Typography fontWeight={500}>{invitation?.inviterName}</Typography>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography color="text.secondary">Tu rol:</Typography>
						<RoleBadge role={invitation?.role || "viewer"} />
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography color="text.secondary">Email:</Typography>
						<Typography>{invitation?.email}</Typography>
					</Box>
				</Stack>

				<Divider />

				{error && (
					<Alert severity="error" onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				{/* Flow-specific content */}
				{flowState === "logged-in" && (
					<Stack spacing={2}>
						<Button
							variant="contained"
							size="large"
							onClick={() => handleAccept()}
							disabled={isSubmitting}
							startIcon={isSubmitting ? <CircularProgress size={20} /> : <TickCircle size={20} />}
						>
							{isSubmitting ? "Aceptando..." : "Aceptar invitación"}
						</Button>
						<Button variant="outlined" color="error" onClick={handleDecline} disabled={isSubmitting}>
							Rechazar
						</Button>
					</Stack>
				)}

				{flowState === "verify-code" && (
					<Stack spacing={2}>
						<Alert severity="info" icon={<Lock size={20} />}>
							Ya tienes una cuenta con este email. Inicia sesión para aceptar la invitación.
						</Alert>

						{/* Primary action: Login */}
						<Button
							variant="contained"
							size="large"
							onClick={() => {
								// Navigate to login with forceLogin param to bypass stale auth state
								navigate(`/login?forceLogin=true`, {
									state: { from: `/teams/invitation/${token}` },
									replace: true,
								});
							}}
							startIcon={<Login size={20} />}
						>
							Iniciar sesión para aceptar
						</Button>

						{/* Alternative: Verification code */}
						<Divider sx={{ my: 1 }}>
							<Typography variant="caption" color="text.secondary">
								o verificar por código
							</Typography>
						</Divider>

						{!codeSent ? (
							<Button
								variant="outlined"
								size="small"
								onClick={handleSendCode}
								disabled={isSubmitting}
								startIcon={isSubmitting ? <CircularProgress size={16} /> : <Sms size={16} />}
							>
								{isSubmitting ? "Enviando..." : "Enviar código de verificación"}
							</Button>
						) : (
							<Stack spacing={2}>
								<Alert severity="success" sx={{ py: 0.5 }}>
									Código enviado a <strong>{invitation?.email}</strong>
								</Alert>
								<TextField
									label="Código de verificación"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
									placeholder="000000"
									size="small"
									inputProps={{ maxLength: 6, style: { textAlign: "center", letterSpacing: 8 } }}
									fullWidth
								/>
								<Stack direction="row" spacing={1}>
									<Button
										variant="contained"
										size="small"
										onClick={handleVerifyAndAccept}
										disabled={isSubmitting || verificationCode.length !== 6}
										startIcon={isSubmitting ? <CircularProgress size={16} /> : <TickCircle size={16} />}
										fullWidth
									>
										{isSubmitting ? "Verificando..." : "Verificar y aceptar"}
									</Button>
									<Button variant="text" size="small" onClick={handleSendCode} disabled={isSubmitting}>
										Reenviar
									</Button>
								</Stack>
							</Stack>
						)}

						<Divider sx={{ my: 1 }} />

						<Button variant="outlined" color="error" onClick={handleDecline} disabled={isSubmitting}>
							Rechazar invitación
						</Button>
					</Stack>
				)}

				{flowState === "register" && (
					<Stack spacing={2}>
						<Alert severity="info" sx={{ py: 0.5 }}>
							Crea una cuenta para unirte al equipo. Se usará: <strong>{invitation?.email}</strong>
						</Alert>

						{/* Password Field - matching AuthRegister style */}
						<Stack spacing={0.5}>
							<OutlinedInput
								fullWidth
								id="password-signup"
								type={showPassword ? "text" : "password"}
								value={registerPassword}
								onChange={(e) => changePassword(e.target.value)}
								startAdornment={
									<InputAdornment position="start">
										<Lock size={20} color="#8c8c8c" />
									</InputAdornment>
								}
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											aria-label="toggle password visibility"
											onClick={handleClickShowPassword}
											onMouseDown={handleMouseDownPassword}
											edge="end"
											color="secondary"
											sx={{ minWidth: 44, minHeight: 44 }}
										>
											{showPassword ? <Eye /> : <EyeSlash />}
										</IconButton>
									</InputAdornment>
								}
								placeholder="Elegí una contraseña"
								sx={{ "& input": { py: 1.5 } }}
								inputProps={{
									autoCapitalize: "off",
									autoCorrect: "off",
									spellCheck: "false",
								}}
							/>
							<Typography variant="caption" color="text.secondary">
								8+ caracteres
							</Typography>
						</Stack>

						{/* Password Strength Indicator */}
						{registerPassword.length >= 3 && (
							<FormControl fullWidth>
								<Grid container spacing={2} alignItems="center">
									<Grid item>
										<Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: "7px" }} />
									</Grid>
									<Grid item>
										<Typography variant="subtitle1" fontSize="0.75rem" color="text.secondary">
											{level?.label}
										</Typography>
									</Grid>
								</Grid>
							</FormControl>
						)}

						<Button
							variant="contained"
							size="large"
							onClick={handleRegisterAndAccept}
							disabled={isSubmitting || !registerPassword}
							startIcon={isSubmitting ? <CircularProgress size={20} /> : <TickCircle size={20} />}
							fullWidth
						>
							{isSubmitting ? "Creando cuenta..." : "Crear cuenta y aceptar"}
						</Button>

						<Divider />

						<Button variant="outlined" color="error" onClick={handleDecline} disabled={isSubmitting}>
							Rechazar invitación
						</Button>
					</Stack>
				)}
			</Stack>
		);
	};

	return (
		<Box
			sx={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				bgcolor: "background.default",
				py: 4,
			}}
		>
			<Container maxWidth="sm">
				<Stack spacing={3} alignItems="center">
					<Logo />
					<Paper sx={{ p: 4, width: "100%" }}>{renderContent()}</Paper>
				</Stack>
			</Container>
		</Box>
	);
}
