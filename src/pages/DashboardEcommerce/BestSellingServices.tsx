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
    const { t, i18n } = useTranslation();
    const [services, setServices] = useState<ServiceData[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<'bookingsCount' | 'totalRevenue' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Get current language for API calls
    const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';
    const fetchBestSellingServices = useCallback(async () => {
        if (!dateRange || dateRange.length < 2) return;
        
        setLoading(true);
        try {
            const start = dateRange[0].toISOString().split('T')[0];
            const end = dateRange[1].toISOString().split('T')[0];
            
            const response = await getBestSellingServices(start, end, currentLang, 6);
            
            if (response && response.data && response.data.data) {
                setServices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching best selling services:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange, currentLang]);

    useEffect(() => {
        fetchBestSellingServices();
    }, [fetchBestSellingServices]);

    const handleSort = (field: 'bookingsCount' | 'totalRevenue') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedServices = React.useMemo(() => {
        if (!sortField) return services;
        
        return [...services].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            
            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }, [services, sortField, sortDirection]);

    const getSortIcon = (field: 'bookingsCount' | 'totalRevenue') => {
        if (sortField !== field) {
            return <i className="ri-expand-up-down-line ms-1"></i>;
        }
        return sortDirection === 'asc' ? 
            <i className="ri-arrow-up-s-line ms-1"></i> : 
            <i className="ri-arrow-down-s-line ms-1"></i>;
    };

    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.best_selling.title')}</h4>
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
                                                <th style={{width: '20%', cursor: 'pointer'}} className="text-center" onClick={() => handleSort('bookingsCount')}>
                                                    {t('dashboard.best_selling.orders')}
                                                    {getSortIcon('bookingsCount')}
                                                </th>
                                                <th style={{width: '20%'}} className="text-center">{t('dashboard.best_selling.price')}</th>
                                                <th style={{width: '20%', cursor: 'pointer'}} className="text-center" onClick={() => handleSort('totalRevenue')}>
                                                    {t('dashboard.best_selling.amount')}
                                                    {getSortIcon('totalRevenue')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedServices.map((item, key) => (
                                                <tr key={key}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
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
                                                    <td className="text-center">
                                                        <span className="fw-medium text-muted">${item.averagePrice.toFixed(2)}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="fw-semibold text-success">${item.totalRevenue.toFixed(2)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
