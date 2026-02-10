import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  additionalTime?: number;
  isActive: boolean;
  removal?: boolean;
  displayOrder: number;
  compatibleServiceIds?: string[] | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Translation fields (for edit form)
  titleEN?: string;
  titleES?: string;
  descriptionEN?: string;
  descriptionES?: string;
  // Services from service_addons table (many-to-many)
  services?: Array<{ 
    id: string; 
    name: string;
    ServiceAddon?: {
      id: string;
      service_id: string;
      addon_id: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}

export interface PaginatedAddOnsResponse {
  data: AddOn[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Get all add-ons with pagination and filters
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10)
 * @param isActive Filter by active status
 * @param serviceId Filter by compatible service ID
 * @param search Search in name and description
 * @param lang Language code (EN or ES)
 */
export const getAddOns = async (
  page: number = 1,
  limit: number = 100,
  isActive?: boolean,
  serviceId?: string,
  search?: string,
  lang?: string
): Promise<AddOn[]> => {
  const params: any = {
    page,
    limit,
  };

  if (isActive !== undefined) {
    params.isActive = isActive;
  }

  if (serviceId) {
    params.serviceId = serviceId;
  }

  if (search) {
    params.search = search;
  }

  if (lang) {
    params.lang = lang;
  }

  const response = await api.get(url.ADDONS, params);
  // Handle nested data structure from backend
  return response.data?.data || response.data || [];
};

/**
 * Get a specific add-on by ID
 */
export const getAddOn = async (id: string, lang?: string): Promise<AddOn> => {
  const params: any = {};
  if (lang) {
    params.lang = lang;
  }

  const response = await api.get(`${url.ADDONS}/${id}`, params);
  return response.data?.data || response.data;
};

/**
 * Get add-ons compatible with a specific service
 */
export const getCompatibleAddOns = async (
  serviceId: string,
  lang?: string
): Promise<AddOn[]> => {
  const params: any = {};
  if (lang) {
    params.lang = lang;
  }

  const response = await api.get(`${url.ADDONS}/compatible/${serviceId}`, params);
  return response.data?.data || response.data || [];
};

/**
 * Create a new add-on
 */
export const createAddOn = async (data: {
  name: string;
  description?: string;
  price: number;
  additionalTime?: number;
  isActive?: boolean;
  displayOrder?: number;
  compatibleServiceIds?: string[];
  imageUrl?: string;
}): Promise<AddOn> => {
  const response = await api.create(url.ADDONS, data);
  return response.data?.data || response.data;
};

/**
 * Update an existing add-on
 */
export const updateAddOn = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    additionalTime?: number;
    isActive?: boolean;
    displayOrder?: number;
    compatibleServiceIds?: string[];
    imageUrl?: string;
  }
): Promise<AddOn> => {
  const response = await api.update(`${url.ADDONS}/${id}`, data);
  return response.data?.data || response.data;
};

/**
 * Delete an add-on
 */
export const deleteAddOn = async (id: string): Promise<any> => {
  const response = await api.delete(`${url.ADDONS}/${id}`);
  return response;
};

/**
 * Activate an add-on
 */
export const activateAddOn = async (id: string): Promise<AddOn> => {
  const response = await api.update(`${url.ADDONS}/${id}/activate`, {});
  return response.data?.data || response.data;
};

/**
 * Deactivate an add-on
 */
export const deactivateAddOn = async (id: string): Promise<AddOn> => {
  const response = await api.update(`${url.ADDONS}/${id}/deactivate`, {});
  return response.data?.data || response.data;
};

/**
 * Get incompatible add-ons for given add-on IDs
 */
export const getIncompatibleAddOns = async (
  addonIds: string[]
): Promise<string[]> => {
  const idsString = addonIds.join(',');
  const response = await api.get(`${url.ADDONS}/incompatibilities/${idsString}`);
  return response.data?.data || response.data || [];
};
