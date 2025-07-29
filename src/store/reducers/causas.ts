import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { CausasState, VerifiedCausasResponse, DeleteCausaResponse } from "../../types/causas";
import causasService from "../../services/causasService";

const initialState: CausasState = {
	verifiedCausas: [],
	breakdown: {
		civil: 0,
		seguridad_social: 0,
		trabajo: 0,
	},
	count: 0,
	loading: false,
	error: null,
	message: null,
};

export const fetchVerifiedCausas = createAsyncThunk<VerifiedCausasResponse, void>(
	"causas/fetchVerified",
	async (_, { rejectWithValue }) => {
		try {
			const response = await causasService.getVerifiedCausas();
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Error al obtener las causas verificadas");
		}
	},
);

export const deleteCausa = createAsyncThunk<DeleteCausaResponse, { fuero: string; causaId: string }>(
	"causas/delete",
	async ({ fuero, causaId }, { rejectWithValue }) => {
		try {
			const response = await causasService.deleteCausa(fuero, causaId);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Error al eliminar la causa");
		}
	},
);

const causasSlice = createSlice({
	name: "causas",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		clearMessage: (state) => {
			state.message = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVerifiedCausas.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchVerifiedCausas.fulfilled, (state, action: PayloadAction<VerifiedCausasResponse>) => {
				state.loading = false;
				state.verifiedCausas = action.payload.data;
				state.breakdown = action.payload.breakdown;
				state.count = action.payload.count;
				state.message = action.payload.message;
				state.error = null;
			})
			.addCase(fetchVerifiedCausas.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
				state.verifiedCausas = [];
				state.count = 0;
			})
			// Delete causa cases
			.addCase(deleteCausa.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteCausa.fulfilled, (state, action: PayloadAction<DeleteCausaResponse>) => {
				state.loading = false;
				if (action.payload.success && action.payload.data) {
					// Remove the deleted causa from the list
					state.verifiedCausas = state.verifiedCausas.filter((causa) => causa._id !== action.payload.data!.id);
					state.count = state.count - 1;
					// Update breakdown
					const fuero = action.payload.data.fuero;
					if (fuero === "CIV") {
						state.breakdown.civil = Math.max(0, state.breakdown.civil - 1);
					} else if (fuero === "CSS") {
						state.breakdown.seguridad_social = Math.max(0, state.breakdown.seguridad_social - 1);
					} else if (fuero === "CNT") {
						state.breakdown.trabajo = Math.max(0, state.breakdown.trabajo - 1);
					}
					state.message = action.payload.message;
				}
				state.error = null;
			})
			.addCase(deleteCausa.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { clearError, clearMessage } = causasSlice.actions;
export default causasSlice.reducer;
