import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiuxNewComponent } from './uiux-new.component';

describe('UiuxNewComponent', () => {
  let component: UiuxNewComponent;
  let fixture: ComponentFixture<UiuxNewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiuxNewComponent]
    });
    fixture = TestBed.createComponent(UiuxNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
