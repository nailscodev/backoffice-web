import { createAsyncThunk } from "@reduxjs/toolkit";

//Include Both Helper File with needed methods
import {
  addNewEvent as addNewEventApi,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
  getUpCommingEvent as getUpCommingEventApi
} from "../../helpers/fakebackend_helper";

// Import real API services
import { getCategories as getCategoriesApi } from "../../api/categories";
import { getBookingsList } from "../../api/bookings";

export const getEvents = createAsyncThunk("calendar/getEvents", async (dateRange: { startDate?: string; endDate?: string } | undefined, { getState }) => {
  try {
    // Obtener las categorías del estado para asignar colores
    const state: any = getState();
    const categories = state.Calendar.categories || [];
    
    // Obtener bookings del rango de fechas visible
    const response = await getBookingsList({
      page: 1,
      limit: 1000,
      status: undefined,
      search: undefined,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate
    });
    
    // Transformar los bookings al formato de FullCalendar
    const events = response.data.map((booking: any) => {
      // Combinar fecha y hora de inicio
      const startDateTime = new Date(`${booking.appointmentDate}T${booking.startTime}`);
      // Combinar fecha y hora de fin
      const endDateTime = new Date(`${booking.appointmentDate}T${booking.endTime}`);
      
      // Buscar la categoría correspondiente para obtener sus colores
      const category = categories.find((cat: any) => cat.id === booking.categoryId);
      
      // Usar los colores de la categoría si existe, sino usar colores por defecto según el estado
      let backgroundColor = '#e9d5ff';
      let borderColor = '#6b21a8';
      let textColor = '#6b21a8';
      
      if (category) {
        backgroundColor = category.bg || '#e9d5ff';
        textColor = category.text || '#6b21a8';
        borderColor = category.text || '#6b21a8';
      } else {
        // Fallback: colores por estado si no hay categoría
        if (booking.status === 'CONFIRMED') {
          backgroundColor = '#d1fae5';
          textColor = '#065f46';
          borderColor = '#065f46';
        } else if (booking.status === 'PENDING') {
          backgroundColor = '#fef3c7';
          textColor = '#92400e';
          borderColor = '#92400e';
        } else if (booking.status === 'CANCELLED') {
          backgroundColor = '#fee2e2';
          textColor = '#991b1b';
          borderColor = '#991b1b';
        } else if (booking.status === 'COMPLETED') {
          backgroundColor = '#cffafe';
          textColor = '#155e75';
          borderColor = '#155e75';
        }
      }
      
      return {
        id: booking.id,
        title: booking.customerName,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: textColor,
        location: booking.customerEmail,
        description: booking.notes || '',
        email: booking.customerEmail,
        service: booking.serviceName,
        staff: booking.staffName,
        extendedProps: {
          location: booking.customerEmail,
          description: booking.notes || '',
          email: booking.customerEmail,
          service: booking.serviceName,
          staff: booking.staffName,
          status: booking.status,
          paymentMethod: booking.paymentMethod,
          totalAmount: booking.totalAmount,
          categoryId: booking.categoryId,
          categoryName: booking.categoryName
        }
      };
    });
    
    return events;
  } catch (error) {
    console.error('Error loading calendar events:', error);
    throw error;
  }
});

export const addNewEvent = createAsyncThunk("calendar/addNewEvent", async (event: any) => {
  try {
    const response = addNewEventApi(event);
    return response;
  } catch (error) {
    return error;
  }
});

export const updateEvent = createAsyncThunk("calendar/updateEvent", async (event: any) => {
  try {
    const response = updateEventApi(event);
    const modifiedevent = await response;
    return modifiedevent;
  } catch (error) {
    return error;
  }
});

export const deleteEvent = createAsyncThunk("calendar/deleteEvent", async (event: any) => {
  try {
    const response = deleteEventApi(event);
    return response;
  } catch (error) {
    return error;
  }
});

export const getCategories = createAsyncThunk("calendar/getCategories", async () => {
  try {
    // Obtener el idioma actual del localStorage o usar 'en' por defecto
    const currentLang = localStorage.getItem('I18N_LANGUAGE') || 'en';
    const response = await getCategoriesApi(currentLang.toUpperCase());
    
    // Transformar las categorías al formato que espera el calendario
    const categories = response.map((category: any, index: number) => {
      // Asignar colores alternados tipo pastel
      const colors = [
        { type: 'primary', bg: '#e9d5ff', text: '#6b21a8' },
        { type: 'success', bg: '#d1fae5', text: '#065f46' },
        { type: 'info', bg: '#cffafe', text: '#155e75' },
        { type: 'warning', bg: '#fef3c7', text: '#92400e' },
        { type: 'danger', bg: '#fee2e2', text: '#991b1b' },
        { type: 'dark', bg: '#fce7f3', text: '#9f1239' }
      ];
      
      const colorIndex = index % colors.length;
      const color = colors[colorIndex];
      
      return {
        id: category.id,
        title: category.name,
        type: color.type,
        bg: color.bg,
        text: color.text
      };
    });
    
    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    throw error;
  }
})

export const getUpCommingEvent = createAsyncThunk("calendar/getUpCommingEvent", async (_, { getState }) => {
  try {
    // Obtener las próximas reservas desde hoy en adelante
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    // Obtener reservas para los próximos 30 días
    const endDateObj = new Date(today);
    endDateObj.setDate(endDateObj.getDate() + 30);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    const response = await getBookingsList({
      startDate,
      endDate,
      limit: 50 // Limitar a 50 próximas reservas
    });
    
    // Obtener categorías del estado para asignar colores
    const state: any = getState();
    const categories = state.Calendar.categories || [];
    
    // Transformar las reservas al formato del calendario
    const upcomingEvents = response.data.map((booking: any) => {
      // Buscar la categoría correspondiente
      const category = categories.find((cat: any) => cat.id === booking.categoryId);
      
      // Determinar colores
      let backgroundColor, borderColor, textColor;
      if (category) {
        backgroundColor = category.bg;
        borderColor = category.text;
        textColor = category.text;
      } else {
        // Colores por defecto basados en estado
        const statusColors: any = {
          PENDING: { bg: '#fef3c7', border: '#92400e', text: '#92400e' },
          CONFIRMED: { bg: '#d1fae5', border: '#065f46', text: '#065f46' },
          CANCELLED: { bg: '#fee2e2', border: '#991b1b', text: '#991b1b' },
          COMPLETED: { bg: '#e9d5ff', border: '#6b21a8', text: '#6b21a8' }
        };
        const colors = statusColors[booking.status] || statusColors.PENDING;
        backgroundColor = colors.bg;
        borderColor = colors.border;
        textColor = colors.text;
      }
      
      return {
        id: booking.id,
        title: booking.customerName,
        start: booking.startTime,
        end: booking.endTime,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
          location: booking.customerPhone,
          description: booking.notes || '',
          email: booking.customerEmail || '',
          service: booking.serviceName,
          staff: booking.staffName,
          status: booking.status
        }
      };
    });
    
    // Ordenar por fecha de inicio (más próximas primero)
    upcomingEvents.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return upcomingEvents;
  } catch (error) {
    console.error('Error loading upcoming events:', error);
    throw error;
  }
})

export const resetCalendar = createAsyncThunk("calendar/resetCalendar", async () => {
  try {
    const response = '';
    return response;
  } catch (error) {
    return error;
  }
})