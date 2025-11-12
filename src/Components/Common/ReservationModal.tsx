import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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
import { FormikProps } from "formik";
import { servicesByCategory, staffMembers } from "../../common/data/calender";

interface ReservationModalProps {
  modal: boolean;
  toggle: () => void;
  isEdit: boolean;
  isEditButton: boolean;
  eventName: string;
  event: any;
  validation: FormikProps<any>;
  submitOtherEvent: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  modal,
  toggle,
  isEdit,
  isEditButton,
  eventName,
  event,
  validation,
  submitOtherEvent
}) => {
  const { t } = useTranslation();

  return (
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
                  <h6 className="d-block fw-semibold mb-0">
                    <span id="event-start-date-tag">
                      {event && event.datetag ? event.datetag : "No Date"}
                    </span>
                  </h6>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="flex-shrink-0 me-3">
                <i className="ri-map-pin-line text-muted fs-16"></i>
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
                  onChange={(e) => {
                    validation.handleChange(e);
                    // Reset service field when category changes
                    validation.setFieldValue("service", "");
                  }}
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
                  <FormFeedback type="invalid" className="d-block">{validation.errors.category as string}</FormFeedback>
                ) : null}
              </div>
            </Col>
            <Col xs={12}>
              <div className="mb-3">
                <Label className="form-label">{t('calendar.form.specific_service')}</Label>
                <Input 
                  className={!!isEdit ? "form-select d-none" : "form-select d-block"}
                  name="service"
                  id="event-service"
                  type="select"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.service || ""}
                  disabled={!validation.values.category}
                >
                  <option value="">{t('calendar.form.select_specific_service')}</option>
                  {validation.values.category && (() => {
                    const categoryMap: any = {
                      'bg-success-subtle': 1, // Manicura
                      'bg-info-subtle': 2,    // Pedicura
                      'bg-warning-subtle': 3, // Uñas de Gel
                      'bg-danger-subtle': 4,  // Uñas Acrílicas
                      'bg-primary-subtle': 5, // Diseño de Uñas
                      'bg-dark-subtle': 6     // Tratamiento Spa
                    };
                    const categoryId = categoryMap[validation.values.category];
                    const services = servicesByCategory[categoryId] || [];
                    return services.map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </option>
                    ));
                  })()}
                </Input>
                {validation.touched.service && validation.errors.service ? (
                  <FormFeedback type="invalid" className="d-block">{validation.errors.service as string}</FormFeedback>
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
                  <FormFeedback type="invalid" className="d-block">{validation.errors.title as string}</FormFeedback>)
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
                      validation.setFieldValue("defaultDate", [selectedDate]);
                    }
                  }}
                  onBlur={validation.handleBlur}
                />
                {validation.touched.defaultDate && validation.errors.defaultDate ? (
                  <FormFeedback type="invalid" className="d-block">{validation.errors.defaultDate as string} </FormFeedback>
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
                  <FormFeedback type="invalid" className="d-block">{validation.errors.start as string} </FormFeedback>
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
                  <FormFeedback type="invalid" className="d-block">{validation.errors.end as string} </FormFeedback>
                ) : null}
              </div>
            </Col>
            <Col xs={12}>
              <div className="mb-3">
                <Label className="form-label">{t('calendar.form.staff')}</Label>
                <Input 
                  className={!!isEdit ? "form-select d-none" : "form-select d-block"}
                  name="staff"
                  id="event-staff"
                  type="select"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.staff || ""}
                  disabled={!validation.values.defaultDate?.[0] || !validation.values.start || !validation.values.end}
                >
                  <option value="">{t('calendar.form.select_staff')}</option>
                  {staffMembers.map((staff: any) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </Input>
                {validation.touched.staff && validation.errors.staff ? (
                  <FormFeedback type="invalid" className="d-block">{validation.errors.staff as string}</FormFeedback>
                ) : null}
              </div>
            </Col>
            <Col xs={12}>
              <div className="mb-3">
                <Label htmlFor="event-location">{t('calendar.form.phone')}</Label>
                <div>
                  <Input
                    type="text"
                    className={!!isEdit ? "form-control d-none" : "form-control d-block"}
                    name="location"
                    id="event-location"
                    placeholder={t('calendar.form.phone_placeholder')}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.location || ""}
                  />
                  {validation.touched.location && validation.errors.location ? (
                    <FormFeedback type="invalid" className="d-block">{validation.errors.location as string}</FormFeedback>
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
                    className={!!isEdit ? "form-control d-none" : "form-control d-block"}
                    name="email"
                    id="event-email"
                    placeholder={t('calendar.form.email_placeholder')}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.email || ""}
                  />
                  {validation.touched.email && validation.errors.email ? (
                    <FormFeedback type="invalid" className="d-block">{validation.errors.email as string}</FormFeedback>
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
                  placeholder={t('calendar.form.notes_placeholder')}
                  rows={3}
                  name="description"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.description || ""}
                ></textarea>
                {validation.touched.description && validation.errors.description ? (
                  <FormFeedback type="invalid" className="d-block">{validation.errors.description as string}</FormFeedback>
                ) : null}
              </div>
            </Col>
          </Row>
          <div className="hstack gap-2 justify-content-end">
            {isEditButton && (
              <button
                type="button"
                className="btn btn-soft-danger"
                id="btn-delete-event"
                onClick={() => {
                  toggle();
                }}
              >
                <i className="ri-close-line align-bottom"></i> {t('calendar.delete')}
              </button>
            )}
            <button type="submit" className="btn btn-success" id="btn-save-event">
              {!!isEdit ? t('calendar.edit') : t('calendar.add_reservation')}
            </button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default ReservationModal;
