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

  // Date range selector hooks (moved to top-level so React Hooks rules are respected)
  const getWeekRange = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
    const diffToMonday = (day + 6) % 7; // days since Monday
    const start = new Date(date);
    start.setDate(date.getDate() - diffToMonday);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    return { start, end };
  };

  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekRange(today);
  const [dateRange, setDateRange] = useState<Date[]>([weekStart, weekEnd]);
  const { t } = useTranslation();
  // derived labels for the currently selected date range
  const startDate = dateRange && dateRange.length > 0 ? dateRange[0] : weekStart;
  const endDate = dateRange && dateRange.length > 1 ? dateRange[1] : (dateRange && dateRange.length === 1 ? dateRange[0] : weekEnd);
  const startLabel = startDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });


  //delete invoice
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);

  const [invoice, setInvoice] = useState<any>(null);

  // If backend fetching is unstable/failing, enable mock data here.
  // To use real backend fetching again, set useMockInvoices = false and
  // uncomment the useEffect that dispatches onGetInvoices() below.
  const useMockInvoices = true;
  const mockInvoices = [
    { _id: 'm1', invoiceId: '#INV00001', name: 'Diana Kohler', email: 'diana@example.com', country: 'Brazil', start: new Date().toISOString(), end: new Date(Date.now() + 30*60*1000).toISOString(), amount: '$875', status: 'Paid', img: null, services: ['Manicure'], paymentMethod: 'cash' },
    { _id: 'm2', invoiceId: '#INV00002', name: 'James Morris', email: 'james@example.com', country: 'Germany', start: new Date().toISOString(), end: new Date(Date.now() + 45*60*1000).toISOString(), amount: '$451.00', status: 'Unpaid', img: null, services: ['Pedicure'], paymentMethod: 'bank' },
    { _id: 'm3', invoiceId: '#INV00003', name: 'Dawn Koh', email: 'dawn@example.com', country: 'United Kingdom', start: new Date().toISOString(), end: new Date(Date.now() + 60*60*1000).toISOString(), amount: '$984.98', status: 'Paid', img: null, services: ['Manicure','Gel Polish'], paymentMethod: 'cash' },
    { _id: 'm4', invoiceId: '#INV00004', name: 'Tonya Noble', email: 'tonya@example.com', country: 'Spain', start: new Date().toISOString(), end: new Date(Date.now() + 50*60*1000).toISOString(), amount: '$742.12', status: 'Cancel', img: null, services: ['Pedicure','Mascara'], paymentMethod: 'bank' },
    { _id: 'm5', invoiceId: '#INV00005', name: 'David Nichols', email: 'david@example.com', country: 'United States', start: new Date().toISOString(), end: new Date(Date.now() + 40*60*1000).toISOString(), amount: '$2415.00', status: 'Unpaid', img: null, services: ['Full Set Acrylic'], paymentMethod: 'cash' },
  ];

  useEffect(() => {
    /*
    The app previously fetched invoices from the backend here. That
    remote fetch has been failing in the current environment, so this
    call is commented out temporarily while we use mock data below.

    To re-enable remote loading, uncomment the lines below.
    */
    // if (invoices && !invoices.length) {
    //   dispatch(onGetInvoices());
    // }
  }, [dispatch, invoices]);

  useEffect(() => {
    setInvoice(invoices);
  }, [invoices]);

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
    const date1 = moment(new Date(date)).format("DD MMM Y");
    return date1;
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
        accessorKey: "name",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <div className="d-flex align-items-center">
            {cell.row.original.img ? (
              <img
                src={process.env.REACT_APP_API_URL + "/images/users/" + cell.row.original.img}
                alt=""
                className="avatar-xs rounded-circle me-2"
              />
            ) : (
              <div className="flex-shrink-0 avatar-xs me-2">
                <div className="avatar-title bg-success-subtle text-success rounded-circle fs-13">
                  {cell.row.original.name ? cell.row.original.name.charAt(0) : "-"}
                </div>
              </div>
            )}
            <span>{cell.getValue()}</span>
          </div>
        ),
      },
      {
        header: t('invoices.col.email', 'Email'),
        accessorKey: "email",
        enableColumnFilter: false,
      },
      {
        header: t('invoices.col.date', 'Date'),
        accessorKey: "start",
        enableColumnFilter: false,
        cell: (cell: any) => <>{handleValidDate(cell.getValue())}</>,
      },
      {
        header: t('invoices.col.time_range', 'Time (start - end)'),
        accessorKey: "start",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const start = cell.getValue();
          const end = cell.row.original.end;
          // Render plain text so it matches the default size of name/email/date
          return <>{handleValidTime(start)} - {handleValidTime(end)}</>;
        },
      },
      {
        header: t('invoices.col.payment', 'Payment'),
        accessorKey: "paymentMethod",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <span className={cell.getValue() === 'cash' ? 'badge bg-success' : 'badge bg-primary'}>
            {cell.getValue() === 'cash' ? t('invoices.cash', 'Cash') : t('invoices.bank', 'Bank')}
          </span>
        ),
      },
      {
        header: t('invoices.col.amount', 'Amount'),
        accessorKey: "amount",
        enableColumnFilter: false,
      },
      {
        header: t('invoices.col.services', 'Service(s)'),
        accessorKey: "services",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <>
            {(cell.getValue() || []).map((s: string, i: number) => {
              const badgeClass = layoutMode === 'dark'
                ? 'badge bg-transparent text-white border border-secondary me-1'
                : 'badge bg-light text-dark me-1';
              return (
                <span
                  key={i}
                  className={badgeClass}
                  style={{ fontSize: '0.95rem', padding: '0.35rem 0.6rem' }}
                >
                  {s}
                </span>
              );
            })}
          </>
        ),
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
                        options={{ mode: "range", dateFormat: "d M, Y", defaultDate: [weekStart, weekEnd] }}
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
            // Helper to parse amounts like "$1,234.56"
            const parseAmount = (amt: any) => {
              if (!amt && amt !== 0) return 0;
              try {
                const s = String(amt).replace(/[^0-9.-]+/g, "");
                const n = parseFloat(s);
                return isNaN(n) ? 0 : n;
              } catch (e) {
                return 0;
              }
            };

            // Compute totals from mockInvoices (raw), then round to 2 decimals for display
            const cashTotalRaw = (mockInvoices || []).reduce((acc, inv) => {
              return acc + (inv.paymentMethod === 'cash' ? parseAmount(inv.amount) : 0);
            }, 0);

            const bankTotalRaw = (mockInvoices || []).reduce((acc, inv) => {
              return acc + (inv.paymentMethod === 'bank' ? parseAmount(inv.amount) : 0);
            }, 0);

            const cashTotal = Math.round((cashTotalRaw + Number.EPSILON) * 100) / 100;
            const bankTotal = Math.round((bankTotalRaw + Number.EPSILON) * 100) / 100;

            // Revenue by service: split invoice amount evenly across services when multiple
            const serviceMap: { [k: string]: number } = {};
            (mockInvoices || []).forEach(inv => {
              const value = parseAmount(inv.amount);
              const services = Array.isArray(inv.services) && inv.services.length ? inv.services : ['Other'];
              const share = services.length ? value / services.length : value;
              services.forEach((s: string) => {
                serviceMap[s] = (serviceMap[s] || 0) + share;
              });
            });

            const serviceLabels = Object.keys(serviceMap);
            const serviceSeries = serviceLabels.map(l => Math.round((serviceMap[l] + Number.EPSILON) * 100) / 100);

            const palette = ["#556ee6", "#34c38f", "#50a5f1", "#f46a6a", "#f7b84b", "#0acf97", "#248af0", "#6c757d"];

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
                          <ReactApexChart
                            dir="ltr"
                            className="apex-charts"
                            options={{
                              chart: { toolbar: { show: false } },
                              labels: ["Cash", "Bank"],
                              dataLabels: { enabled: true, formatter: function (val: any) { return '%' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } },
                              colors: ["#0acf97", "#556ee6"],
                              legend: { position: 'bottom' },
                            }}
                            series={[cashTotal, bankTotal]}
                            type="donut"
                            height={247}
                          />
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Card className="card-animate">
                        <CardHeader className="border-0">
                          <h5 className="card-title mb-0">{t('invoices.revenue_by_service', 'Revenue by Service')}</h5>
                        </CardHeader>
                        <CardBody>
                          <ReactApexChart
                            dir="ltr"
                            className="apex-charts"
                            options={{
                              chart: { toolbar: { show: false } },
                              labels: serviceLabels,
                              dataLabels: { enabled: true, formatter: function (val: any) { return '%' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } },
                              colors: palette.slice(0, Math.max(2, serviceLabels.length)),
                              legend: { position: 'bottom' },
                            }}
                            series={serviceSeries}
                            type="donut"
                            height={247}
                          />
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
                    {useMockInvoices ? (
                      <TableContainer
                        columns={columns}
                        data={mockInvoices}
                        isGlobalFilter={true}
                        customPageSize={10}
                        isInvoiceListFilter={true}
                        theadClass="text-muted text-uppercase"
                            SearchPlaceholder={t('invoices.search_placeholder', 'Search for customer or email')}
                        invoiceDateRange={dateRange}
                        setInvoiceDateRange={setDateRange}
                      />
                    ) : (isInvoiceSuccess && invoices.length ? (
                      <TableContainer
                        columns={columns}
                        data={(invoices || [])}
                        isGlobalFilter={true}
                        customPageSize={10}
                        isInvoiceListFilter={true}
                        theadClass="text-muted text-uppercase"
                        SearchPlaceholder={t('invoices.search_placeholder', 'Search for customer or email')}
                        invoiceDateRange={dateRange}
                        setInvoiceDateRange={setDateRange}
                      />
                    ) : (<Loader error={error} />))
                    }
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