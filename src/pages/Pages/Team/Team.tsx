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
import { getCategories, Category } from '../../../api/categories';
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

/* Category buttons styling */
.category-button {
    color: #000 !important;
}
.category-button.btn-success {
    background-color: #198754;
    border-color: #198754;
    color: #000 !important;
}
.category-button.btn-outline-secondary {
    color: #000 !important;
    border-color: #6c757d;
}
.category-button.btn-outline-secondary:hover {
    background-color: #6c757d;
    color: #000 !important;
}
.category-button .badge {
    color: #000 !important;
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

// Time format utilities for AM/PM conversion
const convert24to12 = (time24: string): { time: string, period: string } => {
    if (!time24) return { time: '09:00', period: 'AM' };
    
    const [hours, minutes] = time24.split(':').map(Number);
    let period = 'AM';
    let hour12 = hours;
    
    if (hours === 0) {
        hour12 = 12;
    } else if (hours === 12) {
        period = 'PM';
    } else if (hours > 12) {
        hour12 = hours - 12;
        period = 'PM';
    }
    
    const formattedHour = hour12.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return { 
        time: `${formattedHour}:${formattedMinutes}`, 
        period 
    };
};

const convert12to24 = (time12: string, period: string): string => {
    const [hours, minutes] = time12.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'AM' && hours === 12) {
        hour24 = 0;
    } else if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Custom Time Picker Component with AM/PM format
interface TimePickerProps {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    isInvalid?: boolean;
}

// Helper functions for formatting working days and shifts
const formatWorkingDays = (workingDays: string[], t: (key: string) => string): string => {
    if (!workingDays || workingDays.length === 0) return 'No set';
    
    // Detect language based on a translation
    const isSpanish = t('team.days.monday').toLowerCase().includes('lun') || t('team.days.monday') === 'Lunes';
    
    const dayMap: { [key: string]: string } = isSpanish ? {
        'Mon': 'Lun',
        'Tue': 'Mar', 
        'Wed': 'Mié',
        'Thu': 'Jue',
        'Fri': 'Vie',
        'Sat': 'Sáb',
        'Sun': 'Dom'
    } : {
        'Mon': 'Mon',
        'Tue': 'Tue', 
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri',
        'Sat': 'Sat',
        'Sun': 'Sun'
    };
    
    return workingDays.map(day => dayMap[day] || day).join(', ');
};

const formatShiftTimes = (shifts: Array<{ shiftStart: string; shiftEnd: string }>): string => {
    if (!shifts || shifts.length === 0) return 'No shifts';
    
    const formatShift = (shift: { shiftStart: string; shiftEnd: string }) => {
        const { time: startTime, period: startPeriod } = convert24to12(shift.shiftStart);
        const { time: endTime, period: endPeriod } = convert24to12(shift.shiftEnd);
        
        // Remove leading zeros and show full format
        const formatTime = (time: string, period: string) => {
            const cleanTime = time.replace(/^0/, ''); // Remove leading zero from hour
            return `${cleanTime}${period}`;
        };
        
        const start = formatTime(startTime, startPeriod);
        const end = formatTime(endTime, endPeriod);
        
        return `${start} - ${end}`;
    };
    
    if (shifts.length === 1) {
        return formatShift(shifts[0]);
    }
    
    // Multiple shifts - show all shifts on separate lines
    return shifts.map(shift => formatShift(shift)).join('\n');
};

const TimePicker: React.FC<TimePickerProps> = ({ id, name, value, onChange, className, isInvalid }) => {
    const { time, period } = convert24to12(value);
    const [currentTime, setCurrentTime] = useState(time);
    const [currentPeriod, setCurrentPeriod] = useState(period);

    React.useEffect(() => {
        const { time: newTime, period: newPeriod } = convert24to12(value);
        setCurrentTime(newTime);
        setCurrentPeriod(newPeriod);
    }, [value]);

    const handleTimeChange = (newTime: string, newPeriod: string) => {
        const time24 = convert12to24(newTime, newPeriod);
        onChange(time24);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setCurrentTime(newTime);
        handleTimeChange(newTime, currentPeriod);
    };

    const handlePeriodChange = (newPeriod: string) => {
        setCurrentPeriod(newPeriod);
        handleTimeChange(currentTime, newPeriod);
    };

    return (
        <div className="d-flex">
            <Input
                type="time"
                id={id}
                name={name}
                value={currentTime}
                onChange={handleInputChange}
                className={`form-control ${className || ''} ${isInvalid ? 'is-invalid' : ''}`}
                style={{ flex: 1, marginRight: '8px' }}
            />
            <div className="btn-group" role="group">
                <Button
                    type="button"
                    color={currentPeriod === 'AM' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handlePeriodChange('AM')}
                    style={{ minWidth: '45px' }}
                >
                    AM
                </Button>
                <Button
                    type="button"
                    color={currentPeriod === 'PM' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handlePeriodChange('PM')}
                    style={{ minWidth: '45px' }}
                >
                    PM
                </Button>
            </div>
        </div>
    );
};

const Team = () => {
    const { t, i18n } = useTranslation();
    document.title = `${t('team.page.title')} | Nails & Co Midtown - Admin Panel`;

    // Get current language for API calls
    const currentLang = (i18n.language === 'sp' || i18n.language === 'es') ? 'ES' : 'EN';

    const [team, setTeam] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [teamList, setTeamlist] = useState<any>([]);
    const [allTeamData, setAllTeamData] = useState<any>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

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
        fetchCategories();
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

    const fetchCategories = async () => {
        try {
            const response = await getCategories(currentLang);
            setAvailableCategories(response || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error al cargar las categorías');
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
            isWebVisible: (teamMem && teamMem._staffData?.isWebVisible !== undefined) ? teamMem._staffData.isWebVisible : true,
            workingDays: (teamMem && teamMem._staffData?.workingDays) || [],
            shifts: (teamMem && teamMem._staffData?.shifts?.length > 0 && 
                     Array.isArray(teamMem._staffData.shifts) &&
                     teamMem._staffData.shifts.every((shift: any) => 
                         shift && typeof shift === 'object' && shift.shiftStart && shift.shiftEnd
                     )) 
                     ? teamMem._staffData.shifts 
                     : [{ shiftStart: '09:00', shiftEnd: '17:00' }],
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
            shifts: Yup.array()
                .min(1, t('team.validation.shifts_required'))
                .of(
                    Yup.object().shape({
                        shiftStart: Yup.string()
                            .required(t('team.validation.shift_start_required'))
                            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, t('team.validation.shift_time_format')),
                        shiftEnd: Yup.string()
                            .required(t('team.validation.shift_end_required'))
                            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, t('team.validation.shift_time_format'))
                            .test('is-after-start', t('team.validation.shift_end_after_start'), function(value: any) {
                                const { shiftStart } = this.parent;
                                if (!shiftStart || !value) return true;
                                const startTime = new Date(`1970-01-01 ${shiftStart}`);
                                const endTime = new Date(`1970-01-01 ${value}`);
                                return endTime > startTime;
                            })
                    })
                ),
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
                    isWebVisible: values.isWebVisible !== undefined ? values.isWebVisible : true,
                    workingDays: values.workingDays.length > 0 ? values.workingDays : undefined,
                    shifts: values.shifts && values.shifts.length > 0 ? values.shifts : undefined,
                    // commissionPercentage: values.commissionPercentage ? parseFloat(values.commissionPercentage) : undefined,
                    // hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : undefined,
                    avatarUrl: values.userImage || undefined
                };

                // Debug logging to verify shifts data
                console.log('Submitting staff data:', {
                    ...staffData,
                    shifts: staffData.shifts
                });
                console.log('Raw form values shifts:', values.shifts);

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

    // Helper function to add all services from a category
    const addServicesFromCategory = (categoryId: string) => {
        const categoryServices = availableServices.filter((service: Service) => service.categoryId === categoryId);
        const categoryServiceIds = categoryServices.map((service: Service) => service.id);
        const currentServiceIds = validation.values.serviceIds || [];
        
        // Combine current services with new ones, removing duplicates
        const combined = [...currentServiceIds, ...categoryServiceIds];
        const newServiceIds = combined.filter((item: string, index: number) => combined.indexOf(item) === index);
        validation.setFieldValue('serviceIds', newServiceIds);
        
        toast.success(`Se agregaron ${categoryServices.length} servicios de la categoría`);
    };

    // Helper function to remove all services from a category
    const removeServicesFromCategory = (categoryId: string) => {
        const categoryServices = availableServices.filter((service: Service) => service.categoryId === categoryId);
        const categoryServiceIds = categoryServices.map((service: Service) => service.id);
        const currentServiceIds = validation.values.serviceIds || [];
        
        // Remove category services from current selection
        const newServiceIds = currentServiceIds.filter((id: string) => !categoryServiceIds.includes(id));
        validation.setFieldValue('serviceIds', newServiceIds);
        
        toast.success(`Se removieron los servicios de la categoría`);
    };

    // Check if a category is fully selected
    const isCategoryFullySelected = (categoryId: string) => {
        const categoryServices = availableServices.filter((service: Service) => service.categoryId === categoryId);
        const currentServiceIds = validation.values.serviceIds || [];
        return categoryServices.length > 0 && categoryServices.every((service: Service) => currentServiceIds.includes(service.id));
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
                                                                    {/* <DropdownItem className="dropdown-item" onClick={() => { setIsOpen(!isOpen); setSideBar(item); }}>
                                                                        <i className="ri-user-line me-2 align-bottom text-muted"></i>{t('team.card.view_profile')}
                                                                    </DropdownItem> */}
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
                                                                        <div className="avatar-title text-uppercase border rounded-circle bg-white text-primary">
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
                                                                    <Col xs={12} className="mb-2">
                                                                        <h6 className="mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{formatWorkingDays(item._staffData?.workingDays || [], t)}</h6>
                                                                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Working Days</p>
                                                                    </Col>
                                                                    <Col xs={12}>
                                                                        <h6 className="mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.2', whiteSpace: 'pre-line' }}>{formatShiftTimes(item._staffData?.shifts || [])}</h6>
                                                                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Schedule</p>
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
                                                                <div className="form-check">
                                                                    <Input 
                                                                        type="checkbox" 
                                                                        className="form-check-input" 
                                                                        id="isWebVisible"
                                                                        name="isWebVisible"
                                                                        onChange={validation.handleChange}
                                                                        onBlur={validation.handleBlur}
                                                                        checked={validation.values.isWebVisible || false}
                                                                    />
                                                                    <Label htmlFor="isWebVisible" className="form-check-label">
                                                                        {t('team.form.web_visible')}
                                                                    </Label>
                                                                </div>
                                                                <small className="text-muted">{t('team.form.web_visible_help')}</small>
                                                            </div>

                                                            <div className="mb-3">
                                                                <Label htmlFor="categories" className="form-label">{t('team.form.categories')} <small className="text-muted">({t('team.form.categories_subtitle')})</small></Label>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {(availableCategories || []).map((category) => {
                                                                        const isSelected = isCategoryFullySelected(category.id);
                                                                        const categoryServices = availableServices.filter(service => service.categoryId === category.id);
                                                                        return (
                                                                            <Button
                                                                                key={category.id}
                                                                                size="sm"
                                                                                color={isSelected ? "success" : "outline-secondary"}
                                                                                className="category-button"
                                                                                onClick={() => isSelected ? removeServicesFromCategory(category.id) : addServicesFromCategory(category.id)}
                                                                                disabled={categoryServices.length === 0}
                                                                                title={`${category.name} (${categoryServices.length} servicios)`}
                                                                            >
                                                                                {isSelected && <i className="ri-check-line me-1"></i>}
                                                                                {category.name}
                                                                                <span className="badge bg-light text-dark ms-2">{categoryServices.length}</span>
                                                                            </Button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <small className="text-muted">{t('team.form.categories_help')}</small>
                                                            </div>
                                                            
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

                                                            {/* Shifts Section */}
                                                            <div className="mb-3">
                                                                <Label className="form-label">{t('team.form.shifts')} *</Label>
                                                                <div className="border rounded p-3">
                                                                    {(validation.values.shifts || []).map((shift: any, index: number) => (
                                                                        <div key={index} className={`shift-row ${index > 0 ? 'mt-3 pt-3 border-top' : ''}`}>
                                                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                                                <h6 className="mb-0">{t('team.form.shift_number', { number: index + 1 })}</h6>
                                                                                {(validation.values.shifts || []).length > 1 && (
                                                                                    <Button
                                                                                        type="button"
                                                                                        color="danger"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            const newShifts = [...(validation.values.shifts || [])];
                                                                                            newShifts.splice(index, 1);
                                                                                            validation.setFieldValue('shifts', newShifts);
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-delete-bin-line"></i>
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                            <Row>
                                                                                <Col md={6}>
                                                                                    <div className="mb-3">
                                                                                        <Label htmlFor={`shiftStart-${index}`} className="form-label">{t('team.form.shift_start')}</Label>
                                                                                        <TimePicker
                                                                                            id={`shiftStart-${index}`}
                                                                                            name={`shifts[${index}].shiftStart`}
                                                                                            value={shift?.shiftStart || ''}
                                                                                            onChange={(value) => {
                                                                                                const newShifts = [...(validation.values.shifts || [])];
                                                                                                // Ensure the shift object exists with proper structure
                                                                                                const currentShift = newShifts[index] || { shiftStart: '', shiftEnd: '' };
                                                                                                newShifts[index] = {
                                                                                                    ...currentShift,
                                                                                                    shiftStart: value
                                                                                                };
                                                                                                validation.setFieldValue('shifts', newShifts);
                                                                                            }}
                                                                                            className="form-control"
                                                                                            isInvalid={!!(validation.touched.shifts?.[index]?.shiftStart && validation.errors.shifts?.[index]?.shiftStart)}
                                                                                        />
                                                                                        {validation.touched.shifts?.[index]?.shiftStart && validation.errors.shifts?.[index]?.shiftStart ? (
                                                                                            <div className="invalid-feedback d-block">{validation.errors.shifts[index].shiftStart}</div>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </Col>
                                                                                <Col md={6}>
                                                                                    <div className="mb-3">
                                                                                        <Label htmlFor={`shiftEnd-${index}`} className="form-label">{t('team.form.shift_end')}</Label>
                                                                                        <TimePicker
                                                                                            id={`shiftEnd-${index}`}
                                                                                            name={`shifts[${index}].shiftEnd`}
                                                                                            value={shift?.shiftEnd || ''}
                                                                                            onChange={(value) => {
                                                                                                const newShifts = [...(validation.values.shifts || [])];
                                                                                                // Ensure the shift object exists with proper structure
                                                                                                const currentShift = newShifts[index] || { shiftStart: '', shiftEnd: '' };
                                                                                                newShifts[index] = {
                                                                                                    ...currentShift,
                                                                                                    shiftEnd: value
                                                                                                };
                                                                                                validation.setFieldValue('shifts', newShifts);
                                                                                            }}
                                                                                            className="form-control"
                                                                                            isInvalid={!!(validation.touched.shifts?.[index]?.shiftEnd && validation.errors.shifts?.[index]?.shiftEnd)}
                                                                                        />
                                                                                        {validation.touched.shifts?.[index]?.shiftEnd && validation.errors.shifts?.[index]?.shiftEnd ? (
                                                                                            <div className="invalid-feedback d-block">{validation.errors.shifts[index].shiftEnd}</div>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </Col>
                                                                            </Row>
                                                                        </div>
                                                                    ))}
                                                                    
                                                                    <div className="text-center mt-3">
                                                                        <Button
                                                                            type="button"
                                                                            color="success"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const newShifts = [...(validation.values.shifts || [])];
                                                                                newShifts.push({ 
                                                                                    shiftStart: '09:00', 
                                                                                    shiftEnd: '17:00' 
                                                                                });
                                                                                validation.setFieldValue('shifts', newShifts);
                                                                            }}
                                                                        >
                                                                            <i className="ri-add-line me-1"></i>
                                                                            {t('team.form.add_shift')}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                {validation.touched.shifts && validation.errors.shifts && typeof validation.errors.shifts === 'string' ? (
                                                                    <div className="invalid-feedback d-block">{validation.errors.shifts}</div>
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
                                            <Col xs={12}>
                                                <div className="p-3 border border-dashed border-start-0">
                                                    <h6 className="mb-1 profile-project" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{formatWorkingDays(sideBar._staffData?.workingDays || [], t)}</h6>
                                                    <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>Working Days</p>
                                                    <h6 className="mb-1 profile-task" style={{ fontSize: '0.85rem', lineHeight: '1.3', whiteSpace: 'pre-line' }}>{formatShiftTimes(sideBar._staffData?.shifts || [])}</h6>
                                                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Schedule</p>
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
                                        {/* <Link to="/pages-profile" className="btn btn-primary w-100"><i className="ri-user-3-fill align-bottom ms-1"></i> {t('team.card.view_profile')}</Link> */}
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