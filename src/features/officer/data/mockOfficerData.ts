import { RiskLevel, SystemStatus } from '../../../types/common';

export interface PendingAlert {
  id: string;
  caseId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  timestamp: string;
  passportNumber?: string;
  nationality?: string;
}

export interface OfficerCase {
  id: string;
  caseId: string;
  documentType: 'Passport' | 'Visa' | 'National ID';
  holderName: string;
  passportNumber: string;
  nationality: string;
  riskLevel: RiskLevel;
  status: SystemStatus;
  timestamp: string;
  riskScore: number;
  matchScore: number;
  officerName?: string;
  officerBadge?: string;
  reason?: string;
  mrzStatus?: string;
  watchlistMatch?: boolean;
}
