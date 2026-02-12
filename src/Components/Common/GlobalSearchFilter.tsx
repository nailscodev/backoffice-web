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
import { getServices } from '../../api/services';

const ProductsGlobalFilter = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <div className="col-sm-auto ms-auto">
                <div>
                    <Link
                        to="/apps-ecommerce-add-product"
                        className="btn btn-success"
                    >
                        <i className="ri-add-line align-bottom me-1"></i> {t('global_filters.products.add_product')}
                    </Link>
                </div>
            </div>
        </React.Fragment>
    );
};
const CustomersGlobalFilter = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <Col xl={7}>
                <Row className="g-3">
                    <Col sm={5}>
                        <div className="">
                            <Flatpickr
                                className="form-control"
                                id="datepicker-publish-input"
                                placeholder={t('global_filters.common.select_date')}
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
                                {t('global_filters.common.search')}
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
    const { t } = useTranslation();
    const [sortBy, setSortBy] = useState<any>(null);

    function handleSortBy(selectedOption: any) {
        setSortBy(selectedOption);
    }

    const sortOptions = [
        {
            options: [
                { label: t('global_filters.contacts.owner'), value: 'Owner' },
                { label: t('global_filters.contacts.company'), value: 'Company' },
                { label: t('global_filters.contacts.location'), value: 'Location' }
            ]
        }
    ];

    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">{t('global_filters.common.sort_by')}</span>
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
    const { t } = useTranslation();
    const [sortBy, setsortBy] = useState("Owner");

    function handlesortBy(sortBy: any) {
        setsortBy(sortBy);
    }

    const sortbyname: any = [
        {
            options: [
                { label: t('global_filters.companies.owner'), value: "Owner" },
                { label: t('global_filters.companies.company'), value: "Company" },
                { label: t('global_filters.companies.location'), value: "Location" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">{t('global_filters.common.sort_by')}</span>
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
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <Col xl={2} md={6}>
                <div className="input-group">
                    <span className="input-group-text" id="basic-addon1"><i className="ri-calendar-2-line"></i></span>
                    <Flatpickr
                        placeholder={t('global_filters.common.select_date')}
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
                    <option defaultValue="all">{t('global_filters.crypto.select_type')}</option>
                    <option value="Buy">{t('global_filters.crypto.sell')}</option>
                    <option value="Sell">{t('global_filters.crypto.buy')}</option>
                </select>
            </Col>
            <Col xl={2} md={4}>
                <select className="form-control" data-choices data-choices-search-false name="choices-single-default2"
                    id="choices-single-default2">
                    <option defaultValue="all">{t('global_filters.crypto.select_status')}</option>
                    <option value="Successful">{t('global_filters.crypto.successful')}</option>
                    <option value="Cancelled">{t('global_filters.crypto.cancelled')}</option>
                    <option value="Pending">{t('global_filters.crypto.pending')}</option>
                </select>
            </Col>
            <Col xl={1} md={4}>
                <button className="btn btn-success w-100">{t('global_filters.common.filters')}</button>
            </Col>
        </React.Fragment>
    );
};

const InvoiceListGlobalSearch = ({ 
    dateRange, 
    setDateRange, 
    service, 
    setService, 
    paymentMethod, 
    setPaymentMethod, 
    direction, 
    setDirection, 
    onReload 
}: any) => {
    const { t, i18n } = useTranslation();
    // If parent passes handlers, use them; otherwise keep local state
    const [localService, setLocalService] = useState<any>(service || null);
    const [localPaymentMethod, setLocalPaymentMethod] = useState<any>(paymentMethod || null);
    const [localDirection, setLocalDirection] = useState<any>(direction || null);
    const [serviceOptions, setServiceOptions] = useState<any>([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // Get current language for API calls
    const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';
    
    // Payment method options
    const paymentMethodOptions = [
        {
            options: [
                { label: t('global_filters.invoices.all_payments', 'Todos los métodos de pago'), value: 'All' },
                { label: t('invoices.cash', 'Efectivo'), value: 'CASH' },
                { label: t('invoices.card', 'Tarjeta'), value: 'CARD' }
            ]
        }
    ];

    // Direction options (Income/Expense)
    const directionOptions = [
        {
            options: [
                { label: t('global_filters.invoices.all_transactions', 'Todas las transacciones'), value: 'All' },
                { label: t('global_filters.invoices.income', 'Ingresos'), value: 'Income' },
                { label: t('global_filters.invoices.expense', 'Gastos'), value: 'Expense' }
            ]
        }
    ];

    // Load services from backend on mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const response = await getServices(1, 1000, undefined, undefined, undefined, currentLang);
                if (response && response.length > 0) {
                    const services = response.map((service: any) => ({
                        label: service.name,
                        value: service.id,
                    }));
                    setServiceOptions([
                        {
                            options: [
                                { label: t('global_filters.invoices.all_descriptions', 'All Descriptions'), value: "All" },
                                { label: t('global_filters.invoices.manual_adjustment', 'Ajuste Manual'), value: "MANUAL_ADJUSTMENT" },
                                ...services,
                            ],
                        },
                    ]);
                } else {
                    setServiceOptions([
                        {
                            options: [{ label: t('global_filters.invoices.all_descriptions', 'All Descriptions'), value: "All" }],
                        },
                    ]);
                }
            } catch (error) {
                console.error('Error loading services:', error);
                // Fallback to empty options with "All Descriptions" only
                setServiceOptions([
                    {
                        options: [
                            { label: t('global_filters.invoices.all_descriptions', 'All Descriptions'), value: "All" },
                            { label: t('global_filters.invoices.manual_adjustment', 'Ajuste Manual'), value: "MANUAL_ADJUSTMENT" },
                        ],
                    },
                ]);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchServices();
    }, [t, i18n.language, currentLang]);

    // Sync with parent state
    React.useEffect(() => {
        if (service !== undefined) setLocalService(service);
    }, [service]);

    React.useEffect(() => {
        if (paymentMethod !== undefined) setLocalPaymentMethod(paymentMethod);
    }, [paymentMethod]);

    React.useEffect(() => {
        if (direction !== undefined) setLocalDirection(direction);
    }, [direction]);

    function handleServiceChange(selected: any) {
        setLocalService(selected);
        if (setService) setService(selected);
    }

    function handlePaymentMethodChange(selected: any) {
        setLocalPaymentMethod(selected);
        if (setPaymentMethod) setPaymentMethod(selected);
    }

    function handleDirectionChange(selected: any) {
        setLocalDirection(selected);
        if (setDirection) setDirection(selected);
    }

    function clearFilters() {
        setLocalService(null);
        setLocalPaymentMethod(null);
        setLocalDirection(null);
        if (setService) setService(null);
        if (setPaymentMethod) setPaymentMethod(null);
        if (setDirection) setDirection(null);
    }

    return (
        <React.Fragment>
            {/* First Row: Service Filter + Payment Method + Direction */}
            <Col sm={12} className="mb-3">
                <Row className="g-2">
                    <Col md={4}>
                        <div className="input-light">
                            <Select
                                key={`service-select-${i18n.language}`}
                                value={localService}
                                onChange={handleServiceChange}
                                options={serviceOptions}
                                placeholder={i18n.language === 'sp' ? 'Filtrar por descripción' : 'Filter by description'}
                                noOptionsMessage={() => i18n.language === 'sp' ? 'No hay opciones' : 'No options'}
                            />
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="input-light">
                            <Select
                                value={localPaymentMethod}
                                onChange={handlePaymentMethodChange}
                                options={paymentMethodOptions}
                                placeholder={i18n.language === 'sp' ? 'Método de pago' : 'Payment method'}
                                noOptionsMessage={() => i18n.language === 'sp' ? 'No hay opciones' : 'No options'}
                            />
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="input-light">
                            <Select
                                value={localDirection}
                                onChange={handleDirectionChange}
                                options={directionOptions}
                                placeholder={i18n.language === 'sp' ? 'Tipo de transacción' : 'Transaction type'}
                                noOptionsMessage={() => i18n.language === 'sp' ? 'No hay opciones' : 'No options'}
                            />
                        </div>
                    </Col>
                    <Col md={2} className="d-flex gap-2 align-items-center">
                        <Button 
                            color="success" 
                            className="btn-icon flex-shrink-0" 
                            onClick={onReload} 
                            aria-label={t('global_filters.invoices.reload_data', 'Reload Data')} 
                            title={t('global_filters.invoices.reload_data', 'Reload Data')}
                            disabled={!onReload}
                        >
                            <i className="ri-refresh-line"></i>
                        </Button>
                        <Button 
                            color="secondary" 
                            className="btn-icon flex-shrink-0" 
                            onClick={clearFilters} 
                            aria-label={t('global_filters.invoices.clear_filters', 'Clear Filters')} 
                            title={t('global_filters.invoices.clear_filters', 'Clear Filters')}
                        >
                            <i className="ri-filter-off-line"></i>
                        </Button>
                    </Col>
                </Row>
            </Col>

        </React.Fragment>
    );
};

const TicketsListGlobalFilter = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <Col xxl={3} sm={4}>
                <Flatpickr
                    className="form-control"
                    placeholder={t('global_filters.common.select_date_range')}
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y"
                    }}
                />
            </Col>
            <Col xxl={3} sm={4}>
                <div className="input-light">
                    <select className="form-control" data-choices data-choices-search-false name="choices-single-default" id="idStatus">
                        <option value="">{t('global_filters.common.status')}</option>
                        <option defaultValue="all">{t('global_filters.common.all')}</option>
                        <option value="Open">{t('global_filters.tickets.open')}</option>
                        <option value="Inprogress">{t('global_filters.tickets.inprogress')}</option>
                        <option value="Closed">{t('global_filters.tickets.closed')}</option>
                        <option value="New">{t('global_filters.tickets.new')}</option>
                    </select>
                </div>
            </Col>
            <Col xxl={1} sm={4}>
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    {t('global_filters.common.filters')}
                </button>
            </Col>
        </React.Fragment>
    );
};

const NFTRankingGlobalFilter = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <Col xxl={2} sm={4} className="ms-auto">
                <div>
                    <select className="form-control" data-choices data-choices-search-false name="choices-single-default" id="idStatus">
                        <option value="All Time" defaultValue="">{t('global_filters.nft.all_time')}</option>
                        <option value="1 Day">{t('global_filters.nft.one_day')}</option>
                        <option value="7 Days">{t('global_filters.nft.seven_days')}</option>
                        <option value="15 Days">{t('global_filters.nft.fifteen_days')}</option>
                        <option value="1 Month">{t('global_filters.nft.one_month')}</option>
                        <option value="6 Month">{t('global_filters.nft.six_months')}</option>
                    </select>
                </div>
            </Col>
        </React.Fragment>
    );
};

const TaskListGlobalFilter = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <div className="col-xxl-3 col-sm-4">
                <Flatpickr
                    placeholder={t('global_filters.common.select_date_range')}
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
                        <option value="">{t('global_filters.common.status')}</option>
                        <option defaultValue="all">{t('global_filters.common.all')}</option>
                        <option value="New">{t('global_filters.tickets.new')}</option>
                        <option value="Pending">{t('global_filters.crypto.pending')}</option>
                        <option value="Inprogress">{t('global_filters.tickets.inprogress')}</option>
                        <option value="Completed">{t('global_filters.tasks.completed')}</option>
                    </select>
                </div>
            </div>
            <div className="col-xxl-1 col-sm-4">
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    {t('global_filters.common.filters')}
                </button>
            </div>
        </React.Fragment>
    );
};


const LeadsGlobalFilter = ({ onClickDelete }: any) => {
    const { t } = useTranslation();
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
                        {t('global_filters.common.filters')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-success add-btn"
                        id="create-btn"
                    // onClick={() => { setIsEdit(false); toggle(); }}
                    >
                        <i className="ri-add-line align-bottom me-1"></i> {t('global_filters.leads.add_leads')}
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
                                    {t('global_filters.leads.copy')}
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    {t('global_filters.leads.move_to_pipeline')}
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    {t('global_filters.leads.add_to_exceptions')}
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    {t('global_filters.leads.switch_to_common_form')}
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    {t('global_filters.leads.reset_form_default')}
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