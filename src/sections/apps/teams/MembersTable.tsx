// sections/apps/teams/MembersTable.tsx
import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Paper,
  Stack,
  Chip,
  Skeleton,
} from "@mui/material";
import { More, UserMinus, ShieldTick, Edit2, Eye, Crown } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import { updateMemberRole, removeMember } from "store/reducers/teams";
import { TeamMember, TeamRole, ROLE_CONFIG } from "types/teams";
import { useTeam } from "contexts/TeamContext";
import RoleBadge from "./RoleBadge";
import ConfirmDialog from "components/dialogs/ConfirmDialog";

interface MembersTableProps {
  onMemberUpdated?: () => void;
}

// Skeleton row component for loading state
const MemberRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={120} height={20} />
      </Stack>
    </TableCell>
    <TableCell>
      <Skeleton variant="text" width={180} height={20} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rounded" width={80} height={24} />
    </TableCell>
    <TableCell align="right">
      <Skeleton variant="circular" width={28} height={28} />
    </TableCell>
  </TableRow>
);

export default function MembersTable({ onMemberUpdated }: MembersTableProps) {
  const dispatch = useDispatch();
  const { activeTeam, userRole, canManageMembers, refreshActiveTeam, isLoading } = useTeam();
  const auth = useSelector((state) => state.auth);
  const currentUserId = auth.user?._id;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangeRole = async (newRole: TeamRole) => {
    if (!activeTeam || !selectedMember) return;

    setIsUpdating(true);
    handleMenuClose();

    try {
      const result = await dispatch(
        updateMemberRole(activeTeam._id, selectedMember.userId, newRole) as any
      );

      if (result.success) {
        await refreshActiveTeam();
        onMemberUpdated?.();
      }
    } finally {
      setIsUpdating(false);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!activeTeam || !selectedMember) return;

    setIsUpdating(true);
    setConfirmRemove(false);

    try {
      const result = await dispatch(
        removeMember(activeTeam._id, selectedMember.userId) as any
      );

      if (result.success) {
        await refreshActiveTeam();
        onMemberUpdated?.();
      }
    } finally {
      setIsUpdating(false);
      setSelectedMember(null);
    }
  };

  const confirmRemoveMember = () => {
    handleMenuClose();
    setConfirmRemove(true);
  };

  // Show skeleton while loading
  if (isLoading || !activeTeam) {
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Miembro</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <MemberRowSkeleton />
            <MemberRowSkeleton />
            <MemberRowSkeleton />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Build the list: owner first, then members
  // owner can be a string (ID) or an object with _id (when populated)
  const ownerIsPopulated = typeof activeTeam.owner !== 'string';
  const ownerId = ownerIsPopulated ? (activeTeam.owner as any)?._id : activeTeam.owner;
  const ownerData = ownerIsPopulated ? activeTeam.owner as any : activeTeam.ownerInfo;

  const allMembers = [
    // Owner
    {
      userId: ownerId,
      email: ownerData?.email || "",
      firstName: ownerData?.firstName || "",
      lastName: ownerData?.lastName || "",
      avatar: ownerData?.avatar,
      role: "owner" as const,
      isOwner: true,
    },
    // Members - extract user data from populated userId field
    ...(activeTeam.members || []).map((m) => {
      // userId can be a string (not populated) or an object (populated)
      const userIdIsPopulated = typeof m.userId !== 'string' && m.userId !== null;
      const userData = userIdIsPopulated ? (m.userId as any) : null;
      const odUserId = userIdIsPopulated ? (m.userId as any)?._id : m.userId;

      return {
        userId: odUserId,
        email: userData?.email || (m as any).email || "",
        firstName: userData?.firstName || (m as any).firstName || "",
        lastName: userData?.lastName || (m as any).lastName || "",
        avatar: userData?.avatar || (m as any).avatar,
        role: m.role,
        joinedAt: m.joinedAt,
        isOwner: false,
      };
    }),
  ];

  const getRoleIcon = (role: TeamRole | "owner") => {
    switch (role) {
      case "owner":
        return <Crown size={16} />;
      case "admin":
        return <ShieldTick size={16} />;
      case "editor":
        return <Edit2 size={16} />;
      case "viewer":
        return <Eye size={16} />;
    }
  };

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Miembro</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allMembers.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canEdit = canManageMembers && !member.isOwner && !isCurrentUser;
              const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();

              return (
                <TableRow key={member.userId} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        src={member.avatar}
                        sx={{ width: 32, height: 32 }}
                      >
                        {fullName ? fullName[0].toUpperCase() : (member.email?.[0]?.toUpperCase() || "?")}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {fullName || "Sin nombre"}
                          {isCurrentUser && (
                            <Chip
                              label="Tú"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: 10 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.email || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {getRoleIcon(member.isOwner ? "owner" : (member.role || "viewer"))}
                      <RoleBadge role={member.isOwner ? "owner" : (member.role || "viewer")} />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {canEdit && (
                      <Tooltip title="Opciones">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, member as unknown as TeamMember)}
                          disabled={isUpdating}
                        >
                          <More size={18} style={{ transform: "rotate(90deg)" }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: "block" }}>
          Cambiar rol a:
        </Typography>
        {selectedMember?.role !== "editor" && (
          <MenuItem onClick={() => handleChangeRole("editor")}>
            <ListItemIcon>
              <Edit2 size={18} />
            </ListItemIcon>
            <ListItemText>
              <Chip
                label={ROLE_CONFIG.editor.label}
                color={ROLE_CONFIG.editor.color}
                size="small"
              />
            </ListItemText>
          </MenuItem>
        )}
        {selectedMember?.role !== "viewer" && (
          <MenuItem onClick={() => handleChangeRole("viewer")}>
            <ListItemIcon>
              <Eye size={18} />
            </ListItemIcon>
            <ListItemText>
              <Chip
                label={ROLE_CONFIG.viewer.label}
                color={ROLE_CONFIG.viewer.color}
                size="small"
              />
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={confirmRemoveMember} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <UserMinus size={18} color="red" />
          </ListItemIcon>
          <ListItemText>Remover del equipo</ListItemText>
        </MenuItem>
      </Menu>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        open={confirmRemove}
        title="Remover miembro"
        content={`¿Estás seguro de que deseas remover a ${selectedMember?.firstName || selectedMember?.email} del equipo? Esta persona perderá acceso a todos los recursos compartidos.`}
        confirmText="Remover"
        confirmColor="error"
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setConfirmRemove(false);
          setSelectedMember(null);
        }}
      />
    </>
  );
}
