var date = new Date();
var d = date.getDate();
var m = date.getMonth();
var y = date.getFullYear();

const defaultevent = [
  {
    id: 1,
    title: "World Braille Day",
    start: "2022-01-04",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },
  {
    id: 2,
    title: "World Leprosy Day",
    start: "2022-01-30",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 3,
    title: "International Mother Language Day",
    start: "2022-02-21",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 4,
    title: "International Women's Day",
    start: "2022-03-08",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 5,
    title: "World Thinking Day",
    start: "2022-02-22",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 6,
    title: "International Mother Language Day",
    start: "2022-03-21",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 7,
    title: "World Water Day",
    start: "2022-03-22",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 8,
    title: "World Health Day",
    start: "2022-04-07",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 9,
    title: "International Special Librarians Day",
    start: "2022-04-16",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  },

  {
    id: 10,
    title: "Earth Day",
    start: "2022-04-22",
    className: "bg-info-subtle text-info",
    allDay: true,
    description: "N.A.",
    location: "N.A."
  }
];

const events = [
  {
    id: 153,
    title: "María González - Manicura Clásica",
    start: new Date(y, m, 1, 10, 0),
    end: new Date(y, m, 1, 11, 0),
    className: "bg-success-subtle text-success",
    location: "+1 555-0101",
    allDay: false,
    extendedProps: {
      department: "Manicura",
    },
    description: "Cliente regular, prefiere esmalte nude",
  },
  {
    id: 136,
    title: "Ana Martínez - Pedicura Spa",
    start: new Date(y, m, d - 5, 14, 0),
    end: new Date(y, m, d - 5, 15, 30),
    allDay: false,
    className: "bg-info-subtle text-info",
    location: "+1 555-0202",
    extendedProps: {
      department: "Pedicura",
    },
    description: "Incluye masaje de pies y exfoliación",
  },
  {
    id: 999,
    title: "Sofía López - Uñas de Gel",
    start: new Date(y, m, d + 2, 11, 0),
    end: new Date(y, m, d + 2, 12, 30),
    allDay: false,
    className: "bg-warning-subtle text-warning",
    location: "+1 555-0303",
    extendedProps: {
      department: "Uñas de Gel",
    },
    description: "Extensión de uñas con gel, color rosa pastel",
  },
  {
    id: 991,
    title: "Lucía Fernández - Uñas Acrílicas",
    start: new Date(y, m, d + 4, 16, 0),
    end: new Date(y, m, d + 4, 18, 0),
    allDay: false,
    className: "bg-danger-subtle text-danger",
    location: "+1 555-0404",
    extendedProps: {
      department: "Uñas Acrílicas",
    },
    description: "Uñas largas stiletto, decoración con cristales",
  },
  {
    id: 112,
    title: "Carmen Ruiz - Diseño de Uñas",
    start: new Date(y, m, d, 12, 30),
    end: new Date(y, m, d, 14, 0),
    allDay: false,
    className: "bg-primary-subtle text-primary",
    location: "+1 555-0505",
    extendedProps: {
      department: "Diseño de Uñas",
    },
    description: "Nail art personalizado con motivos florales",
  },
  {
    id: 113,
    title: "Isabel Torres - Manicura Rusa",
    start: new Date(y, m, d + 9, 10, 0),
    end: new Date(y, m, d + 9, 11, 30),
    allDay: false,
    className: "bg-success-subtle text-success",
    location: "+1 555-0606",
    extendedProps: {
      department: "Manicura",
    },
    description: "Técnica rusa con cutícula impecable",
  },
  {
    id: 875,
    title: "Laura Sánchez - Tratamiento Spa",
    start: new Date(y, m, d + 1, 15, 0),
    end: new Date(y, m, d + 1, 16, 30),
    allDay: false,
    className: "bg-dark-subtle text-body",
    location: "+1 555-0707",
    extendedProps: {
      department: "Tratamiento Spa",
    },
    description: "Tratamiento completo de manos con parafina y mascarilla",
  },
  {
    id: 783,
    title: "Patricia Gómez - Pedicura Clásica",
    start: new Date(y, m, 15, 13, 0),
    end: new Date(y, m, 15, 14, 0),
    className: "bg-info-subtle text-info",
    location: "+1 555-0808",
    extendedProps: {
      department: "Pedicura",
    },
    description: "Pedicura básica con esmaltado tradicional",
  },
  {
    id: 456,
    title: "Elena Ramírez - Retiro de Gel",
    start: new Date(y, m, d + 7, 16, 30),
    end: new Date(y, m, d + 7, 17, 30),
    allDay: false,
    className: "bg-warning-subtle text-warning",
    location: "+1 555-0909",
    extendedProps: {
      department: "Uñas de Gel",
    },
    description: "Retiro de gel anterior y aplicación de nuevo set",
  },
  {
    id: 201,
    title: "Beatriz Castro - French Manicure",
    start: new Date(y, m, d + 12, 11, 0),
    end: new Date(y, m, d + 12, 12, 0),
    allDay: false,
    className: "bg-primary-subtle text-primary",
    location: "+1 555-1010",
    extendedProps: {
      department: "Diseño de Uñas",
    },
    description: "Manicura francesa clásica con punta blanca",
  },
];

const calenderDefaultCategories = [
  {
    id: 1,
    title: "Manicura",
    type: "success",
  },
  {
    id: 2,
    title: "Pedicura",
    type: "info",
  },
  {
    id: 3,
    title: "Uñas de Gel",
    type: "warning",
  },
  {
    id: 4,
    title: "Uñas Acrílicas",
    type: "danger",
  },
  {
    id: 5,
    title: "Diseño de Uñas",
    type: "primary",
  },
  {
    id: 6,
    title: "Tratamiento Spa",
    type: "dark",
  },
];

const servicesByCategory: any = {
  1: [ // Manicura
    { id: 1, name: "Manicura Clásica", duration: 30 },
    { id: 2, name: "Manicura Francesa", duration: 45 },
    { id: 3, name: "Manicura Rusa", duration: 60 },
    { id: 4, name: "Manicura Spa", duration: 50 },
  ],
  2: [ // Pedicura
    { id: 5, name: "Pedicura Clásica", duration: 45 },
    { id: 6, name: "Pedicura Spa", duration: 60 },
    { id: 7, name: "Pedicura Express", duration: 30 },
  ],
  3: [ // Uñas de Gel
    { id: 8, name: "Aplicación de Gel", duration: 60 },
    { id: 9, name: "Retiro de Gel", duration: 30 },
    { id: 10, name: "Extensión con Gel", duration: 90 },
    { id: 11, name: "Relleno de Gel", duration: 60 },
  ],
  4: [ // Uñas Acrílicas
    { id: 12, name: "Aplicación Acrílico", duration: 90 },
    { id: 13, name: "Retiro de Acrílico", duration: 45 },
    { id: 14, name: "Extensión Acrílica", duration: 120 },
    { id: 15, name: "Relleno Acrílico", duration: 60 },
  ],
  5: [ // Diseño de Uñas
    { id: 16, name: "Nail Art Básico", duration: 30 },
    { id: 17, name: "Nail Art Premium", duration: 60 },
    { id: 18, name: "Decoración con Cristales", duration: 45 },
    { id: 19, name: "Diseño Personalizado", duration: 90 },
  ],
  6: [ // Tratamiento Spa
    { id: 20, name: "Tratamiento de Parafina", duration: 30 },
    { id: 21, name: "Masaje de Manos", duration: 20 },
    { id: 22, name: "Tratamiento de Cutículas", duration: 25 },
    { id: 23, name: "Exfoliación y Mascarilla", duration: 40 },
  ],
};

export { calenderDefaultCategories, events, defaultevent, servicesByCategory };