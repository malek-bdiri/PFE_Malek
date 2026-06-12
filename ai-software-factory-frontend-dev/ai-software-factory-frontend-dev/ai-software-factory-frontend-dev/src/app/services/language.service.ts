import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly LANG_KEY = 'momsoft_lang';

  availableLanguages: LanguageOption[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];

  constructor(private translate: TranslateService) {}

  init(): void {
    const saved = localStorage.getItem(this.LANG_KEY) || 'fr';
    const language = this.availableLanguages.some(lang => lang.code === saved) ? saved : 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(language);
    document.dir = 'ltr';
  }

  changeLanguage(code: string): void {
    if (!this.availableLanguages.some(lang => lang.code === code)) {
      return;
    }
    this.translate.use(code);
    localStorage.setItem(this.LANG_KEY, code);
    document.dir = 'ltr';
  }

  get current(): string {
    return this.translate.currentLang || 'fr';
  }
}
