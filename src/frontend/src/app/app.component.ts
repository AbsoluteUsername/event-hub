import { Component } from '@angular/core';
import { GlassPanelComponent } from './shared/components/glass-panel/glass-panel.component';

@Component({
  selector: 'app-root',
  imports: [GlassPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Event Hub';
}
