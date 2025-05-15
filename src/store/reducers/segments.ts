import axios from "axios";
import { Segment, SegmentResponse, SegmentInput } from "types/segment";
// import { SingleSegmentResponse } from "types/segment";

// Constants
const baseURL = process.env.REACT_APP_MKT_URL || "https://mkt.lawanalytics.app";

// Use the central axios instance that has token refresh capability
// We'll only modify the baseURL for marketing API requests

// Segment API Service
export const SegmentService = {
	// Get all segments with optional filters
	getSegments: async (
		page = 1,
		limit = 20,
		sortBy = "createdAt",
		sortDir = "desc",
		filters: {
			isActive?: boolean;
		} = {},
	): Promise<SegmentResponse> => {
		try {
			const response = await axios.get(`${baseURL}/api/segments`, {
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
			console.error("Error fetching segments:", error);
			throw error;
		}
	},

	// Get a single segment by ID
	getSegmentById: async (id: string): Promise<Segment> => {
		try {
			const response = await axios.get(`${baseURL}/api/segments/${id}`);
			return response.data.data;
		} catch (error) {
			console.error(`Error fetching segment ${id}:`, error);
			throw error;
		}
	},

	// Create a new segment
	createSegment: async (segmentData: SegmentInput): Promise<Segment> => {
		try {
			const response = await axios.post(`${baseURL}/api/segments`, segmentData);
			return response.data.data;
		} catch (error) {
			console.error("Error creating segment:", error);
			throw error;
		}
	},

	// Update an existing segment
	updateSegment: async (id: string, segmentData: Partial<SegmentInput>): Promise<Segment> => {
		try {
			const response = await axios.put(`${baseURL}/api/segments/${id}`, segmentData);
			return response.data.data;
		} catch (error) {
			console.error(`Error updating segment ${id}:`, error);
			throw error;
		}
	},

	// Delete a segment
	deleteSegment: async (id: string): Promise<{ success: boolean; message: string }> => {
		try {
			const response = await axios.delete(`${baseURL}/api/segments/${id}`);
			return response.data;
		} catch (error) {
			console.error(`Error deleting segment ${id}:`, error);
			throw error;
		}
	},

	// Get contacts belonging to a segment
	getSegmentContacts: async (id: string, page = 1, limit = 20, sortBy = "email", sortDir = "asc"): Promise<any> => {
		try {
			const response = await axios.get(`${baseURL}/api/segments/${id}/contacts`, {
				params: {
					page,
					limit,
					sortBy,
					sortDir,
				},
			});
			return response.data;
		} catch (error) {
			console.error(`Error fetching contacts for segment ${id}:`, error);
			throw error;
		}
	},

	// Add contacts to a static segment
	addContactsToSegment: async (id: string, contactIds: string[]): Promise<{ success: boolean; message: string; count?: number }> => {
		try {
			const response = await axios.post(`${baseURL}/api/segments/${id}/contacts`, { contactIds });
			return response.data;
		} catch (error) {
			console.error(`Error adding contacts to segment ${id}:`, error);
			throw error;
		}
	},

	// Remove contacts from a static segment
	removeContactsFromSegment: async (id: string, contactIds: string[]): Promise<{ success: boolean; message: string; count?: number }> => {
		try {
			const response = await axios.delete(`${baseURL}/api/segments/${id}/contacts`, {
				data: { contactIds },
			});
			return response.data;
		} catch (error) {
			console.error(`Error removing contacts from segment ${id}:`, error);
			throw error;
		}
	},

	// Calculate segment membership count (preview)
	calculateSegmentCount: async (conditions: any): Promise<{ count: number; success: boolean }> => {
		try {
			const response = await axios.post(`${baseURL}/api/segments/calculate`, { conditions });
			return response.data;
		} catch (error) {
			console.error("Error calculating segment count:", error);
			throw error;
		}
	},

	// Get segment statistics
	getSegmentStats: async (): Promise<any> => {
		try {
			const response = await axios.get(`${baseURL}/api/segments/stats`);
			return response.data.data;
		} catch (error) {
			console.error("Error fetching segment statistics:", error);
			throw error;
		}
	},
};
