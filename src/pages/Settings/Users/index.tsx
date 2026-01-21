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
import RoleAssignment from '../../../Components/Roles/RoleAssignment';
import RoleScreenAssignment from '../../../Components/Roles/RoleScreenAssignment';


import { APIClient } from '../../../helpers/api_helper';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = new APIClient();

const UserManagement = () => {
  const { t } = useTranslation();

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/v1/users', { limit: 100 });
      // Si la respuesta es paginada, los usuarios están en res.data
      if (res && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res && res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else if (Array.isArray(res)) {
        setUsers(res);
      } else {
        setUsers([]);
      }
    } catch (err) {
      toast.error('Error al cargar usuarios');
    }
  };

  // Delete user
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);

  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setUser(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  // Activar/Inactivar usuario
  const handleToggleActive = async (user: any) => {
    if (!user || !user.id) return;
    try {
      if (user.isActive) {
        await api.patch(`/api/v1/users/${user.id}/deactivate`, {});
        toast.success('Usuario inactivado');
      } else {
        await api.patch(`/api/v1/users/${user.id}/activate`, {});
        toast.success('Usuario activado');
      }
      fetchUsers();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
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
      status:
        user && typeof user.isActive === 'boolean'
          ? user.isActive
            ? 'active'
            : 'inactive'
          : 'active',
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required(t('settings.users.form.first_name') + ' is required'),
      last_name: Yup.string().required(t('settings.users.form.last_name') + ' is required'),
      email: Yup.string().email('Invalid email').required(t('settings.users.form.email') + ' is required'),
      password: isEdit ? Yup.string() : Yup.string().required(t('settings.users.form.password') + ' is required'),
      role: Yup.string().required(t('settings.users.form.role') + ' is required'),
      status: Yup.string().required(t('settings.users.form.status') + ' is required'),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && user?.id) {
          await api.patch(`/api/v1/users/${user.id}`, values);
          toast.success(t('User updated successfully'), { autoClose: 3000 });
        } else {
          await api.create('/api/v1/users', values);
          toast.success(t('User created successfully'), { autoClose: 3000 });
        }
        fetchUsers();
        validation.resetForm();
        toggle();
      } catch (err) {
        toast.error('Error al guardar usuario');
      }
    },
  });

  // Delete Data
  const handleDeleteUser = async () => {
    if (user && user.id) {
      try {
        await api.delete(`/api/v1/users/${user.id}`);
        toast.success(t('User deleted successfully'), { autoClose: 3000 });
        fetchUsers();
      } catch (err) {
        toast.error('Error al eliminar usuario');
      }
      setDeleteModal(false);
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
  const handleAssignRoles = (user: any) => {
    setUser(user);
    setShowRoleModal(true);
  };

  const handleAssignScreens = () => {
    setShowScreenModal(true);
  };

  const columns = useMemo(
    () => [
      {
        header: t('settings.users.table.name'),
        accessorKey: "name",
        enableColumnFilter: false,
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
          return t(roleKey);
        },
      },
      {
        header: t('settings.users.table.status'),
        accessorKey: "isActive",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const statusKey = `settings.users.status.${cell.getValue()}`;
          return t(statusKey);
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
              <li className="list-inline-item" title={cellProps.row.original.isActive ? "Inactivar" : "Activar"}>
                <Link
                  to="#"
                  className={cellProps.row.original.isActive ? "text-warning d-inline-block" : "text-success d-inline-block"}
                  onClick={() => handleToggleActive(cellProps.row.original)}
                >
                  <i className={cellProps.row.original.isActive ? "ri-lock-line fs-16" : "ri-lock-unlock-line fs-16"}></i>
                </Link>
              </li>
              <li className="list-inline-item" title="Roles">
                <Button size="sm" color="info" onClick={() => handleAssignRoles(cellProps.row.original)}>
                  Roles
                </Button>
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
              <div className="mb-3 d-flex justify-content-end">
                <Button color="primary" onClick={handleAssignScreens}>
                  Asignar pantallas a roles
                </Button>
              </div>
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
                          <div className="dropdown">
                            <button className="btn btn-outline-primary dropdown-toggle w-100 text-start" type="button" id="roleDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                              {validation.values.role === 'admin' && <><i className="ri-shield-user-line me-2"></i>Admin</>}
                              {validation.values.role === 'owner' && <><i className="ri-star-line me-2"></i>Owner</>}
                              {validation.values.role === 'staff' && <><i className="ri-user-3-line me-2"></i>Staff</>}
                              {!validation.values.role && <span className="text-muted">Seleccionar rol</span>}
                            </button>
                            <ul className="dropdown-menu w-100" aria-labelledby="roleDropdown">
                              <li>
                                <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => validation.setFieldValue('role', 'admin')}>
                                  <i className="ri-shield-user-line me-2 text-primary"></i>Admin
                                  <span className="ms-auto badge bg-light text-dark">Acceso total</span>
                                </button>
                              </li>
                              <li>
                                <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => validation.setFieldValue('role', 'owner')}>
                                  <i className="ri-star-line me-2 text-warning"></i>Owner
                                  <span className="ms-auto badge bg-light text-dark">Propietario</span>
                                </button>
                              </li>
                              <li>
                                <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => validation.setFieldValue('role', 'staff')}>
                                  <i className="ri-user-3-line me-2 text-info"></i>Staff
                                  <span className="ms-auto badge bg-light text-dark">Solo agenda</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                          {validation.touched.role && validation.errors.role ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.role}</FormFeedback>
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
                            <option value="active">{t('settings.users.status.true')}</option>
                            <option value="inactive">{t('settings.users.status.false')}</option>
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
                  {/* Modal para asignar roles a usuario */}
                  <Modal isOpen={showRoleModal} toggle={() => setShowRoleModal(false)}>
                    <RoleAssignment user={user} onClose={() => setShowRoleModal(false)} />
                  </Modal>
                  {/* Modal para asignar pantallas a roles */}
                  <Modal isOpen={showScreenModal} toggle={() => setShowScreenModal(false)} size="lg">
                    <RoleScreenAssignment />
                  </Modal>
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
