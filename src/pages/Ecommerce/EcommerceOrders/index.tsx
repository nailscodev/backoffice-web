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
  FormFeedback
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
import { servicesByCategory, staffMembers } from "../../../common/data/calender";
import { getBookingById } from "../../../api/bookings";
import { getAddOn } from "../../../api/addons";

// i18n
import { useTranslation } from 'react-i18next';

const EcommerceOrders = () => {
  const { t } = useTranslation();
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
  
  // Estados para ReservationModal
  const [reservationModal, setReservationModal] = useState<boolean>(false);
  const [reservationEvent, setReservationEvent] = useState<any>({});
  const [isEditReservation, setIsEditReservation] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  
  // Estado para CreateBookingModal (nuevo sistema)
  const [createBookingModal, setCreateBookingModal] = useState<boolean>(false);

  const dispatch: any = useDispatch();
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
    setOrderList(orders);
  }, [orders]);

  useEffect(() => {
    if (!isEmpty(orders)) setOrderList(orders);
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

  const toggleTab = (tab: any, type: any) => {
    if (activeTab !== tab) {
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
      orderDate: order?.orderDate || '',
      ordertime: order?.ordertime || '',
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
        .oneOf(["completed", "cancelled"], t("reservations.validation.status_only_completed_cancelled")),
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
    }).test('completed-validations', '', function(values) {
      const { status } = values;
      
      if (status === 'completed') {
        // Access form values correctly through this.from
        const formData = this.from?.[0]?.value;
        const amount = formData?.amount;
        const orderDate = formData?.orderDate;
        
        console.log('🔍 Validation - amount from formData:', amount, 'type:', typeof amount);
        console.log('🔍 Validation - orderDate:', orderDate);
        console.log('🔍 Validation - complete formData keys:', Object.keys(formData || {}));
        
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
          status: values.status
        };
        
        // Only include paymentMethod for completed bookings
        if (values.status === 'completed' && values.payment) {
          updatePayload.paymentMethod = values.payment.toUpperCase();
        }
        
        // For cancelled bookings, include cancellation reason
        if (values.status === 'cancelled' && values.cancellationReason) {
          updatePayload.cancellationReason = values.cancellationReason;
        }
        try {
          await dispatch(onUpdateOrder({ id: order.id, ...updatePayload }));
          // Refresh bookings after update
          const filters = {
            page: currentPage,
            limit: pageSize,
            ...(customerFilter ? { customerId: customerFilter } : {}),
            ...(staffFilter ? { staffId: staffFilter } : {}),
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

  // Debug: Log when order changes
  useEffect(() => {
    if (order) {
      console.log('🔄 Order state updated:', order);
      console.log('📝 Validation values:', validation.values);
      console.log('📝 CancellationReason from order:', order.cancellationReason);
      console.log('📝 CancellationReason from validation:', validation.values.cancellationReason);
      
      // Force formik to reinitialize with new values
      validation.setValues({
        orderId: order?.orderId || '',
        customer: order?.customer || '',
        customerEmail: order?.customerEmail || '',
        customerPhone: order?.customerPhone || '',
        product: order?.product || '',
        categoryName: order?.categoryName || '',
        staffName: order?.staffName || '',
        orderDate: order?.orderDate || '',
        ordertime: order?.ordertime || '',
        amount: order?.amount || 0,
        payment: order?.payment || '',
        status: order?.status || '',
        notes: order?.notes || '',
        web: order?.web || false,
        cancellationReason: order?.cancellationReason || '',
      });
    }
  }, [order]);

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
    if (orders && !orders.length) {
      dispatch(onGetOrders({}));
    }
  }, [dispatch]);

  // Debounce search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      const filters: any = {
        page: currentPage,
        limit: pageSize
      };
      
      // Add customer filter if exists
      if (customerFilter) {
        filters.customerId = customerFilter;
      }
      
      // Add staff filter if exists
      if (staffFilter) {
        filters.staffId = staffFilter;
      }
      
      // Add search term if exists
      if (searchTerm) {
        filters.search = searchTerm;
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
        }
      }
      
      // Dispatch the search
      dispatch(onGetOrders(filters));
    }, 500); // 500ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchTerm, activeTab, currentPage, pageSize, customerFilter, staffFilter, dispatch]);

  useEffect(() => {
    setOrder(orders);
  }, [orders]);

  useEffect(() => {
    if (!isEmpty(orders)) {
      setOrder(orders);
      setIsEdit(false);
    }
  }, [orders]);


  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setOrder(null);
    } else {
      setModal(true);
    }
  }, [modal]);

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

  const handleOrderClick = useCallback(async (arg: any) => {
    const booking = arg;
    console.log('📋 Booking data from list:', booking);
    
    try {
      // 1. Fetch full booking details by ID
      const bookingDetails = await getBookingById(booking.id);
      
      // 2. Fetch addon details if addOnIds exist
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
      
      const orderData = {
        id: booking.id,
        orderId: booking.id,
        customer: booking.customer || booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        product: booking.product || booking.serviceName || '',
        categoryName: booking.categoryName || '',
        staffName: booking.staffName || '',
        orderDate: booking.orderDate || booking.appointmentDate || '',
        ordertime: `${startTime} - ${endTime}`,
        amount: numericAmount,
        payment: (booking.payment === 'Pending' ? 'pending' : booking.payment) || booking.paymentMethod || 'pending',
        status: (booking.status || 'pending').toLowerCase(),
        notes: booking.notes || '',
        web: booking.web || false,
        cancellationReason: bookingDetails.cancellationReason || '',
        addons: addons // Include fetched addons
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
    return moment(date).format("DD MMM YYYY");
  };

  const handleValidTime = (row: any) => {
    // Mostrar la hora tal cual llega del backend, sin parseo ni conversión
    return row?.startTime || '';
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
                    <div className="d-flex gap-2 flex-wrap">
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
                    </div>
                  </div>

                  {isOrderSuccess && orderList.length ? (
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
                  ) : isOrderSuccess && !orderList.length ? (
                    <div className="py-4 text-center">
                      <p className="text-muted">{t("reservations.no_data")}</p>
                    </div>
                  ) : (
                    <Loader error={error} />
                  )}
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
                        <Label className="form-label fw-semibold">
                          {t("reservations.form.services")}
                        </Label>
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

                      <div className="mb-3">
                        <Label className="form-label fw-semibold">
                          {t("reservations.form.staff")}
                        </Label>
                        <div className="text-muted">
                          {validation.values.staffName || t("common.not_available")}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.reservation_date")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.orderDate || t("common.not_available")}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <Label className="form-label fw-semibold">
                            {t("reservations.form.time")}
                          </Label>
                          <div className="text-muted">
                            {validation.values.ordertime || t("common.not_available")}
                          </div>
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
                          </Label>
                          <Input
                            name="payment"
                            id="payment-field"
                            className="form-select"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.payment || ""}
                            invalid={
                              validation.touched.payment && validation.errors.payment ? true : false
                            }
                          >
                            <option value="">{t("reservations.form.select_payment")}</option>
                            <option value="cash">{t("reservations.payment.cash")}</option>
                            <option value="card">{t("reservations.payment.card")}</option>
                            <option value="pending">{t("reservations.payment.pending")}</option>
                          </Input>
                          {validation.touched.payment && validation.errors.payment ? (
                            <FormFeedback type="invalid">{validation.errors.payment}</FormFeedback>
                          ) : null}
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
                        <button type="submit" className="btn btn-success">
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
                    if (staffFilter) filters.staffId = staffFilter;
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


