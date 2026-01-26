import Select from 'react-select';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardBody, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Form, Input, Label, Modal, ModalBody, Offcanvas, OffcanvasBody, Row, UncontrolledDropdown, FormFeedback, Spinner } from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import DeleteModal from "../../../Components/Common/DeleteModal";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import avatar2 from '../../../assets/images/users/avatar-2.jpg';
import userdummyimg from '../../../assets/images/users/user-dummy-img.jpg';
import smallImage9 from '../../../assets/images/small/img-9.jpg';
import { 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff,
  activateStaff,
  deactivateStaff,
  Staff,
  StaffRole,
  StaffStatus
} from '../../../api/staff';
import { getServices, Service } from '../../../api/services';
import * as Yup from "yup";
import { useFormik } from "formik";

// Add styles for uniform card height in grid view and react-select badges
const gridViewStyles = `
.team-list.grid-view-filter > div {
    display: flex;
}
.team-list.grid-view-filter .team-box {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}
.team-list.grid-view-filter .team-box .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.team-list.grid-view-filter .team-row {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.team-list.grid-view-filter .team-stats-wrapper {
    margin-top: auto;
}

/* React-select multivalue badges styling */
.react-select__multi-value {
    background-color: var(--vz-primary-bg-subtle) !important;
    border-radius: 0.25rem !important;
    padding: 0.25rem 0.5rem !important;
    margin: 2px !important;
}
.react-select__multi-value__label {
    color: var(--vz-primary) !important;
    font-size: 0.75rem !important;
    padding: 0 !important;
    padding-left: 0 !important;
}
.react-select__multi-value__remove {
    color: var(--vz-primary) !important;
    cursor: pointer !important;
    padding-left: 4px !important;
}
.react-select__multi-value__remove:hover {
    background-color: transparent !important;
    color: var(--vz-danger) !important;
}

/* Inactive staff styling */
.team-box.inactive {
    opacity: 0.6;
}
.team-box.inactive .card-body {
    background-color: rgba(0, 0, 0, 0.02);
}
`;

// Helper to convert backend Staff to frontend team format
const mapStaffToTeam = (staff: Staff) => ({
    id: staff.id,
    name: staff.fullName,
    userImage: staff.avatarUrl || null,
    designation: staff.role,
    projectCount: staff.pendingBookingsCount || 0,
    taskCount: staff.completedBookingsCount || 0,
    specialties: staff.specialties || [],
    services: staff.services || [],
    status: staff.status,
    backgroundImg: smallImage9,
    _staffData: staff
});

const Team = () => {
    const { t, i18n } = useTranslation();
    document.title = `${t('team.page.title')} | Nails & Co Midtown - Admin Panel`;

    // Get current language for API calls
    const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';

    const [team, setTeam] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [teamList, setTeamlist] = useState<any>([]);
    const [allTeamData, setAllTeamData] = useState<any>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);

    //Modal  
    const [teamMem, setTeamMem] = useState<any>('');
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [modal, setModal] = useState<boolean>(false);

    // Inject styles for grid view
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = gridViewStyles;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Fetch staff from backend
    const fetchStaffData = async () => {
        try {
            setLoading(true);
            const response = await getStaff(1, 10000);
            const mappedData = response.data.map(mapStaffToTeam);
            setAllTeamData(mappedData);
            setTeamlist(mappedData);
        } catch (error: any) {
            console.error('Error fetching staff:', error);
            toast.error('Error al cargar el staff');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData();
        fetchServices();
    }, [currentLang]);

    const fetchServices = async () => {
        try {
            const response = await getServices(1, 1000, undefined, undefined, undefined, currentLang);
            setAvailableServices(response || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Error al cargar los servicios');
        }
    };

    const toggle = useCallback(() => {
        if (modal) {
            setModal(false);
            setTeamMem(null);
            setIsEdit(false);
        } else {
            setModal(true);
        }
    }, [modal]);

    // Close modal and reset form
    const handleCloseModal = () => {
        setModal(false);
        setTeamMem(null);
        setIsEdit(false);
        validation.resetForm();
    };

    // Update To do
    const handleTeamClick = useCallback((arg: any) => {
        const teamMem: any = arg;
        setTeamMem(teamMem);
        setIsEdit(true);
        toggle();
    }, [toggle]);

    // Add To do
    const handleTeamClicks = () => {
        setTeamMem(null);
        setIsEdit(false);
        setModal(true);
    };

    // delete
    const onClickData = (team: any) => {
        setTeam(team);
        setDeleteModal(true);
    };

    const handleDeleteTeamData = async () => {
        if (team) {
            try {
                await deleteStaff(team.id);
                toast.success('Staff eliminado exitosamente');
                setDeleteModal(false);
                fetchStaffData();
            } catch (error: any) {
                console.error('Error deleting staff:', error);
                toast.error('Error al eliminar el staff');
            }
        }
    };

    // Activate/Deactivate staff
    const handleToggleStaffStatus = async (staffId: string, currentStatus: string) => {
        try {
            if (currentStatus === 'ACTIVE') {
                await deactivateStaff(staffId);
                toast.success('Staff desactivado exitosamente');
            } else {
                await activateStaff(staffId);
                toast.success('Staff activado exitosamente');
            }
            fetchStaffData();
        } catch (error: any) {
            console.error('Error toggling staff status:', error);
            toast.error('Error al cambiar el estado del staff');
        }
    };

    useEffect(() => {
        const list = document.querySelectorAll(".team-list");
        const buttonGroups = document.querySelectorAll('.filter-button');
        for (let i = 0; i < buttonGroups.length; i++) {
            buttonGroups[i].addEventListener('click', onButtonGroupClick);
        }


        function onButtonGroupClick(event: any) {
            const target = event.target as HTMLButtonElement;
            const targetId = target.id;
            const parentTargetId = target.parentElement?.id;

            if (targetId === 'list-view-button' || parentTargetId === 'list-view-button') {
                document.getElementById("list-view-button")?.classList.add("active");
                document.getElementById("grid-view-button")?.classList.remove("active");

                list.forEach((el) => {
                    el.classList.add("list-view-filter");
                    el.classList.remove("grid-view-filter");
                });
            } else {
                document.getElementById("grid-view-button")?.classList.add("active");
                document.getElementById("list-view-button")?.classList.remove("active");

                list.forEach((el) => {
                    el.classList.remove("list-view-filter");
                    el.classList.add("grid-view-filter");
                });
            }
        }
    }, []);

    const favouriteBtn = (ele: any) => {
        if (ele.closest("button").classList.contains("active")) {
            ele.closest("button").classList.remove("active");
        } else {
            ele.closest("button").classList.add("active");
        }
    };

    const searchList = (e: any) => {
        let inputVal = e.target.value.toLowerCase();

        const filterItems = (arr: any, query: string) => {
            return arr.filter((el: any) => {
                return el.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
            });
        };

        let filterData = filterItems(allTeamData, inputVal);
        setTeamlist(filterData);

        const noResultElement = document.getElementById("noresult");
        const teamListElement = document.getElementById("teamlist");

        if (filterData.length === 0) {
            if (noResultElement) {
                noResultElement.style.display = "block";
            }
            if (teamListElement) {
                teamListElement.style.display = "none";
            }
        } else {
            if (noResultElement) {
                noResultElement.style.display = "none";
            }
            if (teamListElement) {
                teamListElement.style.display = "block";
            }
        }
    };
    

    //OffCanvas  
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [sideBar, setSideBar] = useState<any>([]);

    //Dropdown
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    const toggledropDown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // validation
    const validation: any = useFormik({
        // enableReinitialize : use this flag when initial values needs to be changed
        enableReinitialize: true,

        initialValues: {
            firstName: (teamMem && teamMem._staffData?.firstName) || '',
            lastName: (teamMem && teamMem._staffData?.lastName) || '',
            email: (teamMem && teamMem._staffData?.email) || '',
            phone: (teamMem && teamMem._staffData?.phone) || '',
            userImage: (teamMem && teamMem.userImage) || '',
            serviceIds: (teamMem && teamMem.services) ? teamMem.services.map((s: any) => s.id) : [],
            workingDays: (teamMem && teamMem._staffData?.workingDays) || [],
            // commissionPercentage: (teamMem && teamMem._staffData?.commissionPercentage) || '',
            // hourlyRate: (teamMem && teamMem._staffData?.hourlyRate) || '',
        },
        validationSchema: Yup.object({
            firstName: Yup.string().required(t('team.validation.first_name_required')),
            lastName: Yup.string().required(t('team.validation.last_name_required')),
            email: Yup.string().email(t('team.validation.email_invalid')).required(t('team.validation.email_required')),
            phone: Yup.string(),
            serviceIds: Yup.array().min(1, t('team.validation.services_required')),
            workingDays: Yup.array().min(1, t('team.validation.working_days_required')),
        }),
        onSubmit: async (values: any) => {
            try {
                setLoading(true);
                const staffData: any = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone || undefined,
                    role: StaffRole.TECHNICIAN,
                    serviceIds: values.serviceIds,
                    workingDays: values.workingDays.length > 0 ? values.workingDays : undefined,
                    // commissionPercentage: values.commissionPercentage ? parseFloat(values.commissionPercentage) : undefined,
                    // hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : undefined,
                    avatarUrl: values.userImage || undefined
                };

                if (isEdit && teamMem) {
                    await updateStaff(teamMem.id, staffData);
                    toast.success('Staff actualizado exitosamente');
                } else {
                    await createStaff(staffData);
                    toast.success('Staff creado exitosamente');
                }
                handleCloseModal();
                fetchStaffData();
            } catch (error: any) {
                console.error('Error saving staff:', error);
                toast.error(error.response?.data?.message || 'Error al guardar el staff');
            } finally {
                setLoading(false);
            }
        },
    });

      // Image Validation
  const [imgStore, setImgStore] = useState<any>();
  const [selectedImage, setSelectedImage] = useState<any>();

  const handleClick = (item: any) => {
    const newData = [...imgStore, item];
    setImgStore(newData);
    validation.setFieldValue('img', newData)
  }

  useEffect(() => {
    setImgStore((teamMem && teamMem.img) || [])
  }, [teamMem])

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      validation.setFieldValue('img', e.target.result);
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };


    return (
        <React.Fragment>
            <ToastContainer closeButton={false} limit={1} />
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeleteTeamData()}
                onCloseClick={() => setDeleteModal(false)}
            />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t('team.page.title')} pageTitle={t('pages')} />
                    <Card>
                        <CardBody>
                            <Row className="g-2">
                                <Col sm={4}>
                                    <div className="search-box">
                                        <Input type="text" className="form-control" placeholder={t('team.search_placeholder')} onChange={(e) => searchList(e)} />
                                        <i className="ri-search-line search-icon"></i>
                                    </div>
                                </Col>
                                <Col className="col-sm-auto ms-auto">
                                    <Button color="success" onClick={() => handleTeamClicks()}>
                                        <i className="ri-add-fill me-1 align-bottom"></i> {t('team.add_staff')}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Row>
                        <Col lg={12}>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner color="primary" />
                                    <p className="mt-3">Cargando staff...</p>
                                </div>
                            ) : (
                            <div id="teamlist">
                                <Row className="team-list grid-view-filter row-cols-xxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1">
                                    {(teamList || []).map((item: any, key: any) => (
                                        <Col key={key} className="mb-3">
                                            <Card className={`team-box ${item.status !== 'ACTIVE' ? 'inactive' : ''}`}>
                                                <div className="team-cover">
                                                    <img src={item.backgroundImg} alt="" className="img-fluid" />
                                                </div>
                                                <CardBody className="p-4">
                                                    <Row className="align-items-center team-row">
                                                        <Col className="team-settings text-end">
                                                            <UncontrolledDropdown direction='start'>
                                                                <DropdownToggle tag="a" id="dropdownMenuLink2" role="button">
                                                                    <i className="ri-more-fill fs-17"></i>
                                                                </DropdownToggle>
                                                                <DropdownMenu>
                                                                    <DropdownItem className="dropdown-item" onClick={() => { setIsOpen(!isOpen); setSideBar(item); }}>
                                                                        <i className="ri-user-line me-2 align-bottom text-muted"></i>{t('team.card.view_profile')}
                                                                    </DropdownItem>
                                                                    <DropdownItem className="dropdown-item edit-list" href="#addmemberModal" onClick={() => handleTeamClick(item)}>
                                                                        <i className="ri-pencil-line me-2 align-bottom text-muted"></i>{t('team.dropdown.edit')}
                                                                    </DropdownItem>
                                                                    <DropdownItem 
                                                                        className="dropdown-item" 
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleToggleStaffStatus(item.id, item.status);
                                                                        }}
                                                                    >
                                                                        {item.status === 'ACTIVE' ? (
                                                                            <>
                                                                                <i className="ri-close-circle-line me-2 align-bottom text-muted"></i>
                                                                                {t('team.dropdown.deactivate')}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="ri-checkbox-circle-line me-2 align-bottom text-muted"></i>
                                                                                {t('team.dropdown.activate')}
                                                                            </>
                                                                        )}
                                                                    </DropdownItem>
                                                                </DropdownMenu>
                                                            </UncontrolledDropdown>
                                                        </Col>
                                                        <Col lg={12} className="col mb-3">
                                                            <div className="team-profile-img">

                                                                <div className="avatar-lg img-thumbnail rounded-circle flex-shrink-0">
                                                                    {item.userImage != null ?
                                                                        <img src={item.userImage} alt="" className="img-fluid d-block rounded-circle" />

                                                                        :
                                                                        <div className="avatar-title text-uppercase border rounded-circle bg-light text-primary">
                                                                            {item.name.charAt(0) + item.name.split(" ").slice(-1).toString().charAt(0)}
                                                                        </div>}
                                                                </div>
                                                                <div className="team-content">
                                                                    <Link to="#" onClick={() => { setIsOpen(!isOpen); setSideBar(item); }}>
                                                                        <h5 className="fs-16 mb-1">
                                                                            {item.name}
                                                                            {item.status !== 'ACTIVE' && (
                                                                                <span className="badge bg-warning-subtle text-warning ms-2" style={{ fontSize: '0.7rem' }}>
                                                                                    {item.status}
                                                                                </span>
                                                                            )}
                                                                        </h5>
                                                                    </Link>
                                                                    {/* Render services as chips */}
                                                                    <div className="mt-1" style={{ 
                                                                        minHeight: '56px',
                                                                        display: 'flex',
                                                                        flexWrap: 'wrap',
                                                                        gap: '4px',
                                                                        alignContent: 'flex-start'
                                                                    }}>
                                                                        {Array.isArray(item.services) && item.services.length ? (
                                                                            <>
                                                                                {item.services.slice(0, 3).map((service: any, i: number) => (
                                                                                    <span key={i} className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.75rem' }}>{service.name}</span>
                                                                                ))}
                                                                                {item.services.length > 3 && (
                                                                                    <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.75rem' }}>+{item.services.length - 3} más</span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="badge bg-light text-muted">Sin servicios</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        
                                                        <div className="team-stats-wrapper">
                                                            <Col lg={12} className="col">
                                                                <Row className="text-muted text-center mb-3">
                                                                    <Col xs={6} className="border-end border-end-dashed">
                                                                        <h5 className="mb-1">{item.projectCount}</h5>
                                                                        <p className="text-muted mb-0">Pending</p>
                                                                    </Col>
                                                                    <Col xs={6}>
                                                                        <h5 className="mb-1">{item.taskCount}</h5>
                                                                        <p className="text-muted mb-0">Completed</p>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                            <Col lg={12} className="col">
                                                                <div className="text-center">
                                                                    <Link 
                                                                        to={`/apps-ecommerce-orders?staff=${item.id}&name=${encodeURIComponent(item.name)}`} 
                                                                        className="btn btn-light view-btn w-100"
                                                                    >
                                                                        <i className="ri-calendar-check-line me-1 align-bottom"></i>
                                                                        {t('team.card.view_reservations')}
                                                                    </Link>
                                                                </div>
                                                            </Col>
                                                        </div>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>

                                <div className="modal fade" id="addmembers" tabIndex={1} aria-hidden="true">
                                    <div className="modal-dialog modal-dialog-centered">
                                        <Modal isOpen={modal} toggle={handleCloseModal} centered>
                                            <ModalBody>
                                                <Form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}>
                                                    <Row>
                                                        <Col lg={12}>

                                                            <input type="hidden" id="memberid-input" className="form-control" defaultValue="" />
                                                            {/* <div className="px-1 pt-1">
                                                                <div className="modal-team-cover position-relative mb-0 mt-n4 mx-n4 rounded-top overflow-hidden">
                                                                    <img src={smallImage9} alt="" id="cover-img" className="img-fluid" />

                                                                    <div className="d-flex position-absolute start-0 end-0 top-0 p-3">
                                                                        <div className="flex-grow-1">
                                                                            <h5 className="modal-title text-white" id="createMemberLabel">{!isEdit ? t('team.modal.add_title') : t('team.modal.edit_title')}</h5>
                                                                        </div>
                                                                        <div className="flex-shrink-0">
                                                                            <div className="d-flex gap-3 align-items-center">
                                                                                <div>
                                                                                    <label htmlFor="cover-image-input" className="mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title={t('team.modal.select_cover_image')}>
                                                                                        <div className="avatar-xs">
                                                                                            <div className="avatar-title bg-light border rounded-circle text-muted cursor-pointer">
                                                                                                <i className="ri-image-fill"></i>
                                                                                            </div>
                                                                                        </div>
                                                                                    </label>
                                                                                    <input className="form-control d-none" defaultValue="" id="cover-image-input" type="file" accept="image/png, image/gif, image/jpeg" />
                                                                                </div>
                                                                                <button type="button" className="btn-close btn-close-white" onClick={() => setModal(false)} id="createMemberBtn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-center mb-4 mt-n5 pt-2">
                                                                <div className="position-relative d-inline-block">
                                                                    <div className="position-absolute bottom-0 end-0">
                                                                        <label htmlFor="member-image-input" className="mb-0" data-bs-toggle="tooltip" data-bs-placement="right" title={t('team.modal.select_member_image')}>
                                                                            <div className="avatar-xs">
                                                                                <div className="avatar-title bg-light border rounded-circle text-muted cursor-pointer">
                                                                                    <i className="ri-image-fill"></i>
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                        <Input className="form-control d-none" id="member-image-input" type="file"
                                                                            accept="image/png, image/gif, image/jpeg" onChange={handleImageChange}
                                                                            invalid={
                                                                                validation.touched.userImage && validation.errors.userImage ? true : false
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="avatar-lg" onClick={(item: any) => handleClick(item)}>
                                                                        <div className="avatar-title bg-light rounded-circle">
                                                                            <img src={ selectedImage || userdummyimg || validation.values.userImage} alt=" " id="member-img" className="avatar-md rounded-circle h-auto" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div> */}

                                                            <div className="mb-4">
                                                                <h5 className="modal-title" id="createMemberLabel">{!isEdit ? t('team.modal.add_title') : t('team.modal.edit_title')}</h5>
                                                            </div>

                                                            <Row>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="firstName" className="form-label">{t('team.form.first_name')} *</Label>
                                                                        <Input type="text" className="form-control" id="firstName" placeholder={t('team.form.first_name_placeholder')}
                                                                            name='firstName'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.firstName || ""}
                                                                            invalid={validation.touched.firstName && validation.errors.firstName ? true : false}
                                                                        />
                                                                        {validation.touched.firstName && validation.errors.firstName ? (
                                                                            <FormFeedback type="invalid">{validation.errors.firstName}</FormFeedback>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="lastName" className="form-label">{t('team.form.last_name')} *</Label>
                                                                        <Input type="text" className="form-control" id="lastName" placeholder={t('team.form.last_name_placeholder')}
                                                                            name='lastName'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.lastName || ""}
                                                                            invalid={validation.touched.lastName && validation.errors.lastName ? true : false}
                                                                        />
                                                                        {validation.touched.lastName && validation.errors.lastName ? (
                                                                            <FormFeedback type="invalid">{validation.errors.lastName}</FormFeedback>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            <Row>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="email" className="form-label">{t('team.form.email')} *</Label>
                                                                        <Input type="email" className="form-control" id="email" placeholder={t('team.form.email_placeholder')}
                                                                            name='email'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.email || ""}
                                                                            invalid={validation.touched.email && validation.errors.email ? true : false}
                                                                        />
                                                                        {validation.touched.email && validation.errors.email ? (
                                                                            <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="phone" className="form-label">{t('team.form.phone')}</Label>
                                                                        <Input type="text" className="form-control" id="phone" placeholder={t('team.form.phone_placeholder')}
                                                                            name='phone'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.phone || ""}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                        <Col lg={12}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="serviceIds" className="form-label">{t('team.form.services')} *</Label>
                                                                <Select
                                                                    id="serviceIds"
                                                                    name="serviceIds"
                                                                    isMulti
                                                                    closeMenuOnSelect={false}
                                                                    classNamePrefix="react-select"
                                                                    options={(availableServices || []).map(s => ({ value: s.id, label: s.name }))}
                                                                    value={(availableServices || [])
                                                                        .filter(s => (validation.values.serviceIds || []).includes(s.id))
                                                                        .map(s => ({ value: s.id, label: s.name }))}
                                                                    onChange={(selected: any) => {
                                                                        const values = selected ? selected.map((opt: any) => opt.value) : [];
                                                                        validation.setFieldValue('serviceIds', values);
                                                                    }}
                                                                    onBlur={validation.handleBlur}
                                                                    placeholder={t('team.form.services_placeholder')}
                                                                />
                                                                {validation.touched.serviceIds && validation.errors.serviceIds ? (
                                                                    <div className="invalid-feedback d-block">{validation.errors.serviceIds}</div>
                                                                ) : null}
                                                            </div>

                                                            <div className="mb-3">
                                                                <Label htmlFor="workingDays" className="form-label">{t('team.form.working_days')} *</Label>
                                                                <Select
                                                                    id="workingDays"
                                                                    name="workingDays"
                                                                    isMulti
                                                                    closeMenuOnSelect={false}
                                                                    classNamePrefix="react-select"
                                                                    options={[
                                                                        { value: 'Mon', label: t('team.days.monday') },
                                                                        { value: 'Tue', label: t('team.days.tuesday') },
                                                                        { value: 'Wed', label: t('team.days.wednesday') },
                                                                        { value: 'Thu', label: t('team.days.thursday') },
                                                                        { value: 'Fri', label: t('team.days.friday') },
                                                                        { value: 'Sat', label: t('team.days.saturday') },
                                                                        { value: 'Sun', label: t('team.days.sunday') },
                                                                    ]}
                                                                    value={(validation.values.workingDays || []).map((v: string) => {
                                                                        const option = [
                                                                            { value: 'Mon', label: t('team.days.monday') },
                                                                            { value: 'Tue', label: t('team.days.tuesday') },
                                                                            { value: 'Wed', label: t('team.days.wednesday') },
                                                                            { value: 'Thu', label: t('team.days.thursday') },
                                                                            { value: 'Fri', label: t('team.days.friday') },
                                                                            { value: 'Sat', label: t('team.days.saturday') },
                                                                            { value: 'Sun', label: t('team.days.sunday') },
                                                                        ].find(opt => opt.value === v);
                                                                        return option || { value: v, label: v };
                                                                    })}
                                                                    onChange={(selected: any) => {
                                                                        const values = selected ? selected.map((opt: any) => opt.value) : [];
                                                                        validation.setFieldValue('workingDays', values);
                                                                    }}
                                                                    onBlur={validation.handleBlur}
                                                                    placeholder={t('team.form.working_days_placeholder')}
                                                                />
                                                                {validation.touched.workingDays && validation.errors.workingDays ? (
                                                                    <div className="invalid-feedback d-block">{validation.errors.workingDays}</div>
                                                                ) : null}
                                                            </div>

                                                            {/* <Row>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="commissionPercentage" className="form-label">Comisión (%)</Label>
                                                                        <Input type="number" step="0.01" className="form-control" id="commissionPercentage"
                                                                            name='commissionPercentage'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.commissionPercentage || ""}
                                                                            placeholder="15.5"
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="hourlyRate" className="form-label">Tarifa por Hora ($)</Label>
                                                                        <Input type="number" step="0.01" className="form-control" id="hourlyRate"
                                                                            name='hourlyRate'
                                                                            onChange={validation.handleChange}
                                                                            onBlur={validation.handleBlur}
                                                                            value={validation.values.hourlyRate || ""}
                                                                            placeholder="25.00"
                                                                        />
                                                                    </div>
                                                                </Col>
                                                            </Row> */}
                                                        </Col>
                                                        {/* <Col lg={6}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="projects" className="form-label">{t('team.form.projects_label')}</Label>
                                                                <Input type="text" className="form-control" id="projects" placeholder={t('team.form.projects_placeholder')} name='projectCount'
                                                                    validate={{
                                                                        required: { value: true },
                                                                    }}
                                                                    onChange={validation.handleChange}
                                                                    onBlur={validation.handleBlur}
                                                                    value={validation.values.projectCount || ""}
                                                                    invalid={
                                                                        validation.touched.projectCount && validation.errors.projectCount ? true : false
                                                                    }
                                                                />
                                                                {validation.touched.projectCount && validation.errors.projectCount ? (
                                                                    <FormFeedback type="invalid">{validation.errors.projectCount}</FormFeedback>
                                                                ) : null}
                                                            </div>
                                                        </Col>
                                                        <Col lg={6}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="tasks" className="form-label">{t('team.form.tasks_label')}</Label>
                                                                <Input type="text" className="form-control" id="tasks" placeholder={t('team.form.tasks_placeholder')} name='taskCount'
                                                                    validate={{
                                                                        required: { value: true },
                                                                    }}
                                                                    onChange={validation.handleChange}
                                                                    onBlur={validation.handleBlur}
                                                                    value={validation.values.taskCount || ""}
                                                                    invalid={
                                                                        validation.touched.taskCount && validation.errors.taskCount ? true : false
                                                                    }
                                                                />
                                                                {validation.touched.taskCount && validation.errors.taskCount ? (
                                                                    <FormFeedback type="invalid">{validation.errors.taskCount}</FormFeedback>
                                                                ) : null}
                                                            </div>
                                                        </Col> */}
                                                        <Col lg={12}>
                                                            <div className="hstack gap-2 justify-content-end">
                                                                <button type="button" className="btn btn-light" onClick={handleCloseModal}>{t('team.form.close')}</button>
                                                                <button type="submit" className="btn btn-success" id="addNewMember">{!isEdit ? t('team.form.add_member') : t('team.form.save')}</button>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Form>
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                </div>

                                <Offcanvas
                                    isOpen={isOpen}
                                    direction="end"
                                    toggle={() => setIsOpen(!isOpen)}
                                    className="offcanvas-end border-0"
                                    tabIndex={1}
                                    id="member-overview"
                                >
                                    <OffcanvasBody className="profile-offcanvas p-0">
                                        <div className="team-cover">
                                            <img src={sideBar.backgroundImg || smallImage9} alt="" className="img-fluid" />
                                        </div>
                                        <div className="p-3">
                                            <div className="team-settings">
                                                <Row>
                                                    <Col>
                                                        <button type="button" className="btn btn-light btn-icon rounded-circle btn-sm favourite-btn "> <i className="ri-star-fill fs-14"></i> </button>
                                                    </Col>
                                                    <UncontrolledDropdown direction='start' className="col text-end">
                                                        <DropdownToggle tag="a" id="dropdownMenuLink14" role="button">
                                                            <i className="ri-more-fill fs-17"></i>
                                                        </DropdownToggle>
                                                        <DropdownMenu>
                                                            <DropdownItem><i className="ri-star-line me-2 align-middle" />{t('team.actions.favorites')}</DropdownItem>
                                                            <DropdownItem><i className="ri-delete-bin-5-line me-2 align-middle" />{t('team.actions.delete')}</DropdownItem>
                                                        </DropdownMenu>
                                                    </UncontrolledDropdown>
                                                </Row>
                                            </div>
                                        </div>
                                        <div className="p-3 text-center">
                                            <img src={sideBar.userImage || avatar2} alt="" className="avatar-lg img-thumbnail rounded-circle mx-auto" />
                                            <div className="mt-3">
                                                <h5 className="fs-15 profile-name"><Link to="#" className="link-primary">{sideBar.name || "Nancy Martino"}</Link></h5>
                                                <p className="text-muted profile-designation">{sideBar.designation || "Team Leader & HR"}</p>
                                            </div>
                                            <div className="hstack gap-2 justify-content-center mt-4">
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-secondary-subtle text-secondary rounded fs-16">
                                                        <i className="ri-facebook-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-success-subtle text-success rounded fs-16">
                                                        <i className="ri-slack-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-info-subtle text-info rounded fs-16">
                                                        <i className="ri-linkedin-fill"></i>
                                                    </Link>
                                                </div>
                                                <div className="avatar-xs">
                                                    <Link to="#" className="avatar-title bg-danger-subtle text-danger rounded fs-16">
                                                        <i className="ri-dribbble-fill"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <Row className="g-0 text-center">
                                            <Col xs={6}>
                                                <div className="p-3 border border-dashed border-start-0">
                                                    <h5 className="mb-1 profile-project">{sideBar.projectCount || "0"}</h5>
                                                    <p className="text-muted mb-0">Pending</p>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-3 border border-dashed border-start-0">
                                                    <h5 className="mb-1 profile-task">{sideBar.taskCount || "0"}</h5>
                                                    <p className="text-muted mb-0">Completed</p>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="p-3">
                                            <h5 className="fs-15 mb-3">{t('team.profile.personal_details')}</h5>
                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">{t('team.profile.number')}</p>
                                                <h6>+(256) 2451 8974</h6>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">{t('team.profile.email')}</p>
                                                <h6>nancymartino@email.com</h6>
                                            </div>
                                            <div>
                                                <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">{t('team.profile.location')}</p>
                                                <h6 className="mb-0">Carson City - USA</h6>
                                            </div>
                                        </div>
                                        {sideBar.services && sideBar.services.length > 0 && (
                                            <div className="p-3 border-top">
                                                <h5 className="fs-15 mb-3">Servicios que Brinda</h5>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-borderless mb-0">
                                                        <tbody>
                                                            {sideBar.services.map((service: any, idx: number) => (
                                                                <tr key={idx}>
                                                                    <td className="py-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="flex-shrink-0 avatar-xs me-2">
                                                                                <div className="avatar-title bg-primary-subtle text-primary rounded fs-16">
                                                                                    <i className="ri-scissors-cut-line"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-grow-1">
                                                                                <h6 className="mb-0 fs-14">{service.name}</h6>
                                                                                <p className="text-muted mb-0 fs-12">{service.duration} min</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-end py-2">
                                                                        <span className="fw-medium">${(service.price / 100).toFixed(2)}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-3 border-top">
                                            <h5 className="fs-15 mb-4">{t('team.file.title')}</h5>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-danger-subtle text-danger rounded fs-16">
                                                        <i className="ri-image-2-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">{t('team.file.images')}</Link></h6>
                                                    <p className="text-muted mb-0">4469 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    12 GB
                                                </div>
                                            </div>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-secondary-subtle text-secondary rounded fs-16">
                                                        <i className="ri-file-zip-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">{t('team.file.documents')}</Link></h6>
                                                    <p className="text-muted mb-0">46 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    3.46 GB
                                                </div>
                                            </div>
                                            <div className="d-flex mb-3">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-success-subtle text-success rounded fs-16">
                                                        <i className="ri-live-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">{t('team.file.media')}</Link></h6>
                                                    <p className="text-muted mb-0">124 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    4.3 GB
                                                </div>
                                            </div>
                                            <div className="d-flex">
                                                <div className="flex-shrink-0 avatar-xs">
                                                    <div className="avatar-title bg-primary-subtle text-primary rounded fs-16">
                                                        <i className="ri-error-warning-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-1"><Link to="#">{t('team.file.others')}</Link></h6>
                                                    <p className="text-muted mb-0">18 Files</p>
                                                </div>
                                                <div className="text-muted">
                                                    846 MB
                                                </div>
                                            </div>
                                        </div>
                                    </OffcanvasBody>
                                    <div className="offcanvas-foorter border p-3 hstack gap-3 text-center position-relative">
                                        <button className="btn btn-light w-100"><i className="ri-question-answer-fill align-bottom ms-1"></i> {t('team.offcanvas.send_message')}</button>
                                        <Link to="/pages-profile" className="btn btn-primary w-100"><i className="ri-user-3-fill align-bottom ms-1"></i> {t('team.card.view_profile')}</Link>
                                    </div>
                                </Offcanvas>
                            </div>
                            )}
                                <div className="py-4 mt-4 text-center" id="noresult" style={{ display: "none" }}>
                                <i className="ri-search-line display-5 text-success"></i>
                                <h5 className="mt-4">{t('team.no_results')}</h5>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Team;