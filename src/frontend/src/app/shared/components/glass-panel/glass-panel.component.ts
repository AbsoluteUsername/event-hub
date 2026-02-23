import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-glass-panel',
  standalone: true,
  template: `
    <div [class.glass-panel]="!compact" [class.glass-panel-compact]="compact">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './glass-panel.component.scss',
})
export class GlassPanelComponent {
  @Input() compact = false;
}
