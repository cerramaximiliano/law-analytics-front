// project-imports
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchState, SearchResult, SearchFilter, initialSearchState } from "types/search";
import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import { CalculatorType } from "types/calculator";
import { TaskType } from "types/task";
import { Event } from "types/events";
import { searchService } from "services/searchService";

// Utility function to normalize text for searching
const normalizeText = (text: string): string => {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, ""); // Remove accents
};

// Search functions for each entity type
const searchInFolders = (folders: FolderData[], query: string): SearchResult[] => {
	const normalizedQuery = normalizeText(query);

	return folders
		.filter((folder) => {
			const searchableText = normalizeText(
				`${folder.folderName} ${folder.materia || ""} ${folder.description || ""} ${folder.folderJuris || ""} ${folder.folderFuero || ""}`,
			);
			return searchableText.includes(normalizedQuery);
		})
		.map((folder) => ({
			id: folder._id,
			type: "folder" as const,
			title: folder.folderName,
			subtitle: folder.materia,
			description: `${folder.orderStatus || ""} - ${folder.status || ""}`,
			metadata: {
				status: folder.status,
				fuero: folder.folderFuero,
				jurisdiction: folder.folderJuris,
			},
		}));
};

const searchInContacts = (contacts: Contact[], query: string): SearchResult[] => {
	const normalizedQuery = normalizeText(query);

	return contacts
		.filter((contact) => {
			const searchableText = normalizeText(
				`${contact.name} ${contact.lastName || ""} ${contact.email || ""} ${contact.document || ""} ${contact.cuit || ""} ${
					contact.company || ""
				}`,
			);
			return searchableText.includes(normalizedQuery);
		})
		.map((contact) => ({
			id: contact._id,
			type: "contact" as const,
			title: `${contact.name} ${contact.lastName || ""}`.trim(),
			subtitle: contact.role,
			description: contact.email || contact.phone || "",
			metadata: {
				role: contact.role,
				document: contact.document,
				company: contact.company,
			},
		}));
};

const searchInCalculators = (calculators: CalculatorType[], query: string): SearchResult[] => {
	const normalizedQuery = normalizeText(query);

	return calculators
		.filter((calc) => {
			const searchableText = normalizeText(
				`${calc.folderName || ""} ${calc.type || ""} ${calc.classType || ""} ${calc.subClassType || ""} ${calc.amount || ""}`,
			);
			return searchableText.includes(normalizedQuery);
		})
		.map((calc) => ({
			id: calc._id,
			type: "calculator" as const,
			title: calc.folderName || "Cálculo",
			subtitle: `${calc.classType} - ${calc.subClassType}`,
			description: `${calc.type} - $${calc.amount?.toLocaleString("es-AR") || "0"}`,
			metadata: {
				type: calc.type,
				classType: calc.classType,
				amount: calc.amount,
			},
		}));
};

const searchInTasks = (tasks: TaskType[], query: string): SearchResult[] => {
	const normalizedQuery = normalizeText(query);

	return tasks
		.filter((task) => {
			const searchableText = normalizeText(`${task.name} ${task.description || ""}`);
			return searchableText.includes(normalizedQuery);
		})
		.map((task) => ({
			id: task._id,
			type: "task" as const,
			title: task.name,
			subtitle: task.priority ? `Prioridad: ${task.priority}` : undefined,
			description: task.description || `Estado: ${task.status}`,
			metadata: {
				status: task.status,
				priority: task.priority,
				dueDate: task.dueDate,
			},
		}));
};

const searchInEvents = (events: Event[], query: string): SearchResult[] => {
	const normalizedQuery = normalizeText(query);

	return events
		.filter((event) => {
			const searchableText = normalizeText(`${event.title} ${event.description || ""} ${event.folderName || ""} ${event.type || ""}`);
			return searchableText.includes(normalizedQuery);
		})
		.map((event) => ({
			id: event._id || "",
			type: "event" as const,
			title: event.title,
			subtitle: event.type,
			description: event.folderName ? `Carpeta: ${event.folderName}` : event.description || "",
			metadata: {
				start: event.start,
				end: event.end,
				allDay: event.allDay,
				type: event.type,
				folderId: event.folderId,
			},
		}));
};

const slice = createSlice({
	name: "search",
	initialState: initialSearchState,
	reducers: {
		openSearch(state) {
			state.isOpen = true;
		},
		closeSearch(state) {
			state.isOpen = false;
			state.query = "";
			state.results = [];
			state.error = null;
		},
		setQuery(state, action: PayloadAction<string>) {
			state.query = action.payload;
		},
		setFilters(state, action: PayloadAction<SearchFilter>) {
			state.filters = action.payload;
		},
		setResults(state, action: PayloadAction<SearchResult[]>) {
			state.results = action.payload;
			state.isSearching = false;
		},
		startSearching(state) {
			state.isSearching = true;
			state.error = null;
		},
		setSearchingEntity(state, action: PayloadAction<{ entity: keyof SearchState["searchingEntities"]; isSearching: boolean }>) {
			state.searchingEntities[action.payload.entity] = action.payload.isSearching;
		},
		setEntityLoadStatus(state, action: PayloadAction<{ entity: keyof SearchState["entityLoadStatus"]; isLoaded: boolean }>) {
			state.entityLoadStatus[action.payload.entity] = action.payload.isLoaded;
		},
		addRecentSearch(state, action: PayloadAction<string>) {
			if (!state.recentSearches.includes(action.payload)) {
				state.recentSearches = [action.payload, ...state.recentSearches.slice(0, 4)];
			}
		},
		setError(state, action: PayloadAction<string>) {
			state.error = action.payload;
			state.isSearching = false;
		},
		startServerSearch(state) {
			state.isSearchingServer = true;
			state.error = null;
		},
		endServerSearch(state) {
			state.isSearchingServer = false;
		},
		setCacheResults(state, action: PayloadAction<{ query: string; results: SearchResult[] }>) {
			state.serverSearchCache[action.payload.query] = action.payload.results;
		},
	},
});

export default slice.reducer;

// Actions
export const {
	openSearch,
	closeSearch,
	setQuery,
	setFilters,
	setResults,
	startSearching,
	setSearchingEntity,
	setEntityLoadStatus,
	addRecentSearch,
	setError,
	startServerSearch,
	endServerSearch,
	setCacheResults,
} = slice.actions;

// Thunk to force server search
export function forceServerSearch(query: string, filters?: SearchFilter) {
	return async (dispatch: any, getState: any) => {
		if (!query.trim()) {
			dispatch(setResults([]));
			return;
		}

		dispatch(startServerSearch());
		dispatch(addRecentSearch(query));

		try {
			// Force search on all entity types on server
			const entityTypes = filters?.types || ["folder", "contact", "calculator", "task", "event"];
			const serverResults = await searchService.searchOnServer(query, entityTypes);

			// Get current local results to merge
			const state = getState();
			const currentResults = state.search.results || [];

			// Merge results, avoiding duplicates
			const mergedResults = [...currentResults];
			serverResults.forEach((serverResult) => {
				if (!mergedResults.find((r) => r.id === serverResult.id && r.type === serverResult.type)) {
					mergedResults.push(serverResult);
				}
			});

			dispatch(setResults(mergedResults));
		} catch (error) {
			dispatch(setError("Error al buscar en el servidor"));
		} finally {
			dispatch(endServerSearch());
		}
	};
}

// Thunk to perform global search
export function performGlobalSearch(query: string, filters?: SearchFilter) {
	return async (dispatch: any, getState: any) => {
		if (!query.trim()) {
			dispatch(setResults([]));
			return;
		}

		dispatch(startSearching());
		dispatch(addRecentSearch(query));

		const state = getState();
		const results: SearchResult[] = [];
		const notLoadedTypes: string[] = [];

		try {
			// Search in folders if loaded and type not filtered
			if (state.search.entityLoadStatus.folders && (!filters?.types || filters.types.includes("folder"))) {
				dispatch(setSearchingEntity({ entity: "folders", isSearching: true }));
				const folderResults = searchInFolders(state.folder.folders || [], query);
				results.push(...folderResults);
				dispatch(setSearchingEntity({ entity: "folders", isSearching: false }));
			} else if (!filters?.types || filters.types.includes("folder")) {
				notLoadedTypes.push("folder");
			}

			// Search in contacts if loaded and type not filtered
			if (state.search.entityLoadStatus.contacts && (!filters?.types || filters.types.includes("contact"))) {
				dispatch(setSearchingEntity({ entity: "contacts", isSearching: true }));
				const contactResults = searchInContacts(state.contacts.contacts || [], query);
				results.push(...contactResults);
				dispatch(setSearchingEntity({ entity: "contacts", isSearching: false }));
			} else if (!filters?.types || filters.types.includes("contact")) {
				notLoadedTypes.push("contact");
			}

			// Search in calculators if loaded and type not filtered
			if (state.search.entityLoadStatus.calculators && (!filters?.types || filters.types.includes("calculator"))) {
				dispatch(setSearchingEntity({ entity: "calculators", isSearching: true }));
				const calculatorResults = searchInCalculators(state.calculator.calculators || [], query);
				results.push(...calculatorResults);
				dispatch(setSearchingEntity({ entity: "calculators", isSearching: false }));
			} else if (!filters?.types || filters.types.includes("calculator")) {
				notLoadedTypes.push("calculator");
			}

			// Search in tasks if loaded and type not filtered
			if (state.search.entityLoadStatus.tasks && (!filters?.types || filters.types.includes("task"))) {
				dispatch(setSearchingEntity({ entity: "tasks", isSearching: true }));
				const taskResults = searchInTasks(state.tasksReducer.tasks || [], query);
				results.push(...taskResults);
				dispatch(setSearchingEntity({ entity: "tasks", isSearching: false }));
			} else if (!filters?.types || filters.types.includes("task")) {
				notLoadedTypes.push("task");
			}

			// Search in events if loaded and type not filtered
			if (state.search.entityLoadStatus.events && (!filters?.types || filters.types.includes("event"))) {
				dispatch(setSearchingEntity({ entity: "events", isSearching: true }));
				const eventResults = searchInEvents(state.events.events || [], query);
				results.push(...eventResults);
				dispatch(setSearchingEntity({ entity: "events", isSearching: false }));
			} else if (!filters?.types || filters.types.includes("event")) {
				notLoadedTypes.push("event");
			}

			// If there are entities not loaded, search on server
			if (notLoadedTypes.length > 0) {
				// Check cache first
				const cacheKey = `${query}-${notLoadedTypes.join(",")}`;
				const cachedResults = state.search.serverSearchCache[cacheKey];

				if (cachedResults) {
					results.push(...cachedResults);
				} else {
					// Search on server
					dispatch(startServerSearch());
					try {
						const serverResults = await searchService.searchOnServer(query, notLoadedTypes);
						results.push(...serverResults);
						// Cache the results
						dispatch(setCacheResults({ query: cacheKey, results: serverResults }));
					} catch (error) {
						// Continue with local results even if server search fails
					} finally {
						dispatch(endServerSearch());
					}
				}
			}

			// Sort results by relevance (simple implementation - can be improved)
			const sortedResults = results.sort((a, b) => {
				// Prioritize exact matches in title
				const aExactMatch = normalizeText(a.title).includes(normalizeText(query));
				const bExactMatch = normalizeText(b.title).includes(normalizeText(query));
				if (aExactMatch && !bExactMatch) return -1;
				if (!aExactMatch && bExactMatch) return 1;
				return 0;
			});

			dispatch(setResults(sortedResults));
		} catch (error) {
			dispatch(setError("Error al realizar la búsqueda"));
		}
	};
}
