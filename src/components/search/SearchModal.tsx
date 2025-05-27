import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import {
	Dialog,
	TextField,
	InputAdornment,
	Box,
	Typography,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Fade,
	Stack,
	Button,
} from "@mui/material";

// third-party
import { useHotkeys } from "react-hotkeys-hook";

// project imports
import { useDispatch, useSelector } from "store";
import { openSearch, closeSearch, setQuery, performGlobalSearch } from "store/reducers/search";
import { SearchResult } from "types/search";

// assets
import { SearchNormal1, Folder2, Profile2User, Calculator, TaskSquare, CloseCircle, Clock, Calendar1 } from "iconsax-react";

// ==============================|| SEARCH MODAL ||============================== //

const SearchModal = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [localQuery, setLocalQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [showingSuggestions, setShowingSuggestions] = useState(true);

	const { isOpen, results, recentSearches, isSearching, isSearchingServer, entityLoadStatus, filters } = useSelector(
		(state) => state.search,
	);

	// Register Ctrl+K hotkey
	useHotkeys("ctrl+k, cmd+k", (e) => {
		e.preventDefault();
		dispatch(openSearch());
	});

	// Handle ESC key to close
	useHotkeys(
		"escape",
		() => {
			if (isOpen) {
				dispatch(closeSearch());
			}
		},
		{ enableOnFormTags: true },
	);

	// Handle arrow keys for navigation
	useHotkeys(
		"up",
		() => {
			if (isOpen && results.length > 0) {
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
			}
		},
		{ enableOnFormTags: true },
	);

	useHotkeys(
		"down",
		() => {
			if (isOpen && results.length > 0) {
				setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
			}
		},
		{ enableOnFormTags: true },
	);

	// Handle enter key to navigate
	useHotkeys(
		"enter",
		() => {
			if (isOpen && results.length > 0) {
				handleResultClick(results[selectedIndex]);
			}
		},
		{ enableOnFormTags: true },
	);

	// Handle search button or Enter key
	const handleSearch = () => {
		if (!localQuery.trim()) return;

		setShowingSuggestions(false);

		// If we already have results from suggestions, just change the view
		if (results.length > 0) {
			// Results are already there, just changing display mode
			return;
		}

		// Otherwise, force a server search
		const { forceServerSearch } = require("store/reducers/search");
		dispatch(forceServerSearch(localQuery, filters));
	};

	// Debounced search for suggestions
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localQuery.trim()) {
				setShowingSuggestions(true);
				dispatch(performGlobalSearch(localQuery, filters));
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [localQuery, filters, dispatch]);

	// Reset selected index when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [results]);

	const handleClose = () => {
		dispatch(closeSearch());
		setLocalQuery("");
		setShowingSuggestions(true);
	};

	const handleResultClick = (result: SearchResult) => {
		// Navigate based on result type
		switch (result.type) {
			case "folder":
				navigate(`/apps/folders/details/${result.id}`);
				break;
			case "contact":
				navigate(`/apps/customer/customer-list?contact=${result.id}`);
				break;
			case "calculator":
				navigate(`/apps/calc?id=${result.id}`);
				break;
			case "task":
				navigate(`/tareas?task=${result.id}`);
				break;
			case "event":
				navigate(`/apps/calendar?event=${result.id}`);
				break;
		}
		handleClose();
	};

	const handleRecentSearchClick = (search: string) => {
		setLocalQuery(search);
		dispatch(setQuery(search));
	};

	const getIcon = (type: string) => {
		switch (type) {
			case "folder":
				return <Folder2 size={20} />;
			case "contact":
				return <Profile2User size={20} />;
			case "calculator":
				return <Calculator size={20} />;
			case "task":
				return <TaskSquare size={20} />;
			case "event":
				return <Calendar1 size={20} />;
			default:
				return <Folder2 size={20} />;
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "folder":
				return "Causa";
			case "contact":
				return "Contacto";
			case "calculator":
				return "Cálculo";
			case "task":
				return "Tarea";
			case "event":
				return "Evento";
			default:
				return type;
		}
	};

	const groupedResults = results.reduce((acc, result) => {
		if (!acc[result.type]) {
			acc[result.type] = [];
		}
		acc[result.type].push(result);
		return acc;
	}, {} as Record<string, SearchResult[]>);

	const notLoadedEntities = Object.entries(entityLoadStatus)
		.filter(([_, isLoaded]) => !isLoaded)
		.map(([entity]) => entity);

	return (
		<Dialog
			open={isOpen}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					position: "fixed",
					top: "10%",
					m: 0,
					maxHeight: "70vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				},
			}}
		>
			<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
				{/* Fixed Search Bar */}
				<Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<TextField
							fullWidth
							autoFocus
							placeholder="Buscar causas, contactos, cálculos, tareas..."
							value={localQuery}
							onChange={(e) => setLocalQuery(e.target.value)}
							onKeyPress={(e) => {
								if (e.key === "Enter") {
									handleSearch();
								}
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={20} />
									</InputAdornment>
								),
								endAdornment: localQuery && (
									<InputAdornment position="end">
										<IconButton size="small" onClick={() => setLocalQuery("")}>
											<CloseCircle size={16} />
										</IconButton>
									</InputAdornment>
								),
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									"& fieldset": {
										border: "none",
									},
								},
							}}
						/>
						<Button
							variant="contained"
							onClick={handleSearch}
							disabled={!localQuery.trim() || isSearching || isSearchingServer}
							sx={{ 
								minWidth: "100px",
								height: "56px" // Same height as MUI TextField with normal density
							}}
						>
							Buscar
						</Button>
					</Box>
				</Box>

				<Divider sx={{ flexShrink: 0 }} />

				{/* Scrollable Content */}
				<Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
					{/* Recent searches */}
					{!localQuery && recentSearches.length > 0 && (
						<Box sx={{ p: 2 }}>
							<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
								Búsquedas recientes
							</Typography>
							<List dense>
								{recentSearches.map((search, index) => (
									<ListItem
										key={index}
										button
										onClick={() => handleRecentSearchClick(search)}
										sx={{
											borderRadius: 1,
											mb: 0.5,
											"&:hover": {
												bgcolor: "action.hover",
											},
										}}
									>
										<ListItemIcon sx={{ minWidth: 32 }}>
											<Clock size={16} />
										</ListItemIcon>
										<ListItemText primary={search} />
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Loading state */}
					{(isSearching || isSearchingServer) && (
						<Box sx={{ p: 4, textAlign: "center" }}>
							<CircularProgress size={32} />
							<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
								{isSearchingServer ? "Buscando en el servidor..." : "Buscando..."}
							</Typography>
							{isSearchingServer && (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
									Algunos datos aún no están cargados localmente
								</Typography>
							)}
						</Box>
					)}

					{/* Not loaded entities warning */}
					{!isSearching && localQuery && notLoadedEntities.length > 0 && (
						<Box sx={{ p: 2, bgcolor: "warning.lighter", m: 2, borderRadius: 1 }}>
							<Typography variant="caption" color="warning.dark">
								Nota: {notLoadedEntities.map((e) => getTypeLabel(e)).join(", ")} aún no están cargados
							</Typography>
						</Box>
					)}

					{/* Search results */}
					{!isSearching && !isSearchingServer && localQuery && results.length > 0 && (
						<Box sx={{ p: 2 }}>
							{showingSuggestions && (
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									Sugerencias basadas en datos locales
								</Typography>
							)}
							{Object.entries(groupedResults).map(([type, typeResults]) => (
								<Box key={type} sx={{ mb: 2 }}>
									<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", textTransform: "uppercase" }}>
										{getTypeLabel(type)}s ({typeResults.length})
									</Typography>
									<List dense>
										{typeResults.slice(0, 5).map((result, index) => {
											const globalIndex = results.indexOf(result);
											return (
												<Fade in key={result.id} timeout={300 + index * 50}>
													<ListItem
														button
														selected={selectedIndex === globalIndex}
														onClick={() => handleResultClick(result)}
														sx={{
															borderRadius: 1,
															mb: 0.5,
															bgcolor: selectedIndex === globalIndex ? "action.selected" : "transparent",
															"&:hover": {
																bgcolor: "action.hover",
															},
														}}
													>
														<ListItemIcon sx={{ minWidth: 40 }}>{getIcon(result.type)}</ListItemIcon>
														<ListItemText
															primary={
																<Typography variant="body2" noWrap>
																	{result.title}
																</Typography>
															}
															secondary={
																<Stack direction="row" spacing={1} alignItems="center">
																	{result.subtitle && (
																		<Typography variant="caption" color="text.secondary" noWrap>
																			{result.subtitle}
																		</Typography>
																	)}
																	{result.description && (
																		<>
																			<Typography variant="caption" color="text.secondary">
																				•
																			</Typography>
																			<Typography variant="caption" color="text.secondary" noWrap>
																				{result.description}
																			</Typography>
																		</>
																	)}
																</Stack>
															}
														/>
													</ListItem>
												</Fade>
											);
										})}
									</List>
								</Box>
							))}
						</Box>
					)}

					{/* No results */}
					{!isSearching && !isSearchingServer && localQuery && results.length === 0 && (
						<Box sx={{ p: 4, textAlign: "center" }}>
							<Typography variant="body2" color="text.secondary">
								{showingSuggestions
									? `No se encontraron sugerencias para "${localQuery}". Presiona "Buscar" para buscar en el servidor.`
									: `No se encontraron resultados para "${localQuery}"`}
							</Typography>
						</Box>
					)}
				</Box>

				{/* Fixed Footer */}
				<Divider sx={{ flexShrink: 0 }} />
				<Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
					<Stack direction="row" spacing={1}>
						<Chip label="↑↓ Navegar" size="small" variant="outlined" />
						<Chip label="↵ Seleccionar" size="small" variant="outlined" />
						<Chip label="ESC Cerrar" size="small" variant="outlined" />
					</Stack>
					<Typography variant="caption" color="text.secondary">
						Ctrl+K para abrir
					</Typography>
				</Box>
			</Box>
		</Dialog>
	);
};

export default SearchModal;
