import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Progress,
  Alert,
  Spinner,
} from "reactstrap";
import ReactApexChart from "react-apexcharts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import {
  startTest,
  getTestResult,
  listTestResults,
  cancelTest,
  TestResult,
  TestType,
  TimeSeriesPoint,
} from "../../api/performanceTests";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TEST_CONFIGS = {
  load: {
    label: "Load Test",
    icon: "ri-speed-up-line",
    color: "#667eea",
    badge: "primary",
    shortDesc: "Validates expected traffic",
    duration: "~50 seconds",
    vuProfile: "0 → 10 VUs → 0",
    goal:
      "Confirms the backend handles the traffic level you normally expect on a busy day without degradation.",
    thresholds: "p95 < 800ms • Error rate < 1%",
    when: "Run before every production deploy",
  },
  stress: {
    label: "Stress Test",
    icon: "ri-fire-line",
    color: "#f7971e",
    badge: "warning",
    shortDesc: "Finds the breaking point",
    duration: "~60 seconds",
    vuProfile: "1 → 5 → 10 → 20 → 30 → 50 VUs",
    goal:
      "Deliberately overloads the system to find where it starts failing, so you know the capacity limit.",
    thresholds: "p95 < 5000ms • Error rate < 20%",
    when: "Run weekly or before scaling decisions",
  },
  spike: {
    label: "Spike Test",
    icon: "ri-bar-chart-grouped-line",
    color: "#f64f59",
    badge: "danger",
    shortDesc: "Simulates a sudden traffic burst",
    duration: "~40 seconds",
    vuProfile: "2 VUs → spike to 50 → back to 2",
    goal:
      "Simulates an instant 25× traffic jump (e.g. viral post, flash sale). Checks if the system survives and recovers.",
    thresholds: "p95 < 3000ms • Error rate < 10%",
    when: "Run before promotions or events",
  },
  soak: {
    label: "Soak Test",
    icon: "ri-time-line",
    color: "#0ba360",
    badge: "success",
    shortDesc: "Detects memory leaks over time",
    duration: "~2 minutes",
    vuProfile: "10 VUs for 2 minutes steady",
    goal:
      "Holds steady load for an extended period. Detects memory leaks, connection pool exhaustion, or latency drift.",
    thresholds: "p95 < 1000ms constantly • Error rate < 1%",
    when: "Run weekly on staging environment",
  },
} as const;

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  running:   { color: "primary", label: "Running" },
  completed: { color: "success", label: "Completed" },
  failed:    { color: "danger",  label: "Failed" },
  cancelled: { color: "secondary", label: "Cancelled" },
};

const apexBaseOptions = {
  chart: { toolbar: { show: false }, animations: { enabled: true, speed: 400 } },
  grid: { borderColor: "#e0e0e0", strokeDashArray: 4 },
  stroke: { width: 2, curve: "smooth" as const },
  xaxis: {
    type: "numeric" as const,
    title: { text: "Elapsed (seconds)", style: { fontSize: "11px", color: "#888" } },
    labels: { formatter: (v: string) => `${v}s` },
  },
  tooltip: { shared: true, intersect: false },
  legend: { position: "top" as const, horizontalAlign: "left" as const },
};

// ─── Component ────────────────────────────────────────────────────────────────

const PerformanceTests: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [runningType, setRunningType] = useState<TestType | null>(null);
  const [loadingType, setLoadingType] = useState<TestType | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback((testId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const result = await getTestResult(testId);
        setSelectedTest(result);
        setHistory((prev) =>
          prev.map((r) => (r.id === testId ? result : r))
        );
        if (result.status !== "running") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setRunningType(null);
        }
      } catch (err) {
        console.error("Poll error:", err);
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setRunningType(null);
      }
    }, 2000);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const results = await listTestResults();
      setHistory(results);
      const running = results.find((r) => r.status === "running");
      if (running) {
        setSelectedTest(running);
        setRunningType(running.type);
        startPolling(running.id);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [startPolling]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleRunTest = async (type: TestType) => {
    if (runningType) {
      toast.warn("A test is already running. Please wait for it to finish or cancel it.");
      return;
    }
    try {
      setLoadingType(type);
      const result = await startTest(type);
      setSelectedTest(result);
      setRunningType(type);
      setHistory((prev) => [result, ...prev].slice(0, 10));
      startPolling(result.id);
      toast.success(`${TEST_CONFIGS[type].label} started!`);
    } catch (err: any) {
      toast.error(`Failed to start test: ${err.message}`);
    } finally {
      setLoadingType(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedTest || selectedTest.status !== "running") return;
    try {
      await cancelTest(selectedTest.id);
      toast.info("Test cancelled");
      if (pollRef.current) clearInterval(pollRef.current);
      setRunningType(null);
      const updated = { ...selectedTest, status: "cancelled" as const };
      setSelectedTest(updated);
      setHistory((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      toast.error(`Failed to cancel: ${err.message}`);
    }
  };

  const handleSelectHistory = async (id: string) => {
    try {
      const result = await getTestResult(id);
      setSelectedTest(result);
    } catch {
      toast.error("Failed to load test result");
    }
  };

  // ─── Chart data builders ────────────────────────────────────────────────────

  const ts: TimeSeriesPoint[] = selectedTest?.timeSeries ?? [];

  const responseTimeChartOptions: ApexCharts.ApexOptions = {
    ...apexBaseOptions,
    chart: { ...apexBaseOptions.chart, id: "response-time" },
    title: {
      text: "Response Time Evolution",
      style: { fontSize: "13px", fontWeight: 600, color: "#333" },
    },
    subtitle: {
      text: "How long requests take at different percentiles — p50 = median, p95 = 95% of requests are faster than this, p99 = worst 1% of requests",
      style: { fontSize: "11px", color: "#888" },
    },
    yaxis: {
      title: { text: "Latency (ms)", style: { fontSize: "11px", color: "#888" } },
      min: 0,
      labels: { formatter: (v: number) => `${Math.round(v)}ms` },
    },
    colors: ["#0ab39c", "#f7b84b", "#f06548"],
    annotations: {
      yaxis: [
        { y: 800,  borderColor: "#f06548", label: { text: "p95 threshold (800ms)", style: { color: "#f06548" } } },
      ],
    },
  };

  const responseTimeSeries = [
    { name: "p50 (median)", data: ts.map((p) => ({ x: p.time, y: p.p50 })) },
    { name: "p95 (95th pct)", data: ts.map((p) => ({ x: p.time, y: p.p95 })) },
    { name: "p99 (99th pct)", data: ts.map((p) => ({ x: p.time, y: p.p99 })) },
  ];

  const throughputChartOptions: ApexCharts.ApexOptions = {
    ...apexBaseOptions,
    chart: { ...apexBaseOptions.chart, id: "throughput", type: "area" },
    title: {
      text: "Requests per Second (Throughput)",
      style: { fontSize: "13px", fontWeight: 600, color: "#333" },
    },
    subtitle: {
      text: "How many requests the backend processes each second — higher is better",
      style: { fontSize: "11px", color: "#888" },
    },
    yaxis: {
      title: { text: "req/s", style: { fontSize: "11px", color: "#888" } },
      min: 0,
      labels: { formatter: (v: number) => `${v} req/s` },
    },
    colors: ["#667eea"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
    stroke: { ...apexBaseOptions.stroke, width: 2 },
  };

  const throughputSeries = [
    { name: "Requests/sec", data: ts.map((p) => ({ x: p.time, y: p.rps })) },
  ];

  const errorRateChartOptions: ApexCharts.ApexOptions = {
    ...apexBaseOptions,
    chart: { ...apexBaseOptions.chart, id: "error-rate", type: "area" },
    title: {
      text: "Error Rate %",
      style: { fontSize: "13px", fontWeight: 600, color: "#333" },
    },
    subtitle: {
      text: "Percentage of requests that returned a 5xx error or timed out — should stay near 0% under normal load",
      style: { fontSize: "11px", color: "#888" },
    },
    yaxis: {
      title: { text: "Error Rate (%)", style: { fontSize: "11px", color: "#888" } },
      min: 0,
      max: Math.max(10, ...ts.map((p) => p.errorRate + 2)),
      labels: { formatter: (v: number) => `${v.toFixed(1)}%` },
    },
    colors: ["#f06548"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    annotations: {
      yaxis: [
        { y: 1, borderColor: "#f7b84b", borderWidth: 1, strokeDashArray: 4,
          label: { text: "1% threshold", style: { color: "#f7b84b", fontSize: "10px" } } },
      ],
    },
  };

  const errorRateSeries = [
    { name: "Error Rate %", data: ts.map((p) => ({ x: p.time, y: p.errorRate })) },
  ];

  const vuChartOptions: ApexCharts.ApexOptions = {
    ...apexBaseOptions,
    chart: { ...apexBaseOptions.chart, id: "vus", type: "area" },
    title: {
      text: "Active Virtual Users (VUs)",
      style: { fontSize: "13px", fontWeight: 600, color: "#333" },
    },
    subtitle: {
      text: "How many simulated concurrent users are sending requests — this shows the load pattern applied to the backend",
      style: { fontSize: "11px", color: "#888" },
    },
    yaxis: {
      title: { text: "Virtual Users", style: { fontSize: "11px", color: "#888" } },
      min: 0,
      labels: { formatter: (v: number) => `${Math.round(v)} VUs` },
    },
    colors: [selectedTest ? TEST_CONFIGS[selectedTest.type]?.color ?? "#0ab39c" : "#0ab39c"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05 } },
  };

  const vuSeries = [
    { name: "Virtual Users", data: ts.map((p) => ({ x: p.time, y: p.vus })) },
  ];

  const isRunning = selectedTest?.status === "running";
  const cfg = selectedTest ? TEST_CONFIGS[selectedTest.type] : null;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Performance Tests" pageTitle="Admin" />

          {/* ── Info alert ──────────────────────────────────────────────── */}
          <Alert color="info" className="mb-3">
            <i className="ri-information-line align-middle me-1"></i>
            <strong>How it works:</strong> Tests run directly from the backend against its own
            endpoints. No k6 installation needed. For production-grade load testing, run the k6
            scripts in <code>backend/tests/stress/</code> separately.
          </Alert>

          {/* ── Test type cards ──────────────────────────────────────────── */}
          <Row>
            {(Object.entries(TEST_CONFIGS) as [TestType, typeof TEST_CONFIGS["load"]][]).map(
              ([type, cfg]) => (
                <Col key={type} xl={3} md={6} className="mb-3">
                  <Card
                    className="h-100 border-0 shadow-sm"
                    style={{ borderTop: `4px solid ${cfg.color}` }}
                  >
                    <CardBody className="d-flex flex-column">
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className="avatar-sm rounded d-flex align-items-center justify-content-center me-2"
                          style={{ background: cfg.color + "20", minWidth: 40 }}
                        >
                          <i className={`${cfg.icon} fs-4`} style={{ color: cfg.color }}></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-semibold">{cfg.label}</h6>
                          <small className="text-muted">{cfg.shortDesc}</small>
                        </div>
                      </div>

                      <p className="text-muted small mb-2 flex-grow-1">{cfg.goal}</p>

                      <div className="small mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">VU profile:</span>
                          <span className="fw-medium">{cfg.vuProfile}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Duration:</span>
                          <span className="fw-medium">{cfg.duration}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Threshold:</span>
                          <span className="fw-medium text-end" style={{ fontSize: "10px" }}>
                            {cfg.thresholds}
                          </span>
                        </div>
                      </div>

                      <div className="text-muted" style={{ fontSize: "10px", marginBottom: 8 }}>
                        <i className="ri-calendar-check-line me-1"></i>
                        {cfg.when}
                      </div>

                      <Button
                        color={type === "stress" ? "warning" : type === "spike" ? "danger" : type === "soak" ? "success" : "primary"}
                        size="sm"
                        block
                        onClick={() => handleRunTest(type)}
                        disabled={!!runningType || loadingType === type}
                        outline={runningType !== null && runningType !== type}
                      >
                        {loadingType === type ? (
                          <><Spinner size="sm" className="me-1" />Starting…</>
                        ) : runningType === type ? (
                          <><i className="ri-loader-4-line align-middle me-1"></i>Running…</>
                        ) : (
                          <><i className="ri-play-fill align-middle me-1"></i>Run {cfg.label}</>
                        )}
                      </Button>
                    </CardBody>
                  </Card>
                </Col>
              )
            )}
          </Row>

          {/* ── Active test status ───────────────────────────────────────── */}
          {selectedTest && (
            <Card className="mb-3 shadow-sm">
              <CardHeader className="d-flex align-items-center justify-content-between py-2">
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`${cfg?.icon} fs-5`}
                    style={{ color: cfg?.color ?? "#667eea" }}
                  ></i>
                  <span className="fw-semibold">
                    {cfg?.label ?? selectedTest.type.toUpperCase()} — {selectedTest.scenario.split('.')[0]}
                  </span>
                  <Badge color={STATUS_BADGE[selectedTest.status]?.color ?? "secondary"}>
                    {isRunning && <Spinner size="sm" className="me-1" />}
                    {STATUS_BADGE[selectedTest.status]?.label ?? selectedTest.status}
                  </Badge>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {isRunning && (
                    <Button size="sm" color="danger" outline onClick={handleCancel}>
                      <i className="ri-stop-fill align-middle me-1"></i>Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardBody className="py-3">
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Progress</small>
                    <small className="fw-medium">{selectedTest.progress}%</small>
                  </div>
                  <Progress
                    value={selectedTest.progress}
                    color={cfg?.badge ?? "primary"}
                    style={{ height: 8, borderRadius: 4 }}
                    animated={isRunning}
                  />
                </div>

                {/* Live stats */}
                {ts.length > 0 && (() => {
                  const last = ts[ts.length - 1];
                  return (
                    <Row className="g-3 text-center">
                      {[
                        { label: "Active VUs", value: `${last.vus}`, icon: "ri-user-line", color: cfg?.color ?? "#667eea" },
                        { label: "Requests/sec", value: `${last.rps}`, icon: "ri-speed-up-line", color: "#0ab39c" },
                        { label: "p50 Latency", value: `${last.p50}ms`, icon: "ri-timer-line", color: "#0ab39c" },
                        { label: "p95 Latency", value: `${last.p95}ms`, icon: "ri-timer-2-line", color: last.p95 > 800 ? "#f06548" : "#f7b84b" },
                        { label: "p99 Latency", value: `${last.p99}ms`, icon: "ri-timer-fill", color: last.p99 > 2000 ? "#f06548" : "#888" },
                        { label: "Error Rate", value: `${last.errorRate}%`, icon: "ri-error-warning-line", color: last.errorRate > 1 ? "#f06548" : "#0ab39c" },
                        { label: "Total Requests", value: `${last.totalRequests}`, icon: "ri-bar-chart-2-line", color: "#667eea" },
                        { label: "Total Errors", value: `${last.totalErrors}`, icon: "ri-close-circle-line", color: last.totalErrors > 0 ? "#f06548" : "#ccc" },
                      ].map(({ label, value, icon, color }) => (
                        <Col key={label} xs={6} sm={3} lg={3}>
                          <div className="border rounded p-2" style={{ background: "#fafafa" }}>
                            <i className={`${icon} d-block fs-5 mb-1`} style={{ color }}></i>
                            <div className="fw-bold" style={{ color }}>{value}</div>
                            <small className="text-muted">{label}</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  );
                })()}
              </CardBody>
            </Card>
          )}

          {/* ── Charts ──────────────────────────────────────────────────── */}
          {ts.length > 0 && (
            <>
              <Row className="mb-3">
                {/* Response Time Chart */}
                <Col xl={8} className="mb-3">
                  <Card className="shadow-sm h-100">
                    <CardBody>
                      <ReactApexChart
                        options={responseTimeChartOptions}
                        series={responseTimeSeries}
                        type="line"
                        height={280}
                      />
                      <div className="mt-2 p-2 rounded" style={{ background: "#f8f9fa", fontSize: "11px", color: "#666" }}>
                        <strong>How to read this:</strong>{" "}
                        <span style={{ color: "#0ab39c" }}>p50</span> = half of all requests are faster than this.{" "}
                        <span style={{ color: "#f7b84b" }}>p95</span> = 95% of requests are faster — this is the key SLA metric.{" "}
                        <span style={{ color: "#f06548" }}>p99</span> = worst 1% of requests — defines the tail latency your slowest users experience.
                        A healthy system keeps p95 flat even as VUs increase.
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Throughput Chart */}
                <Col xl={4} className="mb-3">
                  <Card className="shadow-sm h-100">
                    <CardBody>
                      <ReactApexChart
                        options={throughputChartOptions}
                        series={throughputSeries}
                        type="area"
                        height={280}
                      />
                      <div className="mt-2 p-2 rounded" style={{ background: "#f8f9fa", fontSize: "11px", color: "#666" }}>
                        <strong>How to read this:</strong> Throughput should correlate with VU count during ramp-up.
                        If RPS plateaus while VUs keep rising, the backend is at capacity.
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-3">
                {/* Error Rate Chart */}
                <Col xl={6} className="mb-3">
                  <Card className="shadow-sm h-100">
                    <CardBody>
                      <ReactApexChart
                        options={errorRateChartOptions}
                        series={errorRateSeries}
                        type="area"
                        height={260}
                      />
                      <div className="mt-2 p-2 rounded" style={{ background: "#f8f9fa", fontSize: "11px", color: "#666" }}>
                        <strong>How to read this:</strong> Should stay near 0% during normal operation.
                        Rising errors indicate the backend is overwhelmed — check DB connections and memory.
                        The <span style={{ color: "#f7b84b" }}>1% dashed line</span> is the typical SLA threshold.
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* VU Chart */}
                <Col xl={6} className="mb-3">
                  <Card className="shadow-sm h-100">
                    <CardBody>
                      <ReactApexChart
                        options={vuChartOptions}
                        series={vuSeries}
                        type="area"
                        height={260}
                      />
                      <div className="mt-2 p-2 rounded" style={{ background: "#f8f9fa", fontSize: "11px", color: "#666" }}>
                        <strong>How to read this:</strong> This is the load profile applied to your backend.
                        Compare this chart to the response-time chart — you want latency to stay flat
                        even as VUs increase. A sudden latency jump signals a bottleneck.
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* ── Test Summary ─────────────────────────────────────────────── */}
          {selectedTest?.status === "completed" && selectedTest.summary && (
            <Card className="mb-3 shadow-sm border-0" style={{ borderLeft: `4px solid ${cfg?.color ?? "#0ab39c"}` }}>
              <CardHeader className="py-2 bg-transparent">
                <i className="ri-award-line me-2" style={{ color: cfg?.color }}></i>
                <strong>Test Summary — {cfg?.label}</strong>
              </CardHeader>
              <CardBody>
                <Row className="g-3 text-center">
                  {[
                    { label: "Total Requests",  value: selectedTest.summary.totalRequests.toLocaleString(), icon: "ri-bar-chart-2-line", good: true },
                    { label: "Total Errors",    value: selectedTest.summary.totalErrors.toLocaleString(),   icon: "ri-error-warning-line", good: selectedTest.summary.totalErrors === 0 },
                    { label: "Avg RPS",         value: `${selectedTest.summary.avgRps} req/s`,              icon: "ri-speed-up-line",     good: true },
                    { label: "p50 Latency",     value: `${selectedTest.summary.p50}ms`,                     icon: "ri-timer-line",        good: selectedTest.summary.p50 < 500 },
                    { label: "p95 Latency",     value: `${selectedTest.summary.p95}ms`,                     icon: "ri-timer-2-line",      good: selectedTest.summary.p95 < 800 },
                    { label: "p99 Latency",     value: `${selectedTest.summary.p99}ms`,                     icon: "ri-timer-fill",        good: selectedTest.summary.p99 < 2000 },
                    { label: "Avg Error Rate",  value: `${selectedTest.summary.avgErrorRate}%`,             icon: "ri-percent-line",      good: selectedTest.summary.avgErrorRate < 1 },
                    { label: "Max VUs",         value: `${selectedTest.summary.maxVus}`,                    icon: "ri-user-line",         good: true },
                  ].map(({ label, value, icon, good }) => (
                    <Col key={label} xs={6} sm={4} lg={3}>
                      <div
                        className="border rounded p-3"
                        style={{ background: good ? "#f0fdf4" : "#fff7f7" }}
                      >
                        <i
                          className={`${icon} d-block fs-4 mb-1`}
                          style={{ color: good ? "#0ab39c" : "#f06548" }}
                        ></i>
                        <div className="fw-bold fs-5" style={{ color: good ? "#0ab39c" : "#f06548" }}>
                          {value}
                        </div>
                        <small className="text-muted">{label}</small>
                        <div style={{ fontSize: "10px", marginTop: 2 }}>
                          {good
                            ? <><i className="ri-checkbox-circle-line text-success me-1"></i>Within threshold</>
                            : <><i className="ri-alert-line text-danger me-1"></i>Above threshold</>}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </CardBody>
            </Card>
          )}

          {/* ── History ──────────────────────────────────────────────────── */}
          <Card className="shadow-sm">
            <CardHeader className="py-2 d-flex align-items-center justify-content-between">
              <div>
                <i className="ri-history-line me-2 text-muted"></i>
                <strong>Test History</strong>
                <small className="text-muted ms-2">(last 10 runs)</small>
              </div>
              <Button size="sm" color="secondary" outline onClick={loadHistory}>
                <i className="ri-refresh-line align-middle me-1"></i>Refresh
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {historyLoading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ri-bar-chart-line d-block fs-1 mb-2"></i>
                  No tests run yet. Click one of the buttons above to start your first test.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Type</th>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Duration</th>
                        <th>Requests</th>
                        <th>Errors</th>
                        <th>p95</th>
                        <th>Avg RPS</th>
                        <th className="pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((run) => {
                        const c = TEST_CONFIGS[run.type];
                        const isSelected = selectedTest?.id === run.id;
                        return (
                          <tr
                            key={run.id}
                            style={{
                              background: isSelected ? "#f0f4ff" : undefined,
                              cursor: "pointer",
                            }}
                            onClick={() => handleSelectHistory(run.id)}
                          >
                            <td className="ps-3">
                              <div className="d-flex align-items-center gap-1">
                                <i className={`${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
                                <span className="fw-medium">{c.label}</span>
                              </div>
                            </td>
                            <td>
                              <Badge color={STATUS_BADGE[run.status]?.color ?? "secondary"} pill>
                                {run.status === "running" && <Spinner size="sm" className="me-1" />}
                                {STATUS_BADGE[run.status]?.label ?? run.status}
                              </Badge>
                            </td>
                            <td className="text-muted small">
                              {new Date(run.startedAt).toLocaleTimeString()}
                            </td>
                            <td className="text-muted small">
                              {run.summary
                                ? `${run.summary.duration}s`
                                : run.status === "running"
                                ? <span className="text-primary">Running…</span>
                                : "—"}
                            </td>
                            <td>{run.summary?.totalRequests.toLocaleString() ?? "—"}</td>
                            <td>
                              {run.summary ? (
                                <span style={{ color: run.summary.totalErrors > 0 ? "#f06548" : "#0ab39c" }}>
                                  {run.summary.totalErrors}
                                </span>
                              ) : "—"}
                            </td>
                            <td>
                              {run.summary ? (
                                <span style={{ color: run.summary.p95 > 800 ? "#f06548" : "#0ab39c" }}>
                                  {run.summary.p95}ms
                                </span>
                              ) : "—"}
                            </td>
                            <td>{run.summary?.avgRps ?? "—"}</td>
                            <td className="pe-3">
                              <Button
                                size="sm"
                                color="primary"
                                outline
                                onClick={(e) => { e.stopPropagation(); handleSelectHistory(run.id); }}
                              >
                                <i className="ri-eye-line align-middle me-1"></i>View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── k6 CLI reference ─────────────────────────────────────────── */}
          <Card className="mt-3 shadow-sm">
            <CardHeader className="py-2 bg-transparent">
              <i className="ri-terminal-line me-2 text-muted"></i>
              <strong>Run k6 Scripts from CLI</strong>
              <small className="text-muted ms-2">(for deeper analysis)</small>
            </CardHeader>
            <CardBody>
              <p className="text-muted small mb-3">
                The admin panel runs simplified tests. For production-grade analysis with full k6
                metrics (histograms, trends, Grafana integration), install k6 and run these scripts
                directly:
              </p>
              <Row>
                {(["load", "stress", "spike", "soak"] as TestType[]).map((type) => {
                  const c = TEST_CONFIGS[type];
                  return (
                    <Col key={type} md={6} xl={3} className="mb-2">
                      <div className="border rounded p-2" style={{ borderLeft: `3px solid ${c.color}` }}>
                        <div className="fw-medium small mb-1" style={{ color: c.color }}>
                          <i className={`${c.icon} me-1`}></i>{c.label}
                        </div>
                        <code style={{ fontSize: "11px", background: "#f8f9fa", display: "block", padding: "4px 8px", borderRadius: 4 }}>
                          cd backend/tests/stress<br />
                          k6 run {type}-test.js
                        </code>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <div className="mt-2 text-muted small">
                <i className="ri-information-line me-1"></i>
                Install k6: <code>winget install k6</code> (Windows) •{" "}
                <code>brew install k6</code> (macOS) •{" "}
                <code>snap install k6</code> (Linux)
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
      <ToastContainer position="top-right" autoClose={4000} />
    </React.Fragment>
  );
};

export default PerformanceTests;
