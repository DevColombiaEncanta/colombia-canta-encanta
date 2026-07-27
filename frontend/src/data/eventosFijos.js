const BASE = import.meta.env.BASE_URL;

export const eventosFijos = [
  {
    id: 'salas-colombia-canta',
    slug: 'salas-colombia-canta',
    img: `${BASE}salas_de_colombia/salas-colombia-canta-6.webp`,
    galeria: [
      `${BASE}salas_de_colombia/salas-colombia-canta-6.webp`,
      `${BASE}salas_de_colombia/salas-colombia-canta-7.webp`,
      `${BASE}salas_de_colombia/salas-colombia-canta-8.webp`,
      `${BASE}salas_de_colombia/salas-colombia-canta-9.webp`,
    ],
    titulo: 'Salas Colombia canta',
    subtitulo: 'Música en vivo · Medellín',
    tipo: 'Programación mensual',
    tipoIcono: '🎶',
    maxEntradas: 5,
    color: '#E8341A',
    colorHero: '#8B1A00',
    descripcionCorta:
      'Un espacio para encontrarnos alrededor de la música, las historias y la cultura. Cada semana abrimos nuestras puertas para vivir conciertos, tertulias y encuentros culturales en un ambiente cercano, acompañados de un buen café. Desde los sonidos de nuestra tradición hasta nuevas propuestas musicales que enriquecen la escena cultural de Medellín.',
    descripcionLarga:
      'Un espacio para encontrarnos alrededor de la música, las historias y la cultura. Un lugar para venir con tu mejor compañía, disfrutar de un buen café y descubrir artistas que nos inspiran, desde los sonidos de nuestra tradición hasta nuevas propuestas musicales que enriquecen nuestra escena cultural.\n\nCreemos en el poder de los espacios que reúnen a las comunidades, que generan conversaciones y que nos permiten compartir lo que somos a través del arte. Cada semana te esperamos para vivir conciertos, tertulias y encuentros culturales en un ambiente cercano y acogedor.',
    pills: [
      { icono: '🎟️', texto: 'Entrada libre', iconoSrc: `${BASE}iconos-salas-col/icono-entrada.webp` },
      { icono: '🕕', texto: 'Miércoles 6:00 PM\nSábados 5:00 PM', iconoSrc: `${BASE}iconos-salas-col/icono-horario.webp` },
    ],
    fases: [
      {
        icono: '☕',
        iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-cafe.webp`,
        titulo: 'Bienvenida y café',
        descripcion: 'Te recibimos en un ambiente acogedor con un café recién molido y la calidez de nuestra comunidad artística.',
      },
      {
        icono: '🎤',
        iconoSrc: `${BASE}iconos-salas-col/icono-musica.webp`,
        titulo: 'Música en vivo',
        descripcion: 'Disfruta de conciertos y presentaciones de artistas locales e invitados que enriquecen nuestra escena cultural.',
      },
      {
        icono: '💬',
        iconoSrc: `${BASE}iconos-salas-col/icono-tertulia.webp`,
        titulo: 'Tertulia cultural',
        descripcion: 'Un espacio de conversación y encuentro donde las historias, las ideas y la cultura se tejen juntas.',
      },
      {
        icono: '🎻',
        iconoSrc: `${BASE}iconos-salas-col/icono-comunidad.webp`,
        titulo: 'Comunidad artística',
        descripcion: 'Conéctate con artistas y amantes de la música que comparten la pasión por nuestra tradición cultural.',
      },
    ],
    lugar: 'Calle 49 #76a-65, Sector Estadio',
    ciudad: 'Medellín, Colombia',
    cta: 'Ver programación',
    mes: 'Agosto 2026',
    programacion: [
      { dia: 'Vie 07', hora: '6:00 PM', nombre: 'Noche de Bambuco y Porro', descripcion: 'Ritmos del folclor colombiano en vivo', fechaISO: '2026-08-07' },
      { dia: 'Sáb 08', hora: '5:00 PM', nombre: 'Festival de Talentos', descripcion: 'Voces emergentes de la escena local', fechaISO: '2026-08-08' },
      { dia: 'Mié 12', hora: '5:00 PM', nombre: 'Cuerdas y Voces del Ande', descripcion: 'Música andina con cuarteto de cuerdas', fechaISO: '2026-08-12' },
      { dia: 'Jue 13', hora: '6:00 PM', nombre: 'Tertulia: Memorias Sonoras', descripcion: 'Conversación sobre tradición musical colombiana', fechaISO: '2026-08-13' },
      { dia: 'Sáb 15', hora: '10:00 AM', nombre: 'Colombia Suena: Día de Antioquia', descripcion: 'Concierto especial por el Día de Antioquia', fechaISO: '2026-08-15' },
      { dia: 'Mié 19', hora: '5:00 PM', nombre: 'Diálogos tras escena en Modo Brillo', descripcion: 'Encuentro con artistas detrás del escenario', fechaISO: '2026-08-19' },
      { dia: 'Jue 20', hora: '6:00 PM', nombre: 'Historias, Tiples y Canciones', descripcion: 'Narrativa musical con tiple y guitarra', fechaISO: '2026-08-20' },
      { dia: 'Sáb 22', hora: '5:00 PM', nombre: 'Gran Muestra Cultural', descripcion: 'Presentaciones de danza, música y teatro', fechaISO: '2026-08-22' },
      { dia: 'Mié 26', hora: '5:00 PM', nombre: 'Música Tradicional Colombiana', descripcion: 'Repertorio de mapalé, cumbia y bambuco', fechaISO: '2026-08-26' },
      { dia: 'Sáb 29', hora: '6:00 PM', nombre: 'Noche de Cierre: Canciones que nos Unen', descripcion: 'Gran final con artistas invitados especiales', fechaISO: '2026-08-29' },
    ],
    waLink: 'https://wa.me/573015315119?text=Hola%2C+quiero+reservar+para+Salas+Colombia+Canta',
  },
  {
    id: 'colombia-me-enamoras',
    slug: 'colombia-me-enamoras',
    img: `${BASE}colombia-enamoras/colombia-me-enamoras-principal.webp`,
    galeria: [
      `${BASE}colombia-enamoras/colombia-me-enamoras-1.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-3.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-7.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-8.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-9.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-10.webp`,
      `${BASE}colombia-enamoras/colombia-me-enamoras-11.webp`,
    ],
    titulo: 'Colombia me enamoras',
    subtitulo: 'Turismo cultural · Medellín',
    invertido: true,
    tipo: 'Turismo Cultural',
    tipoIcono: '🌍',
    maxEntradas: 5,
    color: '#1A56DB',
    colorHero: '#0F3A9E',
    descripcionCorta:
      'Una experiencia cultural imperdible en tu visita a Medellín. Café, trajes artesanales y el show que ha representado a Colombia en el mundo.',
    descripcionLarga:
      'Una experiencia cultural imperdible en tu visita a Medellín. Únete a los cientos de turistas y habitantes que dan cuenta de una súper experiencia de turismo cultural y déjate enamorar con nuestros espacios coloniales, llenos de buena energía, historias y una tradición que enamora, acompañado de un café recién molido y finalizando con el show con el que hemos representado a Colombia en Europa, México y Estados Unidos.',
    pills: [
      { icono: '☕', texto: 'Café recién molido', iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-cafe.webp` },
      { icono: '💃', texto: 'Show folclórico', iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-show.webp` },
      { icono: '👗', texto: 'Trajes artesanales', iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-trajes.webp` },
      { icono: '🌍', texto: 'Turismo cultural' },
    ],
    fases: [
      {
        icono: '☕',
        iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-cafe.webp`,
        titulo: 'Bienvenida y café',
        descripcion:
          'Te recibimos en nuestros espacios ambientados con toques modernos de folclor y el acompañamiento de un café recién molido, con las historias de la finca campesina.',
      },
      {
        icono: '👗',
        iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-trajes.webp`,
        titulo: 'Exposición de trajes e instrumentos',
        descripcion:
          'Conoce la tradición que guardan los trajes folclóricos. Un espacio lleno de historias vivas con trajes 100% artesanales producidos desde las regiones de Colombia.',
      },
      {
        icono: '🎭',
        iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-show.webp`,
        titulo: 'Show folclórico',
        descripcion:
          'El show aplaudido en Colombia, Europa, México, Austria y Estados Unidos. Danza de las regiones, interpretación vocal de alta calidad y el color de los trajes artesanales.',
      },
      {
        icono: '🧺',
        iconoSrc: `${BASE}iconos-experiencia-enamoras/icono-artesanias.webp`,
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
