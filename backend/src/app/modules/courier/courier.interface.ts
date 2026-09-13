export interface ICourierCreateParcelPayload {
  invoice: string; // Order ID e.g. RH-104928
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface ICourierParcelResult {
  consignmentId: string;
  trackingCode: string;
  invoice: string;
  status: string;
  isSandbox: boolean;
  rawResponse?: any;
}

export interface ICourierFraudCheckResult {
  phone: string;
  totalParcels: number;
  totalDelivered: number;
  totalCancelled: number;
  deliverySuccessRate: number; // percentage e.g. 90
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  isSandbox: boolean;
}

export interface ICourierTrackingResult {
  consignmentId: string;
  trackingCode?: string;
  invoice?: string;
  status: string;
  deliveryCharge?: number;
  isSandbox: boolean;
}

