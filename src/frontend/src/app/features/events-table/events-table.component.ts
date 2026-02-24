import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
  selectEventsFilters,
} from '../../store/events/events.selectors';
import { loadEvents, changeSort, changePage } from '../../store/events/events.actions';
import * as EventsActions from '../../store/events/events.actions';

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
export class EventsTableComponent implements OnInit {
  private readonly store = inject(Store);

  readonly events$ = this.store.select(selectEvents);
  readonly totalCount$ = this.store.select(selectEventsTotalCount);
  readonly loading$ = this.store.select(selectEventsLoading);
  readonly pagination$ = this.store.select(selectEventsPagination);
  readonly sort$ = this.store.select(selectEventsSort);
  private readonly filters$ = this.store.select(selectEventsFilters);

  hasActiveFilters = signal(false);

  displayedColumns = ['id', 'userId', 'type', 'description', 'createdAt'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.filters$.pipe(
      takeUntilDestroyed(),
    ).subscribe(filters => {
      this.hasActiveFilters.set(
        !!(filters.type || filters.userId || filters.description || filters.from || filters.to)
      );
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
}
