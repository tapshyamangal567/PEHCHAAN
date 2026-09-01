import apiClient from './api/apiClient';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskFactorItem {
  name: string;
  status: string;
  points: number;
  reason: string;
}

export interface RiskCoverageData {
  completed_checks?: number;
  available_checks?: number;
  total_checks: number;
  percentage: number;
}

export interface SupportingSignalItem {
  status: string;
  reason: string;
}

export interface RiskAssessmentData {
  score: number;
  level: RiskLevel;
  coverage: RiskCoverageData;
  checks?: RiskFactorItem[];
  risk_factors: RiskFactorItem[];
  supporting_signals?: {
    expiry?: SupportingSignalItem;
    image_quality?: SupportingSignalItem;
  };
  verification_incomplete: boolean;
  recommendation: string;
}

export interface RiskAssessmentResponse {
  success: boolean;
  risk_assessment: RiskAssessmentData;
}

export class RiskScoringService {
  /**
   * Posts structured verification results to POST /api/risk/assess
   */
  static async assessRisk(verificationPayload: Record<string, any>): Promise<RiskAssessmentResponse> {
    const response = await apiClient.post<RiskAssessmentResponse>(
      '/api/risk/assess',
      verificationPayload
    );
    return response.data;
  }
}

export default RiskScoringService;
