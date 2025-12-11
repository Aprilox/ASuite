'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/providers/locale-provider';
import { FlagIcon } from './flag-icon';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { locale, setLocale, locales, localeNames } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (newLocale: typeof locale) => {
    setIsOpen(false);
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
        type="button"
      >
        <FlagIcon locale={locale} className="w-5 h-4 shadow-sm" />
        {variant === 'default' && (
          <>
            <span>{localeNames[locale]}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </>
        )}
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-40 bg-popover border rounded-lg shadow-lg py-1 z-50">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                type="button"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left ${
                  locale === loc ? 'bg-accent font-medium' : ''
                }`}
              >
                <FlagIcon locale={loc} className="w-5 h-4 shadow-sm" />
                <span>{localeNames[loc]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
