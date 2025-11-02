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
import { Link } from "react-router-dom";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
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
  deleteOrder as onDeleteOrder,
} from "../../../slices/thunks";

import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createSelector } from "reselect";
import moment from "moment";

// i18n
import { useTranslation } from 'react-i18next';

const EcommerceOrders = () => {
  const { t } = useTranslation();

  const [modal, setModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("1");

  const dispatch: any = useDispatch();
  const selectLayoutState = (state: any) => state.Ecommerce;
  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (ecom) => ({
      orders: ecom.orders,
      isOrderSuccess: ecom.isOrderSuccess,
      error: ecom.error,
    })
  );
  // Inside your component
  const {
    orders, isOrderSuccess, error
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

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);

  const onClickDelete = (order: any) => {
    setOrder(order);
    setDeleteModal(true);
  };

  const handleDeleteOrder = () => {
    if (order) {
      dispatch(onDeleteOrder(order.id));
      setDeleteModal(false);
    }
  };

  useEffect(() => {
    setOrderList(orders);
  }, [orders]);

  useEffect(() => {
    if (!isEmpty(orders)) setOrderList(orders);
  }, [orders]);

  const toggleTab = (tab: any, type: any) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      let filteredOrders = orders;
      if (type !== "all") {
        filteredOrders = orders.filter((order: any) => order.status === type);
      }
      setOrderList(filteredOrders);
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

  useEffect(() => {
    if (orders && !orders.length) {
      dispatch(onGetOrders());
    }
  }, [dispatch, orders]);

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
    deleteCheckbox();
  }, []);

  // Delete Multiple
  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState<any>([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState<boolean>(false);

  const deleteMultiple = () => {
    const checkall: any = document.getElementById("checkBoxAll");
    selectedCheckBoxDelete.forEach((element: any) => {
      dispatch(onDeleteOrder(element.value));
      setTimeout(() => { toast.clearWaitingQueue(); }, 3000);
    });
    setIsMultiDeleteButton(false);
    checkall.checked = false;
  };

  const deleteCheckbox = () => {
    const ele = document.querySelectorAll(".orderCheckBox:checked");
    ele.length > 0 ? setIsMultiDeleteButton(true) : setIsMultiDeleteButton(false);
    setSelectedCheckBoxDelete(ele);
  };


  // Column
  const columns = useMemo(
    () => [
      {
        header: <input type="checkbox" id="checkBoxAll" className="form-check-input" onClick={() => checkedAll()} />,
        cell: (cell: any) => {
          return <input type="checkbox" className="orderCheckBox form-check-input" value={cell.getValue()} onChange={() => deleteCheckbox()} />;
        },
        id: '#',
        accessorKey: 'id',
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: t("reservations.table.reservation_id"),
        accessorKey: "orderId",
        enableColumnFilter: false,
        cell: (cell: any) => {
          return <Link to="/apps-ecommerce-order-details" className="fw-medium link-primary">{cell.getValue()}</Link>;
        },
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
        cell: (cell: any) => (
          <>
            {handleValidDate(cell.getValue())},
            <small className="text-muted"> {handleValidTime(cell.getValue())}</small>
          </>
        ),
      },
      {
        header: t("reservations.table.amount"),
        accessorKey: "amount",
        enableColumnFilter: false,
      },
      {
        header: t("reservations.table.payment_method"),
        accessorKey: "payment",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const paymentValue = cell.getValue();
          if (paymentValue === "Bank" || paymentValue === "Banco") {
            return t('reservations.payment.bank');
          } else if (paymentValue === "Cash" || paymentValue === "Efectivo") {
            return t('reservations.payment.cash');
          }
          return paymentValue;
        },
      },
      {
        header: t("reservations.table.status"),
        accessorKey: 'status',
        enableColumnFilter: false,
        cell: (cell: any) => {
          switch (cell.getValue()) {
            case "Pendiente":
            case "Pending":
              return <span className="badge text-uppercase bg-warning-subtle text-warning"> {t('reservations.status.pending')} </span>;
            case "Cancelado":
            case "Cancelled":
              return <span className="badge text-uppercase bg-danger-subtle text-danger"> {t('reservations.status.cancelled')} </span>;
            case "Completado":
            case "Completed":
            case "Delivered":
              return <span className="badge text-uppercase bg-success-subtle text-success"> {t('reservations.status.completed')} </span>;
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
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => {
                    const orderData = cellProps.row.original;
                    onClickDelete(orderData);
                  }}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
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
    const date1 = moment(new Date(date)).format("DD MMM Y");
    return date1;
  };

  const handleValidTime = (time: any) => {
    const time1 = new Date(time);
    const getHour = time1.getUTCHours();
    const getMin = time1.getUTCMinutes();
    const getTime = `${getHour}:${getMin}`;
    var meridiem = "";
    if (getHour >= 12) {
      meridiem = "PM";
    } else {
      meridiem = "AM";
    }
    const updateTime = moment(getTime, 'hh:mm').format('hh:mm') + " " + meridiem;
    return updateTime;
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteOrder}
        onCloseClick={() => setDeleteModal(false)}
      />
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={() => {
          deleteMultiple();
          setDeleteModalMulti(false);
        }}
        onCloseClick={() => setDeleteModalMulti(false)}
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
                        onClick={() => { setIsEdit(false); toggle(); }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> {t("reservations.create_reservation")}
                      </button>{" "}
                      <button type="button" className="btn btn-info" onClick={() => setIsExportCSV(true)}>
                        <i className="ri-file-download-line align-bottom me-1"></i>{" "}
                        {t("reservations.export")}
                      </button>
                      {" "}
                      {isMultiDeleteButton && <button className="btn btn-soft-danger"
                        onClick={() => setDeleteModalMulti(true)}
                      ><i
                        className="ri-delete-bin-2-line"></i></button>}
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

                  {isOrderSuccess && orderList.length ? (
                    <TableContainer
                      columns={columns}
                      data={(orderList || [])}
                      isGlobalFilter={true}
                      customPageSize={8}
                      divClass="table-responsive table-card mb-1 mt-0"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted text-uppercase"
                      isOrderFilter={true}
                      SearchPlaceholder={t('reservations.search_placeholder')}
                    />
                  ) : (<Loader error={error} />)
                  }
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


