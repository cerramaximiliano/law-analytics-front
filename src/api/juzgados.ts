import axios from "axios";

export interface JuzgadoSearchParams {
	jurisdiccion?: string;
	organismo?: string;
	codigo?: number;
	ciudad?: string;
	limit?: number;
	skip?: number;
	[key: string]: any;
}

export interface Juzgado {
	_id: string;
	jurisdiccion: string;
	organismo: string;
	codigo: number;
	ciudad: string;
	[key: string]: any;
}

export interface JuzgadosResponse {
	success: boolean;
	data: Juzgado[];
	total: number;
	limit: number;
	skip: number;
}

export const searchJuzgados = async (params: JuzgadoSearchParams = {}): Promise<JuzgadosResponse> => {
	const queryParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			queryParams.append(key, String(value));
		}
	});

	const queryString = queryParams.toString();
	const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
	const url = `${baseURL}/api/juzgados/search${queryString ? `?${queryString}` : ""}`;

	// Get token from localStorage
	const token = localStorage.getItem("serviceToken");

	console.log("🔍 Fetching juzgados from:", url);
	console.log("🔑 Token present:", !!token);

	try {
		const response = await axios.get<JuzgadosResponse>(url, {
			headers: {
				Authorization: token ? `Bearer ${token}` : "",
			},
		});
		
		console.log("✅ Juzgados response:", response.data);
		console.log("📊 Total juzgados found:", response.data.total);
		
		return response.data;
	} catch (error: any) {
		console.error("❌ Error fetching juzgados:", error);
		console.error("📋 Error details:", {
			status: error?.response?.status,
			statusText: error?.response?.statusText,
			data: error?.response?.data,
			url: url,
			headers: error?.config?.headers
		});
		throw error;
	}
};

export const getJuzgadosByJurisdiction = async (jurisdiccion: string): Promise<Juzgado[]> => {
	// No limit - get all results for the jurisdiction
	const response = await searchJuzgados({ jurisdiccion });
	return response.data;
};
