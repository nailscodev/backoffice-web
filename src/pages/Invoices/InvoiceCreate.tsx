import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Form, Label, Input, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { createManualAdjustment } from "../../helpers/backend_helper";
import { useTranslation } from 'react-i18next';

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  document.title = `${t('invoices.form.title', 'Manual Adjustment')} | Nails & Co Midtown - Admin Panel`;

  const validation = useFormik({
    initialValues: {
      type: "income",
      concept: "",
      amount: "",
      paymentMethod: "CASH",
    },
    validationSchema: Yup.object({
      type: Yup.string().oneOf(["income", "expense"]).required(),
      concept: Yup.string().required(t('invoices.form.concept', 'Concept is required')),
      amount: Yup.number()
        .typeError(t('invoices.form.amount', 'Amount must be a number'))
        .positive(t('invoices.form.amount', 'Amount must be greater than 0'))
        .required(t('invoices.form.amount', 'Amount is required')),
      paymentMethod: Yup.string().oneOf(["CASH", "CARD"]).required(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await createManualAdjustment({
          type: values.type as 'income' | 'expense',
          description: values.concept,
          amount: Number(values.amount),
          paymentMethod: values.paymentMethod as 'CASH' | 'CARD',
        });
        
        toast.success(t('invoices.toast.saved', 'Manual adjustment saved successfully'));
        navigate("/apps-invoices-list");
      } catch (error: any) {
        console.error('Error creating adjustment:', error);
        const errorMessage = error?.response?.data?.message || t('invoices.toast.save_failed', 'Failed to save adjustment');
        toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={t('invoices.form.title', 'Manual Adjustment')} pageTitle={t('invoices.page_title', 'Invoices')} />
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card>
              <CardHeader className="border-bottom">
                <h5 className="card-title mb-0">
                  <i className="ri-file-edit-line align-middle me-1 text-muted"></i>
                  {t('invoices.form.title', 'Manual Adjustment')}
                </h5>
              </CardHeader>
              <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                <CardBody>
                  <Row className="g-3">
                    {/* Type Selection */}
                    <Col xs={12}>
                      <Label className="form-label fw-semibold">
                        {t('invoices.form.type', 'Type')} <span className="text-danger">*</span>
                      </Label>
                      <div className="d-flex gap-3">
                        <div className="form-check card-radio">
                          <Input
                            className="form-check-input"
                            type="radio"
                            name="type"
                            id="typeIncome"
                            value="income"
                            checked={validation.values.type === 'income'}
                            onChange={validation.handleChange}
                          />
                          <Label className="form-check-label d-flex align-items-center" htmlFor="typeIncome">
                            <i className="ri-arrow-up-circle-line text-success me-2 fs-18"></i>
                            <span>{t('invoices.form.income', 'Income')}</span>
                          </Label>
                        </div>
                        <div className="form-check card-radio">
                          <Input
                            className="form-check-input"
                            type="radio"
                            name="type"
                            id="typeExpense"
                            value="expense"
                            checked={validation.values.type === 'expense'}
                            onChange={validation.handleChange}
                          />
                          <Label className="form-check-label d-flex align-items-center" htmlFor="typeExpense">
                            <i className="ri-arrow-down-circle-line text-danger me-2 fs-18"></i>
                            <span>{t('invoices.form.expense', 'Expense')}</span>
                          </Label>
                        </div>
                      </div>
                    </Col>

                    {/* Concept/Description */}
                    <Col xs={12}>
                      <Label className="form-label fw-semibold" htmlFor="concept">
                        {t('invoices.form.concept', 'Concept')} <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="concept"
                        name="concept"
                        type="textarea"
                        rows={3}
                        value={validation.values.concept}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        placeholder={t('invoices.form.concept_placeholder', 'E.g. Refund for order #123, Petty cash top-up, Equipment purchase')}
                        invalid={!!(validation.touched.concept && validation.errors.concept)}
                        className={validation.touched.concept && validation.errors.concept ? 'is-invalid' : ''}
                      />
                      {validation.touched.concept && validation.errors.concept ? (
                        <div className="invalid-feedback d-block">{validation.errors.concept as string}</div>
                      ) : null}
                    </Col>

                    {/* Amount and Payment Method */}
                    <Col xs={12} md={6}>
                      <Label className="form-label fw-semibold" htmlFor="amount">
                        {t('invoices.form.amount', 'Amount')} <span className="text-danger">*</span>
                      </Label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={validation.values.amount}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          placeholder={t('invoices.form.amount_placeholder', '0.00')}
                          invalid={!!(validation.touched.amount && validation.errors.amount)}
                          className={validation.touched.amount && validation.errors.amount ? 'is-invalid' : ''}
                        />
                      </div>
                      {validation.touched.amount && validation.errors.amount ? (
                        <div className="invalid-feedback d-block">{validation.errors.amount as string}</div>
                      ) : null}
                    </Col>

                    <Col xs={12} md={6}>
                      <Label className="form-label fw-semibold" htmlFor="paymentMethod">
                        {t('invoices.form.payment_method', 'Payment Method')} <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="paymentMethod"
                        type="select"
                        name="paymentMethod"
                        value={validation.values.paymentMethod}
                        onChange={validation.handleChange}
                        className="form-select"
                      >
                        <option value="CASH">{t('invoices.form.payment_cash', 'Cash')}</option>
                        <option value="CARD">{t('invoices.form.payment_bank', 'Bank/Card')}</option>
                      </Input>
                    </Col>

                    {/* Info Alert */}
                    <Col xs={12}>
                      <div className={`alert ${validation.values.type === 'income' ? 'alert-success' : 'alert-danger'} alert-border-left mb-0`}>
                        <i className={`ri-information-line me-3 align-middle fs-16`}></i>
                        <strong>
                          {validation.values.type === 'income'
                            ? t('invoices.form.income_info', 'This will increase your cash flow')
                            : t('invoices.form.expense_info', 'This will decrease your cash flow')}
                        </strong>
                      </div>
                    </Col>

                    {/* Action Buttons */}
                    <Col xs={12} className="d-flex justify-content-end gap-2 mt-4">
                      <Button
                        color="light"
                        outline
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                      >
                        <i className="ri-close-line align-middle me-1"></i>
                        {t('invoices.form.cancel', 'Cancel')}
                      </Button>
                      <Button
                        color={validation.values.type === 'income' ? 'success' : 'danger'}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t('invoices.form.saving', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line align-middle me-1"></i>
                            {t('invoices.form.save', 'Save Adjustment')}
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InvoiceCreate;
