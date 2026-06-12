import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiffrageLicenceComponent } from './chiffrage-licence.component';

describe('ChiffrageLicenceComponent', () => {
  let component: ChiffrageLicenceComponent;
  let fixture: ComponentFixture<ChiffrageLicenceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChiffrageLicenceComponent]
    });
    fixture = TestBed.createComponent(ChiffrageLicenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
