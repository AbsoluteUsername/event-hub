import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { EventTypeChipComponent } from '../../shared/components/event-type-chip/event-type-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AnimationService } from '../../core/services/animation.service';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
  selectEventsFilters,
  selectLastInsertedEventId,
} from '../../store/events/events.selectors';
import { loadEvents, changeSort, changePage, clearNewEvent } from '../../store/events/events.actions';
import * as EventsActions from '../../store/events/events.actions';
import { EventResponse } from '../../shared/models/event.model';

@Component({
  selector: 'app-events-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressBarModule,
    GlassPanelComponent,
    EventTypeChipComponent,
    EmptyStateComponent,
    AsyncPipe,
    SlicePipe,
  ],
  templateUrl: './events-table.component.html',
  styleUrl: './events-table.component.scss',
})
export class EventsTableComponent implements OnInit, AfterViewChecked {
  private readonly store = inject(Store);
  private readonly animationService = inject(AnimationService);
  private readonly elementRef = inject(ElementRef);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly events$ = this.store.select(selectEvents);
  readonly totalCount$ = this.store.select(selectEventsTotalCount);
  readonly loading$ = this.store.select(selectEventsLoading);
  readonly pagination$ = this.store.select(selectEventsPagination);
  readonly sort$ = this.store.select(selectEventsSort);
  private readonly filters$ = this.store.select(selectEventsFilters);

  hasActiveFilters = signal(false);
  readonly newEventId = signal<string | null>(null);
  readonly isMobile = signal(false);

  displayedColumns: string[] = ['id', 'userId', 'type', 'description', 'createdAt'];
  private lastAnimatedId: string | null = null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.filters$.pipe(
      takeUntilDestroyed(),
    ).subscribe(filters => {
      this.hasActiveFilters.set(
        !!(filters.type || filters.userId || filters.description || filters.from || filters.to)
      );
    });

    this.store.select(selectLastInsertedEventId).pipe(
      takeUntilDestroyed(),
    ).subscribe(id => {
      this.newEventId.set(id);
    });

    this.breakpointObserver
      .observe(['(min-width: 1024px)', '(max-width: 767.98px)'])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.breakpoints['(max-width: 767.98px)'] ?? false);
        this.displayedColumns = result.breakpoints['(min-width: 1024px)']
          ? ['id', 'userId', 'type', 'description', 'createdAt']
          : ['userId', 'type', 'createdAt'];
      });
  }

  ngOnInit(): void {
    this.store.dispatch(loadEvents());
  }

  onClearFilters(): void {
    this.store.dispatch(EventsActions.changeFilter({ filter: {} }));
  }

  onSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this.store.dispatch(
        changeSort({
          sortBy: sortState.active,
          sortDir: sortState.direction as 'asc' | 'desc',
        })
      );
    } else {
      this.store.dispatch(changeSort({ sortBy: 'createdAt', sortDir: 'desc' }));
    }
  }

  onPageChange(event: PageEvent): void {
    this.store.dispatch(
      changePage({
        page: event.pageIndex + 1,
        pageSize: event.pageSize,
      })
    );
  }

  trackById(index: number, item: EventResponse): string {
    return item.id;
  }

  ngAfterViewChecked(): void {
    const id = this.newEventId();
    if (id && id !== this.lastAnimatedId) {
      const rowEl = this.elementRef.nativeElement.querySelector('tr.new-row') as HTMLElement;
      if (rowEl) {
        this.lastAnimatedId = id;
        this.animateNewRow(rowEl);
      }
    }
  }

  private animateNewRow(rowElement: HTMLElement): void {
    if (!this.animationService.shouldAnimate()) {
      // Reduced motion: static tint for 1s
      rowElement.style.background = 'rgba(124, 58, 237, 0.12)';
      setTimeout(() => {
        rowElement.style.background = '';
        this.store.dispatch(clearNewEvent());
      }, 1000);
      return;
    }

    // Phase 1: Unfold (300ms)
    const height = rowElement.scrollHeight;
    rowElement.style.overflow = 'hidden';
    const unfold = rowElement.animate(
      [
        { maxHeight: '0px', opacity: 0 },
        { maxHeight: `${height}px`, opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', fill: 'forwards' }
    );

    unfold.finished.then(() => {
      rowElement.style.overflow = '';

      // Phase 2: Violet highlight (1.5s hold + 500ms fade)
      rowElement.style.background = 'rgba(124, 58, 237, 0.12)';

      setTimeout(() => {
        rowElement.animate(
          [
            { background: 'rgba(124, 58, 237, 0.12)' },
            { background: 'rgba(124, 58, 237, 0)' },
          ],
          { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        ).finished.then(() => {
          rowElement.style.background = '';
          this.store.dispatch(clearNewEvent());
        });
      }, 1500);
    });
  }
}
