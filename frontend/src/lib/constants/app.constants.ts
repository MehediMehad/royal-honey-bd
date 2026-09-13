export const APP_NAME = "Royal Honey BD";
export const APP_DESCRIPTION = "Multi-Channel AI Automation & Admin Operations Portal";

export const USER_ROLES = {
  OWNER: "OWNER",
  SUPPORT_AGENT: "SUPPORT_AGENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const ROUTES = {
  HOME: "/admin",
  LOGIN: "/login",
  DASHBOARD: "/admin",
  INBOX: "/admin/inbox",
  ORDERS: "/admin/orders",
  INVENTORY: "/admin/inventory",
  KNOWLEDGE: "/admin/knowledge",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  ADMIN: {
    STATS: "/admin/dashboard-stats",
  },
  ORDERS: {
    LIST: "/orders",
    DETAILS: (id: string) => `/orders/${id}`,
    VERIFY_PAYMENT: (id: string) => `/orders/${id}/verify-payment`,
    STATUS: (id: string) => `/orders/${id}/status`,
    INVOICE: (id: string) => `/orders/${id}/invoice`,
  },
  COURIER: {
    BOOK: (orderId: string) => `/courier/book/${orderId}`,
    FRAUD_CHECK: (phone: string) => `/courier/fraud-check/${phone}`,
    TRACK: (orderId: string) => `/courier/track/${orderId}`,
  },
  PRODUCTS: {
    LIST: "/products",
    CREATE: "/products",
    UPDATE: (id: string) => `/products/${id}`,
    RESTOCK: (id: string) => `/products/${id}/restock`,
    LOW_STOCK: "/products/low-stock",
  },
  KNOWLEDGE: {
    LIST: "/knowledge",
    CREATE: "/knowledge",
    UPDATE: (id: string) => `/knowledge/${id}`,
    DELETE: (id: string) => `/knowledge/${id}`,
    SEARCH: "/knowledge/search",
  },
  CHAT: {
    CONVERSATIONS: "/chat/conversations",
    MESSAGES: (id: string) => `/chat/conversations/${id}/messages`,
    TAKEOVER: (id: string) => `/chat/conversations/${id}/takeover`,
    RESUME_AI: (id: string) => `/chat/conversations/${id}/resume-ai`,
    REPLY: (id: string) => `/chat/conversations/${id}/reply`,
  },
  ANALYTICS: {
    OVERVIEW: (timeframe?: string) =>
      `/analytics/overview${timeframe ? `?timeframe=${timeframe}` : ""}`,
    DLQ: "/analytics/dlq",
    DLQ_RETRY: (jobId: string) => `/analytics/dlq/retry/${jobId}`,
    DLQ_RETRY_ALL: "/analytics/dlq/retry-all",
    DLQ_CLEAN: "/analytics/dlq/clean",
    ABANDONED_CARTS: "/analytics/abandoned-carts",
    ABANDONED_TRIGGER: "/analytics/abandoned-carts/trigger",
  },
} as const;

