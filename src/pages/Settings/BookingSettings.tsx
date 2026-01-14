import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Label,
  Input,
  Alert,
  Spinner,
} from 'reactstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';

const api = new APIClient();

interface BufferTimeConfig {
  bufferTime: number;
  description: string;
}

const BookingSettings: React.FC = () => {
  const [bufferTime, setBufferTime] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración actual
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response: any = await api.get('/api/v1/bookings/config/buffer-time');
        // El interceptor puede devolver response.data o response directamente
        const bufferTimeValue = response?.bufferTime ?? response?.data?.bufferTime ?? 15;
        setBufferTime(bufferTimeValue);
        setError(null);
      } catch (err: any) {
        console.error('Error loading buffer time config:', err);
        setError('Error al cargar la configuración');
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Guardar configuración
  const handleSave = async () => {
    if (bufferTime < 0) {
      toast.error('El buffer time debe ser mayor o igual a 0');
      return;
    }

    try {
      setSaving(true);
      await api.update('/api/v1/bookings/config/buffer-time', { bufferTime });
      toast.success('Configuración guardada exitosamente');
      setError(null);
    } catch (err: any) {
      console.error('Error saving buffer time config:', err);
      setError('Error al guardar la configuración');
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Configuración de Reservas" pageTitle="Configuración" />
          <Row>
            <Col lg={12}>
              <div className="text-center" style={{ padding: '100px 0' }}>
                <Spinner color="primary" />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Configuración de Reservas" pageTitle="Configuración" />

        <Row>
          <Col lg={8}>
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Tiempo de Buffer entre Servicios</h5>
              </CardHeader>
              <CardBody>
                <div className="mb-3">
                  <p className="text-muted">
                    El buffer time es el tiempo de limpieza y preparación entre clientes.
                    Este tiempo se agrega automáticamente al final de cada servicio para evitar
                    que se reserven turnos consecutivos sin tiempo de preparación.
                  </p>
                </div>

                {error && (
                  <Alert color="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <div className="mb-4">
                  <Label htmlFor="bufferTime" className="form-label">
                    Buffer Time Global <span className="text-danger">*</span>
                  </Label>
                  <div className="input-group">
                    <Input
                      type="number"
                      className="form-control"
                      id="bufferTime"
                      value={bufferTime}
                      onChange={(e) => setBufferTime(parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={saving}
                    />
                    <span className="input-group-text">minutos</span>
                  </div>
                  <div className="form-text">
                    Cada servicio puede tener su propio buffer time. Este es el valor por defecto.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    color="primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>

                  <Button
                    color="secondary"
                    outline
                    onClick={() => setBufferTime(15)}
                    disabled={saving}
                  >
                    Restablecer a 15 min
                  </Button>
                </div>

                <Alert color="info" className="mt-4 mb-0">
                  <h6 className="alert-heading">ℹ️ Información Importante:</h6>
                  <ul className="mb-0">
                    <li>Los servicios que ya tienen un buffer time específico no se verán afectados.</li>
                    <li>Solo los servicios sin buffer time configurado usarán este valor global.</li>
                    <li>El buffer se incluye automáticamente en las reservas existentes.</li>
                  </ul>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <ToastContainer closeButton={false} limit={1} />
      </Container>
    </div>
  );
};

export default BookingSettings;
