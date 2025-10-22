import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { useTranslation } from 'react-i18next';

const bestSellingServices = [
    {
        id: 1,
        img: '',
        label: "Classic Manicure",
        date: "21 Oct 2025",
        price: 25.0,
        orders: 48,
        stock: null,
        amount: 1200,
    },
    {
        id: 2,
        img: '',
        label: "Gel Manicure",
        date: "20 Oct 2025",
        price: 40.0,
        orders: 36,
        amount: 1440,
    },
    {
        id: 3,
        img: '',
        label: "Manicure + Polish",
        date: "19 Oct 2025",
        price: 30.0,
        orders: 29,
        stock: null,
        amount: 870,
    },
    {
        id: 4,
        img: '',
        label: "Luxury Spa Manicure",
        date: "18 Oct 2025",
        price: 55.0,
        orders: 22,
        amount: 1210,
    },
    {
        id: 5,
        img: '',
        label: "Express Manicure",
        date: "17 Oct 2025",
        price: 18.0,
        orders: 62,
        stock: null,
        amount: 1116,
    },
];

const BestSellingServices = () => {
    const { t } = useTranslation();
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
                        <div className="table-responsive table-card">
                            <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                <tbody>
                                    {(bestSellingServices || []).map((item: any, key: any) => (
                                        <tr key={key}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-sm bg-light rounded p-1 me-2">
                                                        {item.img ? <img src={item.img} alt="" className="img-fluid d-block" /> : <div className="placeholder bg-secondary rounded-2" style={{width:40,height:40}} />}
                                                    </div>
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="#" className="text-reset">{item.label}</Link></h5>
                                                        <span className="text-muted">{item.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">${(item.price).toFixed(2)}</h5>
                                                <span className="text-muted">{t('dashboard.best_selling.price')}</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">{item.orders}</h5>
                                                <span className="text-muted">{t('dashboard.best_selling.orders')}</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">{item.stock ? item.stock : <span className="badge bg-danger-subtle  text-danger">{t('dashboard.best_selling.na')}</span>} </h5>
                                                <span className="text-muted">{t('dashboard.best_selling.availability')}</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">${item.amount}</h5>
                                                <span className="text-muted">{t('dashboard.best_selling.amount')}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="align-items-center mt-4 pt-2 justify-content-between row text-center text-sm-start">
                            <div className="col-sm">
                                <div className="text-muted">Showing <span className="fw-semibold">5</span> of <span className="fw-semibold">5</span> Results
                                </div>
                            </div>
                            <div className="col-sm-auto mt-3 mt-sm-0">
                                <ul className="pagination pagination-separated pagination-sm mb-0 justify-content-center">
                                    <li className="page-item disabled">
                                        <Link to="#" className="page-link">←</Link>
                                    </li>
                                    <li className="page-item active">
                                        <Link to="#" className="page-link">1</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">→</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default BestSellingServices;
