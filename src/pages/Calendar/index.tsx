import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import WorkInProgressOverlay from '../../common/WorkInProgressOverlay';

//Import Icons
import FeatherIcon from "feather-icons-react";

import {
  Card,
  CardBody,
  Container,
  Row,
  Col,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  Input,
  Label,
  Button,
  ButtonGroup,
  FormFeedback,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";
import classnames from "classnames";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import BootstrapTheme from "@fullcalendar/bootstrap";
import Flatpickr from "react-flatpickr";

//redux
import { useSelector, useDispatch } from "react-redux";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import ReservationModal from "../../Components/Common/ReservationModal";

//Simple bar
import SimpleBar from "simplebar-react";
import UpcommingEvents from './UpcommingEvents';

import {
  getEvents as onGetEvents,
  getCategories as onGetCategories,
  addNewEvent as onAddNewEvent,
  deleteEvent as onDeleteEvent,
  updateEvent as onUpdateEvent,
  getUpCommingEvent as onGetUpCommingEvent,
} from "../../slices/thunks";
import { createSelector } from "reselect";
import { servicesByCategory, staffMembers } from "../../common/data/calender";
import { getStaffList, Staff } from "../../api/staff";
import { getCategories, Category } from "../../api/categories";
import { updateBooking, getBookingById } from "../../api/bookings";
import { getServicesList, Service, getRemovalAddonsByServices } from "../../api/services";
import { getAddOns, AddOn, getAddOn } from "../../api/addons";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from "moment";
import "moment/locale/es";

// Import FullCalendar locales
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';

const Calender = () => {
  const dispatch: any = useDispatch();
  const { t, i18n } = useTranslation();
  
  // Selector para obtener el usuario actual
  const selectAuthState = (state: any) => state.Login;
  const selectUserData = createSelector(
    selectAuthState,
    (auth) => ({
      user: auth.user
    })
  );
  const { user } = useSelector(selectUserData);
  
  // Get current language and set up date formatting
  const currentLang = i18n.language || 'en';
  const isSpanish = currentLang === 'sp' || currentLang === 'es';
  
  // Date format functions
  const formatShortDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return isSpanish ? `${day}/${month}` : `${month}/${day}`;
  };
  
  // Configure moment locale
  React.useEffect(() => {
    moment.locale(isSpanish ? 'es' : 'en');
    
    // Add global click listener to cleanup tooltips
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicking outside calendar area, clean tooltips
      const calendarElement = document.querySelector('.fc-view-harness');
      if (calendarElement && !calendarElement.contains(e.target as Node)) {
        cleanupTooltips();
      }
    };
    
    // Add global mouse leave listener for calendar container
    const handleCalendarMouseLeave = () => {
      cleanupTooltips();
    };
    
    document.addEventListener('click', handleGlobalClick);
    const calendarContainer = document.querySelector('.fc');
    if (calendarContainer) {
      calendarContainer.addEventListener('mouseleave', handleCalendarMouseLeave);
    }
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      if (calendarContainer) {
        calendarContainer.removeEventListener('mouseleave', handleCalendarMouseLeave);
      }
    };
  }, [isSpanish]);
  const [event, setEvent] = useState<any>({});
  const [modal, setModal] = useState<boolean>(false);
  const [selectedNewDay, setSelectedNewDay] = useState<any>();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isEditButton, setIsEditButton] = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteEvent, setDeleteEvent] = useState<string>('');
  const [eventName, setEventName] = useState<string>("");
  const [preselectedCategory, setPreselectedCategory] = useState<string>("");
  const lastDateRange = useRef<string>("");
  const loadingEvents = useRef<boolean>(false);
  
  // Filter states
  const [activeTab, setActiveTab] = useState("1");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewFilter, setViewFilter] = useState<string>("timeGridWeek");
  
  // Data states for dropdowns
  const [staff, setStaff] = useState<Staff[]>([]);
  const [calendarRef, setCalendarRef] = useState<any>(null);

  // Estados para modal de edición de bookings
  const [editModal, setEditModal] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isEditBooking, setIsEditBooking] = useState<boolean>(false);
  
  // Service editing data
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allAddons, setAllAddons] = useState<AddOn[]>([]);
  const [removalAddons, setRemovalAddons] = useState<AddOn[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<AddOn[]>([]);
  const [selectedRemovalAddons, setSelectedRemovalAddons] = useState<AddOn[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<{[key: string]: Service[]}>({});
  const [showServiceEditor, setShowServiceEditor] = useState(false);

  const selectLayoutState = (state: any) => state.Calendar;
  const calendarDataProperties = createSelector(
    selectLayoutState,
    (state: any) => ({
      events: state.events,
      categories: state.categories,
      upcommingevents: state.upcommingevents,
      isEventUpdated: state.isEventUpdated,
    })
  );
  // Inside your component
  const {
    events, categories, upcommingevents, isEventUpdated
  } = useSelector(calendarDataProperties);

  useEffect(() => {
    // Cargar categorías solo una vez
    dispatch(onGetCategories());
    // Cargar staff y servicios para filtros
    loadStaff();
    
    // Cargar eventos iniciales con filtros por defecto
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const defaultFilters = {
      page: 1,
      limit: 1000,
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0]
    };
    dispatch(onGetEvents(defaultFilters));
  }, [dispatch]);
  
  useEffect(() => {
    // Cargar upcoming events cuando las categorías estén disponibles
    if (categories && categories.length > 0) {
      dispatch(onGetUpCommingEvent());
    }
  }, [dispatch, categories.length]);
  
  // Auto-filtrar por staff si el usuario actual es de rol 'staff'
  useEffect(() => {
    console.log('👤 [STAFF AUTO-FILTER] Checking if user is staff...');
    console.log('👤 [STAFF AUTO-FILTER] User data:', { 
      userExists: !!user, 
      userRole: user?.role, 
      userId: user?.id,
      staffId: user?.staffId,
      currentStaffFilter: staffFilter 
    });
    
    if (user && user.role === 'staff' && (user.staffId || user.id)) {
      const staffIdToUse = user.staffId || user.id;
      console.log('👤 [STAFF AUTO-FILTER] Usuario staff detectado, forzando filtro a su staffId:', staffIdToUse);
      // Para usuarios staff, siempre forzar el filtro a su staff ID
      if (staffFilter !== staffIdToUse) {
        console.log('👤 [STAFF AUTO-FILTER] Updating staffFilter from', staffFilter, 'to', staffIdToUse);
        setStaffFilter(staffIdToUse);
      } else {
        console.log('👤 [STAFF AUTO-FILTER] Staff filter ya está correctamente configurado');
      }
    } else {
      console.log('👤 [STAFF AUTO-FILTER] Usuario no es staff o no tiene ID, manteniendo selección manual');
    }
  }, [user]); // Removed staffFilter from dependencies to prevent infinite loops
  
  // Auto-reload events when filters change (similar to EcommerceOrders)
  useEffect(() => {
    console.log('🔄 [FILTER DEBUG] useEffect triggered');
    console.log('📋 [FILTER DEBUG] Input values:', { 
      staffFilter, 
      statusFilter, 
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id 
    });
    
    const delayReload = setTimeout(() => {
      if (calendarRef) {
        const view = calendarRef.getApi().view;
        const startDate = view.activeStart.toISOString().split('T')[0];
        const endDate = new Date(view.activeEnd.getTime() - 1).toISOString().split('T')[0];
        
        // Determine final staff ID to use
        let finalStaffId = null;
        
        // If user is staff role, always use their staff ID (staff can only see their own bookings)
        if (user && user.role === 'staff') {
          finalStaffId = user.staffId || user.id; // Use staffId if available, fallback to user.id
          console.log('🔒 [FILTER DEBUG] Staff user - using staff ID:', finalStaffId, '(staffId:', user.staffId, ', userId:', user.id, ')');
        } 
        // If user is admin/other role and has selected a staff filter, use that
        else if (staffFilter && staffFilter.trim() !== '') {
          finalStaffId = staffFilter;
          console.log('👔 [FILTER DEBUG] Admin user - using selected staff:', finalStaffId);
        } 
        // Otherwise, no staff filter
        else {
          finalStaffId = null;
          console.log('🌐 [FILTER DEBUG] No staff filter - showing all staff');
        }
        
        // Build final filters object
        const filters: any = {
          page: 1,
          limit: 1000,
          startDate,
          endDate
        };
        
        // Add staff filter if we have one
        if (finalStaffId) {
          filters.staffId = finalStaffId;
        }
        
        // Add status filter if we have one  
        if (statusFilter && statusFilter.trim() !== '') {
          filters.status = statusFilter;
        }
        
        console.log('🚀 [FILTER DEBUG] Final filters being sent to backend:', JSON.stringify(filters, null, 2));
        dispatch(onGetEvents(filters));
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(delayReload);
  }, [staffFilter, statusFilter, user, dispatch]);
  
  useEffect(() => {
    // Inicializar Draggable cuando las categorías estén disponibles
    if (categories && categories.length > 0) {
      // Inicializar Draggable para el contenedor oculto
      const externalEvents = document.getElementById("external-events");
      if (externalEvents) {
        new Draggable(externalEvents, {
          itemSelector: ".external-event",
        });
      }
      
      // Inicializar Draggable para las categorías visibles en la card
      const visibleCategories = document.getElementById("visible-categories");
      if (visibleCategories) {
        new Draggable(visibleCategories, {
          itemSelector: ".external-event",
        });
      }
    }
  }, [categories]);

  // Load data for filters
  const loadStaff = async () => {
    try {
      const staffResponse = await getStaffList();
      setStaff(staffResponse || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  useEffect(() => {
    if (isEventUpdated) {
      setIsEdit(false);
      setEvent({});
    }
  }, [dispatch, isEventUpdated]);

  /**
   * Handling the modal state
   */
  const toggle = () => {
    if (modal) {
      setModal(false);
      setEvent(null);
      setIsEdit(false);
      setIsEditButton(true);
    } else {
      setModal(true);
    }
  };
  /**
   * Handling date click on calendar
   */

  const handleDateClick = (arg: any) => {
    const date = arg["date"];
    const now = new Date();
    
    // Verificar si la fecha/hora ya pasó
    if (date < now) {
      return; // No permitir crear reservas en el pasado
    }
    
    const endDate = new Date(date.getTime() + 30 * 60000); // Añadir 30 minutos
    setSelectedNewDay([date]);
    setPreselectedCategory(""); // Sin categoría preseleccionada al hacer clic en el calendario
    setEvent({
      title: "",
      start: date,
      end: endDate,
      defaultDate: [date],
    });
    toggle();
  };

  const str_dt = function formatDate(date: any) {
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var d = new Date(date),
      month = "" + monthNames[d.getMonth()],
      day = "" + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [day + " " + month, year].join(",");
  };

  /**
   * Handling click on event on calendar
   */
  const handleEventClick = async (arg: any) => {
    // Clean up any existing tooltips first
    cleanupTooltips();
    
    const event = arg.event;
    const bookingId = event.id;
    
    try {
      // 1. Load staff data first
      let staffData: Staff[] = [];
      try {
        const staffResponse = await getStaffList();
        staffData = staffResponse;
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
      
      // 2. Fetch full booking details by ID
      const bookingDetails = await getBookingById(bookingId);
      console.log('📋 Full booking details from API:', bookingDetails);
      
      // 3. Fetch addon details if addOnIds exist
      let addons = [];
      if (bookingDetails.addOnIds && bookingDetails.addOnIds.length > 0) {
        const addonPromises = bookingDetails.addOnIds.map((addonId: string) => 
          getAddOn(addonId).catch(err => {
            console.error(`Error fetching addon ${addonId}:`, err);
            return null;
          })
        );
        
        const addonResults = await Promise.all(addonPromises);
        addons = addonResults.filter(addon => addon !== null);
        console.log('📋 Loaded addons:', addons);
      }
      
      // Extract numeric amount - use totalPrice directly as it's already in correct format
      let numericAmount = 0;
      if (bookingDetails.totalPrice) {
        numericAmount = Number(bookingDetails.totalPrice);
      } else if (bookingDetails.amount) {
        if (typeof bookingDetails.amount === 'string') {
          numericAmount = parseFloat(bookingDetails.amount.replace(/[$,]/g, ''));
        } else if (typeof bookingDetails.amount === 'number') {
          numericAmount = bookingDetails.amount;
        }
      }
      
      // Use times as they come from backend
      const startTime = bookingDetails.startTime || '';
      const endTime = bookingDetails.endTime || '';
      
      // Get staffId from bookingDetails
      const staffId = bookingDetails.staffId || '';
      
      // Find staff name from staffId if available
      let staffName = bookingDetails.staffName || '';
      if (staffId && staffData.length > 0) {
        const matchingStaff = staffData.find(s => s.id === staffId);
        staffName = matchingStaff?.fullName || staffName;
      }
      
      // Find current service if serviceId exists
      let currentService: Service | null = null;
      if (bookingDetails.serviceId && allServices.length > 0) {
        currentService = allServices.find(s => s.id === bookingDetails.serviceId) || null;
        setSelectedService(currentService);
      }
      
      // Set selected addons from booking
      if (addons && addons.length > 0) {
        const normalAddons = addons.filter((addon: any) => !addon.removal);
        const removalAddons = addons.filter((addon: any) => addon.removal);
        setSelectedAddons(normalAddons || []);
        setSelectedRemovalAddons(removalAddons || []);
        console.log('📋 Set normal addons:', normalAddons);
        console.log('📋 Set removal addons:', removalAddons);
      } else {
        setSelectedAddons([]);
        setSelectedRemovalAddons([]);
      }
      
      // Prepare booking object for form
      const booking = {
        id: bookingId,
        orderId: bookingDetails.orderId || `ORD-${bookingId}`,
        customer: bookingDetails.customerName || event.title,
        customerEmail: bookingDetails.email || event.extendedProps.email || '',
        customerPhone: bookingDetails.phone || event.extendedProps.location || '',
        product: bookingDetails.serviceName || event.extendedProps.service || '',
        categoryName: bookingDetails.categoryName || event.extendedProps.category || '',
        staffName: staffName,
        staffId: staffId,
        orderDate: bookingDetails.date ? moment(bookingDetails.date).format('YYYY-MM-DD') : 
                   (event.start ? moment(event.start).format('YYYY-MM-DD') : ''),
        startTime: startTime,
        endTime: endTime,
        ordertime: startTime && endTime ? `${startTime} - ${endTime}` : '',
        amount: numericAmount,
        payment: bookingDetails.paymentMethod || '',
        status: bookingDetails.status?.toLowerCase() || 'pending',
        notes: bookingDetails.notes || event.extendedProps.description || '',
        web: bookingDetails.source === 'web',
        cancellationReason: bookingDetails.cancellationReason || '',
        serviceId: bookingDetails.serviceId || '',
        categoryId: bookingDetails.categoryId || '',
        addons: addons || [],
        removalAddons: addons ? addons.filter((addon: any) => addon.removal) : []
      };
      
      console.log('📋 Booking data prepared for edit modal:', booking);
      console.log('📋 Addons in booking object:', booking.addons);
      console.log('📋 Selected addons state:', selectedAddons);
      console.log('📋 Selected removal addons state:', selectedRemovalAddons);
      
      // Establecer el booking seleccionado
      setSelectedBooking(booking);
      setIsEditBooking(true);
      
      // Cargar datos necesarios para el modal
      await loadModalData();
      
      // Actualizar los valores del formulario después de cargar todos los datos
      editValidation.setValues({
        orderId: booking.orderId,
        customer: booking.customer,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        product: booking.product,
        categoryName: booking.categoryName,
        staffName: booking.staffName,
        staffId: booking.staffId,
        orderDate: booking.orderDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        ordertime: booking.ordertime,
        amount: booking.amount,
        payment: booking.payment,
        status: booking.status,
        notes: booking.notes,
        web: booking.web,
        cancellationReason: booking.cancellationReason,
      });
      
      // Abrir modal de edición
      setEditModal(true);
      
    } catch (error) {
      console.error('Error preparing booking for edit:', error);
      toast.error(t('common.error_loading_data'));
    }
  };
  /**
   * On delete event
   */
  const handleDeleteEvent = () => {
    dispatch(onDeleteEvent(deleteEvent)).then(() => {
      // Recargar upcoming events después de eliminar
      dispatch(onGetUpCommingEvent());
      // Recargar eventos del calendario
      applyFilters();
    });
    setDeleteModal(false);
  };

  // events validation
  const validation: any = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      id: (event && event.id) || "",
      title: (event && event.title) || "",
      category: (event && event.category) || "",
      service: (event && event.service) || "",
      location: (event && event.location) || "",
      description: (event && event.description) || "",
      defaultDate: (event && event.defaultDate) || [],
      datetag: (event && event.datetag) || "",
      start: (event && event.start) || "",
      end: (event && event.end) || '',
      email: (event && event.email) || "",
      staff: (event && event.staff) || ""
    },

    validationSchema: Yup.object({
      title: Yup.string().required(t('calendar.validation.customer_required')),
      category: Yup.string().required(t('calendar.validation.service_required')),
      service: Yup.string().required(t('calendar.validation.specific_service_required')),
      location: Yup.string().required(t('calendar.validation.phone_required')),
      description: Yup.string().required(t('calendar.validation.notes_required')),
      start: Yup.date().required(t('calendar.validation.start_required')),
      end: Yup.date().required(t('calendar.validation.end_required')),
      defaultDate: Yup.array().of(Yup.date()).required(t('calendar.validation.date_required')).min(1, 'Select a date'),
      email: Yup.string().email(t('calendar.validation.email_invalid')).required(t('calendar.validation.email_required')),
      staff: Yup.string().required(t('calendar.validation.staff_required')),
    }),
    onSubmit: (values) => {
      // Combinar la fecha seleccionada con las horas de inicio y fin
      const selectedDate = selectedNewDay && selectedNewDay[0] ? new Date(selectedNewDay[0]) : new Date();
      
      // Si hay hora de inicio, combinarla con la fecha
      let startDateTime = values.start ? new Date(values.start) : new Date();
      startDateTime.setFullYear(selectedDate.getFullYear());
      startDateTime.setMonth(selectedDate.getMonth());
      startDateTime.setDate(selectedDate.getDate());
      
      // Si hay hora de fin, combinarla con la fecha
      let endDateTime = values.end ? new Date(values.end) : new Date(startDateTime.getTime() + 30 * 60000);
      endDateTime.setFullYear(selectedDate.getFullYear());
      endDateTime.setMonth(selectedDate.getMonth());
      endDateTime.setDate(selectedDate.getDate());

      // Validar que la fecha/hora no sea en el pasado
      const now = new Date();
      if (startDateTime < now) {
        validation.setFieldError("start", t('calendar.validation.past_time_error'));
        return;
      }

      if (isEdit) {
        const updateEvent = {
          id: event.id,
          title: values.title,
          className: values.category,
          start: startDateTime,
          end: endDateTime,
          location: values.location,
          description: values.description,
          email: values.email,
          service: values.service,
          staff: values.staff,
        };
        // update event
        dispatch(onUpdateEvent(updateEvent)).then(() => {
          // Recargar upcoming events después de actualizar
          dispatch(onGetUpCommingEvent());
        });
        validation.resetForm();
      } else {
        const newEvent = {
          id: Math.floor(Math.random() * 100),
          title: values["title"],
          start: startDateTime,
          end: endDateTime,
          className: values["category"],
          location: values["location"],
          description: values["description"],
          email: values["email"],
          service: values["service"],
          staff: values["staff"],
        };
        // save new event
        dispatch(onAddNewEvent(newEvent)).then(() => {
          // Recargar upcoming events después de crear
          dispatch(onGetUpCommingEvent());
        });
        validation.resetForm();
      }

      // setSelectedDay(null);
      setSelectedNewDay(null);
      toggle();
    },
  });

  const submitOtherEvent = () => {

    document.getElementById("form-event")?.classList.remove("view-event");

    document
      .getElementById("event-title")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-category")?.classList.replace("d-none", "d-block");
    (document.getElementById("event-start-date")?.parentNode as HTMLElement).classList.remove("d-none");
    document
      .getElementById("event-start-date")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-location")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-email")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-description")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-start-date-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-location-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-email-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-description-tag")?.classList.replace("d-block", "d-none");

    setIsEditButton(true);
  };

  /**
   * Calculate total duration for service and addons
   */
  const calculateTotalDuration = (service?: Service, addons?: AddOn[], removalAddons?: AddOn[]) => {
    let totalDuration = 0;
    
    const currentService = service || selectedService;
    const currentAddons = addons || selectedAddons;
    const currentRemovalAddons = removalAddons || selectedRemovalAddons;
    
    if (currentService) {
      const serviceDuration = currentService.duration || 0;
      const bufferTime = currentService.bufferTime !== undefined ? currentService.bufferTime : 15;
      totalDuration += serviceDuration + bufferTime;
    }
    
    currentAddons.forEach(addon => {
      const addonTime = addon.additionalTime || 0;
      totalDuration += addonTime;
    });
    
    currentRemovalAddons.forEach(addon => {
      const addonTime = addon.additionalTime || 0;
      totalDuration += addonTime;
    });
    
    return totalDuration;
  };

  /**
   * Update end time based on start time and total duration
   */
  const updateEndTimeFromDuration = (service?: Service, addons?: AddOn[], removalAddons?: AddOn[]) => {
    const startTime = editValidation.values.startTime;
    if (!startTime) return;

    const totalDuration = calculateTotalDuration(service, addons, removalAddons);
    if (totalDuration <= 0) return;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (totalDuration * 60000));
    const endTime = endDate.toTimeString().slice(0, 5);
    
    editValidation.setFieldValue('endTime', endTime);
  };

  /**
   * Handle service selection change
   */
  const handleServiceChange = (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setSelectedAddons([]);
      setSelectedRemovalAddons([]);
      editValidation.setFieldValue('product', service.name);
      const newAmount = service.price;
      editValidation.setFieldValue('amount', newAmount);
      
      setTimeout(() => updateEndTimeFromDuration(service, [], []), 100);
    }
  };

  /**
   * Handle addon toggle on/off
   */
  const handleAddonToggle = (addon: AddOn) => {
    const isSelected = selectedAddons.find(a => a.id === addon.id);
    let newAddons: AddOn[];
    
    if (isSelected) {
      newAddons = selectedAddons.filter(a => a.id !== addon.id);
    } else {
      newAddons = [...selectedAddons, addon];
    }
    
    setSelectedAddons(newAddons);
    
    if (selectedService) {
      const newAmount = selectedService.price + 
        newAddons.reduce((sum, addon) => sum + addon.price, 0) +
        selectedRemovalAddons.reduce((sum, addon) => sum + addon.price, 0);
      editValidation.setFieldValue('amount', newAmount);
    }
    
    setTimeout(() => updateEndTimeFromDuration(selectedService || undefined, newAddons, selectedRemovalAddons), 100);
  };

  /**
   * Handle removal addon toggle on/off
   */
  const handleRemovalAddonToggle = (addon: AddOn) => {
    const isSelected = selectedRemovalAddons.find(a => a.id === addon.id);
    let newRemovals: AddOn[];
    
    if (isSelected) {
      newRemovals = selectedRemovalAddons.filter(a => a.id !== addon.id);
    } else {
      newRemovals = [...selectedRemovalAddons, addon];
    }
    
    setSelectedRemovalAddons(newRemovals);
    
    if (selectedService) {
      const newAmount = selectedService.price + 
        selectedAddons.reduce((sum, addon) => sum + addon.price, 0) +
        newRemovals.reduce((sum, addon) => sum + addon.price, 0);
      editValidation.setFieldValue('amount', newAmount);
    }
    
    setTimeout(() => updateEndTimeFromDuration(selectedService || undefined, selectedAddons, newRemovals), 100);
  };

  /**
   * Get compatible addons for a service
   */
  const getCompatibleAddons = (serviceId: string) => {
    if (!serviceId) return [];
    
    return allAddons.filter(addon => 
      addon.isActive && 
      !addon.removal &&
      (
        !addon.services || 
        addon.services.length === 0 ||
        addon.services.some(service => service.id === serviceId)
      )
    );
  };

  /**
   * Get compatible removal addons
   */
  const getCompatibleRemovalAddons = () => {
    return removalAddons.filter(addon => addon.isActive);
  };

  /**
   * Handle calendar dates change (when user changes view or navigates)
   */
  const handleDatesSet = (dateInfo: any) => {
    // Clean up tooltips when changing dates/views
    cleanupTooltips();
    
    // Formatear fechas para el backend (YYYY-MM-DD)
    const startDate = dateInfo.start.toISOString().split('T')[0];
    // FullCalendar envía end como el día siguiente, restar 1 día para el rango correcto
    const endDateObj = new Date(dateInfo.end.getTime() - 24 * 60 * 60 * 1000);
    const endDate = endDateObj.toISOString().split('T')[0];
    const dateRangeKey = `${startDate}-${endDate}`;
    
    // Solo cargar si el rango es diferente al último Y no estamos cargando actualmente
    if (lastDateRange.current !== dateRangeKey && !loadingEvents.current) {
      lastDateRange.current = dateRangeKey;
      loadingEvents.current = true;
      
      // Preparar filtros incluyendo el rango de fechas
      const filters = {
        page: 1,
        limit: 1000,
        startDate,
        endDate,
        // Apply staff filter - for staff users, always use their own ID
        ...(user && user.role === 'staff' ? { staffId: user.staffId || user.id } : (staffFilter ? { staffId: staffFilter } : {})),
        status: statusFilter || undefined
      };
      
      console.log('📋 DATES SET - Usuario:', user);
      console.log('📋 DATES SET - Filtros finales:', filters);
      
      console.log('📋 APPLY FILTERS - Usuario:', user);
      console.log('📋 APPLY FILTERS - Filtros finales:', filters);
      
      dispatch(onGetEvents(filters)).finally(() => {
        // Resetear el flag después de un pequeño delay para evitar llamadas duplicadas
        setTimeout(() => {
          loadingEvents.current = false;
        }, 500);
      });
    }
  };

  /**
   * Apply filters to calendar
   */
  const applyFilters = () => {
    // Clean up tooltips when applying filters
    cleanupTooltips();
    
    console.log('👆 [MANUAL APPLY] Button clicked');
    console.log('📋 [MANUAL APPLY] Current state:', { 
      staffFilter, 
      statusFilter, 
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id 
    });
    
    if (calendarRef) {
      // Trigger datesSet to reload events with filters
      const view = calendarRef.getApi().view;
      const startDate = view.activeStart.toISOString().split('T')[0];
      const endDate = new Date(view.activeEnd.getTime() - 1).toISOString().split('T')[0];
      
      // Determine final staff ID to use (same logic as useEffect)
      let finalStaffId = null;
      
      // If user is staff role, always use their staff ID (staff can only see their own bookings)
      if (user && user.role === 'staff') {
        finalStaffId = user.staffId || user.id; // Use staffId if available, fallback to user.id
        console.log('🔒 [MANUAL APPLY] Staff user - using staff ID:', finalStaffId, '(staffId:', user.staffId, ', userId:', user.id, ')');
      } 
      // If user is admin/other role and has selected a staff filter, use that
      else if (staffFilter && staffFilter.trim() !== '') {
        finalStaffId = staffFilter;
        console.log('👔 [MANUAL APPLY] Admin user - using selected staff:', finalStaffId);
      } 
      // Otherwise, no staff filter
      else {
        finalStaffId = null;
        console.log('🌐 [MANUAL APPLY] No staff filter - showing all staff');
      }
      
      // Build final filters object
      const filters: any = {
        page: 1,
        limit: 1000,
        startDate,
        endDate
      };
      
      // Add staff filter if we have one
      if (finalStaffId) {
        filters.staffId = finalStaffId;
      }
      
      // Add status filter if we have one  
      if (statusFilter && statusFilter.trim() !== '') {
        filters.status = statusFilter;
      }
      
      console.log('👆 [MANUAL APPLY] Final filters being sent to backend:', JSON.stringify(filters, null, 2));
      
      loadingEvents.current = true;
      dispatch(onGetEvents(filters)).finally(() => {
        setTimeout(() => {
          loadingEvents.current = false;
        }, 500);
      });
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setStaffFilter("");
    setStatusFilter("");
    
    // Apply empty filters
    setTimeout(() => {
      applyFilters();
    }, 100);
  };

  /**
   * Handle calendar navigation
   */
  const handleCalendarNavigation = (action: string) => {
    if (calendarRef) {
      const calendarApi = calendarRef.getApi();
      switch (action) {
        case 'prev':
          calendarApi.prev();
          break;
        case 'next':
          calendarApi.next();
          break;
        case 'today':
          calendarApi.today();
          break;
        case 'timeGridWeek':
        case 'timeGridDay':
          calendarApi.changeView(action);
          setViewFilter(action);
          break;
      }
    }
  };

  /**
   * Clean up all tooltips from the page
   */
  const cleanupTooltips = () => {
    // Remove all existing tooltips
    const tooltips = document.querySelectorAll('.fc-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
    
    // Clear tooltip references from event elements
    const eventElements = document.querySelectorAll('.fc-event');
    eventElements.forEach(eventEl => {
      (eventEl as any).tooltip = null;
    });
  };

  /**
   * Handle event drag and drop for rescheduling
   */
  const handleEventDrop = async (info: any) => {
    // Clean up any existing tooltips first
    cleanupTooltips();
    
    const event = info.event;
    const newStart = info.event.start;
    const newEnd = info.event.end;
    
    try {
      // Validar que la nueva fecha no sea en el pasado
      const now = new Date();
      if (newStart < now) {
        info.revert(); // Revertir el cambio
        toast.error(t('calendar.validation.past_time_error'));
        return;
      }

      // Preparar los datos para la actualización
      const updateData = {
        appointmentDate: moment(newStart).format('YYYY-MM-DD'),
        startTime: moment(newStart).format('HH:mm'),
        endTime: moment(newEnd).format('HH:mm'),
      };

      // Actualizar en la base de datos
      await updateBooking(event.id, updateData);
      
      // Recargar eventos para mantener consistencia
      applyFilters();
      
      // Recargar upcoming events
      dispatch(onGetUpCommingEvent());
      
      toast.success(t('calendar.success.event_rescheduled'));
    } catch (error) {
      console.error('Error rescheduling event:', error);
      info.revert(); // Revertir el cambio si hay error
      toast.error(t('calendar.error.reschedule_failed'));
    }
  };

  /**
   * Handle event resize for duration change
   */
  const handleEventResize = async (info: any) => {
    // Clean up any existing tooltips first
    cleanupTooltips();
    
    const event = info.event;
    const newEnd = info.event.end;
    
    try {
      // Preparar los datos para la actualización (solo cambiar el endTime)
      const updateData = {
        endTime: moment(newEnd).format('HH:mm'),
      };

      // Actualizar en la base de datos
      await updateBooking(event.id, updateData);
      
      // Recargar eventos para mantener consistencia
      applyFilters();
      
      // Recargar upcoming events
      dispatch(onGetUpCommingEvent());
      
      toast.success(t('calendar.success.duration_updated'));
    } catch (error) {
      console.error('Error updating event duration:', error);
      info.revert(); // Revertir el cambio si hay error
      toast.error(t('calendar.error.duration_update_failed'));
    }
  };

  /**
   * On category darg event
   */
  const onDrag = (event: any) => {
    event.preventDefault();
  };

  /**
   * On calendar drop event
   */
  const onDrop = (event: any) => {
    const date = event["date"];
    const now = new Date();
    
    // Verificar si la fecha/hora ya pasó
    if (date < now) {
      return; // No permitir crear reservas en el pasado
    }
    
    const startDate = new Date(date);
    // Añadir 30 minutos para la fecha de fin
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const draggedEl = event.draggedEl;
    const draggedElclass = draggedEl.className;
    
    if (
      draggedEl.classList.contains("external-event") &&
      draggedElclass.indexOf("fc-event-draggable") === -1
    ) {
      // Extraer la categoría del elemento arrastrado
      const categoryTitle = draggedEl.innerText.trim();
      const category = categories.find((cat: any) => cat.title === categoryTitle);
      
      if (category) {
        // Preparar el modal con la categoría preseleccionada
        const categoryClass = category.type === "success" ? "bg-success-subtle" :
                             category.type === "info" ? "bg-info-subtle" :
                             category.type === "warning" ? "bg-warning-subtle" :
                             category.type === "danger" ? "bg-danger-subtle" :
                             category.type === "primary" ? "bg-primary-subtle" :
                             "bg-dark-subtle";
        
        setPreselectedCategory(categoryClass);
        setSelectedNewDay([startDate]);
        setEvent({
          title: "",
          start: startDate,
          end: endDate,
          className: categoryClass,
          category: categoryClass,
          defaultDate: [startDate],
        });
        toggle();
      }
    }
  };

  // Load modal data (services, categories, addons)
  const loadModalData = async () => {
    try {
      const currentLang = i18n.language?.toLowerCase();
      const isSpanish = currentLang === 'sp' || currentLang === 'es';
      
      const [servicesResponse, categoriesResponse, addonsResponse] = await Promise.all([
        getServicesList(undefined, isSpanish ? 'es' : 'en'),
        getCategories(isSpanish ? 'es' : 'en'), 
        getAddOns(1, 100, true, undefined, undefined, isSpanish ? 'es' : 'en')
      ]);
      
      setAllServices(servicesResponse || []);
      setAllCategories(categoriesResponse || []);
      setAllAddons(addonsResponse?.filter((addon: any) => !addon.removal) || []);
      setRemovalAddons(addonsResponse?.filter((addon: any) => addon.removal) || []);
      
      // Group services by category
      const grouped = (servicesResponse || []).reduce((acc: any, service: any) => {
        const catId = service.categoryId;
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(service);
        return acc;
      }, {});
      setServicesByCategory(grouped);
      
    } catch (error) {
      console.error('Error loading modal data:', error);
    }
  };
  
  // Toggle edit modal
  const toggleEditModal = () => {
    if (editModal) {
      setEditModal(false);
      setSelectedBooking(null);
      setSelectedService(null);
      setSelectedAddons([]);
      setSelectedRemovalAddons([]);
      setShowServiceEditor(false);
    } else {
      setEditModal(true);
    }
  };

  // Validation para el modal de edición
  const editValidation: any = useFormik({
    enableReinitialize: true,
    initialValues: {
      orderId: selectedBooking?.orderId || '',
      customer: selectedBooking?.customer || '',
      customerEmail: selectedBooking?.customerEmail || '',
      customerPhone: selectedBooking?.customerPhone || '',
      product: selectedBooking?.product || '',
      categoryName: selectedBooking?.categoryName || '',
      staffName: selectedBooking?.staffName || '',
      staffId: selectedBooking?.staffId || '',
      orderDate: selectedBooking?.orderDate || '',
      startTime: selectedBooking?.startTime || '',
      endTime: selectedBooking?.endTime || '',
      ordertime: selectedBooking?.ordertime || '',
      amount: selectedBooking?.amount || 0,
      payment: selectedBooking?.payment || '',
      status: selectedBooking?.status || '',
      notes: selectedBooking?.notes || '',
      web: selectedBooking?.web || false,
      cancellationReason: selectedBooking?.cancellationReason || '',
    },
    validationSchema: Yup.object({
      status: Yup.string()
        .required(t("reservations.validation.status_required"))
        .oneOf(["pending", "in_progress", "completed", "cancelled"], t("reservations.validation.status_invalid")),
      payment: Yup.string().when('status', {
        is: 'completed',
        then: (schema) => schema
          .required(t("reservations.validation.payment_required_for_completed"))
          .notOneOf(['pending', ''], t("reservations.validation.payment_cannot_be_pending")),
        otherwise: (schema) => schema
      }),
      cancellationReason: Yup.string().when('status', {
        is: 'cancelled',
        then: (schema) => schema.required(t("reservations.validation.cancellation_reason_required")),
        otherwise: (schema) => schema
      })
    }),
    onSubmit: async (values) => {
      if (isEditBooking && selectedBooking) {
        try {
          const updatePayload: any = {
            status: values.status,
            staffId: values.staffId,
            appointmentDate: values.orderDate,
            startTime: values.startTime || '',
            endTime: values.endTime || '',
          };
          
          // Include service and addons changes if service editor was used
          if (selectedService) {
            updatePayload.serviceId = selectedService.id;
          }
          
          if (selectedAddons.length > 0) {
            updatePayload.addons = selectedAddons.map(addon => ({ id: addon.id }));
          }
          
          if (selectedRemovalAddons.length > 0) {
            updatePayload.removalAddons = selectedRemovalAddons.map(addon => ({ id: addon.id }));
          }
          
          // Include notes if provided
          if (values.notes) {
            updatePayload.notes = values.notes;
          }
          
          // Only include paymentMethod for completed bookings
          if (values.status === 'completed' && values.payment) {
            updatePayload.paymentMethod = values.payment.toUpperCase();
          }
          
          // For cancelled bookings, include cancellation reason
          if (values.status === 'cancelled' && values.cancellationReason) {
            updatePayload.cancellationReason = values.cancellationReason;
          }
          
          // Update booking via API
          await updateBooking(selectedBooking.id, updatePayload);
          
          // Refresh calendar events
          applyFilters();
          dispatch(onGetUpCommingEvent());
          
          toast.success(t('reservations.success.updated'));
          toggleEditModal();
          
        } catch (err) {
          console.error('Error updating booking:', err);
          toast.error(t('reservations.error.update_failed'));
        }
      }
    },
  });

  document.title = t('calendar.title') + " | Nails & Co Midtown - Admin Panel";

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteEvent}
        onCloseClick={() => { setDeleteModal(false) }} recordId={""} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('calendar.title')} pageTitle={t('calendar.breadcrumb')} />
          
          {/* Filtros */}
          <Row className="mb-3">
            <Col>
              <Card>
                <CardHeader>
                  <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                    <NavItem>
                      <NavLink
                        to="#"
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => setActiveTab("1")}
                        type="button"
                      >
                        <i className="fas fa-home"></i>
                        {t('calendar.all_reservations')}
                      </NavLink>
                    </NavItem>
                  </Nav>
                </CardHeader>
                <CardBody>
                  <Row className="g-3">
                    {/* Staff Filter */}
                    <Col md={4}>
                      <Label className="form-label">{t('calendar.staff_member')}</Label>
                      <Input
                        type="select"
                        value={user?.role === 'staff' ? user.staffId : staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value)}
                        className="form-select"
                        disabled={user?.role === 'staff'}
                      >
                        <option value="">{t('calendar.all_staff')}</option>
                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                      </Input>
                    </Col>

                    {/* Status Filter */}
                    <Col md={4}>
                      <Label className="form-label">{t('calendar.status')}</Label>
                      <Input
                        type="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                      >
                        <option value="">{t('calendar.all_status')}</option>
                        <option value="pending">{t('calendar.status_pending')}</option>
                        <option value="confirmed">{t('calendar.status_confirmed')}</option>
                        <option value="in_progress">{t('calendar.status_in_progress')}</option>
                        <option value="completed">{t('calendar.status_completed')}</option>
                        <option value="cancelled">{t('calendar.status_cancelled')}</option>
                      </Input>
                    </Col>

                    {/* Action Buttons */}
                    <Col md={4}>
                      <Label className="form-label">&nbsp;</Label>
                      <div className="d-flex gap-2">
                        <Button color="primary" onClick={applyFilters} className="flex-fill">
                          <i className="ri-search-line align-bottom"></i> {t('calendar.apply_filters')}
                        </Button>
                        <Button color="light" onClick={clearFilters} className="flex-fill">
                          <i className="ri-refresh-line align-bottom"></i> {t('calendar.clear_filters')}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row className="h-100">
            {/* Calendario - Ancho completo */}
            <Col xs={12} className="d-flex">
              <Card className="card-h-100 w-100">
                <CardHeader>
                  {/* Calendar Navigation Controls */}
                  <Row className="align-items-center">
                    <Col sm={6}>
                      <div className="d-flex gap-2">
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleCalendarNavigation('prev')}
                        >
                          <i className="ri-arrow-left-line"></i>
                        </Button>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleCalendarNavigation('today')}
                        >
                          {t('calendar.today')}
                        </Button>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleCalendarNavigation('next')}
                        >
                          <i className="ri-arrow-right-line"></i>
                        </Button>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex gap-1 justify-content-end">
                        <ButtonGroup>
                          <Button
                            color={viewFilter === 'timeGridWeek' ? 'primary' : 'light'}
                            size="sm"
                            onClick={() => handleCalendarNavigation('timeGridWeek')}
                          >
                            {t('calendar.view_week')}
                          </Button>
                          <Button
                            color={viewFilter === 'timeGridDay' ? 'primary' : 'light'}
                            size="sm"
                            onClick={() => handleCalendarNavigation('timeGridDay')}
                          >
                            {t('calendar.view_day')}
                          </Button>
                        </ButtonGroup>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <div id="external-events" style={{ display: 'none' }}>
                    {categories &&
                      categories.map((category: any) => (
                        <div
                          className={`bg-${category.type}-subtle external-event fc-event text-${category.type}`}
                              key={"cat-" + category.id}
                              draggable
                            >
                              {category.title}
                            </div>
                          ))}
                      </div>
                      <FullCalendar
                        ref={setCalendarRef}
                        plugins={[
                          BootstrapTheme,
                          timeGridPlugin,
                          interactionPlugin
                        ]}
                        initialView={viewFilter}
                        slotDuration={"00:30:00"}
                        slotMinTime={"08:00:00"}
                        slotMaxTime={"20:00:00"}
                        handleWindowResize={true}
                        themeSystem="bootstrap"
                        height="auto"
                        contentHeight="auto"
                        headerToolbar={false} // Disable default toolbar since we have custom one
                        locale={isSpanish ? esLocale : enLocale}
                        dayHeaderFormat={isSpanish ? 
                          { weekday: 'short', day: 'numeric', month: 'numeric' } : 
                          { weekday: 'short', month: 'numeric', day: 'numeric' }
                        }
                        slotLabelFormat={{
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: false
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        validRange={undefined}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        drop={onDrop}
                        datesSet={handleDatesSet}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        allDaySlot={false}
                        expandRows={true}
                        nowIndicator={true}
                        eventDurationEditable={true}
                        eventStartEditable={true}
                        eventOverlap={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        eventMouseEnter={(info) => {
                          // Clean up any existing tooltips first
                          cleanupTooltips();
                          
                          // Show tooltip on hover
                          const event = info.event;
                          
                          // Format start and end times
                          const startTime = event.start ? moment(event.start).format('HH:mm') : '';
                          const endTime = event.end ? moment(event.end).format('HH:mm') : '';
                          const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
                          
                          const tooltip = document.createElement('div');
                          tooltip.className = 'fc-tooltip';
                          tooltip.style.cssText = `
                            position: absolute;
                            z-index: 1000;
                            background: white;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            padding: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            font-size: 12px;
                            max-width: 250px;
                            pointer-events: none;
                          `;
                          tooltip.innerHTML = `
                            <div><strong>${event.title}</strong></div>
                            ${timeRange ? `<div><i class="ri-time-line"></i> ${timeRange}</div>` : ''}
                            <div><i class="ri-scissors-cut-line"></i> ${event.extendedProps.service || ''}</div>
                            <div><i class="ri-user-line"></i> ${event.extendedProps.staff || ''}</div>
                            <div><span class="badge" style="background-color: ${event.backgroundColor}; color: ${event.textColor || '#ffffff'}">${event.extendedProps.status || ''}</span></div>
                          `;
                          document.body.appendChild(tooltip);
                          (info.el as any).tooltip = tooltip;
                          
                          // Position tooltip
                          const updateTooltipPosition = (e: MouseEvent) => {
                            if (tooltip && tooltip.parentNode) {
                              tooltip.style.left = (e.pageX + 10) + 'px';
                              tooltip.style.top = (e.pageY - 10) + 'px';
                            }
                          };
                          
                          // Add mouse move listener
                          (info.el as any).mouseMoveHandler = updateTooltipPosition;
                          info.el.addEventListener('mousemove', updateTooltipPosition);
                          updateTooltipPosition(info.jsEvent);
                        }}
                        eventMouseLeave={(info) => {
                          // Remove tooltip
                          if ((info.el as any).tooltip) {
                            try {
                              if ((info.el as any).tooltip.parentNode) {
                                document.body.removeChild((info.el as any).tooltip);
                              }
                            } catch (error) {
                              console.warn('Error removing tooltip:', error);
                            }
                            (info.el as any).tooltip = null;
                          }
                          
                          // Remove mouse move listener
                          if ((info.el as any).mouseMoveHandler) {
                            info.el.removeEventListener('mousemove', (info.el as any).mouseMoveHandler);
                            (info.el as any).mouseMoveHandler = null;
                          }
                        }}
                      />
                    </CardBody>
                  </Card>
                </Col>
          </Row>

          {/* Próximas reservas */}
          {/*
          <Row>
            <Col xs={12}>
              <Card>
                <CardHeader>
                  <Row className="align-items-center">
                    <Col sm={6}>
                      <h5 className="mb-0">{t('calendar.upcoming_reservations')}</h5>
                      <p className="text-muted mb-0">{t('calendar.upcoming_description')}</p>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button
                          color="light"
                          size="sm"
                          onClick={() => dispatch(onGetUpCommingEvent())}
                        >
                          <i className="ri-refresh-line"></i> {t('calendar.refresh')}
                        </Button>
                        <ButtonGroup size="sm">
                          <Button
                            color={activeTab === "1" ? "primary" : "light"}
                            onClick={() => setActiveTab("1")}
                          >
                            {t('calendar.today')}
                          </Button>
                          <Button
                            color={activeTab === "2" ? "primary" : "light"}
                            onClick={() => setActiveTab("2")}
                          >
                            {t('calendar.this_week')}
                          </Button>
                          <Button
                            color={activeTab === "3" ? "primary" : "light"}
                            onClick={() => setActiveTab("3")}
                          >
                            {t('calendar.next_week')}
                          </Button>
                        </ButtonGroup>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <div className="avatar-title rounded-circle bg-primary-subtle text-primary">
                              <i className="ri-calendar-check-line fs-16"></i>
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h6 className="mb-1">{upcommingevents ? upcommingevents.length : 0}</h6>
                          <p className="text-muted mb-0">{t('calendar.total_upcoming')}</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <div className="avatar-title rounded-circle bg-warning-subtle text-warning">
                              <i className="ri-time-line fs-16"></i>
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h6 className="mb-1">
                            {upcommingevents ? upcommingevents.filter((e: any) => e.extendedProps?.status === 'PENDING').length : 0}
                          </h6>
                          <p className="text-muted mb-0">{t('calendar.pending_confirmations')}</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <div className="avatar-title rounded-circle bg-success-subtle text-success">
                              <i className="ri-check-double-line fs-16"></i>
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h6 className="mb-1">
                            {upcommingevents ? upcommingevents.filter((e: any) => e.extendedProps?.status === 'CONFIRMED').length : 0}
                          </h6>
                          <p className="text-muted mb-0">{t('calendar.confirmed_appointments')}</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="mt-4">
                    {upcommingevents && upcommingevents.length > 0 ? (
                      <SimpleBar
                        className="pe-2 me-n1 mb-3"
                        style={{ height: "400px" }}
                      >
                        <div id="upcoming-event-list">
                          {upcommingevents.map((event: any, key: any) => (
                            <React.Fragment key={key}>
                              <UpcommingEvents event={event} />
                            </React.Fragment>
                          ))}
                        </div>
                      </SimpleBar>
                    ) : (
                      <div className="text-center py-5">
                        <div className="avatar-lg mx-auto mb-4">
                          <div className="avatar-title rounded-circle bg-light text-muted">
                            <i className="ri-calendar-2-line display-6"></i>
                          </div>
                        </div>
                        <h5 className="mb-1">{t('calendar.no_upcoming_events')}</h5>
                        <p className="text-muted mb-0">{t('calendar.no_upcoming_description')}</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
          */}

          {/* Modal de edición de booking - igual que EcommerceOrders */}
          <Modal isOpen={editModal} toggle={toggleEditModal} centered size="lg">
            <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>
              {t("reservations.view_reservation")}
            </ModalHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              editValidation.handleSubmit();
              return false;
            }}>
              <ModalBody>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.customer_name")}
                    </Label>
                    <div className="text-muted">
                      {editValidation.values.customer || t("common.not_available")}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.phone")}
                    </Label>
                    <div className="text-muted">
                      {editValidation.values.customerPhone || t("common.not_available")}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <Label className="form-label fw-semibold">
                    {t("reservations.form.email")}
                  </Label>
                  <div className="text-muted">
                    {editValidation.values.customerEmail || t("common.not_available")}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.services")}
                    </Label>
                    <Button
                      color="link"
                      size="sm"
                      className="p-0"
                      onClick={() => setShowServiceEditor(!showServiceEditor)}
                    >
                      <i className={`ri-${showServiceEditor ? 'eye-off' : 'edit'}-line me-1`} />
                      {showServiceEditor ? t("common.hide_editor") : t("common.edit")}
                    </Button>
                  </div>
                  
                  {!showServiceEditor ? (
                    <div>
                      <div className="text-muted">
                        {editValidation.values.product || t("common.not_available")}
                      </div>
                      
                      {/* Show addons if they exist */}
                      {((selectedBooking && selectedBooking.addons && selectedBooking.addons.length > 0) || 
                        (selectedAddons && selectedAddons.length > 0) ||
                        (selectedRemovalAddons && selectedRemovalAddons.length > 0)) && (
                        <div className="mt-2">
                          <span className="text-muted small fw-semibold">{t("common.addons")}</span>
                          <ul className="list-unstyled ms-3 mb-0">
                            {/* Show addons from selectedBooking */}
                            {selectedBooking && selectedBooking.addons && selectedBooking.addons.map((addon: any) => (
                              <li key={addon.id} className="text-muted small">
                                • {addon.name} 
                                {addon.price > 0 && (
                                  <span className="text-success"> (+${addon.price.toFixed(2)})</span>
                                )}
                                {addon.additionalTime > 0 && (
                                  <span className="text-info"> (+{addon.additionalTime} {t("common.minutes_short")})</span>
                                )}
                              </li>
                            ))}
                            {/* Fallback: Show addons from selectedAddons if selectedBooking.addons is empty */}
                            {(!selectedBooking?.addons || selectedBooking.addons.length === 0) && selectedAddons && selectedAddons.map((addon: any) => (
                              <li key={addon.id} className="text-muted small">
                                • {addon.name} 
                                {addon.price > 0 && (
                                  <span className="text-success"> (+${addon.price.toFixed(2)})</span>
                                )}
                                {addon.additionalTime > 0 && (
                                  <span className="text-info"> (+{addon.additionalTime} {t("common.minutes_short")})</span>
                                )}
                              </li>
                            ))}
                            {/* Show removal addons from selectedRemovalAddons */}
                            {(!selectedBooking?.addons || selectedBooking.addons.filter((a: any) => a.removal).length === 0) && selectedRemovalAddons && selectedRemovalAddons.map((addon: any) => (
                              <li key={addon.id} className="text-muted small">
                                • {addon.name} 
                                {addon.price > 0 && (
                                  <span className="text-success"> (+${addon.price.toFixed(2)})</span>
                                )}
                                {addon.additionalTime > 0 && (
                                  <span className="text-info"> (+{addon.additionalTime} {t("common.minutes_short")})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded p-3 bg-light">
                      {/* Service Selection */}
                      <div className="mb-3">
                        <Label className="form-label fw-semibold small">
                          {t("reservations.form.select_service")}
                        </Label>
                        <Input
                          name="serviceSelection"
                          type="select"
                          className="form-select"
                          value={selectedService?.id || ""}
                          onChange={(e) => handleServiceChange(e.target.value)}
                        >
                          <option value="">{t("reservations.form.select_service_placeholder")}</option>
                          {allCategories.map(category => {
                            const categoryServices = servicesByCategory[category.id] || [];
                            if (categoryServices.length === 0) return null;
                            
                            return (
                              <optgroup key={category.id} label={category.name}>
                                {categoryServices.map(service => (
                                  <option key={service.id} value={service.id}>
                                    {service.name} - ${service.price} ({service.duration} min)
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </Input>
                        {selectedService && (
                          <small className="text-muted">
                            Servicio actual: <strong>{selectedService.name}</strong> - ${selectedService.price} ({selectedService.duration} min)
                          </small>
                        )}
                      </div>
                      
                      {/* Addons Selection */}
                      {selectedService && (
                        <div className="mb-3">
                          <Label className="form-label fw-semibold small">
                            {t("common.addons")} ({t("common.optional")})
                          </Label>
                          
                          {/* Selected addons as chips */}
                          {selectedAddons.length > 0 && (
                            <div className="mb-2">
                              <div className="d-flex flex-wrap gap-1">
                                {selectedAddons.map(addon => (
                                  <span 
                                    key={addon.id}
                                    className="badge bg-success d-flex align-items-center gap-1"
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    {addon.name} (+${addon.price})
                                    <i 
                                      className="ri-close-line" 
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleAddonToggle(addon)}
                                    />
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Dropdown for selecting addons */}
                          <Input
                            key={`addons-${selectedService.id}`}
                            type="select"
                            className="form-select"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const compatibleAddons = getCompatibleAddons(selectedService.id);
                                const addon = compatibleAddons.find(a => a.id === e.target.value);
                                if (addon && !selectedAddons.find(a => a.id === addon.id)) {
                                  handleAddonToggle(addon);
                                }
                                // Reset select after selection
                                e.target.value = "";
                              }
                            }}
                          >
                            <option value="">
                              {(() => {
                                const compatibleCount = getCompatibleAddons(selectedService.id).length;
                                return compatibleCount > 0 
                                  ? t("reservations.form.select_addon_placeholder")
                                  : t("booking.services.no_addons_available");
                              })()}
                            </option>
                            {(() => {
                              const compatibleAddons = getCompatibleAddons(selectedService.id);
                              const availableAddons = compatibleAddons.filter(addon => !selectedAddons.find(a => a.id === addon.id));
                              return availableAddons.map(addon => (
                                <option key={addon.id} value={addon.id}>
                                  {addon.name} (+${addon.price})
                                  {addon.additionalTime && ` (+${addon.additionalTime} min)`}
                                </option>
                              ));
                            })()}
                          </Input>
                        </div>
                      )}
                      
                      {/* Removal Addons Selection */}
                      <div className="mb-3">
                        <Label className="form-label fw-semibold small">
                          {t("reservations.form.removal_services")} ({t("common.optional")})
                        </Label>
                        
                        {/* Selected removal addons as chips */}
                        {selectedRemovalAddons.length > 0 && (
                          <div className="mb-2">
                            <div className="d-flex flex-wrap gap-1">
                              {selectedRemovalAddons.map(addon => (
                                <span 
                                  key={addon.id}
                                  className="badge bg-warning d-flex align-items-center gap-1"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {addon.name} (+${addon.price})
                                  <i 
                                    className="ri-close-line" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleRemovalAddonToggle(addon)}
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Dropdown for selecting removal addons */}
                        <Input
                          type="select"
                          className="form-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const addon = getCompatibleRemovalAddons().find(a => a.id === e.target.value);
                              if (addon && !selectedRemovalAddons.find(a => a.id === addon.id)) {
                                handleRemovalAddonToggle(addon);
                              }
                              // Reset select after selection
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">
                            {getCompatibleRemovalAddons().length > 0 
                              ? t("reservations.form.select_removal_placeholder")
                              : t("booking.services.no_removals_available")
                            }
                          </option>
                          {getCompatibleRemovalAddons()
                            .filter(addon => !selectedRemovalAddons.find(a => a.id === addon.id))
                            .map(addon => (
                              <option key={addon.id} value={addon.id}>
                                {addon.name} (+${addon.price})
                                {addon.additionalTime && ` (+${addon.additionalTime} min)`}
                              </option>
                            ))
                          }
                        </Input>
                      </div>
                      
                      {/* Price Preview */}
                      {selectedService && (
                        <div className="border rounded p-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted">{t("reservations.form.service")}:</span>
                            <span className="small">${selectedService.price.toFixed(2)}</span>
                          </div>
                          {selectedAddons.length > 0 && (
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small text-muted">{t("common.addons")} ({selectedAddons.length}):</span>
                              <span className="small">+${selectedAddons.reduce((sum, addon) => sum + addon.price, 0).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedRemovalAddons.length > 0 && (
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small text-muted">{t("reservations.form.removals")} ({selectedRemovalAddons.length}):</span>
                              <span className="small">+${selectedRemovalAddons.reduce((sum, addon) => sum + addon.price, 0).toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="my-1" />
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small fw-semibold">{t("reservations.form.new_total")}:</span>
                            <span className="fw-bold text-success">
                              ${(selectedService.price + 
                                selectedAddons.reduce((sum, addon) => sum + addon.price, 0) +
                                selectedRemovalAddons.reduce((sum, addon) => sum + addon.price, 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <Label className="form-label fw-semibold">
                    {t("reservations.form.staff")}
                  </Label>
                  <Input
                    name="staffId"
                    type="select"
                    className="form-select"
                    onChange={editValidation.handleChange}
                    onBlur={editValidation.handleBlur}
                    value={editValidation.values.staffId || ""}
                  >
                    <option value="">{t("reservations.form.select_staff")}</option>
                    {staff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.fullName}
                      </option>
                    ))}
                  </Input>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.reservation_date")}
                    </Label>
                    <Input
                      name="orderDate"
                      type="date"
                      className="form-control"
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.orderDate || ""}
                    />
                  </div>
                  <div className="col-md-4">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.start_time")}
                    </Label>
                    <Input
                      name="startTime"
                      type="time"
                      className="form-control"
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.startTime || ""}
                    />
                  </div>
                  <div className="col-md-4">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.end_time")}
                    </Label>
                    <Input
                      name="endTime"
                      type="time"
                      className="form-control"
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.endTime || ""}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.amount")}
                    </Label>
                    <div className="text-muted">
                      ${(editValidation.values.amount || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.source")}
                    </Label>
                    <div className="text-muted">
                      {editValidation.values.web ? t("reservations.source.web") : t("reservations.source.backoffice")}
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Label htmlFor="payment-field" className="form-label fw-semibold">
                      {t("reservations.form.payment_method")}
                      {editValidation.values.status === 'completed' && <span className="text-danger"> *</span>}
                    </Label>
                    <Input
                      name="payment"
                      id="payment-field"
                      className={`form-select ${(editValidation.values.status === 'pending' || editValidation.values.status === 'in_progress' || editValidation.values.status === 'cancelled') ? 'text-muted bg-light' : ''}`}
                      type="select"
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.payment || ""}
                      disabled={editValidation.values.status === 'pending' || editValidation.values.status === 'in_progress' || editValidation.values.status === 'cancelled'}
                      invalid={editValidation.touched.payment && editValidation.errors.payment ? true : false}
                    >
                      <option value="">{t("reservations.form.select_payment")}</option>
                      <option value="cash">{t("reservations.payment.cash")}</option>
                      <option value="card">{t("reservations.payment.card")}</option>
                      {(editValidation.values.status === 'pending' || editValidation.values.status === 'in_progress') && (
                        <option value="pending">{t("reservations.payment.pending")}</option>
                      )}
                      {editValidation.values.status === 'cancelled' && (
                        <option value="not_applicable">N/A</option>
                      )}
                    </Input>
                    {editValidation.touched.payment && editValidation.errors.payment ? (
                      <FormFeedback type="invalid">{editValidation.errors.payment}</FormFeedback>
                    ) : null}
                    {editValidation.values.status === 'completed' && (
                      <div className="form-text text-muted">
                        {t("reservations.form.payment_required_helper")}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <Label htmlFor="status-field" className="form-label fw-semibold">
                      {t("reservations.form.status")}
                    </Label>
                    <Input
                      name="status"
                      type="select"
                      className="form-select"
                      id="status-field"
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.status || ""}
                      invalid={editValidation.touched.status && editValidation.errors.status ? true : false}
                    >
                      <option value="">{t("reservations.form.select_status")}</option>
                      <option value="pending">{t("reservations.status.pending")}</option>
                      <option value="in_progress">{t("reservations.status.in_progress")}</option>
                      <option value="completed">{t("reservations.status.completed")}</option>
                      <option value="cancelled">{t("reservations.status.cancelled")}</option>
                    </Input>
                    {editValidation.touched.status && editValidation.errors.status ? (
                      <FormFeedback type="invalid">{editValidation.errors.status}</FormFeedback>
                    ) : null}
                  </div>
                </div>

                {/* Cancellation Reason field */}
                {editValidation.values.status === 'cancelled' && (
                  <div className="mb-3">
                    <Label htmlFor="cancellation-reason-field" className="form-label fw-semibold">
                      {t("reservations.form.cancellation_reason")}
                    </Label>
                    <Input
                      name="cancellationReason"
                      type="textarea"
                      className="form-control"
                      id="cancellation-reason-field"
                      placeholder={t("reservations.form.cancellation_reason_placeholder")}
                      rows={3}
                      onChange={editValidation.handleChange}
                      onBlur={editValidation.handleBlur}
                      value={editValidation.values.cancellationReason || ""}
                      invalid={editValidation.touched.cancellationReason && editValidation.errors.cancellationReason ? true : false}
                    />
                    {editValidation.touched.cancellationReason && editValidation.errors.cancellationReason ? (
                      <FormFeedback type="invalid">{editValidation.errors.cancellationReason}</FormFeedback>
                    ) : null}
                  </div>
                )}

                {editValidation.values.notes && (
                  <div className="mb-3">
                    <Label className="form-label fw-semibold">
                      {t("reservations.form.notes")}
                    </Label>
                    <div className="text-muted">
                      {editValidation.values.notes}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <div className="hstack gap-2 justify-content-end">
                  <Button color="light" onClick={toggleEditModal}>
                    {t("common.close")}
                  </Button>
                  <Button 
                    color="success" 
                    type="submit"
                    disabled={
                      editValidation.values.status === 'completed' && 
                      (!editValidation.values.payment || editValidation.values.payment === 'pending' || editValidation.values.payment === '')
                    }
                  >
                    {t("common.save_changes")}
                  </Button>
                </div>
              </ModalFooter>
            </form>
          </Modal>

        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

Calender.propTypes = {
  events: PropTypes.any,
  categories: PropTypes.array,
  className: PropTypes.string,
  onGetEvents: PropTypes.func,
  onAddNewEvent: PropTypes.func,
  onUpdateEvent: PropTypes.func,
  onDeleteEvent: PropTypes.func,
  onGetCategories: PropTypes.func,
};

export default Calender;