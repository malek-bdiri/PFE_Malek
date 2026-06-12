import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSpecDetailComponent } from './ui-spec-detail.component';

describe('UiSpecDetailComponent', () => {
  let component: UiSpecDetailComponent;
  let fixture: ComponentFixture<UiSpecDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiSpecDetailComponent]
    });
    fixture = TestBed.createComponent(UiSpecDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
