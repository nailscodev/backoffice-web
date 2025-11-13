import React, { useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

interface Service {
  id: number;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  duration: number;
  addOns: number[];
  staff: number[];
  status: boolean;
}

const ServicesList = () => {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Mock data - esto se reemplazará con Redux
  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      titleEn: "Classic Manicure",
      titleEs: "Manicura Clásica",
      descriptionEn: "Traditional manicure with nail shaping, cuticle care, and polish application",
      descriptionEs: "Manicura tradicional con moldeado de uñas, cuidado de cutículas y aplicación de esmalte",
      duration: 45,
      addOns: [1, 2],
      staff: [1, 2],
      status: true,
    },
    {
      id: 2,
      titleEn: "Spa Pedicure",
      titleEs: "Pedicura Spa",
      descriptionEn: "Relaxing pedicure with foot soak, exfoliation, massage, and polish",
      descriptionEs: "Pedicura relajante con remojo de pies, exfoliación, masaje y esmalte",
      duration: 60,
      addOns: [1],
      staff: [1, 3],
      status: true,
    },
    {
      id: 3,
      titleEn: "Gel Manicure",
      titleEs: "Manicura en Gel",
      descriptionEn: "Long-lasting gel manicure with UV curing",
      descriptionEs: "Manicura en gel de larga duración con curado UV",
      duration: 60,
      addOns: [2],
      staff: [2],
      status: false,
    },
  ]);

  // Mock add-ons data
  const mockAddOns = [
    { id: 1, titleEn: "Gel Polish", titleEs: "Esmalte en Gel" },
    { id: 2, titleEn: "French Tips", titleEs: "Puntas Francesas" },
    { id: 3, titleEn: "Nail Art", titleEs: "Arte de Uñas" },
  ];

  // Mock staff data
  const mockStaff = [
    { id: 1, name: "María González" },
    { id: 2, name: "Ana Martínez" },
    { id: 3, name: "Sofia López" },
    { id: 4, name: "Laura Rodríguez" },
  ];

  const toggle = () => {
    if (modal) {
      setModal(false);
      setSelectedService(null);
      setIsEdit(false);
      setShowAddOnsDropdown(false);
      setShowStaffDropdown(false);
    } else {
      setModal(true);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsEdit(true);
    setModal(true);
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setIsEdit(false);
    setModal(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setViewModal(true);
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      titleEn: (selectedService && selectedService.titleEn) || "",
      titleEs: (selectedService && selectedService.titleEs) || "",
      descriptionEn: (selectedService && selectedService.descriptionEn) || "",
      descriptionEs: (selectedService && selectedService.descriptionEs) || "",
      duration: (selectedService && selectedService.duration) || 30,
      addOns: (selectedService && selectedService.addOns) || [] as number[],
      staff: (selectedService && selectedService.staff) || [] as number[],
      status: selectedService?.status !== undefined ? selectedService.status : true,
    },
    validationSchema: Yup.object({
      titleEn: Yup.string().required("English title is required"),
      titleEs: Yup.string().required("Spanish title is required"),
      descriptionEn: Yup.string().required("English description is required"),
      descriptionEs: Yup.string().required("Spanish description is required"),
      duration: Yup.number().min(1, "Duration must be at least 1 minute").required("Duration is required"),
      addOns: Yup.array().of(Yup.number()),
      staff: Yup.array().of(Yup.number()),
      status: Yup.boolean(),
    }),
    onSubmit: (values) => {
      if (isEdit && selectedService) {
        const updatedServices = services.map((svc) =>
          svc.id === selectedService.id ? { ...svc, ...values } : svc
        );
        setServices(updatedServices);
        toast.success(t('services.list.success.updated'));
      } else {
        const newService = {
          id: services.length + 1,
          ...values,
        };
        setServices([...services, newService]);
        toast.success(t('services.list.success.added'));
      }
      toggle();
      validation.resetForm();
    },
  });

  const handleDeleteService = () => {
    if (selectedService) {
      setServices(services.filter((svc) => svc.id !== selectedService.id));
      setDeleteModal(false);
      toast.success(t('services.list.success.deleted'));
    }
  };

  const onClickDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteModal(true);
  };

  const toggleStatus = (service: Service) => {
    const updatedServices = services.map((svc) =>
      svc.id === service.id ? { ...svc, status: !svc.status } : svc
    );
    setServices(updatedServices);
    toast.success(!service.status ? t('services.list.success.activated') : t('services.list.success.deactivated'));
  };

  const columns = useMemo(
    () => [
      {
        header: "#",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell: any) => {
          return (
            <input
              type="checkbox"
              className="serviceCheckBox form-check-input"
              value={cell.getValue()}
            />
          );
        },
      },
      {
        header: "Service",
        accessorKey: "titleEn",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const service = cell.row.original;
          return (
            <div className="d-flex flex-column" onClick={() => handleView(service)} style={{ cursor: 'pointer' }}>
              <h5 className="fs-14 mb-1">
                {i18n.language === 'sp' ? service.titleEs : service.titleEn}
              </h5>
              <p className="text-muted mb-0 fs-12">
                {i18n.language === 'sp' ? service.descriptionEs : service.descriptionEn}
              </p>
            </div>
          );
        },
      },
      {
        header: "Duration (min)",
        accessorKey: "duration",
        enableColumnFilter: false,
        cell: (cell: any) => {
          return <span className="badge bg-info text-white">{cell.getValue()} min</span>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const service = cell.row.original;
          return (
            <div className="form-check form-switch">
              <Input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={cell.getValue()}
                onChange={() => toggleStatus(service)}
              />
            </div>
          );
        },
      },
      {
        header: "Action",
        cell: (cell: any) => {
          const service = cell.row.original;
          return (
            <UncontrolledDropdown>
              <DropdownToggle
                href="#"
                className="btn btn-soft-secondary btn-sm"
                tag="button"
              >
                <i className="ri-more-fill" />
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-end">
                <DropdownItem onClick={() => handleEdit(service)}>
                  <i className="ri-pencil-fill align-bottom me-2 text-muted"></i>
                  Edit
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={() => onClickDelete(service)}>
                  <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    [i18n.language, services]
  );

  document.title = "Services | Nails & Co - Admin Panel";

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteService}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid>
        <BreadCrumb title={t('menu.admin.services.list')} pageTitle={t('menu.admin.services.title')} />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">{t('services.list.title')}</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button color="success" onClick={handleAddNew}>
                        <i className="ri-add-line align-bottom me-1"></i> {t('services.list.add')}
                      </Button>
                    </div>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                <div>
                  <TableContainer
                    columns={columns}
                    data={services || []}
                    isGlobalFilter={true}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted"
                    SearchPlaceholder={t('services.list.search')}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* View Service Details Modal */}
        <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
          <ModalHeader toggle={() => setViewModal(false)}>
            {t('services.list.viewDetails')}
          </ModalHeader>
          <ModalBody>
            {selectedService && (
              <div>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.titleEn')}</Label>
                      <p className="text-muted">{selectedService.titleEn}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.titleEs')}</Label>
                      <p className="text-muted">{selectedService.titleEs}</p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.descriptionEn')}</Label>
                      <p className="text-muted">{selectedService.descriptionEn}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.descriptionEs')}</Label>
                      <p className="text-muted">{selectedService.descriptionEs}</p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.duration.label')}</Label>
                      <div>
                        <span className="badge bg-info text-white">{selectedService.duration} min</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.status')}</Label>
                      <div>
                        <span className={`badge ${selectedService.status ? 'bg-success' : 'bg-danger'}`}>
                          {selectedService.status ? t('services.list.active') : t('services.list.inactive')}
                        </span>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.addons.label')}</Label>
                      <div>
                        {selectedService.addOns && selectedService.addOns.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {selectedService.addOns.map((addOnId: number) => {
                              const addOn = mockAddOns.find(a => a.id === addOnId);
                              return addOn ? (
                                <span key={addOnId} className="badge bg-primary text-white">
                                  {addOn.titleEn} / {addOn.titleEs}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-muted mb-0">{t('services.list.none')}</p>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.staff.label')}</Label>
                      <div>
                        {selectedService.staff && selectedService.staff.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {selectedService.staff.map((staffId: number) => {
                              const staffMember = mockStaff.find(s => s.id === staffId);
                              return staffMember ? (
                                <span key={staffId} className="badge bg-info text-white">
                                  {staffMember.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-muted mb-0">{t('services.list.none')}</p>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="hstack gap-2 justify-content-end">
                  <Button color="light" onClick={() => setViewModal(false)}>
                    {t('common.close')}
                  </Button>
                  <Button color="primary" onClick={() => {
                    setViewModal(false);
                    handleEdit(selectedService);
                  }}>
                    <i className="ri-pencil-fill align-bottom me-1"></i>
                    {t('common.edit')}
                  </Button>
                </div>
              </div>
            )}
          </ModalBody>
        </Modal>

        {/* Add/Edit Service Modal */}
        <Modal isOpen={modal} toggle={toggle} centered size="lg">
          <ModalHeader toggle={toggle}>
            {isEdit ? t('services.list.edit') : t('services.list.add')}
          </ModalHeader>
          <ModalBody>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
            >
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.titleEn')} <span className="text-danger">*</span></Label>
                    <Input
                      name="titleEn"
                      type="text"
                      placeholder="Enter title in English"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.titleEn}
                      invalid={
                        validation.touched.titleEn && validation.errors.titleEn
                          ? true
                          : false
                      }
                    />
                    {validation.touched.titleEn && validation.errors.titleEn ? (
                      <FormFeedback type="invalid">
                        {validation.errors.titleEn as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.titleEs')} <span className="text-danger">*</span></Label>
                    <Input
                      name="titleEs"
                      type="text"
                      placeholder="Ingrese título en español"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.titleEs}
                      invalid={
                        validation.touched.titleEs && validation.errors.titleEs
                          ? true
                          : false
                      }
                    />
                    {validation.touched.titleEs && validation.errors.titleEs ? (
                      <FormFeedback type="invalid">
                        {validation.errors.titleEs as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.descriptionEn')} <span className="text-danger">*</span></Label>
                    <Input
                      name="descriptionEn"
                      type="textarea"
                      rows={3}
                      placeholder="Enter description in English"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.descriptionEn}
                      invalid={
                        validation.touched.descriptionEn &&
                        validation.errors.descriptionEn
                          ? true
                          : false
                      }
                    />
                    {validation.touched.descriptionEn &&
                    validation.errors.descriptionEn ? (
                      <FormFeedback type="invalid" className="d-block">
                        {validation.errors.descriptionEn as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.descriptionEs')} <span className="text-danger">*</span></Label>
                    <Input
                      name="descriptionEs"
                      type="textarea"
                      rows={3}
                      placeholder="Ingrese descripción en español"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.descriptionEs}
                      invalid={
                        validation.touched.descriptionEs &&
                        validation.errors.descriptionEs
                          ? true
                          : false
                      }
                    />
                    {validation.touched.descriptionEs &&
                    validation.errors.descriptionEs ? (
                      <FormFeedback type="invalid" className="d-block">
                        {validation.errors.descriptionEs as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.duration.label')} <span className="text-danger">*</span></Label>
                    <Input
                      name="duration"
                      type="number"
                      placeholder="e.g., 45"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.duration}
                      invalid={
                        validation.touched.duration && validation.errors.duration
                          ? true
                          : false
                      }
                    />
                    {validation.touched.duration && validation.errors.duration ? (
                      <FormFeedback type="invalid">
                        {validation.errors.duration as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.status')}</Label>
                    <div className="form-check form-switch form-switch-lg" style={{ paddingTop: '0.5rem' }}>
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        name="status"
                        checked={validation.values.status}
                        onChange={(e) => validation.setFieldValue('status', e.target.checked)}
                      />
                      <Label className="form-check-label">
                        {validation.values.status ? t('services.list.active') : t('services.list.inactive')}
                      </Label>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.list.addons.label')} <span className="text-muted">({t('common.optional')})</span></Label>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {t('services.list.addons.hint')}
                    </p>
                    
                    {/* Selected chips */}
                    {validation.values.addOns && validation.values.addOns.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {validation.values.addOns.map((addOnId: number) => {
                          const addOn = mockAddOns.find(a => a.id === addOnId);
                          return addOn ? (
                            <span key={addOnId} className="badge bg-primary text-white fs-12 d-inline-flex align-items-center">
                              {addOn.titleEn} / {addOn.titleEs}
                              <button
                                type="button"
                                className="btn-close ms-2"
                                style={{ fontSize: '0.65rem', padding: '0.25rem' }}
                                onClick={() => {
                                  const currentValues = validation.values.addOns || [];
                                  validation.setFieldValue('addOns', currentValues.filter((id: number) => id !== addOnId));
                                }}
                                aria-label="Remove"
                              ></button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Dropdown selector */}
                    <div className="position-relative">
                      <Input
                        type="text"
                        placeholder={t('services.list.addons.placeholder')}
                        onClick={() => setShowAddOnsDropdown(!showAddOnsDropdown)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      {showAddOnsDropdown && (
                        <div 
                          className="position-absolute w-100 border rounded bg-white shadow-sm" 
                          style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            zIndex: 1000,
                            top: '100%',
                            marginTop: '4px'
                          }}
                        >
                          {mockAddOns.map(addOn => {
                            const isSelected = validation.values.addOns?.includes(addOn.id) || false;
                            return (
                              <div
                                key={addOn.id}
                                className={`p-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  const currentValues = validation.values.addOns || [];
                                  if (isSelected) {
                                    validation.setFieldValue('addOns', currentValues.filter((id: number) => id !== addOn.id));
                                  } else {
                                    validation.setFieldValue('addOns', [...currentValues, addOn.id]);
                                  }
                                }}
                              >
                                <div className="form-check">
                                  <Input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // Controlled by parent div onClick
                                  />
                                  <Label className="form-check-label" style={{ cursor: 'pointer' }}>
                                    {addOn.titleEn} / {addOn.titleEs}
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.list.staff.label')} <span className="text-muted">({t('common.optional')})</span></Label>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {t('services.list.staff.hint')}
                    </p>
                    
                    {/* Selected chips */}
                    {validation.values.staff && validation.values.staff.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {validation.values.staff.map((staffId: number) => {
                          const staffMember = mockStaff.find(s => s.id === staffId);
                          return staffMember ? (
                            <span key={staffId} className="badge bg-info text-white fs-12 d-inline-flex align-items-center">
                              {staffMember.name}
                              <button
                                type="button"
                                className="btn-close ms-2"
                                style={{ fontSize: '0.65rem', padding: '0.25rem' }}
                                onClick={() => {
                                  const currentValues = validation.values.staff || [];
                                  validation.setFieldValue('staff', currentValues.filter((id: number) => id !== staffId));
                                }}
                                aria-label="Remove"
                              ></button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Dropdown selector */}
                    <div className="position-relative">
                      <Input
                        type="text"
                        placeholder={t('services.list.staff.placeholder')}
                        onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      {showStaffDropdown && (
                        <div 
                          className="position-absolute w-100 border rounded bg-white shadow-sm" 
                          style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            zIndex: 1000,
                            top: '100%',
                            marginTop: '4px'
                          }}
                        >
                          {mockStaff.map(staff => {
                            const isSelected = validation.values.staff?.includes(staff.id) || false;
                            return (
                              <div
                                key={staff.id}
                                className={`p-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  const currentValues = validation.values.staff || [];
                                  if (isSelected) {
                                    validation.setFieldValue('staff', currentValues.filter((id: number) => id !== staff.id));
                                  } else {
                                    validation.setFieldValue('staff', [...currentValues, staff.id]);
                                  }
                                }}
                              >
                                <div className="form-check">
                                  <Input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // Controlled by parent div onClick
                                  />
                                  <Label className="form-check-label" style={{ cursor: 'pointer' }}>
                                    {staff.name}
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="hstack gap-2 justify-content-end">
                <Button color="light" onClick={toggle}>
                  {t('common.close')}
                </Button>
                <Button color="success" type="submit">
                  {isEdit ? t('common.update') : t('common.add')} {t('services.list.service')}
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      </Container>
    </div>
  );
};

export default ServicesList;
