import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import WorkInProgressOverlay from '../../common/WorkInProgressOverlay';

//Import Icons
import FeatherIcon from "feather-icons-react";

import {
  Card,
  CardBody,
  Container,
  Row,
  Col
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import BootstrapTheme from "@fullcalendar/bootstrap";
import Flatpickr from "react-flatpickr";

//redux
import { useSelector, useDispatch } from "react-redux";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import ReservationModal from "../../Components/Common/ReservationModal";

//Simple bar
import SimpleBar from "simplebar-react";
import UpcommingEvents from './UpcommingEvents';
import listPlugin from '@fullcalendar/list';

import {
  getEvents as onGetEvents,
  getCategories as onGetCategories,
  addNewEvent as onAddNewEvent,
  deleteEvent as onDeleteEvent,
  updateEvent as onUpdateEvent,
  getUpCommingEvent as onGetUpCommingEvent,
} from "../../slices/thunks";
import { createSelector } from "reselect";
import { servicesByCategory, staffMembers } from "../../common/data/calender";

const Calender = () => {
  const dispatch: any = useDispatch();
  const { t } = useTranslation();
  const [event, setEvent] = useState<any>({});
  const [modal, setModal] = useState<boolean>(false);
  const [selectedNewDay, setSelectedNewDay] = useState<any>();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isEditButton, setIsEditButton] = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteEvent, setDeleteEvent] = useState<string>('');
  const [eventName, setEventName] = useState<string>("");
  const [preselectedCategory, setPreselectedCategory] = useState<string>("");
  const lastDateRange = useRef<string>("");
  const loadingEvents = useRef<boolean>(false);

  const selectLayoutState = (state: any) => state.Calendar;
  const calendarDataProperties = createSelector(
    selectLayoutState,
    (state: any) => ({
      events: state.events,
      categories: state.categories,
      upcommingevents: state.upcommingevents,
      isEventUpdated: state.isEventUpdated,
    })
  );
  // Inside your component
  const {
    events, categories, upcommingevents, isEventUpdated
  } = useSelector(calendarDataProperties);

  useEffect(() => {
    // Cargar categorías solo una vez
    dispatch(onGetCategories());
  }, [dispatch]);
  
  useEffect(() => {
    // Cargar upcoming events cuando las categorías estén disponibles
    if (categories && categories.length > 0) {
      dispatch(onGetUpCommingEvent());
    }
  }, [dispatch, categories.length]);
  
  useEffect(() => {
    // Inicializar Draggable cuando las categorías estén disponibles
    if (categories && categories.length > 0) {
      // Inicializar Draggable para el contenedor oculto
      const externalEvents = document.getElementById("external-events");
      if (externalEvents) {
        new Draggable(externalEvents, {
          itemSelector: ".external-event",
        });
      }
      
      // Inicializar Draggable para las categorías visibles en la card
      const visibleCategories = document.getElementById("visible-categories");
      if (visibleCategories) {
        new Draggable(visibleCategories, {
          itemSelector: ".external-event",
        });
      }
    }
  }, [categories]);

  useEffect(() => {
    if (isEventUpdated) {
      setIsEdit(false);
      setEvent({});
    }
  }, [dispatch, isEventUpdated]);

  /**
   * Handling the modal state
   */
  const toggle = () => {
    if (modal) {
      setModal(false);
      setEvent(null);
      setIsEdit(false);
      setIsEditButton(true);
    } else {
      setModal(true);
    }
  };
  /**
   * Handling date click on calendar
   */

  const handleDateClick = (arg: any) => {
    const date = arg["date"];
    const now = new Date();
    
    // Verificar si la fecha/hora ya pasó
    if (date < now) {
      return; // No permitir crear reservas en el pasado
    }
    
    const endDate = new Date(date.getTime() + 30 * 60000); // Añadir 30 minutos
    setSelectedNewDay([date]);
    setPreselectedCategory(""); // Sin categoría preseleccionada al hacer clic en el calendario
    setEvent({
      title: "",
      start: date,
      end: endDate,
      defaultDate: [date],
    });
    toggle();
  };

  const str_dt = function formatDate(date: any) {
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var d = new Date(date),
      month = "" + monthNames[d.getMonth()],
      day = "" + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [day + " " + month, year].join(",");
  };

  /**
   * Handling click on event on calendar
   */

  const handleEventClick = (arg: any) => {
    const event = arg.event;

    const st_date = event.start;
    const ed_date = event.end;
    const r_date =
      ed_date == null
        ? str_dt(st_date)
        : str_dt(st_date) + " to " + str_dt(ed_date);
    const er_date = ed_date === null ? [st_date] : [st_date, ed_date];

    setEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      className: event.classNames,
      category: event.classNames[0],
      location: event._def.extendedProps.location ? event._def.extendedProps.location : "No Loaction",
      description: event._def.extendedProps.description,
      email: event._def.extendedProps.email ? event._def.extendedProps.email : "",
      service: event._def.extendedProps.service ? event._def.extendedProps.service : "",
      staff: event._def.extendedProps.staff ? event._def.extendedProps.staff : "",
      defaultDate: er_date,
      datetag: r_date,
    });
    setEventName(event.title)
    setDeleteEvent(event.id);
    setIsEdit(true);
    setIsEditButton(false);
    toggle();
  };
  /**
   * On delete event
   */
  const handleDeleteEvent = () => {
    dispatch(onDeleteEvent(deleteEvent)).then(() => {
      // Recargar upcoming events después de eliminar
      dispatch(onGetUpCommingEvent());
    });
    setDeleteModal(false);
  };

  // events validation
  const validation: any = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      id: (event && event.id) || "",
      title: (event && event.title) || "",
      category: (event && event.category) || "",
      service: (event && event.service) || "",
      location: (event && event.location) || "",
      description: (event && event.description) || "",
      defaultDate: (event && event.defaultDate) || [],
      datetag: (event && event.datetag) || "",
      start: (event && event.start) || "",
      end: (event && event.end) || '',
      email: (event && event.email) || "",
      staff: (event && event.staff) || ""
    },

    validationSchema: Yup.object({
      title: Yup.string().required(t('calendar.validation.customer_required')),
      category: Yup.string().required(t('calendar.validation.service_required')),
      service: Yup.string().required(t('calendar.validation.specific_service_required')),
      location: Yup.string().required(t('calendar.validation.phone_required')),
      description: Yup.string().required(t('calendar.validation.notes_required')),
      start: Yup.date().required(t('calendar.validation.start_required')),
      end: Yup.date().required(t('calendar.validation.end_required')),
      defaultDate: Yup.array().of(Yup.date()).required(t('calendar.validation.date_required')).min(1, 'Select a date'),
      email: Yup.string().email(t('calendar.validation.email_invalid')).required(t('calendar.validation.email_required')),
      staff: Yup.string().required(t('calendar.validation.staff_required')),
    }),
    onSubmit: (values) => {
      // Combinar la fecha seleccionada con las horas de inicio y fin
      const selectedDate = selectedNewDay && selectedNewDay[0] ? new Date(selectedNewDay[0]) : new Date();
      
      // Si hay hora de inicio, combinarla con la fecha
      let startDateTime = values.start ? new Date(values.start) : new Date();
      startDateTime.setFullYear(selectedDate.getFullYear());
      startDateTime.setMonth(selectedDate.getMonth());
      startDateTime.setDate(selectedDate.getDate());
      
      // Si hay hora de fin, combinarla con la fecha
      let endDateTime = values.end ? new Date(values.end) : new Date(startDateTime.getTime() + 30 * 60000);
      endDateTime.setFullYear(selectedDate.getFullYear());
      endDateTime.setMonth(selectedDate.getMonth());
      endDateTime.setDate(selectedDate.getDate());

      // Validar que la fecha/hora no sea en el pasado
      const now = new Date();
      if (startDateTime < now) {
        validation.setFieldError("start", t('calendar.validation.past_time_error'));
        return;
      }

      if (isEdit) {
        const updateEvent = {
          id: event.id,
          title: values.title,
          className: values.category,
          start: startDateTime,
          end: endDateTime,
          location: values.location,
          description: values.description,
          email: values.email,
          service: values.service,
          staff: values.staff,
        };
        // update event
        dispatch(onUpdateEvent(updateEvent)).then(() => {
          // Recargar upcoming events después de actualizar
          dispatch(onGetUpCommingEvent());
        });
        validation.resetForm();
      } else {
        const newEvent = {
          id: Math.floor(Math.random() * 100),
          title: values["title"],
          start: startDateTime,
          end: endDateTime,
          className: values["category"],
          location: values["location"],
          description: values["description"],
          email: values["email"],
          service: values["service"],
          staff: values["staff"],
        };
        // save new event
        dispatch(onAddNewEvent(newEvent)).then(() => {
          // Recargar upcoming events después de crear
          dispatch(onGetUpCommingEvent());
        });
        validation.resetForm();
      }

      // setSelectedDay(null);
      setSelectedNewDay(null);
      toggle();
    },
  });

  const submitOtherEvent = () => {

    document.getElementById("form-event")?.classList.remove("view-event");

    document
      .getElementById("event-title")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-category")?.classList.replace("d-none", "d-block");
    (document.getElementById("event-start-date")?.parentNode as HTMLElement).classList.remove("d-none");
    document
      .getElementById("event-start-date")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-location")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-email")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-description")?.classList.replace("d-none", "d-block");
    document
      .getElementById("event-start-date-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-location-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-email-tag")?.classList.replace("d-block", "d-none");
    document
      .getElementById("event-description-tag")?.classList.replace("d-block", "d-none");

    setIsEditButton(true);
  };

  /**
   * Handle calendar dates change (when user changes view or navigates)
   */
  const handleDatesSet = (dateInfo: any) => {
    // Formatear fechas para el backend (YYYY-MM-DD)
    const startDate = dateInfo.start.toISOString().split('T')[0];
    const endDate = dateInfo.end.toISOString().split('T')[0];
    const dateRangeKey = `${startDate}-${endDate}`;
    
    // Solo cargar si el rango es diferente al último Y no estamos cargando actualmente
    if (lastDateRange.current !== dateRangeKey && !loadingEvents.current) {
      lastDateRange.current = dateRangeKey;
      loadingEvents.current = true;
      
      dispatch(onGetEvents({ startDate, endDate })).finally(() => {
        // Resetear el flag después de un pequeño delay para evitar llamadas duplicadas
        setTimeout(() => {
          loadingEvents.current = false;
        }, 500);
      });
    }
  };

  /**
   * On category darg event
   */
  const onDrag = (event: any) => {
    event.preventDefault();
  };

  /**
   * On calendar drop event
   */
  const onDrop = (event: any) => {
    const date = event["date"];
    const now = new Date();
    
    // Verificar si la fecha/hora ya pasó
    if (date < now) {
      return; // No permitir crear reservas en el pasado
    }
    
    const startDate = new Date(date);
    // Añadir 30 minutos para la fecha de fin
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const draggedEl = event.draggedEl;
    const draggedElclass = draggedEl.className;
    
    if (
      draggedEl.classList.contains("external-event") &&
      draggedElclass.indexOf("fc-event-draggable") === -1
    ) {
      // Extraer la categoría del elemento arrastrado
      const categoryTitle = draggedEl.innerText.trim();
      const category = categories.find((cat: any) => cat.title === categoryTitle);
      
      if (category) {
        // Preparar el modal con la categoría preseleccionada
        const categoryClass = category.type === "success" ? "bg-success-subtle" :
                             category.type === "info" ? "bg-info-subtle" :
                             category.type === "warning" ? "bg-warning-subtle" :
                             category.type === "danger" ? "bg-danger-subtle" :
                             category.type === "primary" ? "bg-primary-subtle" :
                             "bg-dark-subtle";
        
        setPreselectedCategory(categoryClass);
        setSelectedNewDay([startDate]);
        setEvent({
          title: "",
          start: startDate,
          end: endDate,
          className: categoryClass,
          category: categoryClass,
          defaultDate: [startDate],
        });
        toggle();
      }
    }
  };

  document.title = t('calendar.title') + " | Nails & Co Midtown - Admin Panel";

  return (
    <React.Fragment>
      <WorkInProgressOverlay/>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteEvent}
        onCloseClick={() => { setDeleteModal(false) }} recordId={""} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('calendar.title')} pageTitle={t('calendar.breadcrumb')} />
          <Row className="h-100">
            {/* Card con categorías - Lado izquierdo */}
            <Col xl={3} lg={4} className="d-flex">
              <Card className="card-h-100 w-100">
                <CardBody className="d-flex flex-column" style={{ height: '100%' }}>
                  <h5 className="card-title mb-3">{t('calendar.drag_description')}</h5>
                  
                  <div id="visible-categories" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                      {categories &&
                        categories.map((category: any) => {
                          // Usar los colores que vienen de la API
                          const colors = { 
                            bg: category.bg || '#e9d5ff', 
                            text: category.text || '#6b21a8' 
                          };
                          
                          return (
                            <div
                              className="external-event fc-event px-3 py-2 rounded mb-2 d-flex align-items-center"
                              key={"cat-" + category.id}
                              draggable
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.text}20`,
                                cursor: 'grab'
                              }}
                              onDrag={(event: any) => {
                                onDrag(event);
                              }}
                            >
                              <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                              <span>{category.title}</span>
                            </div>
                          );
                        })}
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Calendario - Lado derecho */}
            <Col xl={9} lg={8} className="d-flex">
              <Card className="card-h-100 w-100">
                <CardBody>
                  <div id="external-events" style={{ display: 'none' }}>
                    {categories &&
                      categories.map((category: any) => (
                        <div
                          className={`bg-${category.type}-subtle external-event fc-event text-${category.type}`}
                              key={"cat-" + category.id}
                              draggable
                            >
                              {category.title}
                            </div>
                          ))}
                      </div>
                      <FullCalendar
                        plugins={[
                          BootstrapTheme,
                          dayGridPlugin,
                          timeGridPlugin,
                          interactionPlugin,
                          listPlugin
                        ]}
                        initialView="timeGridWeek"
                        slotDuration={"00:30:00"}
                        slotMinTime={"08:00:00"}
                        slotMaxTime={"20:00:00"}
                        handleWindowResize={true}
                        themeSystem="bootstrap"
                        height="auto"
                        contentHeight="auto"
                        headerToolbar={{
                          left: "prev,next today",
                          center: "title",
                          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        validRange={undefined}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        drop={onDrop}
                        datesSet={handleDatesSet}
                        allDaySlot={false}
                        expandRows={true}
                        nowIndicator={true}
                      />
                    </CardBody>
                  </Card>
                </Col>
          </Row>

          {/* Próximas reservas */}
          <Row>
            <Col xs={12}>
              <div>
                <h5 className="mb-1">{t('calendar.upcoming_reservations')}</h5>
                <p className="text-muted">{t('calendar.upcoming_description')}</p>
                <SimpleBar
                  className="pe-2 me-n1 mb-3"
                  style={{ height: "400px" }}
                >
                  <div id="upcoming-event-list">
                    {upcommingevents &&
                      (upcommingevents || []).map((event: any, key: any) => (
                        <React.Fragment key={key}>
                          <UpcommingEvents event={event} />
                        </React.Fragment>
                      ))}
                  </div>
                </SimpleBar>
              </div>
            </Col>
          </Row>

          <ReservationModal
            modal={modal}
            toggle={toggle}
            isEdit={isEdit}
            isEditButton={isEditButton}
            eventName={eventName}
            event={event}
            validation={validation}
            submitOtherEvent={submitOtherEvent}
          />

        </Container>
      </div>
    </React.Fragment>
  );
};

Calender.propTypes = {
  events: PropTypes.any,
  categories: PropTypes.array,
  className: PropTypes.string,
  onGetEvents: PropTypes.func,
  onAddNewEvent: PropTypes.func,
  onUpdateEvent: PropTypes.func,
  onDeleteEvent: PropTypes.func,
  onGetCategories: PropTypes.func,
};

export default Calender;