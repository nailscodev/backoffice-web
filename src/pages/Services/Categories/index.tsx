import React, { useState, useEffect } from "react";
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
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import CloudinaryUploadWidget from "../../../Components/Common/CloudinaryUploadWidget";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory, Category } from "../../../api/categories";
import { toast } from "react-toastify";

const Categories = () => {
  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [i18n.language]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Map frontend language codes to backend codes
      const langMap: { [key: string]: string } = {
        'sp': 'ES',
        'en': 'EN',
      };
      const currentLang = langMap[i18n.language] || i18n.language.toUpperCase();
      console.log('Fetching categories with lang:', currentLang);
      const data = await getCategories(currentLang);
      console.log('Categories received:', data);
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
      console.log('Loading finished');
    }
  };

  const toggle = () => {
    if (modal) {
      setModal(false);
      setSelectedCategory(null);
      setIsEdit(false);
    } else {
      setModal(true);
    }
  };

  const handleEdit = async (category: Category) => {
    try {
      // Fetch full category data with translations
      const response = await getCategory(category.id);
      const fullCategory = response.data || response;
      console.log('Full category data:', fullCategory);
      setSelectedCategory(fullCategory);
      setIsEdit(true);
      setModal(true);
    } catch (error) {
      console.error("Error loading category:", error);
      toast.error("Error loading category data");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: (selectedCategory && selectedCategory.name) || "",
      displayOrder: (selectedCategory && selectedCategory.displayOrder) || 0,
      imageUrl: (selectedCategory && selectedCategory.imageUrl) || "",
      titleEn: (selectedCategory && selectedCategory.titleEn) || "",
      titleEs: (selectedCategory && selectedCategory.titleEs) || "",
      descriptionEn: (selectedCategory && selectedCategory.descriptionEn) || "",
      descriptionEs: (selectedCategory && selectedCategory.descriptionEs) || "",
    },
    validationSchema: Yup.object({
      displayOrder: Yup.number().required("Display order is required"),
      imageUrl: Yup.string().url("Must be a valid URL"),
      titleEn: Yup.string().required(t("services.categories.required.titleEn")),
      titleEs: Yup.string().required(t("services.categories.required.titleEs")),
      descriptionEn: Yup.string(),
      descriptionEs: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        console.log("Submitting form values:", values);
        
        const categoryData = {
          name: values.titleEn, // Use titleEn as the base name
          displayOrder: values.displayOrder,
          imageUrl: values.imageUrl,
          titleEn: values.titleEn,
          titleEs: values.titleEs,
          descriptionEn: values.descriptionEn,
          descriptionEs: values.descriptionEs,
        };
        
        if (isEdit && selectedCategory) {
          // Update existing category
          await updateCategory(selectedCategory.id, categoryData);
          toast.success("Category updated successfully");
        } else {
          // Create new category
          await createCategory(categoryData);
          toast.success("Category created successfully");
        }
        
        // Refresh categories list
        await fetchCategories();
        
        // Close modal and reset form
        toggle();
        validation.resetForm();
      } catch (error: any) {
        console.error("Error submitting category:", error);
        toast.error(error.message || "Failed to save category");
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm("Are you sure you want to delete this category?")) {
        return;
      }
      
      await deleteCategory(id);
      toast.success("Category deleted successfully");
      
      // Refresh categories list
      await fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
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

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Loading...</p>
                    </div>
                  ) : !categories || categories.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted">No categories found (count: {categories?.length || 0})</p>
                    </div>
                  ) : (
                    <>
                      {console.log('Rendering categories:', categories)}
                      <Row>
                        {categories.map((category) => (
                        <Col xl={3} lg={4} md={6} key={category.id}>
                          <Card className="border">
                            <CardBody>
                              <div className="text-center">
                                <div 
                                  className="bg-light rounded mb-3 d-flex align-items-center justify-content-center"
                                  style={{ height: "150px", overflow: "hidden" }}
                                >
                                  {category.imageUrl ? (
                                    <img 
                                      src={category.imageUrl} 
                                      alt={category.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  ) : (
                                    <i className="ri-price-tag-3-line" style={{ fontSize: "4rem", color: "#ccc" }}></i>
                                  )}
                                </div>
                                <h5 className="mb-2">{category.name}</h5>
                              </div>
                              <div className="d-flex gap-2 mt-3">
                                <Button
                                  color="primary"
                                  size="sm"
                                  className="flex-fill"
                                  onClick={() => handleEdit(category)}
                                >
                                  <i className="ri-pencil-line"></i> {t("common.edit")}
                                </Button>
                                <Button
                                  color="danger"
                                  size="sm"
                                  className="flex-fill"
                                  onClick={() => handleDelete(category.id)}
                                >
                                  <i className="ri-delete-bin-line"></i> {t("common.delete")}
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                      </Row>
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Modal isOpen={modal} toggle={toggle} centered>
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
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.titleEn')}</Label>
                      <Input
                        name="titleEn"
                        type="text"
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
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.descriptionEn')}</Label>
                      <Input
                        name="descriptionEn"
                        type="textarea"
                        rows={3}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.descriptionEn}
                      />
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.titleEs')}</Label>
                      <Input
                        name="titleEs"
                        type="text"
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
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('services.categories.descriptionEs')}</Label>
                      <Input
                        name="descriptionEs"
                        type="textarea"
                        rows={3}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.descriptionEs}
                      />
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>{t('common.order')}</Label>
                      <Input
                        name="displayOrder"
                        type="number"
                        placeholder="0"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.displayOrder}
                        invalid={
                          validation.touched.displayOrder &&
                          validation.errors.displayOrder
                            ? true
                            : false
                        }
                      />
                      {validation.touched.displayOrder &&
                      validation.errors.displayOrder ? (
                        <FormFeedback type="invalid">
                          {validation.errors.displayOrder as string}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-3">
                      <Label>Category Image</Label>
                      <CloudinaryUploadWidget
                        currentImage={validation.values.imageUrl}
                        onUploadSuccess={(url) => {
                          console.log('onUploadSuccess called with URL:', url);
                          validation.setFieldValue('imageUrl', url);
                          console.log('Field value updated');
                        }}
                        folder="nailsco/categories"
                      />
                      {validation.touched.imageUrl && validation.errors.imageUrl ? (
                        <div className="text-danger small mt-1">
                          {validation.errors.imageUrl as string}
                        </div>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <div className="hstack gap-2 justify-content-end">
                  <Button color="light" onClick={toggle}>
                    {t('common.close')}
                  </Button>
                  <Button color="success" type="submit">
                    {isEdit ? t('common.update') : t('common.add')}
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
