export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'AGENT' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ImportedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  sheetCount: number;
  status: string;
  createdAt: string;
  sheets?: Sheet[];
}

export interface Sheet {
  id: string;
  fileId: string;
  name: string;
  tableName: string;
  rowCount: number;
  columnCount: number;
  columns?: Column[];
}

export interface Column {
  id: string;
  sheetId: string;
  name: string;
  originalName: string;
  dataType: string;
  position: number;
  isNullable: boolean;
  isPrimary: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sheet?: Sheet;
}

export interface DataRow {
  [key: string]: unknown;
}

export interface DashboardStats {
  fileCount: number;
  sheetCount: number;
  totalRecords: number;
  userCount: number;
}

export interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

export interface MapFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
}

export interface MapData {
  type: 'FeatureCollection';
  features: MapFeature[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ip?: string;
  createdAt: string;
  user?: { email: string; firstName: string; lastName: string };
}

export interface Report {
  id: string;
  name: string;
  type: string;
  config: any;
  schedule?: string;
  lastRunAt?: string;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  config: any;
  isDefault: boolean;
  createdAt: string;
}

export type Language = 'fr' | 'en' | 'ar';
