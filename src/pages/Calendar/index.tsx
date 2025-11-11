import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

//Import Icons
import FeatherIcon from "feather-icons-react";

import {
  Card,
  CardBody,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
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
import { servicesByCategory } from "../../common/data/calender";

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
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState<boolean>(false);

  const selectLayoutState = (state: any) => state.Calendar;
  const calendarDataProperties = createSelector(
    selectLayoutState,
    (state: any) => ({
      events: state.events,
      categories: state.categories,
      isEventUpdated: state.isEventUpdated,
    })
  );
  // Inside your component
  const {
    events, categories, isEventUpdated
  } = useSelector(calendarDataProperties);

  useEffect(() => {
    dispatch(onGetEvents());
    dispatch(onGetCategories());
    dispatch(onGetUpCommingEvent());
    
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
  }, [dispatch, categories]);

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
    dispatch(onDeleteEvent(deleteEvent));
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
      location: (event && event.location) || "",
      description: (event && event.description) || "",
      defaultDate: (event && event.defaultDate) || [],
      datetag: (event && event.datetag) || "",
      start: (event && event.start) || "",
      end: (event && event.end) || '',
      email: (event && event.email) || ""
    },

    validationSchema: Yup.object({
      title: Yup.string().required(t('calendar.validation.customer_required')),
      category: Yup.string().required(t('calendar.validation.service_required')),
      location: Yup.string().required(t('calendar.validation.phone_required')),
      description: Yup.string().required(t('calendar.validation.notes_required')),
      start: Yup.date().required(t('calendar.validation.start_required')),
      end: Yup.date().required(t('calendar.validation.end_required')),
      defaultDate: Yup.array().of(Yup.date()).required(t('calendar.validation.date_required')).min(1, 'Select a date'),
      email: Yup.string().email(t('calendar.validation.email_invalid')).required(t('calendar.validation.email_required')),
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
        };
        // update event
        dispatch(onUpdateEvent(updateEvent));
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
        };
        // save new event
        dispatch(onAddNewEvent(newEvent));
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteEvent}
        onCloseClick={() => { setDeleteModal(false) }} recordId={""} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t('calendar.title')} pageTitle={t('calendar.breadcrumb')} />
          <Row>
            <Col xs={12}>
              {/* Card con categorías y botón */}
              <Card className="mb-3">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="text-muted mb-0">
                      {t('calendar.drag_description')}
                    </p>
                    <button
                      className="btn btn-sm btn-soft-primary"
                      onClick={() => setIsCategoriesCollapsed(!isCategoriesCollapsed)}
                    >
                      <i className={`mdi mdi-chevron-${isCategoriesCollapsed ? 'down' : 'up'}`}></i>
                    </button>
                  </div>
                  
                  {!isCategoriesCollapsed && (
                    <div className="d-flex flex-wrap gap-2" id="visible-categories">
                      <div
                        className="bg-primary-subtle external-event fc-event text-primary px-3 py-2 rounded"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setPreselectedCategory("");
                          toggle();
                        }}
                      >
                        <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                        {t('calendar.create_reservation')}
                      </div>
                      {categories &&
                        categories.map((category: any) => (
                          <div
                            className={`bg-${category.type}-subtle external-event fc-event text-${category.type} px-3 py-2 rounded`}
                            key={"cat-" + category.id}
                            draggable
                            onDrag={(event: any) => {
                              onDrag(event);
                            }}
                          >
                            <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                            {category.title}
                          </div>
                        ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Calendario */}
              <Row>
                <Col xs={12}>
                  <Card className="card-h-100">
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
                        headerToolbar={{
                          left: "prev,next today",
                          center: "title",
                          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        selectConstraint={{
                          start: new Date(),
                        }}
                        validRange={{
                          start: new Date(),
                        }}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        drop={onDrop}
                        allDaySlot={false}
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
                        {events &&
                          (events || []).map((event: any, key: any) => (
                            <React.Fragment key={key}>
                              <UpcommingEvents event={event} />
                            </React.Fragment>
                          ))}
                      </div>
                    </SimpleBar>
                  </div>
                </Col>
              </Row>

              <div style={{ clear: "both" }}></div>

              <Modal 
                isOpen={modal} 
                id="event-modal" 
                centered
              >
                <ModalHeader toggle={toggle} tag="h5" className="p-3 bg-info-subtle modal-title">
                  {!!isEdit ? eventName : t('calendar.add_reservation')}
                </ModalHeader>
                <ModalBody>
                  <Form
                    className={!!isEdit ? "needs-validation view-event" : "needs-validation"}
                    name="event-form"
                    id="form-event"
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    {!!isEdit ? (
                      <div className="text-end">
                        <Link
                          to="#"
                          className="btn btn-sm btn-soft-primary"
                          id="edit-event-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            submitOtherEvent();
                            return false;
                          }}>
                          {t('calendar.edit')}
                        </Link>
                      </div>
                    ) : null}
                    <div className="event-details">
                      <div className="d-flex align-items-center mb-2">
                        <div className="flex-shrink-0 me-3">
                          <i className="ri-user-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="d-block fw-semibold mb-0">
                            <span id="event-title-tag">
                              {event && event.title !== undefined ? event.title : "No Customer"}
                            </span>
                          </h6>
                        </div>
                      </div>
                      <div className="d-flex mb-2">
                        <div className="flex-grow-1 d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <i className="ri-calendar-event-line text-muted fs-16"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="d-block fw-semibold mb-0" id="event-start-date-tag">
                              {event ? event.datetag : ""}
                            </h6>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="flex-shrink-0 me-3">
                          <i className="ri-time-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="d-block fw-semibold mb-0"><span id="event-timepicker1-tag">12:00 AM</span> - <span id="event-timepicker2-tag">5:30 AM</span></h6>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="flex-shrink-0 me-3">
                          <i className="ri-phone-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="d-block fw-semibold mb-0">
                            <span id="event-location-tag">
                              {event && event.location !== undefined ? event.location : "No Phone"}
                            </span>
                          </h6>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="flex-shrink-0 me-3">
                          <i className="ri-mail-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="d-block fw-semibold mb-0">
                            <span id="event-email-tag">
                              {event && event.email !== undefined ? event.email : "No Email"}
                            </span>
                          </h6>
                        </div>
                      </div>
                      <div className="d-flex mb-3">
                        <div className="flex-shrink-0 me-3">
                          <i className="ri-discuss-line text-muted fs-16"></i>
                        </div>
                        <div className="flex-grow-1">
                          <p className="d-block text-muted mb-0" id="event-description-tag">
                            {event && event.description !== undefined ? event.description : "No Description"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Row className="event-form">
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label className="form-label">{t('calendar.form.service_type')}</Label>
                          <Input className={!!isEdit ? "form-select d-none" : "form-select d-block"}
                            name="category"
                            id="event-category"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.category || ""}>
                            <option value="bg-success-subtle">{t('calendar.service_types.manicure')}</option>
                            <option value="bg-info-subtle">{t('calendar.service_types.pedicure')}</option>
                            <option value="bg-warning-subtle">{t('calendar.service_types.gel_nails')}</option>
                            <option value="bg-danger-subtle">{t('calendar.service_types.acrylic_nails')}</option>
                            <option value="bg-primary-subtle">{t('calendar.service_types.nail_design')}</option>
                            <option value="bg-dark-subtle">{t('calendar.service_types.spa_treatment')}</option>
                          </Input>
                          {validation.touched.category && validation.errors.category ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.category}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label className="form-label">{t('calendar.form.customer_name')}</Label>
                          <Input
                            className={!!isEdit ? "d-none" : "d-block"}
                            placeholder={t('calendar.form.customer_name_placeholder')}
                            type="text"
                            name="title"
                            id="event-title"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.title || ""} />
                          {validation.touched.title && validation.errors.title ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.title}</FormFeedback>)
                            : null}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label>{t('calendar.form.reservation_date')}</Label>
                          <Input
                            type="date"
                            className={!!isEdit ? "form-control d-none" : "form-control"}
                            id="event-start-date"
                            name="defaultDate"
                            placeholder={t('calendar.form.select_date')}
                            min={new Date().toISOString().split('T')[0]}
                            value={
                              validation.values.defaultDate && validation.values.defaultDate[0] 
                                ? new Date(validation.values.defaultDate[0]).toISOString().split('T')[0]
                                : ""
                            }
                            onChange={(e) => {
                              const selectedDate = new Date(e.target.value);
                              if (selectedDate) {
                                setSelectedNewDay([selectedDate]);
                                validation.setFieldValue("defaultDate", [selectedDate]);
                              }
                            }}
                            onBlur={validation.handleBlur}
                          />
                          {validation.touched.defaultDate && validation.errors.defaultDate ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.defaultDate} </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="mb-3">
                          <Label>{t('calendar.form.start_time')}</Label>
                          <Input
                            type="time"
                            className="form-control"
                            name="start"
                            value={
                              validation.values.start 
                                ? new Date(validation.values.start).toTimeString().slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value) {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = new Date();
                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                validation.setFieldValue("start", date);
                              }
                            }}
                            onBlur={validation.handleBlur}
                          />
                          {validation.touched.start && validation.errors.start ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.start} </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div className="mb-3">
                          <Label>{t('calendar.form.end_time')}</Label>
                          <Input
                            type="time"
                            className="form-control"
                            name="end"
                            value={
                              validation.values.end 
                                ? new Date(validation.values.end).toTimeString().slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value) {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = new Date();
                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                validation.setFieldValue("end", date);
                              }
                            }}
                            onBlur={validation.handleBlur}
                          />
                          {validation.touched.end && validation.errors.end ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.end} </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label htmlFor="event-location">{t('calendar.form.phone')}</Label>
                          <div>
                            <Input
                              type="text"
                              className={!!isEdit ? "d-none" : "d-block"}
                              name="location"
                              id="event-location"
                              placeholder={t('calendar.form.phone_placeholder')}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.location} />
                            {validation.touched.location && validation.errors.location ? (
                              <FormFeedback type="invalid" className="d-block">{validation.errors.location}</FormFeedback>
                            ) : null}
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label htmlFor="event-email">{t('calendar.form.email')}</Label>
                          <div>
                            <Input
                              type="email"
                              className={!!isEdit ? "d-none" : "d-block"}
                              name="email"
                              id="event-email"
                              placeholder={t('calendar.form.email_placeholder')}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.email} />
                            {validation.touched.email && validation.errors.email ? (
                              <FormFeedback type="invalid" className="d-block">{validation.errors.email}</FormFeedback>
                            ) : null}
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label className="form-label">{t('calendar.form.notes')}</Label>
                          <textarea
                            className={!!isEdit ? "form-control d-none" : "form-control d-block"}
                            id="event-description"
                            name="description"
                            placeholder={t('calendar.form.notes_placeholder')}
                            rows={3}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.description}></textarea>
                          {validation.touched.description && validation.errors.description ? (
                            <FormFeedback type="invalid" className="d-block">{validation.errors.description}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                    <div className="hstack gap-2 justify-content-end">
                      {!!isEdit && (
                        <button type="button" className="btn btn-soft-danger" id="btn-delete-event" onClick={() => { toggle(); setDeleteModal(true) }}>
                          <i className="ri-close-line align-bottom"></i> {t('calendar.delete')}
                        </button>
                      )}
                      {isEditButton &&
                        <button type="submit" className="btn btn-success" id="btn-save-event">
                          {!!isEdit ? t('calendar.edit_reservation') : t('calendar.add_reservation')}
                        </button>}
                    </div>
                  </Form>
                </ModalBody>
              </Modal>
            </Col>
          </Row>
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