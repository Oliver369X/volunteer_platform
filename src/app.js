'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const { errorMiddleware, notFoundHandler } = require('./middlewares/error-handler');
const requestContext = require('./middlewares/request-context');

const app = express();

// Configuración de CORS más robusta
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://urchin-app-w4fo2.ondigitalocean.app',  // Frontend en producción (antiguo)
    'https://starfish-app-3fwtw.ondigitalocean.app', // Frontend en producción (actual)
    'https://dolphin-app-vz5up.ondigitalocean.app',  // Backend en producción (antiguo)
    'https://dolphin-app-4ehoz.ondigitalocean.app',  // Backend en producción (actual)
    process.env.FRONTEND_URL, // Variable de entorno
  ].filter(Boolean), // Filtrar undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight por 10 minutos
};

app.use(helmet());
app.use(cors(corsOptions));

// Webhook de Stripe necesita el body raw
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(requestContext());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorMiddleware);

module.exports = app;


