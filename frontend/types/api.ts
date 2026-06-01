// Centralized API/DTO types used across frontend.

export type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  actionType: string;
  createdAt: string;
};

export type ApiErrorPayload = {
  message?: string;
  error?: unknown;
  errors?: unknown;
};

