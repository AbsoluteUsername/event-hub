import { Component } from '@angular/core';
import { EventFormComponent } from './features/event-form/event-form.component';

@Component({
  selector: 'app-root',
  imports: [EventFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Event Hub';
}
