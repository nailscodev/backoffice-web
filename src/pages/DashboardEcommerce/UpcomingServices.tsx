import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getUpcomingBookings } from '../../helpers/backend_helper';

interface UpcomingBooking {
    id: string;
    customerName: string;
    serviceName: string;
    staffName: string;
    appointmentDate: string;
    startTime: string;
    status: string;
    totalAmount: number;
}

const UpcomingServices = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUpcomingBookings();
    }, []);

    const fetchUpcomingBookings = async () => {
        setLoading(true);
        try {
            const response = await getUpcomingBookings(10);
            if (response && response.data && response.data.data) {
                // Ordenar por appointmentDate ascendente (más próximo primero)
                const sorted = response.data.data.slice().sort((a: UpcomingBooking, b: UpcomingBooking) => {
                    const dateA = new Date(a.appointmentDate).getTime();
                    const dateB = new Date(b.appointmentDate).getTime();
                    return dateA - dateB;
                });
                setBookings(sorted);
            }
        } catch (error) {
            console.error('Error fetching upcoming bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Combina appointmentDate y startTime como UTC y lo convierte a local
    const formatDateTimeLocal = (dateString: string, timeString: string) => {
        if (!dateString || !timeString) return '';
        // Construir string ISO UTC
        const isoUTC = `${dateString}T${timeString}Z`;
        const date = new Date(isoUTC); // Date interpreta y muestra en local automáticamente
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateStr} ${timeStr}`;
    };

    const getRowBackgroundColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return '#d4edda'; // Light green
            case 'pending':
                return '#fff3cd'; // Light yellow
            default:
                return 'transparent';
        }
    };

    const generateReport = () => {
        if (bookings.length === 0) {
            alert(t('dashboard.upcoming_services.no_data_to_export', 'No data to export'));
            return;
        }

        // Prepare CSV content
        const headers = [
            t('dashboard.upcoming_services.customer'),
            t('dashboard.upcoming_services.service'),
            t('dashboard.upcoming_services.date_time'),
            t('dashboard.upcoming_services.staff'),
            t('dashboard.upcoming_services.status')
        ];

        const csvRows = [
            headers.join(','),
            ...bookings.map(booking => {
                return [
                    `"${booking.customerName}"`,
                    `"${booking.serviceName}"`,
                    `"${formatDateTimeLocal(booking.appointmentDate, booking.startTime)}"`,
                    `"${booking.staffName}"`,
                    `"${booking.status}"`
                ].join(',');
            })
        ];

        const csvContent = csvRows.join('\n');
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `upcoming_services_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <React.Fragment>
            <Col xl={8}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.upcoming_services.title')}</h4>
                        <div className="flex-shrink-0">
                            <button 
                                type="button" 
                                className="btn btn-soft-info btn-sm"
                                onClick={generateReport}
                                disabled={loading || bookings.length === 0}
                            >
                                <i className="ri-file-list-3-line align-middle"></i> {t('dashboard.upcoming_services.generate_report')}
                            </button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">{t('dashboard.upcoming_services.loading')}</span>
                                </div>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted">{t('dashboard.upcoming_services.no_bookings')}</p>
                            </div>
                        ) : (
                            <div className="table-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                                    <thead className="text-muted table-light">
                                        <tr>
                                            <th scope="col">{t('dashboard.upcoming_services.customer')}</th>
                                            <th scope="col">{t('dashboard.upcoming_services.service')}</th>
                                            <th scope="col">{t('dashboard.upcoming_services.date')}</th>
                                            <th scope="col">{t('dashboard.upcoming_services.time')}</th>
                                            <th scope="col">{t('dashboard.upcoming_services.staff')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} style={{ backgroundColor: getRowBackgroundColor(booking.status) }}>
                                                <td className="text-truncate" style={{maxWidth: '180px'}}>
                                                    {booking.customerName}
                                                </td>
                                                <td className="text-truncate" style={{maxWidth: '180px'}}>
                                                    {booking.serviceName}
                                                </td>
                                                <td colSpan={2}>
                                                    <span className="fw-medium text-success">{formatDateTimeLocal(booking.appointmentDate, booking.startTime)}</span>
                                                </td>
                                                <td className="text-truncate" style={{maxWidth: '150px'}}>
                                                    {booking.staffName}
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

export default UpcomingServices;
