import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { EventsFilterComponent } from './events-filter.component';
import { selectEventsFilters } from '../../store/events/events.selectors';
import { changeFilter } from '../../store/events/events.actions';
import { EventType } from '../../shared/models/event.model';

describe('EventsFilterComponent', () => {
  let component: EventsFilterComponent;
  let fixture: ComponentFixture<EventsFilterComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsFilterComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectEventsFilters, value: {} }],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    fixture = TestBed.createComponent(EventsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render UserId input, Type select, Description input, date range inputs, and Clear button area', () => {
    const el = fixture.nativeElement;

    const userIdInput = el.querySelector('input[aria-label="Filter by User ID"]');
    expect(userIdInput).toBeTruthy();

    const typeSelect = el.querySelector('mat-select[aria-label="Filter by event type"]');
    expect(typeSelect).toBeTruthy();

    const descInput = el.querySelector('input[aria-label="Filter by description"]');
    expect(descInput).toBeTruthy();

    const dateFromInput = el.querySelector('input[aria-label="Filter from date"]');
    expect(dateFromInput).toBeTruthy();

    const dateToInput = el.querySelector('input[aria-label="Filter to date"]');
    expect(dateToInput).toBeTruthy();
  });

  it('should dispatch changeFilter action after debounce when typing in UserId', fakeAsync(() => {
    component.filterForm.controls.userId.setValue('testuser');
    tick(300);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({ filter: { userId: 'testuser' } })
    );
  }));

  it('should dispatch changeFilter action immediately when selecting Type', () => {
    component.filterForm.controls.type.setValue(EventType.Click);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({ filter: { type: EventType.Click } })
    );
  });

  it('should dispatch changeFilter with undefined type when selecting All (null)', () => {
    component.filterForm.controls.type.setValue(EventType.PageView);
    (store.dispatch as jasmine.Spy).calls.reset();

    component.filterForm.controls.type.setValue(null);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({ filter: { type: undefined } })
    );
  });

  it('should dispatch changeFilter action after debounce when typing in Description', fakeAsync(() => {
    component.filterForm.controls.description.setValue('test description');
    tick(300);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({ filter: { description: 'test description' } })
    );
  }));

  it('should hide "Clear all filters" button when no filters active', () => {
    const clearBtn = fixture.nativeElement.querySelector('.clear-filters-btn');
    expect(clearBtn).toBeNull();
  });

  it('should show "Clear all filters" button when any filter has a value', () => {
    component.filterForm.controls.userId.setValue('user1');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-filters-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('should reset all form controls and dispatch changeFilter with empty values on clear', fakeAsync(() => {
    component.filterForm.controls.userId.setValue('user1');
    component.filterForm.controls.type.setValue(EventType.PageView);
    component.filterForm.controls.description.setValue('test');
    tick(300);
    (store.dispatch as jasmine.Spy).calls.reset();

    component.clearFilters();

    expect(component.filterForm.controls.userId.value).toBeFalsy();
    expect(component.filterForm.controls.type.value).toBeNull();
    expect(component.filterForm.controls.description.value).toBeFalsy();
    expect(component.filterForm.controls.dateFrom.value).toBeNull();
    expect(component.filterForm.controls.dateTo.value).toBeNull();
    expect(store.dispatch).toHaveBeenCalledWith(changeFilter({ filter: {} }));
  }));

  it('should have appropriate aria-label attributes on all filter inputs', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('[aria-label="Filter by User ID"]')).toBeTruthy();
    expect(el.querySelector('[aria-label="Filter by event type"]')).toBeTruthy();
    expect(el.querySelector('[aria-label="Filter by description"]')).toBeTruthy();
    expect(el.querySelector('[aria-label="Filter from date"]')).toBeTruthy();
    expect(el.querySelector('[aria-label="Filter to date"]')).toBeTruthy();
  });

  it('should dispatch filter with ISO strings when both dates selected', () => {
    const fromDate = new Date('2026-01-01');
    const toDate = new Date('2026-01-31');

    component.filterForm.controls.dateFrom.setValue(fromDate);
    component.filterForm.controls.dateTo.setValue(toDate);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({
        filter: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      })
    );
  });
});
