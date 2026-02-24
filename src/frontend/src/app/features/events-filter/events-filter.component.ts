import { Component, DestroyRef, inject, signal, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatBadgeModule } from '@angular/material/badge';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, merge, take } from 'rxjs';
import { changeFilter } from '../../store/events/events.actions';
import { selectEventsFilters } from '../../store/events/events.selectors';
import { EventType } from '../../shared/models/event.model';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

@Component({
  selector: 'app-events-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatBadgeModule,
    GlassPanelComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './events-filter.component.html',
  styleUrl: './events-filter.component.scss',
})
export class EventsFilterComponent {
  @Input() collapsed = false;

  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly EventType = EventType;
  readonly isExpanded = signal(false);

  filterForm = new FormGroup({
    userId: new FormControl(''),
    type: new FormControl<EventType | null>(null),
    description: new FormControl(''),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  hasActiveFilters = false;

  constructor() {
    this.hydrateFromStore();
    this.setupFilterSubscriptions();
  }

  get showFilterBar(): boolean {
    return !this.collapsed || this.isExpanded();
  }

  get activeFilterCount(): number {
    const val = this.filterForm.value;
    let count = 0;
    if (val.userId) count++;
    if (val.type) count++;
    if (val.description) count++;
    if (val.dateFrom) count++;
    if (val.dateTo) count++;
    return count;
  }

  toggleFilters(): void {
    this.isExpanded.update(v => !v);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.store.dispatch(changeFilter({ filter: {} }));
  }

  clearInput(control: FormControl): void {
    control.setValue('');
  }

  clearDateRange(): void {
    this.filterForm.controls.dateFrom.setValue(null);
    this.filterForm.controls.dateTo.setValue(null);
  }

  private hydrateFromStore(): void {
    this.store
      .select(selectEventsFilters)
      .pipe(take(1))
      .subscribe((filters) => {
        this.filterForm.patchValue(
          {
            userId: filters.userId || '',
            type: (filters.type as EventType) || null,
            description: filters.description || '',
            dateFrom: filters.from ? new Date(filters.from) : null,
            dateTo: filters.to ? new Date(filters.to) : null,
          },
          { emitEvent: false }
        );
        this.updateHasActiveFilters();
      });
  }

  private setupFilterSubscriptions(): void {
    // Track active filters
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateHasActiveFilters());

    // UserId — debounced
    this.filterForm.controls.userId.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.store.dispatch(
          changeFilter({ filter: { userId: value || undefined } })
        );
      });

    // Type — immediate
    this.filterForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.store.dispatch(
          changeFilter({ filter: { type: value || undefined } })
        );
      });

    // Description — debounced
    this.filterForm.controls.description.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.store.dispatch(
          changeFilter({ filter: { description: value || undefined } })
        );
      });

    // Date range — immediate when either changes
    merge(
      this.filterForm.controls.dateFrom.valueChanges,
      this.filterForm.controls.dateTo.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const from = this.filterForm.controls.dateFrom.value;
        const to = this.filterForm.controls.dateTo.value;
        this.store.dispatch(
          changeFilter({
            filter: {
              from: from ? from.toISOString() : undefined,
              to: to ? to.toISOString() : undefined,
            },
          })
        );
      });
  }

  private updateHasActiveFilters(): void {
    const val = this.filterForm.value;
    this.hasActiveFilters = !!(
      val.userId ||
      val.type ||
      val.description ||
      val.dateFrom ||
      val.dateTo
    );
  }
}
