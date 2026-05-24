import React from "react";
import { startTransition, useMemo, useRef, useState, useTransition } from "react";

import {
	Box,
	CircularProgress,
	ClickAwayListener,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Popper,
	Stack,
	Tooltip,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

import { Moon, Sun1, MonitorMobbile, TickCircle } from "iconsax-react";

import IconButton from "components/@extended/IconButton";
import Transitions from "components/@extended/Transitions";

import useConfig from "hooks/useConfig";
import { ThemeMode } from "types/config";

// ==============================|| HEADER CONTENT - THEME MODE TOGGLE ||============================== //

const ThemeModeToggle = () => {
	const theme = useTheme();
	const downSm = useMediaQuery((t: Theme) => t.breakpoints.down("sm"));
	const { mode, onChangeMode } = useConfig();

	const anchorRef = useRef<HTMLButtonElement | null>(null);
	const [open, setOpen] = useState(false);
	const [isPending, switchTransition] = useTransition();

	const iconBackColorOpen = "secondary.200";
	const iconBackColor = theme.palette.mode === ThemeMode.DARK ? "background.default" : "secondary.100";

	const options = useMemo(
		() =>
			[
				{ value: ThemeMode.LIGHT, label: "Modo claro", Icon: Sun1 },
				{ value: ThemeMode.DARK, label: "Modo oscuro", Icon: Moon },
				{ value: ThemeMode.AUTO, label: "Seguir sistema", Icon: MonitorMobbile },
			] as const,
		[],
	);

	const active = options.find((o) => o.value === mode) ?? options[0];
	const ActiveIcon = active.Icon;

	const handleToggle = () => setOpen((prev) => !prev);

	const handleClose = (event: MouseEvent | TouchEvent | React.MouseEvent) => {
		if (anchorRef.current && anchorRef.current.contains(event.target as Node)) return;
		setOpen(false);
	};

	const handleSelect = (value: ThemeMode) => {
		if (value === mode) {
			setOpen(false);
			return;
		}
		// 1) Cerrar el popup ANTES del cambio pesado → la UI del menú se actualiza al instante.
		setOpen(false);
		// 2) Marcar el theme change como una transition → React lo procesa sin bloquear inputs.
		//    startTransition (no el hook) garantiza el comportamiento aún sin batching React 18.
		startTransition(() => {
			switchTransition(() => {
				onChangeMode(value);
			});
		});
	};

	return (
		<Box sx={{ flexShrink: 0, ml: 0.5 }}>
			<Tooltip title={isPending ? "Aplicando…" : `Tema: ${active.label}`}>
				<IconButton
					color="secondary"
					variant="light"
					aria-label="cambiar tema"
					aria-busy={isPending}
					ref={anchorRef}
					aria-controls={open ? "theme-mode-popup" : undefined}
					aria-haspopup="true"
					aria-expanded={open ? "true" : "false"}
					onClick={handleToggle}
					size="large"
					sx={{
						color: "secondary.main",
						bgcolor: open ? iconBackColorOpen : iconBackColor,
						p: 1,
						position: "relative",
					}}
				>
					<ActiveIcon variant="Bold" size={20} style={{ opacity: isPending ? 0.35 : 1 }} />
					{isPending && (
						<CircularProgress
							size={20}
							thickness={5}
							sx={{
								color: "primary.main",
								position: "absolute",
								top: "50%",
								left: "50%",
								marginTop: "-10px",
								marginLeft: "-10px",
							}}
						/>
					)}
				</IconButton>
			</Tooltip>
			<Popper
				placement={downSm ? "bottom" : "bottom-end"}
				open={open}
				anchorEl={anchorRef.current}
				role={undefined}
				transition
				disablePortal
				popperOptions={{
					modifiers: [
						{
							name: "offset",
							options: { offset: [0, 9] },
						},
					],
				}}
			>
				{({ TransitionProps }) => (
					<Transitions type="fade" in={open} {...TransitionProps}>
						<Paper
							elevation={0}
							sx={{
								boxShadow: theme.customShadows.z1,
								borderRadius: 1.5,
								width: 220,
								minWidth: 200,
								overflow: "hidden",
								border: `1px solid ${theme.palette.divider}`,
							}}
						>
							<ClickAwayListener onClickAway={handleClose}>
								<Box>
									<Stack sx={{ px: 1.75, pt: 1.25, pb: 0.75 }}>
										<Typography variant="subtitle2">Apariencia</Typography>
										<Typography variant="caption" color="text.secondary">
											Solo afecta a la app interna
										</Typography>
									</Stack>
									<List
										id="theme-mode-popup"
										sx={{
											py: 0.5,
											"& .MuiListItemButton-root": {
												borderRadius: 1,
												mx: 0.5,
												my: 0.25,
											},
										}}
									>
										{options.map((opt) => {
											const Icon = opt.Icon;
											const selected = opt.value === mode;
											return (
												<ListItemButton key={opt.value} selected={selected} onClick={() => handleSelect(opt.value)}>
													<ListItemIcon sx={{ minWidth: 32, color: selected ? "primary.main" : "secondary.main" }}>
														<Icon size={18} variant={selected ? "Bold" : "Linear"} />
													</ListItemIcon>
													<ListItemText
														primary={opt.label}
														primaryTypographyProps={{
															variant: "body2",
															fontWeight: selected ? 600 : 400,
														}}
													/>
													{selected && <TickCircle size={16} color={theme.palette.primary.main} variant="Bold" />}
												</ListItemButton>
											);
										})}
									</List>
								</Box>
							</ClickAwayListener>
						</Paper>
					</Transitions>
				)}
			</Popper>
		</Box>
	);
};

export default ThemeModeToggle;
