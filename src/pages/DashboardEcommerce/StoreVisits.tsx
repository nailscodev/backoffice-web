import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { StoreVisitsCharts } from './DashboardEcommerceCharts';
import { getBookingsBySource } from '../../helpers/backend_helper';
import { useTranslation } from 'react-i18next';

interface StoreVisitsProps {
    dateRange: Date[];
}

const StoreVisits: React.FC<StoreVisitsProps> = ({ dateRange }) => {
    const { t } = useTranslation();
    const [bookingsData, setBookingsData] = useState({ web: 80, other: 20 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (dateRange && dateRange.length >= 2) {
            fetchBookingsBySource();
        }
    }, [dateRange]);

    const fetchBookingsBySource = async () => {
        setLoading(true);
        try {
            const start = dateRange[0].toISOString().split('T')[0];
            const end = dateRange[1].toISOString().split('T')[0];
            
            const response = await getBookingsBySource(start, end);
            
            if (response && response.data && response.data.data) {
                setBookingsData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching bookings by source:', error);
        } finally {
            setLoading(false);
        }
    };

    const total = bookingsData.web + bookingsData.other;
    const webPercentage = total > 0 ? Math.round((bookingsData.web / total) * 100) : 0;
    const otherPercentage = total > 0 ? Math.round((bookingsData.other / total) * 100) : 0;

    return (
        <React.Fragment>
            <Col xl={4}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.store_visits.title', 'Reservations by Source')}</h4>
                        <div className="flex-shrink-0">
                            <UncontrolledDropdown className="card-header-dropdown" >
                                <DropdownToggle tag="a" className="text-reset dropdown-btn" role="button">
                                    <span className="text-muted">Report<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem>Download Report</DropdownItem>
                                    <DropdownItem>Export</DropdownItem>
                                    <DropdownItem>Import</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <StoreVisitsCharts
                                dataColors='["--vz-primary", "--vz-success"]'
                                series={[webPercentage, otherPercentage]}
                                labels={[t('dashboard.store_visits.web','Web'), t('dashboard.store_visits.other','Other')]}
                            />
                        )}
                    </div>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default StoreVisits;