import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { EventFormComponent } from './features/event-form/event-form.component';
import { EventsFilterComponent } from './features/events-filter/events-filter.component';
import { EventsTableComponent } from './features/events-table/events-table.component';
import { SignalRStatusDotComponent } from './shared/components/signalr-status-dot/signalr-status-dot.component';
import { SignalRService } from './core/services/signalr.service';
import { selectConnectionStatus } from './store/signalr/signalr.selectors';

const BREAKPOINTS = {
  mobile: '(max-width: 767.98px)',
  tablet: '(min-width: 768px) and (max-width: 1023.98px)',
  desktop: '(min-width: 1024px)',
};

@Component({
  selector: 'app-root',
  imports: [EventFormComponent, EventsFilterComponent, EventsTableComponent, SignalRStatusDotComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Event Hub';

  private readonly signalRService = inject(SignalRService);
  private readonly store = inject(Store);
  private readonly breakpointObserver = inject(BreakpointObserver);

  connectionStatus$: Observable<'connected' | 'reconnecting' | 'disconnected'> = this.store.select(selectConnectionStatus);

  readonly isMobile = signal(false);
  readonly isTablet = signal(false);
  readonly isDesktop = signal(true);

  constructor() {
    this.breakpointObserver
      .observe([BREAKPOINTS.mobile, BREAKPOINTS.tablet, BREAKPOINTS.desktop])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.breakpoints[BREAKPOINTS.mobile] ?? false);
        this.isTablet.set(result.breakpoints[BREAKPOINTS.tablet] ?? false);
        this.isDesktop.set(result.breakpoints[BREAKPOINTS.desktop] ?? false);
      });
  }

  ngOnInit(): void {
    this.signalRService.startConnection();
  }

  ngOnDestroy(): void {
    this.signalRService.stopConnection();
  }
}
