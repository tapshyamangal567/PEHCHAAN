import { RiskLevel, SystemStatus } from '../../../types/common';

export interface SupervisorReviewCase {
  id: string;
  caseId: string;
  documentType: 'Passport' | 'Visa' | 'National ID';
  holderName: string;
  passportNumber: string;
  nationality: string;
  officerName: string;
  officerBadge: string;
  riskLevel: RiskLevel;
  riskScore: number;
  matchScore: number;
  timestamp: string;
  reason: string;
  mrzStatus: string;
  watchlistMatch: boolean;
}

export interface ActiveOfficerItem {
  id: string;
  name: string;
  badgeId: string;
  screeningsToday: number;
  totalVerifications?: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface EscalatedAlertItem {
  id: string;
  caseId: string;
  title: string;
  riskLevel: RiskLevel;
  timestamp: string;
}
