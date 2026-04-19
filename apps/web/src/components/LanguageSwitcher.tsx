import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'cs', label: 'Čeština' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
