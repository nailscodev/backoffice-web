import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Include Both Helper File with needed methods
import {
  getProducts as getProductsApi,
  deleteProducts as deleteProductsApi,
  getOrders as getOrdersApi,
  getSellers as getSellersApi,
  getCustomers as getCustomersApi,
  updateOrder as updateOrderApi,
  deleteOrder as deleteOrderApi,
  addNewOrder as addNewOrderApi,
  addNewCustomer as addNewCustomerApi,
  updateCustomer as updateCustomerApi,
  deleteCustomer as deleteCustomerApi,
  addNewProduct as addNewProductApi,
  updateProduct as updateProductApi
} from "../../helpers/fakebackend_helper";

// Import bookings API
import { 
  getBookingsList, 
  createBooking, 
  updateBooking as updateBookingApi, 
  deleteBooking as deleteBookingApi,
  BookingFilters 
} from "../../api/bookings";

export const getProducts = createAsyncThunk("ecommerce/getProducts", async () => {
  try {
    const response = getProductsApi();
    return response;
  } catch (error) {
    return error;
  }
});

export const getOrders = createAsyncThunk("ecommerce/getOrders", async (filters?: BookingFilters) => {
  try {
    const response = await getBookingsList(filters);
    // Transform backend bookings to frontend order format
    const orders = response.data.map((booking: any) => ({
      id: booking.id,
      orderId: booking.id.substring(0, 8).toUpperCase(), // Use first 8 chars of UUID
      customer: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      product: booking.serviceName,
      staffName: booking.staffName,
      orderDate: booking.appointmentDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: `$${booking.totalPrice.toFixed(2)}`,
      payment: booking.paymentMethod === 'CASH' ? 'Cash' : booking.paymentMethod === 'CARD' ? 'Bank' : 'Pending',
      status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase(),
      web: booking.web,
      notes: booking.notes,
      createdAt: booking.createdAt
    }));
    return {
      orders,
      pagination: response.pagination
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
});

export const getSellers = createAsyncThunk("ecommerce/getSellers", async () => {
  try {
    const response = getSellersApi();
    return response;
  } catch (error) {
    return error;
  }
});

export const getCustomers = createAsyncThunk("ecommerce/getCustomers", async () => {
  try {
    const response = getCustomersApi();
    return response;
  } catch (error) {
    return error;
  }
});

export const deleteProducts = createAsyncThunk("ecommerce/deleteProducts", async (product:any) => {
  try {
    const response = deleteProductsApi(product);
    toast.success("Product Delete Successfully", { autoClose: 3000 });
    return { product, ...response };
  } catch (error) {
    toast.error("Product Delete Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateOrder = createAsyncThunk("ecommerce/updateOrder", async (order:any) => {
  try {
    // Use real backend API for booking update
    const { id, ...updateFields } = order;
    const response = await updateBookingApi(id, updateFields);
    toast.success("Reservation Updated Successfully", { autoClose: 3000 });
    return response;
  } catch (error) {
    toast.error("Reservation Update Failed", { autoClose: 3000 });
    throw error;
  }
});

export const addNewProduct = createAsyncThunk("ecommerce/addNewProduct", async (product:any) => {
  try {
    const response = addNewProductApi(product);
    const data = await response;
    toast.success("Product Added Successfully", { autoClose: 3000 });
    return data;
  } catch (error) {
    toast.error("Product Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateProduct = createAsyncThunk("ecommerce/updateProduct", async (product:any) => {
  try {
    const response = updateProductApi(product);
    const data = await response;
    toast.success("Product Updateded Successfully", { autoClose: 3000 });
    return data;
  }
  catch (error) {
    toast.error("Product Updateded Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteOrder = createAsyncThunk("ecommerce/deleteOrder", async (orderId: string) => {
  try {
    await deleteBookingApi(orderId);
    toast.success("Reservation Deleted Successfully", { autoClose: 3000 });
    return orderId;
  } catch (error) {
    toast.error("Reservation Delete Failed", { autoClose: 3000 });
    throw error;
  }
});

export const addNewOrder = createAsyncThunk("ecommerce/addNewOrder", async (order:any) => {
  try {
    // For now, keep using mock until we integrate full booking creation
    const response = addNewOrderApi(order);
    const data = await response;
    toast.success("Reservation Added Successfully", { autoClose: 3000 });
    return data;
  } catch (error) {
    toast.error("Reservation Add Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateCustomer = createAsyncThunk("ecommerce/updateCustomer", async (customer:any) => {
  try {
    const response = updateCustomerApi(customer);
    const data = await response;
    toast.success("Customer Updateded Successfully", { autoClose: 3000 });
    return data;
  } catch (error) {
    toast.error("Customer Updateded Failed", { autoClose: 3000 });
    return error;
  }
});

export const deleteCustomer = createAsyncThunk("ecommerce/deleteCustomer", async (customer:any) => {
  try {
    const response = deleteCustomerApi(customer);
    toast.success("Customer Deleted Successfully", { autoClose: 3000 });
    return { customer, ...response }
  } catch (error) {
    toast.error("Customer Deleted Failed", { autoClose: 3000 });
    return error;
  }
});

export const addNewCustomer = createAsyncThunk("ecommerce/addNewCustomer", async (customer:any) => {
  try {
    const response = addNewCustomerApi(customer);
    const data = await response;
    toast.success("Customer Added Successfully", { autoClose: 3000 });
    return data;
  } catch (error) {
    toast.error("Customer Added Failed", { autoClose: 3000 });
    return error;
  }
});