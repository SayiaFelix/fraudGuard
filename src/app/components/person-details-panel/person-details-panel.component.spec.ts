import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonDetailsPanelComponent } from './person-details-panel.component';

describe('PersonDetailsPanelComponent', () => {
  let component: PersonDetailsPanelComponent;
  let fixture: ComponentFixture<PersonDetailsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonDetailsPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonDetailsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
