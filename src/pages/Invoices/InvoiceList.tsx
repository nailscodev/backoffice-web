import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CardBody,
  Row,
  Col,
  Card,
  Container,
  CardHeader,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Link } from "react-router-dom";
import moment from "moment";
import CountUp from "react-countup";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import TableContainer from "../../Components/Common/TableContainer";
import DeleteModal from "../../Components/Common/DeleteModal";

//Import Icons
import FeatherIcon from "feather-icons-react";
import ReactApexChart from "react-apexcharts";
import Flatpickr from "react-flatpickr";
import { useTranslation } from 'react-i18next';

//Import actions
import {
  getInvoices as onGetInvoices,
  deleteInvoice as onDeleteInvoice,
} from "../../slices/thunks";

//Import backend helpers
import { getDashboardStats, getInvoices, getRevenueOverTime } from "../../helpers/backend_helper";

//Import DateRangeContext
import { useDateRange } from "../../contexts/DateRangeContext";

//redux
import { useSelector, useDispatch } from "react-redux";

import Loader from "../../Components/Common/Loader";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createSelector } from "reselect";

const InvoiceList = () => {
  const dispatch: any = useDispatch();

  const selectLayoutState = (state: any) => state.Invoice;
  const selectinvoiceProperties = createSelector(
    selectLayoutState,
    (state) => ({
      invoices: state.invoices,
      isInvoiceSuccess: state.isInvoiceSuccess,
      error: state.error,
    })
  );
  // Inside your component
  const {
    invoices, isInvoiceSuccess, error
  } = useSelector(selectinvoiceProperties);

  // layout mode (light/dark) so UI elements can adapt (badges/chips visibility)
  const selectLayoutMode = createSelector(
    (state: any) => state.Layout,
    (layout) => layout.layoutModeType
  );
  const layoutMode = useSelector(selectLayoutMode);

  // Use DateRangeContext instead of local state
  const { dateRange, setDateRange, startDate, endDate, startLabel, endLabel } = useDateRange();
  const { t, i18n } = useTranslation();

  // Get current language for API calls
  const currentLang = i18n.language === 'sp' ? 'ES' : 'EN';
  // Backend data state
  const [dashboardStats, setDashboardStats] = useState({ 
    cash: 0, 
    bank: 0, 
    totalRevenue: 0, 
    manualAdjustmentsTotal: 0, 
    completedTransactions: 0, 
    bookings: 0 
  });
  const [revenueOverTimeData, setRevenueOverTimeData] = useState<Array<{ date: string; cash: number; bank: number; bookings: number }>>([]);
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;

  // Filter states
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [selectedDirection, setSelectedDirection] = useState<any>(null);

  //delete invoice
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);

  const [invoice, setInvoice] = useState<any>(null);

  // Fetch dashboard stats when date range changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!dateRange || dateRange.length < 2) return;
      
      try {
        const start = dateRange[0].toISOString().split('T')[0];
        const end = dateRange[1].toISOString().split('T')[0];

        // Fetch dashboard stats (cash, bank, total revenue, etc.)
        const statsResponse = await getDashboardStats(start, end);
        if (statsResponse?.data?.data) {
          setDashboardStats(statsResponse.data.data);
        }

        // Fetch revenue over time data
        const revenueOverTimeResponse = await getRevenueOverTime(start, end);
        if (revenueOverTimeResponse?.data?.data) {
          setRevenueOverTimeData(revenueOverTimeResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  // Fetch invoices when date range or current page changes
  const fetchInvoices = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) return;
    
    setLoading(true);
    try {
      const start = dateRange[0].toISOString().split('T')[0];
      const end = dateRange[1].toISOString().split('T')[0];

      // Prepare filters object
      const filters: any = {};
      
      // Add service filter
      if (selectedService && selectedService.value !== "All") {
        filters.serviceId = selectedService.value; // Use the service ID instead of name/label
      }
      
      // Add payment method filter
      if (selectedPaymentMethod && selectedPaymentMethod.value !== "All") {
        filters.paymentMethod = selectedPaymentMethod.value;
      }
      
      // Add direction/type filter
      if (selectedDirection && selectedDirection.value !== "All") {
        filters.type = selectedDirection.value.toLowerCase(); // "Income" -> "income", "Expense" -> "expense"
      }

      // Fetch invoices with filters
      const invoicesResponse = await getInvoices(
        start, 
        end, 
        currentPage, 
        itemsPerPage, 
        currentLang,
        Object.keys(filters).length > 0 ? filters : undefined
      );
      
      if (invoicesResponse?.data) {
        const invoicesData = invoicesResponse.data.data || [];
        const pagination = invoicesResponse.data.pagination;
        
        // Set invoices data (filters already applied on backend)
        setInvoiceList(invoicesData);
        
        // Update pagination info
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalRecords(pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error loading invoices');
    } finally {
      setLoading(false);
    }
  }, [dateRange, currentPage, itemsPerPage, currentLang, selectedService, selectedPaymentMethod, selectedDirection]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedService, selectedPaymentMethod, selectedDirection]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Delete Data
  const onClickDelete = (invoice: any) => {
    setInvoice(invoice);
    setDeleteModal(true);
  };

  const handleDeleteInvoice = () => {
    if (invoice) {
      dispatch(onDeleteInvoice(invoice._id));
      setDeleteModal(false);
    }
  };


  const handleValidDate = (date: any) => {
    if (!date) return '';
    // Usar el idioma actual de i18n
    const lang = i18n.language || 'en';
    moment.locale(lang);
    // Formato resumido: español 'D MMM YYYY', inglés 'MMM D YYYY'
    const format = lang.startsWith('sp') ? 'D MMM YYYY' : 'MMM D YYYY';
    return moment(date, 'YYYY-MM-DD').format(format);
  };

  const handleValidTime = (time: any) => {
    const time1 = new Date(time);
    const getHour = time1.getUTCHours();
    const getMin = time1.getUTCMinutes();
    const getTime = `${getHour}:${getMin}`;
    var meridiem = "";
    if (getHour >= 12) {
      meridiem = "PM";
    } else {
      meridiem = "AM";
    }
    const updateTime = moment(getTime, 'hh:mm').format('hh:mm') + " " + meridiem;
    return updateTime;
  };

  // Checked All
  const checkedAll = useCallback(() => {
    const checkall: any = document.getElementById("checkBoxAll");
    const ele = document.querySelectorAll(".invoiceCheckBox");

    if (checkall.checked) {
      ele.forEach((ele: any) => {
        ele.checked = true;
      });
    } else {
      ele.forEach((ele: any) => {
        ele.checked = false;
      });
    }
    deleteCheckbox();
  }, []);

  // Delete Multiple
  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState<boolean>(false);

  const deleteMultiple = () => {
    const checkall: any = document.getElementById("checkBoxAll");
    selectedCheckBoxDelete.forEach((element: any) => {
      dispatch(onDeleteInvoice(element.value));
      setTimeout(() => { toast.clearWaitingQueue(); }, 3000);
    });
    setIsMultiDeleteButton(false);
    checkall.checked = false;
  };

  const deleteCheckbox = () => {
    const ele: any = document.querySelectorAll(".invoiceCheckBox:checked");
    ele.length > 0 ? setIsMultiDeleteButton(true) : setIsMultiDeleteButton(false);
    setSelectedCheckBoxDelete(ele);
  };

  // Column definition: New transaction-based structure
  const columns = useMemo(
    () => [
      {
        header: t('invoices.col.transaction_id', 'Transaction ID'),
        accessorKey: "id",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <span 
            className="text-muted font-monospace" 
            style={{ fontSize: '0.8rem', cursor: 'pointer' }}
            title={t('invoices.click_to_copy', 'Click to copy')}
            onClick={() => navigator.clipboard?.writeText(cell.getValue())}
          >
            {cell.getValue()}
          </span>
        ),
      },
      {
        header: t('invoices.col.customer', 'Customer'),
        accessorKey: "customerName",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const isAdjustment = cell.row.original.type !== 'booking';
          return (
            <span className={`text-muted ${isAdjustment ? 'fst-italic' : ''}`} style={{ fontSize: '0.9rem', fontWeight: '400' }}>
              {cell.getValue()}
            </span>
          );
        },
      },
      {
        header: t('invoices.col.date', 'Date'),
        accessorKey: "appointmentDate",
        enableColumnFilter: false,
        cell: (cell: any) => <>{handleValidDate(cell.getValue())}</>,
      },
      {
        header: t('invoices.col.payment', 'Payment'),
        accessorKey: "paymentMethod",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <span className={cell.getValue() === 'CASH' ? 'badge bg-success' : 'badge bg-primary'}>
            {cell.getValue() === 'CASH' ? t('invoices.cash', 'Efectivo') : t('invoices.card', 'Tarjeta')}
          </span>
        ),
      },
      {
        header: t('invoices.col.amount', 'Amount'),
        accessorKey: "totalPrice",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const amount = parseFloat(cell.getValue() || 0);
          const isExpense = cell.row.original.type === 'adjustment_expense';
          const isPositive = amount > 0 && !isExpense;
          return (
            <span className={`fw-semibold ${isPositive ? 'text-success' : isExpense ? 'text-danger' : 'text-dark'}`}>
              {isExpense ? '-' : isPositive ? '+' : ''}${Math.abs(amount).toFixed(2)}
            </span>
          );
        },
      },
      {
        header: t('invoices.col.description', 'Description'),
        accessorKey: "serviceName",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const isAdjustment = cell.row.original.type !== 'booking';
          const recordType = cell.row.original.type;
          
          // Determine description prefix based on type
          let prefix = '';
          if (recordType === 'adjustment_income') {
            prefix = t('invoices.manual_income', 'Manual adjustment – income');
          } else if (recordType === 'adjustment_expense') {
            prefix = t('invoices.manual_expense', 'Manual adjustment – expense');
          }
          
          const description = prefix ? `${prefix}: ${cell.getValue()}` : cell.getValue();
          
          return (
            <span className={`${isAdjustment ? 'text-warning' : 'text-dark'}`}>
              {description || 'N/A'}
            </span>
          );
        },
      },
    ],
    [t]
  );

  document.title = "Invoice List | Nails & Co Midtown - Admin Panel";

  return (
    <React.Fragment>
      <div className="page-content">
        <DeleteModal
          show={deleteModal}
          onDeleteClick={() => handleDeleteInvoice()}
          onCloseClick={() => setDeleteModal(false)}
        />
        <DeleteModal
          show={deleteModalMulti}
          onDeleteClick={() => {
            deleteMultiple();
            setDeleteModalMulti(false);
          }}
          onCloseClick={() => setDeleteModalMulti(false)}
        />
        <Container fluid>
          <BreadCrumb title={t('invoices.list_title', 'Invoice List')} pageTitle={t('invoices.page_title', 'Invoices')} />
          {/* Date selector (like dashboard section) */}
          <Row className="mb-3 pb-1">
            <Col xs={12}>
              <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                <div className="flex-grow-1">
                  <h4 className="fs-16 mb-1">{t('invoices.heading', 'Invoices')}</h4>
                  <p className="text-muted mb-0">{t('dashboard.section.range_text', "Here's what's happening between {{start}} and {{end}}.", { start: startLabel, end: endLabel })}</p>
                </div>
                <div className="mt-3 mt-lg-0">
                  <form action="#">
                    <div className="input-group">
                      <Flatpickr
                        className="form-control border-0 dash-filter-picker shadow"
                        value={dateRange}
                        options={{ mode: "range", dateFormat: "d M, Y", defaultDate: dateRange }}
                        onChange={(selected: any) => setDateRange(selected)}
                      />
                      <div className="input-group-text bg-primary border-primary text-white"><i className="ri-calendar-2-line"></i></div>
                    </div>
                  </form>
                </div>
              </div>
            </Col>
          </Row>

          {/* Top area: 5 metric cards in a responsive grid */}
          {(() => {
            // Use backend data for all metrics
            const totalRevenue = dashboardStats.totalRevenue || 0;
            const cashTotal = dashboardStats.cash || 0;
            const bankTotal = dashboardStats.bank || 0;
            const manualAdjustments = dashboardStats.manualAdjustmentsTotal || 0;
            const completedTransactions = dashboardStats.completedTransactions || 0;

            return (
              <Row className="mb-4 d-flex">
                {/* Total Revenue Card */}
                <Col style={{ flex: '1 1 0', minWidth: '200px' }} className="mb-3 px-2">
                  <Card className="card-animate h-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0 fs-6">
                            {t('invoices.total_revenue', 'Total Revenue')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-end justify-content-between mt-4">
                        <div>
                          <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                            <CountUp 
                              start={0} 
                              end={totalRevenue} 
                              prefix="$" 
                              duration={2} 
                              decimals={2} 
                              separator="," 
                              className="counter-value" 
                            />
                          </h4>
                          <span className="text-muted fs-6">{t('invoices.today', 'Today')}</span>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                            <FeatherIcon icon="trending-up" />
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Cash Card */}
                <Col style={{ flex: '1 1 0', minWidth: '200px' }} className="mb-3 px-2">
                  <Card className="card-animate h-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0 fs-6">
                            {t('invoices.cash', 'Cash')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-end justify-content-between mt-4">
                        <div>
                          <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                            <CountUp 
                              start={0} 
                              end={cashTotal} 
                              prefix="$" 
                              duration={2} 
                              decimals={2} 
                              separator="," 
                              className="counter-value" 
                            />
                          </h4>
                          <span className="text-muted fs-6">{t('invoices.in_cash', 'In cash')}</span>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                            <FeatherIcon icon="dollar-sign" />
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Bank / Card */}
                <Col style={{ flex: '1 1 0', minWidth: '200px' }} className="mb-3 px-2">
                  <Card className="card-animate h-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0 fs-6">
                            {t('invoices.bank_card', 'Bank / Card')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-end justify-content-between mt-4">
                        <div>
                          <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                            <CountUp 
                              start={0} 
                              end={bankTotal} 
                              prefix="$" 
                              duration={2} 
                              decimals={2} 
                              separator="," 
                              className="counter-value" 
                            />
                          </h4>
                          <span className="text-muted fs-6">{t('invoices.in_bank', 'In bank')}</span>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-info-subtle text-info rounded fs-3">
                            <FeatherIcon icon="credit-card" />
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Manual Adjustments Card */}
                <Col style={{ flex: '1 1 0', minWidth: '200px' }} className="mb-3 px-2">
                  <Card className="card-animate h-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0 fs-6">
                            {t('invoices.manual_adjustments', 'Manual Adjustments')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-end justify-content-between mt-4">
                        <div>
                          <h4 className={`fs-22 fw-semibold ff-secondary mb-2 ${manualAdjustments < 0 ? 'text-danger' : 'text-success'}`}>
                            <CountUp 
                              start={0} 
                              end={Math.abs(manualAdjustments)} 
                              prefix={manualAdjustments < 0 ? "-$" : "$"} 
                              duration={2} 
                              decimals={2} 
                              separator="," 
                              className="counter-value" 
                            />
                          </h4>
                          <span className="text-muted fs-6">
                            {t('invoices.income_vs_expenses', 'Income - Expenses')}
                          </span>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className={`avatar-title rounded fs-3 ${manualAdjustments < 0 ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`}>
                            <FeatherIcon icon="edit-3" />
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Completed Transactions Card */}
                <Col style={{ flex: '1 1 0', minWidth: '200px' }} className="mb-3 px-2">
                  <Card className="card-animate h-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0 fs-6">
                            {t('invoices.completed_transactions', 'Completed Transactions')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-end justify-content-between mt-4">
                        <div>
                          <h4 className="fs-22 fw-semibold ff-secondary mb-2 text-primary">
                            <CountUp 
                              start={0} 
                              end={completedTransactions} 
                              duration={2} 
                              className="counter-value" 
                            />
                          </h4>
                          <span className="text-muted fs-6">{t('invoices.completed', 'Completed')}</span>
                        </div>
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                            <FeatherIcon icon="check-circle" />
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            );
          })()}

          {/* Chart section - Cash vs Bank only */}
          <Row className="mb-4">
            <Col lg={6}>
              <Card className="card-animate">
                <CardHeader className="border-0">
                  <h5 className="card-title mb-0">{t('invoices.cash_vs_bank', 'Cash vs Bank')}</h5>
                </CardHeader>
                <CardBody>
                  {(() => {
                    const cashTotal = dashboardStats.cash || 0;
                    const bankTotal = dashboardStats.bank || 0;
                    
                    return cashTotal > 0 || bankTotal > 0 ? (
                      <ReactApexChart
                        dir="ltr"
                        className="apex-charts"
                        options={{
                          chart: { toolbar: { show: false } },
                          labels: [t('invoices.cash', 'Cash'), t('invoices.bank_card', 'Bank / Card')],
                          dataLabels: { 
                            enabled: true, 
                            formatter: function (val: any) { 
                              return Number(val).toFixed(1) + '%'; 
                            } 
                          },
                          colors: ["#0acf97", "#556ee6"],
                          legend: { position: 'bottom' },
                          tooltip: {
                            y: {
                              formatter: function (val: any) {
                                return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              }
                            }
                          }
                        }}
                        series={[cashTotal, bankTotal]}
                        type="donut"
                        height={300}
                      />
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">{t('invoices.no_data', 'No data available')}</p>
                      </div>
                    );
                  })()}
                </CardBody>
              </Card>
            </Col>
            
            {/* Revenue Over Time Chart */}
            <Col lg={6}>
              <Card className="card-animate">
                <CardHeader className="border-0">
                  <h5 className="card-title mb-0">{t('invoices.revenue_over_time', 'Revenue Over Time')}</h5>
                </CardHeader>
                <CardBody>
                  {(() => {
                    if (!revenueOverTimeData || revenueOverTimeData.length === 0) {
                      return (
                        <div className="text-center py-5">
                          <div className="mb-3">
                            <FeatherIcon icon="trending-up" className="text-muted" size="48" />
                          </div>
                          <h6 className="text-muted">{t('invoices.no_revenue_data', 'No revenue data available')}</h6>
                          <p className="text-muted small">{t('invoices.select_date_range', 'Select a date range to view revenue trends.')}</p>
                        </div>
                      );
                    }

                    // Prepare chart data
                    const dates = revenueOverTimeData.map(item => {
                      const date = new Date(item.date);
                      return date.toLocaleDateString(i18n.language === 'sp' ? 'es-ES' : 'en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                    });
                    const cashSeries = revenueOverTimeData.map(item => item.cash);
                    const bankSeries = revenueOverTimeData.map(item => item.bank);

                    const chartOptions = {
                      chart: {
                        id: 'revenueOverTimeChart',
                        height: 300,
                        type: 'area' as const,
                        stacked: true,
                        toolbar: { show: false },
                        zoom: { enabled: false }
                      },
                      // stacked area for cash + bank
                      colors: ['#0acf97', '#556ee6'],
                      dataLabels: { enabled: false },
                      stroke: {
                        curve: 'smooth' as const,
                        width: [2, 2]
                      },
                      markers: {
                        size: 3,
                        colors: ['#0acf97', '#556ee6'],
                        strokeColors: '#ffffff',
                        strokeWidth: 2,
                        hover: { size: 5 }
                      },
                      fill: {
                        type: 'gradient',
                        gradient: {
                          shadeIntensity: 1,
                          opacityFrom: 0.65,
                          opacityTo: 0.18,
                          stops: [0, 90, 100]
                        }
                      },
                      xaxis: {
                        categories: dates,
                        tickAmount: 6,
                        labels: {
                          style: {
                            colors: '#8c90a4',
                            fontSize: '12px'
                          },
                          rotate: -45
                        }
                      },
                      yaxis: [
                        {
                          title: {
                            text: t('invoices.revenue', 'Revenue ($)'),
                            style: {
                              color: '#556ee6',
                              fontSize: '12px'
                            }
                          },
                          labels: {
                            formatter: (val: number) => '$' + val.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                            style: { colors: '#8c90a4' }
                          }
                        }
                      ],
                      grid: {
                        borderColor: '#f1f1f1',
                        strokeDashArray: 3
                      },
                      legend: {
                        position: 'top' as const,
                        horizontalAlign: 'right' as const,
                        labels: {
                          colors: '#8c90a4'
                        }
                      },
                      tooltip: {
                        shared: true,
                        intersect: false,
                        y: {
                          formatter: function (val: number, opts: { seriesIndex: number }) {
                            return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          }
                        }
                      }
                    };

                    const chartSeries = [
                      {
                        name: t('invoices.cash', 'Cash'),
                        type: 'area' as const,
                        data: cashSeries,
                        color: '#0acf97'
                      },
                      {
                        name: t('invoices.bank_card', 'Bank / Card'),
                        type: 'area' as const,
                        data: bankSeries,
                        color: '#556ee6'
                      }
                    ];

                    return (
                      <div>
                        <style>{`
                          /* Stronger area fills for stacked-area chart and explicit series colors */
                          .revenue-over-time-chart .apexcharts-area { fill-opacity: 0.78 !important; }
                          .revenue-over-time-chart .apexcharts-series-0 .apexcharts-area { fill: #0acf97 !important; }
                          .revenue-over-time-chart .apexcharts-series-1 .apexcharts-area { fill: #556ee6 !important; }
                          /* Ensure lines are visible on top of the filled areas */
                          .revenue-over-time-chart .apexcharts-line { stroke-opacity: 1 !important; stroke-linecap: round !important; stroke-width: 2 !important; }
                          .revenue-over-time-chart .apexcharts-series-0 .apexcharts-line { stroke: #0acf97 !important; }
                          .revenue-over-time-chart .apexcharts-series-1 .apexcharts-line { stroke: #556ee6 !important; }
                        `}</style>

                        <ReactApexChart
                          dir="ltr"
                          className="apex-charts revenue-over-time-chart"
                          options={chartOptions}
                          series={chartSeries}
                          type="area"
                          height={300}
                        />
                      </div>
                    );
                  })()
                  }
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card id="invoiceList">
                <CardHeader className="border-0">
                  <div className="d-flex align-items-center">
                    <h5 className="card-title mb-0 flex-grow-1">{t('invoices.table_title', 'Invoices')}</h5>
                    <div className="flex-shrink-0">
                      <div className="d-flex gap-2 flex-wrap">
                        {isMultiDeleteButton && <button className="btn btn-primary me-1"
                          onClick={() => setDeleteModalMulti(true)}
                        ><i className="ri-delete-bin-2-line"></i></button>}
                        <Link
                          to="/apps-invoices-create"
                          className="btn btn-danger"
                        >
                          <i className="ri-add-line align-bottom me-1"></i> {t('invoices.manual_adjustment', 'Manual Adjustment')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div>
                    {/* Always show the TableContainer with filters, regardless of data */}
                    <TableContainer
                      columns={columns}
                      data={loading ? [] : invoiceList} // Empty array while loading, actual data when ready
                      isGlobalFilter={true}
                      customPageSize={10}
                      isInvoiceListFilter={true}
                      theadClass="text-muted text-uppercase"
                      SearchPlaceholder={t('invoices.search_placeholder', 'Buscar por ID de transacción o descripción')}
                      invoiceDateRange={dateRange}
                      setInvoiceDateRange={setDateRange}
                      onReloadData={fetchInvoices}
                      isPagination={false}
                      // Filter props
                      invoiceService={selectedService}
                      setInvoiceService={setSelectedService}
                      invoicePaymentMethod={selectedPaymentMethod}
                      setInvoicePaymentMethod={setSelectedPaymentMethod}
                      invoiceDirection={selectedDirection}
                      setInvoiceDirection={setSelectedDirection}
                    />
                    
                    {/* Loading state */}
                    {loading && (
                      <div className="text-center py-4">
                        <Loader error={null} />
                      </div>
                    )}
                    
                    {/* No data message */}
                    {!loading && invoiceList.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted">{t('invoices.no_data', 'No invoices found for the selected criteria')}</p>
                      </div>
                    )}
                    
                    {/* Pagination Controls - only show when there's data and multiple pages */}
                    {!loading && totalPages > 1 && (
                      <Row className="align-items-center mt-4 pt-3 justify-content-between text-center text-sm-start">
                        <Col sm="auto">
                          <div className="text-muted">
                            {t('invoices.pagination.showing', 'Showing')} <span className="fw-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> {t('invoices.pagination.to', 'to')} <span className="fw-semibold">{Math.min(currentPage * itemsPerPage, totalRecords)}</span> {t('invoices.pagination.of', 'of')} <span className="fw-semibold">{totalRecords}</span> {t('invoices.pagination.results', 'results')}
                          </div>
                        </Col>
                        <Col sm="auto" className="mt-3 mt-sm-0">
                          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                            <li className={currentPage === 1 ? "page-item disabled" : "page-item"}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                {t('invoices.pagination.previous', 'Previous')}
                              </button>
                            </li>
                            {(() => {
                              const maxPagesToShow = 5;
                              const pages = [];
                              let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                              let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                              
                              if (endPage - startPage < maxPagesToShow - 1) {
                                startPage = Math.max(1, endPage - maxPagesToShow + 1);
                              }
                              
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <li key={i} className={currentPage === i ? "page-item active" : "page-item"}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => setCurrentPage(i)}
                                    >
                                      {i}
                                    </button>
                                  </li>
                                );
                              }
                              return pages;
                            })()}
                            <li className={currentPage === totalPages ? "page-item disabled" : "page-item"}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                {t('invoices.pagination.next', 'Next')}
                              </button>
                            </li>
                          </ul>
                        </Col>
                      </Row>
                    )}
                    
                    <ToastContainer closeButton={false} limit={1} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default InvoiceList;