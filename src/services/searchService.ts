import axios from "axios";
import { SearchResult } from "types/search";

interface ServerSearchResponse {
	success?: boolean;
	data?: {
		folders?: any[];
		contacts?: any[];
		calculators?: any[];
		tasks?: any[];
		events?: any[];
	};
	folders?: any[];
	contacts?: any[];
	calculators?: any[];
	tasks?: any[];
	events?: any[];
}

export const searchService = {
	/**
	 * Perform a global search on the server
	 * This is used when entities are not loaded in the store
	 */
	async searchOnServer(query: string, entityTypes?: string[]): Promise<SearchResult[]> {
		try {
			const params = {
				q: query,
				types: entityTypes?.join(",") || "folder,contact,calculator,task,event",
			};

			const response = await axios.get<ServerSearchResponse>(`${import.meta.env.VITE_BASE_URL}/api/search`, { params });
			const results: SearchResult[] = [];

			// Handle response structure - the API may return data wrapped or unwrapped
			const responseData = response.data.data || response.data;

			// Process folders
			if (responseData.folders) {
				responseData.folders.forEach((folder) => {
					results.push({
						id: folder._id || folder.id,
						type: "folder",
						title: folder.folderName,
						subtitle: folder.materia,
						description: `${folder.orderStatus || ""} - ${folder.status || ""}`,
						metadata: {
							status: folder.status,
							fuero: folder.folderFuero,
							jurisdiction: folder.folderJuris,
						},
					});
				});
			}

			// Process contacts
			if (responseData.contacts) {
				responseData.contacts.forEach((contact) => {
					results.push({
						id: contact._id || contact.id,
						type: "contact",
						title: `${contact.name} ${contact.lastName || ""}`.trim(),
						subtitle: contact.role,
						description: contact.email || contact.phone || "",
						metadata: {
							role: contact.role,
							document: contact.document,
							company: contact.company,
						},
					});
				});
			}

			// Process calculators
			if (responseData.calculators) {
				responseData.calculators.forEach((calc) => {
					results.push({
						id: calc._id || calc.id,
						type: "calculator",
						title: calc.folderName || "Cálculo",
						subtitle: `${calc.classType} - ${calc.subClassType}`,
						description: `${calc.type} - $${calc.amount?.toLocaleString("es-AR") || "0"}`,
						metadata: {
							type: calc.type,
							classType: calc.classType,
							amount: calc.amount,
						},
					});
				});
			}

			// Process tasks
			if (responseData.tasks) {
				responseData.tasks.forEach((task) => {
					results.push({
						id: task._id || task.id,
						type: "task",
						title: task.name,
						subtitle: task.priority ? `Prioridad: ${task.priority}` : undefined,
						description: task.description || `Estado: ${task.status}`,
						metadata: {
							status: task.status,
							priority: task.priority,
							dueDate: task.dueDate,
						},
					});
				});
			}

			// Process events
			if (responseData.events) {
				responseData.events.forEach((event) => {
					results.push({
						id: event._id || event.id,
						type: "event",
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
					});
				});
			}

			return results;
		} catch (error) {
			throw error;
		}
	},

	/**
	 * Search in a specific entity type
	 */
	async searchEntity(entityType: string, query: string): Promise<SearchResult[]> {
		try {
			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/${entityType}/search`, {
				params: { q: query },
			});

			// Transform based on entity type
			return response.data
				.map((item: any) => {
					switch (entityType) {
						case "folders":
							return {
								id: item.id,
								type: "folder",
								title: item.folderName,
								subtitle: item.materia,
								description: `${item.orderStatus || ""} - ${item.status || ""}`,
							};
						case "contacts":
							return {
								id: item.id,
								type: "contact",
								title: `${item.name} ${item.lastName || ""}`.trim(),
								subtitle: item.role,
								description: item.email || item.phone || "",
							};
						case "calculators":
							return {
								id: item.id,
								type: "calculator",
								title: item.folderName || "Cálculo",
								subtitle: `${item.classType} - ${item.subClassType}`,
								description: `${item.type} - $${item.amount?.toLocaleString("es-AR") || "0"}`,
							};
						case "tasks":
							return {
								id: item.id,
								type: "task",
								title: item.name,
								subtitle: item.priority ? `Prioridad: ${item.priority}` : undefined,
								description: item.description || `Estado: ${item.status}`,
							};
						case "events":
							return {
								id: item._id || item.id,
								type: "event",
								title: item.title,
								subtitle: item.type,
								description: item.folderName ? `Carpeta: ${item.folderName}` : item.description || "",
							};
						default:
							return null;
					}
				})
				.filter(Boolean);
		} catch (error) {
			return [];
		}
	},
};
