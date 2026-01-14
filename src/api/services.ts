import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  duration: number;
  bufferTime: number;
  isActive: boolean;
  isPopular: boolean;
  requirements?: string[];
  compatibleAddOns?: string[];
  displayOrder: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  categoryRelation?: {
    id: string;
    name: string;
    displayOrder: number;
  };
}

export interface ServiceTranslation {
  id: string;
  serviceId: string;
  languageId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedServicesResponse {
  data: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get all services with pagination and filters
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10)
 * @param search Search term for service name
 * @param category Filter by category ID
 * @param isActive Filter by active status
 * @param lang Optional language code (EN, ES, etc.) for translations
 */
export const getServices = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string,
  isActive?: boolean,
  lang?: string
): Promise<Service[]> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (isActive !== undefined) params.append('is_active', isActive.toString());
  if (lang) params.append('lang', lang);

  const response = await api.get(`${url.SERVICES}?${params.toString()}`, null);
  // Backend returns {data: [...], total, page, limit, totalPages}
  // We return the data array directly for simplicity
  return response.data?.data || response.data || [];
};

/**
 * Get all active services as a simple array
 * @param category Optional filter by category ID
 * @param lang Optional language code for translations
 */
export const getServicesList = async (category?: string, lang?: string): Promise<Service[]> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (lang) params.append('lang', lang);

  const queryString = params.toString();
  const response = await api.get(
    `${url.SERVICES}/list${queryString ? `?${queryString}` : ''}`,
    null
  );
  return response.data;
};

/**
 * Get a specific service by ID
 * @param id Service UUID
 * @param lang Optional language code for translations
 */
export const getService = async (id: string, lang?: string): Promise<Service> => {
  const queryParams = lang ? `?lang=${lang}` : '';
  const response = await api.get(`${url.SERVICES}/${id}${queryParams}`, null);
  return response.data;
};

/**
 * Create a new service
 */
export const createService = async (data: {
  name: string;
  description?: string;
  titleEN?: string;
  descriptionEN?: string;
  titleES?: string;
  descriptionES?: string;
  categoryId: string;
  price: number;
  duration: number;
  bufferTime?: number;
  isActive?: boolean;
  isPopular?: boolean;
  requirements?: string[];
  compatibleAddOns?: string[];
  displayOrder?: number;
  imageUrl?: string;
  translations?: Array<{
    languageCode: string;
    title: string;
    description: string;
  }>;
}): Promise<Service> => {
  const response = await api.create(url.SERVICES, data);
  return response.data;
};

/**
 * Update an existing service
 */
export const updateService = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    titleEN?: string;
    descriptionEN?: string;
    titleES?: string;
    descriptionES?: string;
    categoryId?: string;
    price?: number;
    duration?: number;
    bufferTime?: number;
    isActive?: boolean;
    isPopular?: boolean;
    requirements?: string[];
    compatibleAddOns?: string[];
    displayOrder?: number;
    imageUrl?: string;
    translations?: Array<{
      languageCode: string;
      title: string;
      description: string;
    }>;
  }
): Promise<Service> => {
  const response = await api.update(`${url.SERVICES}/${id}`, data);
  return response.data;
};

/**
 * Delete (deactivate) a service
 */
export const deleteService = async (id: string): Promise<any> => {
  const response = await api.delete(`${url.SERVICES}/${id}`);
  return response.data;
};

/**
 * Get service categories
 */
export const getServiceCategories = async (): Promise<any[]> => {
  const response = await api.get(`${url.SERVICES}/categories/list`, null);
  return response.data;
};

/**
 * Get incompatible categories for given category IDs
 * @param categoryIds Array of category UUIDs
 */
export const getIncompatibleCategories = async (categoryIds: string[]): Promise<string[]> => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }
  const categoryIdsParam = categoryIds.join(',');
  const response = await api.get(`${url.SERVICES}/categories/incompatibilities?categoryIds=${categoryIdsParam}`, null);
  return response.data || [];
};

/**
 * Get removal add-ons for specific services
 * @param serviceIds Array of service UUIDs
 */
export const getRemovalAddonsByServices = async (serviceIds: string[]): Promise<any> => {
  if (!serviceIds || serviceIds.length === 0) {
    return [];
  }
  const serviceIdsParam = serviceIds.join(',');
  const response = await api.get(`${url.SERVICES}/removal-addons/by-services?serviceIds=${serviceIdsParam}`, null);
  return response;
};
