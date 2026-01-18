import { Card, CardBody } from "reactstrap";

function UpcommingEvents(props: any) {

  const getTime = (params: any) => {
    params = new Date(params);
    if (params.getHours() != null) {
      const hour = params.getHours();
      const minute = params.getMinutes() ? params.getMinutes() : "00";
      return hour + ":" + minute;
    }
  };
  const tConvert = (time: any) => {
    const t = time.split(":");
    var hours = t[0];
    var minutes = t[1];

    var newformat = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    // minutes = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutes + " " + newformat;
  };

  const str_dt = function formatDate(date: any) {
    const monthNames = [
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

  // Extraer el color del evento
  const eventColor = props.event.backgroundColor || props.event.borderColor || '#e9d5ff';
  const textColor = props.event.textColor || '#6b21a8';


  // Mostrar solo la fecha y hora de inicio
  let startDateTime = null;
  if (props.event.start && props.event.start !== "Invalid Date") {
    const dateObj = new Date(props.event.start); // Esto ya es local
    const dateStr = dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minuteStr = minute < 10 ? `0${minute}` : minute;
    startDateTime = `${dateStr}, ${hour12}:${minuteStr} ${ampm}`;
  }

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex mb-3">
          <div className="flex-grow-1">
            <i
              className="mdi mdi-checkbox-blank-circle me-2"
              style={{ color: textColor }}
            ></i>
            <span className="fw-medium">
              {startDateTime}
            </span>
          </div>
          <div className="flex-shrink-0">
            <small 
              className="badge ms-auto"
              style={{ 
                backgroundColor: eventColor, 
                color: textColor 
              }}
            >
              {props.event.extendedProps?.service || ""}
            </small>
          </div>
        </div>
        <h6 className="card-title fs-16">{props.event.title}</h6>
        <p className="text-muted text-truncate-two-lines mb-0">
          {props.event.description !== "N.A." && props.event.description}
        </p>
      </CardBody>
    </Card>
  );
}

export default UpcommingEvents;