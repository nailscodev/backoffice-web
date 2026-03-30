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
import { useSelector } from 'react-redux';

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
  preselectedDate?: Date;
  preselectedTime?: string;
  preselectedStaffId?: string;
  restrictToOneService?: boolean;
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
  preselectedDate,
  preselectedTime,
  preselectedStaffId,
  restrictToOneService = false,
}) => {
  const { t, i18n } = useTranslation();
  
  // Selector para obtener el usuario actual
  const user = useSelector((state: any) => state.Login?.user);
  
  // Determinar si el usuario es staff
  const isStaffUser = user && user.role === 'staff';
  
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
  
  // Variable para saber si el tiempo viene preseleccionado del calendario
  const [hasPreselectedTime, setHasPreselectedTime] = useState(false);
  
  // Control mejorado de días válidos basado en intersección de horarios reales
  const [validWorkingDays, setValidWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [loadingValidDays, setLoadingValidDays] = useState(false);
  
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
      const currentLang = (i18n.language?.toUpperCase() === 'SP' || i18n.language?.toUpperCase() === 'ES') ? 'ES' : 'EN';

      const [customersData, servicesData, categoriesData, addOnsData, staffData] = await Promise.all([
        getCustomers(),
        getServices(1, 100, undefined, undefined, undefined, currentLang), // No filtrar por isActive
        getCategories(currentLang),
        getAddOns(1, 100, true, undefined, undefined, currentLang),
        getStaffList(),
      ]);



      console.log('Customers loaded:', customersData);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      // Filtrar servicios activos en el frontend para tener control total
      const activeServices = servicesData?.filter((service: Service) => service.isActive === true) || [];
      console.log('Services loaded - Total:', servicesData?.length, 'Active:', activeServices.length);
      setServices(activeServices);
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

  // Manejar valores preseleccionados del calendario
  useEffect(() => {
    if (isOpen && preselectedDate) {
      setSelectedDate(preselectedDate);
      // Si viene del calendario con tiempo preseleccionado, guardarlo pero no saltear customer step
      if (preselectedTime) {
        // Normalize preselected time format to match backend slots
        const normalizedTime = normalizeTimeFormat(preselectedTime);
        setSelectedTime(normalizedTime);
        setHasPreselectedTime(true); // Marcar que tiene tiempo preseleccionado
        // Siempre empezar por customer step, incluso cuando viene del calendario
        setStep('customer');
      } else {
        setStep('customer');
      }
    }
  }, [isOpen, preselectedDate, preselectedTime]);

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
        toast.error(t('booking.toast.customer_created_error'));
      } finally {
        setLoading(false);
      }
    },
  });

  // Helper function para calcular precio con service fee del 6%
  const calculatePriceWithServiceFee = (basePrice: number): number => {
    return Math.round((basePrice * 1.06) * 100) / 100; // 6% service fee, redondeado a 2 decimales
  };

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

    // Aplicar service fee del 6% al precio total
    const finalPrice = calculatePriceWithServiceFee(totalPrice);

    return { totalDuration, totalPrice: finalPrice };
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
    
    // Si hay staff preseleccionado del calendario, filtrar solo sus servicios
    let filteredServices = services ?? [];
    if (preselectedStaffId) {
      const preselectedStaff = staff.find(s => s.id === preselectedStaffId);
      if (preselectedStaff?.services) {
        // Filtrar solo los servicios que puede brindar el staff preseleccionado
        filteredServices = services.filter(service => 
          preselectedStaff.services?.some(staffService => staffService.id === service.id)
        );
      }
    }
    
    filteredServices.forEach(service => {
      const categoryId = service.categoryId;
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(service);
    });
    
    return grouped;
  }, [services, preselectedStaffId, staff]);

  // Detectar si es elegible para VIP Combo (2+ servicios)
  // IMPORTANT: Only auto-set VIP when user hasn't made explicit choice yet
  useEffect(() => {
    // If user already made their choice (passed through vipcombo step), respect it
    if (userConfirmedVIPChoice) {
      return;
    }
    
    if (selectedServices.length >= 2) {
      // Por defecto, NO es VIP combo hasta que el usuario lo seleccione explícitamente
      // setIsVIPCombo(false); // Mantener valor actual si no ha confirmado
    } else {
      setIsVIPCombo(false);
      // Reset user choice when services change to less than 2
      setUserConfirmedVIPChoice(false);
    }
  }, [selectedServices, userConfirmedVIPChoice]);

  // Validar fecha seleccionada cuando cambia el modo VIP/Consecutivo o los días válidos
  useEffect(() => {
    if (selectedDate && selectedServices.length > 1) {
      const selectedDayOfWeek = moment(selectedDate).day();
      
      // Si la fecha seleccionada ya no está disponible en los días válidos calculados
      if (!validWorkingDays.includes(selectedDayOfWeek)) {
        console.log(`⚠️ Selected date no longer available in ${isVIPCombo ? 'VIP' : 'Consecutive'} mode, resetting...`);
        setSelectedDate(null);
        setSelectedTime(null);
        setSlotVerified(false);
        toast.info(t(isVIPCombo ? 'booking.toast.date_reset_not_available_vip' : 'booking.toast.date_reset_not_available_consecutive'));
      }
    }
  }, [isVIPCombo, selectedServices, selectedDate, validWorkingDays]);

  // Manejar cambio de modo VIP/Consecutivo: ajustar staffIds apropiadamente
  useEffect(() => {
    if (selectedServices.length > 1) {
      if (isVIPCombo) {
        // Cambio a VIP Combo: servicios adicionales pueden tener 'any' staff
        const updatedServices = selectedServices.map((s, index) => {
          if (index > 0 && s.staffId !== 'any') {
            // Los servicios adicionales en VIP pueden ser 'any' para permitir técnicos diferentes
            return {
              ...s,
              staffId: 'any',
              staffName: t('booking.staff.any_available')
            };
          }
          return s;
        });
        
        if (JSON.stringify(updatedServices) !== JSON.stringify(selectedServices)) {
          setSelectedServices(updatedServices);
          setSelectedTime(null);
          setSlotVerified(false);
          toast.info(t('booking.toast.vip_mode_staff_reset'));
        }
      } else {
        // Cambio a Consecutivo: todos los servicios deben tener el mismo staff que el primero
        const firstStaffId = selectedServices[0].staffId;
        const firstStaffName = selectedServices[0].staffName;
        
        if (firstStaffId && firstStaffId !== 'any') {
          // Verificar que el primer staff puede hacer todos los servicios
          const firstStaff = staff.find(s => s.id === firstStaffId);
          const canDoAllServices = firstStaff && selectedServices.every(({ service }) => 
            firstStaff.services?.some(svc => svc.id === service.id)
          );
          
          if (canDoAllServices) {
            const updatedServices = selectedServices.map(s => ({
              ...s,
              staffId: firstStaffId,
              staffName: firstStaffName
            }));
            
            setSelectedServices(updatedServices);
            setSelectedTime(null);
            setSlotVerified(false);
            toast.info(t('booking.toast.consecutive_mode_same_staff'));
          } else {
            // Si el primer staff no puede hacer todos los servicios, resetear todos a sin asignar
            const updatedServices = selectedServices.map(s => ({
              ...s,
              staffId: undefined,
              staffName: undefined
            }));
            
            setSelectedServices(updatedServices);
            setSelectedTime(null);
            setSlotVerified(false);
            toast.warning(t('booking.toast.consecutive_mode_staff_incompatible'));
          }
        }
      }
    }
  }, [isVIPCombo, userConfirmedVIPChoice]); // Solo cuando cambia el modo, no en cada cambio de servicios

  // Helper: Obtener días laborables de los técnicos asignados
  const getAvailableWorkingDays = (): number[] => {
    if (selectedServices.length === 0) {
      // Si no hay servicios seleccionados, mostrar todos los días (excepto domingos por defecto)
      return [1, 2, 3, 4, 5, 6]; // Lunes a sábado
    }

    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };

    // Para un solo servicio, lógica simple
    if (selectedServices.length === 1) {
      const { service, staffId } = selectedServices[0];
      const serviceDaysSet = new Set<number>();
      
      if (staffId && staffId !== 'any') {
        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember?.workingDays) {
          staffMember.workingDays.forEach((day: string) => {
            const dayNum = dayMap[day];
            if (dayNum !== undefined) {
              serviceDaysSet.add(dayNum);
            }
          });
        }
      } else {
        // Para 'any' staff: días donde hay técnicos que pueden hacer este servicio
        staff.forEach(s => {
          if (s.isActive && s.isAvailable && s.workingDays) {
            const canDoService = s.services?.some(svc => svc.id === service.id);
            if (canDoService) {
              s.workingDays.forEach((day: string) => {
                const dayNum = dayMap[day];
                if (dayNum !== undefined) {
                  serviceDaysSet.add(dayNum);
                }
              });
            }
          }
        });
      }

      const finalDays: number[] = serviceDaysSet.size > 0 ? Array.from(serviceDaysSet) : [1, 2, 3, 4, 5, 6];

      return finalDays;
    }

    // Para múltiples servicios: considerar modo VIP o consecutivo
    console.log(`🎯 Multiple services mode: ${isVIPCombo ? 'VIP COMBO (PARALLEL)' : 'CONSECUTIVE'}`);

    if (isVIPCombo) {
      // VIP COMBO (PARALELO): Necesitamos técnicos diferentes disponibles EL MISMO DÍA
      console.log('🔄 VIP Mode: Finding days where ALL services can run simultaneously');
      
      let availableDays: Set<number> | null = null;
      
      selectedServices.forEach(({ service, staffId }, serviceIndex) => {
        const serviceDaysSet = new Set<number>();
        
        if (staffId && staffId !== 'any') {
          // Staff específico asignado
          const staffMember = staff.find(s => s.id === staffId);
          if (staffMember?.workingDays) {
            staffMember.workingDays.forEach((day: string) => {
              const dayNum = dayMap[day];
              if (dayNum !== undefined) {
                serviceDaysSet.add(dayNum);
              }
            });
          }
        } else {
          // Para 'any': días donde hay técnicos disponibles para este servicio específico
          staff.forEach(s => {
            if (s.isActive && s.isAvailable && s.workingDays) {
              const canDoService = s.services?.some(svc => svc.id === service.id);
              if (canDoService) {
                s.workingDays.forEach((day: string) => {
                  const dayNum = dayMap[day];
                  if (dayNum !== undefined) {
                    serviceDaysSet.add(dayNum);
                  }
                });
              }
            }
          });
        }

        // Para VIP: intersección - solo días donde TODOS los servicios pueden ser atendidos simultáneamente
        if (availableDays === null) {
          availableDays = new Set(serviceDaysSet);
        } else {
          availableDays = new Set(
            Array.from(availableDays).filter(day => serviceDaysSet.has(day))
          );
        }

        console.log(`🗓️ VIP Service ${serviceIndex + 1} (${service.name}) days:`, 
          Array.from(serviceDaysSet).map(d => Object.keys(dayMap)[d]));
        console.log(`🗓️ VIP intersection so far:`, 
          availableDays ? Array.from(availableDays).map(d => Object.keys(dayMap)[d]) : 'none');
      });

      const finalDays: number[] = availableDays && (availableDays as Set<number>).size > 0 
        ? Array.from(availableDays as Set<number>) 
        : [1, 2, 3, 4, 5, 6];


      return finalDays;
    } else {
      // CONSECUTIVO: MISMO TÉCNICO para todos los servicios
      console.log('🔄 Consecutive Mode: Finding days for same staff sequential services');
      
      // Verificar si hay un staff específico asignado al primer servicio
      const firstService = selectedServices[0];
      
      if (firstService.staffId && firstService.staffId !== 'any') {
        // Si hay staff específico asignado, usar solo sus días laborables
        console.log(`👨‍💼 Using assigned staff: ${firstService.staffName} (${firstService.staffId})`);
        
        const assignedStaff = staff.find(s => s.id === firstService.staffId);
        if (assignedStaff?.workingDays) {
          const staffDays = new Set<number>();
          assignedStaff.workingDays.forEach((day: string) => {
            const dayNum = dayMap[day];
            if (dayNum !== undefined) {
              staffDays.add(dayNum);
            }
          });
          
          // Verificar que el staff puede hacer TODOS los servicios
          const canDoAllServices = selectedServices.every(({ service }) => 
            assignedStaff.services?.some(svc => svc.id === service.id)
          );
          
          if (canDoAllServices) {
            console.log(`✅ Assigned staff can do all services on days:`, 
              Array.from(staffDays).map(d => Object.keys(dayMap)[d]));
            return Array.from(staffDays);
          } else {
            console.log(`❌ Assigned staff cannot do all services`);
            return []; // No hay días válidos si el staff no puede hacer todos los servicios
          }
        } else {
          // Si no tiene workingDays definidos, retornar días por defecto
          console.log(`⚠️ Assigned staff has no working days defined`);
          return [1, 2, 3, 4, 5, 6];
        }
      } else {
        // Si no hay staff asignado, buscar técnicos que puedan hacer TODOS los servicios
        console.log('🔍 Finding staff who can do ALL consecutive services');
        
        const viableDays = new Set<number>();
        
        // Para cada día de la semana, verificar si hay al menos un técnico 
        // que pueda hacer TODOS los servicios y que trabaje ese día
        [0, 1, 2, 3, 4, 5, 6].forEach(dayNum => {
          const dayName = Object.keys(dayMap)[dayNum] as string;
          
          // Buscar técnicos que trabajen este día
          const staffWorkingThisDay = staff.filter(s => 
            s.isActive && 
            s.isAvailable && 
            s.workingDays?.includes(dayName)
          );
          
          // Verificar si algún técnico puede hacer TODOS los servicios
          const hasStaffForAllServices = staffWorkingThisDay.some(staffMember => {
            return selectedServices.every(({ service }) => 
              staffMember.services?.some(svc => svc.id === service.id)
            );
          });
          
          if (hasStaffForAllServices) {
            viableDays.add(dayNum);
          }
        });
        
        const finalDays = Array.from(viableDays);
        console.log(`🗓️ Days with staff available for all consecutive services:`, 
          finalDays.map(d => Object.keys(dayMap)[d]));
        
        return finalDays.length > 0 ? finalDays : [1, 2, 3, 4, 5, 6];
      }
    }
  };

  // Helper function to normalize time format for comparison
  const normalizeTimeFormat = (time: string | null): string => {
    if (!time) return '';
    // If time has format HH:mm, add :00 seconds
    if (time.length === 5 && time.includes(':')) {
      return time + ':00';
    }
    // If time has format HH:mm:ss, keep as is
    return time;
  };

  // Helper function to check if a date is available (uses validWorkingDays for better accuracy)
  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = moment(date).day();
    const daysToCheck = selectedServices.length > 1 ? validWorkingDays : getAvailableWorkingDays();
    return daysToCheck.includes(dayOfWeek);
  };
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
          // Buscar staff por nombre completo ya que la API devuelve staffName
          const staffMember = staff.find(s => {
            const fullName = `${s.firstName} ${s.lastName}`;
            return fullName === booking.staffName;
          });
          
          if (staffMember) {
            const startTime = moment(booking.startTime, 'HH:mm:ss');
            const endTime = moment(booking.endTime, 'HH:mm:ss');
            const durationMinutes = endTime.diff(startTime, 'minutes');
            
            const currentWorkload = workloadMap.get(staffMember.id) || 0;
            workloadMap.set(staffMember.id, currentWorkload + durationMinutes);
          }
        }
      });

      // Convertir a array
      const workloads: StaffWorkload[] = Array.from(workloadMap.entries()).map(([id, minutes]) => {
        const staffMember = staff.find(s => s.id === id);
        return {
          id,
          name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : t('booking.staff.unknown'),
          workloadMinutes: minutes,
        };
      });

      setStaffWorkloads(workloads);
      
      // Filtrar staff que esté activo, disponible Y que trabaje en el día seleccionado
      const selectedDayName = moment(date).locale('en').format('ddd');
      setAvailableStaff(staff.filter(s => 
        s.isActive && 
        s.isAvailable && 
        s.workingDays?.includes(selectedDayName)
      ));
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

      // Verificar que todos los servicios tengan staff asignado (específico o 'any')
      const hasUnassignedStaff = selectedServices.some(s => !s.staffId);
      if (hasUnassignedStaff) {

        // No cargar slots hasta que se asigne staff (específico o 'any')
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        // Resetear slot verificado cuando se recargan los horarios
        setSlotVerified(false);
        const dateStr = moment(selectedDate).format('YYYY-MM-DD');

        // Verificar si hay servicios con 'any' staff
        const servicesWithAny = selectedServices.filter(s => s.staffId === 'any');
        const hasAnyStaff = servicesWithAny.length > 0;

        if (hasAnyStaff && !isVIPCombo && !isMultipleServicesFlow) {
          // Lógica para servicios con 'any' staff (solo en modo no-VIP)

          
          if (isMultipleServicesFlow) {
            // Para múltiples servicios con 'any': Cargar disponibilidad individual para cada servicio con 'any'
            // y luego combinar con los servicios que tienen staff específico

            
            const allSlotsPromises = selectedServices.map(async ({ service, addOns, staffId }, serviceIndex) => {


              const getServiceAvailabilitySlots = async (targetStaffId: string) => {
                try {
                  const servicesForStaff = [{
                    serviceId: service.id,
                    duration: service.duration,
                    bufferTime: service.bufferTime || 0,
                    staffId: targetStaffId,
                    addons: addOns.map(addon => ({
                      id: addon.id,
                      duration: addon.additionalTime || 0,
                    })),
                  }];

                  // Solo el primer servicio incluye removals
                  const removals = serviceIndex === 0 
                    ? removalAddOns
                        .filter(r => selectedRemovalIds.includes(r.id))
                        .map(removal => ({
                          id: removal.id,
                          duration: removal.additionalTime || 0,
                        }))
                    : [];
                  const timezoneOffset = new Date().getTimezoneOffset();

                  const response = await getBackofficeAvailability(servicesForStaff, removals, dateStr, false, timezoneOffset);

                  return response.data || response || [];
                } catch (error) {
                  console.error(`Error fetching slots for service ${service.name} with staff ${targetStaffId}:`, error);
                  return [];
                }
              };

              if (staffId === 'any') {
                // Para servicios con 'any', obtener slots de todos los técnicos que pueden hacer este servicio
                // y que trabajen en el día seleccionado
                const selectedDayName = moment(selectedDate).locale('en').format('ddd');



                
                const eligibleStaff = staff.filter(staffMember => 
                  staffMember.isActive &&
                  staffMember.isAvailable &&
                  staffMember.services?.some(svc => svc.id === service.id) &&
                  staffMember.workingDays?.includes(selectedDayName)
                );





                const allServiceSlotsPromises = eligibleStaff.map(staffMember => 
                  getServiceAvailabilitySlots(staffMember.id)
                );
                  
                  const allServiceResults = await Promise.all(allServiceSlotsPromises);
                  const serviceTimes = new Set<string>();
                



              } else {
                // Para servicios con staff específico, obtener slots de ese staff
                if (!staffId) {
                  console.error('Staff ID is undefined for specific staff service');
                  return [];
                }
                const slots = await getServiceAvailabilitySlots(staffId);
                return slots.map((slot: any) => slot.startTime);
              }
            });

            const allServiceResults = await Promise.all(allSlotsPromises);
            

            
            if (allServiceResults.length === 0) {
              setAvailableSlots([]);
              return;
            }

            // Comenzar con los slots del primer servicio
            let commonTimes = new Set<string>(allServiceResults[0]);
            
            // Intersección: mantener solo los horarios disponibles para TODOS los servicios
            for (let i = 1; i < allServiceResults.length; i++) {
              const serviceTimes = new Set<string>(allServiceResults[i]);
              commonTimes = new Set<string>(Array.from(commonTimes).filter(time => serviceTimes.has(time)));
            }

            // Crear slots combinados
            const combinedSlots = Array.from(commonTimes)
              .sort()
              .map(startTime => ({
                startTime,
                available: true
              }));


            setAvailableSlots(combinedSlots);
          } else {
            // Para un solo servicio con 'any': buscar staff que pueda hacer este servicio específico
            let allAvailableStaffIds = new Set<string>();
            
            const selectedDayName = moment(selectedDate).locale('en').format('ddd');
            
            selectedServices.forEach(({ service }) => {
              staff.forEach(staffMember => {
                if (
                  staffMember.isActive &&
                  staffMember.isAvailable &&
                  staffMember.services?.some(svc => svc.id === service.id) &&
                  staffMember.workingDays?.includes(selectedDayName)
                ) {
                  allAvailableStaffIds.add(staffMember.id);
                }
              });
            });

            const staffIds = Array.from(allAvailableStaffIds);




            // Hacer llamadas paralelas para cada staff member
            const allSlotsPromises = staffIds.map(async (staffId) => {
              try {

                const servicesForStaff = selectedServices.map(({ service, addOns }) => ({
                  serviceId: service.id,
                  duration: service.duration,
                  bufferTime: service.bufferTime || 0,
                  staffId: staffId,
                  addons: addOns.map(addon => ({
                    id: addon.id,
                    duration: addon.additionalTime || 0,
                  })),
                }));

                const removals = removalAddOns
                  .filter(r => selectedRemovalIds.includes(r.id))
                  .map(removal => ({
                    id: removal.id,
                    duration: removal.additionalTime || 0,
                  }));

                const timezoneOffset = new Date().getTimezoneOffset();
                const response = await getBackofficeAvailability(servicesForStaff, removals, dateStr, false, timezoneOffset);

                return response.data || response || [];
              } catch (error) {
                console.error(`Error fetching slots for staff ${staffId}:`, error);
                return [];
              }
            });

            const allResults = await Promise.all(allSlotsPromises);
            
            // Combinar todos los slots únicos (UNIÓN de disponibilidades)
            const availableTimes = new Set<string>();
            allResults.forEach(slots => {
              slots.forEach((slot: any) => {
                availableTimes.add(slot.startTime);
              });
            });

            // Crear slots combinados
            const combinedSlots = Array.from(availableTimes)
              .sort()
              .map(startTime => ({
                startTime,
                available: true
              }));


            setAvailableSlots(combinedSlots);
          }
        } else {
          // Lógica optimizada para múltiples servicios (VIP combo, consecutivos, o staff específicos)
          
          // Para modo consecutivo: verificar que todos los servicios tengan el mismo staff
          if (!isVIPCombo && selectedServices.length > 1) {
            const firstStaffId = selectedServices[0].staffId;
            const allSameStaff = selectedServices.every(s => s.staffId === firstStaffId);
            
            if (!allSameStaff || !firstStaffId || firstStaffId === 'any') {
              console.log('❌ Consecutive mode requires same staff for all services');
              toast.warning(t('booking.toast.consecutive_requires_same_staff'));
              setAvailableSlots([]);
              return;
            }
          }
          
          const services = selectedServices.map(({ service, addOns, staffId }) => ({
            serviceId: service.id,
            duration: service.duration,
            bufferTime: service.bufferTime || 0,
            staffId: staffId || 'any', // Permitir 'any' solo para VIP combo
            addons: addOns.map(addon => ({
              id: addon.id,
              duration: addon.additionalTime || 0,
            })),
          }));

          const removals = removalAddOns
            .filter(r => selectedRemovalIds.includes(r.id))
            .map(removal => ({
              id: removal.id,
              duration: removal.additionalTime || 0,
            }));

          const timezoneOffset = new Date().getTimezoneOffset();

          const response = await getBackofficeAvailability(services, removals, dateStr, isVIPCombo, timezoneOffset);
          const slots = response.data || response || [];
          

          setAvailableSlots(slots);
        }
      } catch (error) {
        console.error('Error loading available slots:', error);
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
      
      // Buscar el staff member para obtener su nombre completo
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) {
        console.error(`❌ Staff member not found: ${staffId}`);
        return false;
      }
      
      // Filtrar bookings del staff por nombre completo
      const staffFullName = `${staffMember.firstName} ${staffMember.lastName}`;
      console.log(`  🔍 Checking ${staffFullName} availability from ${startTime} to ${endTime}`);
      console.log(`  📋 Total bookings for date: ${bookings.length}`);
      
      const staffBookings = bookings.filter(
        (b: any) => b.staffName === staffFullName && b.status !== 'cancelled' && b.appointmentDate === bookingDate
      );
      
      console.log(`  📅 ${staffFullName} has ${staffBookings.length} bookings:`, 
        staffBookings.map(b => `${b.serviceName} ${b.startTime}-${b.endTime}`)
      );

      const requestStart = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm:ss');
      const requestEnd = moment(`${bookingDate} ${endTime}`, 'YYYY-MM-DD HH:mm:ss');

      for (const booking of staffBookings) {
        const bookingStart = moment(`${bookingDate} ${booking.startTime}`, 'YYYY-MM-DD HH:mm:ss');
        const bookingEnd = moment(`${bookingDate} ${booking.endTime}`, 'YYYY-MM-DD HH:mm:ss');

        // Check overlap
        if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
          console.log(`  ❌ ${staffFullName} has conflict with: ${booking.serviceName} ${booking.startTime}-${booking.endTime}`);
          return false;
        }
      }

      console.log(`  ✅ ${staffFullName} is AVAILABLE at ${startTime}-${endTime}`);
      return true;
    } catch (err) {
      console.error(`  ❌ Error checking availability for staff ${staffId}:`, err);
      return false;
    }
  };

  // Auto-asignar staff con menor workload que pueda hacer el servicio
  const autoAssignStaff = (service: Service): string | undefined => {
    // Filtrar staff que puede hacer este servicio específico
    const staffForService = availableStaff.filter(s => 
      s.services?.some(svc => svc.id === service.id)
    );

    if (staffForService.length === 0) {
      return undefined;
    }

    if (staffWorkloads.length === 0) {
      return staffForService[0]?.id;
    }

    // Encontrar staff con menor workload que pueda hacer el servicio
    const staffIdsForService = staffForService.map(s => s.id);
    const validWorkloads = staffWorkloads.filter(w => staffIdsForService.includes(w.id));
    
    if (validWorkloads.length === 0) {
      return staffForService[0]?.id;
    }

    const minWorkload = Math.min(...validWorkloads.map(w => w.workloadMinutes));
    const optimalStaff = validWorkloads.find(w => w.workloadMinutes === minWorkload);

    return optimalStaff?.id || staffForService[0]?.id;
  };

  // Agregar servicio
  const addService = (service: Service) => {
    if (selectedServices.find(s => s.service.id === service.id)) {
      toast.warning(t('booking.toast.service_already_added'));
      return;
    }

    // Si está restringido a un solo servicio (desde calendario), reemplazar el servicio existente
    if (restrictToOneService && selectedServices.length >= 1) {
      toast.info(t('booking.toast.service_replaced_single_mode'));
      const staffId = preselectedStaffId || undefined;
      const staffMember = preselectedStaffId ? staff.find(s => s.id === preselectedStaffId) : undefined;

      setSelectedServices([
        {
          service,
          addOns: [],
          staffId: staffId,
          staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : undefined,
        }
      ]);
      return;
    }

    const isFirstService = selectedServices.length === 0;
    const willBeConsecutive = selectedServices.length === 1 && !shouldShowVIPCombo;
    
    let newService;
    
    if (isFirstService) {
      // Primer servicio: usar preseleccionado del calendario o dejar sin asignar para selección manual
      const staffId = preselectedStaffId || undefined;
      const staffMember = preselectedStaffId ? staff.find(s => s.id === preselectedStaffId) : undefined;
      
      newService = {
        service,
        addOns: [],
        staffId: staffId,
        staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : undefined,
      };
    } else {
      // Para servicios adicionales: comportamiento diferente según el modo
      const firstService = selectedServices[0];
      
      if (willBeConsecutive) {
        // CONSECUTIVO: Mismo staff que el primer servicio (heredar)
        newService = {
          service,
          addOns: [],
          staffId: firstService.staffId, // Heredar del primer servicio
          staffName: firstService.staffName, // Heredar nombre también
        };
      } else {
        // VIP COMBO: Técnicos diferentes automáticamente 'any'
        newService = {
          service,
          addOns: [],
          staffId: 'any',
          staffName: t('booking.staff.any_available'),
        };
      }
    }

    const newSelectedServices = [...selectedServices, newService];
    
    // Resetear tiempo cuando se agrega segundo servicio
    if (!isFirstService) {
      setSelectedTime(null);
      setSlotVerified(false);
    }
    
    setSelectedServices(newSelectedServices);
  };

  // Remover servicio
  const removeService = (serviceId: string) => {
    const newSelectedServices = selectedServices.filter(s => s.service.id !== serviceId);
    setSelectedServices(newSelectedServices);
    
    // Resetear tiempo cuando cambian los servicios porque la disponibilidad puede cambiar
    setSelectedTime(null);
    setSlotVerified(false);
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

  // Asignar staff a un servicio específico
  const assignStaff = (serviceId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    // Resetear la verificación cuando cambia el staff
    setSlotVerified(false);
    // Resetear el tiempo cuando se cambia staff porque la disponibilidad cambia
    setSelectedTime(null);
    setHasPreselectedTime(false);
    
    const serviceIndex = selectedServices.findIndex(s => s.service.id === serviceId);
    const isFirstService = serviceIndex === 0;
    const isConsecutiveMode = selectedServices.length > 1 && !isVIPCombo;
    
    setSelectedServices(
      selectedServices.map((s, index) => {
        // En modo consecutivo: si se está asignando al primer servicio, 
        // también asignar a todos los servicios siguientes
        if (isConsecutiveMode && isFirstService) {
          return {
            ...s,
            staffId: staffId || undefined,
            staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : undefined,
          };
        } 
        // Para el servicio específico seleccionado
        else if (s.service.id === serviceId) {
          return {
            ...s,
            staffId: staffId || undefined,
            staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : undefined,
          };
        }
        return s; // Mantener otros servicios sin cambios
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
          toast.error(t('booking.toast.staff_missing_service', { service: service.name }));
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
          toast.error(t('booking.toast.staff_not_available', { service: service.name }));
          return false;
        }

        // Para consecutivo: mover al siguiente slot (buffer ya incluido en endTime)
        if (!isVIPCombo) {
          currentStartTime = moment(endTime);
        }
        // Para VIP Combo: mantener el mismo tiempo de inicio
      }

      setSlotVerified(true);
      toast.success(t('booking.toast.slots_verified'));
      return true;
    } catch (err) {
      console.error('Error verifying slots:', err);
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

    // Verificar que todos los servicios tengan staff asignado (específico, no 'any')
    const missingStaff = selectedServices.filter(s => !s.staffId || s.staffId === 'any');
    if (missingStaff.length > 0) {
      toast.error(t('booking.toast.any_staff_verify_first', { services: missingStaff.map(s => s.service.name).join(', ') }));
      return;
    }

    // Verificar que en modo consecutivo todos los servicios tengan el mismo staff
    if (!isVIPCombo && selectedServices.length > 1) {
      const firstStaffId = selectedServices[0].staffId;
      const allHaveSameStaff = selectedServices.every(s => s.staffId === firstStaffId);
      
      if (!allHaveSameStaff) {
        toast.error(t('booking.toast.consecutive_requires_same_staff_final'));
        return;
      }
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

        // Calcular el precio individual de este servicio incluyendo sus addons
        const basePriceWithAddons = service.price + allAddOns.reduce((sum, addon) => sum + addon.price, 0);
        // Aplicar service fee del 6% al precio individual del booking
        const serviceIndividualPrice = calculatePriceWithServiceFee(basePriceWithAddons);

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
          staffName: staffName || t('booking.staff.default_name'),
          appointmentDate,
          startTime: serviceStartTime.format('HH:mm:ss'),
          endTime: serviceEndTime.format('HH:mm:ss'),
          duration: totalDuration,
          addOnIds: allAddOns.map(a => a.id),
          status: 'in_progress', // Marcar como "en progreso" para reflejar que el servicio está activo desde el inicio
          totalPrice: serviceIndividualPrice,
          notes: index === 0 
            ? (notes || (isVIPCombo ? t('booking.notes.vip_combo') : '')) 
            : (isVIPCombo ? t('booking.notes.vip_combo_part', { index: index + 1 }) : t('booking.notes.consecutive_part', { index: index + 1, total: selectedServices.length })),
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


          createdBookings.push(response);
        }

        console.log(`\n🎉 SUCCESS: All ${createdBookings.length} bookings created!`);
        toast.success(
          t('booking.toast.booking_created_count', { 
            count: createdBookings.length, 
            combo: isVIPCombo ? ' (VIP Combo)' : '' 
          })
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
            t('booking.toast.rollback_warning', { count: createdBookings.length })
          );
        }

        throw bookingError;
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      const errorMsg = err.response?.data?.message || err.message || t('booking.notes.default_error');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handler para cuando se selecciona un horario
  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    setHasPreselectedTime(false); // Quitar la bandera al seleccionar manualmente
    // Resetear verificación cuando cambia el horario
    setSlotVerified(false);

    // Si hay servicios con "any" staff, auto-asignar con técnico óptimo
    const servicesWithAny = selectedServices.filter(s => s.staffId === 'any');
    
    if (servicesWithAny.length > 0 && selectedDate) {
      try {
        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
        const formattedTime = time.length > 5 ? time.substring(0, 5) : time;



        // Función helper para encontrar el técnico óptimo para un servicio específico
        const findOptimalStaff = async (service: any, addOns: any[], totalDuration: number) => {
          // Obtener el día de la semana de la fecha seleccionada
          const selectedDayName = moment(selectedDate).locale('en').format('ddd'); // Force English: Mon, Tue, Wed, etc.

          
          // 1. Obtener técnicos que pueden hacer este servicio Y trabajan en el día seleccionado
          console.log(`🔍 Evaluating staff for ${service.name} on ${selectedDayName}:`);
          console.log(`📋 Total staff available:`, staff.length);
          
          const eligibleStaff = staff.filter(staffMember => {
            const canDoService = staffMember.services?.some(svc => svc.id === service.id);
            const worksOnDay = staffMember.workingDays?.includes(selectedDayName);
            
            console.log(`👨‍💼 ${staffMember.firstName} ${staffMember.lastName}:`, {
              isActive: staffMember.isActive,
              isAvailable: staffMember.isAvailable,
              canDoService,
              worksOnDay,
              workingDays: staffMember.workingDays,
              services: staffMember.services?.map(s => s.name) || 'none'
            });
            
            return staffMember.isActive &&
              staffMember.isAvailable &&
              canDoService &&
              worksOnDay;
          });

          if (eligibleStaff.length === 0) {
            console.log(`❌ No eligible staff found for ${service.name}`);
            return null;
          }

          console.log(`✅ Found ${eligibleStaff.length} eligible staff for ${service.name}`);

          // 2. Verificar disponibilidad en el horario específico y contar turnos del día
          const availableStaffWithBookingCount = [];
          
          console.log(`⏰ Checking availability for time ${formattedTime} on ${formattedDate}...`);
          
          for (const staffMember of eligibleStaff) {
            console.log(`\n🔍 Checking ${staffMember.firstName} ${staffMember.lastName}:`);
            
            // Verificar si está disponible en el horario específico
            const isAvailable = await isStaffAvailableAtTime(
              staffMember.id,
              formattedTime + ':00',
              moment(formattedTime, 'HH:mm').add(totalDuration, 'minutes').format('HH:mm:ss'),
              formattedDate
            );

            if (isAvailable) {
              // Obtener número de turnos del día usando getBookingsList
              console.log(`  ✅ ${staffMember.firstName} is available! Counting daily bookings...`);
              try {
                const dayBookings = await getBookingsList({
                  startDate: formattedDate,
                  endDate: formattedDate,
                  limit: 100
                  // Removemos el filtro staffId y status para obtener todos los bookings como en isStaffAvailableAtTime
                });
                
                console.log(`  📊 API returned ${dayBookings?.data?.length || 0} total bookings for the day`);
                
                // Filtrar por nombre completo ya que la API no maneja staffId en filtros
                const staffFullName = `${staffMember.firstName} ${staffMember.lastName}`;
                const filteredBookings = dayBookings?.data?.filter(
                  (booking: any) => {
                    const matches = booking.staffName === staffFullName && 
                                   booking.status !== 'cancelled' && 
                                   booking.appointmentDate === formattedDate;
                    if (matches) {
                      console.log(`    ➤ Found booking: ${booking.serviceName} ${booking.startTime}-${booking.endTime} (${booking.status})`);
                    }
                    return matches;
                  }
                ) || [];
                
                const bookingsCount = filteredBookings.length;
                
                availableStaffWithBookingCount.push({
                  staff: staffMember,
                  bookingsCount,
                });
                
                console.log(`📊 ${staffMember.firstName} ${staffMember.lastName}: ${bookingsCount} booking(s) today`);
                console.log(`  ➕ Added to available staff list (total so far: ${availableStaffWithBookingCount.length})`);
              } catch (error) {
                console.error(`Error getting bookings for ${staffMember.firstName}:`, error);
                // En caso de error, asumir 0 turnos para no excluir al staff
                availableStaffWithBookingCount.push({
                  staff: staffMember,
                  bookingsCount: 0,
                });
                console.log(`  ⚠️ Error occurred, added ${staffMember.firstName} with 0 bookings as fallback`);
              }
            } else {
              console.log(`❌ ${staffMember.firstName} not available at ${formattedTime}`);
            }
          }

          if (availableStaffWithBookingCount.length === 0) {
            console.log(`❌ No available staff found for ${service.name} at ${formattedTime}`);
            return null;
          }

          // 3. Seleccionar el técnico con menos turnos del día
          console.log(`\n🏆 Final selection from ${availableStaffWithBookingCount.length} available staff:`);
          availableStaffWithBookingCount.forEach(({ staff, bookingsCount }) => {
            console.log(`  - ${staff.firstName} ${staff.lastName}: ${bookingsCount} bookings`);
          });
          
          const optimalStaff = availableStaffWithBookingCount.reduce((min, current) => {
            console.log(`  🥊 Comparing: ${current.staff.firstName} (${current.bookingsCount}) vs ${min.staff.firstName} (${min.bookingsCount})`);
            return current.bookingsCount < min.bookingsCount ? current : min;
          });

          console.log(`✅ WINNER: ${optimalStaff.staff.firstName} ${optimalStaff.staff.lastName} with ${optimalStaff.bookingsCount} booking(s)`);
          console.log(`─────────────────────────────────────────────────────`);
          
          return {
            staffId: optimalStaff.staff.id,
            staffName: `${optimalStaff.staff.firstName} ${optimalStaff.staff.lastName}`,
            bookingsCount: optimalStaff.bookingsCount
          };
        };

        if (isMultipleServicesFlow) {
          // Para múltiples servicios
          if (isVIPCombo) {
            // VIP COMBO: auto-asignar individualmente cada servicio con 'any' evitando técnicos repetidos
            const updatedServices = [...selectedServices];
            const assignedStaffIds = new Set<string>();

            for (let i = 0; i < selectedServices.length; i++) {
              const { service, addOns, staffId, staffName } = selectedServices[i];
              
              if (staffId === 'any') {
                const addOnsDuration = addOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
                const removalsDuration = i === 0
                  ? removalAddOns.filter(r => selectedRemovalIds.includes(r.id)).reduce((sum, r) => sum + (r.additionalTime || 0), 0)
                  : 0;
                const totalDuration = service.duration + addOnsDuration + removalsDuration;

                console.log(`🔄 Finding optimal staff for "${service.name}" (${totalDuration} min) - VIP Combo mode`);

                const findOptimalStaffExcluding = async (excludeStaffIds: Set<string>) => {
                  const selectedDayName = moment(selectedDate).locale('en').format('ddd');
                  
                  const eligibleStaff = staff.filter(staffMember => {
                    const canDoService = staffMember.services?.some(svc => svc.id === service.id);
                    const worksOnDay = staffMember.workingDays?.includes(selectedDayName);
                    const notAlreadyAssigned = !excludeStaffIds.has(staffMember.id);
                    
                    return staffMember.isActive &&
                      staffMember.isAvailable &&
                      canDoService &&
                      worksOnDay &&
                      notAlreadyAssigned;
                  });

                  if (eligibleStaff.length === 0) {
                    console.log(`❌ No eligible unassigned staff found for ${service.name}`);
                    return null;
                  }

                  // Verificar disponibilidad y contar bookings como en findOptimalStaff original
                  const availableStaffWithBookingCount = [];
                  
                  for (const staffMember of eligibleStaff) {
                    const isAvailable = await isStaffAvailableAtTime(
                      staffMember.id,
                      formattedTime + ':00',
                      moment(formattedTime, 'HH:mm').add(totalDuration, 'minutes').format('HH:mm:ss'),
                      formattedDate
                    );

                    if (isAvailable) {
                      try {
                        const bookingsResponse = await getBookingsList({
                          startDate: formattedDate,
                          endDate: formattedDate,
                          limit: 100,
                        });
                        const bookings = bookingsResponse.data || [];
                        const staffFullName = `${staffMember.firstName} ${staffMember.lastName}`;
                        const staffBookingsCount = bookings.filter(
                          (b: any) => b.staffName === staffFullName && b.status !== 'cancelled' && b.appointmentDate === formattedDate
                        ).length;

                        availableStaffWithBookingCount.push({
                          staff: staffMember,
                          bookingsCount: staffBookingsCount
                        });
                      } catch (error) {
                        console.error(`Error counting bookings for ${staffMember.firstName}:`, error);
                        availableStaffWithBookingCount.push({
                          staff: staffMember,
                          bookingsCount: 0
                        });
                      }
                    }
                  }

                  if (availableStaffWithBookingCount.length === 0) {
                    console.log(`❌ No available unassigned staff found for ${service.name} at ${formattedTime}`);
                    return null;
                  }

                  const optimalStaff = availableStaffWithBookingCount.reduce((min, current) => {
                    return current.bookingsCount < min.bookingsCount ? current : min;
                  });
                  
                  return {
                    staffId: optimalStaff.staff.id,
                    staffName: `${optimalStaff.staff.firstName} ${optimalStaff.staff.lastName}`,
                    bookingsCount: optimalStaff.bookingsCount
                  };
                };

                const optimalAssignment = await findOptimalStaffExcluding(assignedStaffIds);
                
                if (optimalAssignment) {
                  updatedServices[i] = {
                    service,
                    addOns,
                    staffId: optimalAssignment.staffId,
                    staffName: optimalAssignment.staffName
                  };
                  assignedStaffIds.add(optimalAssignment.staffId);
                } else {
                  toast.error(t('booking.toast.staff_assignment_failed', { service: service.name, time: formattedTime }));
                }
              }
            }

            setSelectedServices(updatedServices);
          } else {
            // MODO CONSECUTIVO: No auto-asignar 'any' staff - todos deben tener el mismo staff específico
            console.log(`ℹ️ Consecutive mode detected - skipping auto-assignment for 'any' staff`);
            console.log(`ℹ️ All services must have the same specific staff assigned manually`);
            
            // Verificar si todos tienen el mismo staff asignado
            const firstStaffId = selectedServices[0].staffId;
            const allHaveSameStaff = selectedServices.every(s => s.staffId === firstStaffId && s.staffId !== 'any');
            
            if (!allHaveSameStaff) {
              toast.warning(t('booking.toast.consecutive_assign_same_staff'));
              return;
            }
          }
        } else {
          // Para un solo servicio: lógica original con selección óptima
          const updatedServices = await Promise.all(
            selectedServices.map(async ({ service, addOns, staffId, staffName }, index) => {
              if (staffId === 'any') {
                const addOnsDuration = addOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
                const removalsDuration = index === 0
                  ? removalAddOns.filter(r => selectedRemovalIds.includes(r.id)).reduce((sum, r) => sum + (r.additionalTime || 0), 0)
                  : 0;
                const totalDuration = service.duration + addOnsDuration + removalsDuration;

                console.log(`🔄 Finding optimal staff for "${service.name}" (${totalDuration} min)`);

                const optimalAssignment = await findOptimalStaff(service, addOns, totalDuration);
                
                if (optimalAssignment) {
                  return {
                    service,
                    addOns,
                    staffId: optimalAssignment.staffId,
                    staffName: optimalAssignment.staffName
                  };
                } else {
                  toast.error(t('booking.toast.staff_assignment_failed', { service: service.name, time: formattedTime }));
                  return { service, addOns, staffId, staffName };
                }
              }

              return { service, addOns, staffId, staffName };
            })
          );

          setSelectedServices(updatedServices);
        }
      } catch (error) {
        console.error('❌ Error auto-assigning optimal staff:', error);
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
    setHasPreselectedTime(false); // Reset preselected time flag
    customerForm.resetForm();
    toggle();
  };

  // Helper: verificar si los servicios seleccionados requieren removal modal (solo manicura/pedicura)
  const requiresRemovalModal = useMemo(() => {
    const result = selectedServices.some(s => 
      s.service.categoryId === MANICURE_CATEGORY_ID || 
      s.service.categoryId === PEDICURE_CATEGORY_ID
    );

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

  // Helper: verificar si se necesita paso de staff
  const requiresStaffStep = useMemo(() => {
    return selectedServices.length > 0;
  }, [selectedServices]);

  // Helper: verificar si es selección de múltiples servicios (técnicos diferentes)
  const isMultipleServicesFlow = useMemo(() => {
    return selectedServices.length > 1;
  }, [selectedServices]);

  // Navegar entre pasos
  const goToNextStep = () => {
    if (step === 'customer' && !selectedCustomer) {
      toast.warning(t('booking.toast.select_or_create_customer'));
      return;
    }
    if (step === 'services' && selectedServices.length === 0) {
      toast.warning(t('booking.toast.select_at_least_one_service'));
      return;
    }
    if (step === 'staff' && requiresStaffStep) {
      if (isMultipleServicesFlow) {
        if (isVIPCombo) {
          // VIP Combo: verificar que el primer servicio tenga staff, el segundo puede ser 'any'
          const missingStaff = selectedServices.filter((s, idx) => idx === 0 && !s.staffId);
          if (missingStaff.length > 0) {
            toast.warning(t('booking.toast.assign_first_service_staff'));
            return;
          }
        } else {
          // Consecutivo: verificar que TODOS los servicios tengan el mismo staff específico
          const firstStaffId = selectedServices[0].staffId;
          const allHaveSameStaff = selectedServices.every(s => s.staffId === firstStaffId);
          
          if (!firstStaffId || firstStaffId === 'any' || !allHaveSameStaff) {
            toast.warning(t('booking.toast.consecutive_requires_staff_assignment'));
            return;
          }
        }
      } else {
        // Para un solo servicio, verificar normal
        const missingStaff = selectedServices.filter(s => !s.staffId);
        if (missingStaff.length > 0) {
          toast.warning(t('booking.toast.assign_staff_missing', { services: missingStaff.map(s => s.service.name).join(', ') }));
          return;
        }
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
        const currentLang = (i18n.language?.toUpperCase() === 'SP' || i18n.language?.toUpperCase() === 'ES') ? 'ES' : 'EN';
        console.log('📞 Calling getRemovalAddonsByServices with:', serviceIds, 'lang:', currentLang);
        const response = await getRemovalAddonsByServices(serviceIds, currentLang);
        console.log('📦 Raw response:', response);

        setRemovalAddOns(response || []);

      } catch (error) {
        console.error('Error loading removal add-ons:', error);
        setRemovalAddOns([]);
      } finally {
        setLoadingRemovals(false);
      }
    };
    
    loadRemovalAddOns();
  }, [selectedServices, i18n.language]);

  // Calcular días válidos basado en intersección real de horarios disponibles
  const calculateValidWorkingDays = async () => {
    if (selectedServices.length <= 1) {
      // Para un solo servicio o ninguno, usar lógica original
      const originalDays = getAvailableWorkingDays();
      setValidWorkingDays(originalDays);
      return;
    }

    try {
      setLoadingValidDays(true);
      console.log('🔄 Calculating valid working days with REAL availability intersection...');



      // Obtener días base donde ambos técnicos trabajan
      const baseDays = getAvailableWorkingDays();
      console.log('📅 Base working days:', baseDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]));

      if (baseDays.length === 0) {
        setValidWorkingDays([]);
        return;
      }

      const validDays: number[] = [];
      const dayMap: { [key: string]: number } = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
      };

      // Para cada día base, verificar si hay intersección real de horarios DISPONIBLES
      for (const dayNumber of baseDays) {
        const dayName = Object.keys(dayMap)[dayNumber] as string;
        console.log(`🗓️ Validating ${dayName} with REAL booking conflicts...`);

        // Usar fechas reales: próximas 4 semanas para este día de la semana
        const testDates = [];
        for (let week = 0; week < 4; week++) {
          let testDate = moment().day(dayNumber).add(week, 'week');
          if (testDate.isBefore(moment(), 'day')) {
            continue; // Saltar fechas pasadas
          }
          testDates.push(testDate);
          if (testDates.length >= 2) break; // Solo necesitamos algunas muestras
        }

        if (testDates.length === 0) {
          console.log(`⚠️ ${dayName}: No future dates available for testing`);
          continue;
        }

        let dayIsValid = false;

        // Probar cada fecha de muestra
        for (const testDate of testDates) {
          const testDateStr = testDate.format('YYYY-MM-DD');
          console.log(`  🧪 Testing ${dayName} on ${testDateStr}...`);

          try {
            // Obtener disponibilidad REAL para cada servicio en este día específico
            const serviceAvailabilities = await Promise.all(
              selectedServices.map(async ({ service, addOns, staffId }) => {
                if (!staffId || staffId === 'any') {
                  // Para 'any' staff, buscar todos los técnicos que pueden hacer el servicio
                  const eligibleStaff = staff.filter(s => 
                    s.isActive &&
                    s.isAvailable &&
                    s.workingDays?.includes(dayName) &&
                    s.services?.some(svc => svc.id === service.id)
                  );

                  if (eligibleStaff.length === 0) {

                    return [];
                  }

                  // Obtener slots REALES de todos los técnicos elegibles
                  const allStaffSlots = await Promise.all(
                    eligibleStaff.map(async (staffMember) => {
                      try {
                        const servicesForStaff = [{
                          serviceId: service.id,
                          duration: service.duration,
                          bufferTime: service.bufferTime || 0,
                          staffId: staffMember.id,
                          addons: addOns.map(addon => ({
                            id: addon.id,
                            duration: addon.additionalTime || 0,
                          })),
                        }];

                        const timezoneOffset = new Date().getTimezoneOffset();
                        // ⭐ CLAVE: getBackofficeAvailability considera bookings existentes
                        const response = await getBackofficeAvailability(servicesForStaff, [], testDateStr, false, timezoneOffset);
                        const slots = response.data || response || [];
                        return slots.map((slot: any) => slot.startTime);
                      } catch (error) {
                        console.log(`    ❌ Error getting REAL availability for ${staffMember.firstName}: ${error}`);
                        return [];
                      }
                    })
                  );

                  // Combinar slots únicos
                  const allTimes = new Set<string>();
                  allStaffSlots.forEach(slots => {
                    slots.forEach((time: string) => allTimes.add(time));
                  });
                  const availableTimes = Array.from(allTimes);
                  console.log(`    📊 ${service.name} (any staff): ${availableTimes.length} REAL available slots`);
                  return availableTimes;

                } else {
                  // Para staff específico
                  try {
                    const servicesForStaff = [{
                      serviceId: service.id,
                      duration: service.duration,
                      bufferTime: service.bufferTime || 0,
                      staffId: staffId,
                      addons: addOns.map(addon => ({
                        id: addon.id,
                        duration: addon.additionalTime || 0,
                      })),
                    }];

                    const timezoneOffset = new Date().getTimezoneOffset();
                    // ⭐ CLAVE: getBackofficeAvailability considera bookings existentes
                    const response = await getBackofficeAvailability(servicesForStaff, [], testDateStr, false, timezoneOffset);
                    const slots = response.data || response || [];
                    const availableTimes = slots.map((slot: any) => slot.startTime);
                    console.log(`    📊 ${service.name} (${staffId}): ${availableTimes.length} REAL available slots`);
                    return availableTimes;
                  } catch (error) {
                    console.log(`    ❌ Error getting REAL availability for specific staff ${staffId}: ${error}`);
                    return [];
                  }
                }
              })
            );

            console.log(`    📊 ${dayName} ${testDateStr} REAL availability:`, 
              serviceAvailabilities.map((times, idx) => `Service ${idx + 1}: ${times.length} real slots`));

            // Verificar si hay secuencias viables basadas en disponibilidad REAL
            if (!isVIPCombo) {
              // Para consecutivos: verificar si hay horarios donde se pueda hacer la secuencia REAL
              let hasValidSequence = false;

              for (const startTime1 of serviceAvailabilities[0]) {
                // Calcular cuándo termina el primer servicio REALMENTE
                const service1 = selectedServices[0];
                const duration1 = service1.service.duration + 
                  service1.addOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
                const buffer1 = service1.service.bufferTime || 15;
                const endTime1 = moment(startTime1, 'HH:mm:ss').add(duration1 + buffer1, 'minutes');

                // Verificar si hay slots REALES del segundo servicio después
                for (const startTime2 of serviceAvailabilities[1]) {
                  const start2 = moment(startTime2, 'HH:mm:ss');
                  if (start2.isSameOrAfter(endTime1)) {
                    hasValidSequence = true;
                    console.log(`    ✅ Valid REAL sequence found: ${startTime1} → ${startTime2}`);
                    break;
                  }
                }

                if (hasValidSequence) break;
              }

              if (hasValidSequence) {
                dayIsValid = true;
                break; // No necesitamos probar más fechas para este día
              }
            } else {
              // Para VIP: intersección REAL - necesitan estar disponibles al mismo tiempo
              const intersection = serviceAvailabilities[0].filter((time: string) =>
                serviceAvailabilities.every(availability => availability.includes(time))
              );

              if (intersection.length > 0) {
                dayIsValid = true;
                console.log(`    ✅ ${intersection.length} REAL VIP intersections found`);
                break; // No necesitamos probar más fechas para este día
              }
            }

          } catch (error) {
            console.log(`    ❌ Error testing ${dayName} ${testDateStr}:`, error);
          }
        }

        if (dayIsValid) {
          validDays.push(dayNumber);
          console.log(`✅ ${dayName}: VALIDATED with real booking availability`);
        } else {
          console.log(`❌ ${dayName}: No viable sequences in real availability`);
        }
      }


      console.log('💡 These days have been validated against:');
      console.log('   ✅ Existing bookings/conflicts');
      console.log('   ✅ Real staff availability');
      console.log('   ✅ Viable service sequences');
      setValidWorkingDays(validDays);

    } catch (error) {
      console.error('Error calculating REAL valid working days:', error);
      // En caso de error, usar días básicos
      setValidWorkingDays(getAvailableWorkingDays());
    } finally {
      setLoadingValidDays(false);
    }
  };

  // Ejecutar cálculo cuando cambien servicios o modo VIP
  useEffect(() => {
    if (selectedServices.length > 1) {
      calculateValidWorkingDays();
    } else {
      // Para un solo servicio, usar lógica original
      setValidWorkingDays(getAvailableWorkingDays());
    }
  }, [selectedServices, isVIPCombo, staff]);

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
          <Badge color={step === 'customer' ? 'primary' : 'light'} className="me-1" style={{ color: step === 'customer' ? 'white' : '#6c757d', border: '1px solid #dee2e6' }}>
            1. {t('booking.step.customer')}
          </Badge>
          <Badge color={step === 'services' ? 'primary' : 'light'} className="me-1" style={{ color: step === 'services' ? 'white' : '#6c757d', border: '1px solid #dee2e6' }}>
            2. {t('booking.step.services')}
          </Badge>
          {requiresStaffStep && (
            <Badge color={step === 'staff' ? 'primary' : 'light'} className="me-1" style={{ color: step === 'staff' ? 'white' : '#6c757d', border: '1px solid #dee2e6' }}>
              3. {t('booking.step.staff') || 'Staff'}
            </Badge>
          )}
          <Badge color={step === 'datetime' ? 'primary' : 'light'} className="me-1" style={{ color: step === 'datetime' ? 'white' : '#6c757d', border: '1px solid #dee2e6' }}>
            {requiresStaffStep ? '4' : '3'}. {t('booking.step.datetime')}
          </Badge>
          <Badge color={step === 'confirm' ? 'primary' : 'light'} style={{ color: step === 'confirm' ? 'white' : '#6c757d', border: '1px solid #dee2e6' }}>
            {requiresStaffStep ? '5' : '4'}. {t('booking.step.confirm')}
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
                    isDisabled={isStaffUser}
                  />
                </FormGroup>

                <div className="text-center my-3">
                  <Button
                    color="link"
                    onClick={() => setIsNewCustomer(true)}
                    disabled={isStaffUser}
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
                    disabled={isStaffUser}
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
                    disabled={isStaffUser}
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
                    disabled={isStaffUser}
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
                    disabled={isStaffUser}
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
                    disabled={isStaffUser}
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
                  <button type="submit" className="btn btn-success" disabled={isStaffUser}>
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
            
            {/* Mensaje informativo cuando hay staff preseleccionado */}
            {preselectedStaffId && (
              <Alert color="info" className="mb-3">
                <i className="ri-information-line me-2"></i>
                {t('booking.services.filtered_by_staff', {
                  staffName: `${staff.find(s => s.id === preselectedStaffId)?.firstName || ''} ${staff.find(s => s.id === preselectedStaffId)?.lastName || ''}`.trim()
                })}
              </Alert>
            )}

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
                                a.isActive && 
                                !a.removal && // Exclude removal addons
                                (
                                  !a.services || 
                                  a.services.length === 0 ||
                                  a.services.some(s => s.id === service.id)
                                )
                              ).length > 0 ? (
                                <div className="d-flex flex-column gap-2">
                                  {addOns
                                    .filter(a => 
                                      a.isActive && 
                                      !a.removal && // Exclude removal addons
                                      (
                                        !a.services || 
                                        a.services.length === 0 ||
                                        a.services.some(s => s.id === service.id)
                                      )
                                    )
                                    .map(addOn => {
                                      const isSelected = serviceAddOns.find(a => a.id === addOn.id);
                                      return (
                                        <div 
                                          key={addOn.id}
                                          className={`border rounded p-2 ${isSelected ? 'border-success bg-success bg-opacity-10' : ''}`}
                                          style={{ cursor: isStaffUser ? 'default' : 'pointer' }}
                                          onClick={isStaffUser ? undefined : () => toggleAddOn(service.id, addOn)}
                                        >
                                          <div className="d-flex align-items-start justify-content-between">
                                            <div className="form-check mb-0">
                                              <Input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={!!isSelected}
                                                onChange={() => toggleAddOn(service.id, addOn)}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={isStaffUser}
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
                          disabled={isStaffUser}
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
                      style={{ cursor: isStaffUser ? 'default' : 'pointer' }}
                      onClick={isStaffUser ? undefined : toggleCategory}
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
                                } ${isDisabled || isStaffUser ? '' : 'cursor-pointer'}`}
                                style={{ cursor: isDisabled || isStaffUser ? 'not-allowed' : 'pointer', opacity: isDisabled || isStaffUser ? 0.5 : 1 }}
                                onClick={() => !isDisabled && !isStaffUser && addService(service)}
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
                  color="light"
                  block
                  style={{ 
                    border: '2px solid #6c757d', 
                    color: '#6c757d',
                    backgroundColor: '#f8f9fa'
                  }}
                  onClick={() => {
                    setIsVIPCombo(false);
                    setUserConfirmedVIPChoice(true); // User made explicit choice
                    goToNextStep();
                  }}
                >
                  {t('booking.vipcombo.no_consecutive') || 'No, Consecutive'}
                </Button>
              </Col>
              <Col md={6}>
                <Button
                  color="warning"
                  block
                  onClick={() => {
                    setIsVIPCombo(true);
                    setUserConfirmedVIPChoice(true); // User made explicit choice
                    goToNextStep();
                  }}
                  disabled={isStaffUser}
                >
                  <i className="ri-star-fill me-2"></i>
                  {t('booking.vipcombo.yes_combo') || 'Yes, VIP Combo'}
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {/* PASO 5: STAFF SELECTION */}
        {step === 'staff' && !loading && requiresStaffStep && (
          <div>
            <h5 className="mb-3">{t('booking.staff.title') || 'Select Professional'}</h5>
            
            {isMultipleServicesFlow ? (
              // Para múltiples servicios: Selector solo para el primer servicio
              <div>
                <Alert color="info" className="mb-3">
                  <i className="ri-information-line me-2"></i>
                  <strong>{t('booking.staff.multiple_services_detected')}</strong><br />
                  • <strong>{t('booking.staff.first_service_instruction')}</strong><br />
                  • <strong>{t('booking.staff.second_service_instruction')}</strong>
                </Alert>

                <Card className="border mb-3">
                  <CardHeader>
                    <h6 className="mb-0">{t('booking.staff.assignment_title')}</h6>
                  </CardHeader>
                  <CardBody>
                    {selectedServices.map(({ service, staffId, staffName }, idx) => {
                      const isFirstService = idx === 0;
                      const availableStaffForService = staff.filter(s => 
                        s.isActive && 
                        s.isAvailable && 
                        s.services?.some(svc => svc.id === service.id)
                      );

                      return (
                        <div key={service.id} className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <Badge color="light" className="me-2">{idx + 1}</Badge>
                            <span className="flex-grow-1">{service.name}</span>
                            <Badge 
                              color={staffId ? 'success' : 'warning'} 
                              className="ms-2"
                            >
                              {staffId === 'any' 
                                ? 'Any Available' 
                                : staffName || 'Sin asignar'
                              }
                            </Badge>
                          </div>
                          
                          {isFirstService ? (
                            // Solo el primer servicio permite selección manual
                            <FormGroup>
                              <Label className="small text-muted">Seleccionar técnico para {service.name}:</Label>
                              <Input
                                type="select"
                                value={staffId || ''}
                                onChange={(e) => assignStaff(service.id, e.target.value)}
                                bsSize="sm"
                                disabled={isStaffUser}
                              >
                                <option value="">{t('booking.staff.select_option') || 'Select a professional...'}</option>
                                <option value="any">
                                  {t('booking.staff.any_available') || 'Any Available Technician'}
                                </option>
                                {availableStaffForService.map(s => {
                                  const workload = staffWorkloads.find(w => w.id === s.id);
                                  return (
                                    <option key={s.id} value={s.id}>
                                      {s.firstName} {s.lastName}
                                      {workload && ` (${Math.floor(workload.workloadMinutes / 60)}h ${workload.workloadMinutes % 60}m)`}
                                    </option>
                                  );
                                })}
                              </Input>
                            </FormGroup>
                          ) : (
                            // Segundo servicio siempre "Any Available" - Solo informativo
                            <div className="small text-muted">
                              <i className="ri-user-settings-line me-1"></i>
                              {t('booking.staff.auto_assigned_to')} "{t('booking.staff.any_available')}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              </div>
            ) : (
              // Para un solo servicio: selector individual normal
              selectedServices.map(({ service, addOns: serviceAddOns, staffId, staffName }, idx) => {
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
                          disabled={isStaffUser}
                        >
                          <option value="">{t('booking.staff.select_option') || 'Select a professional...'}</option>
                          <option value="any">
                            {t('booking.staff.any_available') || 'Any Available Technician'}
                          </option>
                          {staff
                            .filter(s => 
                              s.isActive && 
                              s.isAvailable && 
                              s.services?.some(svc => svc.id === service.id)
                            )
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
              })
            )}

            <Alert color="info" className="small">
              <i className="ri-information-line me-2"></i>
              {isMultipleServicesFlow
                ? (isVIPCombo 
                    ? '🌟 VIP Combo: Los servicios se realizarán simultáneamente con técnicos diferentes.'
                    : '⏭️ Consecutivo: Los servicios se realizarán uno después del otro con técnicos diferentes.')
                : t('booking.staff.select_instruction')
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
                    {selectedServices.map(({ service, addOns, staffName }, idx) => {
                      const addOnsDuration = addOns.reduce((sum, addon) => sum + (addon.additionalTime || 0), 0);
                      return (
                      <li key={service.id}>
                        {service.name} - {t('booking.summary.duration', { duration: service.duration })}
                        {addOns.length > 0 && (
                          <span className="text-muted small"> + {t('booking.summary.addons', { count: addOns.length })} ({addOnsDuration} min)</span>
                        )}
                        {staffName && (
                          <span className="text-success small"> - {staffName}</span>
                        )}
                      </li>
                      );
                    })}
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

            {/* Información sobre días válidos para múltiples servicios */}
            {selectedServices.length > 1 && (
              <Alert color={loadingValidDays ? "info" : "success"} className="mb-3">
                {loadingValidDays ? (
                  <div className="d-flex align-items-center">
                    <Spinner size="sm" className="me-2" />
                    <div>
                      🔄 {t('booking.datetime.validating_real_availability')}
                      <br />
                      <small className="text-muted">
                        {t('booking.datetime.verifying_status', { 
                          technicians: selectedServices.map(s => s.staffName || t('booking.staff.available_technician')).join(' y '), 
                          mode: isVIPCombo ? t('booking.datetime.mode_simultaneous') : t('booking.datetime.mode_consecutive') 
                        })}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div>
                    ✅ <strong>Días validados con disponibilidad real:</strong> {validWorkingDays.length > 0 ? validWorkingDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ') : 'Ninguno disponible'}
                    <br />
                    <small className="text-success">
                      ✓ <strong>Validación completa:</strong> días de trabajo, turnos existentes, horarios reales para <strong>{isVIPCombo ? 'servicios simultáneos (VIP)' : 'servicios consecutivos'}</strong>
                    </small>
                  </div>
                )}
              </Alert>
            )}

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
                      const isWorkingDay = isDateAvailable(date.toDate());
                      const isPastDate = date.isBefore(moment(), 'day');
                      const isDisabled = !isWorkingDay || isPastDate || loadingValidDays;
                      const isSelected = selectedDate && moment(selectedDate).isSame(date, 'day');
                      const isToday = date.isSame(moment(), 'day');
                      
                      return (
                        <Col key={dayOffset} className="text-center mb-2">
                          <button
                            type="button"
                            className={`calendar-chip${isSelected ? ' selected' : ''}${isDisabled || isStaffUser ? ' disabled' : ''}`}
                            disabled={isDisabled || isStaffUser}
                            onClick={() => {
                              if (!isDisabled && !isStaffUser) {
                                setSelectedDate(date.toDate());
                                // Solo resetear el tiempo si no viene preseleccionado del calendario
                                if (!hasPreselectedTime) {
                                  setSelectedTime(null);
                                }
                              }
                            }}
                            style={{ 
                              minHeight: '80px', 
                              width: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              padding: '0.5rem 0',
                              opacity: isDisabled ? 0.5 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer'
                            }}
                            title={isDisabled ? (
                              loadingValidDays ? 'Calculando días válidos...' :
                              !isWorkingDay ? 'Día no disponible para los servicios seleccionados' : 
                              'Fecha pasada'
                            ) : ''}
                          >
                            <span className="text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>
                              {date.locale('en').format('ddd')}
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
                          // Solo resetear el tiempo si no viene preseleccionado del calendario
                          if (!hasPreselectedTime) {
                            setSelectedTime(null);
                          }
                        }
                      }}
                      disabled={moment(weekStartDate).subtract(7, 'days').isBefore(moment(), 'day') || loadingValidDays || isStaffUser}
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
                        // Solo resetear el tiempo si no viene preseleccionado del calendario
                        if (!hasPreselectedTime) {
                          setSelectedTime(null);
                        }
                      }}
                      disabled={loadingValidDays || isStaffUser}
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
                  {selectedServices.some(s => !s.staffId) ? (
                    <Alert color="info" className="mb-0">
                      <i className="ri-information-line me-1"></i>
                      {t('booking.datetime.select_staff_required') || 'Por favor seleccione un técnico (específico o "Any Available") para cada servicio en el paso anterior.'}
                    </Alert>
                  ) : loadingSlots ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" size="sm" className="me-2" />
                      <span>{t('booking.datetime.loading_slots') || 'Cargando horarios disponibles...'}</span>
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
                                  className={`calendar-chip${normalizeTimeFormat(selectedTime) === normalizeTimeFormat(slot.time) ? ' selected' : ''}`}
                                  disabled={!slot.available || isStaffUser}
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
                                  className={`calendar-chip${normalizeTimeFormat(selectedTime) === normalizeTimeFormat(slot.time) ? ' selected' : ''}`}
                                  disabled={!slot.available || isStaffUser}
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
                                  className={`calendar-chip${normalizeTimeFormat(selectedTime) === normalizeTimeFormat(slot.time) ? ' selected' : ''}`}
                                  disabled={!slot.available || isStaffUser}
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
                    disabled={verifying || selectedServices.some(s => !s.staffId) || isStaffUser}
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
                disabled={isStaffUser}
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
                          {t('booking.confirm.addons')}: {serviceAddOns.map(a => `${a.name} (+${a.additionalTime || 0} min)`).join(', ')}
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
        {/* Mostrar mensaje de solo lectura para usuarios staff */}
        {isStaffUser && (
          <div className="w-100 text-center">
            <Alert color="info" className="mb-0">
              <i className="ri-information-line me-2"></i>
              {t('booking.staff_readonly_message') || 'This modal is read-only for staff users'}
            </Alert>
          </div>
        )}

        {/* Ocultar botones de navegación y creación para usuarios staff */}
        {!isStaffUser && (
          <>
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
          </>
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
              const isIncompatible = incompatibleRemovalIds.includes(removal.id) && 
                !isSelected;
              
              const handleToggle = async () => {
                if (isIncompatible) return;

                // Always use checkbox behavior: multiple selection
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
              };
              
              return (
                <div
                  key={removal.id}
                  className={`border rounded p-3 mb-2 ${
                    isSelected ? 'border-success bg-success bg-opacity-10' : ''
                  } ${isIncompatible || isStaffUser ? 'opacity-50' : ''}`}
                  style={{ 
                    cursor: isIncompatible || isStaffUser ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                  onClick={!isIncompatible && !isStaffUser ? handleToggle : undefined}
                >
                  {isIncompatible && (
                    <Badge color="warning" className="position-absolute top-0 end-0 m-2">
                      {t('booking.removal.incompatible') || 'Incompatible'}
                    </Badge>
                  )}
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="form-check mb-0">
                      <Input
                        type="checkbox"
                        name="removal-selection"
                        className="form-check-input"
                        checked={isSelected}
                        disabled={isIncompatible || isStaffUser}
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

            {selectedRemovalIds.length > 0 && (
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
          color="light"
          onClick={() => {
            setSelectedRemovalIds([]);
            handleRemovalModalContinue();
          }}
          style={{ 
            border: '1px solid #dee2e6',
            color: '#6c757d'
          }}
          disabled={isStaffUser}
        >
          <i className="ri-close-line me-1" />
          {t('booking.removal.no_removal_needed') || 'NO REMOVAL NEEDED'}
        </Button>
        <Button color="primary" onClick={handleRemovalModalContinue} disabled={isStaffUser}>
          {t('booking.button.continue') || 'Continue'}
          <i className="ri-arrow-right-line ms-1" />
        </Button>
      </ModalFooter>
    </Modal>
    </>
  );
};

export default CreateBookingModal;