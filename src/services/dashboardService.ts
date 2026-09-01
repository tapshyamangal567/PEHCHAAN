import apiClient from './api/apiClient';
import { RiskLevel, SystemStatus } from '../types/common';
import { OfficerCase, PendingAlert } from '../features/officer/data/mockOfficerData';
import { SupervisorReviewCase, ActiveOfficerItem, EscalatedAlertItem } from '../features/supervisor/data/mockSupervisorData';

export interface DashboardSummary {
  screenedToday: number;
  clearedToday: number;
  flaggedToday: number;
  underReviewToday: number;
  totalVerifications: number;
  pendingReviewCount: number;
  activeOfficersCount: number;
  riskDistribution: {
    lowPercentage: number;
    mediumPercentage: number;
    highPercentage: number;
  };
}

export interface DashboardTrend {
  date: string;
  total: number;
  cleared: number;
  flagged: number;
}

export class DashboardService {
  /**
   * Fetch authenticated dashboard statistics calculated from PostgreSQL
   */
  static async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get('/api/dashboard/summary');
    const data = response.data;
    return {
      screenedToday: data.screened_today ?? 0,
      clearedToday: data.cleared_today ?? 0,
      flaggedToday: data.flagged_today ?? 0,
      underReviewToday: data.under_review_today ?? 0,
      totalVerifications: data.total_verifications ?? 0,
      pendingReviewCount: data.pending_review_count ?? 0,
      activeOfficersCount: data.active_officers_count ?? 0,
      riskDistribution: {
        lowPercentage: data.risk_distribution?.low_percentage ?? 0,
        mediumPercentage: data.risk_distribution?.medium_percentage ?? 0,
        highPercentage: data.risk_distribution?.high_percentage ?? 0,
      },
    };
  }

  /**
   * Fetch recent verification cases from PostgreSQL
   */
  static async getRecentCases(limit = 20): Promise<OfficerCase[]> {
    const response = await apiClient.get('/api/dashboard/recent-cases', {
      params: { limit },
    });
    const items = response.data || [];
    return items.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      documentType: item.document_type || 'Passport',
      holderName: item.holder_name || 'Unknown Holder',
      passportNumber: item.passport_number || 'N/A',
      nationality: item.nationality || 'IND',
      riskLevel: (item.risk_level || 'LOW') as RiskLevel,
      status: (item.status || 'VERIFIED') as SystemStatus,
      timestamp: item.timestamp || 'Recent',
      riskScore: item.risk_score ?? 0,
      matchScore: item.match_score ?? 95,
      officerName: item.officer_name,
      officerBadge: item.officer_badge,
      reason: item.reason,
      mrzStatus: item.mrz_status,
      watchlistMatch: item.watchlist_match,
    }));
  }

  /**
   * Fetch security alerts from PostgreSQL
   */
  static async getAlerts(limit = 10): Promise<PendingAlert[]> {
    const response = await apiClient.get('/api/dashboard/alerts', {
      params: { limit },
    });
    const items = response.data || [];
    return items.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      title: item.title,
      description: item.description,
      riskLevel: (item.risk_level || 'HIGH') as RiskLevel,
      timestamp: item.timestamp || 'Recent',
      passportNumber: item.passport_number,
      nationality: item.nationality,
    }));
  }

  /**
   * Fetch supervisor review queue cases from PostgreSQL
   */
  static async getReviewQueue(limit = 20): Promise<SupervisorReviewCase[]> {
    const response = await apiClient.get('/api/dashboard/recent-cases', {
      params: { limit },
    });
    const items = response.data || [];
    return items.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      documentType: item.document_type || 'Passport',
      holderName: item.holder_name || 'Unknown Holder',
      passportNumber: item.passport_number || 'N/A',
      nationality: item.nationality || 'IND',
      officerName: item.officer_name || 'Officer',
      officerBadge: item.officer_badge || 'N/A',
      riskLevel: (item.risk_level || 'HIGH') as RiskLevel,
      riskScore: item.risk_score ?? 0,
      matchScore: item.match_score ?? 60,
      timestamp: item.timestamp || 'Recent',
      reason: item.reason || 'Verification review required.',
      mrzStatus: item.mrz_status || 'PASSED',
      watchlistMatch: item.watchlist_match ?? false,
    }));
  }

  /**
   * Fetch officer operations throughput from PostgreSQL (Supervisor view)
   */
  static async getOfficerActivity(): Promise<ActiveOfficerItem[]> {
    const response = await apiClient.get('/api/dashboard/officer-activity');
    const items = response.data || [];
    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      badgeId: item.badge_id,
      screeningsToday: item.screenings_today ?? 0,
      status: (item.status || 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      lastActive: item.last_active || 'No activity',
    }));
  }

  /**
   * Fetch escalated supervisor alerts from PostgreSQL
   */
  static async getEscalatedAlerts(limit = 10): Promise<EscalatedAlertItem[]> {
    const response = await apiClient.get('/api/dashboard/alerts', {
      params: { limit },
    });
    const items = response.data || [];
    return items.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      title: item.title,
      riskLevel: (item.risk_level || 'HIGH') as RiskLevel,
      timestamp: item.timestamp || 'Recent',
    }));
  }

  /**
   * Fetch 7-day verification volume trends
   */
  static async getTrends(): Promise<DashboardTrend[]> {
    const response = await apiClient.get('/api/dashboard/trends');
    return response.data || [];
  }
}

export default DashboardService;
