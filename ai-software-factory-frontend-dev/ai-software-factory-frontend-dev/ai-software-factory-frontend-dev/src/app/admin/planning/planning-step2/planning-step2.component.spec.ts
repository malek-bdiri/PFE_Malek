import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningStep2Component } from './planning-step2.component';

describe('PlanningStep2Component', () => {
  let component: PlanningStep2Component;
  let fixture: ComponentFixture<PlanningStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlanningStep2Component]
    });
    fixture = TestBed.createComponent(PlanningStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
