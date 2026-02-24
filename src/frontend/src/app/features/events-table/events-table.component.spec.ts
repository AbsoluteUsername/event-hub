import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { EventsTableComponent } from './events-table.component';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
  selectEventsFilters,
} from '../../store/events/events.selectors';
import { loadEvents, changeSort, changePage, changeFilter } from '../../store/events/events.actions';
import { EventType } from '../../shared/models/event.model';

const mockEvents = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
    createdAt: '2026-02-24T14:30:00Z',
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    userId: 'andrii',
    type: EventType.Click,
    description: 'Clicked button',
    createdAt: '2026-02-24T15:00:00Z',
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    userId: 'maria',
    type: EventType.Purchase,
    description: 'Bought item',
    createdAt: '2026-02-24T15:30:00Z',
  },
];

describe('EventsTableComponent', () => {
  let component: EventsTableComponent;
  let fixture: ComponentFixture<EventsTableComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsTableComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectEvents, value: mockEvents },
            { selector: selectEventsTotalCount, value: 3 },
            { selector: selectEventsLoading, value: false },
            { selector: selectEventsPagination, value: { page: 1, pageSize: 20 } },
            { selector: selectEventsSort, value: { sortBy: 'createdAt', sortDir: 'desc' } },
            { selector: selectEventsFilters, value: {} },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    fixture = TestBed.createComponent(EventsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadEvents on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(loadEvents());
  });

  it('should render 5 columns (id, userId, type, description, createdAt)', () => {
    const headerCells = fixture.nativeElement.querySelectorAll('.mat-mdc-header-cell');
    expect(headerCells.length).toBe(5);

    const headerTexts = Array.from(headerCells as NodeListOf<Element>).map((el) =>
      el.textContent?.trim()
    );
    expect(headerTexts).toContain('Id');
    expect(headerTexts).toContain('UserId');
    expect(headerTexts).toContain('Type');
    expect(headerTexts).toContain('Description');
    expect(headerTexts).toContain('Created At');
  });

  it('should show truncated GUID (first 8 chars + "…") in Id column', () => {
    const firstRow = fixture.nativeElement.querySelector('.mat-mdc-row');
    const idCell = firstRow.querySelector('.truncated-id');
    expect(idCell.textContent.trim()).toContain('550e8400');
    expect(idCell.textContent.trim()).toContain('…');
  });

  it('should render EventTypeChipComponent for Type column', () => {
    const chips = fixture.nativeElement.querySelectorAll('app-event-type-chip');
    expect(chips.length).toBe(mockEvents.length);
  });

  it('should dispatch changeSort action on sort change', () => {
    component.onSortChange({ active: 'userId', direction: 'asc' });

    expect(store.dispatch).toHaveBeenCalledWith(
      changeSort({ sortBy: 'userId', sortDir: 'asc' })
    );
  });

  it('should reset to default sort when direction is empty', () => {
    component.onSortChange({ active: 'userId', direction: '' });

    expect(store.dispatch).toHaveBeenCalledWith(
      changeSort({ sortBy: 'createdAt', sortDir: 'desc' })
    );
  });

  it('should dispatch changePage action on page change', () => {
    component.onPageChange({
      pageIndex: 1,
      pageSize: 20,
      previousPageIndex: 0,
      length: 3,
    });

    expect(store.dispatch).toHaveBeenCalledWith(
      changePage({ page: 2, pageSize: 20 })
    );
  });

  it('should show correct totalCount in paginator', () => {
    const paginator = fixture.nativeElement.querySelector('.mat-mdc-paginator');
    expect(paginator).toBeTruthy();
    const rangeLabel = paginator.querySelector('.mat-mdc-paginator-range-label');
    expect(rangeLabel.textContent).toContain('3');
  });

  // Loading indicator tests (AC: #1)
  describe('Loading indicator', () => {
    it('should show mat-progress-bar when loading is true', () => {
      store.overrideSelector(selectEventsLoading, true);
      store.refreshState();
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should NOT show mat-progress-bar when loading is false', () => {
      store.overrideSelector(selectEventsLoading, false);
      store.refreshState();
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).toBeNull();
    });
  });

  // Empty state tests (AC: #2, #3)
  describe('Empty states', () => {
    it('should show EmptyStateComponent in no-data mode when loading is false, items empty, and no filters active', () => {
      store.overrideSelector(selectEventsLoading, false);
      store.overrideSelector(selectEvents, []);
      store.overrideSelector(selectEventsTotalCount, 0);
      store.overrideSelector(selectEventsFilters, {});
      store.refreshState();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No events yet');
    });

    it('should show EmptyStateComponent in no-results mode when loading is false, items empty, and filters active', () => {
      store.overrideSelector(selectEventsLoading, false);
      store.overrideSelector(selectEvents, []);
      store.overrideSelector(selectEventsTotalCount, 0);
      store.overrideSelector(selectEventsFilters, { type: EventType.Click });
      store.refreshState();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No events match your filters');
    });

    it('should show table with rows when loading is false and items has data', () => {
      store.overrideSelector(selectEventsLoading, false);
      store.overrideSelector(selectEvents, mockEvents);
      store.refreshState();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.mat-mdc-row');
      expect(rows.length).toBe(mockEvents.length);

      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeNull();
    });
  });

  // Clear filters test (AC: #3)
  describe('Clear filters', () => {
    it('should dispatch changeFilter with empty filter object when onClearFilters is called', () => {
      component.onClearFilters();
      expect(store.dispatch).toHaveBeenCalledWith(changeFilter({ filter: {} }));
    });
  });
});
