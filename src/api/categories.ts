import { APIClient } from "../helpers/api_helper";
import * as url from "../helpers/url_helper";

const api = new APIClient();

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl?: string;
  titleEn?: string;
  titleEs?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTranslation {
  id: string;
  categoryId: string;
  languageId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all active categories
 * @param lang Optional language code (EN, ES, etc.) for translations
 */
export const getCategories = async (lang?: string): Promise<any> => {
  const queryParams = lang ? `?lang=${lang}` : '';
  const response = await api.get(`${url.CATEGORIES}${queryParams}`, null);
  return response;
};

/**
 * Get a specific category by ID
 * @param id Category UUID
 * @param lang Optional language code for translations
 */
export const getCategory = async (id: string, lang?: string): Promise<any> => {
  const queryParams = lang ? `?lang=${lang}` : '';
  const response = await api.get(`${url.CATEGORIES}/${id}${queryParams}`, null);
  return response;
};

/**
 * Create a new category
 */
export const createCategory = async (data: {
  name: string;
  displayOrder: number;
  imageUrl?: string;
  titleEn?: string;
  titleEs?: string;
  descriptionEn?: string;
  descriptionEs?: string;
}): Promise<any> => {
  const response = await api.create(url.CATEGORIES, data);
  return response;
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    displayOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
    titleEn?: string;
    titleEs?: string;
    descriptionEn?: string;
    descriptionEs?: string;
  }
): Promise<any> => {
  const response = await api.update(`${url.CATEGORIES}/${id}`, data);
  return response;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<any> => {
  const response = await api.delete(`${url.CATEGORIES}/${id}`);
  return response;
};
