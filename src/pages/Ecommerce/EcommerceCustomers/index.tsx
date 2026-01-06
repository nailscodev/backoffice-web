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
  FormFeedback,
  Spinner
} from "reactstrap";
import { Link } from "react-router-dom";
import moment from "moment";
import { useTranslation } from 'react-i18next';

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

//Import Breadcrumb
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import TableContainer from "../../../Components/Common/TableContainer";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
} from "../../../api/customers";

const EcommerceCustomers = () => {
  const { t } = useTranslation();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Delete customer
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setCustomer(null);
      validation.resetForm();
    } else {
      setModal(true);
    }
  }, [modal]);

  // Delete Data
  const onClickDelete = (customerData: Customer) => {
    setCustomer(customerData);
    setDeleteModal(true);
  };

  // validation
  const validation: any = useFormik({
    enableReinitialize: true,

    initialValues: {
      firstName: (customer && customer.firstName) || '',
      lastName: (customer && customer.lastName) || '',
      email: (customer && customer.email) || '',
      phone: (customer && customer.phone) || '',
      notes: (customer && customer.notes) || '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required(t('customers.validation.name_required')),
      lastName: Yup.string().required(t('customers.validation.name_required')),
      email: Yup.string().email('Email inválido').required(t('customers.validation.email_required')),
      phone: Yup.string().required(t('customers.validation.phone_required')),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && customer) {
          await updateCustomer(customer.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            notes: values.notes,
          });
          toast.success('Cliente actualizado exitosamente');
        } else {
          await createCustomer({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            notes: values.notes,
          });
          toast.success('Cliente creado exitosamente');
        }
        toggle();
        fetchCustomers();
      } catch (error: any) {
        console.error('Error saving customer:', error);
        toast.error(error.response?.data?.message || 'Error al guardar el cliente');
      }
    },
  });

  // Delete Data
  const handleDeleteCustomer = async () => {
    if (customer) {
      try {
        await deleteCustomer(customer.id);
        setDeleteModal(false);
        toast.success('Cliente eliminado exitosamente');
        fetchCustomers();
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  // Update Data
  const handleCustomerClick = useCallback((customerData: Customer) => {
    setCustomer(customerData);
    setIsEdit(true);
    toggle();
  }, [toggle]);

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

  const deleteMultiple = async () => {
    const checkall: any = document.getElementById("checkBoxAll");
    try {
      for (const element of selectedCheckBoxDelete) {
        await deleteCustomer(element.value);
      }
      setIsMultiDeleteButton(false);
      checkall.checked = false;
      toast.success('Clientes eliminados exitosamente');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customers:', error);
      toast.error('Error al eliminar clientes');
    }
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
        accessorKey: "firstName",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const customer = cell.row.original;
          return `${customer.firstName} ${customer.lastName}`;
        },
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
        accessorKey: "updatedAt",
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

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spinner color="primary" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
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
                      </div>
                    </div>
                  </Row>
                </CardHeader>
                <div className="card-body pt-0">
                  <div>
                    {customers && customers.length > 0 ? (
                      <TableContainer
                        columns={columns}
                        data={(customers || [])}
                        isGlobalFilter={true}
                        customPageSize={10}
                        theadClass="table-light text-muted"
                        SearchPlaceholder={t('customers.search_placeholder')}
                      />
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No hay clientes registrados</p>
                      </div>
                    )}
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
                            htmlFor="firstname-field"
                            className="form-label"
                          >
                            {t('customers.form.first_name')}
                          </Label>
                          <Input
                            name="firstName"
                            id="firstname-field"
                            className="form-control"
                            placeholder={t('customers.form.enter_first_name')}
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.firstName || ""}
                            invalid={
                              validation.touched.firstName && validation.errors.firstName ? true : false
                            }
                          />
                          {validation.touched.firstName && validation.errors.firstName ? (
                            <FormFeedback type="invalid">{validation.errors.firstName}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label
                            htmlFor="lastname-field"
                            className="form-label"
                          >
                            {t('customers.form.last_name')}
                          </Label>
                          <Input
                            name="lastName"
                            id="lastname-field"
                            className="form-control"
                            placeholder={t('customers.form.enter_last_name')}
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.lastName || ""}
                            invalid={
                              validation.touched.lastName && validation.errors.lastName ? true : false
                            }
                          />
                          {validation.touched.lastName && validation.errors.lastName ? (
                            <FormFeedback type="invalid">{validation.errors.lastName}</FormFeedback>
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
                          <Label htmlFor="notes-field" className="form-label">
                            {t('customers.form.notes')}
                          </Label>
                          <Input
                            name="notes"
                            type="textarea"
                            id="notes-field"
                            rows={3}
                            placeholder={t('customers.form.enter_notes')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.notes || ""}
                          />
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
