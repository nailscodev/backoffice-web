import React, { useState, useMemo } from "react";
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
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";

interface AddOn {
  id: number;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  duration: number;
  associatedServices: string[];
  status: boolean;
}

const AddOns = () => {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);

  // Mock data - esto se reemplazará con Redux
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: 1,
      titleEn: "Gel Polish",
      titleEs: "Esmalte en Gel",
      descriptionEn: "Long-lasting gel polish application",
      descriptionEs: "Aplicación de esmalte en gel de larga duración",
      duration: 15,
      associatedServices: ["Manicure", "Pedicure"],
      status: true,
    },
    {
      id: 2,
      titleEn: "French Tips",
      titleEs: "Puntas Francesas",
      descriptionEn: "Classic french manicure tips",
      descriptionEs: "Puntas clásicas de manicura francesa",
      duration: 20,
      associatedServices: ["Manicure"],
      status: true,
    },
  ]);

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

  const handleEdit = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setIsEdit(true);
    setModal(true);
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

  const handleDeleteAddOn = () => {
    if (selectedAddOn) {
      setAddOns(addOns.filter((addon) => addon.id !== selectedAddOn.id));
      setDeleteModal(false);
      toast.success(t('services.addons.success.deleted'));
    }
  };

  const toggleStatus = (addOn: AddOn) => {
    const updatedAddOns = addOns.map((addon) =>
      addon.id === addOn.id ? { ...addon, status: !addon.status } : addon
    );
    setAddOns(updatedAddOns);
    toast.success(!addOn.status ? t('services.addons.success.activated') : t('services.addons.success.deactivated'));
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      titleEn: (selectedAddOn && selectedAddOn.titleEn) || "",
      titleEs: (selectedAddOn && selectedAddOn.titleEs) || "",
      descriptionEn: (selectedAddOn && selectedAddOn.descriptionEn) || "",
      descriptionEs: (selectedAddOn && selectedAddOn.descriptionEs) || "",
      duration: (selectedAddOn && selectedAddOn.duration) || 0,
      associatedServices:
        (selectedAddOn && selectedAddOn.associatedServices) || [],
      status: selectedAddOn?.status !== undefined ? selectedAddOn.status : true,
    },
    validationSchema: Yup.object({
      titleEn: Yup.string().required("English title is required"),
      titleEs: Yup.string().required("Spanish title is required"),
      descriptionEn: Yup.string().required("English description is required"),
      descriptionEs: Yup.string().required("Spanish description is required"),
      duration: Yup.number()
        .required("Duration is required")
        .min(1, "Duration must be at least 1 minute"),
      status: Yup.boolean(),
    }),
    onSubmit: (values) => {
      if (isEdit && selectedAddOn) {
        const updatedAddOns = addOns.map((addon) =>
          addon.id === selectedAddOn.id ? { ...addon, ...values } : addon
        );
        setAddOns(updatedAddOns);
        toast.success(t('services.addons.success.updated'));
      } else {
        const newAddOn = {
          id: addOns.length + 1,
          ...values,
        };
        setAddOns([...addOns, newAddOn]);
        toast.success(t('services.addons.success.added'));
      }
      toggle();
      validation.resetForm();
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
        header: "Add-on",
        accessorKey: "titleEn",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const addOn = cell.row.original;
          return (
            <div className="d-flex flex-column" onClick={() => handleView(addOn)} style={{ cursor: 'pointer' }}>
              <h5 className="fs-14 mb-1">
                {i18n.language === 'sp' ? addOn.titleEs : addOn.titleEn}
              </h5>
              <p className="text-muted mb-0 fs-12">
                {i18n.language === 'sp' ? addOn.descriptionEs : addOn.descriptionEn}
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
          const addOn = cell.row.original;
          return (
            <div className="form-check form-switch">
              <Input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={cell.getValue()}
                onChange={() => toggleStatus(addOn)}
              />
            </div>
          );
        },
      },
      {
        header: "Action",
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
                  Edit
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={() => onClickDelete(addOn)}>
                  <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    [i18n.language, addOns]
  );

  const handleDelete = (id: number) => {
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
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.titleEn')}</Label>
                        <p className="text-muted">{selectedAddOn.titleEn}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.titleEs')}</Label>
                        <p className="text-muted">{selectedAddOn.titleEs}</p>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.descriptionEn')}</Label>
                        <p className="text-muted">{selectedAddOn.descriptionEn}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.descriptionEs')}</Label>
                        <p className="text-muted">{selectedAddOn.descriptionEs}</p>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.duration.label')}</Label>
                        <div>
                          <span className="badge bg-info text-white">{selectedAddOn.duration} min</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="fw-bold">{t('services.addons.status')}</Label>
                        <div>
                          <span className={`badge ${selectedAddOn.status ? 'bg-success' : 'bg-danger'}`}>
                            {selectedAddOn.status ? t('services.addons.active') : t('services.addons.inactive')}
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
                          {selectedAddOn.associatedServices && selectedAddOn.associatedServices.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {selectedAddOn.associatedServices.map((service: string, idx: number) => (
                                <span key={idx} className="badge bg-primary text-white">
                                  {service}
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
                      <Label>{t('services.addons.titleEn')}</Label>
                      <Input
                        name="titleEn"
                        type="text"
                        placeholder="Enter title in English"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.titleEn}
                        invalid={
                          validation.touched.titleEn &&
                          validation.errors.titleEn
                            ? true
                            : false
                        }
                      />
                      {validation.touched.titleEn &&
                      validation.errors.titleEn ? (
                        <FormFeedback type="invalid">
                          {validation.errors.titleEn as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.titleEs')}</Label>
                      <Input
                        name="titleEs"
                        type="text"
                        placeholder="Ingrese título en español"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.titleEs}
                        invalid={
                          validation.touched.titleEs &&
                          validation.errors.titleEs
                            ? true
                            : false
                        }
                      />
                      {validation.touched.titleEs &&
                      validation.errors.titleEs ? (
                        <FormFeedback type="invalid">
                          {validation.errors.titleEs as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.descriptionEn')}</Label>
                      <textarea
                        name="descriptionEn"
                        className="form-control"
                        rows={3}
                        placeholder="Enter description in English"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.descriptionEn}
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
                      <Label>{t('services.addons.descriptionEs')}</Label>
                      <textarea
                        name="descriptionEs"
                        className="form-control"
                        rows={3}
                        placeholder="Ingrese descripción en español"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.descriptionEs}
                      />
                      {validation.touched.descriptionEs &&
                      validation.errors.descriptionEs ? (
                        <FormFeedback type="invalid" className="d-block">
                          {validation.errors.descriptionEs as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.duration.label')}</Label>
                      <Input
                        name="duration"
                        type="number"
                        placeholder="Enter duration in minutes"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.duration}
                        invalid={
                          validation.touched.duration &&
                          validation.errors.duration
                            ? true
                            : false
                        }
                      />
                      {validation.touched.duration &&
                      validation.errors.duration ? (
                        <FormFeedback type="invalid">
                          {validation.errors.duration as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label>{t('services.addons.status')}</Label>
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
                          {validation.values.status ? t('services.addons.active') : t('services.addons.inactive')}
                        </Label>
                      </div>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>Associated Services <span className="text-muted">(Optional)</span></Label>
                      <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Select services that can include this add-on
                      </p>
                      
                      {/* Selected chips */}
                      {validation.values.associatedServices && validation.values.associatedServices.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {validation.values.associatedServices.map((service: string) => (
                            <span key={service} className="badge bg-primary text-white fs-12 d-inline-flex align-items-center">
                              {service}
                              <button
                                type="button"
                                className="btn-close ms-2"
                                style={{ fontSize: '0.65rem', padding: '0.25rem' }}
                                onClick={() => {
                                  const currentValues = validation.values.associatedServices || [];
                                  validation.setFieldValue('associatedServices', currentValues.filter((s: string) => s !== service));
                                }}
                                aria-label="Remove"
                              ></button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dropdown selector */}
                      <div className="position-relative">
                        <Input
                          type="text"
                          placeholder="Click to select services..."
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
                            {["Manicure", "Pedicure", "Gel Nails", "Acrylic Nails"].map(service => {
                              const isSelected = validation.values.associatedServices?.includes(service) || false;
                              return (
                                <div
                                  key={service}
                                  className={`p-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    const currentValues = validation.values.associatedServices || [];
                                    if (isSelected) {
                                      validation.setFieldValue('associatedServices', currentValues.filter((s: string) => s !== service));
                                    } else {
                                      validation.setFieldValue('associatedServices', [...currentValues, service]);
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
                                      {service}
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
                    {isEdit ? t('common.update') : t('common.add')} {t('services.addons.addon')}
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
