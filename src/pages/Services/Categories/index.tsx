import React, { useState } from "react";
import {
  Card,
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
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";

interface Category {
  id: number;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  image: string;
  excludingCategories: number[];
}

const Categories = () => {
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Mock data - esto se reemplazará con Redux
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      titleEn: "Manicure",
      titleEs: "Manicura",
      descriptionEn: "Professional manicure services",
      descriptionEs: "Servicios profesionales de manicura",
      image: "https://thumbs.dreamstime.com/z/manicure-treatment-nail-salon-closeup-shot-women-receiving-beautician-file-woman-getting-beautician-55414826.jpg?ct=jpeg",
      excludingCategories: [] as number[],
    },
    {
      id: 2,
      titleEn: "Pedicure",
      titleEs: "Pedicura",
      descriptionEn: "Professional pedicure services",
      descriptionEs: "Servicios profesionales de pedicura",
      image: "https://as1.ftcdn.net/v2/jpg/15/77/63/40/1000_F_1577634084_NELWuiLyXkF6pSo6ME9JcVNIru3LWfX5.jpg",
      excludingCategories: [] as number[],
    },
  ]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setSelectedCategory(null);
      setIsEdit(false);
      setShowDropdown(false);
    } else {
      setModal(true);
    }
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsEdit(true);
    setModal(true);
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      titleEn: (selectedCategory && selectedCategory.titleEn) || "",
      titleEs: (selectedCategory && selectedCategory.titleEs) || "",
      descriptionEn: (selectedCategory && selectedCategory.descriptionEn) || "",
      descriptionEs: (selectedCategory && selectedCategory.descriptionEs) || "",
      image: (selectedCategory && selectedCategory.image) || "",
      excludingCategories: (selectedCategory && selectedCategory.excludingCategories) || [] as number[],
    },
    validationSchema: Yup.object({
      titleEn: Yup.string().required("English title is required"),
      titleEs: Yup.string().required("Spanish title is required"),
      descriptionEn: Yup.string().required("English description is required"),
      descriptionEs: Yup.string().required("Spanish description is required"),
      image: Yup.string().url("Must be a valid URL"),
      excludingCategories: Yup.array().of(Yup.number()),
    }),
    onSubmit: (values) => {
      if (isEdit && selectedCategory) {
        const updatedCategories = categories.map((cat) =>
          cat.id === selectedCategory.id ? { ...cat, ...values } : cat
        );
        setCategories(updatedCategories);
      } else {
        const newCategory = {
          id: categories.length + 1,
          ...values,
        };
        setCategories([...categories, newCategory]);
      }
      toggle();
      validation.resetForm();
    },
  });

  const handleDelete = (id: number) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('menu.admin.services.categories')} pageTitle={t('menu.admin.services.title')} />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center mb-4">
                    <h5 className="card-title flex-grow-1 mb-0">
                      {t('services.categories.title')}
                    </h5>
                    <Button
                      color="success"
                      onClick={() => {
                        setIsEdit(false);
                        setSelectedCategory(null);
                        toggle();
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> {t('services.categories.add')}
                    </Button>
                  </div>

                  <Row>
                    {categories.map((category) => (
                      <Col xl={3} lg={4} md={6} key={category.id}>
                        <Card className="border">
                          <CardBody>
                            <div className="text-center">
                              <img
                                src={category.image}
                                alt={category.titleEn}
                                className="img-fluid rounded mb-3"
                                style={{ height: "150px", objectFit: "cover" }}
                              />
                              <h5 className="mb-1">{category.titleEn}</h5>
                              <p className="text-muted small mb-1">
                                {category.titleEs}
                              </p>
                              <p className="text-muted small">
                                {category.descriptionEn}
                              </p>
                            </div>
                            <div className="d-flex gap-2 mt-3">
                              <Button
                                color="primary"
                                size="sm"
                                className="flex-fill"
                                onClick={() => handleEdit(category)}
                              >
                                <i className="ri-pencil-line"></i> Edit
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                className="flex-fill"
                                onClick={() => handleDelete(category.id)}
                              >
                                <i className="ri-delete-bin-line"></i> Delete
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Modal isOpen={modal} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
              {isEdit ? t('services.categories.edit') : t('services.categories.add')}
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
                      <Label>{t('services.categories.descriptionEn')}</Label>
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
                      <Label>{t('services.categories.descriptionEs')}</Label>
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
                      <Label>Description (English)</Label>
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
                      <Label>Descripción (Español)</Label>
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
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.image')}</Label>
                      <Input
                        name="image"
                        type="text"
                        placeholder="Enter image URL"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.image}
                        invalid={
                          validation.touched.image && validation.errors.image
                            ? true
                            : false
                        }
                      />
                      {validation.touched.image && validation.errors.image ? (
                        <FormFeedback type="invalid">
                          {validation.errors.image as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.excludingCategories')} <span className="text-muted">({t('common.optional')})</span></Label>
                      <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {t('services.categories.excludingCategories.hint')}
                      </p>
                      
                      {/* Selected chips */}
                      {validation.values.excludingCategories && validation.values.excludingCategories.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                        {validation.values.excludingCategories.map((catId: number) => {
                          const cat = categories.find(c => c.id === catId);
                          return cat ? (
                            <span key={catId} className="badge bg-primary-subtle text-primary fs-12 d-inline-flex align-items-center">
                                {cat.titleEn} / {cat.titleEs}
                                <button
                                  type="button"
                                  className="btn-close ms-2"
                                  style={{ fontSize: '0.65rem', padding: '0.25rem' }}
                                  onClick={() => {
                                    const currentValues = validation.values.excludingCategories || [];
                                    validation.setFieldValue('excludingCategories', currentValues.filter((id: number) => id !== catId));
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
                          placeholder={t('services.categories.excludingCategories.placeholder')}
                          onClick={() => setShowDropdown(!showDropdown)}
                          readOnly
                          style={{ cursor: 'pointer' }}
                        />
                        {showDropdown && (
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
                            {categories
                              .filter(cat => !selectedCategory || cat.id !== selectedCategory.id)
                              .map(cat => {
                                const isSelected = validation.values.excludingCategories?.includes(cat.id) || false;
                                return (
                                  <div
                                    key={cat.id}
                                    className={`p-2 cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const currentValues = validation.values.excludingCategories || [];
                                      if (isSelected) {
                                        validation.setFieldValue('excludingCategories', currentValues.filter((id: number) => id !== cat.id));
                                      } else {
                                        validation.setFieldValue('excludingCategories', [...currentValues, cat.id]);
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
                                        {cat.titleEn} / {cat.titleEs}
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
                    {isEdit ? t('common.update') : t('common.add')} {t('menu.admin.services.categories')}
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

export default Categories;
