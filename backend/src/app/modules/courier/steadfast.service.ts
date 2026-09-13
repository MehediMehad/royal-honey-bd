import axios from 'axios';
import config from '../../../configs';
import type {
  ICourierCreateParcelPayload,
  ICourierFraudCheckResult,
  ICourierParcelResult,
  ICourierTrackingResult,
} from './courier.interface';

const getHeaders = () => ({
  'Api-Key': config.courier.apiKey,
  'Secret-Key': config.courier.secretKey,
  'Content-Type': 'application/json',
});

const isSandboxMode = () => {
  return (
    config.courier.mode === 'sandbox' ||
    !config.courier.apiKey ||
    !config.courier.secretKey
  );
};

/**
 * Create a parcel order in Steadfast Courier
 */
const createParcel = async (
  payload: ICourierCreateParcelPayload,
): Promise<ICourierParcelResult> => {
  if (isSandboxMode()) {
    const mockConsignmentId = `MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
    const mockTrackingCode = `ST-MOCK-${Math.floor(1000000 + Math.random() * 9000000)}`;

    console.log(`
📦 [Steadfast Sandbox Mode]
=========================================
Invoice: ${payload.invoice}
Recipient: ${payload.recipient_name} (${payload.recipient_phone})
Address: ${payload.recipient_address}
COD Amount: ৳${payload.cod_amount}
Consignment ID: ${mockConsignmentId}
Tracking Code: ${mockTrackingCode}
Note: Safe Sandbox Mode Active (No real delivery requested)
=========================================
`);

    return {
      consignmentId: mockConsignmentId,
      trackingCode: mockTrackingCode,
      invoice: payload.invoice,
      status: 'in_review',
      isSandbox: true,
    };
  }

  try {
    const response = await axios.post(
      `${config.courier.baseUrl}/create_order`,
      {
        invoice: payload.invoice,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        cod_amount: payload.cod_amount,
        note: payload.note || 'Fragile Honey Jars — Handle with care',
      },
      {
        headers: getHeaders(),
        timeout: 10000,
      },
    );

    const consignment = response.data?.consignment;
    return {
      consignmentId: String(consignment?.consignment_id || consignment?.id || ''),
      trackingCode: consignment?.tracking_code || '',
      invoice: consignment?.invoice || payload.invoice,
      status: consignment?.status || 'in_review',
      isSandbox: false,
      rawResponse: response.data,
    };
  } catch (error: any) {
    console.error('❌ Steadfast API create_order error:', error?.response?.data || error?.message);
    throw new Error(
      `Steadfast Courier Booking Failed: ${error?.response?.data?.message || error?.message}`,
    );
  }
};

/**
 * Check customer past courier delivery success / return fraud rate
 */
const checkCustomerFraud = async (
  phone: string,
): Promise<ICourierFraudCheckResult> => {
  const cleanPhone = phone.replace(/[\s-+]/g, '');

  if (isSandboxMode()) {
    return {
      phone: cleanPhone,
      totalParcels: 18,
      totalDelivered: 17,
      totalCancelled: 1,
      deliverySuccessRate: 94.4,
      riskAssessment: 'LOW',
      isSandbox: true,
    };
  }

  try {
    const response = await axios.get(
      `${config.courier.baseUrl}/fraud-check/${cleanPhone}`,
      {
        headers: getHeaders(),
        timeout: 10000,
      },
    );

    const data = response.data;
    const totalParcels = Number(data?.total_parcels || 0);
    const totalDelivered = Number(data?.total_delivered || 0);
    const totalCancelled = Number(data?.total_cancelled || 0);
    const deliverySuccessRate =
      totalParcels > 0
        ? Math.round((totalDelivered / totalParcels) * 100)
        : 100;

    let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (totalParcels > 3 && deliverySuccessRate < 50) {
      riskAssessment = 'HIGH';
    } else if (totalParcels > 3 && deliverySuccessRate < 80) {
      riskAssessment = 'MEDIUM';
    }

    return {
      phone: cleanPhone,
      totalParcels,
      totalDelivered,
      totalCancelled,
      deliverySuccessRate,
      riskAssessment,
      isSandbox: false,
    };
  } catch (error: any) {
    console.warn('⚠️ Steadfast fraud check warning:', error?.message || error);
    return {
      phone: cleanPhone,
      totalParcels: 0,
      totalDelivered: 0,
      totalCancelled: 0,
      deliverySuccessRate: 100,
      riskAssessment: 'LOW',
      isSandbox: false,
    };
  }
};

/**
 * Track parcel by consignment ID or tracking code
 */
const trackParcel = async (
  trackingOrConsignmentId: string,
): Promise<ICourierTrackingResult> => {
  if (isSandboxMode()) {
    return {
      consignmentId: trackingOrConsignmentId,
      trackingCode: trackingOrConsignmentId,
      status: 'in_review',
      isSandbox: true,
    };
  }

  try {
    const response = await axios.get(
      `${config.courier.baseUrl}/status_by_cid/${trackingOrConsignmentId}`,
      {
        headers: getHeaders(),
        timeout: 10000,
      },
    );

    const data = response.data;
    return {
      consignmentId: trackingOrConsignmentId,
      status: data?.delivery_status || data?.status || 'unknown',
      isSandbox: false,
    };
  } catch (error: any) {
    console.warn('⚠️ Steadfast track parcel error:', error?.message || error);
    return {
      consignmentId: trackingOrConsignmentId,
      status: 'pending',
      isSandbox: false,
    };
  }
};

export const SteadfastServices = {
  createParcel,
  checkCustomerFraud,
  trackParcel,
  isSandboxMode,
};

