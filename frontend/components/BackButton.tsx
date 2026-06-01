'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const GO_BACK = Symbol('go-back');

type BackTarget = string | typeof GO_BACK;

interface BackButtonContextType {
  setBackButton: (target: BackTarget | null) => void;
}

const BackButtonContext = createContext<BackButtonContextType>({
  setBackButton: () => {},
});

export function BackButtonProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<BackTarget | null>(null);
  const router = useRouter();

  const setBackButton = useCallback((newTarget: BackTarget | null) => {
    setTarget(newTarget);
  }, []);

  const handleClick = useCallback(() => {
    if (target === GO_BACK) {
      router.back();
    } else if (target) {
      router.push(target);
    }
    setTarget(null);
  }, [target, router]);

  return (
    <BackButtonContext.Provider value={{ setBackButton }}>
      {target !== null && (
        <button
          onClick={handleClick}
          className="fixed top-4 left-4 z-[100] p-2.5 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full hover:bg-white/20 transition-all text-white shadow-lg hover:scale-105 active:scale-95"
          aria-label="رجوع"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {children}
    </BackButtonContext.Provider>
  );
}

export function useSetBackButton(target: BackTarget | null) {
  const { setBackButton } = useContext(BackButtonContext);

  useEffect(() => {
    setBackButton(target);
    return () => setBackButton(null);
  }, [target, setBackButton]);
}

export { GO_BACK };
