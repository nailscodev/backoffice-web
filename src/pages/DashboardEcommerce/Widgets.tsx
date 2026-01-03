import React from 'react';
import { useTranslation } from 'react-i18next';
import CountUp from "react-countup";
import { Link } from 'react-router-dom';
import { Card, CardBody, Col } from 'reactstrap';

interface WidgetsProps {
    stats: {
        cash: number;
        bank: number;
        bookings: number;
        distinctServices: number;
        newCustomers: number;
    };
    loading: boolean;
}

const Widgets: React.FC<WidgetsProps> = ({ stats, loading }) => {
    const { t } = useTranslation();

    // Provide default values to prevent undefined errors
    const safeStats = {
        cash: stats?.cash || 0,
        bank: stats?.bank || 0,
        bookings: stats?.bookings || 0,
        distinctServices: stats?.distinctServices || 0,
        newCustomers: stats?.newCustomers || 0,
    };

    const widgets = [
        {
            id: 1,
            label: t('dashboard.widgets.bank'),
            badge: "ri-arrow-right-up-line",
            badgeClass: "success",
            percentage: "+0.00",
            counter: safeStats.bank,
            bgcolor: "success",
            icon: "bx bx-dollar-circle",
            decimals: 2,
            prefix: "$",
            suffix: "",
            separator: ","
        },
        {
            id: 2,
            label: t('dashboard.widgets.cash'),
            badgeClass: "muted",
            percentage: "+0.00",
            counter: safeStats.cash,
            bgcolor: "primary",
            icon: "bx bx-wallet",
            decimals: 2,
            prefix: "$",
            suffix: "",
            separator: ","
        },
        {
            id: 3,
            label: t('dashboard.widgets.bookings'),
            badge: "ri-arrow-right-down-line",
            badgeClass: "info",
            percentage: "0",
            counter: safeStats.bookings,
            bgcolor: "info",
            icon: "bx bx-shopping-bag",
            decimals: 0,
            prefix: "",
            separator: ",",
            suffix: ""
        },
        {
            id: 4,
            label: t('dashboard.widgets.new_customers'),
            badge: "ri-arrow-right-up-line",
            badgeClass: "success",
            percentage: "+0.00",
            counter: safeStats.newCustomers,
            bgcolor: "warning",
            icon: "bx bx-user-circle",
            decimals: 0,
            prefix: "",
            suffix: ""
        },
    ];

    return (
        <React.Fragment>
            {widgets.map((item, key) => (
                <Col xl={3} md={6} key={key}>
                    <Card className="card-animate">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1 overflow-hidden">
                                    <p className="text-uppercase fw-medium text-muted text-truncate mb-0">{item.label}</p>
                                </div>
                                {/* <div className="flex-shrink-0">
                                    <h5 className={"fs-14 mb-0 text-" + item.badgeClass}>
                                        {item.badge ? <i className={"fs-13 align-middle " + item.badge}></i> : null} {item.percentage} %
                                    </h5>
                                </div> */}
                            </div>
                            <div className="d-flex align-items-end justify-content-between mt-4">
                                <div>
                                    {loading ? (
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-8"></span>
                                        </div>
                                    ) : (
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value" data-target={item.counter}>
                                                <CountUp
                                                    key={`countup-${item.id}-${item.counter}`}
                                                    start={0}
                                                    prefix={item.prefix}
                                                    suffix={item.suffix}
                                                    separator={item.separator}
                                                    end={item.counter}
                                                    decimals={item.decimals}
                                                    duration={2}
                                                />
                                            </span>
                                        </h4>
                                    )}
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className={"avatar-title rounded fs-3 bg-" + item.bgcolor+"-subtle"}>
                                        <i className={`text-${item.bgcolor} ${item.icon}`}></i>
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>))}
        </React.Fragment>
    );
};

export default Widgets;