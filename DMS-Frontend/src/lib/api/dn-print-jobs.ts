import apiClient from './api-client';

export interface DnPrintPayload {
  deliveryId: string;
  deliveryNo: string;
  deliveryDate: string;
  showroomName: string;
  status: string;
  notes?: string;
  printedBy: string;
  printedAt: string;
  totalItems: number;
  totalValue: number;
  lines: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  rowsPerPage: number;
  pageWidthInches: number;
  pageHeightInches: number;
}

export interface DnPrintJob {
  id: string;
  deliveryId: string;
  deliveryNo: string;
  status: string;
  stationCode?: string;
  requestedByName: string;
  createdAt: string;
  payload?: DnPrintPayload;
}

export interface DnPrintAgentStatus {
  stationCode: string;
  machineName?: string;
  printerName?: string;
  ipAddress?: string;
  lastHeartbeatAt: string;
  isOnline: boolean;
  secondsSinceHeartbeat: number;
  pendingCommand?: string;
  lastCheckedAt?: string;
}

export interface DnPrintPresence {
  isOnline: boolean;
  onlineAgentCount: number;
  offlineSecondsThreshold: number;
  queueUrlHint?: string;
  agents: DnPrintAgentStatus[];
}

export interface PosDeviceStatus {
  id: string;
  deviceId: string;
  outletId?: string;
  showroom: string;
  device: string;
  status: string;
  isOnline: boolean;
  lastHeartbeatAt?: string;
  pendingCommand?: string;
  lastCheckedAt?: string;
}

export interface PosDevicePresence {
  onlineCount: number;
  offlineCount: number;
  unknownCount: number;
  checkedAt: string;
  offlineSecondsThreshold: number;
  devices: PosDeviceStatus[];
}

export const dnPrintJobsApi = {
  async enqueue(deliveryId: string, stationCode?: string): Promise<DnPrintJob> {
    const res = await apiClient.post<any>('/api/dn-print-jobs', {
      deliveryId,
      stationCode: stationCode || undefined,
    });
    return res.data?.data ?? res.data;
  },

  async enqueueBatch(deliveryIds: string[], stationCode?: string): Promise<DnPrintJob[]> {
    const res = await apiClient.post<any>('/api/dn-print-jobs/batch', {
      deliveryIds,
      stationCode: stationCode || undefined,
    });
    return res.data?.data ?? res.data ?? [];
  },

  async getPresence(): Promise<DnPrintPresence> {
    const res = await apiClient.get<any>('/api/dn-print-agents/status');
    const raw = res.data?.data ?? res.data;
    return {
      isOnline: Boolean(raw?.isOnline ?? raw?.IsOnline),
      onlineAgentCount: Number(raw?.onlineAgentCount ?? raw?.OnlineAgentCount ?? 0),
      offlineSecondsThreshold: Number(raw?.offlineSecondsThreshold ?? raw?.OfflineSecondsThreshold ?? 15),
      queueUrlHint: raw?.queueUrlHint ?? raw?.QueueUrlHint,
      agents: (raw?.agents ?? raw?.Agents ?? []).map((a: any) => ({
        stationCode: a.stationCode ?? a.StationCode ?? '',
        machineName: a.machineName ?? a.MachineName,
        printerName: a.printerName ?? a.PrinterName,
        ipAddress: a.ipAddress ?? a.IpAddress,
        lastHeartbeatAt: a.lastHeartbeatAt ?? a.LastHeartbeatAt ?? '',
        isOnline: Boolean(a.isOnline ?? a.IsOnline),
        secondsSinceHeartbeat: Number(a.secondsSinceHeartbeat ?? a.SecondsSinceHeartbeat ?? 0),
        pendingCommand: a.pendingCommand ?? a.PendingCommand,
        lastCheckedAt: a.lastCheckedAt ?? a.LastCheckedAt,
      })),
    };
  },
};
