/**
 * API Service para credenciales PJN
 *
 * Permite vincular credenciales del Portal del Poder Judicial de la Nación
 * para sincronizar automáticamente las causas del usuario.
 */

import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Interfaces
export interface PjnCredentialsStats {
  totalCausasFound: number;
  newCausasCreated: number;
  foldersCreated: number;
  lastCausasCount: number;
  byFuero: Record<string, number>;
  fromCache: number;
  fromScraping: number;
}

export interface PjnSyncProgress {
  startedAt: string;
  currentPage: number;
  totalPages: number;
  causasProcessed: number;
  totalExpected: number;
  progress: number;
  estimatedRemainingSeconds: number;
  lastUpdate: string;
}

export interface PjnCredentialsError {
  message: string;
  code: string;
  timestamp: string;
}

export interface PjnCredentialsStatus {
  id: string;
  enabled: boolean;
  verified: boolean;
  verifiedAt: string | null;
  isValid: boolean;
  isValidAt: string | null;
  syncStatus: "pending" | "in_progress" | "completed" | "error" | "never_synced";
  lastSync: string | null;
  lastSyncAttempt: string | null;
  consecutiveErrors: number;
  lastError: PjnCredentialsError | null;
  expectedCausasCount: number;
  processedCausasCount: number;
  foldersCreatedCount: number;
  stats: PjnCredentialsStats;
  currentSyncProgress: PjnSyncProgress | null;
  evolution: any;
  createdAt: string;
  updatedAt: string;
}

export interface PjnSyncHistoryEntry {
  date: string;
  totalCausas: number;
  newCausas: number;
  newFolders: number;
  byFuero: Record<string, number>;
  durationSeconds: number;
  pagesProcessed: number;
  fromCache: number;
  fromScraping: number;
}

export interface LinkCredentialsResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
    verified: boolean;
    isValid: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  error?: string;
}

export interface GetCredentialsStatusResponse {
  success: boolean;
  hasCredentials: boolean;
  data?: PjnCredentialsStatus;
  error?: string;
}

export interface GetSyncHistoryResponse {
  success: boolean;
  data?: {
    firstSync: {
      date: string;
      totalCausas: number;
      byFuero: Record<string, number>;
    };
    stats: PjnCredentialsStats;
    history: PjnSyncHistoryEntry[];
  };
  error?: string;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

class PjnCredentialsService {
  /**
   * Vincula credenciales PJN a la cuenta del usuario
   * @param cuil - CUIL del usuario (con o sin guiones)
   * @param password - Contraseña del portal PJN
   */
  async linkCredentials(cuil: string, password: string): Promise<LinkCredentialsResponse> {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/pjn-credentials`,
        { cuil, password },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response?.status === 400) {
        return {
          success: false,
          error: axiosError.response.data?.error || "Error de validación"
        };
      }

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: "Sesión expirada. Por favor, inicie sesión nuevamente."
        };
      }

      return {
        success: false,
        error: axiosError.response?.data?.error || "Error al vincular credenciales"
      };
    }
  }

  /**
   * Obtiene el estado de las credenciales PJN del usuario
   */
  async getCredentialsStatus(): Promise<GetCredentialsStatusResponse> {
    try {
      const response = await axios.get(`${BASE_URL}/api/pjn-credentials`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response?.status === 404) {
        return {
          success: false,
          hasCredentials: false,
          error: "No hay credenciales vinculadas"
        };
      }

      return {
        success: false,
        hasCredentials: false,
        error: axiosError.response?.data?.error || "Error al obtener estado de credenciales"
      };
    }
  }

  /**
   * Elimina las credenciales PJN del usuario
   */
  async unlinkCredentials(): Promise<GenericResponse> {
    try {
      const response = await axios.delete(`${BASE_URL}/api/pjn-credentials`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.error || "Error al desvincular credenciales"
      };
    }
  }

  /**
   * Habilita o deshabilita las credenciales
   * @param enabled - true para habilitar, false para deshabilitar
   */
  async toggleCredentials(enabled: boolean): Promise<GenericResponse> {
    try {
      const response = await axios.patch(
        `${BASE_URL}/api/pjn-credentials/toggle`,
        { enabled },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.error || "Error al cambiar estado de credenciales"
      };
    }
  }

  /**
   * Solicita una nueva sincronización de causas
   */
  async requestSync(): Promise<GenericResponse> {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/pjn-credentials/sync`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response?.status === 400) {
        return {
          success: false,
          error: axiosError.response.data?.error || "No se puede iniciar sincronización",
          data: axiosError.response.data?.currentProgress
        };
      }

      return {
        success: false,
        error: axiosError.response?.data?.error || "Error al solicitar sincronización"
      };
    }
  }

  /**
   * Obtiene el historial de sincronizaciones
   */
  async getSyncHistory(): Promise<GetSyncHistoryResponse> {
    try {
      const response = await axios.get(`${BASE_URL}/api/pjn-credentials/history`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.error || "Error al obtener historial"
      };
    }
  }

  /**
   * Polling del estado de sincronización
   * Útil para mostrar progreso en tiempo real
   * @param intervalMs - Intervalo de polling en milisegundos
   * @param onProgress - Callback cuando hay actualización
   * @param onComplete - Callback cuando se completa
   * @param onError - Callback cuando hay error
   * @returns Función para detener el polling
   */
  pollSyncStatus(
    intervalMs: number = 3000,
    onProgress: (status: PjnCredentialsStatus) => void,
    onComplete: (status: PjnCredentialsStatus) => void,
    onError: (error: string) => void
  ): () => void {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const response = await this.getCredentialsStatus();

        if (!response.success || !response.data) {
          onError(response.error || "Error obteniendo estado");
          return;
        }

        const status = response.data;

        // Si está completado o hubo error, notificar y detener
        if (status.syncStatus === "completed" || status.isValid) {
          onComplete(status);
          isPolling = false;
          return;
        }

        if (status.syncStatus === "error") {
          onError(status.lastError?.message || "Error en sincronización");
          isPolling = false;
          return;
        }

        // Notificar progreso
        onProgress(status);

        // Continuar polling si sigue en progreso
        if (status.syncStatus === "in_progress" || status.syncStatus === "pending") {
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        onError("Error de conexión");
        isPolling = false;
      }
    };

    // Iniciar polling
    poll();

    // Retornar función para detener
    return () => {
      isPolling = false;
    };
  }
}

export default new PjnCredentialsService();
