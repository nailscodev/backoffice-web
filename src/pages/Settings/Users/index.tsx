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

import { Spinner } from 'reactstrap';

const api = new APIClient();

const UserManagement = () => {
  const { t } = useTranslation();

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Search state for table
  const [search, setSearch] = useState('');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Intenta traer todos los usuarios (sin límite)
      const res = await api.get('/api/v1/users');
      // Si la respuesta es paginada, los usuarios están en res.data.data
      if (res && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res && res.data && Array.isArray(res.data.data)) {
        // Si la API sigue paginando, intenta traer todos los usuarios de todas las páginas
        let allUsers = [...res.data.data];
        const total = res.data.total || res.data.pagination?.totalItems;
        const perPage = res.data.perPage || res.data.pagination?.itemsPerPage || allUsers.length;
        let page = res.data.page || res.data.pagination?.currentPage || 1;
        const totalPages = res.data.totalPages || res.data.pagination?.totalPages || 1;
        while (totalPages && page < totalPages) {
          page++;
          const nextRes = await api.get('/api/v1/users', { page });
          if (nextRes && nextRes.data && Array.isArray(nextRes.data.data)) {
            allUsers = allUsers.concat(nextRes.data.data);
          }
        }
        setUsers(allUsers);
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
      username: (user && user.username) || '',
      name: (user && user.name) || '',
      email: (user && user.email) || '',
      role: (user && user.role) || 'staff',
      status:
        user && typeof user.isActive === 'boolean'
          ? user.isActive
            ? 'active'
            : 'inactive'
          : 'active',
    },
    validationSchema: Yup.object({
      username: Yup.string().required(t('settings.users.form.username') + ' is required'),
      name: Yup.string().required(t('settings.users.form.name') + ' is required'),
      email: Yup.string().email('Invalid email').required(t('settings.users.form.email') + ' is required'),
      role: Yup.string().required(t('settings.users.form.role') + ' is required'),
      status: Yup.string().required(t('settings.users.form.status') + ' is required'),
    }),
    onSubmit: async (values) => {
      setIsSaving(true);
      try {
        // Construir payload compatible con backend
        const payload: any = {
          username: values.username,
          name: values.name,
          email: values.email,
          role: values.role,
          isActive: values.status === 'active',
        };
        // Password is no longer handled here
        if (isEdit && user?.id) {
          await api.patch(`/api/v1/users/${user.id}`, payload);
          toast.success(t('User updated successfully'), { autoClose: 3000 });
        } else {
          await api.create('/api/v1/users', payload);
          toast.success(t('User created successfully'), { autoClose: 3000 });
        }
        fetchUsers();
        validation.resetForm();
        toggle();
      } catch (err) {
        toast.error('Error al guardar usuario');
      } finally {
        setIsSaving(false);
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
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || (user.isActive ? 'active' : 'inactive'),
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
                <div className="hstack gap-2">
                  <Button color="primary" onClick={handleAssignScreens}>
                    Asignar pantallas a roles
                  </Button>
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
              <Card id="customerList">
                <div className="card-body pt-0">
                  <div>
                    <TableContainer
                      columns={columns}
                      data={users || []}
                      isGlobalFilter={true}
                      customPageSize={10}
                      divClass="table-responsive table-card mb-1"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted"
                      SearchPlaceholder={t('settings.users.search_placeholder')}
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
                          <Label htmlFor="username-field" className="form-label">{t('settings.users.form.username')}</Label>
                          <Input
                            name="username"
                            id="username-field"
                            className="form-control"
                            placeholder={t('settings.users.form.username')}
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.username || ""}
                            invalid={
                              validation.touched.username && validation.errors.username ? true : false
                            }
                          />
                          {validation.touched.username && validation.errors.username ? (
                            <FormFeedback type="invalid">{validation.errors.username}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="name-field" className="form-label">{t('settings.users.form.name')}</Label>
                          <Input
                            name="name"
                            id="name-field"
                            className="form-control"
                            placeholder={t('settings.users.form.name')}
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.name || ""}
                            invalid={
                              validation.touched.name && validation.errors.name ? true : false
                            }
                          />
                          {validation.touched.name && validation.errors.name ? (
                            <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
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

                        {/* Password field removed as per requirements */}

                        <div className="mb-3">
                          <Label htmlFor="role-field" className="form-label">{t('settings.users.form.role')}</Label>
                          <Input
                            name="role"
                            type="select"
                            className="form-select"
                            id="role-field"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.role || ''}
                            invalid={validation.touched.role && validation.errors.role ? true : false}
                          >
                            <option value="" disabled>{t('settings.users.form.role_placeholder') || 'Seleccionar rol'}</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                            <option value="staff">Staff</option>
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

                          <Button type="submit" color="success" id="add-btn" disabled={isSaving}>
                            {isSaving && <Spinner size="sm" className="me-2" />} {!!isEdit ? "Update" : "Add User"}
                          </Button>
                        </div>
                      </ModalFooter>
                    </Form>
                  </Modal>

                  <ToastContainer closeButton={false} limit={1} />
                  {/* Modal para asignar roles a usuario */}
                  <Modal isOpen={showRoleModal} toggle={() => setShowRoleModal(false)}>
                    <RoleAssignment 
                      user={user} 
                      onClose={() => setShowRoleModal(false)} 
                      onRoleUpdated={() => fetchUsers()} 
                    />
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
