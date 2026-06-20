import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts: Toast[] = [];
  readonly toasts$ = new BehaviorSubject<Toast[]>([]);
  private _nextId = 0;

  success(message: string, title = 'Succès'): void { this._add('success', message, title, 4000); }
  error(message: string, title = 'Erreur'): void { this._add('error', message, title, 6000); }
  warning(message: string, title?: string): void { this._add('warning', message, title); }
  info(message: string, title?: string): void { this._add('info', message, title); }

  dismiss(id: number): void {
    this._toasts = this._toasts.filter(t => t.id !== id);
    this.toasts$.next([...this._toasts]);
  }

  private _add(type: ToastType, message: string, title?: string, duration = 4000): void {
    const id = ++this._nextId;
    this._toasts = [...this._toasts, { id, type, message, title }];
    this.toasts$.next([...this._toasts]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
