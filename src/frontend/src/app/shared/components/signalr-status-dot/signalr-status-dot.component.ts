import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-signalr-status-dot',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './signalr-status-dot.component.html',
  styleUrl: './signalr-status-dot.component.scss',
  host: {
    'role': 'status',
    'aria-live': 'polite',
  },
})
export class SignalRStatusDotComponent {
  @Input({ required: true }) status!: 'connected' | 'reconnecting' | 'disconnected';

  get label(): string {
    switch (this.status) {
      case 'connected': return 'Connected';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Disconnected';
    }
  }

  get tooltipText(): string {
    switch (this.status) {
      case 'connected': return 'Real-time updates are active';
      case 'reconnecting': return 'Attempting to reconnect to real-time service...';
      case 'disconnected': return 'Real-time updates are unavailable';
    }
  }
}
