import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Button } from 'reactstrap';
import classnames from "classnames";
import { useTranslation } from 'react-i18next';
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//import images
import progileBg from '../../../../assets/images/Hero.jpg';

const Settings = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("1");
    const [userInitials, setUserInitials] = useState("AD");
    const [userName, setUserName] = useState("Admin User");
    const [userRole, setUserRole] = useState("Administrator");

    const tabChange = (tab: any) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    useEffect(() => {
        // Check for tab parameter in URL
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam === 'password') {
            setActiveTab("2");
        }
    }, [location]);

    useEffect(() => {
        const authUser = sessionStorage.getItem("authUser");
        if (authUser) {
            const obj = JSON.parse(authUser);
            const firstName = obj.data?.first_name || obj.first_name || "Admin";
            const lastName = obj.data?.last_name || obj.last_name || "User";
            
            setUserName(`${firstName} ${lastName}`);
            const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            setUserInitials(initials || "AD");
            
            // TODO: Get user role from backend
            // setUserRole(obj.role || "Administrator");
        }
    }, []);

    // Validation for Personal Details
    const validationPersonal: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
        },
        validationSchema: Yup.object({
            firstName: Yup.string().required(t('profile.first_name_required')),
            lastName: Yup.string().required(t('profile.last_name_required')),
            email: Yup.string().email(t('profile.email_invalid')).required(t('profile.email_required')),
            phone: Yup.string().required(t('profile.phone_required')),
        }),
        onSubmit: (values) => {
            // TODO: Connect with API
            console.log('Personal details:', values);
            toast.success(t('profile.updated_successfully'), { autoClose: 3000 });
        },
    });

    // Validation for Password Change
    const validationPassword: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            oldPassword: Yup.string().required(t('profile.current_password_required')),
            newPassword: Yup.string().min(6, t('profile.new_password_min')).required(t('profile.new_password_required')),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword')], t('profile.passwords_must_match'))
                .required(t('profile.confirm_password_required')),
        }),
        onSubmit: (values) => {
            // TODO: Connect with API
            console.log('Password change:', values);
            toast.success(t('profile.password_changed_successfully'), { autoClose: 3000 });
            validationPassword.resetForm();
        },
    });

    document.title = "Profile Settings | Nails & Co Midtown - Admin Panel";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="position-relative mx-n4 mt-n4">
                        <div className="profile-wid-bg profile-setting-img">
                            <img src={progileBg} className="profile-wid-img" alt="" />
                        </div>
                    </div>
                    <Row>
                        <Col xxl={3}>
                            <Card className="mt-n5">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="profile-user position-relative d-inline-block mx-auto mb-4">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold" 
                                                 style={{ width: '96px', height: '96px', fontSize: '36px' }}>
                                                {userInitials}
                                            </div>
                                        </div>
                                        <h5 className="fs-16 mb-1">{userName}</h5>
                                        <p className="text-muted mb-0">{userRole}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xxl={9}>
                            <Card className="mt-xxl-n5">
                                <CardHeader>
                                    <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0"
                                        role="tablist">
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "1" })}
                                                onClick={() => {
                                                    tabChange("1");
                                                }}>
                                                <i className="ri-user-line me-1"></i>
                                                {t('profile.personal_details')}
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink to="#"
                                                className={classnames({ active: activeTab === "2" })}
                                                onClick={() => {
                                                    tabChange("2");
                                                }}
                                                type="button">
                                                <i className="ri-lock-line me-1"></i>
                                                {t('profile.change_password')}
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId="1">
                                            <Form onSubmit={(e) => {
                                                e.preventDefault();
                                                validationPersonal.handleSubmit();
                                                return false;
                                            }}>
                                                <Row>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="firstnameInput" className="form-label">
                                                                {t('profile.first_name')}
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control" 
                                                                id="firstnameInput"
                                                                name="firstName"
                                                                placeholder={t('profile.first_name_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.firstName || ""}
                                                                invalid={validationPersonal.touched.firstName && validationPersonal.errors.firstName ? true : false}
                                                            />
                                                            {validationPersonal.touched.firstName && validationPersonal.errors.firstName ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.firstName}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="lastnameInput" className="form-label">
                                                                {t('profile.last_name')}
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control" 
                                                                id="lastnameInput"
                                                                name="lastName"
                                                                placeholder={t('profile.last_name_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.lastName || ""}
                                                                invalid={validationPersonal.touched.lastName && validationPersonal.errors.lastName ? true : false}
                                                            />
                                                            {validationPersonal.touched.lastName && validationPersonal.errors.lastName ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.lastName}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="emailInput" className="form-label">
                                                                {t('profile.email')}
                                                            </Label>
                                                            <Input 
                                                                type="email" 
                                                                className="form-control" 
                                                                id="emailInput"
                                                                name="email"
                                                                placeholder={t('profile.email_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.email || ""}
                                                                invalid={validationPersonal.touched.email && validationPersonal.errors.email ? true : false}
                                                            />
                                                            {validationPersonal.touched.email && validationPersonal.errors.email ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.email}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="phonenumberInput" className="form-label">
                                                                {t('profile.phone')}
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control"
                                                                id="phonenumberInput"
                                                                name="phone"
                                                                placeholder={t('profile.phone_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.phone || ""}
                                                                invalid={validationPersonal.touched.phone && validationPersonal.errors.phone ? true : false}
                                                            />
                                                            {validationPersonal.touched.phone && validationPersonal.errors.phone ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.phone}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <div className="hstack gap-2 justify-content-end">
                                                            <Button type="submit" color="primary">
                                                                {t('profile.update')}
                                                            </Button>
                                                            <Button type="button" color="light" onClick={() => validationPersonal.resetForm()}>
                                                                {t('profile.cancel')}
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>

                                        <TabPane tabId="2">
                                            <Form onSubmit={(e) => {
                                                e.preventDefault();
                                                validationPassword.handleSubmit();
                                                return false;
                                            }}>
                                                <Row className="g-2">
                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="oldpasswordInput" className="form-label">
                                                                {t('profile.current_password')}*
                                                            </Label>
                                                            <Input 
                                                                type="password" 
                                                                className="form-control"
                                                                id="oldpasswordInput"
                                                                name="oldPassword"
                                                                placeholder={t('profile.current_password_placeholder')}
                                                                onChange={validationPassword.handleChange}
                                                                onBlur={validationPassword.handleBlur}
                                                                value={validationPassword.values.oldPassword || ""}
                                                                invalid={validationPassword.touched.oldPassword && validationPassword.errors.oldPassword ? true : false}
                                                            />
                                                            {validationPassword.touched.oldPassword && validationPassword.errors.oldPassword ? (
                                                                <div className="invalid-feedback d-block">{validationPassword.errors.oldPassword}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="newpasswordInput" className="form-label">
                                                                {t('profile.new_password')}*
                                                            </Label>
                                                            <Input 
                                                                type="password" 
                                                                className="form-control"
                                                                id="newpasswordInput" 
                                                                name="newPassword"
                                                                placeholder={t('profile.new_password_placeholder')}
                                                                onChange={validationPassword.handleChange}
                                                                onBlur={validationPassword.handleBlur}
                                                                value={validationPassword.values.newPassword || ""}
                                                                invalid={validationPassword.touched.newPassword && validationPassword.errors.newPassword ? true : false}
                                                            />
                                                            {validationPassword.touched.newPassword && validationPassword.errors.newPassword ? (
                                                                <div className="invalid-feedback d-block">{validationPassword.errors.newPassword}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="confirmpasswordInput" className="form-label">
                                                                {t('profile.confirm_password')}*
                                                            </Label>
                                                            <Input 
                                                                type="password" 
                                                                className="form-control"
                                                                id="confirmpasswordInput"
                                                                name="confirmPassword"
                                                                placeholder={t('profile.confirm_password_placeholder')}
                                                                onChange={validationPassword.handleChange}
                                                                onBlur={validationPassword.handleBlur}
                                                                value={validationPassword.values.confirmPassword || ""}
                                                                invalid={validationPassword.touched.confirmPassword && validationPassword.errors.confirmPassword ? true : false}
                                                            />
                                                            {validationPassword.touched.confirmPassword && validationPassword.errors.confirmPassword ? (
                                                                <div className="invalid-feedback d-block">{validationPassword.errors.confirmPassword}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>

                                                    <Col lg={12}>
                                                        <div className="text-end">
                                                            <Button type="submit" color="success">
                                                                {t('profile.change_password')}
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>
                                    </TabContent>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer closeButton={false} limit={1} />
            </div>
        </React.Fragment>
    );
};

export default Settings;
