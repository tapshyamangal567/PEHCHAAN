import { create } from 'zustand';
import { Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { OfflineStorageService, OfflineCase } from './offlineStorageService';
import { PassportScreeningResponse } from '../screeningService';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  currentSyncCaseId: string | null;
  stats: {
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
  };
  refreshStats: () => Promise<void>;
  syncAllPending: () => Promise<{ successCount: number; failCount: number }>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  lastSyncTime: null,
  currentSyncCaseId: null,
  stats: { pending: 0, syncing: 0, synced: 0, failed: 0 },

  refreshStats: async () => {
    const stats = await OfflineStorageService.getQueueStats();
    set({ stats });
  },

  syncAllPending: async () => {
    const { isSyncing } = get();
    if (isSyncing) return { successCount: 0, failCount: 0 };

    set({ isSyncing: true });
    let successCount = 0;
    let failCount = 0;

    try {
      const pendingCases = await OfflineStorageService.getPendingCases();

      for (const offlineCase of pendingCases) {
        set({ currentSyncCaseId: offlineCase.local_case_id });
        await OfflineStorageService.updateCase(offlineCase.local_case_id, {
          sync_status: 'SYNCING',
        });
        await get().refreshStats();

        try {
          if (__DEV__) {
            console.log(`[SYNC] Uploading offline case: ${offlineCase.local_case_id}`);
          }

          // Build multipart form data for /api/verifications/sync
          const formData = new FormData();
          const filename = offlineCase.document_uri.split('/').pop() || 'passport.jpg';
          const fileObj: any = {
            uri: Platform.OS === 'ios' ? offlineCase.document_uri.replace('file://', '') : offlineCase.document_uri,
            type: 'image/jpeg',
            name: filename,
          };
          formData.append('file', fileObj);
          formData.append('local_case_id', offlineCase.local_case_id);
          formData.append('captured_at', offlineCase.created_at);

          const response = await apiClient.post<PassportScreeningResponse>(
            '/api/verifications/sync',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 30000,
            }
          );

          if (response.data && response.data.success) {
            await OfflineStorageService.updateCase(offlineCase.local_case_id, {
              sync_status: 'SYNCED',
              server_verification_id: response.data.verification_id,
              server_result: response.data,
              synced_at: new Date().toISOString(),
              last_sync_error: undefined,
            });
            successCount++;
            if (__DEV__) {
              console.log(`[SYNC] Successfully synced: ${offlineCase.local_case_id}`);
            }
          } else {
            throw new Error('Server returned unsuccessful sync response');
          }
        } catch (syncErr: any) {
          failCount++;
          const errMsg = syncErr?.response?.data?.error?.message || syncErr.message || 'Sync failed';
          const retryCount = (offlineCase.retry_count || 0) + 1;

          await OfflineStorageService.updateCase(offlineCase.local_case_id, {
            sync_status: 'FAILED',
            retry_count: retryCount,
            last_sync_error: errMsg,
          });

          if (__DEV__) {
            console.warn(`[SYNC] Failed ${offlineCase.local_case_id}: ${errMsg}`);
          }
        }
      }
    } finally {
      set({
        isSyncing: false,
        currentSyncCaseId: null,
        lastSyncTime: new Date(),
      });
      await get().refreshStats();
    }

    return { successCount, failCount };
  },
}));

export default useSyncStore;
