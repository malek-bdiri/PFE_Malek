import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from 'src/app/services/auth.service';

const authServiceStub = {
  currentUser: of({ firstname: 'Test', lastname: 'User', role: 'ADMIN', email: 'test@example.com' })
};

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, TranslateModule.forRoot()],
      declarations: [AdminLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
