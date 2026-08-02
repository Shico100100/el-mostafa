declare module 'next-i18n' {
  export type UseTranslationResponse = {
    t: (key: string, options?: Record<string, string | number | boolean>) => string;
  };

  export function useTranslation(namespace?: string): UseTranslationResponse;
}


