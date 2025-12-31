import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { RevenueCharts } from "./DashboardEcommerceCharts";
import CountUp from "react-countup";
import { getDashboardStats } from "../../helpers/backend_helper";

interface RevenueProps {
  dateRange: Date[];
}

const Revenue: React.FC<RevenueProps> = ({ dateRange }) => {
  const { t } = useTranslation();
  const [chartData, setchartData] = useState<any>([]);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    cash: 0,
    bank: 0,
    bookings: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch revenue data based on date range
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!dateRange || dateRange.length < 2) return;
      
      setLoading(true);
      try {
        const start = dateRange[0].toISOString().split('T')[0];
        const end = dateRange[1].toISOString().split('T')[0];
        
        const response = await getDashboardStats(start, end);
        
        if (response && response.data && response.data.data) {
          const data = response.data.data;
          setRevenueStats({
            totalRevenue: (data.cash || 0) + (data.bank || 0),
            cash: data.cash || 0,
            bank: data.bank || 0,
            bookings: data.bookings || 0,
          });
          
          // Update chart with real data (you can expand this logic)
          setchartData([{
            name: 'Revenue',
            data: [data.cash, data.bank] // Simplified for now
          }]);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [dateRange]);

  // Local mock series data for the chart
  const mockSeriesAll = [
    {
      name: 'Revenue',
      data: [1200, 1500, 1400, 1700, 1600, 1800, 2000, 1900, 2100, 2300, 2200, 2500]
    }
  ];
  const mockSeriesMonth = [
    { name: 'Revenue', data: [1800, 1900, 2000, 2100] }
  ];
  const mockSeriesHalfYear = [
    { name: 'Revenue', data: [1200, 1400, 1500, 1700, 2000, 2200] }
  ];
  const mockSeriesYear = [
    { name: 'Revenue', data: [800, 900, 1000, 1200, 1500, 1700, 2000, 2300, 2600, 2800, 3000, 3200] }
  ];

  const onChangeChartPeriod = (pType:any) => {
    switch (pType) {
      case 'month':
        setchartData(mockSeriesMonth);
        break;
      case 'halfyear':
        setchartData(mockSeriesHalfYear);
        break;
      case 'year':
        setchartData(mockSeriesYear);
        break;
      default:
        setchartData(mockSeriesAll);
    }
  };

  return (
    <React.Fragment>
      <Card>
        <CardHeader className="border-0 align-items-center d-flex">
          <h4 className="card-title mb-0 flex-grow-1">{t('dashboard.revenue.title')}</h4>
          <div className="d-flex gap-1">
            <button type="button" className="btn btn-soft-secondary btn-sm" onClick={() => { onChangeChartPeriod("all"); }}>
              ALL
            </button>
            <button type="button" className="btn btn-soft-secondary btn-sm" onClick={() => { onChangeChartPeriod("month"); }}>
              1M
            </button>
            <button type="button" className="btn btn-soft-secondary btn-sm" onClick={() => { onChangeChartPeriod("halfyear"); }}>
              6M
            </button>
            <button type="button" className="btn btn-soft-primary btn-sm" onClick={() => { onChangeChartPeriod("year"); }}>
              1Y
            </button>
          </div>
        </CardHeader>

        <CardHeader className="p-0 border-0 bg-light-subtle">
          <Row className="g-0 text-center">
            <Col xs={6} sm={4}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  <CountUp 
                    start={0} 
                    end={revenueStats.totalRevenue} 
                    duration={3} 
                    separator="," 
                    decimals={2}
                    prefix="$"
                  />
                </h5>
                <p className="text-muted mb-0">{t('dashboard.revenue.total_revenue')}</p>
              </div>
            </Col>
            <Col xs={6} sm={4}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  <CountUp
                    prefix="$"
                    start={0}
                    decimals={2}
                    end={revenueStats.cash}
                    duration={3}
                    separator=","
                  />
                </h5>
                <p className="text-muted mb-0">{t('dashboard.revenue.cash')}</p>
              </div>
            </Col>
            <Col xs={6} sm={4}>
              <div className="p-3 border border-dashed border-start-0 border-end-0">
                <h5 className="mb-1">
                  <CountUp
                    prefix="$"
                    start={0}
                    decimals={2}
                    end={revenueStats.bank}
                    duration={3}
                    separator=","
                  />
                </h5>
                <p className="text-muted mb-0">{t('dashboard.revenue.card')}</p>
              </div>
            </Col>
          </Row>
        </CardHeader>

        <CardBody className="p-0 pb-2">
          <div className="w-100">
            <div dir="ltr">
              <RevenueCharts series={chartData} dataColors='["--vz-primary", "--vz-success", "--vz-danger"]' />
            </div>
          </div>
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

export default Revenue;
