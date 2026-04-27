export interface RDLocation {
  provincia: string;
  municipios: {
    nombre: string;
    sectores: string[];
  }[];
}

export const RD_LOCATIONS: RDLocation[] = [
  {
    provincia: "Distrito Nacional",
    municipios: [
      {
        nombre: "Santo Domingo de Guzmán",
        sectores: [
          "Piantini", "Naco", "Gazcue", "Bella Vista", "Los Prados", 
          "Ensanche Quisqueya", "Mirador Sur", "Mirador Norte", 
          "Arroyo Hondo", "Cristo Rey", "Villa Juana", "Villa Francisca",
          "San Carlos", "Ciudad Nueva", "Zona Colonial", "Honduras",
          "Manganagua", "Los Ríos", "Los Cacicazgos", "La Julia",
          "Ensanche Luperón", "Ensanche Espaillat", "24 de Abril",
          "Gualey", "La Ciénaga", "Los Guandules", "Simón Bolívar",
          "Capotillo", "Villas Agrícolas", "La Agustina"
        ]
      }
    ]
  },
  {
    provincia: "Santo Domingo",
    municipios: [
      {
        nombre: "Santo Domingo Este",
        sectores: [
          "Alma Rosa", "Ensanche Ozama", "Lucerna", "Los Minas", 
          "Invivienda", "Cancino", "San Isidro", "El Almirante", 
          "Mendoza", "Villa Duarte", "Las Américas", "Hainamosa",
          "Los Tres Brazos", "El Rosal", "Italia", "Los Frailes",
          "La Isabelita", "Tropical Park", "Prados del Este"
        ]
      },
      {
        nombre: "Santo Domingo Norte",
        sectores: [
          "Villa Mella", "Sabana Perdida", "Guaricanos", "La Victoria", 
          "El Edén", "Haras Nacionales", "Los Casicazgos Norte",
          "San Felipe", "Punta", "Lotes y Servicios"
        ]
      },
      {
        nombre: "Santo Domingo Oeste",
        sectores: [
          "Herrera", "Las Caobas", "Bayona", "Manoguayabo", "Buenos Aires", 
          "El Libertador", "Enriquillo", "Iván Guzmán Klang"
        ]
      },
      {
        nombre: "Los Alcarrizos",
        sectores: ["Pantoja", "Palmarejo", "Nuevo Horizonte", "La Fe", "Savica"]
      },
      {
        nombre: "Boca Chica",
        sectores: ["Andrés", "La Caleta", "Los Tanquecitos", "Monte Rey"]
      },
      {
        nombre: "Pedro Brand",
        sectores: ["Centro", "La Guáyiga", "La Cuaba"]
      }
    ]
  },
  {
    provincia: "Santiago",
    municipios: [
      {
        nombre: "Santiago de los Caballeros",
        sectores: [
          "Los Jardines", "Villa Olga", "Cerros de Gurabo", "El Dorado", 
          "Pueblo Nuevo", "Cienfuegos", "La Joya", "Los Pepines", 
          "Baracoa", "Hato del Yaque", "Los Ciruelitos", "Ensanche Libertad",
          "Gurabo", "Las Colinas", "La Barranquita", "Pekín", "Nibaje"
        ]
      },
      { nombre: "Baitoa", sectores: ["Centro"] },
      { nombre: "Jánico", sectores: ["Centro"] },
      { nombre: "Licey al Medio", sectores: ["Centro"] },
      { nombre: "Puñal", sectores: ["Centro"] },
      { nombre: "Tamboril", sectores: ["Centro"] },
      { nombre: "Villa González", sectores: ["Centro"] },
      { nombre: "Navarrete", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "La Vega",
    municipios: [
      {
        nombre: "Concepción de La Vega",
        sectores: ["Centro", "Pontón", "Palmarito", "Jeremías", "El Vedado", "Soto", "Guaigüí"]
      },
      { nombre: "Constanza", sectores: ["Centro", "La Sabina", "Tireo"] },
      { nombre: "Jarabacoa", sectores: ["Centro", "Pinar Quemado", "Paso Bajito"] },
      { nombre: "Jima Abajo", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "La Altagracia",
    municipios: [
      {
        nombre: "Higüey",
        sectores: [
          "Centro", "Villa Cerro", "Los Sotos", "San Francisco", 
          "21 de Enero", "Los Platanitos", "Savica", "Juan Pablo Duarte",
          "Nazareth", "Antonio Guzmán", "Anamuya", "La Malena",
          "La Florida", "Villa Cristal", "El Llano", "Pepe Rosario",
          "Villa Esperanza", "Villa Francisca", "San José", "San Martín"
        ]
      },
      {
        nombre: "Punta Cana",
        sectores: ["Bávaro", "Verón", "Cap Cana", "Pueblo Bávaro", "Friusa", "Cortecito", "Los Corales"]
      },
      { nombre: "San Rafael del Yuma", sectores: ["Centro", "Bayahibe", "Boca de Yuma"] }
    ]
  },
  {
    provincia: "Puerto Plata",
    municipios: [
      {
        nombre: "San Felipe de Puerto Plata",
        sectores: ["Centro", "Costambar", "Playa Dorada", "Torre Alta", "San Marcos", "El Javillar"]
      },
      { nombre: "Sosúa", sectores: ["Centro", "Cabarete", "El Batey", "Los Charamicos"] },
      { nombre: "Imbert", sectores: ["Centro"] },
      { nombre: "Altamira", sectores: ["Centro"] },
      { nombre: "Luperón", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "San Cristóbal",
    municipios: [
      {
        nombre: "San Cristóbal",
        sectores: ["Centro", "Madre Vieja Norte", "Madre Vieja Sur", "Lava Pies", "Pueblo Nuevo", "Los Novilleros", "Canástica"]
      },
      { nombre: "Bajos de Haina", sectores: ["Centro", "Quita Sueño", "El Carril"] },
      { nombre: "Villa Altagracia", sectores: ["Centro"] },
      { nombre: "Yaguate", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "La Romana",
    municipios: [
      {
        nombre: "La Romana",
        sectores: ["Centro", "Buena Vista", "Villa Hermosa", "Quisqueya", "Papagayo", "Villa Verde"]
      },
      { nombre: "Guaymate", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "San Pedro de Macorís",
    municipios: [
      {
        nombre: "San Pedro de Macorís",
        sectores: ["Centro", "Miramar", "Placer Bonito", "Villa Velásquez", "Barrio Lindo", "México"]
      },
      { nombre: "Consuelo", sectores: ["Centro"] },
      { nombre: "Quisqueya", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Azua",
    municipios: [
      { nombre: "Azua de Compostela", sectores: ["Centro", "La Bombita", "Los Parceleros"] },
      { nombre: "Padre Las Casas", sectores: ["Centro"] },
      { nombre: "Peralta", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Bahoruco",
    municipios: [
      { nombre: "Neiba", sectores: ["Centro"] },
      { nombre: "Tamayo", sectores: ["Centro"] },
      { nombre: "Galván", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Barahona",
    municipios: [
      { nombre: "Barahona", sectores: ["Centro", "Villa Central", "Casandra"] },
      { nombre: "Cabral", sectores: ["Centro"] },
      { nombre: "Enriquillo", sectores: ["Centro"] },
      { nombre: "Vicente Noble", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Dajabón",
    municipios: [
      { nombre: "Dajabón", sectores: ["Centro"] },
      { nombre: "Loma de Cabrera", sectores: ["Centro"] },
      { nombre: "Restauración", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Duarte",
    municipios: [
      { nombre: "San Francisco de Macorís", sectores: ["Centro", "Santa Ana", "Pueblo Nuevo", "Los Maestros"] },
      { nombre: "Castillo", sectores: ["Centro"] },
      { nombre: "Pimentel", sectores: ["Centro"] },
      { nombre: "Villa Riva", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "El Seibo",
    municipios: [
      { nombre: "El Seibo", sectores: ["Centro"] },
      { nombre: "Miches", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Elías Piña",
    municipios: [
      { nombre: "Comendador", sectores: ["Centro"] },
      { nombre: "Bánica", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Espaillat",
    municipios: [
      { nombre: "Moca", sectores: ["Centro", "Juan Lopito", "Estancia Nueva"] },
      { nombre: "Gaspar Hernández", sectores: ["Centro"] },
      { nombre: "Jamao al Norte", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Hato Mayor",
    municipios: [
      { nombre: "Hato Mayor del Rey", sectores: ["Centro"] },
      { nombre: "Sabana de la Mar", sectores: ["Centro"] },
      { nombre: "El Valle", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Hermanas Mirabal",
    municipios: [
      { nombre: "Salcedo", sectores: ["Centro"] },
      { nombre: "Tenares", sectores: ["Centro"] },
      { nombre: "Villa Tapia", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Independencia",
    municipios: [
      { nombre: "Jimaní", sectores: ["Centro"] },
      { nombre: "Duvergé", sectores: ["Centro"] },
      { nombre: "La Descubierta", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "María Trinidad Sánchez",
    municipios: [
      { nombre: "Nagua", sectores: ["Centro", "El Factor"] },
      { nombre: "Cabrera", sectores: ["Centro"] },
      { nombre: "Río San Juan", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Monseñor Nouel",
    municipios: [
      { nombre: "Bonao", sectores: ["Centro", "Prosperidad", "Los Transformadores"] },
      { nombre: "Maimón", sectores: ["Centro"] },
      { nombre: "Piedra Blanca", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Monte Cristi",
    municipios: [
      { nombre: "Monte Cristi", sectores: ["Centro"] },
      { nombre: "Castañuelas", sectores: ["Centro"] },
      { nombre: "Guayubín", sectores: ["Centro"] },
      { nombre: "Villa Vásquez", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Monte Plata",
    municipios: [
      { nombre: "Monte Plata", sectores: ["Centro"] },
      { nombre: "Bayaguana", sectores: ["Centro"] },
      { nombre: "Yamasá", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Pedernales",
    municipios: [
      { nombre: "Pedernales", sectores: ["Centro"] },
      { nombre: "Oviedo", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Peravia",
    municipios: [
      { nombre: "Baní", sectores: ["Centro", "Paya", "Sombrero"] },
      { nombre: "Nizao", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Samaná",
    municipios: [
      { nombre: "Samaná", sectores: ["Centro"] },
      { nombre: "Las Terrenas", sectores: ["Centro"] },
      { nombre: "Sánchez", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "San José de Ocoa",
    municipios: [
      { nombre: "San José de Ocoa", sectores: ["Centro"] },
      { nombre: "Sabana Larga", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "San Juan",
    municipios: [
      { nombre: "San Juan de la Maguana", sectores: ["Centro"] },
      { nombre: "Las Matas de Farfán", sectores: ["Centro"] },
      { nombre: "El Cercado", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Sánchez Ramírez",
    municipios: [
      { nombre: "Cotuí", sectores: ["Centro"] },
      { nombre: "Fantino", sectores: ["Centro"] },
      { nombre: "Villa La Mata", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Santiago Rodríguez",
    municipios: [
      { nombre: "Sabaneta", sectores: ["Centro"] },
      { nombre: "Monción", sectores: ["Centro"] }
    ]
  },
  {
    provincia: "Valverde",
    municipios: [
      { nombre: "Mao", sectores: ["Centro"] },
      { nombre: "Esperanza", sectores: ["Centro"] },
      { nombre: "Laguna Salada", sectores: ["Centro"] }
    ]
  }
];
