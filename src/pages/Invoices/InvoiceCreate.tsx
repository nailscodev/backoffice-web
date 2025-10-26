import React from "react";
import { Container, Row, Col, Card, CardBody, Form, Label, Input, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { useDispatch } from "react-redux";
import { addNewInvoice as onAddNewInvoice } from "../../slices/thunks";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

const InvoiceCreate = () => {
  const dispatch: any = useDispatch();
  const navigate = useNavigate();

  document.title = "Manual Adjustment | Nails & Co Midtown - Admin Panel";

  const validation = useFormik({
    initialValues: {
      type: "income",
      concept: "",
      amount: "",
      paymentMethod: "cash",
      invoiceNumber: "",
      provider: "",
      date: new Date().toISOString(),
    },
    validationSchema: Yup.object({
      type: Yup.string().oneOf(["income", "expense"]).required(),
      concept: Yup.string().required("Concept is required"),
      amount: Yup.number().typeError("Amount must be a number").positive("Amount must be greater than 0").required("Amount is required"),
      paymentMethod: Yup.string().oneOf(["cash", "bank"]).required(),
    }),
    onSubmit: (values) => {
      const payload: any = {
        _id: Math.random().toString(36).substring(2, 9),
        invoiceId: values.invoiceNumber || null,
        type: values.type,
        concept: values.concept,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        provider: values.provider || null,
        date: values.date,
      };

      try {
        dispatch(onAddNewInvoice(payload));
        toast.success("Manual adjustment saved");
        navigate("/apps-invoices-list");
      } catch (e) {
        toast.error("Failed to save adjustment");
      }
    },
  });

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Manual Adjustment" pageTitle="Invoices" />
        <Row className="justify-content-center">
          <Col lg={6} xl={6}>
            <Card>
              <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                <CardBody>
                  <Row className="g-3">
                    <Col xs={12}>
                      <Label className="form-label">Type</Label>
                      <div className="d-flex gap-2">
                        <label className="btn btn-light p-2">
                          <Input type="radio" name="type" value="income" checked={validation.values.type === 'income'} onChange={validation.handleChange} />{' '}
                          Income
                        </label>
                        <label className="btn btn-light p-2">
                          <Input type="radio" name="type" value="expense" checked={validation.values.type === 'expense'} onChange={validation.handleChange} />{' '}
                          Expense
                        </label>
                      </div>
                    </Col>

                    <Col xs={12}>
                      <Label className="form-label">Concept</Label>
                      <Input
                        name="concept"
                        value={validation.values.concept}
                        onChange={validation.handleChange}
                        placeholder="E.g. Refund for order #123, Petty cash top-up"
                        invalid={!!(validation.touched.concept && validation.errors.concept)}
                      />
                      {validation.touched.concept && validation.errors.concept ? (
                        <div className="text-danger small mt-1">{(validation.errors.concept as string)}</div>
                      ) : null}
                    </Col>

                    <Col xs={12} md={6}>
                      <Label className="form-label">Amount</Label>
                      <Input
                        name="amount"
                        value={validation.values.amount}
                        onChange={validation.handleChange}
                        placeholder="0.00"
                      />
                      {validation.touched.amount && validation.errors.amount ? (
                        <div className="text-danger small mt-1">{(validation.errors.amount as string)}</div>
                      ) : null}
                    </Col>

                    <Col xs={12} md={6}>
                      <Label className="form-label">Payment Method</Label>
                      <Input type="select" name="paymentMethod" value={validation.values.paymentMethod} onChange={validation.handleChange}>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                      </Input>
                    </Col>

                    <Col xs={12} md={6}>
                      <Label className="form-label">Invoice Number (optional)</Label>
                      <Input name="invoiceNumber" value={validation.values.invoiceNumber} onChange={validation.handleChange} placeholder="#INV000123" />
                    </Col>

                    <Col xs={12} md={6}>
                      <Label className="form-label">Provider / Payee (optional)</Label>
                      <Input name="provider" value={validation.values.provider} onChange={validation.handleChange} placeholder="Supplier or payee name" />
                    </Col>

                    <Col xs={12} className="d-flex justify-content-end">
                      <Button color="secondary" outline className="me-2" onClick={() => navigate(-1)}>Cancel</Button>
                      <Button color="success" type="submit">Save</Button>
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
