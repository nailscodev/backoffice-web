import React, { useState, useEffect } from 'react';
import {
    Col,
    Row,
    Button,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownItem,
    DropdownMenu,
} from "reactstrap";
import { Link } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import Select from "react-select";
import { useTranslation } from 'react-i18next';
import { getAllServices } from '../../helpers/backend_helper';

const ProductsGlobalFilter = () => {
    return (
        <React.Fragment>
            <div className="col-sm-auto ms-auto">
                <div>
                    <Link
                        to="/apps-ecommerce-add-product"
                        className="btn btn-success"
                    >
                        <i className="ri-add-line align-bottom me-1"></i> Add
                        Product
                    </Link>
                </div>
            </div>
        </React.Fragment>
    );
};
const CustomersGlobalFilter = () => {
    return (
        <React.Fragment>
            <Col xl={7}>
                <Row className="g-3">
                    <Col sm={5}>
                        <div className="">
                            <Flatpickr
                                className="form-control"
                                id="datepicker-publish-input"
                                placeholder="Select a date"
                                options={{
                                    altInput: true,
                                    altFormat: "F j, Y",
                                    mode: "multiple",
                                    dateFormat: "d.m.y",
                                }}
                            />
                        </div>
                    </Col>

                    <Col sm={7}>
                        <div>
                            <button
                                type="button"
                                className="btn btn-primary w-100"
                            >
                                {" "}
                                <i className="ri-search-line me-2 align-bottom"></i>
                                Search
                            </button>
                        </div>
                    </Col>
                </Row>
            </Col>
        </React.Fragment>
    );
};

const OrderGlobalFilter = () => {
    const { t } = useTranslation();
    const [orderStatus, setorderStatus] = useState<any>([]);
    const [orderPayement, setorderPayement] = useState<any>(null);

    function handleorderStatus(orderstatus: any) {
        setorderStatus(orderstatus);
    }

    function handleorderPayement(orderPayement: any) {
        setorderPayement(orderPayement);
    }

    const orderstatus: any = [
        {
            options: [
                { label: t('reservations.status.all'), value: "All" },
                { label: t('reservations.status.pending'), value: "Pending" },
                { label: t('reservations.status.in_progress'), value: "InProgress" },
                { label: t('reservations.status.completed'), value: "Completed" },
                { label: t('reservations.status.cancelled'), value: "Cancelled" },
            ],
        },
    ];

    const orderpayement = [
        {
            options: [
                { label: t('reservations.payment.all'), value: "All" },
                { label: t('reservations.payment.cash'), value: "Cash" },
                { label: t('reservations.payment.bank'), value: "Bank" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <Col lg={3} md={6} sm={6}>
                <div>
                    <Flatpickr
                        className="form-control"
                        id="datepicker-publish-input"
                        placeholder={t('reservations.filters.select_date')}
                        options={{
                            altInput: true,
                            altFormat: "F j, Y",
                            mode: "multiple",
                            dateFormat: "d.m.y",
                        }}
                    />
                </div>
            </Col>

            <Col lg={3} md={6} sm={6}>
                <div>
                    <Select
                        value={orderStatus}
                        onChange={handleorderStatus}
                        options={orderstatus}
                        name="choices-single-default"
                        id="idStatus"
                        placeholder={t('reservations.filters.status')}
                    ></Select>
                </div>
            </Col>

            <Col lg={3} md={6} sm={6}>
                <div>
                    <Select
                        value={orderPayement}
                        onChange={handleorderPayement}
                        options={orderpayement}
                        name="choices-payment-default"
                        id="idPayment"
                        placeholder={t('reservations.filters.payment_method')}
                    ></Select>
                </div>
            </Col>

            <Col lg={3} md={6} sm={6}>
                <div>
                    <button type="button" className="btn btn-primary w-100" title={t('reservations.filters.filters')}>
                        <i className="ri-equalizer-fill align-bottom"></i>
                    </button>
                </div>
            </Col>
        </React.Fragment>
    );
};

const ContactsGlobalFilter = () => {
    const [sortBy, setSortBy] = useState<any>(null);

    function handleSortBy(selectedOption: any) {
        setSortBy(selectedOption);
    }

    const sortOptions = [
        {
            options: [
                { label: 'Owner', value: 'Owner' },
                { label: 'Company', value: 'Company' },
                { label: 'Location', value: 'Location' }
            ]
        }
    ];

    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Sort by: </span>
                    <Select
                        className="mb-0"
                        value={sortBy}
                        onChange={handleSortBy}
                        options={sortOptions}
                        id="choices-single-default"
                    />
                </div>
            </div>
        </React.Fragment>
    );
};

const CompaniesGlobalFilter = () => {
    const [sortBy, setsortBy] = useState("Owner");

    function handlesortBy(sortBy: any) {
        setsortBy(sortBy);
    }

    const sortbyname: any = [
        {
            options: [
                { label: "Owner", value: "Owner" },
                { label: "Company", value: "Company" },
                { label: "Location", value: "Location" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Sort by: </span>
                    <Select
                        className="mb-0"
                        value={sortBy}
                        onChange={handlesortBy}
                        options={sortbyname}
                        id="choices-single-default"
                    ></Select>
                </div>
            </div>
        </React.Fragment>
    );
};

const CryptoOrdersGlobalFilter = () => {
    return (
        <React.Fragment>
            <Col xl={2} md={6}>
                <div className="input-group">
                    <span className="input-group-text" id="basic-addon1"><i className="ri-calendar-2-line"></i></span>
                    <Flatpickr
                        placeholder="Select date"
                        className="form-control"
                        options={{
                            mode: "range",
                            dateFormat: "d M, Y"
                        }}
                    />
                </div>
            </Col>
            <Col xl={2} md={4}>
                <select className="form-control" data-choices data-choices-search-false name="choices-single-default"
                    id="choices-single-default">
                    <option defaultValue="all">Select Type</option>
                    <option value="Buy">Sell</option>
                    <option value="Sell">Buy</option>
                </select>
            </Col>
            <Col xl={2} md={4}>
                <select className="form-control" data-choices data-choices-search-false name="choices-single-default2"
                    id="choices-single-default2">
                    <option defaultValue="all">Select Status</option>
                    <option value="Successful">Successful</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Pending">Pending</option>
                </select>
            </Col>
            <Col xl={1} md={4}>
                <button className="btn btn-success w-100">Filters</button>
            </Col>
        </React.Fragment>
    );
};

const InvoiceListGlobalSearch = ({ dateRange, setDateRange, service, setService, onReload }: any) => {
    // If parent passes handlers, use them; otherwise keep local state
    const [localService, setLocalService] = useState<any>(service || null);
    const [serviceOptions, setServiceOptions] = useState<any>([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // Load services from backend on mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const response = await getAllServices();
                console.log('Services response:', response); // Debug
                if (response?.data) {
                    const servicesData = response.data.data || response.data;
                    const services = servicesData.map((service: any) => ({
                        label: service.name,
                        value: service.id,
                    }));
                    setServiceOptions([
                        {
                            options: [
                                { label: "All Services", value: "All" },
                                ...services,
                            ],
                        },
                    ]);
                }
            } catch (error) {
                console.error('Error loading services:', error);
                // Fallback to empty options with "All Services" only
                setServiceOptions([
                    {
                        options: [{ label: "All Services", value: "All" }],
                    },
                ]);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchServices();
    }, []);

    React.useEffect(() => {
        if (service !== undefined) setLocalService(service);
    }, [service]);

    function handleServiceChange(selected: any) {
        setLocalService(selected);
        if (setService) setService(selected);
    }

    function clearFilters() {
        setLocalService(null);
        if (setService) setService(null);
    }

    return (
        <React.Fragment>
            <Col sm={4} xxl={3}>
                <div className="input-light">
                    <Select
                        value={localService}
                        onChange={handleServiceChange}
                        options={serviceOptions}
                        name="choices-single-default"
                        id="idService"
                        placeholder="Filter by service"
                    ></Select>
                </div>
            </Col>

            <Col sm={4} xxl={2} className="d-flex gap-2">
                <Button 
                    color="success" 
                    className="btn-icon" 
                    onClick={onReload} 
                    aria-label="Reload data" 
                    title="Reload data"
                    disabled={!onReload}
                >
                    <i className="ri-refresh-line"></i>
                </Button>
                <Button 
                    color="secondary" 
                    className="btn-icon" 
                    onClick={clearFilters} 
                    aria-label="Clear filters" 
                    title="Clear filters"
                >
                    <i className="ri-filter-off-line"></i>
                </Button>
            </Col>

        </React.Fragment>
    );
};

const TicketsListGlobalFilter = () => {
    return (
        <React.Fragment>
            <Col xxl={3} sm={4}>
                <Flatpickr
                    className="form-control"
                    placeholder="Select date range"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y"
                    }}
                />
            </Col>
            <Col xxl={3} sm={4}>
                <div className="input-light">
                    <select className="form-control" data-choices data-choices-search-false name="choices-single-default" id="idStatus">
                        <option value="">Status</option>
                        <option defaultValue="all">All</option>
                        <option value="Open">Open</option>
                        <option value="Inprogress">Inprogress</option>
                        <option value="Closed">Closed</option>
                        <option value="New">New</option>
                    </select>
                </div>
            </Col>
            <Col xxl={1} sm={4}>
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    Filters
                </button>
            </Col>
        </React.Fragment>
    );
};

const NFTRankingGlobalFilter = () => {
    return (
        <React.Fragment>
            <Col xxl={2} sm={4} className="ms-auto">
                <div>
                    <select className="form-control" data-choices data-choices-search-false name="choices-single-default" id="idStatus">
                        <option value="All Time" defaultValue="">All Time</option>
                        <option value="1 Day">1 Day</option>
                        <option value="7 Days">7 Days</option>
                        <option value="15 Days">15 Days</option>
                        <option value="1 Month">1 Month</option>
                        <option value="6 Month">6 Month</option>
                    </select>
                </div>
            </Col>
        </React.Fragment>
    );
};

const TaskListGlobalFilter = () => {
    return (
        <React.Fragment>
            <div className="col-xxl-3 col-sm-4">
                <Flatpickr
                    placeholder="Select date range"
                    className="form-control bg-light border-light"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y"
                    }}
                />
            </div>

            <div className="col-xxl-3 col-sm-4">
                <div className="input-light">
                    <select className="form-control" data-choices data-choices-search-false name="status" id="idStatus">
                        <option value="">Status</option>
                        <option defaultValue="all"  >All</option>
                        <option value="New">New</option>
                        <option value="Pending">Pending</option>
                        <option value="Inprogress">Inprogress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>
            <div className="col-xxl-1 col-sm-4">
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    Filters
                </button>
            </div>
        </React.Fragment>
    );
};


const LeadsGlobalFilter = ({ onClickDelete }: any) => {
    return (
        <React.Fragment>
            <div className="col-sm-auto ms-auto">
                <div className="hstack gap-2">
                    <button className="btn btn-soft-danger" onClick={onClickDelete}
                    ><i className="ri-delete-bin-2-line"></i></button>
                    <button type="button" className="btn btn-info"
                    //  onClick={toggleInfo}
                    >
                        <i className="ri-filter-3-line align-bottom me-1"></i>{" "}
                        Fliters
                    </button>
                    <button
                        type="button"
                        className="btn btn-success add-btn"
                        id="create-btn"
                    // onClick={() => { setIsEdit(false); toggle(); }}
                    >
                        <i className="ri-add-line align-bottom me-1"></i> Add
                        Leads
                    </button>
                    <UncontrolledDropdown>
                        <DropdownToggle
                            className="btn btn-soft-info btn-icon fs-14"
                            type="button"
                            id="dropdownMenuButton1"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="ri-settings-4-line"></i>
                        </DropdownToggle>
                        <DropdownMenu
                        >
                            <li>
                                <DropdownItem>
                                    Copy
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Move to pipline
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Add to exceptions
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Switch to common form view
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Reset form view to default
                                </DropdownItem>
                            </li>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            </div>
        </React.Fragment>
    );
};

export {
    ProductsGlobalFilter,
    CustomersGlobalFilter,
    OrderGlobalFilter,
    ContactsGlobalFilter,
    CompaniesGlobalFilter,
    CryptoOrdersGlobalFilter,
    InvoiceListGlobalSearch,
    TicketsListGlobalFilter,
    NFTRankingGlobalFilter,
    TaskListGlobalFilter,
    LeadsGlobalFilter
};