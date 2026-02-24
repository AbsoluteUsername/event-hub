import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { EventFormComponent } from './features/event-form/event-form.component';
import { EventsFilterComponent } from './features/events-filter/events-filter.component';
import { EventsTableComponent } from './features/events-table/events-table.component';
import { SignalRStatusDotComponent } from './shared/components/signalr-status-dot/signalr-status-dot.component';
import { SignalRService } from './core/services/signalr.service';
import { selectConnectionStatus } from './store/signalr/signalr.selectors';

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
  connectionStatus$: Observable<'connected' | 'reconnecting' | 'disconnected'> = this.store.select(selectConnectionStatus);

  ngOnInit(): void {
    this.signalRService.startConnection();
  }

  ngOnDestroy(): void {
    this.signalRService.stopConnection();
  }
}
