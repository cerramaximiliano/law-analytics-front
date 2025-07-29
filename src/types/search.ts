export interface SearchResult {
	id: string;
	type: "folder" | "contact" | "calculator" | "task" | "event";
	title: string;
	subtitle?: string;
	description?: string;
	icon?: string;
	metadata?: Record<string, any>;
	score?: number; // Relevancia del resultado
}

export interface SearchFilter {
	types?: Array<"folder" | "contact" | "calculator" | "task" | "event">;
	dateRange?: {
		from?: Date;
		to?: Date;
	};
	status?: string[];
	priority?: string[];
}

export interface SearchState {
	isOpen: boolean;
	query: string;
	filters: SearchFilter;
	results: SearchResult[];
	recentSearches: string[];
	isSearching: boolean;
	searchingEntities: {
		folders: boolean;
		contacts: boolean;
		calculators: boolean;
		tasks: boolean;
		events: boolean;
	};
	entityLoadStatus: {
		folders: boolean;
		contacts: boolean;
		calculators: boolean;
		tasks: boolean;
		events: boolean;
	};
	isSearchingServer: boolean;
	serverSearchCache: Record<string, SearchResult[]>;
	error: string | null;
}

export const initialSearchState: SearchState = {
	isOpen: false,
	query: "",
	filters: {},
	results: [],
	recentSearches: [],
	isSearching: false,
	searchingEntities: {
		folders: false,
		contacts: false,
		calculators: false,
		tasks: false,
		events: false,
	},
	entityLoadStatus: {
		folders: false,
		contacts: false,
		calculators: false,
		tasks: false,
		events: false,
	},
	isSearchingServer: false,
	serverSearchCache: {},
	error: null,
};
