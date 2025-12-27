import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getBestSellingServices } from '../../helpers/backend_helper';

interface BestSellingServicesProps {
    dateRange: Date[];
}

interface ServiceData {
    serviceId: string;
    serviceName: string;
    bookingsCount: number;
    totalRevenue: number;
    averagePrice: number;
}

const BestSellingServices: React.FC<BestSellingServicesProps> = ({ dateRange }) => {
    const { t } = useTranslation();
    const [services, setServices] = useState<ServiceData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBestSellingServices = useCallback(async () => {
        if (!dateRange || dateRange.length < 2) return;
        
        setLoading(true);
        try {
            const start = dateRange[0].toISOString().split('T')[0];
            const end = dateRange[1].toISOString().split('T')[0];
            
            const response = await getBestSellingServices(start, end, 5);
            
            if (response && response.data && response.data.data) {
                setServices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching best selling services:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchBestSellingServices();
    }, [fetchBestSellingServices]);

    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.best_selling.title')}</h4>
                        <div className="flex-shrink-0">
                            <UncontrolledDropdown className="card-header-dropdown">
                                <DropdownToggle tag="a" className="text-reset" role="button">
                                    <span className="fw-semibold text-uppercase fs-12">{t('dashboard.best_selling.sort_by')}: </span><span className="text-muted">{t('dashboard.best_selling.today')}<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem>Today</DropdownItem>
                                    <DropdownItem>Yesterday</DropdownItem>
                                    <DropdownItem>Last 7 Days</DropdownItem>
                                    <DropdownItem>Last 30 Days</DropdownItem>
                                    <DropdownItem>This Month</DropdownItem>
                                    <DropdownItem>Last Month</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <CardBody>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted">{t('dashboard.best_selling.no_data', 'No data available for the selected period')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-card">
                                    <table className="table table-hover table-centered align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{width: '40%'}}>{t('dashboard.best_selling.service', 'Service')}</th>
                                                <th style={{width: '20%'}} className="text-center">{t('dashboard.best_selling.orders')}</th>
                                                <th style={{width: '20%'}} className="text-end">{t('dashboard.best_selling.price')}</th>
                                                <th style={{width: '20%'}} className="text-end">{t('dashboard.best_selling.amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.map((item, key) => (
                                                <tr key={key}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs bg-light rounded p-1 me-2 flex-shrink-0">
                                                                <div className="bg-primary-subtle rounded-2" style={{width:32,height:32}} />
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0 text-truncate" style={{maxWidth: '200px'}}>
                                                                    <Link to="#" className="text-reset">{item.serviceName}</Link>
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info-subtle text-info fs-12">{item.bookingsCount}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="fw-medium text-muted">${item.averagePrice.toFixed(2)}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="fw-semibold text-success">${item.totalRevenue.toFixed(2)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="align-items-center mt-3 pt-2 justify-content-between row text-center text-sm-start">
                                    <div className="col-sm">
                                        <div className="text-muted fs-13">
                                            {t('dashboard.best_selling.showing', 'Showing')} <span className="fw-semibold">{services.length}</span> {t('dashboard.best_selling.of', 'of')} <span className="fw-semibold">{services.length}</span> {t('dashboard.best_selling.results', 'Results')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default BestSellingServices;
