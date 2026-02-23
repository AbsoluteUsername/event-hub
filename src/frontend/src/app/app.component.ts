import { Component } from '@angular/core';
import { EventFormComponent } from './features/event-form/event-form.component';
import { EventsTableComponent } from './features/events-table/events-table.component';

@Component({
  selector: 'app-root',
  imports: [EventFormComponent, EventsTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Event Hub';
}
