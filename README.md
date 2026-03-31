# Gestión de Préstamos 📊

Una aplicación móvil completa para la gestión de préstamos y abonos desarrollada con React Native y Expo. Permite a las organizaciones gestionar eficientemente sus operaciones de préstamo, desde la creación de préstamos hasta el seguimiento de pagos y generación de reportes.

## 🚀 Características Principales

### 👥 Gestión de Usuarios y Autenticación
- **Registro de organizaciones**: Creación de cuentas para nuevas organizaciones
- **Registro de empleados**: Gestión de usuarios dentro de la organización
- **Autenticación segura**: Login con validación de credenciales
- **Recuperación de contraseña**: Sistema de recuperación vía correo electrónico
- **Validación de correos**: Verificación de cuentas de usuario

### 👨‍💼 Gestión de Clientes
- **Registro completo de clientes**: Información personal y financiera
- **Búsqueda y filtrado**: Localizar clientes rápidamente
- **Historial de préstamos**: Vista completa del historial crediticio
- **Gestión de abonos**: Registro y seguimiento de pagos

### 💰 Sistema de Préstamos
- **Creación de préstamos**: Configuración completa con términos personalizados
- **Cálculos automáticos**: Generación automática de calendario de pagos
- **Múltiples tipos de interés**: Sistema flexible de cálculo de intereses
- **Seguimiento de cuotas**: Monitoreo del estado de cada cuota
- **Alertas de mora**: Notificaciones automáticas para cuotas vencidas

### 📊 Reportes y Analytics
- **Dashboard ejecutivo**: Vista general del estado financiero
- **Reportes de préstamos**: Análisis detallado por período
- **Métricas de rendimiento**: KPIs de la operación
- **Exportación de datos**: Posibilidad de exportar reportes

### 🔧 Arquitectura Técnica

#### Tecnologías Utilizadas
- **React Native 0.72+** con **Expo SDK 49+**
- **TypeScript** para tipado fuerte
- **SQLite** con expo-sqlite para persistencia local
- **NativeWind** (TailwindCSS para React Native)
- **Expo Router** para navegación basada en archivos

#### Estructura de Servicios
```
services/
├── loan.service.js          # Gestión completa de préstamos
├── payment.service.js       # Manejo de pagos y abonos
├── installment.service.js   # Gestión de cuotas individuales
├── client.service.js        # Operaciones con clientes
├── user.service.js          # Gestión de usuarios
├── printer.service.js       # Servicios de impresión
└── storage.service.ts       # Almacenamiento seguro
```

#### Utilidades Financieras
```
utils/
├── amortization.utils.js     # Cálculos de amortización
├── interest.utils.js         # Cálculos de interés múltiples
├── latefee.utils.js          # Gestión de moras y penalizaciones
└── payment-distribution.utils.js  # Distribución inteligente de pagos
```

## 🏗️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Expo CLI
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS, solo macOS)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Imer-Alejandro/gestion-prestamos.git
   cd gestion-prestamos
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npx expo start
   ```

### Configuración de Base de Datos

La aplicación utiliza SQLite con expo-sqlite. Las tablas se crean automáticamente al iniciar la aplicación:

- `users` - Usuarios del sistema
- `organizations` - Organizaciones
- `clients` - Clientes
- `loans` - Préstamos
- `loan_installments` - Cuotas de préstamos
- `payments` - Pagos realizados

## 📱 Uso de la Aplicación

### Flujo de Trabajo Típico

1. **Registro/Inicio de Sesión**
   - Crear cuenta de organización
   - Registrar empleados
   - Iniciar sesión

2. **Gestión de Clientes**
   - Registrar nuevos clientes
   - Buscar clientes existentes
   - Ver historial de préstamos

3. **Creación de Préstamos**
   - Seleccionar cliente
   - Configurar términos del préstamo
   - Sistema calcula automáticamente el calendario de pagos

4. **Seguimiento de Pagos**
   - Registrar abonos
   - Ver estado de cuotas
   - Recibir alertas de mora

5. **Reportes**
   - Generar reportes financieros
   - Analizar rendimiento
   - Exportar datos

## 🔧 Desarrollo

### Estructura del Proyecto
```
app/                    # Páginas (File-based routing)
├── _layout.tsx        # Layout principal
├── index.tsx          # Pantalla de inicio
├── login/             # Módulo de autenticación
├── clientes/          # Gestión de clientes
├── prestamos_abonos/  # Préstamos y abonos
├── empleados/         # Gestión de empleados
├── reportes/          # Reportes y analytics
└── configuracion/     # Configuración del sistema

components/            # Componentes reutilizables
├── shared/           # Componentes compartidos
├── home/             # Componentes del dashboard
├── clientes/         # Componentes de clientes
└── prestamos_abonos/ # Componentes de préstamos

services/             # Lógica de negocio
utils/               # Utilidades
contexts/            # Contextos de React
hooks/               # Custom hooks
constants/           # Constantes de la aplicación
```

### Scripts Disponibles

```bash
# Desarrollo
npm start              # Iniciar servidor de desarrollo
npm run android        # Ejecutar en Android
npm run ios           # Ejecutar en iOS
npm run web           # Ejecutar en web

# Testing
npm test              # Ejecutar tests
npm run test:watch    # Tests en modo watch

# Linting
npm run lint          # Ejecutar ESLint
npm run lint:fix      # Corregir errores de linting

# Build
npm run build         # Crear build de producción
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar tests de un archivo específico
npm test -- services/loan.service.test.js
```

## 🚀 Despliegue

### Build para Producción

1. **Configurar app.json**
   ```json
   {
     "expo": {
       "name": "Gestión de Préstamos",
       "slug": "gestion-prestamos",
       "version": "1.0.0",
       "orientation": "portrait"
     }
   }
   ```

2. **Build para plataformas**
   ```bash
   # Android
   npx expo build:android

   # iOS
   npx expo build:ios
   ```

3. **Publicar en Expo**
   ```bash
   npx expo publish
   ```

## 📋 API Reference

### Servicios Principales

#### Loan Service
```javascript
import { getLoans, createLoan } from './services/loan.service';

// Obtener préstamos de un usuario
const loans = await getLoans(userId);

// Crear nuevo préstamo
const newLoan = await createLoan(userId, loanData);
```

#### Payment Service
```javascript
import { createPayment, getPayments } from './services/payment.service';

// Registrar pago
await createPayment(userId, paymentData);

// Obtener pagos
const payments = await getPayments(userId);
```

#### Client Service
```javascript
import { getClients, createClient } from './services/client.service';

// Obtener clientes
const clients = await getClients(userId);

// Crear cliente
const newClient = await createClient(userId, clientData);
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Guías de Contribución
- Seguir convenciones de código TypeScript
- Escribir tests para nuevas funcionalidades
- Actualizar documentación
- Mantener compatibilidad con Expo SDK

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@gestionprestamos.com
- 💬 Discord: [Unirse a la comunidad](https://discord.gg/gestion-prestamos)
- 📖 Documentación: [docs.gestionprestamos.com](https://docs.gestionprestamos.com)

## 🙏 Agradecimientos

- Expo Team por la excelente plataforma
- React Native Community
- Contribuidores del proyecto

---

**Desarrollado con ❤️ para facilitar la gestión financiera de organizaciones**
