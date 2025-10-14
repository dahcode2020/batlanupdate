import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validation des variables d'environnement
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  const error = new Error('Variables d\'environnement Supabase manquantes');
  logger.error('Supabase configuration error', error, {
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });
  
  if (import.meta.env.DEV) {
    console.warn('⚠️ Variables d\'environnement Supabase manquantes - Mode fallback activé');
    console.warn('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Définie' : '❌ Manquante');
    console.warn('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante');
    console.warn('💡 L\'application fonctionnera avec les comptes de test intégrés');
  }
}

// Validation de l'URL
try {
  new URL(supabaseUrl);
  logger.info('Supabase URL validated', { url: supabaseUrl });
} catch (error) {
  logger.error('Invalid Supabase URL', error as Error, { url: supabaseUrl });
  
  if (import.meta.env.DEV) {
    console.error('❌ URL Supabase invalide:', supabaseUrl);
    console.log('💡 Veuillez configurer une URL valide dans VITE_SUPABASE_URL (ex: https://votre-projet.supabase.co)');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': `banque-atlantique-web@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection monitoring
supabase.auth.onAuthStateChange((event, session) => {
  logger.info('Auth state changed', { event, userId: session?.user?.id });
});
