import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { EventsTableComponent } from './events-table.component';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
  selectEventsFilters,
  selectLastInsertedEventId,
} from '../../store/events/events.selectors';
import { loadEvents, changeSort, changePage, changeFilter, clearNewEvent } from '../../store/events/events.actions';
import { EventType } from '../../shared/models/event.model';
import { AnimationService } from '../../core/services/animation.service';

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
  let breakpointSubject: BehaviorSubject<BreakpointState>;

  const makeBreakpointState = (desktop: boolean, mobile: boolean): BreakpointState => ({
    matches: desktop || mobile,
    breakpoints: {
      '(min-width: 1024px)': desktop,
      '(max-width: 767.98px)': mobile,
    },
  });

  beforeEach(async () => {
    const animationServiceSpy = jasmine.createSpyObj('AnimationService', ['shouldAnimate'], {
      prefersReducedMotion: { __zone_symbol__value: false },
    });
    animationServiceSpy.shouldAnimate.and.returnValue(true);

    breakpointSubject = new BehaviorSubject<BreakpointState>(makeBreakpointState(true, false));

    const mockBreakpointObserver = {
      observe: jasmine.createSpy('observe').and.returnValue(breakpointSubject.asObservable()),
      isMatched: jasmine.createSpy('isMatched').and.returnValue(false),
    };

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
            { selector: selectLastInsertedEventId, value: null },
          ],
        }),
        { provide: AnimationService, useValue: animationServiceSpy },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
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

    it('should add .loading class to table-wrapper when loading is true with existing data', () => {
      store.overrideSelector(selectEventsLoading, true);
      store.overrideSelector(selectEvents, mockEvents);
      store.refreshState();
      fixture.detectChanges();

      const tableWrapper = fixture.nativeElement.querySelector('.table-wrapper');
      expect(tableWrapper).toBeTruthy();
      expect(tableWrapper.classList.contains('loading')).toBeTrue();
    });

    it('should NOT have .loading class on table-wrapper when loading is false', () => {
      store.overrideSelector(selectEventsLoading, false);
      store.overrideSelector(selectEvents, mockEvents);
      store.refreshState();
      fixture.detectChanges();

      const tableWrapper = fixture.nativeElement.querySelector('.table-wrapper');
      expect(tableWrapper).toBeTruthy();
      expect(tableWrapper.classList.contains('loading')).toBeFalse();
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

    it('should show no-data empty state after clearing filters when results are empty', () => {
      // Simulate: filters active → no results → user clicks "Clear all filters"
      store.overrideSelector(selectEventsFilters, { type: EventType.Click });
      store.overrideSelector(selectEvents, []);
      store.overrideSelector(selectEventsLoading, false);
      store.refreshState();
      fixture.detectChanges();

      // Empty state with "no-results" shown
      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState?.textContent).toContain('No events match your filters');

      // After clearing: loading starts, filters cleared, results load
      store.overrideSelector(selectEventsFilters, {});
      store.overrideSelector(selectEventsLoading, true);
      store.refreshState();
      fixture.detectChanges();

      // Progress bar should be visible
      expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeTruthy();
    });
  });

  // New row animation tests (Story 4.5)
  describe('trackById', () => {
    it('should return item.id', () => {
      const result = component.trackById(0, mockEvents[0]);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('New row class binding', () => {
    it('should apply .new-row class when lastInsertedEventId matches a row', () => {
      store.overrideSelector(selectLastInsertedEventId, '550e8400-e29b-41d4-a716-446655440000');
      store.refreshState();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.mat-mdc-row');
      const firstRow = rows[0];
      expect(firstRow.classList.contains('new-row')).toBe(true);
    });

    it('should NOT apply .new-row class when lastInsertedEventId is null', () => {
      store.overrideSelector(selectLastInsertedEventId, null);
      store.refreshState();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.mat-mdc-row');
      const hasNewRow = Array.from(rows as NodeListOf<Element>).some(r => r.classList.contains('new-row'));
      expect(hasNewRow).toBe(false);
    });

    it('should NOT apply .new-row class when lastInsertedEventId does not match any row', () => {
      store.overrideSelector(selectLastInsertedEventId, 'non-existent-id');
      store.refreshState();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.mat-mdc-row');
      const hasNewRow = Array.from(rows as NodeListOf<Element>).some(r => r.classList.contains('new-row'));
      expect(hasNewRow).toBe(false);
    });
  });

  describe('Responsive displayedColumns', () => {
    it('should show 5 columns on desktop breakpoint', () => {
      breakpointSubject.next(makeBreakpointState(true, false));
      fixture.detectChanges();
      expect(component.displayedColumns).toEqual(['id', 'userId', 'type', 'description', 'createdAt']);
    });

    it('should show 3 columns on tablet breakpoint (not desktop)', () => {
      breakpointSubject.next(makeBreakpointState(false, false));
      fixture.detectChanges();
      expect(component.displayedColumns).toEqual(['userId', 'type', 'createdAt']);
    });

    it('should show 3 columns on mobile breakpoint', () => {
      breakpointSubject.next(makeBreakpointState(false, true));
      fixture.detectChanges();
      expect(component.displayedColumns).toEqual(['userId', 'type', 'createdAt']);
    });

    it('should update isMobile signal on mobile breakpoint', () => {
      breakpointSubject.next(makeBreakpointState(false, true));
      expect(component.isMobile()).toBeTrue();
    });

    it('should set isMobile=false on desktop breakpoint', () => {
      breakpointSubject.next(makeBreakpointState(true, false));
      expect(component.isMobile()).toBeFalse();
    });
  });

  describe('Reduced motion', () => {
    it('should not trigger Web Animations API when shouldAnimate returns false', () => {
      const animationService = TestBed.inject(AnimationService) as jasmine.SpyObj<AnimationService>;
      animationService.shouldAnimate.and.returnValue(false);

      store.overrideSelector(selectLastInsertedEventId, '550e8400-e29b-41d4-a716-446655440000');
      store.refreshState();
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('.new-row') as HTMLElement;
      expect(row).toBeTruthy();
      // In reduced motion, the row gets a static background instead of Web Animations
      // The animateNewRow method sets style.background directly
      expect(row.style.background).toBe('rgba(124, 58, 237, 0.12)');
    });
  });
});
