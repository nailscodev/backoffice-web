import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  birthDate?: string;
}

/**
 * Get all customers
 */
export const getCustomers = async (): Promise<any> => {
  const response = await api.get(url.CUSTOMERS, null);
  return response;
};

/**
 * Get customer by ID
 */
export const getCustomer = async (id: string): Promise<any> => {
  const response = await api.get(`${url.CUSTOMERS}/${id}`, null);
  return response;
};

/**
 * Create new customer
 */
export const createCustomer = async (data: CreateCustomerDto): Promise<any> => {
  const response = await api.create(url.CUSTOMERS, data);
  return response;
};

/**
 * Update customer
 */
export const updateCustomer = async (id: string, data: UpdateCustomerDto): Promise<any> => {
  const response = await api.update(`${url.CUSTOMERS}/${id}`, data);
  return response;
};

/**
 * Delete customer
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`${url.CUSTOMERS}/${id}`);
};

/**
 * Search customers
 */
export const searchCustomers = async (query: string): Promise<any> => {
  const response = await api.get(`${url.CUSTOMERS}/search?query=${encodeURIComponent(query)}`, null);
  return response;
};
