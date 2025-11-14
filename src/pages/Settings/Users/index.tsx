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
  Button
} from "reactstrap";
import { Link } from "react-router-dom";
import { isEmpty } from "lodash";
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

const UserManagement = () => {
  const { t } = useTranslation();

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([
    // Datos de ejemplo - TODO: Conectar con API
    {
      id: 1,
      first_name: "Admin",
      last_name: "User",
      email: "admin@nailsco.com",
      role: "admin",
      status: "active"
    },
    {
      id: 2,
      first_name: "Manager",
      last_name: "Smith",
      email: "manager@nailsco.com",
      role: "manager",
      status: "active"
    }
  ]);

  // Delete user
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setUser(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  // Delete Data
  const onClickDelete = (user: any) => {
    setUser(user);
    setDeleteModal(true);
  };

  // validation
  const validation: any = useFormik({
    enableReinitialize: true,

    initialValues: {
      first_name: (user && user.first_name) || '',
      last_name: (user && user.last_name) || '',
      email: (user && user.email) || '',
      password: '',
      role: (user && user.role) || 'staff',
      status: (user && user.status) || 'active',
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required(t('settings.users.form.first_name') + ' is required'),
      last_name: Yup.string().required(t('settings.users.form.last_name') + ' is required'),
      email: Yup.string().email('Invalid email').required(t('settings.users.form.email') + ' is required'),
      password: isEdit ? Yup.string() : Yup.string().required(t('settings.users.form.password') + ' is required'),
      role: Yup.string().required(t('settings.users.form.role') + ' is required'),
      status: Yup.string().required(t('settings.users.form.status') + ' is required'),
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateUser = {
          id: user ? user.id : 0,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        // Update user in the list
        setUsers(users.map(u => u.id === updateUser.id ? updateUser : u));
        toast.success(t('User updated successfully'), { autoClose: 3000 });
      } else {
        const newUser = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        // Add new user to the list
        setUsers([...users, newUser]);
        toast.success(t('User created successfully'), { autoClose: 3000 });
      }
      validation.resetForm();
      toggle();
    },
  });

  // Delete Data
  const handleDeleteUser = () => {
    if (user) {
      setUsers(users.filter(u => u.id !== user.id));
      setDeleteModal(false);
      toast.success(t('User deleted successfully'), { autoClose: 3000 });
    }
  };

  // Update Data
  const handleUserClick = useCallback((arg: any) => {
    const user = arg;

    setUser({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    setIsEdit(true);
    toggle();
  }, [toggle]);

  // Add button
  const handleUserClicks = () => {
    setUser(null);
    setIsEdit(false);
    toggle();
  };

  // Columns
  const columns = useMemo(
    () => [
      {
        header: t('settings.users.table.name'),
        accessorKey: "name",
        enableColumnFilter: false,
        cell: (cell: any) => {
          return (
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                     style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {cell.row.original.first_name.charAt(0)}{cell.row.original.last_name.charAt(0)}
                </div>
              </div>
              <div className="flex-grow-1 ms-2">
                <h5 className="fs-14 mb-0">
                  <Link to="#" className="text-dark">{cell.row.original.first_name} {cell.row.original.last_name}</Link>
                </h5>
              </div>
            </div>
          );
        },
      },
      {
        header: t('settings.users.table.email'),
        accessorKey: "email",
        enableColumnFilter: false,
      },
      {
        header: t('settings.users.table.role'),
        accessorKey: "role",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const roleKey = `settings.users.role.${cell.getValue()}`;
          return <span className="badge badge-soft-primary">{t(roleKey)}</span>;
        },
      },
      {
        header: t('settings.users.table.status'),
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const statusKey = `settings.users.status.${cell.getValue()}`;
          const badgeClass = cell.getValue() === "active" ? "badge-soft-success" : "badge-soft-danger";
          return <span className={`badge ${badgeClass}`}>{t(statusKey)}</span>;
        },
      },
      {
        header: t('settings.users.table.actions'),
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit" title="Edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    const userData = cellProps.row.original;
                    handleUserClick(userData);
                  }}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item" title="Remove">
                <Link
                  to="#"
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => {
                    const userData = cellProps.row.original;
                    onClickDelete(userData);
                  }}
                >
                  <i className="ri-delete-bin-fill fs-16"></i>
                </Link>
              </li>
            </ul>
          );
        },
      },
    ],
    [handleUserClick, t]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('settings.users.title')} pageTitle={t('menu.admin.settings.title')} />
          <Row>
            <Col lg={12}>
              <Card id="customerList">
                <CardHeader className="border-0 mb-3">
                  <Row className="g-4 align-items-center">
                    <Col sm={3}>
                      <div className="search-box">
                        <Input
                          type="text"
                          className="form-control search"
                          placeholder={t('settings.users.search_placeholder')}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                    </Col>
                    <div className="col-sm-auto ms-auto">
                      <div className="hstack gap-2">
                        <Button
                          color="success"
                          className="add-btn"
                          onClick={() => handleUserClicks()}
                          id="create-btn"
                        >
                          <i className="ri-add-line align-bottom me-1"></i> {t('settings.users.add_user')}
                        </Button>
                      </div>
                    </div>
                  </Row>
                </CardHeader>
                <div className="card-body pt-0">
                  <div>
                    <TableContainer
                      columns={columns}
                      data={users || []}
                      isGlobalFilter={false}
                      customPageSize={10}
                      divClass="table-responsive table-card mb-1"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted"
                    />
                  </div>

                  <Modal id="showModal" isOpen={modal} toggle={toggle} centered>
                    <ModalHeader className="bg-light p-3" toggle={toggle}>
                      {!!isEdit ? t('settings.users.edit_user') : t('settings.users.add_user')}
                    </ModalHeader>

                    <Form className="tablelist-form" onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}>
                      <ModalBody>
                        <input type="hidden" id="id-field" />

                        <div className="mb-3">
                          <Label htmlFor="first_name-field" className="form-label">{t('settings.users.form.first_name')}</Label>
                          <Input
                            name="first_name"
                            id="first_name-field"
                            className="form-control"
                            placeholder={t('settings.users.form.first_name')}
                            type="text"
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.first_name || ""}
                            invalid={
                              validation.touched.first_name && validation.errors.first_name ? true : false
                            }
                          />
                          {validation.touched.first_name && validation.errors.first_name ? (
                            <FormFeedback type="invalid">{validation.errors.first_name}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="last_name-field" className="form-label">{t('settings.users.form.last_name')}</Label>
                          <Input
                            name="last_name"
                            id="last_name-field"
                            className="form-control"
                            placeholder={t('settings.users.form.last_name')}
                            type="text"
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.last_name || ""}
                            invalid={
                              validation.touched.last_name && validation.errors.last_name ? true : false
                            }
                          />
                          {validation.touched.last_name && validation.errors.last_name ? (
                            <FormFeedback type="invalid">{validation.errors.last_name}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="email-field" className="form-label">{t('settings.users.form.email')}</Label>
                          <Input
                            name="email"
                            id="email-field"
                            className="form-control"
                            placeholder={t('settings.users.form.email')}
                            type="email"
                            validate={{
                              required: { value: true },
                            }}
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

                        {!isEdit && (
                          <div className="mb-3">
                            <Label htmlFor="password-field" className="form-label">{t('settings.users.form.password')}</Label>
                            <Input
                              name="password"
                              id="password-field"
                              className="form-control"
                              placeholder={t('settings.users.form.password')}
                              type="password"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.password || ""}
                              invalid={
                                validation.touched.password && validation.errors.password ? true : false
                              }
                            />
                            {validation.touched.password && validation.errors.password ? (
                              <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                            ) : null}
                          </div>
                        )}

                        <div className="mb-3">
                          <Label htmlFor="role-field" className="form-label">{t('settings.users.form.role')}</Label>
                          <Input
                            name="role"
                            type="select"
                            className="form-select"
                            id="role-field"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.role || ""}
                          >
                            <option value="admin">{t('settings.users.role.admin')}</option>
                            <option value="manager">{t('settings.users.role.manager')}</option>
                            <option value="staff">{t('settings.users.role.staff')}</option>
                          </Input>
                          {validation.touched.role && validation.errors.role ? (
                            <FormFeedback type="invalid">{validation.errors.role}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="status-field" className="form-label">{t('settings.users.form.status')}</Label>
                          <Input
                            name="status"
                            type="select"
                            className="form-select"
                            id="status-field"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.status || ""}
                          >
                            <option value="active">{t('settings.users.status.active')}</option>
                            <option value="inactive">{t('settings.users.status.inactive')}</option>
                          </Input>
                          {validation.touched.status && validation.errors.status ? (
                            <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                          ) : null}
                        </div>
                      </ModalBody>
                      <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                          <Button
                            type="button"
                            onClick={() => {
                              setModal(false);
                            }}
                            color="light"
                          >
                            Close
                          </Button>

                          <Button type="submit" color="success" id="add-btn">
                            {!!isEdit ? "Update" : "Add User"}
                          </Button>
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

      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteUser}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default UserManagement;
