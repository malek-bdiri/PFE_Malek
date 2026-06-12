import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningGanttComponent } from './planning-gantt.component';

describe('PlanningGanttComponent', () => {
  let component: PlanningGanttComponent;
  let fixture: ComponentFixture<PlanningGanttComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlanningGanttComponent]
    });
    fixture = TestBed.createComponent(PlanningGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
