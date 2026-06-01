declare module 'next-i18n' {
  export type UseTranslationResponse = {
    t: (key: string, options?: Record<string, unknown>) => string;
  };

  export function useTranslation(namespace?: string): UseTranslationResponse;
}


