import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/api';

export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE';

interface NetworkState {
  status: ConnectivityStatus;
  isInternetReachable: boolean;
  isBackendReachable: boolean;
  lastChecked: Date | null;
  checkConnectivity: () => Promise<ConnectivityStatus>;
  setStatus: (status: ConnectivityStatus) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  status: 'ONLINE',
  isInternetReachable: true,
  isBackendReachable: true,
  lastChecked: null,

  setStatus: (status: ConnectivityStatus) => set({ status }),

  checkConnectivity: async (): Promise<ConnectivityStatus> => {
    try {
      const netInfo: NetInfoState = await NetInfo.fetch();
      const isConnected = Boolean(netInfo.isConnected);

      if (!isConnected) {
        set({
          status: 'OFFLINE',
          isInternetReachable: false,
          isBackendReachable: false,
          lastChecked: new Date(),
        });
        return 'OFFLINE';
      }

      // Check backend reachability with lightweight health probe (4s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const probeUrl = `${API_BASE_URL}/health`;
        if (__DEV__) {
          console.log(`[Network Probe] Testing reachability at: ${probeUrl}`);
        }

        const response = await fetch(probeUrl, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok || response.status === 200) {
          if (__DEV__) {
            console.log(`[Network Probe] Backend reached successfully (HTTP ${response.status})`);
          }
          set({
            status: 'ONLINE',
            isInternetReachable: true,
            isBackendReachable: true,
            lastChecked: new Date(),
          });
          return 'ONLINE';
        } else {
          if (__DEV__) {
            console.warn(`[Network Probe] Backend returned non-200 status (HTTP ${response.status})`);
          }
          set({
            status: 'LIMITED',
            isInternetReachable: true,
            isBackendReachable: false,
            lastChecked: new Date(),
          });
          return 'LIMITED';
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (__DEV__) {
          console.warn(`[Network Probe] Backend unreachable at ${API_BASE_URL}:`, fetchErr?.message || fetchErr);
        }
        // Internet is connected, but backend server is unreachable
        set({
          status: 'LIMITED',
          isInternetReachable: true,
          isBackendReachable: false,
          lastChecked: new Date(),
        });
        return 'LIMITED';
      }
    } catch (err) {
      set({
        status: 'OFFLINE',
        isInternetReachable: false,
        isBackendReachable: false,
        lastChecked: new Date(),
      });
      return 'OFFLINE';
    }
  },
}));

// Initialize passive background listener
export const initNetworkMonitoring = () => {
  NetInfo.addEventListener((state: NetInfoState) => {
    if (!state.isConnected) {
      useNetworkStore.getState().setStatus('OFFLINE');
    } else {
      // Re-probe backend reachability when network changes
      useNetworkStore.getState().checkConnectivity();
    }
  });
};
