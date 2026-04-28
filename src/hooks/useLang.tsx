import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { STRINGS, type Lang, type StringKey } from '../i18n'

const LS_KEY = 'meshcore-lang'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
}

export const LangContext = createContext<LangContextValue>({
  lang: 'nl',
  setLang: () => {},
  t: (key) => STRINGS.nl[key],
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(LS_KEY) as Lang) || 'nl'
  )

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(LS_KEY, l)
  }, [])

  const t = useCallback((key: StringKey): string => {
    return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
