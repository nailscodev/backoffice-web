import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

// Enums matching backend
export enum StaffRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  RECEPTIONIST = 'RECEPTIONIST',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_VACATION = 'ON_VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
}

// Interfaces matching backend DTOs
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  status: StaffStatus;
  isActive: boolean;
  isAvailable: boolean;
  specialties?: string[];
  workingDays?: string[];
  commissionPercentage?: number;
  hourlyRate?: number;
  hireDate?: string;
  terminationDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  servicesCount?: number;
  pendingBookingsCount?: number;
  completedBookingsCount?: number;
  services?: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
}

export interface PaginatedStaffResponse {
  data: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffStatistics {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  byRole: {
    owner: number;
    manager: number;
    technician: number;
    receptionist: number;
  };
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  status?: StaffStatus;
  isActive?: boolean;
  isAvailable?: boolean;
  specialties?: string[];
  workingDays?: string[];
  commissionPercentage?: number;
  hourlyRate?: number;
  hireDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  avatarUrl?: string;
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {
  terminationDate?: string;
}

/**
 * Get all staff members with pagination and filters
 */
export const getStaff = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: StaffRole,
  status?: StaffStatus,
  isActive?: boolean
): Promise<PaginatedStaffResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (search) params.append('search', search);
  if (role) params.append('role', role);
  if (status) params.append('status', status);
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  const response = await api.get(`${url.STAFF}?${params.toString()}`, null);
  return response.data;
};

/**
 * Get available staff members (active and available for bookings)
 */
export const getAvailableStaff = async (serviceIds?: string[]): Promise<Staff[]> => {
  const params = new URLSearchParams();
  if (serviceIds && serviceIds.length > 0) {
    params.append('serviceIds', serviceIds.join(','));
  }

  const queryString = params.toString();
  const response = await api.get(
    `${url.STAFF}/available${queryString ? `?${queryString}` : ''}`,
    null
  );
  return response.data;
};

/**
 * Get all staff members as a simple list (no pagination)
 * Useful for dropdowns and selects
 */
export const getStaffList = async (): Promise<Staff[]> => {
  const response = await api.get(`${url.STAFF}?page=1&limit=100&isActive=true`, null);
  return response.data?.data || response.data || [];
};

/**
 * Get a specific staff member by ID
 */
export const getStaffById = async (id: string): Promise<Staff> => {
  const response = await api.get(`${url.STAFF}/${id}`, null);
  return response.data;
};

/**
 * Get staff statistics
 */
export const getStaffStatistics = async (): Promise<StaffStatistics> => {
  const response = await api.get(`${url.STAFF}/statistics`, null);
  return response.data;
};

/**
 * Create a new staff member
 */
export const createStaff = async (data: CreateStaffDto): Promise<Staff> => {
  const response = await api.create(url.STAFF, data);
  return response.data;
};

/**
 * Update an existing staff member
 */
export const updateStaff = async (id: string, data: UpdateStaffDto): Promise<Staff> => {
  const response = await api.update(`${url.STAFF}/${id}`, data);
  return response.data;
};

/**
 * Delete a staff member (soft delete)
 */
export const deleteStaff = async (id: string): Promise<void> => {
  await api.delete(`${url.STAFF}/${id}`);
};

/**
 * Assign services to a staff member
 */
export const assignServicesToStaff = async (
  staffId: string, 
  serviceIds: string[]
): Promise<void> => {
  await api.create(`${url.STAFF}/${staffId}/services`, { serviceIds });
};

/**
 * Remove services from a staff member
 */
export const removeServicesFromStaff = async (
  staffId: string,
  serviceIds: string[]
): Promise<void> => {
  await api.delete(`${url.STAFF}/${staffId}/services`, { data: { serviceIds } });
};

/**
 * Get services assigned to a staff member
 */
export const getStaffServices = async (staffId: string): Promise<any[]> => {
  const response = await api.get(`${url.STAFF}/${staffId}/services`, null);
  return response.data;
};

/**
 * Activate a staff member
 */
export const activateStaff = async (id: string): Promise<Staff> => {
  const response = await api.patch(`${url.STAFF}/${id}/activate`, {});
  return response.data;
};

/**
 * Deactivate a staff member
 */
export const deactivateStaff = async (id: string): Promise<Staff> => {
  const response = await api.patch(`${url.STAFF}/${id}/deactivate`, {});
  return response.data;
};
