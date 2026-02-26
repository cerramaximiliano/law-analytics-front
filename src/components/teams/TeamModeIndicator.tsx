// components/teams/TeamModeIndicator.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Tooltip,
  Badge,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { ArrowDown2, People, TickCircle, Setting2 } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";
import { Team } from "types/teams";
import { RoleBadge } from "sections/apps/teams";

interface TeamModeIndicatorProps {
  compact?: boolean;
}

export default function TeamModeIndicator({ compact = false }: TeamModeIndicatorProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { teams, activeTeam, userRole, isTeamMode, hasMultipleTeams, setActiveTeam } = useTeam();
  const { isTeamsEnabled } = useTeamsFeature();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectTeam = (team: Team) => {
    setActiveTeam(team);
    handleClose();
  };

  const handleManageTeams = () => {
    handleClose();
    navigate("/apps/profiles/account/role");
  };

  // Don't show if user has no teams
  // Note: We show the indicator if user belongs to a team, even if they have a free plan
  // (isTeamsEnabled checks if user can CREATE teams, but invited members should see their teams)
  if (teams.length === 0) {
    return null;
  }

  // If user only has one team, show simpler indicator (no dropdown needed for switching)
  if (!hasMultipleTeams && activeTeam) {
    return (
      <Tooltip title={`Equipo: ${activeTeam.name}`}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${theme.palette.primary.main}`,
            cursor: "pointer",
          }}
          onClick={handleManageTeams}
        >
          <People size={20} color={theme.palette.primary.main} />
          {!compact && (
            <Typography
              variant="body2"
              sx={{
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              {activeTeam.name}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Multiple teams - show dropdown to switch between them
  return (
    <Box>
      <Tooltip title={`Equipo: ${activeTeam?.name || "Seleccionar"}`}>
        <Button
          onClick={handleClick}
          sx={{
            minWidth: compact ? 40 : "auto",
            px: compact ? 1 : 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${theme.palette.primary.main}`,
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <Badge
            color="primary"
            variant="dot"
            invisible={false}
            sx={{
              "& .MuiBadge-badge": {
                right: -2,
                top: 2,
              },
            }}
          >
            <People size={20} color={theme.palette.primary.main} />
          </Badge>

          {!compact && (
            <>
              <Typography
                variant="body2"
                sx={{
                  ml: 1,
                  mr: 0.5,
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "primary.main",
                  fontWeight: 600,
                }}
              >
                {activeTeam?.name || "Seleccionar"}
              </Typography>
              <ArrowDown2 size={16} color={theme.palette.primary.main} />
            </>
          )}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 240,
            maxWidth: 300,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Current team indicator */}
        <Box sx={{ px: 2, py: 1, bgcolor: "background.default" }}>
          <Typography variant="caption" color="text.secondary">
            Equipo actual
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {activeTeam?.name || "Ninguno seleccionado"}
          </Typography>
          {userRole && (
            <Box sx={{ mt: 0.5 }}>
              <RoleBadge role={userRole} size="small" />
            </Box>
          )}
        </Box>

        <Divider />

        {/* Teams header */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, py: 0.5, display: "block" }}
        >
          Cambiar equipo ({teams.length})
        </Typography>

        {/* Team options */}
        {teams.map((team) => {
          const isSelected = activeTeam?._id === team._id;
          return (
            <MenuItem
              key={team._id}
              onClick={() => handleSelectTeam(team)}
              selected={isSelected}
              sx={{ py: 1 }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: 11,
                    bgcolor: isSelected ? "primary.main" : "grey.400",
                  }}
                >
                  {(team.name || "??").substring(0, 2).toUpperCase()}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={team.name}
                secondary={`${(team.members?.length || 0) + 1} miembros`}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: isSelected ? 600 : 400,
                }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              {isSelected && <TickCircle size={18} color={theme.palette.success.main} />}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 0.5 }} />

        {/* Manage teams link */}
        <MenuItem onClick={handleManageTeams}>
          <ListItemIcon>
            <Setting2 size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Gestionar equipos"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}
