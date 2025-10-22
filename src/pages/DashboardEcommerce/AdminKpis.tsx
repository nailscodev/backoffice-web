import React from 'react';
import { Row, Col, Card, CardBody, Badge } from 'reactstrap';
import CountUp from 'react-countup';
import { useTranslation } from 'react-i18next';

const AdminKpis = () => {
  const { t } = useTranslation();

  // Mock data for the three requested KPIs
  const data = {
    dailyShifts: 42,
    revenue: {
      cash: 1250.5,
      card: 3489.75,
    },
    alerts: {
      cancellations: 3,
      pending: 5,
    },
  };

  const totalRevenue = +(data.revenue.cash + data.revenue.card).toFixed(2);

  return (
    <Row className="mb-3">
      <Col md={4}>
        <Card>
          <CardBody>
            <p className="text-muted mb-1">{t('dashboard.kpis.daily_shifts')}</p>
            <h3 className="mb-0">
              <CountUp end={data.dailyShifts} />
            </h3>
            <p className="text-muted small mb-0">{t('dashboard.kpis.daily_shifts_sub')}</p>
          </CardBody>
        </Card>
      </Col>

      <Col md={4}>
        <Card>
          <CardBody>
            <p className="text-muted mb-1">{t('dashboard.kpis.total_revenue')}</p>
            <h3 className="mb-0">
              <CountUp prefix="$" end={totalRevenue} decimals={2} />
            </h3>
            <div className="d-flex gap-2 mt-2 small text-muted">
              <div>{t('dashboard.kpis.revenue.cash')}: <strong>${data.revenue.cash.toFixed(2)}</strong></div>
              <div>{t('dashboard.kpis.revenue.card')}: <strong>${data.revenue.card.toFixed(2)}</strong></div>
            </div>
          </CardBody>
        </Card>
      </Col>

      <Col md={4}>
        <Card>
          <CardBody>
            <p className="text-muted mb-1">{t('dashboard.kpis.alerts')}</p>
            <div className="mb-2">
              <Badge color="danger" className="me-2">{t('dashboard.kpis.cancellations', { count: data.alerts.cancellations })}</Badge>
              <Badge color="warning">{t('dashboard.kpis.pending', { count: data.alerts.pending })}</Badge>
            </div>
            <p className="text-muted small mb-0">{t('dashboard.kpis.alerts_sub')}</p>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminKpis;
