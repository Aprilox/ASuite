import type { User, Link, LinkClick, AuditLog, Session, Account } from '@prisma/client';

// Re-export Prisma types
export type { User, Link, LinkClick, AuditLog, Session, Account };

// Custom types
export type UserRole = 'admin' | 'user' | 'guest';

export interface CreateLinkInput {
  originalUrl: string;
  shortCode?: string;
  title?: string;
  password?: string;
  expiresAt?: Date;
  maxClicks?: number;
  userId?: string;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  title?: string;
  password?: string | null;
  expiresAt?: Date | null;
  maxClicks?: number | null;
}

export interface LinkWithStats extends Link {
  clicks: LinkClick[];
}

export interface LinkAnalytics {
  totalClicks: number;
  clicksByDay: { date: string; count: number }[];
  clicksByCountry: { country: string; count: number }[];
  clicksByDevice: { device: string; count: number }[];
  clicksByBrowser: { browser: string; count: number }[];
  topReferers: { referer: string; count: number }[];
}

export interface AuditLogInput {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

