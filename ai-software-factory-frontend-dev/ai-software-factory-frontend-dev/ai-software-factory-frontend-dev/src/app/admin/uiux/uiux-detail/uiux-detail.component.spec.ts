import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiuxDetailComponent } from './uiux-detail.component';

describe('UiuxDetailComponent', () => {
  let component: UiuxDetailComponent;
  let fixture: ComponentFixture<UiuxDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiuxDetailComponent]
    });
    fixture = TestBed.createComponent(UiuxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
