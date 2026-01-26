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
import { getDashboardStats, getInvoices, getRevenueByService } from "../../helpers/backend_helper";

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

  // Backend data state
  const [dashboardStats, setDashboardStats] = useState({ cash: 0, bank: 0, bookings: 0 });
  const [revenueByService, setRevenueByService] = useState<{ service: string; revenue: number }[]>([]);
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;


  //delete invoice
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);

  const [invoice, setInvoice] = useState<any>(null);

  // Fetch dashboard stats and revenue when date range changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!dateRange || dateRange.length < 2) return;
      
      try {
        const start = dateRange[0].toISOString().split('T')[0];
        const end = dateRange[1].toISOString().split('T')[0];

        // Fetch dashboard stats (cash, bank)
        const statsResponse = await getDashboardStats(start, end);
        if (statsResponse?.data?.data) {
          setDashboardStats(statsResponse.data.data);
        }

        // Fetch revenue by service
        const revenueResponse = await getRevenueByService(start, end);
        if (revenueResponse?.data?.data) {
          setRevenueByService(revenueResponse.data.data);
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

      // Fetch invoices (bookings + manual adjustments) with pagination
      const invoicesResponse = await getInvoices(start, end, currentPage, itemsPerPage);
      if (invoicesResponse?.data) {
        const invoicesData = invoicesResponse.data.data || [];
        const pagination = invoicesResponse.data.pagination;
        
        // Set invoices data (includes both bookings and manual adjustments)
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
  }, [dateRange, currentPage, itemsPerPage]);

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

  // Column definition: reduced to only the requested fields
  const columns = useMemo(
    () => [
      {
        header: t('invoices.col.customer', 'Customer'),
        accessorKey: "customerName",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const isAdjustment = cell.row.original.type !== 'booking';
          return (
            <div className="d-flex align-items-center">
              {!isAdjustment && cell.row.original.customerImg ? (
                <img
                  src={process.env.REACT_APP_API_URL + "/images/users/" + cell.row.original.customerImg}
                  alt=""
                  className="avatar-xs rounded-circle me-2"
                />
              ) : (
                <div className="flex-shrink-0 avatar-xs me-2">
                  <div className={`avatar-title ${isAdjustment ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'} rounded-circle fs-13`}>
                    {isAdjustment ? '±' : (cell.getValue() ? cell.getValue().charAt(0) : "-")}
                  </div>
                </div>
              )}
              <span>{cell.getValue()}</span>
            </div>
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
            {cell.getValue() === 'CASH' ? t('invoices.cash', 'Cash') : t('invoices.bank', 'Card')}
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
          return (
            <span className={isExpense ? 'text-danger fw-bold' : ''}>
              {isExpense ? '-' : ''}${Math.abs(amount).toFixed(2)}
            </span>
          );
        },
      },
      {
        header: t('invoices.col.services', 'Service(s)'),
        accessorKey: "serviceName",
        enableColumnFilter: true,
        cell: (cell: any) => {
          const isAdjustment = cell.row.original.type !== 'booking';
          const badgeClass = layoutMode === 'dark'
            ? 'badge bg-transparent text-white border border-secondary me-1'
            : isAdjustment 
              ? 'badge bg-warning-subtle text-warning me-1'
              : 'badge bg-light text-dark me-1';
          return (
            <span
              className={badgeClass}
              style={{ fontSize: '0.95rem', padding: '0.35rem 0.6rem' }}
            >
              {cell.getValue() || 'N/A'}
            </span>
          );
        },
      },
    ],
    [t, layoutMode]
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

          {/* Top area: left — two cards (cash, bank); right — two pie/donut charts (cash vs bank, revenue by service) */}
          {(() => {
            // Use backend data for cash and bank totals
            const cashTotal = dashboardStats.cash || 0;
            const bankTotal = dashboardStats.bank || 0;

            // Process revenue by service for the chart
            // Limit to top 5 services and group the rest as "Others"
            const topLimit = 5;
            let serviceLabels: string[] = [];
            let serviceSeries: number[] = [];
            let chartColors: string[] = [];
            
            const palette = ["#556ee6", "#34c38f", "#50a5f1", "#f46a6a", "#f7b84b", "#0acf97", "#248af0"];
            const grayColor = "#6c757d";
            
            if (revenueByService.length > topLimit) {
              const topServices = revenueByService.slice(0, topLimit);
              const othersServices = revenueByService.slice(topLimit);
              const othersRevenue = othersServices.reduce((sum, s) => sum + s.revenue, 0);
              
              serviceLabels = [...topServices.map(s => s.service), t('invoices.others', 'Others')];
              serviceSeries = [...topServices.map(s => s.revenue), othersRevenue];
              chartColors = [...palette.slice(0, topLimit), grayColor];
            } else {
              serviceLabels = revenueByService.map(s => s.service);
              serviceSeries = revenueByService.map(s => s.revenue);
              chartColors = palette.slice(0, revenueByService.length);
            }

            return (
              <Row>
                <Col lg={4}>
                  <Row>
                    <Col md={12} className="mb-3">
                      <Card className="card-animate">
                        <CardBody>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <p className="text-uppercase fw-medium text-muted mb-0">{t('invoices.cash', 'Cash')}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-end justify-content-between mt-4">
                            <div>
                              <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                <CountUp start={0} end={cashTotal} prefix="$" duration={2} decimals={2} separator="," className="counter-value" />
                              </h4>
                              <span className="text-muted">{t('invoices.in_cash', 'In cash')}</span>
                            </div>
                            <div className="avatar-sm flex-shrink-0">
                              <span className="avatar-title bg-light rounded fs-3">
                                <FeatherIcon icon="dollar-sign" className="text-success icon-dual-success" />
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={12}>
                      <Card className="card-animate">
                        <CardBody>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <p className="text-uppercase fw-medium text-muted mb-0">{t('invoices.bank', 'Bank')}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-end justify-content-between mt-4">
                            <div>
                              <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                <CountUp start={0} end={bankTotal} prefix="$" duration={2} decimals={2} separator="," className="counter-value" />
                              </h4>
                              <span className="text-muted">{t('invoices.in_bank', 'In bank')}</span>
                            </div>
                            <div className="avatar-sm flex-shrink-0">
                              <span className="avatar-title bg-light rounded fs-3">
                                <FeatherIcon icon="briefcase" className="text-success icon-dual-success" />
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </Col>

                <Col lg={8}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Card className="card-animate">
                        <CardHeader className="border-0">
                          <h5 className="card-title mb-0">{t('invoices.cash_vs_bank', 'Cash vs Bank')}</h5>
                        </CardHeader>
                        <CardBody>
                          {cashTotal > 0 || bankTotal > 0 ? (
                            <ReactApexChart
                              dir="ltr"
                              className="apex-charts"
                              options={{
                                chart: { toolbar: { show: false } },
                                labels: [t('invoices.cash', 'Cash'), t('invoices.bank', 'Bank')],
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
                              height={247}
                            />
                          ) : (
                            <div className="text-center py-5">
                              <p className="text-muted">{t('invoices.no_data', 'No data available')}</p>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Card className="card-animate">
                        <CardHeader className="border-0">
                          <h5 className="card-title mb-0">{t('invoices.revenue_by_service', 'Revenue by Service')}</h5>
                        </CardHeader>
                        <CardBody>
                          {serviceSeries.length > 0 && serviceSeries.some(s => s > 0) ? (
                            <ReactApexChart
                              dir="ltr"
                              className="apex-charts"
                              options={{
                                chart: { toolbar: { show: false } },
                                labels: serviceLabels,
                                dataLabels: { 
                                  enabled: true, 
                                  formatter: function (val: any) { 
                                    return Number(val).toFixed(1) + '%'; 
                                  } 
                                },
                                colors: chartColors,
                                legend: { position: 'bottom' },
                                tooltip: {
                                  y: {
                                    formatter: function (val: any) {
                                      return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    }
                                  }
                                }
                              }}
                              series={serviceSeries}
                              type="donut"
                              height={247}
                            />
                          ) : (
                            <div className="text-center py-5">
                              <p className="text-muted">{t('invoices.no_data', 'No data available')}</p>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>
            );
          })()}

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
                    {loading ? (
                      <Loader error={null} />
                    ) : invoiceList.length > 0 ? (
                      <>
                        <TableContainer
                          columns={columns}
                          data={invoiceList}
                          isGlobalFilter={true}
                          customPageSize={10}
                          isInvoiceListFilter={true}
                          theadClass="text-muted text-uppercase"
                          SearchPlaceholder={t('invoices.search_placeholder', 'Search for customer or email')}
                          invoiceDateRange={dateRange}
                          setInvoiceDateRange={setDateRange}
                          onReloadData={fetchInvoices}
                          isPagination={false}
                        />
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
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
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">{t('invoices.no_data', 'No invoices found for the selected date range')}</p>
                      </div>
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