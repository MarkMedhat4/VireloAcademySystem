/**
 * Environment helpers. Nothing here throws at import time so `next build` works
 * without secrets; features degrade to a friendly Arabic message instead.
 */

function looksReal(value: string | undefined): value is string {
  return !!value && !value.includes("YOUR-") && value.length > 10;
}

export function isSupabaseConfigured(): boolean {
  return looksReal(process.env.NEXT_PUBLIC_SUPABASE_URL) && looksReal(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && looksReal(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const NOT_CONFIGURED_MESSAGE = "الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع إدارة الأكاديمية.";
