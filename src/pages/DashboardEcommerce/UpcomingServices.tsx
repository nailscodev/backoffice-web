import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { recentOrders } from '../../common/data';

const UpcomingServices = () => {
    return (
        <React.Fragment>
            <Col xl={8}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Upcoming Services</h4>
                        <div className="flex-shrink-0">
                            <button type="button" className="btn btn-soft-info btn-sm">
                                <i className="ri-file-list-3-line align-middle"></i> Generate Report
                            </button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                                <thead className="text-muted table-light">
                                    <tr>
                                        <th scope="col">Service ID</th>
                                        <th scope="col">Customer</th>
                                        <th scope="col">Service</th>
                                        <th scope="col">Time</th>
                                        <th scope="col">Technician</th>
                                        <th scope="col">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(
                                        (recentOrders || []).map((item, key) => ({
                                            serviceId: item.orderId,
                                            img: item.img,
                                            customer: item.name,
                                            service: item.product,
                                            time: '10:00 AM',
                                            technician: item.vendor,
                                            status: item.status,
                                            statusClass: item.statusClass,
                                        }))
                                    ).map((item: any, key: any) => (
                                        <tr key={key}>
                                            <td>
                                                <Link to="/apps-ecommerce-order-details" className="fw-medium link-primary">{item.serviceId}</Link>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-xs rounded-circle" />
                                                    </div>
                                                    <div className="flex-grow-1">{item.customer}</div>
                                                </div>
                                            </td>
                                            <td>{item.service}</td>
                                            <td>
                                                <span className="text-success">{item.time}</span>
                                            </td>
                                            <td>{item.technician}</td>
                                            <td>
                                                <span className={"badge bg-" + item.statusClass+"-subtle text-"+item.statusClass}>{item.status}</span>
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

export default UpcomingServices;
