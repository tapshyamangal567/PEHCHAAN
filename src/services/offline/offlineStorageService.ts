import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { LocalMrzResult } from './localMrzParser';

export type OfflineCaseStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REQUIRES_REVIEW';

export interface OfflineCase {
  local_case_id: string;
  created_at: string;
  officer_id?: string;
  document_uri: string;
  document_name?: string;
  document_size_formatted?: string;
  mrz_result?: LocalMrzResult;
  ocr_status: 'UNAVAILABLE_OFFLINE' | 'COMPLETE';
  face_status: 'NOT_AVAILABLE_OFFLINE';
  sync_status: OfflineCaseStatus;
  retry_count: number;
  last_sync_error?: string;
  server_verification_id?: string;
  server_result?: any;
  synced_at?: string;
}

const STORAGE_KEY = 'PEHCHAAN_OFFLINE_CASES_QUEUE_V1';

// In-memory fallback for web/testing
let memoryQueue: OfflineCase[] = [];

export class OfflineStorageService {
  /**
   * Generates a unique, standardized local case ID: OFF-YYYYMMDD-XXXX
   */
  static generateLocalCaseId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
    return `OFF-${dateStr}-${randHex}`;
  }

  /**
   * Loads all offline cases from secure storage
   */
  static async getAllCases(): Promise<OfflineCase[]> {
    try {
      if (Platform.OS === 'web') {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      }
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      if (__DEV__) console.warn('[OFFLINE_STORAGE] Read error:', err);
      return memoryQueue;
    }
  }

  /**
   * Saves or updates full case list in secure storage
   */
  static async saveAllCases(cases: OfflineCase[]): Promise<void> {
    try {
      memoryQueue = cases;
      const jsonStr = JSON.stringify(cases);
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, jsonStr);
        return;
      }
      await SecureStore.setItemAsync(STORAGE_KEY, jsonStr);
    } catch (err) {
      if (__DEV__) console.error('[OFFLINE_STORAGE] Write error:', err);
    }
  }

  /**
   * Creates and persists a new offline case in the secure queue
   */
  static async createOfflineCase(params: {
    documentUri: string;
    documentName?: string;
    documentSizeFormatted?: string;
    officerId?: string;
    mrzResult?: LocalMrzResult;
  }): Promise<OfflineCase> {
    const newCase: OfflineCase = {
      local_case_id: this.generateLocalCaseId(),
      created_at: new Date().toISOString(),
      officer_id: params.officerId,
      document_uri: params.documentUri,
      document_name: params.documentName || 'Passport Document',
      document_size_formatted: params.documentSizeFormatted || '1.2 MB',
      mrz_result: params.mrzResult,
      ocr_status: 'UNAVAILABLE_OFFLINE',
      face_status: 'NOT_AVAILABLE_OFFLINE',
      sync_status: 'PENDING',
      retry_count: 0,
    };

    const cases = await this.getAllCases();
    cases.unshift(newCase);
    await this.saveAllCases(cases);

    if (__DEV__) {
      console.log(`[OFFLINE] Case created: ${newCase.local_case_id}`);
    }

    return newCase;
  }

  /**
   * Retrieves pending cases waiting for synchronization
   */
  static async getPendingCases(): Promise<OfflineCase[]> {
    const cases = await this.getAllCases();
    return cases.filter((c) => c.sync_status === 'PENDING' || c.sync_status === 'FAILED');
  }

  /**
   * Updates state of an individual case in the queue
   */
  static async updateCase(
    localCaseId: string,
    updates: Partial<OfflineCase>
  ): Promise<OfflineCase | null> {
    const cases = await this.getAllCases();
    const idx = cases.findIndex((c) => c.local_case_id === localCaseId);
    if (idx === -1) return null;

    cases[idx] = {
      ...cases[idx],
      ...updates,
    };

    await this.saveAllCases(cases);
    return cases[idx];
  }

  /**
   * Returns queue statistics (pending, syncing, synced, failed)
   */
  static async getQueueStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
  }> {
    const cases = await this.getAllCases();
    return {
      total: cases.length,
      pending: cases.filter((c) => c.sync_status === 'PENDING').length,
      syncing: cases.filter((c) => c.sync_status === 'SYNCING').length,
      synced: cases.filter((c) => c.sync_status === 'SYNCED').length,
      failed: cases.filter((c) => c.sync_status === 'FAILED').length,
    };
  }

  /**
   * Cleans up synced cases older than 24 hours to prevent memory bloat
   */
  static async pruneOldSyncedCases(): Promise<void> {
    const cases = await this.getAllCases();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = cases.filter((c) => {
      if (c.sync_status !== 'SYNCED' || !c.synced_at) return true;
      return new Date(c.synced_at).getTime() > cutoff;
    });
    await this.saveAllCases(filtered);
  }
}

export default OfflineStorageService;
