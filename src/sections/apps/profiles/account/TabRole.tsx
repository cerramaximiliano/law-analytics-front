// sections/apps/profiles/account/TabRole.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Alert,
  Chip,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { People, Add, Crown, Logout, UserSquare, Information, InfoCircle } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import { GuideTeams } from "components/guides";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";
import { useDispatch } from "store";
import { fetchCurrentSubscription } from "store/reducers/auth";
import {
  TeamSelector,
  InviteMembersForm,
  MembersTable,
  PendingInvitationsList,
  CreateTeamDialog,
  LeaveTeamDialog,
  TeamSettingsCard,
  RoleBadge,
} from "sections/apps/teams";

// ==============================|| ACCOUNT PROFILE - ROLE (TEAMS) ||============================== //

const TabRole = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    teams,
    activeTeam,
    userRole,
    isLoading,
    isInitialized,
    isAdmin,
    isOwner,
    canManageMembers,
    hasMultipleTeams,
    refreshTeams,
    refreshActiveTeam,
  } = useTeam();
  const { isTeamsEnabled, maxTeamMembers, planName } = useTeamsFeature();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Force refresh subscription data on mount to ensure we have the latest plan info
  useEffect(() => {
    dispatch(fetchCurrentSubscription(true) as any);
  }, [dispatch]);

  // Helper to get role label in Spanish
  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "owner":
        return "Propietario";
      case "admin":
        return "Administrador";
      case "editor":
        return "Editor";
      case "viewer":
        return "Solo Lectura";
      default:
        return "Miembro";
    }
  };

  // Helper to get role color
  const getRoleColor = (role: string | null): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (role) {
      case "owner":
        return "warning";
      case "admin":
        return "error";
      case "editor":
        return "primary";
      case "viewer":
        return "info";
      default:
        return "default";
    }
  };

  // Show loading skeleton while teams data is being fetched
  if (!isInitialized || isLoading) {
    return (
      <Grid container spacing={2}>
        {/* Header skeleton */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={150} height={32} />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="text" width={60} height={40} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Members table skeleton */}
        <Grid item xs={12} md={8}>
          <MainCard title="Miembros del Equipo" content={false}>
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={2}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Stack>
                ))}
              </Stack>
            </Box>
          </MainCard>
        </Grid>

        {/* Invite form skeleton */}
        <Grid item xs={12} md={4}>
          <MainCard title={<Skeleton variant="text" width={150} />}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width={120} height={36} />
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    );
  }

  // Check if user is a team MEMBER (not owner) - they were invited to a team
  // This takes priority over the isTeamsEnabled check since they're already part of a team
  const isTeamMember = teams.length > 0 && !isOwner && activeTeam;

  // Check if user already owns a team (can only own one team)
  // If the user is currently owner of the active team, they already have a team
  const userAlreadyOwnsTeam = isOwner;

  // User is a team member (invited) - show member info view
  if (isTeamMember && !isLoading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MainCard>
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              <UserSquare size={64} color={theme.palette.primary.main} variant="Bulk" />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" textAlign="center">
                  Eres Miembro de un Equipo
                </Typography>
                <Tooltip title="Ver Guía de Equipos">
                  <IconButton color="info" size="small" onClick={() => setGuideOpen(true)}>
                    <InfoCircle variant="Bulk" size={20} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Card variant="outlined" sx={{ maxWidth: 500, width: "100%" }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        Equipo:
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <People size={18} color={theme.palette.primary.main} />
                        <Typography variant="h6">{activeTeam?.name}</Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        Tu Rol:
                      </Typography>
                      <Chip
                        label={getRoleLabel(userRole)}
                        color={getRoleColor(userRole)}
                        size="small"
                        variant="filled"
                      />
                    </Stack>

                    {activeTeam?.description && (
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle2" color="text.secondary">
                          Descripción:
                        </Typography>
                        <Typography variant="body2" textAlign="right" sx={{ maxWidth: 250 }}>
                          {activeTeam.description}
                        </Typography>
                      </Stack>
                    )}

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        Miembros:
                      </Typography>
                      <Typography variant="body2">
                        {(activeTeam?.members?.length || 0) + 1} miembros
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Alert
                severity="info"
                sx={{ maxWidth: 500 }}
                icon={<Information size={20} variant="Bulk" />}
              >
                Como miembro del equipo, tienes acceso a los recursos compartidos según tu rol.
                {userRole === "viewer" && " Tu rol de Solo Lectura te permite ver los recursos pero no modificarlos."}
                {userRole === "editor" && " Tu rol de Editor te permite ver y editar recursos, pero no eliminarlos."}
                {userRole === "admin" && " Tu rol de Administrador te permite gestionar recursos y miembros del equipo."}
              </Alert>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout size={18} />}
                onClick={() => setShowLeaveDialog(true)}
              >
                Abandonar Equipo
              </Button>
            </Stack>
          </MainCard>
        </Grid>

        <LeaveTeamDialog
          open={showLeaveDialog}
          onClose={() => setShowLeaveDialog(false)}
          onSuccess={() => {
            refreshTeams();
          }}
        />

        <GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
      </Grid>
    );
  }

  // User doesn't have teams feature AND is not a team member - show upgrade prompt
  if (!isTeamsEnabled) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MainCard>
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              <People size={64} color={theme.palette.text.secondary} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" textAlign="center">
                  Gestión de Equipos
                </Typography>
                <Tooltip title="Ver Guía de Equipos">
                  <IconButton color="info" size="small" onClick={() => setGuideOpen(true)}>
                    <InfoCircle variant="Bulk" size={20} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
                La funcionalidad de equipos te permite invitar colaboradores a tu cuenta
                y compartir recursos como causas, contactos, calculadoras y más.
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 500 }}>
                Tu plan actual ({planName}) no incluye la gestión de equipos.
                Actualiza a un plan Estándar o Premium para acceder a esta funcionalidad.
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/suscripciones/tables")}
              >
                Ver Planes Disponibles
              </Button>
            </Stack>
          </MainCard>
        </Grid>

        <GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
      </Grid>
    );
  }

  // User has teams feature but no teams yet
  if (teams.length === 0 && !isLoading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MainCard>
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              <People size={64} color={theme.palette.primary.main} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" textAlign="center">
                  Crear tu Primer Equipo
                </Typography>
                <Tooltip title="Ver Guía de Equipos">
                  <IconButton color="info" size="small" onClick={() => setGuideOpen(true)}>
                    <InfoCircle variant="Bulk" size={20} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
                Crea un equipo para invitar colaboradores y compartir recursos.
                Puedes tener hasta {maxTeamMembers} miembros en tu plan {planName}.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add size={20} />}
                onClick={() => setShowCreateDialog(true)}
              >
                Crear Equipo
              </Button>
            </Stack>
          </MainCard>
        </Grid>

        <CreateTeamDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            refreshTeams();
          }}
        />

        <GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
      </Grid>
    );
  }

  // User has teams - show team management directly (no more "personal mode" view)
  return (
    <Grid container spacing={2}>
      {/* Team Header - Compact */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1}>
              <Stack direction="row" alignItems="center" spacing={2}>
                {hasMultipleTeams ? (
                  <TeamSelector showRoleBadge={false} />
                ) : (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <People size={22} color={theme.palette.primary.main} />
                    <Typography variant="h5">{activeTeam?.name}</Typography>
                    {isOwner && <Crown size={18} color={theme.palette.warning.main} />}
                  </Stack>
                )}
                {activeTeam?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                    {activeTeam.description}
                  </Typography>
                )}
                <Tooltip title="Ver Guía de Equipos">
                  <IconButton color="info" size="small" onClick={() => setGuideOpen(true)}>
                    <InfoCircle variant="Bulk" size={20} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                {userRole && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Rol:
                    </Typography>
                    <RoleBadge role={userRole} />
                  </Stack>
                )}
                <Box textAlign="center" sx={{ minWidth: 60 }}>
                  <Typography variant="h6" color="primary.main" lineHeight={1}>
                    {(activeTeam?.members?.length || 0) + 1}/{maxTeamMembers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    miembros
                  </Typography>
                </Box>
{/* El botón "Nuevo Equipo" se eliminó porque solo se permite un equipo por usuario */}
                {!isOwner && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout size={16} />}
                    onClick={() => setShowLeaveDialog(true)}
                    size="small"
                  >
                    Salir
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Main Content Row */}
      <Grid item xs={12} md={canManageMembers ? 8 : 12}>
        <MainCard title="Miembros del Equipo" content={false}>
          <Box sx={{ p: 2 }}>
            <MembersTable onMemberUpdated={refreshActiveTeam} />
          </Box>
        </MainCard>
      </Grid>

      {/* Invite Members - only for admin/owner */}
      {canManageMembers && (
        <Grid item xs={12} md={4}>
          <InviteMembersForm onSuccess={refreshActiveTeam} />
        </Grid>
      )}

      {/* Second Row - Invitations and Settings */}
      <Grid item xs={12} md={isAdmin ? 6 : 12}>
        <PendingInvitationsList onInvitationUpdated={refreshActiveTeam} />
      </Grid>

      {/* Team Settings - only for admin/owner */}
      {isAdmin && (
        <Grid item xs={12} md={6}>
          <TeamSettingsCard onUpdated={refreshActiveTeam} />
        </Grid>
      )}

      {/* Danger Zone - Full width at bottom, compact */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ borderColor: "error.light" }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="subtitle2" color="error">
                  Zona de Peligro
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isOwner
                    ? "Eliminar el equipo removerá a todos los miembros."
                    : "Perderás acceso a los recursos compartidos."}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Logout size={16} />}
                onClick={() => setShowLeaveDialog(true)}
                sx={{ minWidth: 160 }}
              >
                {isOwner ? "Eliminar Equipo" : "Abandonar Equipo"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Dialogs */}
      {/* CreateTeamDialog eliminado - solo se permite un equipo por usuario */}

      <LeaveTeamDialog
        open={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onSuccess={() => {
          refreshTeams();
        }}
      />

      <GuideTeams open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Grid>
  );
};

export default TabRole;
