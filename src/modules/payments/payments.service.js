'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');

/**
 * CU17: Gestión de Suscripción y Pagos (Stripe)
 * Servicio para gestionar suscripciones y pagos con Stripe
 */

// Configurar Stripe (en producción usar la clave real desde .env)
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (err) {
  console.warn('Stripe no configurado. Los pagos no funcionarán.');
}

/**
 * Planes disponibles (actualizados para coincidir con la landing page)
 */
const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: {
      maxEvents: 1,
      maxTasksPerEvent: 5,
      aiMatching: false,
      analytics: false,
    },
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    // Usar variable de entorno o placeholder
    priceId: process.env.STRIPE_PRICE_BASIC || 'price_basic_monthly',
    features: {
      maxEvents: 10,
      maxTasksPerEvent: 50,
      aiMatching: true,
      analytics: true,
    },
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
    features: {
      maxEvents: -1, // Ilimitado
      maxTasksPerEvent: -1,
      aiMatching: true,
      analytics: true,
      predictiveAI: true,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    features: {
      maxEvents: -1,
      maxTasksPerEvent: -1,
      aiMatching: true,
      analytics: true,
      predictiveAI: true,
      dedicatedSupport: true,
      customIntegrations: true,
    },
    // Solo para usuarios autorizados
    authorizedEmails: ['oliver679801@gmail.com'],
  },
};

/**
 * Obtiene la suscripción actual de una organización
 */
const getCurrentSubscription = async (userId) => {
  const prisma = getPrisma();

  // Obtener organización del usuario
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      role: 'OWNER',
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes una organización asociada');
  }

  const subscription = membership.organization.subscription;

  if (!subscription) {
    // Crear suscripción FREE por defecto
    const newSub = await prisma.subscription.create({
      data: {
        organizationId: membership.organization.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });
    return {
      subscription: newSub,
      plan: PLANS.FREE,
    };
  }

  return {
    subscription,
    plan: PLANS[subscription.plan],
  };
};

/**
 * Crea una sesión de checkout de Stripe
 */
const createCheckoutSession = async (userId, planName) => {
  if (!stripe) {
    throw new ValidationError('Stripe no está configurado');
  }

  const prisma = getPrisma();

  // Validar plan
  if (!PLANS[planName] || planName === 'FREE') {
    throw new ValidationError('Plan inválido');
  }

  const plan = PLANS[planName];

  // Obtener organización
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      role: 'OWNER',
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes una organización asociada');
  }

  const org = membership.organization;

  // Crear o recuperar cliente de Stripe
  let customerId = org.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.contactEmail,
      metadata: {
        organizationId: org.id,
      },
    });
    customerId = customer.id;
  }

  // Crear sesión de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription?cancelled=true`,
    metadata: {
      organizationId: org.id,
      plan: planName,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};

/**
 * Webhook de Stripe para procesar eventos
 */
const handleStripeWebhook = async (rawBody, signature) => {
  if (!stripe) {
    throw new ValidationError('Stripe no está configurado');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  // Si hay webhook secret, verificar la firma
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new ValidationError(`Webhook signature verification failed: ${err.message}`);
    }
  } else {
    // En desarrollo, permitir eventos sin firma (no recomendado en producción)
    event = JSON.parse(rawBody.toString());
  }

  const prisma = getPrisma();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { organizationId, plan } = session.metadata;

      // Actualizar o crear suscripción
      await prisma.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          plan,
          status: 'ACTIVE',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        },
        update: {
          plan,
          status: 'ACTIVE',
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customerId = subscription.customer;

      // Buscar organización por customer ID
      const sub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (sub) {
        // Crear registro de pago
        await prisma.payment.create({
          data: {
            subscriptionId: sub.id,
            organizationId: sub.organizationId,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid / 100, // Convertir de centavos
            currency: invoice.currency.toUpperCase(),
            status: 'COMPLETED',
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
          },
        });
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customerId = subscription.customer;

      const sub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (sub) {
        // Actualizar estado a PAST_DUE
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'PAST_DUE' },
        });
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          status: 'CANCELLED',
          plan: 'FREE',
        },
      });

      break;
    }
  }

  return { received: true };
};

/**
 * Cancela la suscripción actual
 */
const cancelSubscription = async (userId) => {
  if (!stripe) {
    throw new ValidationError('Stripe no está configurado');
  }

  const prisma = getPrisma();

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      role: 'OWNER',
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!membership || !membership.organization.subscription) {
    throw new NotFoundError('No se encontró suscripción activa');
  }

  const sub = membership.organization.subscription;

  if (sub.plan === 'FREE') {
    throw new ValidationError('No puedes cancelar el plan gratuito');
  }

  // Cancelar en Stripe
  if (sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Actualizar en DB
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      cancelAtPeriodEnd: true,
    },
  });

  return {
    success: true,
    message: 'Suscripción cancelada al final del período',
  };
};

module.exports = {
  PLANS,
  getCurrentSubscription,
  createCheckoutSession,
  handleStripeWebhook,
  cancelSubscription,
};


