import React from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useTranslation } from 'react-i18next';

const staffToday = [
    { id: 1, name: 'Ana Gomez', role: 'Technician', reservedToday: 8 },
    { id: 2, name: 'Lucia Fernandez', role: 'Technician', reservedToday: 6 },
    { id: 3, name: 'Martina Ruiz', role: 'Technician', reservedToday: 5 },
    { id: 4, name: 'Sofia Alvarez', role: 'Technician', reservedToday: 4 },
    { id: 5, name: 'Camila Ortega', role: 'Technician', reservedToday: 3 },
    { id: 6, name: 'Lupe Gomez', role: 'Technician', reservedToday: 3 },
    { id: 7, name: 'Agustina Ruiz', role: 'Technician', reservedToday: 3 },
    { id: 8, name: 'Andrea Sol', role: 'Technician', reservedToday: 3 },
];

const TopSellers = () => {
    const { t } = useTranslation();
    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.top_sellers.title', 'Top Sellers')}</h4>
                    </CardHeader>
                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-centered table-hover align-middle table-nowrap mb-0">
                                <thead className="table-light text-muted">
                                    <tr>
                                        <th>{t('dashboard.top_sellers.name', 'Name')}</th>
                                        <th>{t('dashboard.top_sellers.role', 'Role')}</th>
                                        <th>{t('dashboard.top_sellers.reserved_today', 'Reserved Today')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffToday.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td>{s.role}</td>
                                            <td>
                                                <h5 className="fs-14 mb-0">{s.reservedToday}</h5>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default TopSellers;