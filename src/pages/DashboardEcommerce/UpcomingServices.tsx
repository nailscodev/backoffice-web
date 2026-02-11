import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { getPendingBookings } from '../../helpers/backend_helper';

interface UpcomingBooking {
    id: string;
    customerName: string;
    serviceName: string;
    staffName: string;
    appointmentDate: string;
    startTime: string;
    status: string;
    totalPrice: number;
}

const UpcomingServices = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingBookings();
    }, []);

    const fetchPendingBookings = async () => {
        setLoading(true);
        try {
            const response = await getPendingBookings();
            if (response && response.data && response.data.data) {
                // Ordenar por appointmentDate descendente (más reciente primero)
                const sorted = response.data.data.slice().sort((a: UpcomingBooking, b: UpcomingBooking) => {
                    const dateA = new Date(a.appointmentDate).getTime();
                    const dateB = new Date(b.appointmentDate).getTime();
                    return dateB - dateA;
                });
                setBookings(sorted);
            }
        } catch (error) {
            console.error('Error fetching pending bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formatea la fecha (ej: 24 Jan 2026)
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Formatea la hora (ej: 10:00 AM)
    const formatTime = (dateString: string, timeString: string) => {
        if (!dateString || !timeString) return '';
        // Construir string ISO UTC
        const isoUTC = `${dateString}T${timeString}Z`;
        const date = new Date(isoUTC);
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getRowBackgroundColor = (status: string) => {
        // Sin fondos de colores para mantener consistencia con otras tablas
        return '';
    };

    const getTextClass = (status: string) => {
        // Usar colores neutros como en otras tablas del dashboard
        return 'text-body';
    };

    const getDateTimeClass = (appointmentDate: string, startTime: string) => {
        if (!appointmentDate || !startTime) return 'fw-medium text-muted';
        
        const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);
        const now = new Date();
        
        // Si la cita es en el pasado o en las próximas 2 horas, mostrar en rojo
        const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        
        if (appointmentDateTime <= twoHoursFromNow) {
            return 'fw-medium text-danger'; // Rojo para citas pasadas o urgentes
        }
        
        return 'fw-medium text-muted'; // Gris para citas futuras
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
                const date = formatDate(booking.appointmentDate);
                const time = formatTime(booking.appointmentDate, booking.startTime);
                return [
                    `"${booking.customerName}"`,
                    `"${booking.serviceName}"`,
                    `"${date} ${time}"`,
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
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.pending_services.title', 'Servicios pendientes')}</h4>
                        <div className="flex-shrink-0">
                            <button 
                                type="button" 
                                className="btn btn-soft-warning btn-sm"
                                onClick={generateReport}
                                disabled={loading || bookings.length === 0}
                            >
                                <i className="ri-file-list-3-line align-middle"></i> {t('dashboard.pending_services.generate_report', 'Generar reporte')}
                            </button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-warning" role="status">
                                    <span className="visually-hidden">{t('dashboard.pending_services.loading', 'Cargando...')}</span>
                                </div>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted">{t('dashboard.pending_services.no_bookings', 'No hay bookings pendientes')}</p>
                            </div>
                        ) : (
                            <div className="table-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="table table-borderless table-centered align-middle mb-0">
                                    <thead className="text-muted table-light">
                                        <tr>
                                            <th scope="col" style={{ width: '22%' }}>{t('dashboard.pending_services.customer', 'Cliente')}</th>
                                            <th scope="col" style={{ width: '30%' }}>{t('dashboard.pending_services.service', 'Servicio')}</th>
                                            <th scope="col" style={{ width: '16%' }}>{t('dashboard.pending_services.date', 'Fecha')}</th>
                                            <th scope="col" style={{ width: '14%' }}>{t('dashboard.pending_services.time', 'Hora')}</th>
                                            <th scope="col" style={{ width: '18%' }}>{t('dashboard.pending_services.staff', 'Staff')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className={getRowBackgroundColor(booking.status)}>
                                                <td className="text-truncate" style={{ maxWidth: '120px' }}>
                                                    <span className={getTextClass(booking.status)}>{booking.customerName}</span>
                                                </td>
                                                <td className="text-truncate" style={{ maxWidth: '140px' }}>
                                                    <span className={getTextClass(booking.status)}>{booking.serviceName}</span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span className={getDateTimeClass(booking.appointmentDate, booking.startTime)}>{formatDate(booking.appointmentDate)}</span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span className={getDateTimeClass(booking.appointmentDate, booking.startTime)}>{formatTime(booking.appointmentDate, booking.startTime)}</span>
                                                </td>
                                                <td className="text-truncate" style={{ maxWidth: '100px' }}>
                                                    <span className={getTextClass(booking.status)}>{booking.staffName}</span>
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
