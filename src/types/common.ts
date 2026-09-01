export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type SystemStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED' | 'VERIFIED' | 'FLAGGED';

export interface SecurityMetric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: SystemStatus;
}
