import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-event-type-chip',
  standalone: true,
  template: `
    <span class="chip" [class]="'chip-' + type.toLowerCase()"
          [attr.aria-label]="'Event type: ' + type">
      {{ type }}
    </span>
  `,
  styleUrl: './event-type-chip.component.scss',
})
export class EventTypeChipComponent {
  @Input({ required: true }) type!: string;
}
