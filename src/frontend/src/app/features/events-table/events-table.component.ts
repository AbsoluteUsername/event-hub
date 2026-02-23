import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { EventTypeChipComponent } from '../../shared/components/event-type-chip/event-type-chip.component';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
} from '../../store/events/events.selectors';
import { loadEvents, changeSort, changePage } from '../../store/events/events.actions';

@Component({
  selector: 'app-events-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    GlassPanelComponent,
    EventTypeChipComponent,
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

  displayedColumns = ['id', 'userId', 'type', 'description', 'createdAt'];

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.store.dispatch(loadEvents());
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
