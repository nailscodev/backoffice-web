import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Alert,
  Spinner,
  Row,
  Col
} from 'reactstrap';
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// API imports
import { getStaffList, Staff } from '../../api/staff';
import { createBooking } from '../../api/bookings';

interface CreateBreakModalProps {
  isOpen: boolean;
  toggle: () => void;
  onBreakCreated?: () => void;
  preselectedDate?: Date;
  preselectedTime?: string;
  preselectedStaffId?: string;
}

const CreateBreakModal: React.FC<CreateBreakModalProps> = ({
  isOpen,
  toggle,
  onBreakCreated,
  preselectedDate,
  preselectedTime,
  preselectedStaffId
}) => {
  const { t, i18n } = useTranslation();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string>('');

  // Cargar datos
  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  const loadStaff = async () => {
    try {
      const staffList = await getStaffList();
      setStaff(staffList);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Error loading staff list');
    }
  };

  // Generate time slots (30-minute intervals from 8:00 AM to 8:00 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = moment(timeString, 'HH:mm').format('h:mm A');
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Break types
  const breakTypes = [
    { value: 'lunch', label: t('calendar.break_types.lunch') || 'Lunch Break' },
    { value: 'personal', label: t('calendar.break_types.personal') || 'Personal Break' },
    { value: 'meeting', label: t('calendar.break_types.meeting') || 'Meeting' },
    { value: 'emergency', label: t('calendar.break_types.emergency') || 'Emergency' },
    { value: 'maintenance', label: t('calendar.break_types.maintenance') || 'Maintenance' },
    { value: 'other', label: t('calendar.break_types.other') || 'Other' }
  ];

  // Form validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      type: 'personal',
      staffId: preselectedStaffId || '',
      date: preselectedDate || new Date(),
      startTime: preselectedTime || '12:00',
      endTime: '13:00',
      notes: '',
      title: ''
    },
    validationSchema: Yup.object({
      type: Yup.string().required(t('calendar.validation.break_type_required') || 'Break type is required'),
      staffId: Yup.string().required(t('calendar.validation.staff_required') || 'Staff member is required'),
      date: Yup.date().required(t('calendar.validation.date_required') || 'Date is required'),
      startTime: Yup.string().required(t('calendar.validation.start_time_required') || 'Start time is required'),
      endTime: Yup.string().required(t('calendar.validation.end_time_required') || 'End time is required'),
      title: Yup.string().required(t('calendar.validation.title_required') || 'Title is required')
    }),
    onSubmit: async (values) => {
      await handleCreateBreak(values);
    }
  });

  const handleCreateBreak = async (values: any) => {
    setLoading(true);
    setError('');
    
    try {
      // Find staff name
      const selectedStaff = staff.find(s => s.id === values.staffId);
      if (!selectedStaff) {
        throw new Error('Staff member not found');
      }

      // Parse times
      const [startHour, startMinute] = values.startTime.split(':').map(Number);
      const [endHour, endMinute] = values.endTime.split(':').map(Number);

      // Create start and end dates
      const startDate = new Date(values.date);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date(values.date);
      endDate.setHours(endHour, endMinute, 0, 0);

      // Validate that end time is after start time
      if (endDate <= startDate) {
        setError(t('calendar.validation.end_after_start') || 'End time must be after start time');
        setLoading(false);
        return;
      }

      // Validate that the time is not in the past
      if (startDate < new Date()) {
        setError(t('calendar.validation.past_time_error') || 'Cannot create break in the past');
        setLoading(false);
        return;
      }

      // Calculate duration in minutes
      const duration = moment(endDate).diff(moment(startDate), 'minutes');

      // Create break as a booking without service/customer (backend will identify as break)
      const breakData = {
        // No serviceId or customerId - backend will treat as break
        staffId: values.staffId,
        appointmentDate: moment(values.date).format('YYYY-MM-DD'),
        startTime: values.startTime,
        endTime: values.endTime,
        status: 'in_progress', // Status requirement per user
        totalPrice: 0, // Free to avoid affecting accounts
        notes: `[BREAK] ${values.title || breakTypes.find(bt => bt.value === values.type)?.label || 'Break'}\n\n${values.notes || ''}`.trim(),
        web: false
      };

      await createBooking(breakData);
      
      toast.success(t('calendar.break_created_success') || 'Break created successfully');
      
      if (onBreakCreated) {
        onBreakCreated();
      }
      
      handleClose();
      
    } catch (error: any) {
      console.error('Error creating break:', error);
      setError(error.message || t('calendar.error_creating_break') || 'Error creating break');
      toast.error(error.message || t('calendar.error_creating_break') || 'Error creating break');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    validation.resetForm();
    setError('');
    toggle();
  };

  // Auto-calculate end time when start time changes
  useEffect(() => {
    if (validation.values.startTime) {
      const [startHour, startMinute] = validation.values.startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      // Default to 1 hour break
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60000);
      const endTime = endDateTime.toTimeString().slice(0, 5);
      
      if (endTime !== validation.values.endTime) {
        validation.setFieldValue('endTime', endTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation.values.startTime]);

  // Auto-generate title when break type changes
  useEffect(() => {
    if (validation.values.type && !validation.values.title) {
      const breakTypeLabel = breakTypes.find(bt => bt.value === validation.values.type)?.label || '';
      validation.setFieldValue('title', breakTypeLabel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation.values.type]);

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg" centered>
      <ModalHeader toggle={handleClose}>
        <i className="ri-time-line me-2"></i>
        {t('calendar.create_break') || 'Create Break'}
      </ModalHeader>
      
      <Form onSubmit={validation.handleSubmit}>
        <ModalBody>
          {error && (
            <Alert color="danger">
              <i className="ri-error-warning-line me-2"></i>
              {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="type">{t('calendar.break_type') || 'Break Type'} *</Label>
                <Input
                  type="select"
                  id="type"
                  name="type"
                  value={validation.values.type}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.type && !!validation.errors.type}
                >
                  {breakTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Input>
                {validation.touched.type && validation.errors.type && (
                  <FormFeedback>{validation.errors.type}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="staffId">{t('calendar.staff_member') || 'Staff Member'} *</Label>
                <Input
                  type="select"
                  id="staffId"
                  name="staffId"
                  value={validation.values.staffId}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.staffId && !!validation.errors.staffId}
                  disabled={!!preselectedStaffId}
                >
                  <option value="">{t('calendar.select_staff') || 'Select staff member'}</option>
                  {staff.map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.fullName}
                    </option>
                  ))}
                </Input>
                {validation.touched.staffId && validation.errors.staffId && (
                  <FormFeedback>{validation.errors.staffId}</FormFeedback>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="title">{t('calendar.title') || 'Title'} *</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={validation.values.title}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.title && !!validation.errors.title}
                  placeholder={t('calendar.enter_break_title') || 'Enter break title'}
                />
                {validation.touched.title && validation.errors.title && (
                  <FormFeedback>{validation.errors.title}</FormFeedback>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="date">{t('calendar.date') || 'Date'} *</Label>
                <Flatpickr
                  id="date"
                  className={`form-control ${validation.touched.date && validation.errors.date ? 'is-invalid' : ''}`}
                  placeholder={t('calendar.select_date') || 'Select date'}
                  options={{
                    altInput: true,
                    altFormat: i18n.language === 'es' ? 'd/m/Y' : 'm/d/Y',
                    dateFormat: 'Y-m-d',
                    disable: [
                      function(date: Date) {
                        // Disable past dates
                        return date < new Date(new Date().setHours(0, 0, 0, 0));
                      }
                    ]
                  }}
                  value={validation.values.date}
                  onChange={(date) => validation.setFieldValue('date', date[0])}
                  disabled={!!preselectedDate}
                />
                {validation.touched.date && validation.errors.date && (
                  <div className="invalid-feedback d-block">{String(validation.errors.date)}</div>
                )}
              </FormGroup>
            </Col>

            <Col md={4}>
              <FormGroup>
                <Label for="startTime">{t('calendar.start_time') || 'Start Time'} *</Label>
                <Input
                  type="select"
                  id="startTime"
                  name="startTime"
                  value={validation.values.startTime}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.startTime && !!validation.errors.startTime}
                  disabled={!!preselectedTime}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Input>
                {validation.touched.startTime && validation.errors.startTime && (
                  <FormFeedback>{validation.errors.startTime}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={4}>
              <FormGroup>
                <Label for="endTime">{t('calendar.end_time') || 'End Time'} *</Label>
                <Input
                  type="select"
                  id="endTime"
                  name="endTime"
                  value={validation.values.endTime}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.endTime && !!validation.errors.endTime}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Input>
                {validation.touched.endTime && validation.errors.endTime && (
                  <FormFeedback>{validation.errors.endTime}</FormFeedback>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <FormGroup>
                <Label for="notes">{t('calendar.notes') || 'Notes'}</Label>
                <Input
                  type="textarea"
                  id="notes"
                  name="notes"
                  rows={3}
                  value={validation.values.notes}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  placeholder={t('calendar.enter_notes') || 'Enter additional notes...'}
                />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        
        <ModalFooter>
          <Button color="light" onClick={handleClose} disabled={loading}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button color="warning" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                {t('common.creating') || 'Creating...'}
              </>
            ) : (
              <>
                <i className="ri-time-line me-2"></i>
                {t('calendar.create_break') || 'Create Break'}
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default CreateBreakModal;