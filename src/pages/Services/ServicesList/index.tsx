import React, { useState, useMemo, useEffect } from "react";
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
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  Service,
} from "../../../api/services";
import { getCategories } from "../../../api/categories";

const ServicesList = () => {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get current language for API calls
  const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';

  // Load services and categories on mount
  useEffect(() => {
    loadServices();
    loadCategories();
  }, [currentLang]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await getServices(1, 1000, undefined, undefined, undefined, currentLang);
      setServices(response || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(t('services.list.error.load') || 'Error loading services');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories(currentLang);
      console.log('Categories response:', response); // Debug
      console.log('Categories response.data:', response.data); // Debug
      setCategories(response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const toggle = () => {
    if (modal) {
      setModal(false);
      setSelectedService(null);
      setIsEdit(false);
    } else {
      setModal(true);
    }
  };

  const handleEdit = async (service: Service) => {
    try {
      setLoading(true);
      // Fetch service with English translations
      const serviceEN = await getService(service.id, 'EN');
      console.log('Service EN:', serviceEN);
      
      // Fetch service with Spanish translations
      const serviceES = await getService(service.id, 'ES');
      console.log('Service ES:', serviceES);
      
      // Combine both translations into one object
      const serviceWithTranslations = {
        ...service,
        titleEN: serviceEN.name,
        descriptionEN: serviceEN.description,
        titleES: serviceES.name,
        descriptionES: serviceES.description,
      };
      
      console.log('Service with translations:', serviceWithTranslations);
      
      setSelectedService(serviceWithTranslations as any);
      setIsEdit(true);
      setModal(true);
    } catch (error: any) {
      console.error('Error loading service translations:', error);
      toast.error(t('services.list.error.load') || 'Error loading service');
    } finally {
      setLoading(false);
    }
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
      name: (selectedService && selectedService.name) || "",
      description: (selectedService && selectedService.description) || "",
      titleEN: (selectedService && (selectedService as any).titleEN) || (selectedService && selectedService.name) || "",
      descriptionEN: (selectedService && (selectedService as any).descriptionEN) || (selectedService && selectedService.description) || "",
      titleES: (selectedService && (selectedService as any).titleES) || (selectedService && selectedService.name) || "",
      descriptionES: (selectedService && (selectedService as any).descriptionES) || (selectedService && selectedService.description) || "",
      categoryId: (selectedService && selectedService.categoryId) || "",
      price: (selectedService && selectedService.price) || 0,
      duration: (selectedService && selectedService.duration) || 30,
      bufferTime: (selectedService && selectedService.bufferTime) || 15,
      displayOrder: (selectedService && selectedService.displayOrder) || 0,
      isActive: selectedService?.isActive !== undefined ? selectedService.isActive : true,
      isPopular: selectedService?.isPopular !== undefined ? selectedService.isPopular : false,
    },
    validationSchema: Yup.object({
      name: Yup.string(),
      description: Yup.string(),
      titleEN: Yup.string().required("Title in English is required"),
      descriptionEN: Yup.string().required("Description in English is required"),
      titleES: Yup.string().required("Title in Spanish is required"),
      descriptionES: Yup.string().required("Description in Spanish is required"),
      categoryId: Yup.string().required("Category is required"),
      price: Yup.number().min(0, "Price must be at least 0").required("Price is required"),
      duration: Yup.number().min(1, "Duration must be at least 1 minute").required("Duration is required"),
      bufferTime: Yup.number().min(0, "Buffer time must be at least 0"),
      displayOrder: Yup.number().min(0, "Display order must be at least 0"),
      isActive: Yup.boolean(),
      isPopular: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        // Prepare the payload with base English values and translations
        const payload = {
          name: values.titleEN,  // Use English title as base name
          description: values.descriptionEN,  // Use English description as base
          titleEN: values.titleEN,  // English translation
          descriptionEN: values.descriptionEN,  // English translation
          titleES: values.titleES,  // Spanish translation
          descriptionES: values.descriptionES,  // Spanish translation
          categoryId: values.categoryId,
          price: values.price,
          duration: values.duration,
          bufferTime: values.bufferTime,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
          isPopular: values.isPopular,
        };
        
        if (isEdit && selectedService) {
          await updateService(selectedService.id, payload);
          toast.success(t('services.list.success.updated') || 'Service updated successfully');
        } else {
          await createService(payload);
          toast.success(t('services.list.success.added') || 'Service added successfully');
        }
        toggle();
        validation.resetForm();
        await loadServices();
      } catch (error: any) {
        console.error('Error saving service:', error);
        toast.error(error.response?.data?.message || t('services.list.error.save') || 'Error saving service');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleDeleteService = async () => {
    if (selectedService) {
      try {
        await deleteService(selectedService.id);
        setDeleteModal(false);
        toast.success(t('services.list.success.deleted') || 'Service deleted successfully');
        await loadServices();
      } catch (error: any) {
        console.error('Error deleting service:', error);
        toast.error(error.response?.data?.message || t('services.list.error.delete') || 'Error deleting service');
      }
    }
  };

  const onClickDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteModal(true);
  };

  const toggleStatus = async (service: Service) => {
    try {
      await updateService(service.id, { isActive: !service.isActive });
      toast.success(!service.isActive ? 
        t('services.list.success.activated') || 'Service activated' : 
        t('services.list.success.deactivated') || 'Service deactivated'
      );
      await loadServices();
    } catch (error: any) {
      console.error('Error toggling service status:', error);
      toast.error(error.response?.data?.message || t('services.list.error.toggle') || 'Error toggling status');
    }
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
        header: t('services.list.table.service'),
        accessorKey: "name",
        enableColumnFilter: false,
        enableGlobalFilter: true,
        cell: (cell: any) => {
          const service = cell.row.original;
          return (
            <div className="d-flex align-items-center">
              <div className="flex-grow-1" onClick={() => handleView(service)} style={{ cursor: 'pointer' }}>
                <h5 className="fs-14 mb-1">
                  {service.name}
                </h5>
                <p className="text-muted mb-0 fs-12">
                  {service.categoryRelation?.name || '-'}
                </p>
              </div>
            </div>
          );
        },
        filterFn: (row: any, columnId: string, filterValue: string) => {
          const serviceName = row.original.name || '';
          return serviceName.toLowerCase().includes(filterValue.toLowerCase());
        },
      },
      {
        header: () => <div className="text-center">{t('services.list.table.price')}</div>,
        accessorKey: "price",
        enableColumnFilter: false,
        enableGlobalFilter: false,
        cell: (cell: any) => {
          const price = cell.getValue();
          return (
            <div className="text-center">
              <h6 className="mb-0 text-success">${(price / 100).toFixed(2)}</h6>
            </div>
          );
        },
      },
      {
        header: () => <div className="text-center">{t('services.list.table.duration')}</div>,
        accessorKey: "duration",
        enableColumnFilter: false,
        enableGlobalFilter: false,
        cell: (cell: any) => {
          const service = cell.row.original;
          return (
            <div className="text-center">
              <div className="mb-1">
                <span className="badge bg-info text-white">{cell.getValue()} min</span>
              </div>
              {service.bufferTime > 0 && (
                <small className="text-muted">+{service.bufferTime} min buffer</small>
              )}
            </div>
          );
        },
      },
      {
        header: () => <div className="text-center">{t('services.list.table.status')}</div>,
        accessorKey: "isActive",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const service = cell.row.original;
          const isActive = cell.getValue();
          return (
            <div className="text-center">
              <div className="form-check form-switch d-inline-block">
                <Input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`service-status-${service.id}`}
                  checked={isActive}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleStatus(service);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          );
        },
      },
      {
        header: t('services.list.table.action'),
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
                  {t('common.edit')}
                </DropdownItem>
                <DropdownItem 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStatus(service);
                  }}
                >
                  {service.isActive ? (
                    <>
                      <i className="ri-close-circle-line align-bottom me-2 text-muted"></i>
                      {t('team.dropdown.deactivate')}
                    </>
                  ) : (
                    <>
                      <i className="ri-checkbox-circle-line align-bottom me-2 text-muted"></i>
                      {t('team.dropdown.activate')}
                    </>
                  )}
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    [i18n.language, services, t]
  );

  document.title = "Services | Nails & Co - Admin Panel";

  console.log('Services state:', services); // Debug
  console.log('Services length:', services?.length); // Debug

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
                      <Label className="fw-bold">{t('services.list.form.name')}</Label>
                      <p className="text-muted">{selectedService.name}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.category')}</Label>
                      <p className="text-muted">
                        {selectedService.categoryRelation?.name || '-'}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.description')}</Label>
                      <p className="text-muted">{selectedService.description || '-'}</p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.price')}</Label>
                      <p className="text-success fw-semibold">
                        ${(selectedService.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.duration')}</Label>
                      <div>
                        <span className="badge bg-info text-white">{selectedService.duration} min</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.bufferTime')}</Label>
                      <div>
                        <span className="badge bg-secondary text-white">{selectedService.bufferTime} min</span>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.table.status')}</Label>
                      <div>
                        <span className={`badge ${selectedService.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {selectedService.isActive ? t('services.list.active') : t('services.list.inactive')}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.popular')}</Label>
                      <div>
                        <span className={`badge ${selectedService.isPopular ? 'bg-warning' : 'bg-light text-dark'}`}>
                          {selectedService.isPopular ? t('common.yes') : t('common.no')}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label className="fw-bold">{t('services.list.form.displayOrder')}</Label>
                      <p className="text-muted">{selectedService.displayOrder}</p>
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
              {/* English Translation */}
              <Row>
                <Col md={12}>
                  <div className="mb-2">
                    <h6 className="text-primary mb-3">
                      <i className="ri-global-line me-2"></i>
                      {t('services.form.translations_english')}
                    </h6>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.form.title_en')} <span className="text-danger">*</span></Label>
                    <Input
                      name="titleEN"
                      type="text"
                      placeholder="Enter service title in English"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.titleEN}
                      invalid={
                        validation.touched.titleEN && validation.errors.titleEN
                          ? true
                          : false
                      }
                    />
                    {validation.touched.titleEN && validation.errors.titleEN ? (
                      <FormFeedback type="invalid">
                        {validation.errors.titleEN as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.form.description_en')} <span className="text-danger">*</span></Label>
                    <Input
                      name="descriptionEN"
                      type="textarea"
                      rows={3}
                      placeholder="Enter service description in English"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.descriptionEN}
                      invalid={
                        validation.touched.descriptionEN &&
                        validation.errors.descriptionEN
                          ? true
                          : false
                      }
                    />
                    {validation.touched.descriptionEN &&
                    validation.errors.descriptionEN ? (
                      <FormFeedback type="invalid" className="d-block">
                        {validation.errors.descriptionEN as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              {/* Spanish Translation */}
              <Row>
                <Col md={12}>
                  <div className="mb-2 mt-3">
                    <h6 className="text-primary mb-3">
                      <i className="ri-global-line me-2"></i>
                      {t('services.form.translations_spanish')}
                    </h6>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.form.title_es')} <span className="text-danger">*</span></Label>
                    <Input
                      name="titleES"
                      type="text"
                      placeholder="Ingrese el título del servicio en español"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.titleES}
                      invalid={
                        validation.touched.titleES && validation.errors.titleES
                          ? true
                          : false
                      }
                    />
                    {validation.touched.titleES && validation.errors.titleES ? (
                      <FormFeedback type="invalid">
                        {validation.errors.titleES as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label>{t('services.form.description_es')} <span className="text-danger">*</span></Label>
                    <Input
                      name="descriptionES"
                      type="textarea"
                      rows={3}
                      placeholder="Ingrese la descripción del servicio en español"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.descriptionES}
                      invalid={
                        validation.touched.descriptionES &&
                        validation.errors.descriptionES
                          ? true
                          : false
                      }
                    />
                    {validation.touched.descriptionES &&
                    validation.errors.descriptionES ? (
                      <FormFeedback type="invalid" className="d-block">
                        {validation.errors.descriptionES as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.category')} <span className="text-danger">*</span></Label>
                    <Input
                      name="categoryId"
                      type="select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.categoryId}
                      invalid={
                        validation.touched.categoryId && validation.errors.categoryId
                          ? true
                          : false
                      }
                    >
                      <option value="">{t('services.list.form.selectCategory')}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.categoryId && validation.errors.categoryId ? (
                      <FormFeedback type="invalid">
                        {validation.errors.categoryId as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.price')} <span className="text-danger">*</span></Label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <Input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => {
                          // Convert dollars to cents for backend
                          const dollars = parseFloat(e.target.value) || 0;
                          validation.setFieldValue('price', Math.round(dollars * 100));
                        }}
                        onBlur={validation.handleBlur}
                        value={(validation.values.price / 100).toFixed(2)}
                        invalid={
                          validation.touched.price && validation.errors.price
                            ? true
                            : false
                        }
                      />
                      {validation.touched.price && validation.errors.price ? (
                        <FormFeedback type="invalid">
                          {validation.errors.price as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.duration')} (min) <span className="text-danger">*</span></Label>
                    <Input
                      name="duration"
                      type="number"
                      placeholder="45"
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
                <Col md={4}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.bufferTime')} (min)</Label>
                    <Input
                      name="bufferTime"
                      type="number"
                      placeholder="15"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.bufferTime}
                      invalid={
                        validation.touched.bufferTime && validation.errors.bufferTime
                          ? true
                          : false
                      }
                    />
                    {validation.touched.bufferTime && validation.errors.bufferTime ? (
                      <FormFeedback type="invalid">
                        {validation.errors.bufferTime as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.displayOrder')}</Label>
                    <Input
                      name="displayOrder"
                      type="number"
                      placeholder="0"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.displayOrder}
                      invalid={
                        validation.touched.displayOrder && validation.errors.displayOrder
                          ? true
                          : false
                      }
                    />
                    {validation.touched.displayOrder && validation.errors.displayOrder ? (
                      <FormFeedback type="invalid">
                        {validation.errors.displayOrder as string}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.table.status')}</Label>
                    <div className="form-check form-switch form-switch-lg" style={{ paddingTop: '0.5rem' }}>
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        name="isActive"
                        checked={validation.values.isActive}
                        onChange={(e) => validation.setFieldValue('isActive', e.target.checked)}
                      />
                      <Label className="form-check-label">
                        {validation.values.isActive ? t('services.list.active') : t('services.list.inactive')}
                      </Label>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>{t('services.list.form.popular')}</Label>
                    <div className="form-check form-switch form-switch-lg" style={{ paddingTop: '0.5rem' }}>
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        name="isPopular"
                        checked={validation.values.isPopular}
                        onChange={(e) => validation.setFieldValue('isPopular', e.target.checked)}
                      />
                      <Label className="form-check-label">
                        {validation.values.isPopular ? t('common.yes') : t('common.no')}
                      </Label>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="hstack gap-2 justify-content-end">
                <Button color="light" onClick={toggle} disabled={submitting}>
                  {t('common.close')}
                </Button>
                <Button color="success" type="submit" disabled={submitting}>
                  {submitting && <Spinner size="sm" className="me-2" />}
                  {isEdit ? t('common.update') : t('common.add')}
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
