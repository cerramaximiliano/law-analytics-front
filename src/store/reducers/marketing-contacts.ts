import axios from "axios";
import { MarketingContact, ContactResponse, ContactInput } from "types/marketing-contact";
// import { SingleContactResponse } from "types/marketing-contact";

// Constants
const baseURL = process.env.REACT_APP_MKT_URL || "https://mkt.lawanalytics.app";

interface TagsResponse {
	success: boolean;
	data: string[];
}

// Use the central axios instance that has token refresh capability
// We'll only modify the baseURL for marketing API requests

// Contact API Service
export const MarketingContactService = {
	// Get all contacts with optional filters
	getContacts: async (
		page = 1,
		limit = 20,
		sortBy = "createdAt",
		sortDir = "desc",
		filters: {
			status?: string;
			search?: string;
			tag?: string;
		} = {},
	): Promise<ContactResponse> => {
		try {
			const response = await axios.get(`${baseURL}/api/contacts`, {
				params: {
					page,
					limit,
					sortBy,
					sortDir,
					...filters,
				},
			});
			return response.data;
		} catch (error) {
			console.error("Error fetching contacts:", error);
			throw error;
		}
	},

	// Get a single contact by ID
	getContactById: async (id: string): Promise<MarketingContact> => {
		try {
			const response = await axios.get(`${baseURL}/api/contacts/${id}`);
			return response.data.data;
		} catch (error) {
			console.error(`Error fetching contact ${id}:`, error);
			throw error;
		}
	},

	// Create a new contact
	createContact: async (contactData: ContactInput): Promise<MarketingContact> => {
		try {
			const response = await axios.post(`${baseURL}/api/contacts`, contactData);
			return response.data.data;
		} catch (error) {
			console.error("Error creating contact:", error);
			throw error;
		}
	},

	// Update an existing contact
	updateContact: async (id: string, contactData: Partial<ContactInput>): Promise<MarketingContact> => {
		try {
			const response = await axios.put(`${baseURL}/api/contacts/${id}`, contactData);
			return response.data.data;
		} catch (error) {
			console.error(`Error updating contact ${id}:`, error);
			throw error;
		}
	},

	// Delete a contact
	deleteContact: async (id: string): Promise<{ success: boolean; message: string }> => {
		try {
			const response = await axios.delete(`${baseURL}/api/contacts/${id}`);
			return response.data;
		} catch (error) {
			console.error(`Error deleting contact ${id}:`, error);
			throw error;
		}
	},

	// Import contacts from CSV or other source
	importContacts: async (
		fileData: File | FormData,
		options?: Record<string, any>,
	): Promise<{ success: boolean; imported: number; errors: number; message: string }> => {
		try {
			const formData = fileData instanceof FormData ? fileData : new FormData();

			if (!(fileData instanceof FormData)) {
				formData.append("file", fileData);
			}

			if (options) {
				formData.append("options", JSON.stringify(options));
			}

			const response = await axios.post(`${baseURL}/api/contacts/import`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			return response.data;
		} catch (error) {
			console.error("Error importing contacts:", error);
			throw error;
		}
	},

	// Bulk operations
	bulkUpdate: async (ids: string[], updateData: Partial<ContactInput>): Promise<{ success: boolean; updated: number; message: string }> => {
		try {
			const response = await axios.put(`${baseURL}/api/contacts/bulk`, {
				ids,
				updateData,
			});
			return response.data;
		} catch (error) {
			console.error("Error bulk updating contacts:", error);
			throw error;
		}
	},

	bulkDelete: async (ids: string[]): Promise<{ success: boolean; deleted: number; message: string }> => {
		try {
			const response = await axios.delete(`${baseURL}/api/contacts/bulk`, {
				data: { ids },
			});
			return response.data;
		} catch (error) {
			console.error("Error bulk deleting contacts:", error);
			throw error;
		}
	},

	// Get contact statistics
	getContactStats: async (): Promise<any> => {
		try {
			const response = await axios.get(`${baseURL}/api/contacts/stats`);
			return response.data.data;
		} catch (error) {
			console.error("Error fetching contact statistics:", error);
			throw error;
		}
	},

	// Update only the status of a contact
	updateContactStatus: async (id: string, status: string): Promise<MarketingContact> => {
		try {
			const response = await axios.patch(`${baseURL}/api/contacts/${id}/status`, { status });
			return response.data.data;
		} catch (error) {
			console.error(`Error updating status for contact ${id}:`, error);
			throw error;
		}
	},

	// Get campaign details by ID
	getCampaignById: async (id: string): Promise<any> => {
		try {
			const response = await axios.get(`${baseURL}/api/campaigns/${id}`);
			return response.data.data;
		} catch (error) {
			console.error(`Error fetching campaign ${id}:`, error);
			throw error;
		}
	},

	// Get all tags for contacts
	getTags: async (): Promise<string[]> => {
		try {
			const response = await axios.get<TagsResponse>(`${baseURL}/api/tags/simple`);
			return response.data.data;
		} catch (error) {
			console.error("Error fetching tags:", error);
			throw error;
		}
	},
};
