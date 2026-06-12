import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfdNewComponent } from './afd-new.component';

describe('AfdNewComponent', () => {
  let component: AfdNewComponent;
  let fixture: ComponentFixture<AfdNewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AfdNewComponent]
    });
    fixture = TestBed.createComponent(AfdNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
