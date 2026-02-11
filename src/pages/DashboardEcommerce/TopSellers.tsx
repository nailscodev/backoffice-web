import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getTopStaff } from '../../helpers/backend_helper';

interface TopSellersProps {
    dateRange: Date[];
    stats: {
        cash: number;
        bank: number;
        bookings: number;
        distinctServices: number;
        newCustomers: number;
    };
}

interface StaffData {
    staffId: string;
    staffName: string;
    bookingsCount: number;
    totalRevenue: number;
    role: string;
}

const TopSellers: React.FC<TopSellersProps> = ({ dateRange, stats }) => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState<StaffData[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<'bookingsCount' | 'totalRevenue' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const totalRevenue = (stats?.cash || 0) + (stats?.bank || 0);
    const totalBookings = stats?.bookings || 0;

    const fetchTopStaff = useCallback(async () => {
        if (!dateRange || dateRange.length < 2) return;
        
        setLoading(true);
        try {
            const start = dateRange[0].toISOString().split('T')[0];
            const end = dateRange[1].toISOString().split('T')[0];
            
            const response = await getTopStaff(start, end, 8);
            
            if (response && response.data && response.data.data) {
                setStaff(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching top staff:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchTopStaff();
    }, [fetchTopStaff]);

    const handleSort = (field: 'bookingsCount' | 'totalRevenue') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedStaff = React.useMemo(() => {
        if (!sortField) return staff;
        
        return [...staff].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            
            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }, [staff, sortField, sortDirection]);

    const getSortIcon = (field: 'bookingsCount' | 'totalRevenue') => {
        if (sortField !== field) {
            return <i className="ri-expand-up-down-line ms-1"></i>;
        }
        return sortDirection === 'asc' ? 
            <i className="ri-arrow-up-s-line ms-1"></i> : 
            <i className="ri-arrow-down-s-line ms-1"></i>;
    };

    const getPercentage = (value: number, total: number) => {
        if (total === 0) return '0.0';
        return ((value / total) * 100).toFixed(1);
    };

    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.top_sellers.title', 'Top Sellers')}</h4>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted">{t('dashboard.top_sellers.no_data', 'No data available for the selected period')}</p>
                            </div>
                        ) : (
                            <div className="table-responsive table-card">
                                <table className="table table-centered table-hover align-middle table-nowrap mb-0">
                                    <thead className="table-light text-muted">
                                        <tr>
                                            <th>{t('dashboard.top_sellers.name', 'Name')}</th>
                                            <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('bookingsCount')}>
                                                {t('dashboard.top_sellers.bookings', 'Bookings')}
                                                {getSortIcon('bookingsCount')}
                                            </th>
                                            <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('totalRevenue')}>
                                                {t('dashboard.top_sellers.revenue', 'Revenue')}
                                                {getSortIcon('totalRevenue')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedStaff.map((s) => (
                                            <tr key={s.staffId}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-2">
                                                            <div className="avatar-xs">
                                                                <div className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                    {s.staffName.charAt(0)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>{s.staffName}</div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div>
                                                        <span className="badge bg-info-subtle text-info fs-12">{s.bookingsCount}</span>
                                                        <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>({getPercentage(s.bookingsCount, totalBookings)}%)</div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div>
                                                        <h5 className="fs-14 mb-0 text-success">${s.totalRevenue.toFixed(2)}</h5>
                                                        <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>({getPercentage(s.totalRevenue, totalRevenue)}%)</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default TopSellers;