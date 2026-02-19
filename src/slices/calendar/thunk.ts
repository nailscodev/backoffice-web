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

export const getEvents = createAsyncThunk("calendar/getEvents", async (filters: any = {}, { getState }) => {
  try {
    // Obtener las categorías del estado para asignar colores
    const state: any = getState();
    const categories = state.Calendar.categories || [];
    
    // Preparar filtros para la API, usando los parámetros pasados
    const apiFilters = {
      page: filters.page || 1,
      limit: filters.limit || 1000,
      status: filters.status,
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      staffId: filters.staffId,
      serviceId: filters.serviceId
    };
    
    // Obtener bookings del rango de fechas visible con filtros aplicados
    const response = await getBookingsList(apiFilters);
    
    // Transformar los bookings al formato de FullCalendar
    const events = response.data.map((booking: any) => {
      // Combinar fecha y hora de inicio - SIN timezone para interpretar como fecha local
      const start = booking.appointmentDate && booking.startTime ? `${booking.appointmentDate}T${booking.startTime}` : null;
      const end = booking.appointmentDate && booking.endTime ? `${booking.appointmentDate}T${booking.endTime}` : null;
      
      // Buscar la categoría correspondiente para obtener sus colores
      const category = categories.find((cat: any) => cat.id === booking.categoryId);
      
      // Usar colores basados en el estado del booking
      let backgroundColor = '#e9d5ff';
      let borderColor = '#6b21a8';
      let textColor = '#6b21a8';
      
      // Normalizar status a mayúsculas para comparación
      const normalizedStatus = booking.status?.toUpperCase?.() || '';
      
      // Colores por estado siempre tienen prioridad
      if (normalizedStatus === 'CONFIRMED') {
        backgroundColor = '#d1fae5';
        textColor = '#065f46';
        borderColor = '#065f46';
      } else if (normalizedStatus === 'PENDING') {
        backgroundColor = '#fef3c7'; // Amarillo
        textColor = '#92400e';
        borderColor = '#92400e';
      } else if (normalizedStatus === 'CANCELLED') {
        backgroundColor = '#fee2e2'; // Rojo
        textColor = '#991b1b';
        borderColor = '#991b1b';
      } else if (normalizedStatus === 'COMPLETED') {
        backgroundColor = '#dcfce7'; // Verde
        textColor = '#166534';
        borderColor = '#166534';
      } else if (normalizedStatus === 'IN_PROGRESS') {
        backgroundColor = '#e9d5ff'; // Violeta
        textColor = '#6b21a8';
        borderColor = '#6b21a8';
      }
      
      return {
        id: booking.id,
        title: booking.customerName,
          start,
          end,
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
          totalPrice: booking.totalPrice,
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
      
      // Siempre usar colores basados en el estado del booking
      const statusColors: any = {
        PENDING: { bg: '#fef3c7', border: '#92400e', text: '#92400e' }, // Amarillo
        CONFIRMED: { bg: '#d1fae5', border: '#065f46', text: '#065f46' }, // Verde claro
        CANCELLED: { bg: '#fee2e2', border: '#991b1b', text: '#991b1b' }, // Rojo
        COMPLETED: { bg: '#dcfce7', border: '#166534', text: '#166534' }, // Verde
        IN_PROGRESS: { bg: '#e9d5ff', border: '#6b21a8', text: '#6b21a8' } // Violeta
      };
      const colors = statusColors[booking.status?.toUpperCase?.()] || statusColors.PENDING;
      backgroundColor = colors.bg;
      borderColor = colors.border;
      textColor = colors.text;
      // Combinar fecha y hora para obtener un string ISO válido en UTC
      let start = booking.appointmentDate && booking.startTime ? `${booking.appointmentDate}T${booking.startTime}Z` : null;
      let end = booking.appointmentDate && booking.endTime ? `${booking.appointmentDate}T${booking.endTime}Z` : null;
      return {
        id: booking.id,
        title: booking.customerName,
        start,
        end,
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