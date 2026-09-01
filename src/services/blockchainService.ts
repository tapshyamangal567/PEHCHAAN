import apiClient from './api/apiClient';

export interface BlockchainStatusResponse {
  network: string;
  chain_id: number;
  rpc_url: string;
  contract_address: string;
  relayer_address: string | null;
  rpc_connected: boolean;
  explorer_base: string;
}

export interface CaseBlockchainMetadata {
  verification_id: string;
  blockchain_status: 'PENDING' | 'QUEUED' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'NOT_REQUESTED';
  blockchain_network: string;
  case_hash?: string;
  document_hash?: string;
  result_hash?: string;
  transaction_hash?: string;
  block_number?: number;
  anchored_at?: string;
  error?: string;
}

export interface CaseIntegrityVerificationResult {
  success: boolean;
  case_id: string;
  integrity: 'VALID' | 'FAILED' | 'NOT_ANCHORED' | 'NOT_FOUND';
  reason?: string;
  blockchain_status?: string;
  case_hash?: string;
  computed_hash?: string;
  anchored_hash?: string;
  transaction_hash?: string;
  block_number?: number;
  network?: string;
  anchored_at?: string;
  explorer_url?: string;
}

class BlockchainService {
  /**
   * Fetches Polygon network and contract status from backend.
   */
  async getStatus(): Promise<BlockchainStatusResponse> {
    const res = await apiClient.get<{ success: boolean; data: BlockchainStatusResponse }>(
      '/api/blockchain/status'
    );
    return res.data.data;
  }

  /**
   * Fetches blockchain anchor metadata for a case.
   */
  async getCaseMetadata(verificationId: string): Promise<CaseBlockchainMetadata> {
    const res = await apiClient.get<{ success: boolean; data: CaseBlockchainMetadata }>(
      `/api/blockchain/cases/${verificationId}`
    );
    return res.data.data;
  }

  /**
   * Verifies database record integrity against the immutable on-chain anchor.
   */
  async verifyIntegrity(verificationId: string): Promise<CaseIntegrityVerificationResult> {
    const res = await apiClient.get<CaseIntegrityVerificationResult>(
      `/api/blockchain/verify/${verificationId}`
    );
    return res.data;
  }

  /**
   * Retries or initiates anchoring for a verification case.
   */
  async anchorCase(verificationId: string): Promise<any> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/api/blockchain/cases/${verificationId}/anchor`
    );
    return res.data.data;
  }
}

export const blockchainService = new BlockchainService();
