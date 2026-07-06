import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductoModal from '../components/ProductoModal/ProductoModal';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import './Tienda.css';

const PAGE_TITLE = 'Tienda | Colombia Canta y Encanta';
const PAGE_DESC = 'Merch oficial de Colombia Canta y Encanta: camisetas, hoodies, tote bags y más. Lleva un pedacito de la cultura colombiana contigo.';

const coleccionesSuperiores = [
  { id: 'novedades', nombre: 'NOVEDADES', emoji: '⭐' },
  { id: 'drop1', nombre: 'DROP 1', emoji: '❤️' },
  { id: 'drop2', nombre: 'DROP 2', emoji: '⭐' },
  { id: 'kit', nombre: 'KIT ME ENAMORAS', emoji: '🤍' },
];

const categorias = ['Todos', 'Camisetas', 'Hoodies', 'Bags', 'Otros'];

const productos = [
  {
    id: 10, nombre: 'Camiseta Colombia Canta y Encanta', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Nuevo',
    emoji: '👕', bg: 'linear-gradient(135deg, #E8341A, #1A56DB)',
    imagenes: ['tienda-productos/camiseta-colombia-canta-y-encanta-1.webp', 'tienda-productos/camiseta-colombia-canta-y-encanta-2.webp', 'tienda-productos/camiseta-colombia-canta-y-encanta-3.webp'],
    descripcion: 'El diseño insignia de Colombia Canta y Encanta. Algodón premium con estampado artístico que celebra nuestra identidad musical.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#E8341A' }],
    stock: true,
  },
  {
    id: 11, nombre: 'Camiseta Amor Colcanta', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Nuevo',
    emoji: '👕', bg: 'linear-gradient(135deg, #cc3333, #8B0000)',
    imagenes: ['tienda-productos/camiseta-amor-colcanta-1.webp', 'tienda-productos/camiseta-amor-colcanta-2.webp'],
    descripcion: 'Camiseta unisex que lleva el amor por Colombia en cada detalle. Tela suave y transpirable, perfecta para el día a día.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#cc3333' }],
    stock: true,
  },
  {
    id: 12, nombre: 'Tula Colombia Canta y Encanta', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Nuevo',
    emoji: '🎒', bg: 'linear-gradient(135deg, #F5C800, #E8341A)',
    imagenes: ['tienda-productos/tula-colombia-canta-y-encanta-1.webp', 'tienda-productos/tula-colombia-canta-y-encanta-2.webp', 'tienda-productos/tula-colombia-canta-y-encanta-3.webp'],
    descripcion: 'Tula con el sello oficial de Colombia Canta y Encanta. Espaciosa, resistente y con diseño exclusivo que va contigo a todas partes.',
    tallas: [],
    colores: [{ nombre: 'Multicolor', hex: '#F5C800' }],
    stock: true,
  },
  {
    id: 13, nombre: 'Gorra Colombia Canta y Encanta', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Nuevo',
    emoji: '🧢', bg: 'linear-gradient(135deg, #1A56DB, #0F3A9E)',
    imagenes: ['tienda-productos/gorra-colombia-canta-y-encanta-1.webp', 'tienda-productos/gorra-colombia-canta-y-encanta-2.webp'],
    descripcion: 'Gorra structured con bordado del logo oficial. Talla única ajustable, ideal para llevar tu identidad colombiana a donde vayas.',
    tallas: ['Único'],
    colores: [{ nombre: 'Azul marino', hex: '#1A56DB' }],
    stock: true,
  },
  {
    id: 14, nombre: 'Termo Colombia Canta y Encanta', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Nuevo',
    emoji: '🍵', bg: 'linear-gradient(135deg, #1A56DB, #16A34A)',
    imagenes: ['tienda-productos/termo-colombia-canta-y-encanta-1.webp', 'tienda-productos/termo-colombia-canta-y-encanta-2.webp'],
    descripcion: 'Termo de acero inoxidable con el logo de Colombia Canta y Encanta. Mantiene bebidas frías 24 h y calientes 12 h.',
    tallas: [],
    colores: [],
    stock: true,
  },

  // DROP 1
  {
    id: 15, nombre: 'Camiseta Corazón de Oro — Blanco', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #d4a853, #8B6914)',
    imagenes: ['tienda-productos/camiseta-corazon-de-oro-1-blanco.webp', 'tienda-productos/camiseta-corazon-de-oro-2-blanco.webp', 'tienda-productos/camiseta-corazon-de-oro-3-blanco.webp'],
    descripcion: 'Camiseta Corazón de Oro en blanco. Diseño dorado símbolo de la música y la calidez colombiana. Algodón de alta calidad.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Blanco', hex: '#F5F5F5' }],
    stock: true,
  },
  {
    id: 16, nombre: 'Camiseta Corazón de Oro — Negro', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #2a2a2a, #d4a853)',
    imagenes: ['tienda-productos/camiseta-corazon-de-oro-1-negro.webp', 'tienda-productos/camiseta-corazon-de-oro-2-negro.webp', 'tienda-productos/camiseta-corazon-de-oro-3-negro.webp'],
    descripcion: 'Camiseta Corazón de Oro en negro. Contraste elegante entre el fondo oscuro y el diseño dorado inspirado en el folclor colombiano.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Negro', hex: '#1a1a1a' }],
    stock: true,
  },
  {
    id: 17, nombre: 'Camiseta Sonidos de un País', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #E8341A, #F5C800)',
    imagenes: ['tienda-productos/camiseta-sonidos-de-un-pais-1.webp', 'tienda-productos/camiseta-sonidos-de-un-pais-2.webp'],
    descripcion: 'Los sonidos de Colombia estampados en algodón. Un tributo visual a la riqueza musical de nuestro país.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#E8341A' }],
    stock: true,
  },
  {
    id: 18, nombre: 'Camiseta Vive con Libertad', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #1A56DB, #16A34A)',
    imagenes: ['tienda-productos/camiseta-vive-con-libertad-1.webp', 'tienda-productos/camiseta-vive-con-libertad-2.webp'],
    descripcion: 'Vive con libertad, vive con Colombia. Camiseta de corte clásico con estampado que inspira a ser auténtico.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#1A56DB' }],
    stock: true,
  },
  {
    id: 19, nombre: 'Buzo Música, Familia y Vida', categoria: 'Hoodies', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '🧥', bg: 'linear-gradient(135deg, #3a1a6e, #E8341A)',
    imagenes: ['tienda-productos/buzo-musica-familia-y-vida-1.webp', 'tienda-productos/buzo-musica-familia-y-vida-2.webp', 'tienda-productos/buzo-musica-familia-y-vida-3.webp'],
    descripcion: 'Buzo que celebra los tres pilares de Colombia Canta y Encanta: la música, la familia y la vida. Felpa suave y abrigo perfecto.',
    tallas: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#3a1a6e' }],
    stock: true,
  },
  {
    id: 20, nombre: 'Hoodie Un Gran Poder', categoria: 'Hoodies', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Popular',
    emoji: '🧥', bg: 'linear-gradient(135deg, #1a1a1a, #E8341A)',
    imagenes: ['tienda-productos/hoodie-un-gran-poder-1.webp', 'tienda-productos/hoodie-un-gran-poder-2.webp', 'tienda-productos/hoodie-un-gran-poder-3.webp'],
    descripcion: 'Un gran poder, una gran responsabilidad con la cultura. Hoodie con capucha y bolsillo canguro, en felpa premium.',
    tallas: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Negro', hex: '#1a1a1a' }],
    stock: true,
  },
  {
    id: 21, nombre: 'Camiseta Oversize Colombia', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #F5C800, #E8341A)',
    imagenes: ['tienda-productos/camiseta-oversize-colombia-1.webp', 'tienda-productos/camiseta-oversize-colombia-2.webp', 'tienda-productos/camiseta-oversize-colombia-3.webp'],
    descripcion: 'Corte oversize para un estilo relajado con identidad. Algodón suave con estampado Colombia vibrante.',
    tallas: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Multicolor', hex: '#F5C800' }],
    stock: true,
  },

  // DROP 2
  {
    id: 22, nombre: 'Camiseta Deportiva Colocanta', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #1A56DB, #0F3A9E)',
    imagenes: ['tienda-productos/camiseta-deportiva-colocanta-1.webp', 'tienda-productos/camiseta-deportiva-colocanta-2.webp', 'tienda-productos/camiseta-deportiva-colocanta-3.webp'],
    descripcion: 'Camiseta deportiva oficial de Colombia Canta y Encanta. Tela técnica transpirable, ideal para entrenar con orgullo.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Azul', hex: '#1A56DB' }],
    stock: true,
  },
  {
    id: 23, nombre: 'Camiseta Deportiva de Colombia', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #F5C800, #0F3A9E)',
    imagenes: ['tienda-productos/camiseta-deportiva-de-colombia-1.webp', 'tienda-productos/camiseta-deportiva-de-colombia-2.webp', 'tienda-productos/camiseta-deportiva-de-colombia-3.webp'],
    descripcion: 'Camiseta deportiva con los colores de Colombia. Rendimiento y orgullo en cada movimiento.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Tricolor', hex: '#F5C800' }],
    stock: true,
  },
  {
    id: 24, nombre: 'Camiseta Encanto Caribeño', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #0891b2, #F5C800)',
    imagenes: ['tienda-productos/camiseta-encanto-caribeno-1.webp', 'tienda-productos/camiseta-encanto-caribeno-2.webp', 'tienda-productos/camiseta-encanto-caribeno-3.webp'],
    descripcion: 'El encanto del Caribe colombiano en una camiseta. Colores vibrantes y diseño tropical que celebra la costa.',
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [{ nombre: 'Caribe', hex: '#0891b2' }],
    stock: true,
  },
  {
    id: 25, nombre: 'Camiseta Manga Sisa Colcanta — Blanco', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #e5e5e5, #aaaaaa)',
    imagenes: ['tienda-productos/camiseta-manga-sisa-colcanta-1-blanco.webp', 'tienda-productos/camiseta-manga-sisa-colcanta-2-blanco.webp', 'tienda-productos/camiseta-manga-sisa-colcanta-3-blanco.webp'],
    descripcion: 'Camiseta manga sisa en blanco, corte cómodo y fresco. Ideal para los días calurosos con estilo Colcanta.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Blanco', hex: '#F5F5F5' }],
    stock: true,
  },
  {
    id: 26, nombre: 'Camiseta Manga Sisa Colcanta — Negro', categoria: 'Camisetas', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👕', bg: 'linear-gradient(135deg, #1a1a1a, #444444)',
    imagenes: ['tienda-productos/camiseta-manga-sisa-colcanta-1-negro.webp', 'tienda-productos/camiseta-manga-sisa-colcanta-2-negro.webp', 'tienda-productos/camiseta-manga-sisa-colcanta-3-negro.webp'],
    descripcion: 'Camiseta manga sisa en negro, versión oscura y elegante del clásico Colcanta. Tela ligera para el día a día activo.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Negro', hex: '#1a1a1a' }],
    stock: true,
  },
  {
    id: 27, nombre: 'Top Deportivo El Ritmo de Tu Vida — Blanco', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '🎽', bg: 'linear-gradient(135deg, #e5e5e5, #1A56DB)',
    imagenes: ['tienda-productos/top-deportivo-el-ritmo-de-tu-vida-1-blanco.webp', 'tienda-productos/top-deportivo-el-ritmo-de-tu-vida-2-blanco.webp', 'tienda-productos/top-deportivo-el-ritmo-de-tu-vida-3-blanco.webp'],
    descripcion: 'Top deportivo en blanco que te invita a moverte al ritmo de tu vida. Tela técnica con excelente soporte y ventilación.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Blanco', hex: '#F5F5F5' }],
    stock: true,
  },
  {
    id: 28, nombre: 'Top Deportivo El Ritmo de Tu Vida — Negro', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '🎽', bg: 'linear-gradient(135deg, #1a1a1a, #E8341A)',
    imagenes: ['tienda-productos/top-deportivo-el-ritmo-de-tu-vida-1-negro.webp', 'tienda-productos/top-deportivo-el-ritmo-de-tu-vida-2-negro.webp', 'tienda-productos/top-deportivo-el-ritmo-de-tu-vida-3-negro.webp'],
    descripcion: 'Top deportivo en negro, el ritmo de tu vida en su versión más elegante. Soporte y estilo para cada entrenamiento.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Negro', hex: '#1a1a1a' }],
    stock: true,
  },
  {
    id: 29, nombre: 'Pantalón Deportivo Colombia Canta', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👖', bg: 'linear-gradient(135deg, #1A56DB, #1a1a1a)',
    imagenes: ['tienda-productos/pantalon-deportivo-colombia-canta-1.webp', 'tienda-productos/pantalon-deportivo-colombia-canta-2.webp', 'tienda-productos/pantalon-deportivo-colombia-canta-3.webp'],
    descripcion: 'Pantalón deportivo con el sello Colombia Canta. Tela elástica y cómoda para entrenar, correr o vivir tu día activo.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Azul/Negro', hex: '#1A56DB' }],
    stock: true,
  },
  {
    id: 30, nombre: 'Set Deportivo de Corazón', categoria: 'Otros', coleccion: 'drop1', precio: '$XX.000',
    tag: 'Popular',
    emoji: '🏃', bg: 'linear-gradient(135deg, #E8341A, #1A56DB)',
    imagenes: ['tienda-productos/set-deportivo-de-corazon-1.webp', 'tienda-productos/set-deportivo-de-corazon-2.webp', 'tienda-productos/set-deportivo-de-corazon-3.webp'],
    descripcion: 'Set deportivo completo de corazón colombiano. Conjunto top + pantalón para lucir y rendir al máximo con identidad.',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: [{ nombre: 'Multicolor', hex: '#E8341A' }],
    stock: true,
  },

  // KIT ME ENAMORAS
  {
    id: 31, nombre: 'Tote Bag Colcana', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👜', bg: 'linear-gradient(135deg, #F5C800, #B8960A)',
    imagenes: ['tienda-productos/tote-bag-colcana-1.webp', 'tienda-productos/tote-bag-colcana-2.webp', 'tienda-productos/tote-bag-colcana-3.webp'],
    descripcion: 'Tote Bag Colcana, el complemento perfecto para llevar tu amor por Colombia. Algodón resistente con diseño exclusivo.',
    tallas: [],
    colores: [{ nombre: 'Natural', hex: '#F5ECD7' }],
    stock: true,
  },
  {
    id: 32, nombre: 'Tote Bag Colombia Canta y Encanta', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👜', bg: 'linear-gradient(135deg, #E8341A, #F5C800)',
    imagenes: ['tienda-productos/tote-bag-colombia-canta-y-encanta-1.webp', 'tienda-productos/tote-bag-colombia-canta-y-encanta-2.webp', 'tienda-productos/tote-bag-colombia-canta-y-encanta-3.webp'],
    descripcion: 'La tote bag oficial de Colombia Canta y Encanta. Espaciosa, lavable y con estampado del logo que la hace inconfundible.',
    tallas: [],
    colores: [{ nombre: 'Natural', hex: '#F5ECD7' }],
    stock: true,
  },
  {
    id: 33, nombre: 'Tote Bag Colombia Encanta', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👜', bg: 'linear-gradient(135deg, #F5C800, #E8341A)',
    imagenes: ['tienda-productos/tote-bag-colombia-encanta-1.webp', 'tienda-productos/tote-bag-colombia-encanta-2.webp', 'tienda-productos/tote-bag-colombia-encanta-3.webp'],
    descripcion: 'Colombia encanta, y esta tote bag lo demuestra. Diseño limpio y elegante con mensaje positivo de identidad colombiana.',
    tallas: [],
    colores: [{ nombre: 'Natural', hex: '#F5ECD7' }],
    stock: true,
  },
  {
    id: 34, nombre: 'Tote Bag Te Llevo en Mi Corazón', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👜', bg: 'linear-gradient(135deg, #cc3333, #F5C800)',
    imagenes: ['tienda-productos/tote-bag-te-llevo-en-mi-corazon-1.webp', 'tienda-productos/tote-bag-te-llevo-en-mi-corazon-2.webp', 'tienda-productos/tote-bag-te-llevo-en-mi-corazon-3.webp'],
    descripcion: 'Te llevo en mi corazón, Colombia. Una tote bag con mensaje que lleva el cariño por el país a donde vayas.',
    tallas: [],
    colores: [{ nombre: 'Natural', hex: '#F5ECD7' }],
    stock: true,
  },
  {
    id: 35, nombre: 'Tote Bag Vibras', categoria: 'Bags', coleccion: 'drop1', precio: '$XX.000',
    tag: null,
    emoji: '👜', bg: 'linear-gradient(135deg, #6B21A8, #E8341A)',
    imagenes: ['tienda-productos/tote-bag-vibras-1.webp', 'tienda-productos/tote-bag-vibras-2.webp', 'tienda-productos/tote-bag-vibras-3.webp'],
    descripcion: 'Las vibras de Colombia en una sola bolsa. Estampado colorido y enérgico para quienes llevan la música en el alma.',
    tallas: [],
    colores: [{ nombre: 'Natural', hex: '#F5ECD7' }],
    stock: true,
  },
];

const parsePrecio = (precio) => parseInt(precio.replace(/\D/g, ''), 10);

const heroSlides = [
  {
    img: 'tienda-hero/sonidos-que-nos-unen.webp',
    tagline: 'SONIDOS QUE NOS UNEN',
    parrafo: 'Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.',
    cta: 'VER COLECCIÓN',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-1.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
    cta: 'COMPRAR AHORA',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-2.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
    cta: 'COMPRAR AHORA',
  },
];

const visteImgs = [
  'tienda-hero/viste-lo-que-sientes-1.webp',
  'tienda-hero/viste-lo-que-sientes-2.webp',
];

export default function Tienda() {
  const [coleccionActiva, setColeccionActiva] = useState('novedades');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [ordenarPor, setOrdenarPor] = useState('relevancia');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);
  const [heroSlideActivo, setHeroSlideActivo] = useState(0);
  const [visteActivo, setVisteActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroSlideActivo(i => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVisteActivo(i => (i + 1) % visteImgs.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtrados = productos
    .filter(p => p.coleccion === coleccionActiva)
    .filter(p => categoriaActiva === 'Todos' || p.categoria === categoriaActiva)
    .sort((a, b) => {
      if (ordenarPor === 'precio-bajo') return parsePrecio(a.precio) - parsePrecio(b.precio);
      if (ordenarPor === 'precio-alto') return parsePrecio(b.precio) - parsePrecio(a.precio);
      return 0;
    });

  const coleccionLabel = coleccionesSuperiores.find(c => c.id === coleccionActiva)?.nombre ?? 'PRODUCTOS';

  const handleAgregarSuccess = (nombre) => {
    setToast(`"${nombre}" agregado al carrito`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <main className="tienda-layout-raiz">

      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/tienda`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      {/* 1. Hero editorial asimétrico */}
      <section className="tienda-editorial-hero">
        <div
          className="hero-col-izq"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}tienda-hero/sonidos-que-nos-unen.webp)` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">SONIDOS QUE NOS UNEN</h2>
            <p className="hero-ed-parrafo">Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.</p>
            <button className="hero-ed-btn">VER COLECCIÓN</button>
          </div>
        </div>
        <div className="hero-col-der">
          {visteImgs.map((img, i) => (
            <div
              key={i}
              className="hero-col-der-bg"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${img})`,
                opacity: i === visteActivo ? 1 : 0,
              }}
            />
          ))}
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">VISTE LO QUE SIENTES</h2>
            <p className="hero-ed-parrafo">Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.</p>
            <button className="hero-ed-btn">COMPRAR AHORA</button>
          </div>
        </div>
      </section>

      {/* 1b. Hero como carrusel único — solo tablet/mobile */}
      <section className="tienda-hero-carrusel">
        <div
          className="hero-carrusel-slide"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${heroSlides[heroSlideActivo].img})` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">{heroSlides[heroSlideActivo].tagline}</h2>
            <p className="hero-ed-parrafo">{heroSlides[heroSlideActivo].parrafo}</p>
            <button className="hero-ed-btn">{heroSlides[heroSlideActivo].cta}</button>
          </div>
        </div>
        <div className="hero-carrusel-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-carrusel-dot${i === heroSlideActivo ? ' activo' : ''}`}
              onClick={() => setHeroSlideActivo(i)}
              aria-label={`Ver imagen ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. Ticker de anuncios */}
      <div className="tienda-anuncios-ticker">
        <div className="ticker-track">
          {[...Array(4)].map((_, idx) => (
            <span key={idx} className="ticker-text">
              ENVÍO GRATIS DESDE $220.000 &nbsp;•&nbsp; REGÍSTRATE A NUESTRA NEWSLETTER Y OBTÉN 10% DE DESCUENTO &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* 3. Pestañas de drops/colecciones */}
      <section className="seccion-colecciones-drops">
        <div className="container-tienda">
          <div className="grid-colecciones-links">
            {coleccionesSuperiores.map(col => (
              <button
                key={col.id}
                onClick={() => setColeccionActiva(col.id)}
                className={`btn-drop-tab ${coleccionActiva === col.id ? 'activo' : ''}`}
              >
                <span className="drop-tab-emoji">{col.emoji}</span> {col.nombre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Filtros por categoría + orden */}
      <section className="seccion-barra-navegacion-filtros">
        <div className="container-tienda">
          <span className="label-filtrar-por">FILTRAR POR CATEGORÍA</span>
          <div className="flex-tags-categorias">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`btn-categoria-tag ${categoriaActiva === cat ? 'activo' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="tienda-subcabecera-grid-cabecera">
            <h2 className="titulo-coleccion-actual">
              {coleccionLabel} <span className="estrella-decorativa">★</span>
            </h2>
            <div className="control-ordenar-dropdown">
              <span className="label-ordenar">ORDENAR POR</span>
              <div className="select-ordenar-wrap">
                <select value={ordenarPor} onChange={e => setOrdenarPor(e.target.value)} className="select-ordenar-native">
                  <option value="relevancia">Relevancia</option>
                  <option value="precio-bajo">Precio: Menor a Mayor</option>
                  <option value="precio-alto">Precio: Mayor a Menor</option>
                </select>
                <svg className="select-ordenar-icono" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Grid de productos — card propia del sitio */}
      <section className="seccion-grid-productos-galeria">
        <div className="container-tienda">
          <div className={`productos-grid${coleccionActiva === 'novedades' ? ' fila-unica-novedades' : ''}`}>
            {filtrados.map(prod => (
              <div
                key={prod.id}
                className="producto-card"
                onClick={() => setProductoSeleccionado(prod)}
              >
                {/* Zona imagen */}
                <div className="producto-card-imagen" style={{ background: prod.bg }}>
                  {prod.tag && <span className="producto-card-badge">{prod.tag}</span>}
                  {!prod.stock && <span className="producto-card-agotado">Agotado</span>}
                  {(prod.imagenes?.[0] ?? prod.imagen) ? (
                    <img
                      src={`${import.meta.env.BASE_URL}${prod.imagenes?.[0] ?? prod.imagen}`}
                      alt={prod.nombre}
                      className="producto-card-foto"
                      loading="lazy"
                    />
                  ) : (
                    <span className="producto-card-emoji" aria-hidden="true">{prod.emoji}</span>
                  )}

                  {/* Barra hover */}
                  <div
                    className="producto-card-hover-bar"
                    onClick={(e) => { e.stopPropagation(); setProductoSeleccionado(prod); }}
                  >
                    <span>Añadir al carrito</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>

                {/* Info debajo */}
                <div className="producto-card-info">
                  <div className="producto-card-fila-top">
                    <span className="producto-card-nombre">{prod.nombre}</span>
                    <span className="producto-card-precio">{prod.precio}</span>
                  </div>
                  <span className="producto-card-cat-label">{prod.categoria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Paneles inferiores: siempre visibles */}
      <section className="seccion-paneles-inferiores">
        <div className="container-tienda">
          <div className="grid-paneles-dobles">
            <div
              className="panel-inferior-item hecho-en-colombia"
              style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 10%, transparent 65%), url(${import.meta.env.BASE_URL}tienda-paneles/hecho-en-colombia.webp)` }}
            >
              <div className="panel-inf-contenido">
                <h2 className="panel-inf-titulo">❤️ HECHO EN COLOMBIA</h2>
                <p className="panel-inf-texto">Diseñado y producido localmente con orgullo y propósito.</p>
              </div>
            </div>
            <div
              className="panel-inferior-item accesorios-destacados"
              style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 10%, transparent 65%), url(${import.meta.env.BASE_URL}tienda-paneles/accesorios.webp)` }}
            >
              <div className="panel-inf-contenido">
                <h2 className="panel-inf-titulo">✨ ACCESORIOS</h2>
                <p className="panel-inf-texto">Pequeños detalles que dicen grandes cosas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="tienda-toast">✓ {toast}</div>
      )}

      {/* Modal de producto */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          onAgregarSuccess={handleAgregarSuccess}
        />
      )}

      <ContactoSection />
      <Footer />
    </main>
  );
}
