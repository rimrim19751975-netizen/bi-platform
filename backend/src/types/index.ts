import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ImportResult {
  fileId: string;
  sheets: { name: string; tableName: string; rowCount: number; columns: { name: string; type: string }[] }[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
}

export interface DataRow {
  [key: string]: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapData {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: string; coordinates: number[] };
    properties: Record<string, unknown>;
  }[];
}
