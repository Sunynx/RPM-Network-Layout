export interface DashboardStats {
  totalDevices: number;
  online: number;
  offline: number;
  warning: number;
  maintenance: number;
  totalVlans: number;
  totalSubnets: number;
  totalRacks: number;
  byType: { name: string; count: number }[];
  byStatus: { name: string; value: number; color: string }[];
  recentDevices: import("@/types/network").Device[];
}
