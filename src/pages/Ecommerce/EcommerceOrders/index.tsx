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
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import ReservationModal from "../../../Components/Common/ReservationModal";
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

// i18n
import { useTranslation } from 'react-i18next';

const EcommerceOrders = () => {
  const { t } = useTranslation();
  const location = useLocation();

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
  const [order, setOrder] = useState<any>([]);

  const orderstatus = [
    {
      options: [
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
      orderId: (order && order.orderId) || '',
      customer: (order && order.customer) || '',
      product: (order && order.product) || '',
      orderDate: (order && order.orderDate) || '',
      amount: (order && order.amount) || '',
      payment: (order && order.payment) || '',
      status: (order && order.status) || '',
    },
    validationSchema: Yup.object({
      orderId: Yup.string().required(t("reservations.validation.id_required")),
      customer: Yup.string().required(t("reservations.validation.customer_required")),
      product: Yup.string().required(t("reservations.validation.services_required")),
      orderDate: Yup.string().required(t("reservations.validation.date_required")),
      amount: Yup.string().required(t("reservations.validation.amount_required")),
      payment: Yup.string().required(t("reservations.validation.payment_required")),
      status: Yup.string().required(t("reservations.validation.status_required"))
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateOrder = {
          id: order ? order.id : 0,
          orderId: values.orderId,
          customer: values.customer,
          product: values.product,
          orderDate: values.orderDate,
          amount: values.amount,
          payment: values.payment,
          status: values.status
        };
        // update order
        dispatch(onUpdateOrder(updateOrder));
        validation.resetForm();
      } else {
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
        // save new order
        dispatch(onAddNewOrder(newOrder));
        validation.resetForm();
      }
      toggle();
    },
  });

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
      defaultDate: Yup.array().of(Yup.date()).required(t('calendar.validation.date_required')).min(1, 'Select a date'),
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
          '4': 'cancelled'
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

  const handleOrderClick = useCallback((arg: any) => {
    const order = arg;
    setOrder({
      id: order.id,
      orderId: order.orderId,
      customer: order.customer,
      product: order.product,
      orderDate: order.orderDate,
      ordertime: order.ordertime,
      amount: order.amount,
      payment: order.payment,
      status: order.status
    });

    setIsEdit(true);
    toggle();
  }, [toggle]);


  // Checked All
  const checkedAll = useCallback(() => {
    const checkall: any = document.getElementById("checkBoxAll");
    const ele = document.querySelectorAll(".orderCheckBox");
    if (checkall.checked) {
      ele.forEach((ele: any) => {
        ele.checked = true;
      });
    } else {
      ele.forEach((ele: any) => {
        ele.checked = false;
      });
    }
  }, []);


  // Column
  const columns = useMemo(
    () => [
      {
        header: <input type="checkbox" id="checkBoxAll" className="form-check-input" onClick={() => checkedAll()} />,
        cell: (cell: any) => {
          return <input type="checkbox" className="orderCheckBox form-check-input" value={cell.getValue()} />;
        },
        id: '#',
        accessorKey: 'id',
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: t("reservations.table.customer"),
        accessorKey: "customer",
        enableColumnFilter: false,
      },
      {
        header: t("reservations.table.services"),
        accessorKey: "product",
        enableColumnFilter: false,
      },
      {
        header: t("reservations.table.reservation_date"),
        accessorKey: "orderDate",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const row = cell.row.original;
          return (
            <>
              {handleValidDate(cell.getValue())},
              <small className="text-muted"> {handleValidTime(row)}</small>
            </>
          );
        },
      },
      {
        header: t("reservations.table.amount"),
        accessorKey: "amount",
        enableColumnFilter: false,
      },
      {
        header: t("reservations.table.staff"),
        accessorKey: "staffName",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const staffName = cell.getValue();
          return staffName || <span className="text-muted">-</span>;
        },
      },
      {
        header: t("reservations.table.status"),
        accessorKey: 'status',
        enableColumnFilter: false,
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
            case "confirmed":
            case "confirmado":
              return <span className="badge text-uppercase bg-info-subtle text-info"> {status} </span>;
            case "no_show":
              return <span className="badge text-uppercase bg-secondary-subtle text-secondary"> No Show </span>;
            default:
              return <span className="badge text-uppercase bg-warning-subtle text-warning"> {cell.getValue()} </span>;
          }
        }
      },

      {
        header: t("reservations.table.action"),
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item">
                <Link
                  to="/apps-ecommerce-order-details"
                  className="text-primary d-inline-block"
                >
                  <i className="ri-eye-fill fs-16"></i>
                </Link>
              </li>
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
    [handleOrderClick, checkedAll, t]
  );

  const handleValidDate = (date: any) => {
    // Date comes as "2025-12-29" from backend
    if (!date) return '';
    return moment(date).format("DD MMM YYYY");
  };

  const handleValidTime = (row: any) => {
    // startTime comes as "13:00:00" from backend
    const timeValue = row?.startTime;
    
    if (!timeValue) return '';
    
    try {
      // Parse HH:MM:SS format
      const [hours24, minutes] = timeValue.split(':');
      const hour24 = parseInt(hours24);
      const min = parseInt(minutes);
      
      const hours = hour24 % 12 || 12;
      const minutesStr = min < 10 ? `0${min}` : min;
      const meridiem = hour24 >= 12 ? "PM" : "AM";
      
      return `${hours}:${minutesStr} ${meridiem}`;
    } catch (error) {
      console.error('Error parsing time:', error);
      return '';
    }
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

  document.title = "Reservas | Nails & Co Midtown - Admin Panel";
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
                        onClick={() => { 
                          setIsEditReservation(false); 
                          setReservationEvent({});
                          toggleReservationModal(); 
                        }}
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
                        className={classnames(
                          { active: activeTab === "1" })}
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
                        className={classnames(
                          { active: activeTab === "2" })}
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
                        className={classnames(
                          { active: activeTab === "3" })}
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
                        className={classnames(
                          { active: activeTab === "4" })}
                        onClick={() => {
                          toggleTab("4", "Cancelled");
                        }}
                        href="#"
                      >
                        <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                        {t("reservations.tabs.cancelled")}
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <div className="mb-3 mt-3">
                    <div className="search-box">
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

                  {isOrderSuccess && orderList.length ? (
                    <>
                      <TableContainer
                        columns={columns}
                        data={(orderList || [])}
                        isGlobalFilter={false}
                        customPageSize={pageSize}
                        divClass="table-responsive table-card mb-1 mt-0"
                        tableClass="align-middle table-nowrap"
                        theadClass="table-light text-muted text-uppercase"
                        isOrderFilter={false}
                        isPagination={false}
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
                <Modal id="showModal" isOpen={modal} toggle={toggle} centered>
                  <ModalHeader className="bg-light p-3" toggle={toggle}>
                    {!!isEdit ? t("reservations.edit_reservation") : t("reservations.create_reservation")}
                  </ModalHeader>
                  <Form className="tablelist-form" onSubmit={(e: any) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                  }}>
                    <ModalBody>
                      <input type="hidden" id="id-field" />

                      <div className="mb-3">
                        <Label
                          htmlFor="id-field"
                          className="form-label"
                        >
                          {t("reservations.form.reservation_id")}
                        </Label>
                        <Input
                          name="orderId"
                          id="id-field"
                          className="form-control"
                          placeholder={t("reservations.form.enter_id")}
                          type="text"
                          validate={{
                            required: { value: true },
                          }}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.orderId || ""}
                          invalid={
                            validation.touched.orderId && validation.errors.orderId ? true : false
                          }
                        />
                        {validation.touched.orderId && validation.errors.orderId ? (
                          <FormFeedback type="invalid">{validation.errors.orderId}</FormFeedback>
                        ) : null}

                      </div>

                      <div className="mb-3">
                        <Label
                          htmlFor="customername-field"
                          className="form-label"
                        >
                          {t("reservations.form.customer_name")}
                        </Label>
                        <Input
                          name="customer"
                          id="customername-field"
                          className="form-control"
                          placeholder={t("reservations.form.enter_name")}
                          type="text"
                          validate={{
                            required: { value: true },
                          }}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.customer || ""}
                          invalid={
                            validation.touched.customer && validation.errors.customer ? true : false
                          }
                        />
                        {validation.touched.customer && validation.errors.customer ? (
                          <FormFeedback type="invalid">{validation.errors.customer}</FormFeedback>
                        ) : null}

                      </div>

                      <div className="mb-3">
                        <Label
                          htmlFor="productname-field"
                          className="form-label"
                        >
                          {t("reservations.form.services")}
                        </Label>

                        <Input
                          name="product"
                          type="select"
                          className="form-select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.product || ""}
                          invalid={
                            validation.touched.product && validation.errors.product ? true : false
                          }
                        >
                          {productname.map((item, key) => (
                            <React.Fragment key={key}>
                              {item.options.map((item, key) => (<option value={item.value} key={key}>{item.label}</option>))}
                            </React.Fragment>
                          ))}
                        </Input>
                        {validation.touched.product && validation.errors.product ? (
                          <FormFeedback type="invalid">{validation.errors.product}</FormFeedback>
                        ) : null}
                      </div>

                      <div className="mb-3">
                        <Label htmlFor="date-field" className="form-label">
                          {t("reservations.form.reservation_date")}
                        </Label>

                        <Flatpickr
                          name="orderDate"
                          className="form-control"
                          id="datepicker-publish-input"
                          placeholder={t("reservations.form.select_date")}
                          options={{
                            enableTime: true,
                            altInput: true,
                            altFormat: "d M, Y, G:i K",
                            dateFormat: "d M, Y, G:i K",
                          }}
                          onChange={(orderDate: any) => validation.setFieldValue("orderDate", moment(orderDate[0]).format("DD MMMM ,YYYY"))}
                          value={validation.values.orderDate || ''}
                        />
                        {validation.errors.orderDate && validation.touched.orderDate ? (
                          <FormFeedback type="invalid" className='d-block'>{validation.errors.orderDate}</FormFeedback>
                        ) : null}
                      </div>

                      <div className="row gy-4 mb-3">
                        <div className="col-md-6">
                          <div>
                            <Label
                              htmlFor="amount-field"
                              className="form-label"
                            >
                              {t("reservations.form.amount")}
                            </Label>
                            <Input
                              name="amount"
                              type="text"
                              placeholder={t("reservations.form.enter_amount")}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.amount || ""}
                              invalid={
                                validation.touched.amount && validation.errors.amount ? true : false
                              }
                            />
                            {validation.touched.amount && validation.errors.amount ? (
                              <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                            ) : null}

                          </div>
                        </div>
                        <div className="col-md-6">
                          <div>
                            <Label
                              htmlFor="payment-field"
                              className="form-label"
                            >
                              {t("reservations.form.payment_method")}
                            </Label>

                            <Input
                              name="payment"
                              type="select"
                              className="form-select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={
                                validation.values.payment || ""
                              }
                              invalid={
                                validation.touched.payment && validation.errors.payment ? true : false
                              }
                            >
                              {orderpayement.map((item, key) => (
                                <React.Fragment key={key}>
                                  {item.options.map((item, key) => (<option value={item.value} key={key}>{item.label}</option>))}
                                </React.Fragment>
                              ))}
                            </Input>
                            {validation.touched.payment && validation.errors.payment ? (
                              <FormFeedback type="invalid">{validation.errors.payment}</FormFeedback>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="delivered-status"
                          className="form-label"
                        >
                          {t("reservations.form.status")}
                        </Label>

                        <Input
                          name="status"
                          type="select"
                          className="form-select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={
                            validation.values.status || ""
                          }
                          invalid={
                            validation.touched.status && validation.errors.status ? true : false
                          }
                        >
                          {orderstatus.map((item, key) => (
                            <React.Fragment key={key}>
                              {item.options.map((item, key) => (<option value={item.value} key={key}>{item.label}</option>))}
                            </React.Fragment>
                          ))}
                        </Input>
                        {validation.touched.status && validation.errors.status ? (
                          <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                        ) : null}
                      </div>
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
                          {t("reservations.form.close")}
                        </button>

                        <button type="submit" className="btn btn-success">
                          {!!isEdit
                            ? t("reservations.form.update")
                            : t("reservations.form.add_reservation")}
                        </button>
                      </div>
                    </div>
                  </Form>
                </Modal>
                
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


