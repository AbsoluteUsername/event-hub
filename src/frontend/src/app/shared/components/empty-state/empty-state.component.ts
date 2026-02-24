import { Component } from '@angular/core';
import { input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  host: { role: 'status' },
})
export class EmptyStateComponent {
  mode = input<'no-data' | 'no-results'>('no-data');
  layout = input<'side-by-side' | 'stacked'>('side-by-side');
  clearFilters = output<void>();

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
