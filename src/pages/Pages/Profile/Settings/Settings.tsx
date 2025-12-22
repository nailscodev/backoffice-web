import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Button } from 'reactstrap';
import classnames from "classnames";
import { useTranslation } from 'react-i18next';
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// API helpers
import { changeUserPassword, updateUserProfile } from '../../../../helpers/backend_helper';

//import images
import progileBg from '../../../../assets/images/Hero.jpg';

const Settings = () => {
    const { t } = useTranslation();
    const location = useLocation();
    
    // Get user data from Redux (Login slice)
    const loginData = createSelector(
        (state: any) => state.Login,
        (login) => login.user
    );
    const userData = useSelector(loginData);
    
    const [activeTab, setActiveTab] = useState("1");
    const [userInitials, setUserInitials] = useState("AD");
    const [userName, setUserName] = useState("Admin User");
    const [userRole, setUserRole] = useState("Administrator");
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);

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
        // Get user data from Redux state (Login.user)
        if (userData && Object.keys(userData).length > 0) {
            // Set user ID
            setUserId(userData.id || null);
            
            // Set user name
            const name = userData.name || userData.username || "Admin User";
            setUserName(name);
            
            // Set user role - use translation key
            const role = userData.role || "user";
            const roleKey = `profile.role_${role.toLowerCase()}`;
            setUserRole(t(roleKey));
            
            // Set user initials
            setUserInitials(userData.initials || "AD");
        }
    }, [userData, t]);

    // Validation for Personal Details
    const validationPersonal: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: userData?.name || userData?.first_name || '',
            username: userData?.username || '',
            email: userData?.email || '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required(t('profile.name_required')),
            username: Yup.string().required(t('profile.username_required')),
            email: Yup.string().email(t('profile.email_invalid')).required(t('profile.email_required')),
        }),
        onSubmit: async (values: any) => {
            if (!userId) {
                toast.error('No se pudo identificar el usuario. Por favor, inicie sesión nuevamente.', { autoClose: 3000 });
                return;
            }

            setIsLoadingPersonal(true);
            try {
                await updateUserProfile(userId, {
                    name: values.name,
                    username: values.username,
                    email: values.email,
                });
                
                toast.success(t('profile.updated_successfully'), { autoClose: 3000 });
            } catch (error: any) {
                console.error('Error updating profile:', error);
                
                let errorMessage = 'Error al actualizar el perfil';
                
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (Array.isArray(error)) {
                    errorMessage = error.filter((msg: any) => msg).join('. ') || errorMessage;
                } else if (error?.message) {
                    if (Array.isArray(error.message)) {
                        errorMessage = error.message.filter((msg: any) => msg).join('. ') || errorMessage;
                    } else {
                        errorMessage = error.message;
                    }
                }
                
                if (typeof errorMessage !== 'string') {
                    errorMessage = String(errorMessage);
                }
                
                toast.error(errorMessage, { autoClose: 5000 });
            } finally {
                setIsLoadingPersonal(false);
            }
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
            newPassword: Yup.string()
                .min(6, t('profile.new_password_min'))
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
                )
                .required(t('profile.new_password_required')),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword')], t('profile.passwords_must_match'))
                .required(t('profile.confirm_password_required')),
        }),
        onSubmit: async (values: any) => {
            if (!userId) {
                toast.error('No se pudo identificar el usuario. Por favor, inicie sesión nuevamente.', { autoClose: 3000 });
                return;
            }

            setIsLoadingPassword(true);
            try {
                const result = await changeUserPassword(userId, {
                    currentPassword: values.oldPassword,
                    newPassword: values.newPassword,
                });
                
                toast.success(t('profile.password_changed_successfully'), { autoClose: 3000 });
                validationPassword.resetForm();
            } catch (error: any) {
                console.error('Error changing password:', error);
                
                // Handle specific error messages
                let errorMessage = 'Error al cambiar la contraseña';
                
                // The error from backend_helper is already extracted
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (Array.isArray(error)) {
                    // Backend might return an array of messages - join them
                    errorMessage = error.filter((msg: any) => msg).join('. ') || errorMessage;
                } else if (error?.message) {
                    // error.message might be an array or string
                    if (Array.isArray(error.message)) {
                        errorMessage = error.message.filter((msg: any) => msg).join('. ') || errorMessage;
                    } else {
                        errorMessage = error.message;
                    }
                }
                
                // Ensure errorMessage is a string before using string methods
                if (typeof errorMessage !== 'string') {
                    errorMessage = String(errorMessage);
                }
                
                // Check for common error types and provide user-friendly messages
                if (errorMessage.toLowerCase().includes('incorrect') || 
                    errorMessage.toLowerCase().includes('invalid current') ||
                    errorMessage.toLowerCase().includes('wrong')) {
                    errorMessage = 'La contraseña actual es incorrecta';
                } else if (errorMessage.toLowerCase().includes('unauthorized')) {
                    errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
                } else if (errorMessage.toLowerCase().includes('csrf')) {
                    errorMessage = 'Error de seguridad. Por favor, recargue la página e inténtelo de nuevo.';
                } else if (errorMessage.toLowerCase().includes('uppercase') || 
                           errorMessage.toLowerCase().includes('lowercase') ||
                           errorMessage.toLowerCase().includes('special character')) {
                    // Keep the original validation error message from backend
                    errorMessage = 'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial';
                }
                
                toast.error(errorMessage, { autoClose: 5000 });
            } finally {
                setIsLoadingPassword(false);
            }
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
                                                            <Label htmlFor="nameInput" className="form-label">
                                                                {t('profile.name')} *
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control" 
                                                                id="nameInput"
                                                                name="name"
                                                                placeholder={t('profile.name_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.name || ""}
                                                                invalid={validationPersonal.touched.name && validationPersonal.errors.name ? true : false}
                                                            />
                                                            {validationPersonal.touched.name && validationPersonal.errors.name ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.name}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="usernameInput" className="form-label">
                                                                {t('profile.username')} *
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control" 
                                                                id="usernameInput"
                                                                name="username"
                                                                placeholder={t('profile.username_placeholder')}
                                                                onChange={validationPersonal.handleChange}
                                                                onBlur={validationPersonal.handleBlur}
                                                                value={validationPersonal.values.username || ""}
                                                                invalid={validationPersonal.touched.username && validationPersonal.errors.username ? true : false}
                                                            />
                                                            {validationPersonal.touched.username && validationPersonal.errors.username ? (
                                                                <div className="invalid-feedback d-block">{validationPersonal.errors.username}</div>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="emailInput" className="form-label">
                                                                {t('profile.email')} *
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
                                                            <Label htmlFor="roleInput" className="form-label">
                                                                {t('profile.role')}
                                                            </Label>
                                                            <Input 
                                                                type="text" 
                                                                className="form-control" 
                                                                id="roleInput"
                                                                value={userRole}
                                                                readOnly
                                                                disabled
                                                            />
                                                            <small className="text-muted">{t('profile.role_read_only')}</small>
                                                        </div>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <div className="hstack gap-2 justify-content-end">
                                                            <Button 
                                                                type="submit" 
                                                                color="primary"
                                                                disabled={isLoadingPersonal}
                                                            >
                                                                {isLoadingPersonal ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                        {t('profile.updating')}
                                                                    </>
                                                                ) : (
                                                                    t('profile.update')
                                                                )}
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
                                                            <Button 
                                                                type="submit" 
                                                                color="success"
                                                                disabled={isLoadingPassword}
                                                            >
                                                                {isLoadingPassword ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                        Cambiando...
                                                                    </>
                                                                ) : (
                                                                    t('profile.change_password')
                                                                )}
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
