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

  describe('Collapsible filter bar', () => {
    it('should show filter bar and hide toggle button when collapsed=false (default)', () => {
      component.collapsed = false;
      fixture.detectChanges();
      const toggleBtn = fixture.nativeElement.querySelector('.filter-toggle-btn');
      const filterBar = fixture.nativeElement.querySelector('.filter-bar');
      expect(toggleBtn).toBeNull();
      expect(filterBar).toBeTruthy();
    });

    it('should show toggle button and hide filter bar initially when collapsed=true', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const toggleBtn = fixture.nativeElement.querySelector('.filter-toggle-btn');
      const filterBar = fixture.nativeElement.querySelector('.filter-bar');
      expect(toggleBtn).toBeTruthy();
      expect(filterBar).toBeNull();
    });

    it('should show filter bar when toggle button is clicked', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const toggleBtn = fixture.nativeElement.querySelector('.filter-toggle-btn') as HTMLElement;
      toggleBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.filter-bar')).toBeTruthy();
    });

    it('should hide filter bar again on second toggle click', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const toggleBtn = fixture.nativeElement.querySelector('.filter-toggle-btn') as HTMLElement;
      toggleBtn.click();
      fixture.detectChanges();
      toggleBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.filter-bar')).toBeNull();
    });

    it('activeFilterCount returns 0 when no filters set', () => {
      expect(component.activeFilterCount).toBe(0);
    });

    it('activeFilterCount returns correct count with active filters', () => {
      component.filterForm.controls.userId.setValue('user1');
      component.filterForm.controls.type.setValue(EventType.Click);
      component.filterForm.controls.description.setValue('test');
      expect(component.activeFilterCount).toBe(3);
    });

    it('activeFilterCount returns 5 when all filters active', () => {
      component.filterForm.controls.userId.setValue('user1');
      component.filterForm.controls.type.setValue(EventType.Click);
      component.filterForm.controls.description.setValue('test');
      component.filterForm.controls.dateFrom.setValue(new Date('2026-01-01'));
      component.filterForm.controls.dateTo.setValue(new Date('2026-01-31'));
      expect(component.activeFilterCount).toBe(5);
    });
  });

  it('should dispatch filter with ISO strings when both dates selected', fakeAsync(() => {
    const fromDate = new Date('2026-01-01');
    const toDate = new Date('2026-01-31');
    const toEndOfDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);

    component.filterForm.controls.dateFrom.setValue(fromDate);
    component.filterForm.controls.dateTo.setValue(toDate);
    tick(0); // flush debounceTime(0)

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({
        filter: {
          from: fromDate.toISOString(),
          to: toEndOfDay.toISOString(),
        },
      })
    );
  }));

  it('should use end-of-day for "to" date so same-day range includes all events of that day', fakeAsync(() => {
    const sameDay = new Date(2026, 1, 24); // 2026-02-24 local midnight
    const endOfDay = new Date(2026, 1, 24, 23, 59, 59, 999);

    component.filterForm.controls.dateFrom.setValue(sameDay);
    component.filterForm.controls.dateTo.setValue(sameDay);
    tick(0);

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({
        filter: {
          from: sameDay.toISOString(),
          to: endOfDay.toISOString(),
        },
      })
    );
  }));

  describe('Date range Escape key handler', () => {
    it('should clear date range form controls when clearDateRange() is called', () => {
      component.filterForm.controls.dateFrom.setValue(new Date('2026-01-01'));
      component.filterForm.controls.dateTo.setValue(new Date('2026-12-31'));

      component.clearDateRange();

      expect(component.filterForm.controls.dateFrom.value).toBeNull();
      expect(component.filterForm.controls.dateTo.value).toBeNull();
    });

    it('should dispatch changeFilter with empty from/to when clearDateRange() is called', fakeAsync(() => {
      (store.dispatch as jasmine.Spy).calls.reset();

      component.clearDateRange();
      tick(0); // flush debounceTime(0)

      expect(store.dispatch).toHaveBeenCalledWith(
        changeFilter({ filter: { from: undefined, to: undefined } })
      );
    }));

    it('should call clearDateRange() when Escape pressed on From date input', () => {
      spyOn(component, 'clearDateRange');
      const fromInput = fixture.nativeElement.querySelector('input[placeholder="From"]');
      fromInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.clearDateRange).toHaveBeenCalled();
    });

    it('should call clearDateRange() when Escape pressed on To date input', () => {
      spyOn(component, 'clearDateRange');
      const toInput = fixture.nativeElement.querySelector('input[placeholder="To"]');
      toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.clearDateRange).toHaveBeenCalled();
    });
  });
});
