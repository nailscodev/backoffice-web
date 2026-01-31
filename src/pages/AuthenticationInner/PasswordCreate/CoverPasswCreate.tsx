import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Card, Col, Container, Row, Form, Label, Input, FormFeedback } from 'reactstrap';

import AuthSlider from '../authCarousel';

//formik
import { useFormik } from 'formik';
import * as Yup from 'yup';

const CoverPasswCreate = () => {
    document.title = "Create New Password | Nails & Co Midtown - Admin Panel";

    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const [confirmPasswordShow, setconfirmPasswordShow] = useState<boolean>(false);   

    const { token } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            newPassword: "",
            confirm_password: "",
        },
        validationSchema: Yup.object({
            newPassword: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .matches(RegExp('(.*[a-z].*)'), 'At least lowercase letter')
                .matches(RegExp('(.*[A-Z].*)'), 'At least uppercase letter')
                .matches(RegExp('(.*[0-9].*)'), 'At least one number')
                .required("La nueva contraseña es requerida"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref('newPassword'), ""],)
                .required('Confirm Password is required')
        }),
        onSubmit: async (values) => {
            setError(null);
            setSuccess(null);
            try {
                const response = await axios.post(
                    "/api/v1/users/reset-password",
                    {
                        token,
                        newPassword: values.newPassword
                    },
                    { headers: { "Content-Type": "application/json" } }
                );
                if (response && response.data) {
                    setSuccess(response.data.message || "Password reset successfully");
                    setTimeout(() => navigate("/login"), 2000);
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || "Error resetting password");
            }
        }
    });
    return (
        <React.Fragment>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden">
                                    <Row className="justify-content-center g-0">
                                        <AuthSlider />
                                        <Col lg={6}>
                                            <div className="p-lg-5 p-4">
                                                <h5 className="text-primary">Create new password</h5>
                                                <p className="text-muted">Your new password must be different from previous used password.</p>

                                                <div className="p-2">
                                                    {error && <div className="alert alert-danger">{error}</div>}
                                                    {success && <div className="alert alert-success">{success}</div>}
                                                    <Form onSubmit={validation.handleSubmit}>
                                                        <div className="mb-3">
                                                            <Label className="form-label" htmlFor="password-input">Password</Label>
                                                            <div className="position-relative auth-pass-inputgroup">
                                                                <Input
                                                                    type={passwordShow ? "text" : "password"}
                                                                    className="form-control pe-5 password-input"
                                                                    placeholder="Enter password"
                                                                    id="password-input"
                                                                    name="newPassword"
                                                                    value={validation.values.newPassword}
                                                                    onBlur={validation.handleBlur}
                                                                    onChange={validation.handleChange}
                                                                    invalid={validation.errors.newPassword && validation.touched.newPassword ? true : false}
                                                                />
                                                                {validation.errors.newPassword && validation.touched.newPassword ? (
                                                                    <FormFeedback type="invalid">{validation.errors.newPassword}</FormFeedback>
                                                                ) : null}
                                                                <Button color="link" onClick={() => setPasswordShow(!passwordShow)} className="position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                                                                    id="password-addon"><i className="ri-eye-fill align-middle"></i></Button>
                                                            </div>
                                                            <div id="passwordInput" className="form-text">Must be at least 8 characters.</div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Label className="form-label" htmlFor="confirm-password-input">Confirm Password</Label>
                                                            <div className="position-relative auth-pass-inputgroup mb-3">
                                                                <Input
                                                                    type={confirmPasswordShow ? "text" : "password"}
                                                                    className="form-control pe-5 password-input"
                                                                    placeholder="Confirm password"
                                                                    id="confirm-password-input"
                                                                    name="confirm_password"
                                                                    value={validation.values.confirm_password}
                                                                    onBlur={validation.handleBlur}
                                                                    onChange={validation.handleChange}
                                                                    invalid={validation.errors.confirm_password && validation.touched.confirm_password ? true : false}
                                                                />
                                                                {validation.errors.confirm_password && validation.touched.confirm_password ? (
                                                                    <FormFeedback type="invalid">{validation.errors.confirm_password}</FormFeedback>
                                                                ) : null}
                                                                <Button color="link" onClick={() => setconfirmPasswordShow(!confirmPasswordShow)} className="position-absolute end-0 top-0 text-decoration-none text-muted password-addon">
                                                                <i className="ri-eye-fill align-middle"></i></Button>
                                                            </div>
                                                        </div>

                                                        <div id="password-contain" className="p-3 bg-light mb-2 rounded">
                                                            <h5 className="fs-13">Password must contain:</h5>
                                                            <p id="pass-length" className="invalid fs-12 mb-2">Minimum <b>8 characters</b></p>
                                                            <p id="pass-lower" className="invalid fs-12 mb-2">At <b>lowercase</b> letter (a-z)</p>
                                                            <p id="pass-upper" className="invalid fs-12 mb-2">At least <b>uppercase</b> letter (A-Z)</p>
                                                            <p id="pass-number" className="invalid fs-12 mb-0">A least <b>number</b> (0-9)</p>
                                                        </div>

                                                        <div className="form-check">
                                                            <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                                                            <Label className="form-check-label" htmlFor="auth-remember-check">Remember me</Label>
                                                        </div>

                                                        <div className="mt-4">
                                                            <Button color="success" className="w-100" type="submit">Reset Password</Button>
                                                        </div>
                                                    </Form>
                                                </div>

                                                <div className="mt-5 text-center">
                                                    <p className="mb-0">Wait, I remember my password... <Link to="/auth-signin-cover" className="fw-semibold text-primary text-decoration-underline"> Click here </Link> </p>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <footer className="footer">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center">
                                    
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </React.Fragment>
    );
};

export default CoverPasswCreate;