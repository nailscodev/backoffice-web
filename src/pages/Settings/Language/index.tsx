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

const LanguageManagement = () => {
  const { t } = useTranslation();

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [template, setTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([
    // Datos de ejemplo - TODO: Conectar con API
    {
      id: 1,
      identifier: "confirmationEmail",
      description: "Confirmation email sent after booking",
      text_english: "Thank you for your reservation. Your appointment has been confirmed.",
      text_spanish: "Gracias por su reserva. Su cita ha sido confirmada."
    },
    {
      id: 2,
      identifier: "reminderEmail",
      description: "Reminder email sent before appointment",
      text_english: "This is a reminder for your upcoming appointment.",
      text_spanish: "Este es un recordatorio de su próxima cita."
    },
    {
      id: 3,
      identifier: "welcomeEmail",
      description: "Welcome email for new users",
      text_english: "Welcome to NailsCo! We're excited to have you.",
      text_spanish: "¡Bienvenido a NailsCo! Estamos emocionados de tenerte."
    }
  ]);

  // Delete template
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setTemplate(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  // Delete Data
  const onClickDelete = (template: any) => {
    setTemplate(template);
    setDeleteModal(true);
  };

  // validation
  const validation: any = useFormik({
    enableReinitialize: true,

    initialValues: {
      identifier: (template && template.identifier) || '',
      description: (template && template.description) || '',
      text_english: (template && template.text_english) || '',
      text_spanish: (template && template.text_spanish) || '',
    },
    validationSchema: Yup.object({
      identifier: Yup.string().required(t('settings.language.form.identifier') + ' is required'),
      description: Yup.string().required(t('settings.language.form.description') + ' is required'),
      text_english: Yup.string().required(t('settings.language.form.text_english') + ' is required'),
      text_spanish: Yup.string().required(t('settings.language.form.text_spanish') + ' is required'),
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateTemplate = {
          id: template ? template.id : 0,
          identifier: values.identifier,
          description: values.description,
          text_english: values.text_english,
          text_spanish: values.text_spanish,
        };
        // Update template in the list
        setTemplates(templates.map(t => t.id === updateTemplate.id ? updateTemplate : t));
        toast.success(t('Template updated successfully'), { autoClose: 3000 });
      } else {
        const newTemplate = {
          id: Math.max(...templates.map(t => t.id), 0) + 1,
          identifier: values.identifier,
          description: values.description,
          text_english: values.text_english,
          text_spanish: values.text_spanish,
        };
        // Add new template to the list
        setTemplates([...templates, newTemplate]);
        toast.success(t('Template created successfully'), { autoClose: 3000 });
      }
      validation.resetForm();
      toggle();
    },
  });

  // Delete Data
  const handleDeleteTemplate = () => {
    if (template) {
      setTemplates(templates.filter(t => t.id !== template.id));
      setDeleteModal(false);
      toast.success(t('Template deleted successfully'), { autoClose: 3000 });
    }
  };

  // Update Data
  const handleTemplateClick = useCallback((arg: any) => {
    const template = arg;

    setTemplate({
      id: template.id,
      identifier: template.identifier,
      description: template.description,
      text_english: template.text_english,
      text_spanish: template.text_spanish,
    });

    setIsEdit(true);
    toggle();
  }, [toggle]);

  // Add button
  const handleTemplateClicks = () => {
    setTemplate(null);
    setIsEdit(false);
    toggle();
  };

  // Columns
  const columns = useMemo(
    () => [
      {
        header: t('settings.language.table.identifier'),
        accessorKey: "identifier",
        enableColumnFilter: false,
        cell: (cell: any) => {
          return (
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h5 className="fs-14 mb-0">
                  <Link to="#" className="text-dark">{cell.getValue()}</Link>
                </h5>
              </div>
            </div>
          );
        },
      },
      {
        header: t('settings.language.table.description'),
        accessorKey: "description",
        enableColumnFilter: false,
      },
      {
        header: t('settings.language.table.english'),
        accessorKey: "text_english",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const text = cell.getValue();
          return (
            <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
              <span className="text-muted">{text}</span>
            </div>
          );
        },
      },
      {
        header: t('settings.language.table.spanish'),
        accessorKey: "text_spanish",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const text = cell.getValue();
          return (
            <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
              <span className="text-muted">{text}</span>
            </div>
          );
        },
      },
      {
        header: t('settings.language.table.actions'),
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit" title="Edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    const templateData = cellProps.row.original;
                    handleTemplateClick(templateData);
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
                    const templateData = cellProps.row.original;
                    onClickDelete(templateData);
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
    [handleTemplateClick, t]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('settings.language.title')} pageTitle={t('menu.admin.settings.title')} />
          <Row>
            <Col lg={12}>
              <Card id="templateList">
                <CardHeader className="border-0 mb-3">
                  <Row className="g-4 align-items-center">
                    <Col sm={3}>
                      <div className="search-box">
                        <Input
                          type="text"
                          className="form-control search"
                          placeholder={t('settings.language.search_placeholder')}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                    </Col>
                    <div className="col-sm-auto ms-auto">
                      <div className="hstack gap-2">
                        <Button
                          color="success"
                          className="add-btn"
                          onClick={() => handleTemplateClicks()}
                          id="create-btn"
                        >
                          <i className="ri-add-line align-bottom me-1"></i> {t('settings.language.add_template')}
                        </Button>
                      </div>
                    </div>
                  </Row>
                </CardHeader>
                <div className="card-body pt-0">
                  <div>
                    <TableContainer
                      columns={columns}
                      data={templates || []}
                      isGlobalFilter={false}
                      customPageSize={10}
                      divClass="table-responsive table-card mb-1"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted"
                    />
                  </div>

                  <Modal id="showModal" isOpen={modal} toggle={toggle} centered size="lg">
                    <ModalHeader className="bg-light p-3" toggle={toggle}>
                      {!!isEdit ? t('settings.language.edit_template') : t('settings.language.add_template')}
                    </ModalHeader>

                    <Form className="tablelist-form" onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}>
                      <ModalBody>
                        <input type="hidden" id="id-field" />

                        <div className="mb-3">
                          <Label htmlFor="identifier-field" className="form-label">{t('settings.language.form.identifier')}</Label>
                          <Input
                            name="identifier"
                            id="identifier-field"
                            className="form-control"
                            placeholder={t('settings.language.form.identifier_placeholder')}
                            type="text"
                            disabled={isEdit}
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.identifier || ""}
                            invalid={
                              validation.touched.identifier && validation.errors.identifier ? true : false
                            }
                          />
                          {validation.touched.identifier && validation.errors.identifier ? (
                            <FormFeedback type="invalid">{validation.errors.identifier}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="description-field" className="form-label">{t('settings.language.form.description')}</Label>
                          <Input
                            name="description"
                            id="description-field"
                            className="form-control"
                            placeholder={t('settings.language.form.description_placeholder')}
                            type="text"
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.description || ""}
                            invalid={
                              validation.touched.description && validation.errors.description ? true : false
                            }
                          />
                          {validation.touched.description && validation.errors.description ? (
                            <FormFeedback type="invalid">{validation.errors.description}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="text_english-field" className="form-label">{t('settings.language.form.text_english')}</Label>
                          <Input
                            name="text_english"
                            id="text_english-field"
                            className="form-control"
                            placeholder={t('settings.language.form.text_english')}
                            type="textarea"
                            rows={4}
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.text_english || ""}
                            invalid={
                              validation.touched.text_english && validation.errors.text_english ? true : false
                            }
                          />
                          {validation.touched.text_english && validation.errors.text_english ? (
                            <FormFeedback type="invalid">{validation.errors.text_english}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="text_spanish-field" className="form-label">{t('settings.language.form.text_spanish')}</Label>
                          <Input
                            name="text_spanish"
                            id="text_spanish-field"
                            className="form-control"
                            placeholder={t('settings.language.form.text_spanish')}
                            type="textarea"
                            rows={4}
                            validate={{
                              required: { value: true },
                            }}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.text_spanish || ""}
                            invalid={
                              validation.touched.text_spanish && validation.errors.text_spanish ? true : false
                            }
                          />
                          {validation.touched.text_spanish && validation.errors.text_spanish ? (
                            <FormFeedback type="invalid">{validation.errors.text_spanish}</FormFeedback>
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
                            {!!isEdit ? "Update" : "Add Template"}
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
        onDeleteClick={handleDeleteTemplate}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default LanguageManagement;
