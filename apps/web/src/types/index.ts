export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  theme?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LinkItem {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  maxClicks: number | null;
  hasPassword: boolean;
  qrCode?: string;
}

export interface Tool {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
  status: 'active' | 'coming';
}

