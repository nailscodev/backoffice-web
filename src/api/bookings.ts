import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

export interface BookingListItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  staffName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentMethod?: string;
  totalAmount: number;
  web: boolean;
  notes?: string;
  createdAt: Date;
}

export interface BookingListResponse {
  success: boolean;
  data: BookingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Get bookings list with full details
 */
export const getBookingsList = async (filters?: BookingFilters): Promise<BookingListResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.search) params.append('search', filters.search);

  const queryString = params.toString();
  const endpoint = queryString ? `${url.GET_BOOKINGS_LIST}?${queryString}` : url.GET_BOOKINGS_LIST;
  
  const response = await api.get(endpoint);
  return response.data || response;
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string) => {
  const response = await api.get(`${url.GET_BOOKINGS}/${id}`);
  return response.data || response;
};

/**
 * Create a new booking
 */
export const createBooking = async (booking: any) => {
  const response = await api.create(url.ADD_NEW_BOOKING, booking);
  return response.data || response;
};

/**
 * Update a booking
 */
export const updateBooking = async (id: string, booking: any) => {
  const response = await api.update(`${url.UPDATE_BOOKING}/${id}`, booking);
  return response.data || response;
};

/**
 * Delete a booking
 */
export const deleteBooking = async (id: string) => {
  const response = await api.delete(`${url.DELETE_BOOKING}/${id}`);
  return response.data || response;
};

/**
 * Get available time slots for backoffice (optimized endpoint)
 */
export const getBackofficeAvailability = async (
  services: Array<{
    serviceId: string;
    duration: number;
    bufferTime: number;
    staffId?: string;
    addons?: Array<{ id: string; duration: number }>;
  }>,
  removals: Array<{ id: string; duration: number }>,
  date: string,
  isVIPCombo: boolean,
  timezoneOffset?: number
) => {
  const response = await api.create(`${url.GET_BOOKINGS}/backoffice-availability`, {
    services,
    removals,
    date,
    isVIPCombo,
    timezoneOffset, // Send timezone offset so backend can convert to UTC
  });
  return response.data || response;
};

/**
 * Get available time slots for multiple services (legacy)
 * @deprecated Use getBackofficeAvailability instead
 */
export const getMultiServiceSlots = async (
  servicesWithAddons: Array<{
    id: string;
    duration: number;
    bufferTime: number;
    addons: Array<{ id: string; duration: number }>;
  }>,
  date: string,
  selectedTechnicianId?: string
) => {
  const response = await api.create(`${url.GET_BOOKINGS}/multi-service-slots`, {
    servicesWithAddons,
    date,
    selectedTechnicianId,
  });
  return response.data || response;
};
