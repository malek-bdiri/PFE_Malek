import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningNewComponent } from './planning-new.component';

describe('PlanningNewComponent', () => {
  let component: PlanningNewComponent;
  let fixture: ComponentFixture<PlanningNewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlanningNewComponent]
    });
    fixture = TestBed.createComponent(PlanningNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
