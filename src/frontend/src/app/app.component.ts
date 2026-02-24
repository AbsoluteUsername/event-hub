import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { EventFormComponent } from './features/event-form/event-form.component';
import { EventsFilterComponent } from './features/events-filter/events-filter.component';
import { EventsTableComponent } from './features/events-table/events-table.component';
import { SignalRService } from './core/services/signalr.service';

@Component({
  selector: 'app-root',
  imports: [EventFormComponent, EventsFilterComponent, EventsTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Event Hub';

  private readonly signalRService = inject(SignalRService);

  ngOnInit(): void {
    this.signalRService.startConnection();
  }

  ngOnDestroy(): void {
    this.signalRService.stopConnection();
  }
}
