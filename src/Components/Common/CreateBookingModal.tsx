import React, { useState, useEffect, useMemo } from 'react';
import './calendarChips.css';
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
  Col,
  Badge,
  Card,
  CardBody,
  CardHeader,
} from 'reactstrap';
import Select from 'react-select';
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// API imports
import { getCustomers, createCustomer, Customer } from '../../api/customers';
import { getServices, Service, getIncompatibleCategories, getRemovalAddonsByServices } from '../../api/services';
import { getAddOns, AddOn, getIncompatibleAddOns } from '../../api/addons';
import { getStaffList, Staff } from '../../api/staff';
import { createBooking, getBookingsList, getBackofficeAvailability } from '../../api/bookings';
import { getCategories, Category } from '../../api/categories';
import { APIClient } from '../../helpers/api_helper';
import config from '../../config';

// Category IDs constants
const MANICURE_CATEGORY_ID = 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const PEDICURE_CATEGORY_ID = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';

interface CreateBookingModalProps {
  isOpen: boolean;
  toggle: () => void;
  onBookingCreated?: () => void;
}

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
}

interface SelectedService {
  service: Service;
  addOns: AddOn[];
  staffId?: string;
  staffName?: string;
}

interface StaffWorkload {
  id: string;
  name: string;
  workloadMinutes: number;
}

interface BookingToCreate {
  serviceId: string;
  serviceName: string;
  customerId: string;
  staffId: string;
  staffName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  addOnIds: string[];
  status: string;
  totalPrice: number;
  notes: string;
  web: boolean;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  toggle,
  onBookingCreated,
}) => {
  const { t, i18n } = useTranslation();
  
  // Estados principales
  const [step, setStep] = useState<'customer' | 'services' | 'vipcombo' | 'staff' | 'datetime' | 'confirm'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [loadingRemovals, setLoadingRemovals] = useState(false);

  // Datos de catálogos
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Datos del booking
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [incompatibleCategoryIds, setIncompatibleCategoryIds] = useState<string[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [removalAddOns, setRemovalAddOns] = useState<AddOn[]>([]);
  const [selectedRemovalIds, setSelectedRemovalIds] = useState<string[]>([]);
  const [incompatibleRemovalIds, setIncompatibleRemovalIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date()); // Estado para controlar qué semana se muestra
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [notes, setNotes] = useState('');
  
  // Combos VIP y validación avanzada
  const [isVIPCombo, setIsVIPCombo] = useState(false);
  const [userConfirmedVIPChoice, setUserConfirmedVIPChoice] = useState(false); // Track if user made explicit VIP choice
  const [showVIPComboSuggestion, setShowVIPComboSuggestion] = useState(false);
  const [staffWorkloads, setStaffWorkloads] = useState<StaffWorkload[]>([]);
  const [slotVerified, setSlotVerified] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const currentLang = i18n.language?.toUpperCase() === 'SP' ? 'ES' : 'EN';
      const [customersData, servicesData, categoriesData, addOnsData, staffData] = await Promise.all([
        getCustomers(),
        getServices(1, 100, undefined, undefined, true, currentLang),
        getCategories(currentLang),
        getAddOns(1, 100, true, undefined, undefined, currentLang),
        getStaffList(),
      ]);

      console.log('Customers loaded:', customersData);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setServices(servicesData);
      setCategories(Array.isArray(categoriesData) ? categoriesData.filter((c: Category) => c.isActive) : []);
      setAddOns(addOnsData);
      setStaff(staffData);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error(t('booking.toast.load_error'));
    } finally {
      setLoading(false);
    }
  };

  // Formik para nuevo cliente
  const customerForm = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required(t('booking.validation.first_name_required')),
      lastName: Yup.string().required(t('booking.validation.last_name_required')),
      email: Yup.string().email(t('booking.validation.email_invalid')).required(t('booking.validation.email_required')),
      phone: Yup.string().required(t('booking.validation.phone_required')),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const newCustomer = await createCustomer(values);
        setSelectedCustomer(newCustomer.data);
        setIsNewCustomer(false);
        setStep('services');
        toast.success(t('booking.toast.customer_created'));
      } catch (err) {
        console.error('Error creating customer:', err);
        toast.error('Error al crear cliente');
      } finally {
        setLoading(false);
      }
    },
  });

  // Calcular duración y precio total
  const totals = useMemo(() => {
    let totalDuration = 0;
    let totalPrice = 0;

    selectedServices.forEach(({ service, addOns: serviceAddOns }) => {
      // No incluir bufferTime en la duración mostrada al cliente
      totalDuration += service.duration;
      totalPrice += service.price;

      serviceAddOns.forEach((addOn) => {
        totalDuration += addOn.additionalTime || 0;
        totalPrice += addOn.price;
      });
    });

    // Agregar los removal add-ons al total
    removalAddOns
      .filter(r => selectedRemovalIds.includes(r.id))
      .forEach(removal => {
        totalDuration += removal.additionalTime || 0;
        totalPrice += removal.price;
      });

    return { totalDuration, totalPrice };
  }, [selectedServices, removalAddOns, selectedRemovalIds]);

  // Cargar incompatibilidades cuando cambian los servicios seleccionados
  useEffect(() => {
    const fetchIncompatibilities = async () => {
      if (selectedServices.length === 0) {
        setIncompatibleCategoryIds([]);
        return;
      }

      const selectedCategoryIds = selectedServices
        .map(s => s.service.categoryId)
        .filter(Boolean);

      if (selectedCategoryIds.length === 0) {
        setIncompatibleCategoryIds([]);
        return;
      }

      try {
        const incompatibleIds = await getIncompatibleCategories(selectedCategoryIds);
        setIncompatibleCategoryIds(incompatibleIds);
      } catch (err) {
        console.error('Error fetching incompatibilities:', err);
        setIncompatibleCategoryIds([]);
      }
    };

    fetchIncompatibilities();
  }, [selectedServices]);

  // Agrupar servicios por categoría
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    
    services.forEach(service => {
      const categoryId = service.categoryId;
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(service);
    });
    
    return grouped;
  }, [services]);

  // Detectar si es elegible para VIP Combo (2+ servicios de diferente técnico)
  // IMPORTANT: Only auto-set VIP when user hasn't made explicit choice yet
  useEffect(() => {
    // If user already made their choice (passed through vipcombo step), respect it
    if (userConfirmedVIPChoice) {
      return;
    }
    
    if (selectedServices.length >= 2) {
      // Verificar si todos los servicios tienen staff asignado y son diferentes
      const staffIds = selectedServices
        .map(s => s.staffId)
        .filter(id => id !== undefined && id !== '');
      
      const uniqueStaffIds = new Set(staffIds);
      
      // Auto-detect VIP Combo only if user hasn't made explicit choice
      // Es VIP Combo si hay 2+ servicios y tienen diferentes técnicos asignados
      setIsVIPCombo(staffIds.length >= 2 && uniqueStaffIds.size >= 2);
    } else {
      setIsVIPCombo(false);
      // Reset user choice when services change to less than 2
      setUserConfirmedVIPChoice(false);
    }
  }, [selectedServices, userConfirmedVIPChoice]);

  // Generar slots de tiempo basados en disponibilidad del backend
  const generateTimeSlots = (): TimeSlot[] => {
    if (loadingSlots || availableSlots.length === 0) {
      // Mientras carga o si no hay slots, retornar array vacío
      return [];
    }

    // Convertir los slots del backend al formato TimeSlot
    return availableSlots.map((slot: any) => ({
      time: slot.startTime,
      label: moment(slot.startTime, 'HH:mm:ss').format('h:mm A'),
      available: true,
    }));
  };

  // Calcular workload de staff para la fecha seleccionada
  const calculateStaffWorkload = async (date: Date) => {
    if (!date) return;

    try {
      const dateStr = moment(date).format('YYYY-MM-DD');
      
      // Obtener todos los bookings del día
      const bookingsResponse = await getBookingsList({
        startDate: dateStr,
        endDate: dateStr,
        limit: 100,
      });

      const bookings = bookingsResponse.data || [];
      
      // Calcular workload por staff
      const workloadMap = new Map<string, number>();
      
      // Inicializar todos los staff con 0 workload
      staff.forEach(s => {
        if (s.isActive && s.isAvailable) {
          workloadMap.set(s.id, 0);
        }
      });

      // Contar minutos de bookings por staff
      bookings.forEach((booking: any) => {
        if (booking.status !== 'cancelled' && booking.appointmentDate === dateStr) {
          const startTime = moment(booking.startTime, 'HH:mm:ss');
          const endTime = moment(booking.endTime, 'HH:mm:ss');
          const durationMinutes = endTime.diff(startTime, 'minutes');
          
          const currentWorkload = workloadMap.get(booking.staffId) || 0;
          workloadMap.set(booking.staffId, currentWorkload + durationMinutes);
        }
      });

      // Convertir a array
      const workloads: StaffWorkload[] = Array.from(workloadMap.entries()).map(([id, minutes]) => {
        const staffMember = staff.find(s => s.id === id);
        return {
          id,
          name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown',
          workloadMinutes: minutes,
        };
      });

      setStaffWorkloads(workloads);
      setAvailableStaff(staff.filter(s => s.isActive && s.isAvailable));
    } catch (err) {
      console.error('Error calculating staff workload:', err);
    }
  };

  // Validar disponibilidad cuando cambia fecha/hora
  useEffect(() => {
    if (selectedDate && selectedTime) {
      calculateStaffWorkload(selectedDate);
      setSlotVerified(false); // Reset verificación al cambiar fecha/hora
    }
  }, [selectedDate, selectedTime]);

  // Pre-seleccionar fecha de hoy cuando se llega al paso datetime
  useEffect(() => {
    if (step === 'datetime' && !selectedDate) {
      setSelectedDate(new Date());
    }
  }, [step]);

  // Cargar slots disponibles cuando cambia la fecha o los servicios
  useEffect(() => {
    const loadAvailableSlots = async () => {
      // Solo cargar si estamos en el paso de datetime o después
      if (step !== 'datetime' && step !== 'confirm') {
        return;
      }

      if (!selectedDate || selectedServices.length === 0) {
        setAvailableSlots([]);
        return;
      }

      // Verificar que todos los servicios tengan staff asignado (no 'any')
      const hasUnassignedStaff = selectedServices.some(s => !s.staffId || s.staffId === 'any');
      if (hasUnassignedStaff) {
        // No cargar slots hasta que se asigne staff específico
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        // Resetear slot verificado cuando se recargan los horarios
        setSlotVerified(false);
        const dateStr = moment(selectedDate).format('YYYY-MM-DD');

        // Preparar servicios en el nuevo formato CON staff específico
        const services = selectedServices.map(({ service, addOns, staffId }) => ({
          serviceId: service.id,
          duration: service.duration,
          bufferTime: service.bufferTime || 0,
          staffId: staffId, // Enviar el staff ID específico
          addons: addOns.map(addon => ({
            id: addon.id,
            duration: addon.additionalTime || 0,
          })),
        }));

        // Preparar removals
        const removals = removalAddOns
          .filter(r => selectedRemovalIds.includes(r.id))
          .map(removal => ({
            id: removal.id,
            duration: removal.additionalTime || 0,
          }));

        // Get timezone offset in minutes (UTC-3 = -180)
        const timezoneOffset = new Date().getTimezoneOffset();

        console.log('🔍 Fetching available slots for specific staff:', {
          date: dateStr,
          servicesCount: services.length,
          removalsCount: removals.length,
          isVIPCombo,
          staffIds: services.map(s => s.staffId),
          timezoneOffset,
        });

        const response = await getBackofficeAvailability(services, removals, dateStr, isVIPCombo, timezoneOffset);
        const slots = response.data || response || [];
        
        console.log('✅ Available slots loaded:', slots.length);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error loading available slots:', error);
        toast.error('Error al cargar horarios disponibles');
          toast.error(t('booking.toast.load_slots_error'));
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [step, selectedDate, selectedServices, selectedRemovalIds, isVIPCombo]);

  // Verificar disponibilidad de staff específico
  const isStaffAvailableAtTime = async (
    staffId: string,
    startTime: string,
    endTime: string,
    bookingDate: string
  ): Promise<boolean> => {
    try {
      const bookingsResponse = await getBookingsList({
        startDate: bookingDate,
        endDate: bookingDate,
        limit: 100,
      });

      const bookings = bookingsResponse.data || [];
      const staffBookings = bookings.filter(
        (b: any) => b.staffId === staffId && b.status !== 'cancelled' && b.appointmentDate === bookingDate
      );

      const requestStart = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm:ss');
      const requestEnd = moment(`${bookingDate} ${endTime}`, 'YYYY-MM-DD HH:mm:ss');

      for (const booking of staffBookings) {
        const bookingStart = moment(`${bookingDate} ${booking.startTime}`, 'YYYY-MM-DD HH:mm:ss');
        const bookingEnd = moment(`${bookingDate} ${booking.endTime}`, 'YYYY-MM-DD HH:mm:ss');

        // Check overlap
        if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
          console.log(`❌ Staff ${staffId} ocupado: ${bookingStart.format('HH:mm')} - ${bookingEnd.format('HH:mm')}`);
          return false;
        }
      }

      console.log(`✅ Staff ${staffId} disponible`);
      return true;
    } catch (err) {
      console.error('Error checking staff availability:', err);
      return false;
    }
  };

  // Auto-asignar staff con menor workload
  const autoAssignStaff = (serviceIndex: number): string | undefined => {
    if (staffWorkloads.length === 0) {
      return availableStaff[0]?.id;
    }

    // Encontrar staff con menor workload
    const minWorkload = Math.min(...staffWorkloads.map(w => w.workloadMinutes));
    const optimalStaff = staffWorkloads.find(w => w.workloadMinutes === minWorkload);

    return optimalStaff?.id || availableStaff[0]?.id;
  };

  // Agregar servicio
  const addService = (service: Service) => {
    if (selectedServices.find(s => s.service.id === service.id)) {
      toast.warning(t('booking.toast.service_already_added'));
      return;
    }

    // Auto-asignar staff con menor workload
    const autoStaffId = autoAssignStaff(selectedServices.length);
    const autoStaff = staff.find(s => s.id === autoStaffId);

    setSelectedServices([
      ...selectedServices,
      {
        service,
        addOns: [],
        staffId: autoStaffId,
        staffName: autoStaff ? `${autoStaff.firstName} ${autoStaff.lastName}` : undefined,
      },
    ]);
  };

  // Remover servicio
  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId));
  };

  // Agregar addon a un servicio
  const toggleAddOn = (serviceId: string, addOn: AddOn) => {
    setSelectedServices(
      selectedServices.map(s => {
        if (s.service.id === serviceId) {
          const hasAddOn = s.addOns.find(a => a.id === addOn.id);
          return {
            ...s,
            addOns: hasAddOn
              ? s.addOns.filter(a => a.id !== addOn.id)
              : [...s.addOns, addOn],
          };
        }
        return s;
      })
    );
  };

  // Asignar staff a un servicio
  const assignStaff = (serviceId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    // Resetear la verificación y los time slots cuando cambia el staff
    setSlotVerified(false);
    setSelectedTime(null); // Forzar a que vuelva a seleccionar horario con el nuevo staff
    
    setSelectedServices(
      selectedServices.map(s => {
        if (s.service.id === serviceId) {
          return {
            ...s,
            staffId: staffId || undefined,
            staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : undefined,
          };
        }
        return s;
      })
    );
  };

  // Verificar slots antes de confirmar (como en frontend)
  const verifySlotAvailability = async (): Promise<boolean> => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      return false;
    }

    setVerifying(true);
    try {
      const appointmentDate = moment(selectedDate).format('YYYY-MM-DD');
      let currentStartTime = moment(`${appointmentDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm:ss');

      // Para VIP Combo: todos empiezan al mismo tiempo
      // Para consecutivo: cada uno empieza después del anterior
      for (const { service, addOns: serviceAddOns, staffId } of selectedServices) {
        if (!staffId) {
          toast.error(`Falta asignar técnico para ${service.name}`);
          return false;
        }

        const serviceDuration = service.duration;
        const addonsDuration = serviceAddOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
        const totalDuration = serviceDuration + addonsDuration;
        // Usar bufferTime del servicio o el global del sistema (default: 15)
        const bufferTime = service.bufferTime !== undefined ? service.bufferTime : 15;

        // Incluir buffer en el endTime para verificación correcta
        const endTime = moment(currentStartTime).add(totalDuration + bufferTime, 'minutes');

        const isAvailable = await isStaffAvailableAtTime(
          staffId,
          currentStartTime.format('HH:mm:ss'),
          endTime.format('HH:mm:ss'),
          appointmentDate
        );

        if (!isAvailable) {
          toast.error(`El técnico para ${service.name} no está disponible en este horario`);
          return false;
        }

        // Para consecutivo: mover al siguiente slot (buffer ya incluido en endTime)
        if (!isVIPCombo) {
          currentStartTime = moment(endTime);
        }
        // Para VIP Combo: mantener el mismo tiempo de inicio
      }

      setSlotVerified(true);
      toast.success('✅ Horarios verificados y disponibles');
        toast.success(t('booking.toast.slots_verified'));
      return true;
    } catch (err) {
      console.error('Error verifying slots:', err);
      toast.error('Error al verificar disponibilidad');
        toast.error(t('booking.toast.verify_slots_error'));
      return false;
    } finally {
      setVerifying(false);
    }
  };

  // Crear booking(s) con lógica completa del frontend
  const handleCreateBooking = async () => {
    if (!selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0) {
      toast.error(t('booking.toast.complete_all_fields'));
      return;
    }

    // Verificar que todos los servicios tengan staff asignado Y que no sea 'any'
    const missingStaff = selectedServices.filter(s => !s.staffId || s.staffId === 'any');
    if (missingStaff.length > 0) {
      toast.error(`Debe seleccionar un técnico específico para: ${missingStaff.map(s => s.service.name).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const appointmentDate = moment(selectedDate).format('YYYY-MM-DD');
      let currentStartTime = moment(`${appointmentDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm:ss');
      const baseStartTime = moment(currentStartTime); // Para VIP Combo

      console.log('\n=== 🎯 CREATING BOOKINGS ===');
      console.log(`Mode: ${isVIPCombo ? '🌟 VIP COMBO (SIMULTANEOUS)' : '📋 CONSECUTIVE'}`);
      console.log(`Services: ${selectedServices.length}`);
      console.log(`Date: ${appointmentDate}`);
      console.log(`Time: ${selectedTime}`);
      console.log('Staff assignments:', selectedServices.map(s => `${s.service.name} -> ${s.staffName} (${s.staffId})`));

      const bookingsToCreate: BookingToCreate[] = [];

      // Preparar todos los bookings
      selectedServices.forEach(({ service, addOns: serviceAddOns, staffId, staffName }, index) => {
        const serviceDuration = service.duration;
        
        // En el primer servicio, incluir los removal add-ons seleccionados
        const allAddOns = index === 0 
          ? [...serviceAddOns, ...removalAddOns.filter(r => selectedRemovalIds.includes(r.id))]
          : serviceAddOns;
        
        const addonsDuration = allAddOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
        const totalDuration = serviceDuration + addonsDuration;
        // Usar bufferTime del servicio o el global del sistema (default: 15)
        const bufferTime = service.bufferTime !== undefined ? service.bufferTime : 15;

        // Para VIP Combo: usar tiempo base (simultáneo)
        // Para consecutivo: usar tiempo actual (secuencial)
        const serviceStartTime = isVIPCombo ? moment(baseStartTime) : moment(currentStartTime);
        // IMPORTANTE: agregar buffer al endTime para prevenir double-booking
        // El buffer es tiempo de limpieza/preparación después del servicio
        const serviceEndTime = moment(serviceStartTime).add(totalDuration + bufferTime, 'minutes');

        bookingsToCreate.push({
          serviceId: service.id,
          serviceName: service.name,
          customerId: selectedCustomer.id,
          staffId: staffId!,
          staffName: staffName || 'Staff',
          appointmentDate,
          startTime: serviceStartTime.format('HH:mm:ss'),
          endTime: serviceEndTime.format('HH:mm:ss'),
          duration: totalDuration,
          addOnIds: allAddOns.map(a => a.id),
          status: 'pending',
          totalPrice: index === selectedServices.length - 1 ? totals.totalPrice : service.price,
          notes: index === 0 
            ? (notes || (isVIPCombo ? 'VIP Combo booking' : '')) 
            : (isVIPCombo ? `VIP Combo - Parte ${index + 1}` : `Parte ${index + 1} de ${selectedServices.length}`),
          web: false,
        });

        console.log(`\n📦 Booking ${index + 1}/${selectedServices.length}:`);
        console.log(`  Service: ${service.name}`);
        console.log(`  Staff: ${staffName} (${staffId})`);
        console.log(`  Start: ${serviceStartTime.format('YYYY-MM-DD HH:mm:ss')}`);
        console.log(`  End: ${serviceEndTime.format('YYYY-MM-DD HH:mm:ss')} (includes ${bufferTime}min buffer)`);
        console.log(`  Duration: ${totalDuration} min (service + addons)`);
        console.log(`  Add-ons: ${serviceAddOns.length}`);

        // Actualizar tiempo para el siguiente servicio (solo consecutivo)
        // Ya no necesitamos agregar buffer aquí porque está incluido en serviceEndTime
        if (!isVIPCombo) {
          currentStartTime = moment(serviceEndTime);
        }
      });

      // Intentar crear todos los bookings (con rollback si falla)
      console.log('\n🚀 Starting booking creation...');
      const createdBookings: any[] = [];

      try {
        for (const booking of bookingsToCreate) {
          console.log(`\n⏳ Creating: ${booking.serviceName} with ${booking.staffName}...`);
          console.log('📤 Payload being sent to backend:', {
            serviceId: booking.serviceId,
            customerId: booking.customerId,
            staffId: booking.staffId,
            appointmentDate: booking.appointmentDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            addOnIds: booking.addOnIds.length > 0 ? booking.addOnIds : undefined,
            notes: booking.notes,
            web: booking.web,
          });
          
          const response = await createBooking({
            serviceId: booking.serviceId,
            customerId: booking.customerId,
            staffId: booking.staffId,
            appointmentDate: booking.appointmentDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            addOnIds: booking.addOnIds.length > 0 ? booking.addOnIds : undefined,
            notes: booking.notes,
            web: booking.web,
          });

          console.log(`✅ Created successfully`);
          createdBookings.push(response);
        }

        console.log(`\n🎉 SUCCESS: All ${createdBookings.length} bookings created!`);
        toast.success(
          `${createdBookings.length} booking(s) creado(s) exitosamente${isVIPCombo ? ' (VIP Combo)' : ''}`
        );
        onBookingCreated?.();
        handleClose();
      } catch (bookingError: any) {
        console.error('\n❌ BOOKING CREATION FAILED:', bookingError);

        // ROLLBACK: Eliminar bookings creados
        if (createdBookings.length > 0) {
          console.log(`\n🔄 ROLLBACK: Deleting ${createdBookings.length} created booking(s)...`);
          
          // TODO: Implementar deleteBooking cuando esté disponible
          toast.error(
            `Error al crear booking. ${createdBookings.length} booking(s) podrían necesitar eliminación manual.`
          );
        }

        throw bookingError;
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al crear el booking';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handler para cuando se selecciona un horario
  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    // Resetear verificación cuando cambia el horario
    setSlotVerified(false);

    // Si hay servicios con "any" staff, auto-asignar
    const servicesWithAny = selectedServices.filter(s => s.staffId === 'any' || !s.staffId);
    
    if (servicesWithAny.length > 0 && selectedDate) {
      try {
        const api = new APIClient();
        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
        // Formatear tiempo a HH:mm (sin segundos)
        const formattedTime = time.length > 5 ? time.substring(0, 5) : time;

        console.log('🔄 Auto-assigning staff for services:', servicesWithAny.map(s => s.service.name));

        // Auto-asignar cada servicio con "any"
        const updatedServices = await Promise.all(
          selectedServices.map(async ({ service, addOns, staffId, staffName }, index) => {
            if (staffId === 'any' || !staffId) {
              // Calcular duración total incluyendo add-ons y removals (solo primer servicio)
              const addOnsDuration = addOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
              const removalsDuration = index === 0
                ? removalAddOns.filter(r => selectedRemovalIds.includes(r.id)).reduce((sum, r) => sum + (r.additionalTime || 0), 0)
                : 0;
              const totalDuration = service.duration + addOnsDuration + removalsDuration;

              console.log(`🔄 Calling assign-optimal-staff for "${service.name}" (${totalDuration} min)`);

              // Llamar al endpoint de auto-asignación usando APIClient
              const result: any = await api.create('/api/v1/bookings/assign-optimal-staff', {
                date: formattedDate,
                time: formattedTime,
                duration: totalDuration
              });

              console.log(`✅ Received assignment:`, result);

              // El backend devuelve { success, data: { success, staffId, staffName, ... }, timestamp }
              const assignmentData = result.data || result;
              
              if (assignmentData.success && assignmentData.staffId) {
                toast.success(`${service.name}: Asignado a ${assignmentData.staffName}`);
                return {
                  service,
                  addOns,
                  staffId: assignmentData.staffId,
                  staffName: assignmentData.staffName
                };
              } else {
                console.error('❌ Assignment failed:', assignmentData);
                toast.error(`No se pudo asignar técnico automáticamente para ${service.name}`);
                return { service, addOns, staffId, staffName };
              }
            }

            return { service, addOns, staffId, staffName };
          })
        );

        setSelectedServices(updatedServices);
        console.log('✅ Services updated with auto-assigned staff');
      } catch (error) {
        console.error('❌ Error auto-assigning staff:', error);
        toast.error('Error al asignar técnicos automáticamente. Por favor seleccione manualmente.');
        toast.error(t('booking.toast.auto_assign_error'));
      }
    }
  };

  // Cerrar modal y resetear
  const handleClose = () => {
    setStep('customer');
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setSelectedServices([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    setError(null);
    setIsVIPCombo(false);
    setUserConfirmedVIPChoice(false); // Reset user's VIP choice
    setSlotVerified(false);
    setStaffWorkloads([]);
    customerForm.resetForm();
    toggle();
  };

  // Helper: verificar si los servicios seleccionados requieren removal modal (solo manicura/pedicura)
  const requiresRemovalModal = useMemo(() => {
    const result = selectedServices.some(s => 
      s.service.categoryId === MANICURE_CATEGORY_ID || 
      s.service.categoryId === PEDICURE_CATEGORY_ID
    );
    console.log('🎯 requiresRemovalModal calculated:', {
      result,
      selectedServices: selectedServices.map(s => ({
        name: s.service.name,
        categoryId: s.service.categoryId,
        isManicure: s.service.categoryId === MANICURE_CATEGORY_ID,
        isPedicure: s.service.categoryId === PEDICURE_CATEGORY_ID
      }))
    });
    return result;
  }, [selectedServices]);

  // Helper: verificar si se debe mostrar VIP Combo (manicura Y pedicura)
  const shouldShowVIPCombo = useMemo(() => {
    const hasManicure = selectedServices.some(s => s.service.categoryId === MANICURE_CATEGORY_ID);
    const hasPedicure = selectedServices.some(s => s.service.categoryId === PEDICURE_CATEGORY_ID);
    return hasManicure && hasPedicure;
  }, [selectedServices]);

  // Helper: verificar si hay múltiples categorías (para removal: checkboxes vs radio)
  const hasMultipleCategories = useMemo(() => {
    const hasManicure = selectedServices.some(s => s.service.categoryId === MANICURE_CATEGORY_ID);
    const hasPedicure = selectedServices.some(s => s.service.categoryId === PEDICURE_CATEGORY_ID);
    return hasManicure && hasPedicure;
  }, [selectedServices]);

  // Helper: verificar si se necesita paso de staff (todos los servicios necesitan staff)
  const requiresStaffStep = useMemo(() => {
    return selectedServices.length > 0;
  }, [selectedServices]);

  // Navegar entre pasos
  const goToNextStep = () => {
    if (step === 'customer' && !selectedCustomer) {
      toast.warning('Por favor seleccione o cree un cliente');
        toast.warning(t('booking.toast.select_or_create_customer'));
      return;
    }
    if (step === 'services' && selectedServices.length === 0) {
      toast.warning('Por favor seleccione al menos un servicio');
        toast.warning(t('booking.toast.select_at_least_one_service'));
      return;
    }
    if (step === 'staff' && requiresStaffStep) {
      const missingStaff = selectedServices.filter(s => !s.staffId);
      if (missingStaff.length > 0) {
        toast.warning(t('booking.toast.assign_staff_missing', { services: missingStaff.map(s => s.service.name).join(', ') }));
        return;
      }
    }
    if (step === 'datetime' && (!selectedDate || !selectedTime)) {
      toast.warning(t('booking.toast.select_date_time'));
      // También advertir si falta asignar staff
      const missingStaff = selectedServices.filter(s => !s.staffId);
      if (missingStaff.length > 0) {
        toast.warning(t('booking.toast.assign_staff_missing', { services: missingStaff.map(s => s.service.name).join(', ') }));
      }
      return;
    }

    // Determinar siguiente paso basado en condiciones
    if (step === 'customer') {
      setStep('services');
    } else if (step === 'services') {
      // Después de servicios: mostrar modal de removal si aplica (para manicura/pedicura)
      if (requiresRemovalModal) {
        console.log('🚀 Showing removal modal:', {
          requiresRemovalModal,
          removalAddOnsLength: removalAddOns.length,
          removalAddOns,
          loadingRemovals,
          selectedServices: selectedServices.length
        });
        setShowRemovalModal(true);
        console.log('✅ setShowRemovalModal(true) called');
        return; // No cambiar de paso aún, el modal continuará cuando se cierre
      } else if (shouldShowVIPCombo) {
        setShowVIPComboSuggestion(true);
        setStep('vipcombo');
      } else if (requiresStaffStep) {
        setStep('staff');
      } else {
        setStep('datetime');
      }
    } else if (step === 'vipcombo') {
      // Después de vipcombo: ir a staff si aplica, sino a datetime
      if (requiresStaffStep) {
        setStep('staff');
      } else {
        setStep('datetime');
      }
    } else if (step === 'staff') {
      setStep('datetime');
    } else if (step === 'datetime') {
      // VALIDACIÓN OBLIGATORIA: Debe verificar disponibilidad antes de confirmar
      if (!slotVerified) {
        toast.warning('⚠️ Debe verificar la disponibilidad antes de continuar');
          toast.warning(t('booking.toast.verify_availability_first'));
        return;
      }
      setStep('confirm');
    }
  };

  const goToPreviousStep = () => {
    // Determinar paso anterior basado en condiciones
    if (step === 'services') {
      setStep('customer');
    } else if (step === 'vipcombo') {
      // Volver a services (el modal de removal no es un paso)
      setStep('services');
    } else if (step === 'staff') {
      // Volver a vipcombo si se mostró, sino a services
      if (shouldShowVIPCombo) {
        setStep('vipcombo');
      } else {
        setStep('services');
      }
    } else if (step === 'datetime') {
      // Volver a staff si se mostró, sino a vipcombo si se mostró, sino a services
      if (requiresStaffStep) {
        setStep('staff');
      } else if (shouldShowVIPCombo) {
        setStep('vipcombo');
      } else {
        setStep('services');
      }
    } else if (step === 'confirm') {
      setStep('datetime');
    }
  };

  // Handler para continuar después del modal de removal
  const handleRemovalModalContinue = () => {
    setShowRemovalModal(false);
    
    // Continuar con la navegación normal
    if (shouldShowVIPCombo) {
      setShowVIPComboSuggestion(true);
      setStep('vipcombo');
    } else if (requiresStaffStep) {
      setStep('staff');
    } else {
      setStep('datetime');
    }
  };

  // Cargar removal add-ons cuando cambian los servicios seleccionados
  useEffect(() => {
    const loadRemovalAddOns = async () => {
      if (selectedServices.length === 0) {
        setRemovalAddOns([]);
        setSelectedRemovalIds([]);
        setIncompatibleRemovalIds([]);
        return;
      }
      
      try {
        setLoadingRemovals(true);
        const serviceIds = selectedServices.map(s => s.service.id);
        console.log('📞 Calling getRemovalAddonsByServices with:', serviceIds);
        const response = await getRemovalAddonsByServices(serviceIds);
        console.log('📦 Raw response:', response);
        console.log('🔍 Removals loaded:', response);
        setRemovalAddOns(response || []);
        console.log('✅ setRemovalAddOns called with:', response?.length || 0, 'items');
      } catch (error) {
        console.error('Error loading removal add-ons:', error);
        setRemovalAddOns([]);
      } finally {
        setLoadingRemovals(false);
      }
    };
    
    loadRemovalAddOns();
  }, [selectedServices]);

  // Cargar incompatibilidades de removals cuando cambia la selección
  useEffect(() => {
    const loadRemovalIncompatibilities = async () => {
      if (selectedRemovalIds.length === 0) {
        setIncompatibleRemovalIds([]);
        return;
      }

      try {
        const incompatibleIds = await getIncompatibleAddOns(selectedRemovalIds);
        setIncompatibleRemovalIds(incompatibleIds);
      } catch (error) {
        console.error('Error loading removal incompatibilities:', error);
        setIncompatibleRemovalIds([]);
      }
    };

    loadRemovalIncompatibilities();
  }, [selectedRemovalIds]);

  // Debug: Log removal modal state changes
  useEffect(() => {
    if (showRemovalModal) {
      console.log('🔍 REMOVAL MODAL OPENED:', {
        showRemovalModal,
        loadingRemovals,
        removalAddOnsLength: removalAddOns.length,
        removalAddOns,
        requiresRemovalModal,
        selectedServices: selectedServices.length
      });
    }
  }, [showRemovalModal, loadingRemovals, removalAddOns.length]);

  // Opciones para react-select
  const customerOptions = customers.map(c => ({
    value: c.id,
    label: `${c.firstName} - ${c.email}`,
  }));

  const timeSlots = generateTimeSlots();

  return (
    <>
      <Modal isOpen={isOpen} toggle={handleClose} size="xl" scrollable>
      <ModalHeader toggle={handleClose}>
        {t('booking.create_title')} {isVIPCombo && <Badge color="warning" className="ms-2">{t('booking.vip_combo_badge')}</Badge>}
        <div className="mt-2">
          <Badge color={step === 'customer' ? 'primary' : 'secondary'} className="me-1">
            1. {t('booking.step.customer')}
          </Badge>
          <Badge color={step === 'services' ? 'primary' : 'secondary'} className="me-1">
            2. {t('booking.step.services')}
          </Badge>
          <Badge color={step === 'datetime' ? 'primary' : 'secondary'} className="me-1">
            3. {t('booking.step.datetime')}
          </Badge>
          <Badge color={step === 'confirm' ? 'primary' : 'secondary'}>
            4. {t('booking.step.confirm')}
          </Badge>
        </div>
      </ModalHeader>

      <ModalBody style={{ minHeight: '60vh', maxHeight: '75vh', overflowY: 'auto' }}>
        {loading && (
          <div className="text-center py-4">
            <Spinner color="primary" />
            <p className="mt-2">{t('booking.button.loading')}</p>
          </div>
        )}

        {error && (
          <Alert color="danger" toggle={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* PASO 1: CLIENTE */}
        {step === 'customer' && !loading && (
          <div>
            <h5 className="mb-3">{t('booking.customer.title')}</h5>

            {!isNewCustomer ? (
              <>
                <FormGroup>
                  <Label>{t('booking.customer.existing_label')}</Label>
                  <Select
                    options={customerOptions}
                    onChange={(option: any) => {
                      if (option && option.value) {
                        const customer = customers.find(c => c.id === option.value);
                        setSelectedCustomer(customer || null);
                      } else {
                        setSelectedCustomer(null);
                      }
                    }}
                    placeholder={t('booking.customer.search_placeholder')}
                    isClearable
                  />
                </FormGroup>

                <div className="text-center my-3">
                  <Button
                    color="link"
                    onClick={() => setIsNewCustomer(true)}
                  >
                    {t('booking.customer.create_new')}
                  </Button>
                </div>

                {selectedCustomer && (
                  <Card className="border">
                    <CardBody>
                      <h6>{t('booking.customer.selected_title')}</h6>
                      <p className="mb-1">
                        <strong>{t('booking.customer.selected_name')}:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="mb-1">
                        <strong>{t('booking.customer.selected_email')}:</strong> {selectedCustomer.email}
                      </p>
                      <p className="mb-0">
                        <strong>{t('booking.customer.selected_phone')}:</strong> {selectedCustomer.phone}
                      </p>
                    </CardBody>
                  </Card>
                )}
              </>
            ) : (
              <Form onSubmit={customerForm.handleSubmit}>
                <div className="mb-3">
                  <Label htmlFor="firstname-field" className="form-label">
                    {t('customers.form.first_name')}
                  </Label>
                  <Input
                    name="firstName"
                    id="firstname-field"
                    className="form-control"
                    placeholder={t('customers.form.enter_first_name')}
                    type="text"
                    onChange={customerForm.handleChange}
                    onBlur={customerForm.handleBlur}
                    value={customerForm.values.firstName || ""}
                    invalid={!!(customerForm.touched.firstName && customerForm.errors.firstName)}
                  />
                  {customerForm.touched.firstName && customerForm.errors.firstName ? (
                    <FormFeedback type="invalid">{customerForm.errors.firstName}</FormFeedback>
                  ) : null}
                </div>

                <div className="mb-3">
                  <Label htmlFor="lastname-field" className="form-label">
                    {t('customers.form.last_name')}
                  </Label>
                  <Input
                    name="lastName"
                    id="lastname-field"
                    className="form-control"
                    placeholder={t('customers.form.enter_last_name')}
                    type="text"
                    onChange={customerForm.handleChange}
                    onBlur={customerForm.handleBlur}
                    value={customerForm.values.lastName || ""}
                    invalid={!!(customerForm.touched.lastName && customerForm.errors.lastName)}
                  />
                  {customerForm.touched.lastName && customerForm.errors.lastName ? (
                    <FormFeedback type="invalid">{customerForm.errors.lastName}</FormFeedback>
                  ) : null}
                </div>

                <div className="mb-3">
                  <Label htmlFor="email-field" className="form-label">
                    {t('customers.form.email')}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    id="email-field"
                    placeholder={t('customers.form.enter_email')}
                    onChange={customerForm.handleChange}
                    onBlur={customerForm.handleBlur}
                    value={customerForm.values.email || ""}
                    invalid={!!(customerForm.touched.email && customerForm.errors.email)}
                  />
                  {customerForm.touched.email && customerForm.errors.email ? (
                    <FormFeedback type="invalid">{customerForm.errors.email}</FormFeedback>
                  ) : null}
                </div>

                <div className="mb-3">
                  <Label htmlFor="phone-field" className="form-label">
                    {t('customers.form.phone')}
                  </Label>
                  <Input
                    name="phone"
                    type="text"
                    id="phone-field"
                    placeholder={t('customers.form.enter_phone')}
                    onChange={customerForm.handleChange}
                    onBlur={customerForm.handleBlur}
                    value={customerForm.values.phone || ""}
                    invalid={!!(customerForm.touched.phone && customerForm.errors.phone)}
                  />
                  {customerForm.touched.phone && customerForm.errors.phone ? (
                    <FormFeedback type="invalid">{customerForm.errors.phone}</FormFeedback>
                  ) : null}
                </div>

                <div className="mb-3">
                  <Label htmlFor="notes-field" className="form-label">
                    {t('customers.form.notes')}
                  </Label>
                  <Input
                    name="notes"
                    type="textarea"
                    id="notes-field"
                    rows={3}
                    placeholder={t('customers.form.enter_notes')}
                    onChange={customerForm.handleChange}
                    onBlur={customerForm.handleBlur}
                    value={customerForm.values.notes || ""}
                  />
                </div>

                <div className="hstack gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setIsNewCustomer(false)}
                  >
                    {t('customers.form.close')}
                  </button>
                  <button type="submit" className="btn btn-success">
                    {t('customers.add_customer')}
                  </button>
                </div>
              </Form>
            )}
          </div>
        )}

        {/* PASO 2: SERVICIOS */}
        {step === 'services' && !loading && (
          <div>
            <h5 className="mb-3">{t('booking.services.title')}</h5>

            {/* Servicios seleccionados */}
            {selectedServices.length > 0 && (
              <Card className="border mb-3">
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Servicios Agregados ({selectedServices.length})</h6>
                  {isVIPCombo && (
                    <Badge color="warning" pill>
                      <i className="ri-star-fill me-1"></i>
                      {t('booking.services.vip_combo_badge')}
                    </Badge>
                  )}
                </CardHeader>
                <CardBody>
                  {selectedServices.map(({ service, addOns: serviceAddOns, staffId, staffName }, idx) => (
                    <div key={service.id} className="border-bottom pb-3 mb-3 last:border-bottom-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <Badge color="info" className="me-2">{idx + 1}</Badge>
                            <h6 className="mb-0">{service.name}</h6>
                          </div>
                          <p className="text-muted small mb-2">
                            {service.duration} min - ${service.price}
                          </p>

                          {/* Botón para expandir/colapsar add-ons */}
                          <Button
                            color="link"
                            size="sm"
                            className="p-0 mb-2"
                            onClick={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)}
                          >
                            <i className={`ri-${expandedServiceId === service.id ? 'arrow-up' : 'arrow-down'}-s-line me-1`} />
                            {expandedServiceId === service.id 
                              ? t('booking.services.hide_addons') 
                              : t('booking.services.show_addons')}
                            {serviceAddOns.length > 0 && ` (${serviceAddOns.length})`}
                          </Button>

                          {/* Panel de add-ons colapsable */}
                          {expandedServiceId === service.id && (
                            <div className="mb-2 mt-2">
                              {addOns.filter(a => 
                                a.isActive && (
                                  !a.compatibleServiceIds || 
                                  a.compatibleServiceIds.length === 0 ||
                                  a.compatibleServiceIds.includes(service.id)
                                )
                              ).length > 0 ? (
                                <div className="d-flex flex-column gap-2">
                                  {addOns
                                    .filter(a => 
                                      a.isActive && (
                                        !a.compatibleServiceIds || 
                                        a.compatibleServiceIds.length === 0 ||
                                        a.compatibleServiceIds.includes(service.id)
                                      )
                                    )
                                    .map(addOn => {
                                      const isSelected = serviceAddOns.find(a => a.id === addOn.id);
                                      return (
                                        <div 
                                          key={addOn.id}
                                          className={`border rounded p-2 ${isSelected ? 'border-success bg-success bg-opacity-10' : ''}`}
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => toggleAddOn(service.id, addOn)}
                                        >
                                          <div className="d-flex align-items-start justify-content-between">
                                            <div className="form-check mb-0">
                                              <Input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={!!isSelected}
                                                onChange={() => toggleAddOn(service.id, addOn)}
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <Label className="form-check-label mb-0">
                                                <strong>{addOn.name}</strong>
                                                {addOn.description && (
                                                  <small className="text-muted d-block">{addOn.description}</small>
                                                )}
                                              </Label>
                                            </div>
                                            <div className="text-end">
                                              <div className="text-success fw-bold">+${addOn.price}</div>
                                              {addOn.additionalTime && (
                                                <small className="text-muted">+{addOn.additionalTime} min</small>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              ) : (
                                <Alert color="info" className="mb-0 small">
                                  {t('booking.services.no_addons_available')}
                                </Alert>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          color="danger"
                          size="sm"
                          onClick={() => removeService(service.id)}
                        >
                          <i className="ri-delete-bin-line" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            {/* Servicios disponibles agrupados por categoría */}
            <div className="mb-3">
              <h6 className="mb-3">{t('booking.services.available_by_category')}</h6>
              {categories.map(category => {
                const categoryServices = servicesByCategory[category.id] || [];
                const isIncompatible = incompatibleCategoryIds.includes(category.id);
                const isCategoryExpanded = expandedCategoryIds.includes(category.id);
                
                // Verificar si hay servicios seleccionados de esta categoría
                const selectedFromCategory = selectedServices.filter(s => s.service.categoryId === category.id);
                const hasSelectedService = selectedFromCategory.length > 0;
                
                // Solo mostrar categorías que tengan servicios
                if (categoryServices.length === 0) return null;
                
                // Determinar qué servicios mostrar
                const servicesToShow = hasSelectedService 
                  ? categoryServices.filter(service => 
                      selectedFromCategory.some(s => s.service.id === service.id)
                    )
                  : categoryServices;
                
                const toggleCategory = () => {
                  setExpandedCategoryIds(prev => 
                    prev.includes(category.id)
                      ? prev.filter(id => id !== category.id)
                      : [...prev, category.id]
                  );
                };
                
                return (
                  <Card key={category.id} className={`mb-2 ${isIncompatible ? 'opacity-50' : ''}`}>
                    <CardHeader 
                      className="bg-light"
                      style={{ cursor: 'pointer' }}
                      onClick={toggleCategory}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`ri-arrow-${isCategoryExpanded ? 'down' : 'right'}-s-line`} />
                          <h6 className="mb-0">{category.name}</h6>
                          {hasSelectedService && (
                            <Badge color="success" pill>
                              {selectedFromCategory.length}
                            </Badge>
                          )}
                        </div>
                        {isIncompatible && (
                          <Badge color="danger">Incompatible</Badge>
                        )}
                      </div>
                    </CardHeader>
                    {isCategoryExpanded && (
                      <CardBody>
                        <div className="d-flex flex-column gap-2">
                          {servicesToShow.map(service => {
                            const isSelected = selectedServices.find(s => s.service.id === service.id);
                            const isDisabled = isIncompatible && !isSelected;
                            
                            return (
                              <div
                                key={service.id}
                                className={`border rounded p-2 ${
                                  isSelected ? 'border-primary bg-primary bg-opacity-10' : ''
                                } ${isDisabled ? '' : 'cursor-pointer'}`}
                                style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1 }}
                                onClick={() => !isDisabled && addService(service)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{service.name}</strong>
                                    {service.description && (
                                      <small className="text-muted d-block">{service.description}</small>
                                    )}
                                    <small className="text-muted">
                                      {service.duration} min - ${service.price}
                                    </small>
                                  </div>
                                  {isSelected && (
                                    <Badge color="success">
                                      <i className="ri-check-line" />
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardBody>
                    )}
                  </Card>
                );
              })}
            </div>

            <Alert color={isVIPCombo ? 'warning' : 'info'} className="small mb-0">
              <i className={`${isVIPCombo ? 'ri-star-fill' : 'ri-information-line'} me-1`} />
              {isVIPCombo 
                ? t('booking.services.vip_combo_info')
                : t('booking.services.consecutive_info')}
            </Alert>
          </div>
        )}

        {/* PASO 3: VIP COMBO SUGGESTION (CONDICIONAL) */}
        {step === 'vipcombo' && !loading && showVIPComboSuggestion && (
          <div>
            <div className="text-center mb-4">
              <i className="ri-star-fill text-warning" style={{ fontSize: '48px' }}></i>
              <h4 className="mt-3">{t('booking.vipcombo.title') || 'Save Time with a VIP Combo!'}</h4>
              <p className="text-muted">
                {t('booking.vipcombo.description') || 'You selected Manicure and Pedicure. Would you like to have both services done simultaneously by two professionals? This saves you time!'}
              </p>
            </div>

            <Card className="border mb-3">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-1">
                      <i className="ri-time-line me-2"></i>
                      {t('booking.vipcombo.time_comparison') || 'Time Comparison'}
                    </h6>
                  </div>
                </div>
                
                <Row>
                  <Col md={6}>
                    <div className="p-3 bg-light rounded">
                      <p className="mb-1 small text-muted">{t('booking.vipcombo.consecutive') || 'Consecutive (one after another)'}</p>
                      <h5 className="mb-0">{totals.totalDuration} {t('booking.minutes') || 'min'}</h5>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-3 bg-warning bg-opacity-10 rounded border border-warning">
                      <p className="mb-1 small text-muted">
                        <i className="ri-star-fill text-warning me-1"></i>
                        {t('booking.vipcombo.simultaneous') || 'VIP Combo (simultaneous)'}
                      </p>
                      <h5 className="mb-0 text-warning">
                        {(() => {
                          // Los removal add-ons se hacen con el primer servicio
                          const removalTime = removalAddOns
                            .filter(r => selectedRemovalIds.includes(r.id))
                            .reduce((sum, r) => sum + (r.additionalTime || 0), 0);
                          
                          // Calcular duración de cada servicio con sus add-ons
                          const serviceDurations = selectedServices.map((s, idx) => {
                            const serviceTime = s.service.duration + 
                              s.addOns.reduce((sum, a) => sum + (a.additionalTime || 0), 0);
                            // Agregar removals solo al primer servicio
                            return idx === 0 ? serviceTime + removalTime : serviceTime;
                          });
                          
                          // En paralelo, el tiempo total es el del servicio más largo
                          return Math.max(...serviceDurations);
                        })()} {t('booking.minutes') || 'min'}
                      </h5>
                    </div>
                  </Col>
                </Row>

                <Alert color="warning" className="mt-3 mb-0 small">
                  <i className="ri-information-line me-1"></i>
                  {t('booking.vipcombo.note') || 'Note: VIP Combo requires two available professionals at the same time'}
                </Alert>
              </CardBody>
            </Card>

            <Row className="mt-4">
              <Col md={6} className="mb-2">
                <Button
                  color="warning"
                  block
                  onClick={() => {
                    setIsVIPCombo(true);
                    setUserConfirmedVIPChoice(true); // User made explicit choice
                    goToNextStep();
                  }}
                >
                  <i className="ri-star-fill me-2"></i>
                  {t('booking.vipcombo.yes_combo') || 'Yes, VIP Combo'}
                </Button>
              </Col>
              <Col md={6}>
                <Button
                  color="secondary"
                  outline
                  block
                  onClick={() => {
                    setIsVIPCombo(false);
                    setUserConfirmedVIPChoice(true); // User made explicit choice
                    goToNextStep();
                  }}
                >
                  {t('booking.vipcombo.no_consecutive') || 'No, Consecutive'}
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {/* PASO 5: STAFF SELECTION (para todos los servicios) */}
        {step === 'staff' && !loading && requiresStaffStep && (
          <div>
            <h5 className="mb-3">{t('booking.staff.title') || 'Select Professional'}</h5>
            
            {selectedServices.map(({ service, addOns: serviceAddOns, staffId, staffName }, idx) => {
              
              // Calcular duración total incluyendo add-ons y removals (solo para el primer servicio)
              const addOnsDuration = serviceAddOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
              const removalsDuration = idx === 0 
                ? removalAddOns.filter(r => selectedRemovalIds.includes(r.id)).reduce((sum, r) => sum + (r.additionalTime || 0), 0)
                : 0;
              const totalDuration = service.duration + addOnsDuration + removalsDuration;
              
              return (
                <Card key={service.id} className="border mb-3">
                  <CardBody>
                    <div className="d-flex align-items-center mb-3">
                      <Badge color="info" className="me-2">{idx + 1}</Badge>
                      <div className="flex-grow-1">
                        <h6 className="mb-0">{service.name}</h6>
                        <small className="text-muted">
                          {totalDuration} min 
                          {(addOnsDuration > 0 || removalsDuration > 0) && (
                            <span>
                              ({service.duration}
                              {addOnsDuration > 0 && ` + ${addOnsDuration} add-ons`}
                              {removalsDuration > 0 && ` + ${removalsDuration} removal`})
                            </span>
                          )} - ${service.price}
                        </small>
                      </div>
                      {staffName && (
                        <Badge color="success">
                          <i className="ri-check-line me-1"></i>
                          {t('booking.staff.assigned') || 'Assigned'}
                        </Badge>
                      )}
                    </div>

                    <FormGroup className="mb-0">
                      <Label>{t('booking.staff.select_professional') || 'Select Professional'}: *</Label>
                      <Input
                        type="select"
                        value={staffId || ''}
                        onChange={(e) => assignStaff(service.id, e.target.value)}
                      >
                        <option value="">{t('booking.staff.select_option') || 'Select a professional...'}</option>
                        <option value="any">
                          {t('booking.staff.any_available') || 'Any Available Technician'}
                        </option>
                        {staff
                          .filter(s => s.isActive && s.isAvailable)
                          .map(s => {
                            const workload = staffWorkloads.find(w => w.id === s.id);
                            const workloadText = workload 
                              ? ` (${workload.workloadMinutes} ${t('booking.minutes') || 'min'} ${t('booking.staff.busy') || 'busy'})` 
                              : '';
                            return (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName}{workloadText}
                              </option>
                            );
                          })}
                      </Input>
                      {staffName && (
                        <small className="text-success mt-2 d-block">
                          <i className="ri-check-line me-1"></i>
                          {staffName}
                        </small>
                      )}
                    </FormGroup>
                  </CardBody>
                </Card>
              );
            })}

            <Alert color="info" className="small">
              <i className="ri-information-line me-2"></i>
              {isVIPCombo 
                ? (t('booking.staff.vip_note') || 'For VIP Combo, select different professionals for each service to enable simultaneous execution')
                : 'Asigne un técnico a cada servicio. Los servicios se realizarán de forma consecutiva.'
              }
            </Alert>
          </div>
        )}

        {/* PASO 6: FECHA Y HORA */}
        {step === 'datetime' && !loading && (
          <div>
            <h5 className="mb-3">{t('booking.datetime.title') || 'Select Date and Time'}</h5>

            {/* Resumen de selección */}
            <Card className="border mb-3 bg-light">
              <CardBody>
                <h6 className="mb-3">{t('booking.summary.title')}</h6>
                <div className="mb-2">
                  <strong>{t('booking.summary.services', { count: selectedServices.length })}</strong>
                  <ul className="mb-0 mt-1">
                    {selectedServices.map(({ service, addOns, staffName }, idx) => (
                      <li key={service.id}>
                        {service.name} - {t('booking.summary.duration', { duration: service.duration })}
                        {addOns.length > 0 && (
                          <span className="text-muted small"> + {t('booking.summary.addons', { count: addOns.length })}</span>
                        )}
                        {staffName && (
                          <span className="text-success small"> - {staffName}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedRemovalIds.length > 0 && (
                  <div className="mb-2">
                    <strong>{t('booking.summary.removals', { count: selectedRemovalIds.length })}</strong>
                    <ul className="mb-0 mt-1">
                      {removalAddOns.filter(r => selectedRemovalIds.includes(r.id)).map(removal => (
                        <li key={removal.id}>
                          {removal.name} - {t('booking.summary.duration', { duration: removal.additionalTime || 0 })} - ${removal.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 pt-3 border-top">
                  <strong>{t('booking.summary.total_duration')}</strong> {totals.totalDuration} min | 
                  <strong className="ms-2">{t('booking.summary.total_price')}</strong> ${totals.totalPrice}
                </div>
              </CardBody>
            </Card>

            <Card className="border mb-3">
              <CardHeader className="bg-light">
                <h6 className="mb-0">
                  <i className="ri-calendar-line me-2"></i>
                  {t('booking.datetime.select_date') || 'Select Week'}
                </h6>
              </CardHeader>
              <CardBody>
                {/* Vista de semana */}
                <div className="week-view">
                  <Row className="mb-3">
                    {/* Generar 7 días desde weekStartDate */}
                    {Array.from({ length: 7 }).map((_, dayOffset) => {
                      const date = moment(weekStartDate).add(dayOffset, 'days');
                      const isDisabled = date.day() === 0; // Domingo
                      const isSelected = selectedDate && moment(selectedDate).isSame(date, 'day');
                      const isToday = date.isSame(moment(), 'day');
                      
                      return (
                        <Col key={dayOffset} className="text-center mb-2">
                          <button
                            type="button"
                            className={`calendar-chip${isSelected ? ' selected' : ''}`}
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedDate(date.toDate());
                              setSelectedTime(null);
                            }}
                            style={{ minHeight: '80px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}
                          >
                            <span className="text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>
                              {date.format('ddd')}
                            </span>
                            <span className="h4 mb-0">
                              {date.format('D')}
                            </span>
                            <span className="small" style={{ fontSize: '0.7rem' }}>
                              {date.format('MMM')}
                            </span>
                          </button>
                        </Col>
                      );
                    })}
                  </Row>
                  
                  {/* Botones de navegación de semana */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => {
                        // Retroceder 7 días
                        const newWeekStart = moment(weekStartDate).subtract(7, 'days');
                        if (newWeekStart.isSameOrAfter(moment(), 'day')) {
                          setWeekStartDate(newWeekStart.toDate());
                          setSelectedTime(null);
                        }
                      }}
                      disabled={moment(weekStartDate).subtract(7, 'days').isBefore(moment(), 'day')}
                    >
                      <i className="ri-arrow-left-s-line"></i> {t('booking.datetime.prev_week')}
                    </Button>
                    <span className="text-muted small">
                      {moment(weekStartDate).format('MMMM YYYY')}
                    </span>
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => {
                        // Avanzar 7 días
                        const newWeekStart = moment(weekStartDate).add(7, 'days');
                        setWeekStartDate(newWeekStart.toDate());
                        setSelectedTime(null);
                      }}
                    >
                      {t('booking.datetime.next_week')} <i className="ri-arrow-right-s-line"></i>
                    </Button>
                  </div>
                </div>
                
                {selectedDate && (
                  <Alert color="info" className="mb-0 small">
                    <i className="ri-information-line me-1"></i>
                    {t('booking.datetime.date_selected') || 'Selected'}: <strong>{moment(selectedDate).format('dddd, MMMM D, YYYY')}</strong>
                  </Alert>
                )}
              </CardBody>
            </Card>

            {selectedDate && (
              <Card className="border mb-3">
                <CardHeader className="bg-light">
                  <h6 className="mb-0">
                    <i className="ri-time-line me-2"></i>
                    {t('booking.datetime.available_times') || 'Available Times'}
                  </h6>
                </CardHeader>
                <CardBody>
                  {selectedServices.some(s => !s.staffId || s.staffId === 'any') ? (
                    <Alert color="info" className="mb-0">
                      <i className="ri-information-line me-1"></i>
                      {t('booking.datetime.select_specific_staff')}
                    </Alert>
                  ) : loadingSlots ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" size="sm" className="me-2" />
                      <span>{t('booking.datetime.loading_slots')}</span>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <Alert color="warning" className="mb-0">
                      <i className="ri-alert-line me-1"></i>
                      {t('booking.datetime.no_slots') || 'No hay horarios disponibles para la fecha seleccionada con los técnicos asignados'}
                    </Alert>
                  ) : (
                    <>
                      {/* Morning Slots */}
                      {timeSlots.filter(s => {
                        const hour = parseInt(s.time.split(':')[0]);
                        return hour < 12;
                      }).length > 0 && (
                        <div className="mb-3">
                          <p className="small text-muted mb-2">
                            <i className="ri-sun-line me-1"></i>
                            {t('booking.datetime.morning') || 'Morning'}
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            {timeSlots
                              .filter(s => {
                                const hour = parseInt(s.time.split(':')[0]);
                                return hour < 12;
                              })
                              .map(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  className={`calendar-chip${selectedTime === slot.time ? ' selected' : ''}`}
                                  disabled={!slot.available}
                                  onClick={() => handleTimeSelect(slot.time)}
                                  style={{ minWidth: '80px' }}
                                >
                                  {slot.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Slots */}
                      {timeSlots.filter(s => {
                        const hour = parseInt(s.time.split(':')[0]);
                        return hour >= 12 && hour < 17;
                      }).length > 0 && (
                        <div className="mb-3">
                          <p className="small text-muted mb-2">
                            <i className="ri-sun-cloudy-line me-1"></i>
                            {t('booking.datetime.afternoon') || 'Afternoon'}
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            {timeSlots
                              .filter(s => {
                                const hour = parseInt(s.time.split(':')[0]);
                                return hour >= 12 && hour < 17;
                              })
                              .map(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  className={`calendar-chip${selectedTime === slot.time ? ' selected' : ''}`}
                                  disabled={!slot.available}
                                  onClick={() => handleTimeSelect(slot.time)}
                                  style={{ minWidth: '80px' }}
                                >
                                  {slot.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Evening Slots */}
                      {timeSlots.filter(s => {
                        const hour = parseInt(s.time.split(':')[0]);
                        return hour >= 17;
                      }).length > 0 && (
                        <div>
                          <p className="small text-muted mb-2">
                            <i className="ri-moon-line me-1"></i>
                            {t('booking.datetime.evening') || 'Evening'}
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            {timeSlots
                              .filter(s => {
                                const hour = parseInt(s.time.split(':')[0]);
                                return hour >= 17;
                              })
                              .map(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  className={`calendar-chip${selectedTime === slot.time ? ' selected' : ''}`}
                                  disabled={!slot.available}
                                  onClick={() => handleTimeSelect(slot.time)}
                                  style={{ minWidth: '80px' }}
                                >
                                  {slot.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            )}

            {selectedDate && selectedTime && (
              <>
                <Card className="border mb-3">
                  <CardBody>
                    <h6>{t('booking.datetime.summary_title')}</h6>
                    <p className="mb-1">
                      <strong>{t('booking.datetime.summary_date')}</strong> {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                    </p>
                    <p className="mb-1">
                      <strong>{t('booking.datetime.summary_start_time')}</strong> {moment(selectedTime, 'HH:mm:ss').format('h:mm A')}
                    </p>
                    <p className="mb-1">
                      <strong>{t('booking.datetime.summary_total_duration')}</strong> {totals.totalDuration} {t('booking.datetime.summary_minutes')}
                    </p>
                    <p className="mb-1">
                      <strong>{t('booking.datetime.summary_mode')}</strong>{' '}
                      <Badge color={isVIPCombo ? 'warning' : 'info'}>
                        {isVIPCombo ? t('booking.datetime.summary_vip_combo') : t('booking.datetime.summary_consecutive')}
                      </Badge>
                    </p>
                    <p className="mb-0">
                      <strong>{t('booking.datetime.summary_estimated_end')}</strong>{' '}
                      {isVIPCombo
                        ? moment(selectedTime, 'HH:mm:ss')
                            .add(Math.max(...selectedServices.map(s => 
                              s.service.duration + s.addOns.reduce((sum, a) => sum + (a.additionalTime || 0), 0)
                            )), 'minutes')
                            .format('h:mm A')
                        : moment(selectedTime, 'HH:mm:ss')
                            .add(totals.totalDuration, 'minutes')
                            .format('h:mm A')}
                    </p>
                  </CardBody>
                </Card>

                {/* Botón de verificación */}
                <div className="mb-3">
                  <Button
                    color={slotVerified ? 'success' : 'warning'}
                    block
                    onClick={verifySlotAvailability}
                    disabled={verifying || selectedServices.some(s => !s.staffId)}
                  >
                    {verifying ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {t('booking.datetime.verifying')}
                      </>
                    ) : slotVerified ? (
                      <>
                        <i className="ri-check-double-line me-2"></i>
                        {t('booking.datetime.verified')}
                      </>
                    ) : (
                      <>
                        <i className="ri-shield-check-line me-2"></i>
                        {t('booking.datetime.verify_button')}
                      </>
                    )}
                  </Button>
                  {selectedServices.some(s => !s.staffId) && (
                    <small className="text-danger d-block mt-1">
                      {t('booking.datetime.assign_staff_first')}
                    </small>
                  )}
                  {!slotVerified && !selectedServices.some(s => !s.staffId) && (
                    <Alert color="warning" className="mt-2 mb-0 small">
                      <i className="ri-alert-line me-1"></i>
                      {t('booking.datetime.verify_required_alert')}
                    </Alert>
                  )}
                </div>
              </>
            )}

            <FormGroup className="mt-3">
              <Label>{t('booking.datetime.additional_notes')}</Label>
              <Input
                type="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.datetime.additional_notes_placeholder')}
              />
            </FormGroup>
          </div>
        )}

        {/* PASO 7: CONFIRMACIÓN */}
        {step === 'confirm' && !loading && (
          <div>
            <h5 className="mb-3">{t('booking.confirm.title')}</h5>
            
            <Card className="border">
              <CardBody>
                <h6 className="border-bottom pb-2 mb-3">{t('booking.confirm.customer_info')}</h6>
                <p className="mb-1">
                  <strong>{t('booking.confirm.customer_name')}</strong> {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                </p>
                <p className="mb-1">
                  <strong>{t('booking.confirm.customer_email')}</strong> {selectedCustomer?.email}
                </p>
                <p className="mb-3">
                  <strong>{t('booking.confirm.customer_phone')}</strong> {selectedCustomer?.phone}
                </p>

                <h6 className="border-bottom pb-2 mb-3">
                  {t('booking.confirm.services')}
                  {isVIPCombo && (
                    <Badge color="warning" className="ms-2">{t('booking.confirm.vip_combo_badge')}</Badge>
                  )}
                </h6>
                {selectedServices.map(({ service, addOns: serviceAddOns, staffId, staffName }, index) => {
                  return (
                    <div key={service.id} className="mb-3">
                      <p className="mb-1">
                        <strong>{index + 1}. {service.name}</strong>
                      </p>
                      <p className="mb-1 ms-3">
                        {t('booking.confirm.service_duration_price', { duration: service.duration, price: service.price })}
                      </p>
                      {serviceAddOns.length > 0 && (
                        <p className="mb-1 ms-3">
                          {t('booking.confirm.addons')}: {serviceAddOns.map(a => a.name).join(', ')}
                        </p>
                      )}
                      <p className="mb-0 ms-3">
                        {t('booking.confirm.technician')}: {staffName || t('booking.confirm.unassigned')}
                        {isVIPCombo && index > 0 && (
                          <Badge color="warning" className="ms-2">{t('booking.confirm.simultaneous')}</Badge>
                        )}
                      </p>
                    </div>
                  );
                })}
                
                {/* Mostrar removal add-ons si hay seleccionados */}
                {selectedRemovalIds.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong><i className="ri-delete-bin-line me-1"></i> {t('booking.confirm.removal_services')}</strong>
                    </p>
                    <div className="ms-3">
                      {removalAddOns
                        .filter(r => selectedRemovalIds.includes(r.id))
                        .map(removal => (
                          <p key={removal.id} className="mb-1">
                            {removal.name} (+${removal.price}, +{removal.additionalTime || 0} {t('booking.datetime.summary_minutes')})
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                <h6 className="border-bottom pb-2 mb-3 mt-4">{t('booking.confirm.date_time')}</h6>
                <p className="mb-1">
                  <strong>{t('booking.datetime.summary_date')}</strong> {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                </p>
                <p className="mb-1">
                  <strong>{t('booking.datetime.summary_start_time')}</strong> {moment(selectedTime, 'HH:mm:ss').format('h:mm A')}
                </p>
                <p className="mb-1">
                  <strong>{t('booking.datetime.summary_mode')}</strong>{' '}
                  <Badge color={isVIPCombo ? 'warning' : 'info'}>
                    {isVIPCombo ? t('booking.datetime.summary_vip_combo') : t('booking.datetime.summary_consecutive')}
                  </Badge>
                </p>
                <p className="mb-3">
                  <strong>{t('booking.datetime.summary_total_duration')}</strong> {totals.totalDuration} {t('booking.datetime.summary_minutes')}
                </p>

                {notes && (
                  <>
                    <h6 className="border-bottom pb-2 mb-3">{t('booking.confirm.notes')}</h6>
                    <p className="mb-3">{notes}</p>
                  </>
                )}

                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{t('booking.confirm.total')}</h5>
                    <h4 className="mb-0 text-primary">${totals.totalPrice.toFixed(2)}</h4>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Alert color={isVIPCombo ? 'warning' : 'info'} className="mt-3 mb-0">
              <i className={`${isVIPCombo ? 'ri-star-fill' : 'ri-alert-line'} me-1`} />
              {isVIPCombo 
                ? t('booking.services.vip_combo_info')
                : t('booking.services.consecutive_info')}
            </Alert>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step !== 'customer' && (
          <Button color="secondary" onClick={goToPreviousStep} disabled={loading || verifying}>
            <i className="ri-arrow-left-line me-1" />
            {t('booking.button.back')}
          </Button>
        )}

        {step !== 'confirm' ? (
          <Button color="primary" onClick={goToNextStep} disabled={loading || verifying}>
            {t('booking.button.next')}
            <i className="ri-arrow-right-line ms-1" />
          </Button>
        ) : (
          <Button color="success" onClick={handleCreateBooking} disabled={loading || verifying}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-1" />
                {t('booking.confirm.creating')}
              </>
            ) : (
              <>
                <i className="ri-check-line me-1" />
                {t('booking.confirm.create_button')} {isVIPCombo && '(VIP Combo)'}
              </>
            )}
          </Button>
        )}

        <Button color="danger" outline onClick={handleClose} disabled={loading || verifying}>
          {t('booking.button.cancel')}
        </Button>
      </ModalFooter>
    </Modal>

      {/* MODAL POPUP: REMOVAL SELECTION */}
      <Modal isOpen={showRemovalModal} toggle={() => {}} size="lg" backdrop="static">
      <ModalHeader>
        <h5 className="mb-0">
          <i className="ri-eraser-line me-2" />
          {t('booking.removal.title') || 'Do You Need Removal?'}
        </h5>
      </ModalHeader>
      <ModalBody>
        {loadingRemovals ? (
          <div className="text-center py-4">
            <Spinner color="primary" />
            <p className="mt-2 text-muted">Loading removal options...</p>
          </div>
        ) : removalAddOns.length === 0 ? (
          <Alert color="info">
            <i className="ri-information-line me-2" />
            {t('booking.removal.no_removals_available') || 'No removal services available for your selected services'}
          </Alert>
        ) : (
          <div>
            {removalAddOns.map(removal => {
              const isSelected = selectedRemovalIds.includes(removal.id);
              const isIncompatible = hasMultipleCategories && 
                incompatibleRemovalIds.includes(removal.id) && 
                !isSelected;
              
              const handleToggle = async () => {
                if (isIncompatible) return;

                if (hasMultipleCategories) {
                  // Checkbox behavior: multiple selection
                  if (isSelected) {
                    // Remove
                    setSelectedRemovalIds(prev => prev.filter(id => id !== removal.id));
                  } else {
                    // Before adding, check incompatibilities
                    try {
                      const incompatibles = await getIncompatibleAddOns([removal.id]);
                      const hasConflict = selectedRemovalIds.some(id => incompatibles.includes(id));
                      
                      if (hasConflict) {
                        toast.warning(t('booking.removal.incompatible_warning') || 'This removal is incompatible with your current selection');
                        return;
                      }
                      
                      setSelectedRemovalIds(prev => [...prev, removal.id]);
                    } catch (error) {
                      console.error('Error checking incompatibilities:', error);
                    }
                  }
                } else {
                  // Radio behavior: single selection
                  if (isSelected) {
                    setSelectedRemovalIds([]);
                  } else {
                    setSelectedRemovalIds([removal.id]);
                  }
                }
              };
              
              return (
                <div
                  key={removal.id}
                  className={`border rounded p-3 mb-2 ${
                    isSelected ? 'border-success bg-success bg-opacity-10' : ''
                  } ${isIncompatible ? 'opacity-50' : ''}`}
                  style={{ 
                    cursor: isIncompatible ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                  onClick={!isIncompatible ? handleToggle : undefined}
                >
                  {isIncompatible && (
                    <Badge color="warning" className="position-absolute top-0 end-0 m-2">
                      {t('booking.removal.incompatible') || 'Incompatible'}
                    </Badge>
                  )}
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="form-check mb-0">
                      <Input
                        type={hasMultipleCategories ? 'checkbox' : 'radio'}
                        name="removal-selection"
                        className="form-check-input"
                        checked={isSelected}
                        disabled={isIncompatible}
                        onChange={handleToggle}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label className="form-check-label mb-0">
                        <strong>{removal.name}</strong>
                        {removal.description && (
                          <small className="text-muted d-block">{removal.description}</small>
                        )}
                      </Label>
                    </div>
                    <div className="text-end">
                      <div className="text-success fw-bold">${removal.price}</div>
                      {removal.additionalTime && (
                        <small className="text-muted">+{removal.additionalTime} min</small>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMultipleCategories && selectedRemovalIds.length > 0 && (
              <Alert color="info" className="mt-3 small mb-0">
                <i className="ri-information-line me-1"></i>
                {t('booking.removal.multiple_selection_note') || 'You can select multiple removals. Incompatible options are disabled.'}
              </Alert>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          color="secondary"
          outline
          onClick={() => {
            setSelectedRemovalIds([]);
            handleRemovalModalContinue();
          }}
        >
          <i className="ri-close-line me-1" />
          {t('booking.removal.no_removal_needed') || 'NO REMOVAL NEEDED'}
        </Button>
        <Button color="primary" onClick={handleRemovalModalContinue}>
          {t('booking.button.continue') || 'Continue'}
          <i className="ri-arrow-right-line ms-1" />
        </Button>
      </ModalFooter>
    </Modal>
    </>
  );
};

export default CreateBookingModal;
