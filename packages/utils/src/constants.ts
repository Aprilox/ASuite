// ASuite Constants

export const APP_NAME = 'ASuite';
export const APP_VERSION = '1.0.0';

// Services
export const SERVICES = {
  ALINKS: {
    name: 'ALinks',
    description: 'Raccourcisseur de liens et QR codes',
    path: '/alinks',
    color: '#3B82F6', // blue-500
  },
  AVAULT: {
    name: 'AVault',
    description: 'Partage de notes chiffrées',
    path: '/avault',
    color: '#8B5CF6', // violet-500
  },
  ATRANSFER: {
    name: 'ATransfer',
    description: 'Transfert de fichiers',
    path: '/atransfer',
    color: '#10B981', // emerald-500
  },
  ACALENDAR: {
    name: 'ACalendar',
    description: 'Gestion d\'agenda',
    path: '/acalendar',
    color: '#F59E0B', // amber-500
  },
  AMAIL: {
    name: 'AMail',
    description: 'Messagerie sécurisée',
    path: '/amail',
    color: '#EF4444', // red-500
  },
  ADRIVE: {
    name: 'ADrive',
    description: 'Stockage cloud',
    path: '/adrive',
    color: '#06B6D4', // cyan-500
  },
  AMEET: {
    name: 'AMeet',
    description: 'Visioconférence',
    path: '/ameet',
    color: '#EC4899', // pink-500
  },
  ADOCS: {
    name: 'ADocs',
    description: 'Traitement de texte',
    path: '/adocs',
    color: '#6366F1', // indigo-500
  },
  ASHEETS: {
    name: 'ASheets',
    description: 'Tableur en ligne',
    path: '/asheets',
    color: '#22C55E', // green-500
  },
  ASLIDES: {
    name: 'ASlides',
    description: 'Présentations',
    path: '/aslides',
    color: '#F97316', // orange-500
  },
} as const;

// Limites
export const LIMITS = {
  FREE: {
    LINKS_PER_MONTH: 50,
    LINK_EXPIRY_DAYS: 30,
    QR_DOWNLOADS: 10,
    STORAGE_GB: 5,
  },
  PRO: {
    LINKS_PER_MONTH: -1, // illimité
    LINK_EXPIRY_DAYS: -1, // pas d'expiration forcée
    QR_DOWNLOADS: -1,
    STORAGE_GB: 100,
  },
  ENTERPRISE: {
    LINKS_PER_MONTH: -1,
    LINK_EXPIRY_DAYS: -1,
    QR_DOWNLOADS: -1,
    STORAGE_GB: -1, // illimité
  },
} as const;

// Regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SHORT_CODE: /^[a-zA-Z0-9_-]{3,50}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

