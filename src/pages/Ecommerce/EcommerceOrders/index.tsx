import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Modal,
  ModalHeader,
  Form,
  ModalBody,
  Label,
  Input,
  FormFeedback,
  Button
} from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import classnames from "classnames";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import ReservationModal from "../../../Components/Common/ReservationModal";
import CreateBookingModal from "../../../Components/Common/CreateBookingModal";
import { isEmpty } from "lodash";

// Export Modal
import ExportCSVModal from "../../../Components/Common/ExportCSVModal";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";

//Import actions
import {
  getOrders as onGetOrders,
  addNewOrder as onAddNewOrder,
  updateOrder as onUpdateOrder,
} from "../../../slices/thunks";

import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createSelector } from "reselect";
import moment from "moment";
import "moment/locale/es"; // Import Spanish locale for moment
import { servicesByCategory, staffMembers } from "../../../common/data/calender";
import { getBookingById } from "../../../api/bookings";
import { getAddOn, AddOn as AddonType, getAddOns } from "../../../api/addons";
import { getStaffList, Staff } from "../../../api/staff";
import { getServices, Service, getRemovalAddonsByServices } from "../../../api/services";
import { getCategories, Category } from "../../../api/categories";

// i18n
import { useTranslation } from 'react-i18next';

const EcommerceOrders = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  // Estado para filtro de fecha (rango)
  const [dateFilter, setDateFilter] = useState<[Date | null, Date | null]>([null, null]);

  const [modal, setModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
  
  // Staff data
  const [staff, setStaff] = useState<Staff[]>([]);
  
  // Service editing data
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allAddons, setAllAddons] = useState<AddonType[]>([]);
  const [removalAddons, setRemovalAddons] = useState<AddonType[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<AddonType[]>([]);
  const [selectedRemovalAddons, setSelectedRemovalAddons] = useState<AddonType[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<{[key: string]: Service[]}>({});
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  
  // Extraer customer ID y nombre de la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const customerId = params.get('customer');
    const customerName = params.get('name');
    const staffId = params.get('staff');
    const staffName = params.get('name');
    
    if (customerId) {
      setCustomerFilter(customerId);
    }
    
    if (staffId) {
      setStaffFilter(staffId);
    }
    
    if (customerName || staffName) {
      setSearchTerm(decodeURIComponent(customerName || staffName || ''));
    }
  }, [location.search]);

  // Configure moment locale based on i18n language
  useEffect(() => {
    const currentLang = i18n.language?.toLowerCase();
    if (currentLang === 'sp' || currentLang === 'es') {
      moment.locale('es');
    } else {
      moment.locale('en');
    }
  }, [i18n.language]);
  
  // Estados para ReservationModal
  const [reservationModal, setReservationModal] = useState<boolean>(false);
  const [reservationEvent, setReservationEvent] = useState<any>({});
  const [isEditReservation, setIsEditReservation] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  
  // Estado para CreateBookingModal (nuevo sistema)
  const [createBookingModal, setCreateBookingModal] = useState<boolean>(false);

  const dispatch: any = useDispatch();
  
  // Selector para obtener el usuario actual
  const selectAuthState = (state: any) => state.Login;
  const selectUserData = createSelector(
    selectAuthState,
    (auth) => ({
      user: auth.user
    })
  );
  const { user } = useSelector(selectUserData);
  
  const selectLayoutState = (state: any) => state.Ecommerce;
  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (ecom) => ({
      orders: ecom.orders,
      pagination: ecom.pagination,
      isOrderSuccess: ecom.isOrderSuccess,
      error: ecom.error,
    })
  );
  // Inside your component
  const {
    orders, pagination, isOrderSuccess, error
  } = useSelector(selectLayoutProperties);
  const [orderList, setOrderList] = useState<any>([]);
  const [order, setOrder] = useState<any>(null);

  const orderstatus = [
    {
      options: [
        { label: t('reservations.status.confirmed'), value: "Confirmed" },
        { label: t('reservations.status.completed'), value: "Completed" },
        { label: t('reservations.status.pending'), value: "Pending" },
        { label: t('reservations.status.cancelled'), value: "Cancelled" },
      ],
    },
  ];

  const orderpayement = [
    {
      options: [
        { label: t('reservations.payment.cash'), value: "Cash" },
        { label: t('reservations.payment.bank'), value: "Bank" },
      ],
    },
  ];

  const productname = [
    {
      options: [
        { label: "Servicios", value: "Servicios" },
        { label: "Manicura Clásica", value: "Manicura Clásica" },
        { label: "Manicura con Gel", value: "Manicura con Gel" },
        { label: "Pedicura Spa", value: "Pedicura Spa" },
        { label: "Uñas Acrílicas", value: "Uñas Acrílicas" },
        { label: "Uñas de Gel", value: "Uñas de Gel" },
        { label: "Diseño de Uñas", value: "Diseño de Uñas" },
        { label: "Esmaltado Permanente", value: "Esmaltado Permanente" },
        { label: "Retiro de Acrílico", value: "Retiro de Acrílico" },
        { label: "Retiro de Gel", value: "Retiro de Gel" },
        { label: "French Manicure", value: "French Manicure" },
        { label: "Manicura Rusa", value: "Manicura Rusa" },
        { label: "Pedicura Clásica", value: "Pedicura Clásica" },
        { label: "Tratamiento de Cutículas", value: "Tratamiento de Cutículas" },
        { label: "Masaje de Manos", value: "Masaje de Manos" },
      ],
    },
  ];

  const [isEdit, setIsEdit] = useState<boolean>(false);

  useEffect(() => {
    // Always update orderList to reflect current orders data
    // This handles both empty arrays [] and populated arrays correctly
    console.log('🔄 Orders state changed:', {
      orders: orders,
      ordersLength: orders?.length || 0,
      isArray: Array.isArray(orders),
      ordersBefore: orderList?.length || 0
    });
    setOrderList(orders || []);
    setIsSearching(false); // Clear searching state when we get results
    console.log('📊 OrderList updated to:', (orders || []).length, 'items');
  }, [orders]);

  // Update pagination info from backend
  useEffect(() => {
    if (pagination) {
      setTotalRecords(pagination.total);
      setCurrentPage(pagination.page);
      setPageSize(pagination.limit);
    }
  }, [pagination]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Auto-filtrar por staff si el usuario actual es de rol 'staff'
  useEffect(() => {
    if (user && user.role === 'staff' && user.id) {
      console.log('👤 Usuario staff detectado, aplicando filtro automático:', user.id);
      // Para usuarios staff, siempre forzar el filtro a su ID propio
      if (staffFilter !== user.id) {
        setStaffFilter(user.id);
      }
    }
  }, [user, staffFilter]);

  const toggleTab = (tab: any, type: any) => {
    if (activeTab !== tab) {
      console.log('🏷️ Switching tab from', activeTab, 'to', tab, 'type:', type);
      // Clear current data immediately when switching tabs to show loading state
      setOrderList([]);
      setActiveTab(tab);
      setCurrentPage(1); // Reset to first page when changing tabs
      // The useEffect will handle the fetch with debounce
    }
  };

  // validation
  const validation: any = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      orderId: order?.orderId || '',
      customer: order?.customer || '',
      customerEmail: order?.customerEmail || '',
      customerPhone: order?.customerPhone || '',
      product: order?.product || '',
      categoryName: order?.categoryName || '',
      staffName: order?.staffName || '',
      staffId: order?.staffId || '',
      orderDate: order?.orderDate || '',
      ordertime: order?.ordertime || '',
      startTime: order?.ordertime ? order.ordertime.split(' - ')[0] || '' : '',
      endTime: order?.ordertime ? order.ordertime.split(' - ')[1] || '' : '',
      amount: order?.amount || 0,
      payment: order?.payment || '',
      status: order?.status || '',
      notes: order?.notes || '',
      web: order?.web || false,
      cancellationReason: order?.cancellationReason || '',
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
      }).when('status', {
        is: 'cancelled',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema
      }),
      cancellationReason: Yup.string().when('status', {
        is: 'cancelled',
        then: (schema) => schema.required(t("reservations.validation.cancellation_reason_required")),
        otherwise: (schema) => schema
      })
    }).test('completed-validations', '', function(values) {
      const { status } = values;
      
      if (status === 'completed') {
        // Access form values correctly through this.from
        const formData = this.from?.[0]?.value;
        const amount = formData?.amount;
        const orderDate = formData?.orderDate;
        
        // Validate amount is not zero (amount is in dollars, so should be > 0)
        if (!amount || amount === 0) {
          return this.createError({
            path: 'status',
            message: t("reservations.validation.completed_cannot_have_zero_amount")
          });
        }
        
        // Validate date is not in the future
        if (orderDate) {
          const bookingDate = new Date(orderDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (bookingDate > today) {
            return this.createError({
              path: 'status',
              message: t("reservations.validation.completed_cannot_have_future_date")
            });
          }
        }
      }
      
      return true;
    }),
    onSubmit: async (values) => {
      if (isEdit && order) {
        // Handle different status updates with appropriate fields
        let updatePayload: any = {
          status: values.status,
          // Include editable fields that user can modify
          staffId: values.staffId,
          appointmentDate: values.orderDate,
          startTime: values.startTime || '',
          endTime: values.endTime || '',
        };
        
        // Include service and addons changes if service editor was used
        if (selectedService) {
          updatePayload.serviceId = selectedService.id;
          
          // Combine normal addons and removal addons into a single array
          // Following the same pattern as CreateBookingModal
          const allAddOns = [
            ...selectedAddons,
            ...selectedRemovalAddons.filter(addon => addon.id) // Include selected removal addons
          ];
          updatePayload.addOnIds = allAddOns.map(addon => addon.id);
          
          // Update total price based on selected service, addons, and removals
          const newTotalPrice = selectedService.price + 
            selectedAddons.reduce((sum, addon) => sum + addon.price, 0) +
            selectedRemovalAddons.reduce((sum, addon) => sum + addon.price, 0);
          updatePayload.totalPrice = newTotalPrice.toFixed(2);
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
        
        // Remove serviceId if it's empty or invalid to avoid validation errors
        if (updatePayload.serviceId === '' || updatePayload.serviceId === null || updatePayload.serviceId === undefined) {
          delete updatePayload.serviceId;
        }
        
        try {
          await dispatch(onUpdateOrder({ id: order.id, ...updatePayload }));
          // Refresh bookings after update
          const filters = {
            page: currentPage,
            limit: pageSize,
            ...(customerFilter ? { customerId: customerFilter } : {}),
            // Para usuarios staff, siempre usar su propio ID
            ...(user && user.role === 'staff' ? { staffId: user.staffId || user.id } : (staffFilter ? { staffId: staffFilter } : {})),
            ...(searchTerm ? { search: searchTerm } : {}),
          };
          dispatch(onGetOrders(filters));
        } catch (err) {
          // Error handled by thunk toast
        }
        validation.resetForm();
      } else {
        // Creation logic (not used for edit modal)
        const newOrder = {
          id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
          orderId: values["orderId"],
          customer: values["customer"],
          product: values["product"],
          orderDate: values["orderDate"],
          amount: values["amount"],
          payment: values["payment"],
          status: values["status"]
        };
        dispatch(onAddNewOrder(newOrder));
        validation.resetForm();
      }
      toggle();
    },
  });

  // Debug: Log when selected service changes
  useEffect(() => {
    // This effect runs when selectedservice or allAddons change
    // Used for debugging service and addon compatibility
  }, [selectedService, allAddons]);

  // Debug: Log when order changes
  useEffect(() => {
    if (order) {
      // Set selected service from order if available
      if (order.serviceId && allServices.length > 0) {
        const service = allServices.find(s => s.id === order.serviceId);
        if (service) {
          setSelectedService(service);
          // Load removal addons for the initial service
          loadRemovalAddonsForService(service.id);
        }
      }
      
      // Set selected addons from order
      if (order.addons && order.addons.length > 0) {
        // Separate normal addons from removal addons
        const normalAddons = order.addons.filter((addon: any) => !addon.removal);
        const removalAddons = order.addons.filter((addon: any) => addon.removal === true);
        setSelectedAddons(normalAddons);
        setSelectedRemovalAddons(removalAddons);
      } else {
        setSelectedAddons([]);
        setSelectedRemovalAddons([]);
      }
      
      // Force formik to reinitialize with new values
      validation.setValues({
        orderId: order?.orderId || '',
        customer: order?.customer || '',
        customerEmail: order?.customerEmail || '',
        customerPhone: order?.customerPhone || '',
        product: order?.product || '',
        categoryName: order?.categoryName || '',
        staffName: order?.staffName || '',
        staffId: order?.staffId || '',
        orderDate: order?.orderDate || '',
        ordertime: order?.ordertime || '',
        startTime: order?.ordertime ? order.ordertime.split(' - ')[0] || '' : '',
        endTime: order?.ordertime ? order.ordertime.split(' - ')[1] || '' : '',
        amount: order?.amount || 0,
        payment: order?.payment || '',
        status: order?.status || '',
        notes: order?.notes || '',
        web: order?.web || false,
        cancellationReason: order?.cancellationReason || '',
      });
    }
  }, [order, allServices]);

  // Validation para ReservationModal
  const reservationValidation: any = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: (reservationEvent && reservationEvent.title) || "",
      category: (reservationEvent && reservationEvent.category) || "",
      service: (reservationEvent && reservationEvent.service) || "",
      staff: (reservationEvent && reservationEvent.staff) || "",
      defaultDate: (reservationEvent && reservationEvent.defaultDate) || [],
      start: (reservationEvent && reservationEvent.start) || new Date(),
      end: (reservationEvent && reservationEvent.end) || new Date(),
      location: (reservationEvent && reservationEvent.location) || "",
      email: (reservationEvent && reservationEvent.email) || "",
      description: (reservationEvent && reservationEvent.description) || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required(t('calendar.validation.customer_required')),
      category: Yup.string().required(t('calendar.validation.service_required')),
      service: Yup.string().required(t('calendar.validation.specific_service_required')),
      location: Yup.string().required(t('calendar.validation.phone_required')),
      description: Yup.string().required(t('calendar.validation.notes_required')),
      start: Yup.date().required(t('calendar.validation.start_required')),
      end: Yup.date().required(t('calendar.validation.end_required')),
      defaultDate: Yup.array().of(Yup.date()).required(t('calendar.validation.date_required')).min(1, t('common.select_date')),
      email: Yup.string().email(t('calendar.validation.email_invalid')).required(t('calendar.validation.email_required')),
      staff: Yup.string().required(t('calendar.validation.staff_required')),
    }),
    onSubmit: (values) => {
      // Convertir la reserva del modal a formato de orden
      const selectedDate = values.defaultDate && values.defaultDate[0] ? new Date(values.defaultDate[0]) : new Date();
      
      let startDateTime = values.start ? new Date(values.start) : new Date();
      startDateTime.setFullYear(selectedDate.getFullYear());
      startDateTime.setMonth(selectedDate.getMonth());
      startDateTime.setDate(selectedDate.getDate());
      
      let endDateTime = values.end ? new Date(values.end) : new Date(startDateTime.getTime() + 30 * 60000);
      endDateTime.setFullYear(selectedDate.getFullYear());
      endDateTime.setMonth(selectedDate.getMonth());
      endDateTime.setDate(selectedDate.getDate());

      const now = new Date();
      if (startDateTime < now) {
        reservationValidation.setFieldError("start", t('calendar.validation.past_time_error'));
        return;
      }

      // Obtener el nombre del servicio
      const categoryMap: any = {
        'bg-success-subtle': 1,
        'bg-info-subtle': 2,
        'bg-warning-subtle': 3,
        'bg-danger-subtle': 4,
        'bg-primary-subtle': 5,
        'bg-dark-subtle': 6
      };
      const categoryId = categoryMap[values.category];
      const services = servicesByCategory[categoryId] || [];
      const selectedService = services.find((s: any) => s.id.toString() === values.service.toString());
      const serviceName = selectedService ? selectedService.name : 'Service';

      if (isEditReservation) {
        const updateOrder = {
          id: reservationEvent.id,
          orderId: reservationEvent.orderId || `ORD-${Math.floor(Math.random() * 10000)}`,
          customer: values.title,
          product: serviceName,
          orderDate: selectedDate.toISOString().split('T')[0],
          ordertime: startDateTime.toTimeString().slice(0, 5),
          amount: selectedService ? `$${selectedService.duration * 2}` : '$50',
          payment: reservationEvent.payment || 'Pending',
          status: reservationEvent.status || 'Pending',
        };
        dispatch(onUpdateOrder(updateOrder));
        reservationValidation.resetForm();
      } else {
        const newOrder = {
          id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
          orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
          customer: values.title,
          product: serviceName,
          orderDate: selectedDate.toISOString().split('T')[0],
          ordertime: startDateTime.toTimeString().slice(0, 5),
          amount: selectedService ? `$${selectedService.duration * 2}` : '$50',
          payment: 'Pending',
          status: 'Pending',
        };
        dispatch(onAddNewOrder(newOrder));
        reservationValidation.resetForm();
      }
      toggleReservationModal();
    },
  });

  useEffect(() => {
    // Solo cargar datos iniciales si el usuario está disponible y no se ha hecho carga inicial
    if (user && !hasInitialLoad) {
      const initialFilters: any = {
        page: 1,
        limit: pageSize
      };
      
      // Para usuarios staff, aplicar filtro desde el inicio
      if (user.role === 'staff' && (user.staffId || user.id)) {
        const staffId = user.staffId || user.id;
        initialFilters.staffId = staffId;
        console.log('🚀 Carga inicial con filtro staff:', staffId, '(staffId:', user.staffId, ', userId:', user.id, ')');
      }
      
      console.log('📦 Carga inicial con filtros:', initialFilters);
      dispatch(onGetOrders(initialFilters));
      setHasInitialLoad(true); // Marcar que ya se hizo la carga inicial
    }
  }, [dispatch, user, pageSize, hasInitialLoad]);

  // Debounce search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      // Set searching state to show loading
      setIsSearching(true);
      
      const filters: any = {
        page: currentPage,
        limit: pageSize
      };
      
      console.log('🔍 Realizando búsqueda con usuario:', user);
      
      // Add customer filter if exists
      if (customerFilter) {
        filters.customerId = customerFilter;
        console.log('📋 Customer filter aplicado:', customerFilter);
      }
      
      // Add staff filter - for staff users, always use their own ID
      if (user && user.role === 'staff') {
        const staffId = user.staffId || user.id;
        filters.staffId = staffId;
        console.log('👤 STAFF FILTER FORZADO para usuario staff:', staffId, '(staffId:', user.staffId, ', userId:', user.id, ')');
      } else if (staffFilter) {
        filters.staffId = staffFilter;
        console.log('👤 Staff filter aplicado:', staffFilter);
      }
      
      // Add search term if exists
      if (searchTerm) {
        filters.search = searchTerm;
        console.log('🔍 Search term aplicado:', searchTerm);
      }
      
      // Add status filter based on active tab
      if (activeTab !== "1") {
        const statusMap: any = {
          '2': 'completed',
          '3': 'pending',
          '4': 'cancelled',
          '5': 'in_progress'
        };
        if (statusMap[activeTab]) {
          filters.status = statusMap[activeTab];
          console.log('📊 Status filter aplicado:', filters.status);
        }
      }
      
      console.log('🚀 Enviando filtros finales:', filters);
      
      // Dispatch the search
      dispatch(onGetOrders(filters));
    }, 500); // 500ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchTerm, activeTab, currentPage, pageSize, customerFilter, staffFilter, user, dispatch]);

  useEffect(() => {
    // Always update order state to reflect current orders data
    setOrder(orders);
    // Reset edit mode when orders change
    setIsEdit(false);
  }, [orders]);


  const toggle = useCallback(async () => {
    if (modal) {
      setModal(false);
      setOrder(null);
      // Reset service editing states
      setSelectedService(null);
      setSelectedAddons([]);
      setSelectedRemovalAddons([]);
      setShowServiceEditor(false);
    } else {
      setModal(true);
      // Load all necessary data when opening modal
      try {
        const [staffData, servicesData, categoriesData, addonsData] = await Promise.all([
          getStaffList(),
          getServices(1, 100, undefined, undefined, true, i18n.language?.toUpperCase() === 'SP' ? 'ES' : 'EN'),
          getCategories(i18n.language?.toUpperCase() === 'SP' ? 'ES' : 'EN'),
          getAddOns(1, 100, true, undefined, undefined, i18n.language?.toUpperCase() === 'SP' ? 'ES' : 'EN')
        ]);
        
        setStaff(staffData);
        setAllServices(servicesData);
        setAllCategories(Array.isArray(categoriesData) ? categoriesData.filter((c: Category) => c.isActive) : []);
        setAllAddons(addonsData);
        
        // Group services by category
        const grouped: {[key: string]: Service[]} = {};
        servicesData.forEach((service: Service) => {
          if (!grouped[service.categoryId]) {
            grouped[service.categoryId] = [];
          }
          grouped[service.categoryId].push(service);
        });
        setServicesByCategory(grouped);
        
      } catch (error) {
        console.error('Error loading modal data:', error);
        toast.error('Error loading data');
        setStaff([]);
        setAllServices([]);
        setAllCategories([]);
        setAllAddons([]);
      }
    }
  }, [modal, i18n.language]);

  const toggleReservationModal = useCallback(() => {
    if (reservationModal) {
      setReservationModal(false);
      setReservationEvent({});
    } else {
      setReservationModal(true);
    }
  }, [reservationModal]);

  const submitOtherEvent = () => {
    // Esta función se usa para habilitar la edición en el modal
    setIsEditReservation(true);
  };

  // Handle time input changes to sync ordertime field
  // Calculate total duration including service, addons and buffer time
  const calculateTotalDuration = (service?: Service, addons?: AddonType[], removalAddons?: AddonType[]) => {
    let totalDuration = 0;
    
    // Use passed service or current selectedService
    const currentService = service || selectedService;
    // Use passed addons or current selected ones
    const currentAddons = addons || selectedAddons;
    const currentRemovalAddons = removalAddons || selectedRemovalAddons;
    
    // Add service duration + buffer time
    if (currentService) {
      const serviceDuration = currentService.duration || 0;
      // Use service buffer time or default to 15 minutes
      const bufferTime = currentService.bufferTime !== undefined ? currentService.bufferTime : 15;
      totalDuration += serviceDuration + bufferTime;
      
      console.log('🔍 Service Duration Calculation:');
      console.log('  - Service name:', currentService.name);
      console.log('  - Service duration:', serviceDuration, 'min');
      console.log('  - Buffer time:', bufferTime, 'min');
      console.log('  - Service subtotal:', serviceDuration + bufferTime, 'min');
    }
    
    // Add addons duration (both normal and removal addons)
    currentAddons.forEach(addon => {
      const addonTime = addon.additionalTime || 0;
      totalDuration += addonTime;
      console.log('  - Normal addon:', addon.name, 'Time:', addonTime, 'min');
    });
    
    currentRemovalAddons.forEach(addon => {
      const addonTime = addon.additionalTime || 0;
      totalDuration += addonTime;
      console.log('  - Removal addon:', addon.name, 'Time:', addonTime, 'min');
    });
    
    console.log('  - TOTAL DURATION:', totalDuration, 'min');
    return totalDuration;
  };

  // Update end time based on start time and total duration
  const updateEndTimeFromDuration = (service?: Service, addons?: AddonType[], removalAddons?: AddonType[]) => {
    const startTime = validation.values.startTime;
    if (!startTime) return;

    const totalDuration = calculateTotalDuration(service, addons, removalAddons);
    if (totalDuration <= 0) return;

    // Parse start time and add duration
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    // Add total duration in minutes
    const endDate = new Date(startDate.getTime() + (totalDuration * 60000));
    
    // Format end time as HH:mm
    const endTime = endDate.toTimeString().slice(0, 5);
    
    // Update the form values
    validation.setFieldValue('endTime', endTime);
    validation.setFieldValue('ordertime', `${startTime} - ${endTime}`);
  };

  const handleTimeInputChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    validation.handleChange(e);
    
    // If start time is changed and we have service selected, update end time automatically
    if (fieldName === 'startTime' && selectedService) {
      setTimeout(() => updateEndTimeFromDuration(selectedService || undefined, selectedAddons, selectedRemovalAddons), 100);
      return;
    }
    
    // Update the combined ordertime field for consistency
    setTimeout(() => {
      const currentStartTime = fieldName === 'startTime' ? value : validation.values.startTime;
      const currentEndTime = fieldName === 'endTime' ? value : validation.values.endTime;
      
      if (currentStartTime && currentEndTime) {
        validation.setFieldValue('ordertime', `${currentStartTime} - ${currentEndTime}`);
      } else if (currentStartTime) {
        validation.setFieldValue('ordertime', `${currentStartTime} - `);
      } else if (currentEndTime) {
        validation.setFieldValue('ordertime', ` - ${currentEndTime}`);
      } else {
        validation.setFieldValue('ordertime', '');
      }
    }, 0);
  };

  // Service and addon management functions
  const handleServiceChange = (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      // Clear addons when service changes as they may be incompatible
      setSelectedAddons([]);
      // Clear and reload removal addons specific to this service
      setSelectedRemovalAddons([]);
      loadRemovalAddonsForService(service.id);
      // Update the form values
      validation.setFieldValue('product', service.name);
      // Update amount based on service price only (removal addons will be updated when loaded)
      const newAmount = service.price;
      validation.setFieldValue('amount', newAmount);
      
      // Update end time based on new service duration - pass the service and cleared addons
      setTimeout(() => updateEndTimeFromDuration(service, [], []), 100);
    }
  };

  const handleAddonToggle = (addon: AddonType) => {
    const isSelected = selectedAddons.find(a => a.id === addon.id);
    let newAddons: AddonType[];
    
    if (isSelected) {
      // Remove addon
      newAddons = selectedAddons.filter(a => a.id !== addon.id);
    } else {
      // Add addon
      newAddons = [...selectedAddons, addon];
    }
    
    setSelectedAddons(newAddons);
    
    // Update amount based on service, addons, and removals
    if (selectedService) {
      const newAmount = selectedService.price + 
        newAddons.reduce((sum, addon) => sum + addon.price, 0) +
        selectedRemovalAddons.reduce((sum, addon) => sum + addon.price, 0);
      validation.setFieldValue('amount', newAmount);
    }
    
    // Update end time based on new addon selection - pass the updated addon list
    setTimeout(() => updateEndTimeFromDuration(selectedService || undefined, newAddons, selectedRemovalAddons), 100);
  };

  const getCompatibleAddons = (serviceId: string) => {
    if (!serviceId) return [];
    
    const compatibleAddons = allAddons.filter(addon => 
      addon.isActive && 
      !addon.removal && // Exclude removal addons
      (
        !addon.services || 
        addon.services.length === 0 ||
        addon.services.some(service => service.id === serviceId)
      )
    );
    
    return compatibleAddons;
  };

  const getCompatibleRemovalAddons = () => {
    return removalAddons.filter(addon => addon.isActive);
  };

  // Load removal addons specific to a service (following CreateBookingModal pattern)
  const loadRemovalAddonsForService = async (serviceId: string) => {
    if (!serviceId) {
      setRemovalAddons([]);
      return;
    }
    
    try {
      const response = await getRemovalAddonsByServices([serviceId]);
      setRemovalAddons(response || []);
    } catch (error) {
      console.error('Error loading removal addons:', error);
      setRemovalAddons([]);
    }
  };

  const handleRemovalAddonToggle = (addon: AddonType) => {
    const isSelected = selectedRemovalAddons.find(a => a.id === addon.id);
    let newRemovals: AddonType[];
    
    if (isSelected) {
      // Remove addon
      newRemovals = selectedRemovalAddons.filter(a => a.id !== addon.id);
    } else {
      // Add addon
      newRemovals = [...selectedRemovalAddons, addon];
    }
    
    setSelectedRemovalAddons(newRemovals);
    
    // Update amount based on service, addons, and removals
    if (selectedService) {
      const newAmount = selectedService.price + 
        selectedAddons.reduce((sum, addon) => sum + addon.price, 0) +
        newRemovals.reduce((sum, addon) => sum + addon.price, 0);
      validation.setFieldValue('amount', newAmount);
    }
    
    // Update end time based on new removal addon selection - pass the updated removal addon list
    setTimeout(() => updateEndTimeFromDuration(selectedService || undefined, selectedAddons, newRemovals), 100);
  };

  const handleOrderClick = useCallback(async (arg: any) => {
    const booking = arg;
    console.log('📋 Booking data from list:', booking);
    
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
      const bookingDetails = await getBookingById(booking.id);
      
      // 3. Fetch addon details if addOnIds exist
      let addons = [];
      if (bookingDetails.addOnIds && bookingDetails.addOnIds.length > 0) {
        const addonPromises = bookingDetails.addOnIds.map((addonId: string) => 
          getAddOn(addonId).catch(err => {
            console.error(`Failed to fetch addon ${addonId}:`, err);
            return null;
          })
        );
        const addonResults = await Promise.all(addonPromises);
        addons = addonResults.filter(addon => addon !== null);
        console.log('✅ Addons fetched:', addons);
      }
      
      // Extract numeric amount - use totalPrice directly as it's already in correct format
      let numericAmount = 0;
      
      
      if (booking.totalPrice) {
        // totalPrice from backend is already a decimal number (e.g., 30.00)
        // Keep original value without conversion
        numericAmount = Number(booking.totalPrice);
      } else if (booking.amount) {
        // Fallback to amount field
        if (typeof booking.amount === 'string') {
          numericAmount = parseFloat(booking.amount.replace(/[$,]/g, ''));
        } else if (typeof booking.amount === 'number') {
          numericAmount = booking.amount;
        }
      }
      
      // Usar las horas tal cual llegan del backend
      const startTime = booking.startTime || '';
      const endTime = booking.endTime || '';
      
      // Get staffId from bookingDetails (it comes directly from backend)
      const staffId = bookingDetails.staffId || '';
      
      // Find staff name from staffId if available
      let staffName = booking.staffName || '';
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
        setSelectedAddons(addons);
      } else {
        setSelectedAddons([]);
      }
      
      const orderData = {
        id: booking.id,
        orderId: booking.id,
        customer: booking.customer || booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        product: booking.product || booking.serviceName || '',
        categoryName: booking.categoryName || '',
        staffName: staffName,
        staffId: staffId,
        orderDate: booking.orderDate || booking.appointmentDate || '',
        ordertime: `${startTime} - ${endTime}`,
        amount: numericAmount,
        payment: (booking.payment === 'Pending' ? 'pending' : booking.payment) || booking.paymentMethod || 'pending',
        status: (booking.status || 'pending').toLowerCase(),
        notes: booking.notes || '',
        web: booking.web || false,
        cancellationReason: bookingDetails.cancellationReason || '',
        addons: addons, // Include fetched addons
        ...(bookingDetails.serviceId ? { serviceId: bookingDetails.serviceId } : {}) // Only include serviceId if it exists
      };
      
      console.log('📦 Order data to set:', orderData);
      console.log('🔍 CancellationReason in orderData:', orderData.cancellationReason);
      setOrder(orderData);
      setIsEdit(true);
      toggle();
    } catch (error) {
      console.error('❌ Error fetching booking details:', error);
      toast.error(t('reservations.error_loading_details'));
    }
  }, [toggle, t]);


  // Column
  const columns = useMemo(
    () => [
      {
        header: t("reservations.table.id"),
        accessorKey: "id",
        enableColumnFilter: false,
        size: 100,
        cell: (cell: any) => {
          const id = cell.getValue();
          
          const copyToClipboard = async (text: string) => {
            try {
              await navigator.clipboard.writeText(text);
              toast.success(t('reservations.id.copy_success'));
            } catch (err) {
              console.error('Error al copiar:', err);
              toast.error(t('reservations.id.copy_error'));
            }
          };
          
          return (
            <div className="d-flex align-items-center">
              <span 
                className="text-body fw-medium me-2" 
                title={t('reservations.id.copy_tooltip', { id: id || '' })}
                style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                onClick={() => id && copyToClipboard(id)}
              >
                {id ? id.substring(0, 8) + '...' : '-'}
              </span>
              {id && (
                <i 
                  className="ri-file-copy-line text-muted" 
                  style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                  onClick={() => copyToClipboard(id)}
                  title={t('reservations.id.copy_full_tooltip')}
                ></i>
              )}
            </div>
          );
        },
      },
      {
        header: t("reservations.table.customer"),
        accessorKey: "customer",
        enableColumnFilter: false,
        size: 150,
        cell: (cell: any) => {
          const customerName = cell.getValue();
          return (
            <div className="text-truncate" style={{ maxWidth: '140px' }} title={customerName || ''}>
              {customerName || '-'}
            </div>
          );
        },
      },
      {
        header: t("reservations.table.services"),
        accessorKey: "product",
        enableColumnFilter: false,
        size: 180,
        cell: (cell: any) => {
          const serviceName = cell.getValue();
          return (
            <div className="text-truncate" style={{ maxWidth: '170px' }} title={serviceName || ''}>
              {serviceName || '-'}
            </div>
          );
        },
      },
      {
        header: t("reservations.table.reservation_date"),
        accessorKey: "orderDate",
        enableColumnFilter: false,
        size: 140,
        cell: (cell: any) => {
          const row = cell.row.original;
          return (
            <div style={{ minWidth: '130px' }}>
              <div>{handleValidDate(cell.getValue())}</div>
              <small className="text-muted">{handleValidTime(row)}</small>
            </div>
          );
        },
      },
      {
        header: t("reservations.table.amount"),
        accessorKey: "amount",
        enableColumnFilter: false,
        size: 90,
        cell: (cell: any) => {
          const amount = cell.getValue();
          return (
            <div style={{ minWidth: '80px' }}>
              {amount || '-'}
            </div>
          );
        },
      },
      {
        header: t("reservations.table.staff"),
        accessorKey: "staffName",
        enableColumnFilter: false,
        size: 140,
        cell: (cell: any) => {
          const staffName = cell.getValue();
          return (
            <div className="text-truncate" style={{ maxWidth: '130px' }} title={staffName || ''}>
              {staffName || <span className="text-muted">-</span>}
            </div>
          );
        },
      },
      {
        header: t("reservations.table.status"),
        accessorKey: 'status',
        enableColumnFilter: false,
        size: 110,
        cell: (cell: any) => {
          const status = cell.getValue()?.toLowerCase();
          switch (status) {
            case "pendiente":
            case "pending":
              return <span className="badge text-uppercase bg-warning-subtle text-warning"> {t('reservations.status.pending')} </span>;
            case "cancelado":
            case "cancelled":
              return <span className="badge text-uppercase bg-danger-subtle text-danger"> {t('reservations.status.cancelled')} </span>;
            case "completado":
            case "completed":
            case "delivered":
              return <span className="badge text-uppercase bg-success-subtle text-success"> {t('reservations.status.completed')} </span>;
            case "in_progress":
            case "en_progreso":
            case "in progress":
              return <span className="badge text-uppercase bg-primary-subtle text-primary"> {t('reservations.status.in_progress')} </span>;
            case "no_show":
              return <span className="badge text-uppercase bg-secondary-subtle text-secondary"> {t('reservations.status.no_show')} </span>;
            default:
              return <span className="badge text-uppercase bg-warning-subtle text-warning"> {cell.getValue()} </span>;
          }
        }
      },

      {
        header: t("reservations.table.action"),
        size: 80,
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    const orderData = cellProps.row.original;
                    handleOrderClick(orderData);
                  }}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
            </ul>
          );
        },
      },
    ],
    [handleOrderClick, t]
  );

  const handleValidDate = (date: any) => {
    // Date comes as "2025-12-29" from backend
    if (!date) return '';
    
    const currentLang = i18n.language?.toLowerCase();
    if (currentLang === 'sp' || currentLang === 'es') {
      // Spanish format: day month year (15 Feb 2026)
      return moment(date).format("DD MMM YYYY");
    } else {
      // English format: month day, year (Feb 15, 2026)
      return moment(date).format("MMM DD, YYYY");
    }
  };

  const handleValidTime = (row: any) => {
    // Convert 24h format to 12h format with AM/PM
    const timeString = row?.startTime || '';
    if (!timeString) return '';
    
    // Parse the time string (assuming format like "14:30" or "14:30:00")
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) return timeString; // Return original if can't parse
    
    const hours24 = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    // Convert to 12h format
    const hours12 = hours24 === 0 ? 12 : (hours24 > 12 ? hours24 - 12 : hours24);
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    
    return `${hours12}:${minutes} ${ampm}`;
  };

  // Calculate which page numbers to show in pagination
  // Always shows exactly 7 page numbers (or total pages if less than 7)
  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || 0;
    const current = currentPage;
    const maxVisible = 7; // Always show 7 page numbers
    const rangeWithDots: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // If total pages is 7 or less, show all pages
      for (let i = 1; i <= totalPages; i++) {
        rangeWithDots.push(i);
      }
      return rangeWithDots;
    }

    // Calculate the start and end of the visible range
    let startPage = Math.max(1, current - 3);
    let endPage = Math.min(totalPages, current + 3);

    // Adjust if we're near the beginning
    if (current <= 4) {
      startPage = 1;
      endPage = maxVisible;
    }
    // Adjust if we're near the end
    else if (current >= totalPages - 3) {
      startPage = totalPages - maxVisible + 1;
      endPage = totalPages;
    }

    // Add first page and dots if needed
    if (startPage > 1) {
      rangeWithDots.push(1);
      if (startPage > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the main range
    for (let i = startPage; i <= endPage; i++) {
      rangeWithDots.push(i);
    }

    // Add dots and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Export Modal
  const [isExportCSV, setIsExportCSV] = useState<boolean>(false);

  document.title = t("common.page_title_reservations");
  return (
    <div className="page-content">
      <ExportCSVModal
        show={isExportCSV}
        onCloseClick={() => setIsExportCSV(false)}
        data={orders}
      />
      <Container fluid>
        <BreadCrumb title={t("reservations.title")} pageTitle={t("reservations.breadcrumb")} />
        <Row>
          <Col lg={12}>
            <Card id="orderList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">{t("reservations.list_title")}</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-success add-btn"
                        id="create-btn"
                        onClick={() => setCreateBookingModal(true)}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> {t("reservations.create_reservation")}
                      </button>{" "}
                      {/* <button type="button" className="btn btn-info" onClick={() => setIsExportCSV(true)}>
                        <i className="ri-file-download-line align-bottom me-1"></i>{" "}
                        {t("reservations.export")}
                      </button> */}
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
                  <Nav
                    className="nav-tabs nav-tabs-custom nav-success"
                    role="tablist"
                  >
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => {
                          toggleTab("1", "all");
                        }}
                        href="#"
                      >
                        <i className="ri-store-2-fill me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.all")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => {
                          toggleTab("2", "Completed");
                        }}
                        href="#"
                      >
                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.completed")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "3" })}
                        onClick={() => {
                          toggleTab("3", "Pending");
                        }}
                        href="#"
                      >
                        <i className="ri-time-line me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.pending")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "4" })}
                        onClick={() => {
                          toggleTab("4", "Cancelled");
                        }}
                        href="#"
                      >
                        <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.cancelled")}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "5" })}
                        onClick={() => {
                          toggleTab("5", "InProgress");
                        }}
                        href="#"
                      >
                        <i className="ri-play-circle-line me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.in_progress")}
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <div className="mb-3 mt-3">
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      <div className="search-box" style={{ width: '100%' }}>
                        <input
                          type="text"
                          className="form-control search"
                          placeholder={t('reservations.search_placeholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                      
                      {/* Indicación visual para usuarios staff */}
                      {user && user.role === 'staff' && (
                        <div className="badge bg-info-subtle text-info px-3 py-2">
                          <i className="ri-user-line me-1"></i>
                          {t('reservations.viewing_own_reservations')}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSearching ? (
                    <Loader />
                  ) : isOrderSuccess && orderList.length ? (
                    <>
                      <TableContainer
                        columns={columns}
                        data={(orderList || [])}
                        isGlobalFilter={false}
                        customPageSize={pageSize}
                        divClass="table-responsive table-card mb-1 mt-0"
                        tableClass="align-middle table-sm"
                        theadClass="table-light text-muted text-uppercase"
                        isOrderFilter={false}
                        isPagination={false}
                        onRowClick={handleOrderClick}
                      />
                      
                      {/* Custom server-side pagination */}
                      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                        <div className="col-sm">
                          <div className="text-muted">
                            Showing <span className="fw-semibold">{orderList.length}</span> of <span className="fw-semibold">{totalRecords}</span> results
                          </div>
                        </div>
                        <div className="col-sm-auto">
                          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                            <li className={`page-item ${!pagination?.hasPrevPage ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!pagination?.hasPrevPage}
                              >
                                Previous
                              </button>
                            </li>
                            {getPageNumbers().map((pageNum, idx) => {
                              if (pageNum === '...') {
                                return (
                                  <li key={`dots-${idx}`} className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                              return (
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(pageNum as number)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            })}
                            <li className={`page-item ${!pagination?.hasNextPage ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!pagination?.hasNextPage}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </div>
                      </Row>
                    </>
                  ) : !isSearching && isOrderSuccess && !orderList.length ? (
                    <div className="py-4 text-center">
                      <p className="text-muted">{t("reservations.no_data")}</p>
                    </div>
                  ) : !isSearching ? (
                    <Loader error={error} />
                  ) : null}
                </div>
                <Modal id="showModal" isOpen={modal} toggle={toggle} centered size="lg">
                  <ModalHeader className="bg-light p-3" toggle={toggle}>
                    {t("reservations.view_reservation")}
                  </ModalHeader>
                  <Form className="tablelist-form" onSubmit={(e: any) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                  }}>
                    <ModalBody>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.customer_name")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.customer || t("common.not_available")}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.phone")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.customerPhone || t("common.not_available")}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Label className="form-label fw-semibold">
                          {t("reservations.form.email")}
                        </Label>
                        <div className="text-muted">
                          {validation.values.customerEmail || t("common.not_available")}
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
                              {validation.values.product || t("common.not_available")}
                            </div>
                            
                            {/* Show addons if they exist */}
                            {order && order.addons && order.addons.length > 0 && (
                              <div className="mt-2">
                                <span className="text-muted small fw-semibold">{t("common.addons")}</span>
                                <ul className="list-unstyled ms-3 mb-0">
                                  {order.addons.map((addon: any) => (
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
                            
                            {/* Addons Selection - Multi-select with chips */}
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
                            
                            {/* Removal Addons Selection - Always visible */}
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
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.staffId || ""}
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
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.orderDate || ""}
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
                            onChange={handleTimeInputChange('startTime')}
                            onBlur={validation.handleBlur}
                            value={validation.values.startTime || ""}
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
                            onChange={handleTimeInputChange('endTime')}
                            onBlur={validation.handleBlur}
                            value={validation.values.endTime || ""}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.amount")}
                          </Label>
                          <div className="text-muted">
                            ${(validation.values.amount || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.source")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.web ? t("reservations.source.web") : t("reservations.source.backoffice")}
                          </div>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <Label
                            htmlFor="payment-field"
                            className="form-label fw-semibold"
                          >
                            {t("reservations.form.payment_method")}
                            {validation.values.status === 'completed' && <span className="text-danger"> *</span>}
                          </Label>
                          <Input
                            name="payment"
                            id="payment-field"
                            className={`form-select ${(validation.values.status === 'pending' || validation.values.status === 'in_progress' || validation.values.status === 'cancelled') ? 'text-muted bg-light' : ''}`}
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.payment || ""}
                            disabled={validation.values.status === 'pending' || validation.values.status === 'in_progress' || validation.values.status === 'cancelled'}
                            invalid={
                              validation.touched.payment && validation.errors.payment ? true : false
                            }
                          >
                            <option value="">{t("reservations.form.select_payment")}</option>
                            <option value="cash">{t("reservations.payment.cash")}</option>
                            <option value="card">{t("reservations.payment.card")}</option>
                            {(validation.values.status === 'pending' || validation.values.status === 'in_progress') && (
                              <option value="pending">{t("reservations.payment.pending")}</option>
                            )}
                            {validation.values.status === 'cancelled' && (
                              <option value="not_applicable">N/A</option>
                            )}
                          </Input>
                          {validation.touched.payment && validation.errors.payment ? (
                            <FormFeedback type="invalid">{validation.errors.payment}</FormFeedback>
                          ) : null}
                          {validation.values.status === 'completed' && (
                            <div className="form-text text-muted">
                              {t("reservations.form.payment_required_helper")}
                            </div>
                          )}
                          {validation.values.status === 'cancelled' && (
                            <div className="form-text text-muted">
                              {t("reservations.form.payment_not_applicable_helper", "Payment method is not applicable for cancelled reservations")}
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <Label
                            htmlFor="status-field"
                            className="form-label fw-semibold"
                          >
                            {t("reservations.form.status")}
                          </Label>
                          <Input
                            name="status"
                            type="select"
                            className="form-select"
                            id="status-field"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.status || ""}
                            invalid={
                              validation.touched.status && validation.errors.status ? true : false
                            }
                          >
                            <option value="">{t("reservations.form.select_status")}</option>
                            <option value="pending">{t("reservations.status.pending")}</option>
                            <option value="in_progress">{t("reservations.status.in_progress")}</option>
                            <option value="completed">{t("reservations.status.completed")}</option>
                            <option value="cancelled">{t("reservations.status.cancelled")}</option>
                          </Input>
                          {validation.touched.status && validation.errors.status ? (
                            <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                          ) : null}
                        </div>
                      </div>

                      {/* Cancellation Reason field - only show when status is cancelled */}
                      {validation.values.status === 'cancelled' && (
                        <div className="mb-3">
                          <Label
                            htmlFor="cancellation-reason-field"
                            className="form-label fw-semibold"
                          >
                            {t("reservations.form.cancellation_reason")}
                          </Label>
                          <Input
                            name="cancellationReason"
                            type="textarea"
                            className="form-control"
                            id="cancellation-reason-field"
                            placeholder={t("reservations.form.cancellation_reason_placeholder")}
                            rows={3}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.cancellationReason || ""}
                            invalid={
                              validation.touched.cancellationReason && validation.errors.cancellationReason ? true : false
                            }
                          />
                          {validation.touched.cancellationReason && validation.errors.cancellationReason ? (
                            <FormFeedback type="invalid">{validation.errors.cancellationReason}</FormFeedback>
                          ) : null}
                        </div>
                      )}

                      {validation.values.notes && (
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.notes")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.notes}
                          </div>
                        </div>
                      )}
                    </ModalBody>
                    <div className="modal-footer">
                      <div className="hstack gap-2 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={() => {
                            setModal(false);
                          }}
                        >
                          {t("common.close")}
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-success"
                          disabled={
                            validation.values.status === 'completed' && 
                            (!validation.values.payment || validation.values.payment === 'pending' || validation.values.payment === '')
                          }
                        >
                          {t("common.save_changes")}
                        </button>
                      </div>
                    </div>
                  </Form>
                </Modal>

                {/* ReservationModal for legacy calendar view */}
                <ReservationModal
                  modal={reservationModal}
                  toggle={toggleReservationModal}
                  isEdit={isEditReservation}
                  isEditButton={true}
                  eventName={eventName || reservationEvent.title || "Nueva Reserva"}
                  event={reservationEvent}
                  validation={reservationValidation}
                  submitOtherEvent={submitOtherEvent}
                />
                
                {/* Nuevo modal de creación de bookings con lógica completa */}
                <CreateBookingModal
                  isOpen={createBookingModal}
                  toggle={() => setCreateBookingModal(false)}
                  onBookingCreated={() => {
                    // Recargar bookings después de crear
                    const filters: any = {
                      page: currentPage,
                      limit: pageSize
                    };
                    if (customerFilter) filters.customerId = customerFilter;
                    // Para usuarios staff, siempre usar su propio ID
                    if (user && user.role === 'staff') {
                      const staffId = user.staffId || user.id;
                      filters.staffId = staffId;
                    } else if (staffFilter) {
                      filters.staffId = staffFilter;
                    }
                    if (searchTerm) filters.search = searchTerm;
                    dispatch(onGetOrders(filters));
                  }}
                />
                
                <ToastContainer closeButton={false} limit={1} />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceOrders;


