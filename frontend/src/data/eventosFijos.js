const BASE = import.meta.env.BASE_URL;

export const eventosFijos = [
  {
    id: 'salas-colombia-canta',
    slug: 'salas-colombia-canta',
    img: `${BASE}salas_de_colombia/salas-colombia-canta-6.webp`,
    galeria: [
      `${BASE}salas_de_colombia/salas-colombia-canta-6.webp`,
      `${BASE}salas_de_colombia/salas-colombia-canta-7.webp`,
    ],
    titulo: 'Salas Colombia Canta',
    subtitulo: 'Música en vivo · Medellín',
    tipo: 'Programación mensual',
    tipoIcono: '🎶',
    color: '#E8341A',
    colorHero: '#8B1A00',
    descripcionCorta:
      'Un espacio para encontrarnos alrededor de la música, las historias y la cultura. Cada semana abrimos nuestras puertas para vivir conciertos, tertulias y encuentros culturales en un ambiente cercano, acompañados de un buen café. Desde los sonidos de nuestra tradición hasta nuevas propuestas musicales que enriquecen la escena cultural de Medellín.',
    descripcionLarga:
      'Un espacio para encontrarnos alrededor de la música, las historias y la cultura. Un lugar para venir con tu mejor compañía, disfrutar de un buen café y descubrir artistas que nos inspiran, desde los sonidos de nuestra tradición hasta nuevas propuestas musicales que enriquecen nuestra escena cultural.\n\nCreemos en el poder de los espacios que reúnen a las comunidades, que generan conversaciones y que nos permiten compartir lo que somos a través del arte. Cada semana te esperamos para vivir conciertos, tertulias y encuentros culturales en un ambiente cercano y acogedor.',
    pills: [
      { icono: '🎟️', texto: 'Entrada libre' },
      { icono: '🕕', texto: 'Miércoles 6:00 PM\nSábados 5:00 PM' },
    ],
    lugar: 'Calle 49 #76a-65, Sector Estadio',
    ciudad: 'Medellín, Colombia',
    cta: 'Ver programación',
    mes: 'Junio 2026',
    programacion: [
      { dia: 'Mié 03', hora: '6:00 PM', nombre: 'Diálogos tras escena en Modo Brillo', fechaISO: '2026-06-03' },
      { dia: 'Vie 05', hora: '6:00 PM', nombre: 'Cine al parque', fechaISO: '2026-06-05' },
      { dia: 'Sáb 06', hora: '5:00 PM', nombre: 'Historias, Tiples y canciones', fechaISO: '2026-06-06' },
      { dia: 'Mar 09', hora: '5:00 PM', nombre: 'Cuerdas Andinas', fechaISO: '2026-06-09' },
      { dia: 'Mié 10', hora: '5:00 PM', nombre: 'Festival de Talentos', fechaISO: '2026-06-10' },
      { dia: 'Jue 11', hora: '5:00 PM', nombre: 'Modo Mundial: Canciones a Colombia', fechaISO: '2026-06-11' },
      { dia: 'Sáb 13', hora: '10:00 AM', nombre: 'Festival de Talentos', fechaISO: '2026-06-13' },
      { dia: 'Mié 17', hora: '5:00 PM', nombre: 'Modo Mundial: Canciones a Colombia', fechaISO: '2026-06-17' },
      { dia: 'Jue 18', hora: '5:00 PM', nombre: 'Festival de Talentos', fechaISO: '2026-06-18' },
    ],
    waLink: 'https://wa.me/573015315119?text=Hola%2C+quiero+reservar+para+Salas+Colombia+Canta',
  },
  {
    id: 'colombia-me-enamoras',
    slug: 'colombia-me-enamoras',
    img: `${BASE}colombia-enamoras/colombia-me-enamoras-principal.webp`,
    galeria: [
      `${BASE}colombia-enamoras/colombia-me-enamoras-1.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-2.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-3.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-4.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-5.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-6.webp`,
    ],
    titulo: 'Colombia me Enamoras',
    subtitulo: 'Turismo cultural · Medellín',
    invertido: true,
    tipo: 'Turismo Cultural',
    tipoIcono: '🌍',
    color: '#1A56DB',
    colorHero: '#0F3A9E',
    descripcionCorta:
      'Una experiencia cultural imperdible en tu visita a Medellín. Café, trajes artesanales y el show que ha representado a Colombia en el mundo.',
    descripcionLarga:
      'Una experiencia cultural imperdible en tu visita a Medellín. Únete a los cientos de turistas y habitantes que dan cuenta de una súper experiencia de turismo cultural y déjate enamorar con nuestros espacios coloniales, llenos de buena energía, historias y una tradición que enamora, acompañado de un café recién molido y finalizando con el show con el que hemos representado a Colombia en Europa, México y Estados Unidos.',
    pills: [
      { icono: '☕', texto: 'Café recién molido' },
      { icono: '💃', texto: 'Show folclórico' },
      { icono: '👗', texto: 'Trajes artesanales' },
      { icono: '🌍', texto: 'Turismo cultural' },
    ],
    fases: [
      {
        icono: '☕',
        titulo: 'Bienvenida y café',
        descripcion:
          'Te recibimos en nuestros espacios ambientados con toques modernos de folclor y el acompañamiento de un café recién molido, con las historias de la finca campesina.',
      },
      {
        icono: '👗',
        titulo: 'Exposición de trajes e instrumentos',
        descripcion:
          'Conoce la tradición que guardan los trajes folclóricos. Un espacio lleno de historias vivas con trajes 100% artesanales producidos desde las regiones de Colombia.',
      },
      {
        icono: '🎭',
        titulo: 'Show folclórico',
        descripcion:
          'El show aplaudido en Colombia, Europa, México, Austria y Estados Unidos. Danza de las regiones, interpretación vocal de alta calidad y el color de los trajes artesanales.',
      },
      {
        icono: '🧺',
        titulo: 'Artesanías y pasabocas',
        descripcion:
          'Aprecia artesanías y degusta una muestra gastronómica típica colombiana. El cierre perfecto para una experiencia que enamora.',
      },
    ],
    lugar: 'Calle 49 #76a-65, Sector Estadio',
    ciudad: 'Medellín, Colombia',
    cta: 'Reservar experiencia',
    waLink: 'https://wa.me/573015315119?text=Hola%2C+quiero+reservar+Colombia+me+Enamoras',
    tripadvisorLink: 'https://www.tripadvisor.es/Attraction_Review-g297478-d23933011-Reviews-Colombia_Canta_Y_Encanta-Medellin_Antioquia_Department.html',
  },
];
