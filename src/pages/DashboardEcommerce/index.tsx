import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "reactstrap";
import Widget from "./Widgets";
import BestSellingServices from "./BestSellingServices";
import RecentActivity from "./RecentActivity";
import UpcomingServices from "./UpcomingServices";
import Section from "./Section";
import StoreVisits from "./StoreVisits";
import TopSellers from "./TopSellers";
import { getDashboardStats } from "../../helpers/backend_helper";

const DashboardEcommerce = () => {
  document.title = "Nails & Co Midtown - Admin Panel";

  const [rightColumn, setRightColumn] = useState<boolean>(true);
  const toggleRightColumn = () => {
    setRightColumn(!rightColumn);
  };

  // Date range state
  const getWeekRange = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekRange(today);
  const [dateRange, setDateRange] = useState<Date[]>([weekStart, weekEnd]);
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    cash: 0,
    bank: 0,
    bookings: 0,
    distinctServices: 0,
    newCustomers: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch dashboard stats
  const fetchDashboardStats = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const start = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const end = endDate.toISOString().split('T')[0];
      
      console.log('Fetching dashboard stats for:', start, 'to', end);
      const response = await getDashboardStats(start, end);
      console.log('Dashboard stats response:', response);
      console.log('Dashboard stats response.data:', response.data);
      console.log('Dashboard stats response.data.data:', response.data?.data);
      
      if (response && response.data && response.data.data) {
        console.log('Setting dashboard stats:', response.data.data);
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when date range changes
  useEffect(() => {
    if (dateRange && dateRange.length >= 2) {
      fetchDashboardStats(dateRange[0], dateRange[1]);
    }
  }, [dateRange]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100">
                <Section 
                  rightClickBtn={toggleRightColumn} 
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                />
                <Row>
                  <Widget 
                    stats={dashboardStats} 
                    loading={loading}
                  />
                </Row>
                <Row>
                  <BestSellingServices dateRange={dateRange} />
                  <TopSellers dateRange={dateRange} />
                </Row>
                <Row>
                  <StoreVisits dateRange={dateRange} />
                  <UpcomingServices />
                </Row>
              </div>
            </Col>
            {/* <RecentActivity rightColumn={rightColumn} hideRightColumn={toggleRightColumn} /> */}
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;
