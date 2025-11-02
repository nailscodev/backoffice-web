import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  Modal,
  Form,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Label,
  Input,
  FormFeedback
} from "reactstrap";
import { Link } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import { isEmpty } from "lodash";
import moment from "moment";
import { useTranslation } from 'react-i18next';

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";


//Import Breadcrumb
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";

import {
  getCustomers as onGetCustomers,
  addNewCustomer as onAddNewCustomer,
  updateCustomer as onUpdateCustomer,
  deleteCustomer as onDeleteCustomer,
} from "../../../slices/thunks";

//redux
import { useSelector, useDispatch } from "react-redux";
import TableContainer from "../../../Components/Common/TableContainer";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../../../Components/Common/Loader";

// Export Modal
import ExportCSVModal from "../../../Components/Common/ExportCSVModal";
import { createSelector } from "reselect";

const EcommerceCustomers = () => {
  const dispatch: any = useDispatch();
  const { t } = useTranslation();

  const selectLayoutState = (state: any) => state.Ecommerce;
  const ecomCustomerProperties = createSelector(
    selectLayoutState,
    (ecom) => ({
      customers: ecom.customers,
      isCustomerSuccess: ecom.isCustomerSuccess,
      error: ecom.error,
    })
  );
  // Inside your component
  const {
    customers, isCustomerSuccess, error
  } = useSelector(ecomCustomerProperties);


  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [customer, setCustomer] = useState<any>([]);

  // Delete customer
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setCustomer(null);
    } else {
      setModal(true);
      // setDate(dateFormat());
    }
  }, [modal]);

  // Delete Data
  const onClickDelete = (customer: any) => {
    setCustomer(customer);
    setDeleteModal(true);
  };

  // validation
  const validation: any = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      customer: (customer && customer.customer) || '',
      email: (customer && customer.email) || '',
      phone: (customer && customer.phone) || '',
      date: (customer && customer.date) || '',
    },
    validationSchema: Yup.object({
      customer: Yup.string().required(t('customers.validation.name_required')),
      email: Yup.string().required(t('customers.validation.email_required')),
      phone: Yup.string().required(t('customers.validation.phone_required')),
      date: Yup.string().required(t('customers.validation.date_required')),
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateCustomer = {
          id: customer ? customer.id : 0,
          customer: values.customer,
          email: values.email,
          phone: values.phone,
          date: values.date,
        };
        // update customer
        dispatch(onUpdateCustomer(updateCustomer));
        validation.resetForm();
      } else {
        const newCustomer = {
          id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
          customer: values["customer"],
          email: values["email"],
          phone: values["phone"],
          date: values["date"],
        };
        // save new customer
        dispatch(onAddNewCustomer(newCustomer));
        validation.resetForm();
      }
      toggle();
    },
  });

  // Delete Data
  const handleDeleteCustomer = () => {
    if (customer) {
      dispatch(onDeleteCustomer(customer.id));
      setDeleteModal(false);
    }
  };

  // Update Data
  const handleCustomerClick = useCallback((arg: any) => {
    const customer = arg;

    setCustomer({
      id: customer.id,
      customer: customer.customer,
      email: customer.email,
      phone: customer.phone,
      date: customer.date,
    });

    setIsEdit(true);
    toggle();
  }, [toggle]);


  useEffect(() => {
    if (customers && !customers.length) {
      dispatch(onGetCustomers());
    }
  }, [dispatch, customers]);


  useEffect(() => {
    setCustomer(customers);
  }, [customers]);

  useEffect(() => {
    if (!isEmpty(customers)) {
      setCustomer(customers);
      setIsEdit(false);
    }
  }, [customers]);

  // Node API 
  // useEffect(() => {
  //   if (isCustomerCreated) {
  //     setCustomer(null);
  //     dispatch(onGetCustomers());
  //   }
  // }, [
  //   dispatch,
  //   isCustomerCreated,
  // ]);

  const handleValidDate = (date: any) => {
    const date1 = moment(new Date(date)).format("DD MMM Y");
    return date1;
  };

  // Checked All
  const checkedAll = useCallback(() => {
    const checkall: any = document.getElementById("checkBoxAll");
    const ele = document.querySelectorAll(".customerCheckBox");

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
      dispatch(onDeleteCustomer(element.value));
      setTimeout(() => { toast.clearWaitingQueue(); }, 3000);
    });
    setIsMultiDeleteButton(false);
    checkall.checked = false;
  };

  const deleteCheckbox = () => {
    const ele = document.querySelectorAll(".customerCheckBox:checked");
    ele.length > 0 ? setIsMultiDeleteButton(true) : setIsMultiDeleteButton(false);
    setSelectedCheckBoxDelete(ele);
  };

  // Customers Column
  const columns = useMemo(
    () => [
      {
        header: <input type="checkbox" id="checkBoxAll" className="form-check-input" onClick={() => checkedAll()} />,
        cell: (cell: any) => {
          return <input type="checkbox" className="customerCheckBox form-check-input" value={cell.getValue()} onChange={() => deleteCheckbox()} />;
        },
        id: '#',
        accessorKey: 'id',
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: t('customers.table.customer'),
        accessorKey: "customer",
        enableColumnFilter: false,
      },
      {
        header: t('customers.table.email'),
        accessorKey: "email",
        enableColumnFilter: false,
      },
      {
        header: t('customers.table.phone'),
        accessorKey: "phone",
        enableColumnFilter: false,
      },
      {
        header: t('customers.table.last_reservation'),
        accessorKey: "date",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <>
            {handleValidDate(cell.getValue())}
          </>
        ),
      },
      {
        header: t('customers.table.action'),
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item" title="Ver Reservas">
                <Link
                  to={`/apps-ecommerce-orders?customer=${cellProps.row.original.id}`}
                  className="btn btn-sm btn-soft-info"
                >
                  <i className="ri-calendar-check-line me-1 align-bottom"></i>
                  Ver Reservas
                </Link>
              </li>
              <li className="list-inline-item edit" title="Edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => { const customerData = cellProps.row.original; handleCustomerClick(customerData); }}
                >

                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item" title="Remove">
                <Link
                  to="#"
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => { const customerData = cellProps.row.original; onClickDelete(customerData); }}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li>
            </ul>
          );
        },
      },
    ],
    [handleCustomerClick, checkedAll, t]
  );

  // Export Modal
  const [isExportCSV, setIsExportCSV] = useState<boolean>(false);

  document.title = "Customers | Nails & Co Midtown - Admin Panel";
  return (
    <React.Fragment>
      <div className="page-content">
        <ExportCSVModal
          show={isExportCSV}
          onCloseClick={() => setIsExportCSV(false)}
          data={customers}
        />
        <DeleteModal
          show={deleteModal}
          onDeleteClick={handleDeleteCustomer}
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
          <BreadCrumb title={t('customers.title')} pageTitle={t('customers.breadcrumb')} />
          <Row>
            <Col lg={12}>
              <Card id="customerList">
                <CardHeader className="border-0">
                  <Row className="g-4 align-items-center">
                    <div className="col-sm">
                      <div>
                        <h5 className="card-title mb-0">{t('customers.list_title')}</h5>
                      </div>
                    </div>
                    <div className="col-sm-auto">
                      <div>
                        {isMultiDeleteButton && <button className="btn btn-soft-danger me-1"
                          onClick={() => setDeleteModalMulti(true)}
                        ><i className="ri-delete-bin-2-line"></i></button>}
                        <button
                          type="button"
                          className="btn btn-success add-btn me-1"
                          id="create-btn"
                          onClick={() => { setIsEdit(false); toggle(); }}
                        >
                          <i className="ri-add-line align-bottom me-1"></i> {t('customers.add_customer')}
                        </button>{" "}
                        <button type="button" className="btn btn-secondary" onClick={() => setIsExportCSV(true)}>
                          <i className="ri-file-download-line align-bottom me-1"></i>{" "}
                          {t('customers.export')}
                        </button>
                      </div>
                    </div>
                  </Row>
                </CardHeader>
                <div className="card-body pt-0">
                  <div>
                    {isCustomerSuccess && customers.length ? (
                      <TableContainer
                        columns={columns}
                        data={(customers || [])}
                        isGlobalFilter={true}
                        customPageSize={10}
                        isCustomerFilter={true}
                        theadClass="table-light text-muted"
                        SearchPlaceholder={t('customers.search_placeholder')}
                      />
                    ) : (<Loader error={error} />)
                    }
                  </div>

                  <Modal id="showModal" isOpen={modal} toggle={toggle} centered>
                    <ModalHeader className="bg-light p-3" toggle={toggle}>
                      {!!isEdit ? t('customers.edit_customer') : t('customers.add_customer')}
                    </ModalHeader>
                    <Form className="tablelist-form" onSubmit={(e: any) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}>
                      <ModalBody>
                        <input type="hidden" id="id-field" />

                        <div
                          className="mb-3"
                          id="modal-id"
                          style={{ display: "none" }}
                        >
                          <Label htmlFor="id-field1" className="form-label">
                            ID
                          </Label>
                          <Input
                            type="text"
                            id="id-field1"
                            className="form-control"
                            placeholder="ID"
                            readOnly
                          />
                        </div>

                        <div className="mb-3">
                          <Label
                            htmlFor="customername-field"
                            className="form-label"
                          >
                            {t('customers.form.customer_name')}
                          </Label>
                          <Input
                            name="customer"
                            id="customername-field"
                            className="form-control"
                            placeholder={t('customers.form.enter_name')}
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
                          <Label htmlFor="email-field" className="form-label">
                            {t('customers.form.email')}
                          </Label>
                          <Input
                            name="email"
                            type="email"
                            id="email-field"
                            placeholder={t('customers.form.enter_email')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.email || ""}
                            invalid={
                              validation.touched.email && validation.errors.email ? true : false
                            }
                          />
                          {validation.touched.email && validation.errors.email ? (
                            <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                          ) : null}

                        </div>

                        <div className="mb-3">
                          <Label htmlFor="phone-field" className="form-label">
                            {t('customers.form.phone')}
                          </Label>
                          <Input
                            name="phone"
                            type="text"
                            id="phone-field"
                            placeholder={t('customers.form.enter_phone')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.phone || ""}
                            invalid={
                              validation.touched.phone && validation.errors.phone ? true : false
                            }
                          />
                          {validation.touched.phone && validation.errors.phone ? (
                            <FormFeedback type="invalid">{validation.errors.phone}</FormFeedback>
                          ) : null}

                        </div>

                        <div className="mb-3">
                          <Label htmlFor="date-field" className="form-label">
                            {t('customers.form.last_reservation')}
                          </Label>

                          <Flatpickr
                            name="date"
                            id="date-field"
                            className="form-control"
                            placeholder={t('customers.form.select_date')}
                            options={{
                              altInput: true,
                              altFormat: "d M, Y",
                              dateFormat: "d M, Y",
                            }}

                            onChange={(date: any) => validation.setFieldValue("date", moment(date[0]).format("DD MMMM ,YYYY"))}
                            value={validation.values.date || ''}
                          />
                          {validation.errors.date && validation.touched.date ? (
                            <FormFeedback type="invalid" className='d-block'>{validation.errors.date}</FormFeedback>
                          ) : null}
                        </div>
                      </ModalBody>
                      <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                          <button type="button" className="btn btn-light" onClick={() => { setModal(false); }}> {t('customers.form.close')} </button>

                          <button type="submit" className="btn btn-success"> {!!isEdit ? t('customers.form.update') : t('customers.add_customer')} </button>
                        </div>
                      </ModalFooter>
                    </Form>
                  </Modal>
                  <ToastContainer closeButton={false} limit={1} />
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default EcommerceCustomers;
