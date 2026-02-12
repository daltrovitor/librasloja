
/**
 * App Configuration
 * Configurações globais da aplicação
 */

export const APP_CONFIG = {
  // Modo de operação
  isTestMode: process.env.PAYMENT_MODE === 'test',

  // URLs
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Pagamento
  payment: {
    stripe: {
      publishableKey: process.env.PAYMENT_MODE === 'test'
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.PAYMENT_MODE === 'test'
        ? process.env.STRIPE_SECRET_KEY_TEST
        : process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Margens padrão
  margins: {
    defaultPercent: 20, // 20% padrão
    defaultFixed: 10, // R$ 10 padrão para margem fixa
  },

  // Frete
  shipping: {
    freeShippingThreshold: 200, // R$ 200 para frete grátis
    defaultShippingCost: 15, // R$ 15 frete padrão
  },
}

/**
 * Verifica se está em modo de teste
 */
export function isTestMode(): boolean {
  return APP_CONFIG.isTestMode
}

/**
 * Obtém configuração do Stripe baseada no modo
 */
export function getStripeConfig() {
  const config = APP_CONFIG.payment.stripe

  // Allow running without stripe keys if not needed immediately, 
  // but if called, it should throw or return partial.
  // Ideally, we just return what we have.

  return config
}

/**
 * Formata preço baseado no modo (em teste, adiciona prefixo)
 */
export function formatPriceForMode(price: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)

  return isTestMode() ? `TESTE: ${formatted}` : formatted
}

/**
 * Verifica se um pedido é de teste baseado no modo global
 */
export function isTestOrder(): boolean {
  return isTestMode()
}

export default APP_CONFIG
