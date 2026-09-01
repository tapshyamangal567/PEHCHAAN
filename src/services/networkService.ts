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

      // Check backend reachability with lightweight health probe (5s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(`${API_BASE_URL}/docs`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok || response.status === 200 || response.status === 404) {
          set({
            status: 'ONLINE',
            isInternetReachable: true,
            isBackendReachable: true,
            lastChecked: new Date(),
          });
          return 'ONLINE';
        } else {
          set({
            status: 'LIMITED',
            isInternetReachable: true,
            isBackendReachable: false,
            lastChecked: new Date(),
          });
          return 'LIMITED';
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
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
