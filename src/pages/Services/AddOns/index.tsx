import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Col,
  Container,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
  FormFeedback,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import {
  getAddOns,
  getAddOn,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  activateAddOn,
  deactivateAddOn,
  AddOn,
} from "../../../api/addons";
import { getServices, Service } from "../../../api/services";
import { Price } from "pages/Crypto/BuySell/MarketCol";

const AddOns = () => {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get current language for API calls
  const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';

  // Load add-ons and services on mount
  useEffect(() => {
    loadAddOns();
    loadServices();
  }, [currentLang]);

  // Debug: Log validation values when they change
  useEffect(() => {
    if (modal && isEdit) {
      console.log('Form initialized with values:', {
        compatibleServiceIds: validation.values.compatibleServiceIds,
        selectedAddOn: selectedAddOn?.compatibleServiceIds,
      });
    }
  }, [modal, isEdit, selectedAddOn]);

  const loadAddOns = async () => {
    try {
      setLoading(true);
      const response = await getAddOns(1, 1000, undefined, undefined, undefined, currentLang);
      console.log('Loaded addons:', response);
      if (response && response.length > 0) {
        console.log('First addon compatibleServiceIds:', response[0].compatibleServiceIds);
      }
      setAddOns(response || []);
    } catch (error: any) {
      console.error('Error loading add-ons:', error);
      toast.error(t('services.addons.error.load') || 'Error loading add-ons');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await getServices(1, 1000, undefined, undefined, undefined, currentLang);
      setServices(response || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const toggle = () => {
    if (modal) {
      setModal(false);
      setSelectedAddOn(null);
      setIsEdit(false);
      setShowServicesDropdown(false);
    } else {
      setModal(true);
    }
  };

  const handleEdit = async (addOn: AddOn) => {
    try {
      setLoading(true);
      // Load both English and Spanish translations
      const [addOnEN, addOnES] = await Promise.all([
        getAddOn(addOn.id, 'EN'),
        getAddOn(addOn.id, 'ES'),
      ]);
      
      console.log('AddOn EN from API:', addOnEN);
      console.log('AddOn ES from API:', addOnES);
      
      // Extract service IDs from the services array (from service_addons table)
      const serviceIds = addOnEN.services?.map(s => s.id) || [];
      
      // Merge translations into one object
      const fullAddOn = {
        ...addOnEN,
        titleEN: addOnEN.name,
        titleES: addOnES.name,
        descriptionEN: addOnEN.description,
        descriptionES: addOnES.description,
        compatibleServiceIds: serviceIds,
        services: addOnEN.services,
      };
      
      console.log('Merged fullAddOn:', fullAddOn);
      console.log('Service IDs from service_addons:', serviceIds);
      
      setSelectedAddOn(fullAddOn as any);
      setIsEdit(true);
      setModal(true);
    } catch (error) {
      console.error('Error loading add-on details:', error);
      toast.error(t('services.addons.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedAddOn(null);
    setIsEdit(false);
    setModal(true);
  };

  const handleView = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setViewModal(true);
  };

  const onClickDelete = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setDeleteModal(true);
  };

  const handleDeleteAddOn = async () => {
    if (selectedAddOn) {
      try {
        await deleteAddOn(selectedAddOn.id);
        await loadAddOns();
        setDeleteModal(false);
        toast.success(t('services.addons.success.deleted'));
      } catch (error) {
        console.error('Error deleting add-on:', error);
        toast.error(t('services.addons.error.delete'));
      }
    }
  };

  const toggleStatus = async (addOn: AddOn) => {
    try {
      if (addOn.isActive) {
        await deactivateAddOn(addOn.id);
        toast.success(t('services.addons.success.deactivated'));
      } else {
        await activateAddOn(addOn.id);
        toast.success(t('services.addons.success.activated'));
      }
      await loadAddOns();
    } catch (error) {
      console.error('Error toggling add-on status:', error);
      toast.error(t('services.addons.error.toggle'));
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      titleEN: (selectedAddOn && selectedAddOn.titleEN) || (selectedAddOn && selectedAddOn.name) || "",
      titleES: (selectedAddOn && selectedAddOn.titleES) || "",
      descriptionEN: (selectedAddOn && selectedAddOn.descriptionEN) || (selectedAddOn && selectedAddOn.description) || "",
      descriptionES: (selectedAddOn && selectedAddOn.descriptionES) || "",
      price: (selectedAddOn && selectedAddOn.price / 100) || 0, // Convert from cents to dollars
      additionalTime: (selectedAddOn && selectedAddOn.additionalTime) || 0,
      compatibleServiceIds:
        (selectedAddOn && selectedAddOn.compatibleServiceIds) || [],
      isActive: selectedAddOn?.isActive !== undefined ? selectedAddOn.isActive : true,
    },
    validationSchema: Yup.object({
      titleEN: Yup.string().required(t('services.addons.required.titleEn')),
      titleES: Yup.string().required(t('services.addons.required.titleEs')),
      descriptionEN: Yup.string().required(t('services.addons.required.descriptionEn')),
      descriptionES: Yup.string().required(t('services.addons.required.descriptionEs')),
      price: Yup.number()
        .required("Price is required")
        .min(0, "Price must be at least 0"),
      additionalTime: Yup.number()
        .required(t('services.addons.required.duration'))
        .min(0, t('services.addons.required.duration.min')),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const data = {
          name: values.titleEN, // Use English title as name
          description: values.descriptionEN, // Use English description
          price: Math.round(values.price * 100), // Convert dollars to cents
          additionalTime: values.additionalTime,
          compatibleServiceIds: values.compatibleServiceIds,
          isActive: values.isActive,
          titleEn: values.titleEN,
          titleEs: values.titleES,
          descriptionEn: values.descriptionEN,
          descriptionEs: values.descriptionES,
        };

        if (isEdit && selectedAddOn) {
          await updateAddOn(selectedAddOn.id, data);
          toast.success(t('services.addons.success.updated'));
        } else {
          await createAddOn(data);
          toast.success(t('services.addons.success.added'));
        }

        await loadAddOns();
        toggle();
        validation.resetForm();
      } catch (error: any) {
        console.error('Error saving add-on:', error);
        const errorMessage = isEdit
          ? t('services.addons.error.update')
          : t('services.addons.error.create');
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

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
              className="addOnCheckBox form-check-input"
              value={cell.getValue()}
            />
          );
        },
      },
      {
        header: t('services.addons.addon'),
        accessorKey: "name",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const addOn = cell.row.original;
          return (
            <div 
              className="d-flex flex-column" 
              onClick={() => handleView(addOn)} 
              style={{ 
                cursor: 'pointer',
                maxWidth: '250px',
                overflow: 'hidden'
              }}
            >
              <h5 className="fs-14 mb-1 text-truncate" title={addOn.name}>
                {addOn.name}
              </h5>
              <p className="text-muted mb-0 fs-12 text-truncate" title={addOn.description}>
                {addOn.description || ''}
              </p>
            </div>
          );
        },
      },
      {
        header: () => <div className="text-center">{t('services.addons.price')}</div>,
        accessorKey: "price",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const price = cell.getValue(); // Convert cents to dollars
          return (
            <div className="text-center">
              <span className="badge bg-success text-white">${price}</span>
            </div>
          );
        },
      },
      {
        header: () => <div className="text-center">{t('services.addons.additionalTime')}</div>,
        accessorKey: "additionalTime",
        enableColumnFilter: false,
        cell: (cell: any) => {
          return (
            <div className="text-center">
              <span className="badge bg-info text-white">{cell.getValue() || 0} min</span>
            </div>
          );
        },
      },
      {
        header: () => <div className="text-center">{t('services.addons.status')}</div>,
        accessorKey: "isActive",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const addOn = cell.row.original;
          const isActive = cell.getValue();
          return (
            <div className="text-center">
              <div className="form-check form-switch d-inline-block">
                <Input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`addon-status-${addOn.id}`}
                  checked={isActive}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleStatus(addOn);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          );
        },
      },
      {
        header: t('services.addons.action'),
        cell: (cell: any) => {
          const addOn = cell.row.original;
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
                <DropdownItem onClick={() => handleEdit(addOn)}>
                  <i className="ri-pencil-fill align-bottom me-2 text-muted"></i>
                  {t('common.edit')}
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={() => toggleStatus(addOn)}>
                  <i className={`${addOn.isActive ? 'ri-close-circle-line' : 'ri-check-circle-line'} align-bottom me-2 text-muted`}></i>
                  {addOn.isActive ? t('common.deactivate') : t('common.activate')}
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    [i18n.language, addOns, t]
  );

  const handleDelete = (id: string) => {
    setAddOns(addOns.filter((addon) => addon.id !== id));
  };

  document.title = "Add-ons | Nails & Co - Admin Panel";

  return (
    <React.Fragment>
      <div className="page-content">
        <ToastContainer closeButton={false} limit={1} />
        <DeleteModal
          show={deleteModal}
          onDeleteClick={handleDeleteAddOn}
          onCloseClick={() => setDeleteModal(false)}
        />
        
        <Container fluid>
          <BreadCrumb title={t('menu.admin.services.addons')} pageTitle={t('menu.admin.services.title')} />

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="border-0">
                  <Row className="align-items-center gy-3">
                    <div className="col-sm">
                      <h5 className="card-title mb-0">{t('services.addons.title')}</h5>
                    </div>
                    <div className="col-sm-auto">
                      <div className="d-flex gap-1 flex-wrap">
                        <Button color="success" onClick={handleAddNew}>
                          <i className="ri-add-line align-bottom me-1"></i> {t('services.addons.add')}
                        </Button>
                      </div>
                    </div>
                  </Row>
                </CardHeader>
                <CardBody className="pt-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Loading add-ons...</p>
                    </div>
                  ) : (
                    <div>
                      <TableContainer
                        columns={columns}
                        data={addOns || []}
                        isGlobalFilter={true}
                        customPageSize={10}
                        divClass="table-responsive table-card mb-1"
                        tableClass="align-middle table-nowrap"
                        theadClass="table-light text-muted"
                        SearchPlaceholder={t('services.addons.search')}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* View Add-on Details Modal */}
          <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
            <ModalHeader toggle={() => setViewModal(false)}>
              {t('services.addons.viewDetails')}
            </ModalHeader>
            <ModalBody>
              {selectedAddOn && (
                <div>
                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.addon')}</Label>
                        <p className="text-muted">{selectedAddOn.name}</p>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.list.description')}</Label>
                        <p className="text-muted">{selectedAddOn.description || t('services.addons.none')}</p>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.price')}</Label>
                        <div>
                          <span className="badge bg-success text-white">${(selectedAddOn.price)}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.additionalTime')}</Label>
                        <div>
                          <span className="badge bg-info text-white">{selectedAddOn.additionalTime || 0} min</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.status')}</Label>
                        <div>
                          <span className={`badge ${selectedAddOn.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {selectedAddOn.isActive ? t('services.addons.active') : t('services.addons.inactive')}
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.associatedServices.label')}</Label>
                        <div>
                          {selectedAddOn.services && selectedAddOn.services.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {selectedAddOn.services.map((service: any, idx: number) => (
                                <span key={idx} className="badge bg-primary text-white">
                                  {service.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">{t('services.addons.none')}</p>
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
                      handleEdit(selectedAddOn);
                    }}>
                      <i className="ri-pencil-fill align-bottom me-1"></i>
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              )}
            </ModalBody>
          </Modal>

          <Modal isOpen={modal} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
              {isEdit ? t('services.addons.edit') : t('services.addons.add')}
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
                      <Label>{t('services.addons.titleEn')} <span className="text-danger">*</span></Label>
                      <Input
                        name="titleEN"
                        type="text"
                        placeholder="Enter title in English"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.titleEN}
                        invalid={
                          validation.touched.titleEN &&
                          validation.errors.titleEN
                            ? true
                            : false
                        }
                      />
                      {validation.touched.titleEN &&
                      validation.errors.titleEN ? (
                        <FormFeedback type="invalid">
                          {validation.errors.titleEN as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.titleEs')} <span className="text-danger">*</span></Label>
                      <Input
                        name="titleES"
                        type="text"
                        placeholder="Ingrese título en español"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.titleES}
                        invalid={
                          validation.touched.titleES &&
                          validation.errors.titleES
                            ? true
                            : false
                        }
                      />
                      {validation.touched.titleES &&
                      validation.errors.titleES ? (
                        <FormFeedback type="invalid">
                          {validation.errors.titleES as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.descriptionEn')} <span className="text-danger">*</span></Label>
                      <Input
                        name="descriptionEN"
                        type="textarea"
                        rows={3}
                        placeholder="Enter description in English"
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
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.descriptionEs')} <span className="text-danger">*</span></Label>
                      <Input
                        name="descriptionES"
                        type="textarea"
                        rows={3}
                        placeholder="Ingrese descripción en español"
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
                  <Col md={4}>
                    <div className="mb-3">
                      <Label>{t('services.addons.price.label')}</Label>
                      <Input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.price}
                        invalid={
                          validation.touched.price &&
                          validation.errors.price
                            ? true
                            : false
                        }
                      />
                      {validation.touched.price &&
                      validation.errors.price ? (
                        <FormFeedback type="invalid">
                          {validation.errors.price as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label>{t('services.addons.additionalTime.label')}</Label>
                      <Input
                        name="additionalTime"
                        type="number"
                        placeholder="0"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.additionalTime}
                        invalid={
                          validation.touched.additionalTime &&
                          validation.errors.additionalTime
                            ? true
                            : false
                        }
                      />
                      {validation.touched.additionalTime &&
                      validation.errors.additionalTime ? (
                        <FormFeedback type="invalid">
                          {validation.errors.additionalTime as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <Label>{t('services.addons.status')}</Label>
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
                          {validation.values.isActive ? t('services.addons.active') : t('services.addons.inactive')}
                        </Label>
                      </div>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.addons.associatedServices.label')} <span className="text-muted">({t('common.optional')})</span></Label>
                      <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {t('services.list.addons.hint')}
                      </p>
                      
                      {/* Selected chips */}
                      {validation.values.compatibleServiceIds && validation.values.compatibleServiceIds.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {validation.values.compatibleServiceIds.map((serviceId: string) => {
                            const service = services.find(s => s.id === serviceId);
                            return (
                              <span key={serviceId} className="badge bg-primary text-white fs-12 d-inline-flex align-items-center">
                                {service?.name || serviceId}
                                <button
                                  type="button"
                                  className="btn-close ms-2"
                                  style={{ fontSize: '0.65rem', padding: '0.25rem' }}
                                  onClick={() => {
                                    const currentValues = validation.values.compatibleServiceIds || [];
                                    validation.setFieldValue('compatibleServiceIds', currentValues.filter((id: string) => id !== serviceId));
                                  }}
                                  aria-label="Remove"
                                ></button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Dropdown selector */}
                      <div className="position-relative">
                        <Input
                          type="text"
                          placeholder={t('services.list.addons.placeholder')}
                          onClick={() => setShowServicesDropdown(!showServicesDropdown)}
                          readOnly
                          style={{ cursor: 'pointer' }}
                        />
                        {showServicesDropdown && (
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
                            {services.map(service => {
                              const isSelected = validation.values.compatibleServiceIds?.includes(service.id) || false;
                              return (
                                <div
                                  key={service.id}
                                  className={`p-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    const currentValues = validation.values.compatibleServiceIds || [];
                                    if (isSelected) {
                                      validation.setFieldValue('compatibleServiceIds', currentValues.filter((id: string) => id !== service.id));
                                    } else {
                                      validation.setFieldValue('compatibleServiceIds', [...currentValues, service.id]);
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
                                      {service.name}
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
                  <Button color="light" onClick={toggle} disabled={submitting}>
                    {t('common.close')}
                  </Button>
                  <Button color="success" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isEdit ? t('common.updating') : t('common.adding')}...
                      </>
                    ) : (
                      <>
                        {isEdit ? t('common.update') : t('common.add')} {t('services.addons.addon')}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </ModalBody>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AddOns;
