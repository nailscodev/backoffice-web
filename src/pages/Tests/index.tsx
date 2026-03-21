import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Spinner,
} from "reactstrap";
import ReactApexChart from "react-apexcharts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import {
  startTest, getTestResult, listTestResults, cancelTest,
  TestResult, TestType, TimeSeriesPoint,
} from "../../api/performanceTests";

// ─── Palette ───────────────────────────────────────────────────────────────
const D_BG      = "#0d1117";
const D_SURFACE = "#161b22";
const D_BORDER  = "#30363d";
const D_GRID    = "#21262d";
const D_TEXT    = "#c9d1d9";
const D_SUB     = "#8b949e";
const GREEN     = "#3fb950";
const RED       = "#f85149";
const AMBER     = "#f0ab00";
const BLUE      = "#58a6ff";

// ─── Test definitions ──────────────────────────────────────────────────────
const TEST_CONFIGS = {
  load: {
    label: "Load Test",
    icon: "ri-speed-up-line",
    color: "#667eea",
    badge: "primary",
    shortDesc: "Valida el tráfico esperado",
    duration: "~50 seg",
    vuProfile: "0 → 10 VUs → 0",
    goal: "Confirma que el backend maneja el nivel de tráfico que normalmente esperás en un día de trabajo sin degradación.",
    thresholds: "p95 < 800ms  •  Error < 1%",
    when: "Antes de cada deploy a producción",
    p95Threshold: 800,
    errThreshold: 1,
  },
  stress: {
    label: "Stress Test",
    icon: "ri-fire-line",
    color: "#f7971e",
    badge: "warning",
    shortDesc: "Encuentra el punto de quiebre",
    duration: "~60 seg",
    vuProfile: "1 → 5 → 10 → 20 → 30 → 50 VUs",
    goal: "Sobrecarga deliberadamente el sistema para encontrar dónde empieza a fallar y conocer el límite de capacidad.",
    thresholds: "p95 < 5000ms  •  Error < 20%",
    when: "Semanalmente o antes de escalar",
    p95Threshold: 5000,
    errThreshold: 20,
  },
  spike: {
    label: "Spike Test",
    icon: "ri-bar-chart-grouped-line",
    color: "#f64f59",
    badge: "danger",
    shortDesc: "Simula un pico repentino de tráfico",
    duration: "~40 seg",
    vuProfile: "2 VUs → pico a 20 → vuelta a 2",
    goal: "Simula un salto de tráfico 25× (ej. post viral, flash sale). Verifica si el sistema sobrevive y se recupera.",
    thresholds: "p95 < 3000ms  •  Error < 10%",
    when: "Antes de promociones o eventos",
    p95Threshold: 3000,
    errThreshold: 10,
  },
  soak: {
    label: "Soak Test",
    icon: "ri-time-line",
    color: "#0ba360",
    badge: "success",
    shortDesc: "Detecta memory leaks en el tiempo",
    duration: "~2 min",
    vuProfile: "10 VUs steadily por 2 minutos",
    goal: "Mantiene carga estable por un período extendido. Detecta memory leaks, agotamiento de connection pool o latency drift.",
    thresholds: "p95 < 1000ms constante  •  Error < 1%",
    when: "Semanalmente en staging",
    p95Threshold: 1000,
    errThreshold: 1,
  },
} as const;

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  running:   { color: "primary",   label: "Running" },
  completed: { color: "success",   label: "Completed" },
  failed:    { color: "danger",    label: "Failed" },
  cancelled: { color: "secondary", label: "Cancelled" },
};

// ─── Chart option builders ─────────────────────────────────────────────────
function buildRtOptions(
  ts: TimeSeriesPoint[],
  p95Threshold: number,
): ApexCharts.ApexOptions {
  const last    = ts[ts.length - 1];
  const p95Good = !last || last.p95 <= p95Threshold;
  const p95Line = p95Good ? GREEN : RED;

  return {
    chart: {
      background: "transparent",
      foreColor: D_SUB,
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 350,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    grid: { borderColor: D_GRID, strokeDashArray: 3 },
    stroke: { width: [2.5, 1.5], curve: "smooth" },
    colors: [p95Line, BLUE + "99"],
    xaxis: {
      type: "numeric",
      title: { text: "Tiempo transcurrido (s)", style: { color: D_SUB, fontSize: "11px" } },
      labels: { style: { colors: [D_SUB] }, formatter: (v: string) => `${v}s` },
      axisBorder: { color: D_BORDER },
      axisTicks: { color: D_BORDER },
    },
    yaxis: {
      title: { text: "Latencia (ms)", style: { color: D_SUB, fontSize: "11px" } },
      labels: { style: { colors: [D_SUB] }, formatter: (v: number) => `${Math.round(v)}ms` },
      min: 0,
    },
    annotations: {
      yaxis: [
        {
          y: p95Threshold,
          borderColor: RED,
          borderWidth: 1,
          strokeDashArray: 5,
          label: {
            text: `Umbral p95: ${p95Threshold}ms`,
            style: { color: RED, background: "transparent", fontSize: "10px" },
          },
        },
      ],
    },
    tooltip: { theme: "dark", shared: true, intersect: false },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: [p95Line, BLUE] },
    },
    title: {
      text: "Tiempo de Respuesta (p95 vs p50)",
      style: { fontSize: "13px", fontWeight: "600", color: D_TEXT },
    },
  };
}

function buildErrVuOptions(
  ts: TimeSeriesPoint[],
  errThreshold: number,
): ApexCharts.ApexOptions {
  const last    = ts[ts.length - 1];
  const errGood = !last || last.errorRate <= errThreshold;
  const errLine = errGood ? GREEN : RED;

  return {
    chart: {
      background: "transparent",
      foreColor: D_SUB,
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 350,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    grid: { borderColor: D_GRID, strokeDashArray: 3 },
    stroke: { width: [2.5, 1.5], curve: "smooth" },
    colors: [errLine, BLUE + "aa"],
    xaxis: {
      type: "numeric",
      title: { text: "Tiempo transcurrido (s)", style: { color: D_SUB, fontSize: "11px" } },
      labels: { style: { colors: [D_SUB] }, formatter: (v: string) => `${v}s` },
      axisBorder: { color: D_BORDER },
      axisTicks: { color: D_BORDER },
    },
    yaxis: [
      {
        title: { text: "Error Rate (%)", style: { color: D_SUB, fontSize: "11px" } },
        labels: { style: { colors: [D_SUB] }, formatter: (v: number) => `${v.toFixed(1)}%` },
        min: 0,
      },
      {
        opposite: true,
        title: { text: "Virtual Users", style: { color: BLUE, fontSize: "11px" } },
        labels: { style: { colors: [BLUE] }, formatter: (v: number) => `${Math.round(v)} VU` },
        min: 0,
      },
    ],
    annotations: {
      yaxis: [
        {
          y: errThreshold,
          borderColor: AMBER,
          borderWidth: 1,
          strokeDashArray: 5,
          label: {
            text: `Umbral: ${errThreshold}%`,
            style: { color: AMBER, background: "transparent", fontSize: "10px" },
          },
        },
      ],
    },
    tooltip: { theme: "dark", shared: true, intersect: false },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: [errLine, BLUE] },
    },
    title: {
      text: "Error Rate & VUs Activos",
      style: { fontSize: "13px", fontWeight: "600", color: D_TEXT },
    },
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────
interface KpiTileProps {
  label: string;
  value: string;
  icon: string;
  good: boolean;
  desc?: string;
}
const KpiTile: React.FC<KpiTileProps> = ({ label, value, icon, good, desc }) => (
  <div style={{
    background: good ? "#0f2a1a" : "#2a0f0f",
    border: `1px solid ${good ? "#238636" : "#da3633"}`,
    borderRadius: 8, padding: "12px 10px", textAlign: "center",
  }}>
    <i className={`${icon} d-block fs-3 mb-1`} style={{ color: good ? GREEN : RED }} />
    <div style={{ color: good ? GREEN : RED, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ color: D_TEXT, fontSize: 11, marginTop: 2 }}>{label}</div>
    {desc && (
      <div style={{ color: D_SUB, fontSize: 10, lineHeight: 1.3, marginTop: 3 }}>{desc}</div>
    )}
    <div style={{ marginTop: 4, fontSize: 10, color: good ? GREEN : RED }}>
      {good ? "✓ Dentro del umbral" : "✗ Umbral excedido"}
    </div>
  </div>
);

const DarkNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    background: D_SURFACE, border: `1px solid ${D_BORDER}`, borderRadius: 6,
    padding: "8px 12px", marginTop: 8, fontSize: 11, color: D_SUB, lineHeight: 1.6,
  }}>
    {children}
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────
const PerformanceTests: React.FC = () => {
  const [selectedTest, setSelectedTest]     = useState<TestResult | null>(null);
  const [history, setHistory]               = useState<TestResult[]>([]);
  const [runningType, setRunningType]       = useState<TestType | null>(null);
  const [loadingType, setLoadingType]       = useState<TestType | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // ── Polling ─────────────────────────────────────────────────────────────
  const startPolling = useCallback((testId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const result = await getTestResult(testId);
        setSelectedTest(result);
        setHistory((prev) => prev.map((r) => (r.id === testId ? result : r)));
        if (result.status !== "running") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setRunningType(null);
        }
      } catch (err: any) {
        console.error("Poll error:", err);
        // If the test no longer exists on the server (backend restarted / 404), stop polling
        if (err?.response?.status === 404) {
          setSelectedTest((prev) => prev ? { ...prev, status: "failed" as const } : prev);
          setHistory((prev) => prev.map((r) => (r.id === testId ? { ...r, status: "failed" as const } : r)));
        }
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

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRunTest = async (type: TestType) => {
    if (runningType) {
      toast.warn("Ya hay un test corriendo. Esperá a que termine o cancelalo.");
      return;
    }
    try {
      setLoadingType(type);
      const result = await startTest(type);
      setSelectedTest(result);
      setRunningType(type);
      setHistory((prev) => [result, ...prev].slice(0, 10));
      startPolling(result.id);
      toast.success(`${TEST_CONFIGS[type].label} iniciado!`);
      setTimeout(() => liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err: any) {
      toast.error(`Error al iniciar test: ${err.message}`);
    } finally {
      setLoadingType(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedTest || selectedTest.status !== "running") return;
    try {
      await cancelTest(selectedTest.id);
    } catch (err: any) {
      // 404 means the backend restarted and lost this run from memory —
      // the test is definitively gone, so treat it as cancelled from the UI's perspective.
      // Any other error (network, 5xx) is a real failure worth surfacing.
      if (err?.response?.status !== 404) {
        toast.error(`Error al cancelar: ${err.message}`);
        return;
      }
    }
    // Reached here on success (200) OR on 404 (backend lost the run) — either way stop.
    toast.info("Test cancelado");
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setRunningType(null);
    const updated = { ...selectedTest, status: "cancelled" as const };
    setSelectedTest(updated);
    setHistory((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSelectHistory = async (id: string) => {
    try {
      const result = await getTestResult(id);
      setSelectedTest(result);
      setTimeout(() => liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      // If the backend no longer has this run (restarted), fall back to local history data.
      if (err?.response?.status === 404) {
        const local = history.find((r) => r.id === id);
        if (local) {
          setSelectedTest(local);
          setTimeout(() => liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          return;
        }
      }
      toast.error("No se pudo cargar el resultado");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const ts        = (selectedTest?.timeSeries ?? []) as TimeSeriesPoint[];
  const cfg       = selectedTest ? TEST_CONFIGS[selectedTest.type] : null;
  const p95T      = cfg?.p95Threshold ?? 800;
  const errT      = cfg?.errThreshold ?? 1;
  const last      = ts[ts.length - 1];
  const isRunning = selectedTest?.status === "running";
  const isDone    = selectedTest?.status === "completed";

  const rtSeries = [
    { name: "p95 Latencia", data: ts.map((p) => ({ x: p.time, y: p.p95 })) },
    { name: "p50 Mediana",  data: ts.map((p) => ({ x: p.time, y: p.p50 })) },
  ];
  const errVuSeries = [
    { name: "Error Rate %",  data: ts.map((p) => ({ x: p.time, y: p.errorRate })) },
    { name: "Virtual Users", data: ts.map((p) => ({ x: p.time, y: p.vus })) },
  ];

  const rtOpts    = buildRtOptions(ts, p95T);
  const errVuOpts = buildErrVuOptions(ts, errT);

  const kpiTiles = last ? [
    { label: "VUs Activos",   value: `${last.vus}`,          good: true,                       icon: "ri-user-line",        desc: "Usuarios concurrentes simulados ahora mismo" },
    { label: "Req/seg",       value: `${last.rps}`,          good: true,                       icon: "ri-speed-up-line",    desc: "Throughput instantáneo del backend" },
    { label: "p50 Latencia",  value: `${last.p50}ms`,        good: last.p50 < p95T * 0.6,     icon: "ri-timer-line",       desc: "La mitad de los requests son más rápidos que este valor" },
    { label: "p95 Latencia",  value: `${last.p95}ms`,        good: last.p95 <= p95T,          icon: "ri-timer-2-line",     desc: `SLA crítico: debe ser < ${p95T}ms` },
    { label: "Error Rate",    value: `${last.errorRate}%`,   good: last.errorRate <= errT,    icon: "ri-alert-line",       desc: `Debe ser < ${errT}%. Si sube, el backend está saturado` },
    { label: "Total Requests",value: `${last.totalRequests}`,good: true,                       icon: "ri-bar-chart-2-line", desc: "Total de requests enviados hasta ahora" },
  ] : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Performance Tests" pageTitle="Settings" />

          {/* ── Test type cards ──────────────────────────────────────────── */}
          <Row className="mb-4">
            {(Object.entries(TEST_CONFIGS) as [TestType, typeof TEST_CONFIGS["load"]][]).map(
              ([type, c]) => {
                const isActive  = runningType === type;
                const isLoading = loadingType === type;
                const isLocked  = !!runningType && !isActive;

                return (
                  <Col key={type} xl={3} md={6} className="mb-3">
                    <Card
                      className="h-100 shadow-sm"
                      style={{
                        borderTop: `4px solid ${c.color}`,
                        borderRadius: 10,
                        opacity: isLocked ? 0.55 : 1,
                        transition: "opacity 0.25s",
                      }}
                    >
                      <CardBody className="d-flex flex-column p-3">
                        {/* Title row */}
                        <div className="d-flex align-items-center mb-3">
                          <div style={{
                            background: c.color + "25", width: 42, height: 42,
                            borderRadius: 10, display: "flex", alignItems: "center",
                            justifyContent: "center", marginRight: 12, flexShrink: 0,
                          }}>
                            <i className={`${c.icon} fs-4`} style={{ color: c.color }} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{c.label}</h6>
                            <small className="text-muted">{c.shortDesc}</small>
                          </div>
                        </div>

                        {/* Goal */}
                        <p className="text-muted flex-grow-1" style={{ fontSize: 12, lineHeight: 1.5 }}>
                          {c.goal}
                        </p>

                        {/* Stats */}
                        <div className="rounded p-2 mb-3" style={{ background: "#f8f9fa", fontSize: 11 }}>
                          {([
                            ["VU Profile",  c.vuProfile],
                            ["Duración",    c.duration],
                            ["Umbrales",    c.thresholds],
                            ["Cuándo",      c.when],
                          ] as [string, string][]).map(([k, v]) => (
                            <div key={k} className="d-flex justify-content-between mb-1">
                              <span className="text-muted">{k}:</span>
                              <span className="fw-semibold text-end ms-2" style={{ maxWidth: "60%", fontSize: 10 }}>{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* Run button */}
                        <Button
                          color={type === "stress" ? "warning" : type === "spike" ? "danger" : type === "soak" ? "success" : "primary"}
                          className="w-100 fw-bold"
                          style={{ borderRadius: 8, fontSize: 13 }}
                          onClick={() => handleRunTest(type)}
                          disabled={isLocked || isLoading}
                          outline={isLocked}
                        >
                          {isLoading ? (
                            <><Spinner size="sm" className="me-2" />Iniciando…</>
                          ) : isActive ? (
                            <><i className="ri-loader-4-line align-middle me-2" />Corriendo…</>
                          ) : (
                            <><i className="ri-play-fill align-middle me-2" />Ejecutar {c.label}</>
                          )}
                        </Button>
                      </CardBody>
                    </Card>
                  </Col>
                );
              }
            )}
          </Row>

          {/* ── LIVE / RESULT dark panel ─────────────────────────────────── */}
          <div ref={liveRef} />

          {selectedTest && (
            <div
              style={{
                background: D_BG,
                border: `1px solid ${D_BORDER}`,
                borderRadius: 14,
                padding: 28,
                marginBottom: 28,
              }}
            >
              {/* Panel header */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <i className={`${cfg?.icon} fs-4`} style={{ color: cfg?.color }} />
                  <span style={{ color: D_TEXT, fontWeight: 700, fontSize: 17 }}>{cfg?.label}</span>

                  {isRunning ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "#1a3a5c", color: BLUE, borderRadius: 6,
                      padding: "3px 10px", fontSize: 11, fontWeight: 700,
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", background: BLUE,
                        display: "inline-block", animation: "testblink 1s steps(1) infinite",
                      }} />
                      LIVE
                    </span>
                  ) : (
                    <Badge color={STATUS_CFG[selectedTest.status]?.color ?? "secondary"} pill>
                      {STATUS_CFG[selectedTest.status]?.label}
                    </Badge>
                  )}

                  <span style={{ color: D_SUB, fontSize: 12 }}>
                    {selectedTest.scenario?.split(".")?.[0] ?? ""}
                  </span>
                </div>

                {isRunning && (
                  <Button
                    style={{
                      background: "#21262d", border: `1px solid ${D_BORDER}`,
                      color: RED, borderRadius: 8, fontSize: 13,
                    }}
                    onClick={handleCancel}
                  >
                    <i className="ri-stop-fill align-middle me-1" />Cancelar
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              {isRunning && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <small style={{ color: D_SUB }}>Progreso del test</small>
                    <small style={{ color: D_TEXT, fontWeight: 700 }}>{selectedTest.progress}%</small>
                  </div>
                  <div style={{ background: "#21262d", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{
                      background: `linear-gradient(90deg, ${cfg?.color ?? GREEN}, ${GREEN})`,
                      height: "100%", width: `${selectedTest.progress}%`,
                      transition: "width 0.5s ease", borderRadius: 6,
                    }} />
                  </div>
                  <small style={{ color: D_SUB, fontSize: 10, marginTop: 4, display: "block" }}>
                    Se actualiza automáticamente cada 2 segundos mientras el test corre
                  </small>
                </div>
              )}

              {/* Target endpoints */}
              {selectedTest.targetEndpoints?.length > 0 && (
                <div className="mb-3 p-2 rounded" style={{ background: "#161b22", border: `1px solid ${D_BORDER}` }}>
                  <small style={{ color: D_SUB, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Endpoints targetados
                  </small>
                  {selectedTest.targetEndpoints.map((url, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#58a6ff", fontFamily: "monospace", lineHeight: 1.6, wordBreak: "break-all" }}>{url}</div>
                  ))}
                </div>
              )}

              {/* Disclaimer: panel vs CI metrics */}
              <div className="mb-3 p-2 rounded d-flex align-items-start gap-2"
                style={{ background: "#1c2a18", border: "1px solid #3fb950", fontSize: 11, color: "#8b949e" }}>
                <i className="ri-information-line" style={{ color: "#3fb950", fontSize: 14, flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong style={{ color: "#3fb950" }}>Resultados intra-datacenter:</strong> este panel genera tráfico desde el propio backend en Fly.io (latencia ~5–20 ms).
                  Los tests <strong>k6 en CI/CD</strong> miden latencia real desde red pública y son la fuente autoritativa para umbrales de producción.
                </span>
              </div>

              {/* KPI tiles */}
              {kpiTiles.length > 0 && (
                <Row className="g-2 mb-4">
                  {kpiTiles.map(({ label, value, icon, good, desc }) => (
                    <Col key={label} xs={6} sm={4} md={2}>
                      <KpiTile label={label} value={value} icon={icon} good={good} desc={desc} />
                    </Col>
                  ))}
                </Row>
              )}

              {/* Charts */}
              {ts.length > 0 && (
                <Row className="g-3 mb-2">
                  {/* Response time chart */}
                  <Col xl={7}>
                    <div style={{
                      background: D_SURFACE, border: `1px solid ${D_BORDER}`,
                      borderRadius: 10, padding: "16px 16px 12px",
                    }}>
                      <ReactApexChart
                        options={rtOpts}
                        series={rtSeries}
                        type="line"
                        height={260}
                      />
                      <DarkNote>
                        <strong style={{ color: D_TEXT }}>Cómo leer este gráfico: </strong>
                        <span style={{ color: last && last.p95 <= p95T ? GREEN : RED }}>p95</span>{" "}
                        = el 95% de los requests fueron más rápidos que este valor — es el{" "}
                        <strong style={{ color: D_TEXT }}>SLA crítico</strong>. Si cruza la línea
                        roja punteada, el test falló.{" "}
                        <span style={{ color: BLUE }}>p50</span> = mediana.
                        Si p95 sube pero p50 se mantiene, hay <em>tail latency</em> (requests lentos puntuales).
                        Si ambos suben juntos, el backend está saturado.
                      </DarkNote>
                    </div>
                  </Col>

                  {/* Error rate + VU chart */}
                  <Col xl={5}>
                    <div style={{
                      background: D_SURFACE, border: `1px solid ${D_BORDER}`,
                      borderRadius: 10, padding: "16px 16px 12px",
                    }}>
                      <ReactApexChart
                        options={errVuOpts}
                        series={errVuSeries}
                        type="line"
                        height={260}
                      />
                      <DarkNote>
                        <strong style={{ color: D_TEXT }}>Cómo leer este gráfico: </strong>
                        La{" "}
                        <span style={{ color: last && last.errorRate <= errT ? GREEN : RED }}>
                          tasa de error
                        </span>{" "}
                        debe mantenerse cerca de 0%. Comparala con los{" "}
                        <span style={{ color: BLUE }}>VUs activos</span> (eje derecho):
                        si los errores suben al crecer los VUs, encontraste el punto de quiebre.
                        La línea <span style={{ color: AMBER }}>amarilla</span> es el umbral permitido.
                      </DarkNote>
                    </div>
                  </Col>
                </Row>
              )}

              {/* ── Summary (only on completion) ─────────────────────────── */}
              {isDone && selectedTest.summary && (
                <div style={{ borderTop: `1px solid ${D_BORDER}`, marginTop: 28, paddingTop: 28 }}>
                  {/* Pass / Fail hero */}
                  {(() => {
                    const s  = selectedTest.summary;
                    const ok = s.p95 <= p95T && s.avgErrorRate <= errT;
                    return (
                      <div style={{
                        background: ok ? "#0d2818" : "#2a0e0e",
                        border: `2px solid ${ok ? "#238636" : "#da3633"}`,
                        borderRadius: 12, padding: "18px 22px", marginBottom: 24,
                        display: "flex", alignItems: "center", gap: 16,
                      }}>
                        <i
                          className={ok ? "ri-checkbox-circle-fill" : "ri-close-circle-fill"}
                          style={{ fontSize: 44, color: ok ? GREEN : RED, flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ color: ok ? GREEN : RED, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
                            {ok
                              ? "✓  Test Pasó — Todos los umbrales cumplidos"
                              : "✗  Test Falló — Uno o más umbrales excedidos"}
                          </div>
                          <div style={{ color: D_SUB, fontSize: 13 }}>
                            p95 ={" "}
                            <span style={{ color: s.p95 <= p95T ? GREEN : RED, fontWeight: 600 }}>
                              {s.p95}ms
                            </span>{" "}
                            (umbral {p95T}ms){"  •  "}
                            Error rate ={" "}
                            <span style={{ color: s.avgErrorRate <= errT ? GREEN : RED, fontWeight: 600 }}>
                              {s.avgErrorRate}%
                            </span>{" "}
                            (umbral {errT}%){"  •  "}
                            {s.totalRequests.toLocaleString()} requests en {s.duration}s
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary KPI grid */}
                  <Row className="g-2">
                    {[
                      {
                        label: "Total Requests",
                        value: selectedTest.summary.totalRequests.toLocaleString(),
                        icon: "ri-bar-chart-2-line",
                        good: true,
                        desc: "Total de requests HTTP enviados durante el test",
                      },
                      {
                        label: "Total Errores",
                        value: `${selectedTest.summary.totalErrors}`,
                        icon: "ri-error-warning-line",
                        good: selectedTest.summary.totalErrors === 0,
                        desc: "Requests que fallaron (5xx errors o timeouts). Idealmente 0",
                      },
                      {
                        label: "Avg RPS",
                        value: `${selectedTest.summary.avgRps} req/s`,
                        icon: "ri-speed-up-line",
                        good: true,
                        desc: "Throughput promedio durante toda la duración del test",
                      },
                      {
                        label: "p50 Latencia",
                        value: `${selectedTest.summary.p50}ms`,
                        icon: "ri-timer-line",
                        good: selectedTest.summary.p50 < p95T * 0.5,
                        desc: "Mediana — la mitad de los usuarios experimentaron menos de esta latencia",
                      },
                      {
                        label: "p95 Latencia",
                        value: `${selectedTest.summary.p95}ms`,
                        icon: "ri-timer-2-line",
                        good: selectedTest.summary.p95 <= p95T,
                        desc: `SLA crítico — debe ser < ${p95T}ms para que el test pase`,
                      },
                      {
                        label: "p99 Latencia",
                        value: `${selectedTest.summary.p99}ms`,
                        icon: "ri-timer-fill",
                        good: selectedTest.summary.p99 < p95T * 2.5,
                        desc: "Tail latency — lo que experimentan el 1% más lento de los usuarios",
                      },
                      {
                        label: "Avg Error Rate",
                        value: `${selectedTest.summary.avgErrorRate}%`,
                        icon: "ri-percent-line",
                        good: selectedTest.summary.avgErrorRate <= errT,
                        desc: `Promedio total de errores. Debe ser < ${errT}%`,
                      },
                      {
                        label: "Máx VUs",
                        value: `${selectedTest.summary.maxVus}`,
                        icon: "ri-user-line",
                        good: true,
                        desc: "Pico de usuarios concurrentes simulados durante el test",
                      },
                    ].map(({ label, value, icon, good, desc }) => (
                      <Col key={label} xs={6} sm={4} md={3}>
                        <KpiTile label={label} value={value} icon={icon} good={good} desc={desc} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          )}

          {/* ── Test History ─────────────────────────────────────────────── */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="py-2 d-flex align-items-center justify-content-between">
              <div>
                <i className="ri-history-line me-2 text-muted" />
                <strong>Historial de Tests</strong>
                <small className="text-muted ms-2">(últimos 10 runs)</small>
              </div>
              <Button size="sm" color="secondary" outline onClick={loadHistory}>
                <i className="ri-refresh-line align-middle me-1" />Actualizar
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {historyLoading ? (
                <div className="text-center py-4"><Spinner color="primary" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ri-bar-chart-line d-block fs-1 mb-2" />
                  Todavía no se corrió ningún test. Hacé clic en uno de los botones de arriba.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Tipo</th>
                        <th>Estado</th>
                        <th>Inicio</th>
                        <th>Duración</th>
                        <th>Requests</th>
                        <th>Errores</th>
                        <th>p95</th>
                        <th>RPS</th>
                        <th className="pe-3">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((run) => {
                        const c          = TEST_CONFIGS[run.type];
                        const isSelected = selectedTest?.id === run.id;
                        const rP95T      = c.p95Threshold;
                        const rErrT      = c.errThreshold;
                        const passed     = run.summary
                          ? run.summary.p95 <= rP95T && run.summary.avgErrorRate <= rErrT
                          : null;

                        return (
                          <tr
                            key={run.id}
                            style={{ background: isSelected ? "#f0f4ff" : undefined, cursor: "pointer" }}
                            onClick={() => handleSelectHistory(run.id)}
                          >
                            <td className="ps-3">
                              <div className="d-flex align-items-center gap-1">
                                <i className={c.icon} style={{ color: c.color, fontSize: 16 }} />
                                <span className="fw-medium">{c.label}</span>
                              </div>
                            </td>
                            <td>
                              <Badge color={STATUS_CFG[run.status]?.color ?? "secondary"} pill>
                                {run.status === "running" && <Spinner size="sm" className="me-1" />}
                                {STATUS_CFG[run.status]?.label ?? run.status}
                              </Badge>
                            </td>
                            <td className="text-muted" style={{ fontSize: 12 }}>
                              {new Date(run.startedAt).toLocaleTimeString()}
                            </td>
                            <td className="text-muted" style={{ fontSize: 12 }}>
                              {run.summary
                                ? `${run.summary.duration}s`
                                : run.status === "running"
                                ? <span className="text-primary">Corriendo…</span>
                                : "—"}
                            </td>
                            <td>{run.summary?.totalRequests.toLocaleString() ?? "—"}</td>
                            <td>
                              {run.summary ? (
                                <span style={{ color: run.summary.totalErrors > 0 ? RED : GREEN, fontWeight: 600 }}>
                                  {run.summary.totalErrors}
                                </span>
                              ) : "—"}
                            </td>
                            <td>
                              {run.summary ? (
                                <span style={{ color: run.summary.p95 > rP95T ? RED : GREEN, fontWeight: 600 }}>
                                  {run.summary.p95}ms
                                </span>
                              ) : "—"}
                            </td>
                            <td>{run.summary?.avgRps ?? "—"}</td>
                            <td className="pe-3">
                              {run.status === "completed" && passed !== null ? (
                                <Badge
                                  style={{
                                    background: passed ? "#0f2a1a" : "#2a0f0f",
                                    color: passed ? GREEN : RED,
                                    border: `1px solid ${passed ? GREEN : RED}`,
                                    fontSize: 11,
                                  }}
                                >
                                  {passed ? "✓ PASÓ" : "✗ FALLÓ"}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm" color="primary" outline
                                  onClick={(e) => { e.stopPropagation(); handleSelectHistory(run.id); }}
                                >
                                  <i className="ri-eye-line align-middle me-1" />Ver
                                </Button>
                              )}
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
          <Card className="shadow-sm">
            <CardHeader className="py-2 bg-transparent">
              <i className="ri-terminal-line me-2 text-muted" />
              <strong>Ejecutar scripts k6 desde la CLI</strong>
              <small className="text-muted ms-2">(para análisis más profundo)</small>
            </CardHeader>
            <CardBody>
              <p className="text-muted small mb-3">
                El panel admin corre tests simplificados. Para análisis con métricas completas
                (histogramas, trends, integración Grafana), instalá k6 y corré los scripts directamente:
              </p>
              <Row>
                {(["load", "stress", "spike", "soak"] as TestType[]).map((type) => {
                  const c = TEST_CONFIGS[type];
                  return (
                    <Col key={type} md={6} xl={3} className="mb-2">
                      <div className="border rounded p-2" style={{ borderLeft: `3px solid ${c.color}` }}>
                        <div className="fw-medium small mb-1" style={{ color: c.color }}>
                          <i className={`${c.icon} me-1`} />{c.label}
                        </div>
                        <code style={{ fontSize: 11, background: "#f8f9fa", display: "block", padding: "4px 8px", borderRadius: 4 }}>
                          cd backend/tests/stress<br />
                          k6 run {type}-test.js
                        </code>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <div className="mt-3 text-muted small">
                <i className="ri-information-line me-1" />
                Instalar k6:{" "}
                <code>winget install k6</code> (Windows) •{" "}
                <code>brew install k6</code> (macOS) •{" "}
                <code>snap install k6</code> (Linux)
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* Blink animation for LIVE dot */}
      <style>{`
        @keyframes testblink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={4000} />
    </React.Fragment>
  );
};

export default PerformanceTests;
