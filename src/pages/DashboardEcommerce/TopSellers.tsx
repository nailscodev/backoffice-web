import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getTopStaff } from '../../helpers/backend_helper';

interface TopSellersProps {
    dateRange: Date[];
}

interface StaffData {
    staffId: string;
    staffName: string;
    bookingsCount: number;
    totalRevenue: number;
    role: string;
}

const TopSellers: React.FC<TopSellersProps> = ({ dateRange }) => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState<StaffData[]>([]);
    const [loading, setLoading] = useState(false);

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
                                            <th>{t('dashboard.top_sellers.role', 'Role')}</th>
                                            <th>{t('dashboard.top_sellers.bookings', 'Bookings')}</th>
                                            <th>{t('dashboard.top_sellers.revenue', 'Revenue')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map((s) => (
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
                                                <td>{s.role}</td>
                                                <td>
                                                    <h5 className="fs-14 mb-0">{s.bookingsCount}</h5>
                                                </td>
                                                <td>
                                                    <h5 className="fs-14 mb-0 text-success">${s.totalRevenue.toFixed(2)}</h5>
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