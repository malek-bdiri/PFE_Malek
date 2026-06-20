import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html'
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private _sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this._sub = this.toastService.toasts$.subscribe(t => (this.toasts = t));
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  trackById(_: number, toast: Toast): number {
    return toast.id;
  }
}
