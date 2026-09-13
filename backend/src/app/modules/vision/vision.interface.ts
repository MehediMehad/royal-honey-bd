export type ImageCategoryEnum =
  | 'PAYMENT_PROOF'
  | 'PRODUCT_INQUIRY'
  | 'ADDRESS_PROOF'
  | 'COMPLAINT_DAMAGE'
  | 'UNCLEAR';

export interface IPaymentProofData {
  transactionId?: string;
  amount?: number;
  paymentMethod?: 'BKASH' | 'NAGAD';
  recipientNumber?: string;
  senderNumber?: string;
  timestamp?: string;
  reference?: string;
}

export interface IProductMatchData {
  matchedProductId?: string;
  productName?: string;
  confidence?: number;
  matchedDetails?: string;
}

export interface IAddressProofData {
  name?: string;
  phone?: string;
  fullAddress?: string;
  district?: string;
  thana?: string;
}

export interface IComplaintData {
  isDamagedJar: boolean;
  isLeaking: boolean;
  issueDescription?: string;
}

export interface IVisionAnalysisResult {
  imageCategory: ImageCategoryEnum;
  confidence: number;
  description: string;
  paymentData?: IPaymentProofData;
  productMatch?: IProductMatchData;
  addressData?: IAddressProofData;
  complaintData?: IComplaintData;
  rawResponse?: any;
}

export interface IAnalyzeImagePayload {
  imageUrl?: string;
  base64Image?: string;
  mimeType?: string;
}

