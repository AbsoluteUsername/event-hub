import { Component, ElementRef, Input, inject } from '@angular/core';

@Component({
  selector: 'app-flying-chip',
  standalone: true,
  template: `
    <span class="chip-content">
      <span class="chip-type" [class]="'type-' + eventType.toLowerCase()">{{ eventType }}</span>
      <span class="chip-separator">&middot;</span>
      <span class="chip-user">{{ truncatedUserId }}</span>
    </span>
  `,
  styleUrl: './flying-chip.component.scss',
  host: {
    'role': 'status',
    'aria-label': 'Event submitting',
    '[style.position]': '"fixed"',
    '[style.pointerEvents]': '"none"',
    '[style.zIndex]': '"9999"',
  },
})
export class FlyingChipComponent {
  private readonly el = inject(ElementRef);

  @Input({ required: true }) eventType!: string;
  @Input({ required: true }) userId!: string;

  get truncatedUserId(): string {
    return this.userId.length > 12
      ? this.userId.substring(0, 12) + '...'
      : this.userId;
  }

  async animate(
    sourceRect: DOMRect,
    targetRect: DOMRect,
    onSignalR: () => Promise<void>
  ): Promise<void> {
    const el = this.el.nativeElement as HTMLElement;

    // Position at submit button center
    const srcX = sourceRect.left + sourceRect.width / 2;
    const srcY = sourceRect.top + sourceRect.height / 2;
    el.style.left = `${srcX}px`;
    el.style.top = `${srcY}px`;
    el.style.transform = 'translate(-50%, -50%)';

    // Phase 1: Materialize — scale 0 to 1 at submit button position, 150ms ease-out
    await el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      ],
      { duration: 150, easing: 'ease-out', fill: 'forwards' }
    ).finished;

    // Phase 2: In-flight — arc toward table header, 500ms spring easing
    const dx = targetRect.left + targetRect.width / 2 - srcX;
    const dy = targetRect.top - srcY;

    await el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
          opacity: 0.85,
        },
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
      }
    ).finished;

    // Phase 3: Hover — pulse scale 0.97 to 1.03 until SignalR fires
    const pulseAnim = el.animate(
      [
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.97)`,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.03)`,
        },
      ],
      {
        duration: 800,
        easing: 'ease-in-out',
        iterations: Infinity,
        direction: 'alternate',
      }
    );

    await onSignalR();
    pulseAnim.cancel();

    // Phase 4: Landing — bounce down 300ms, then dissolve 200ms
    await el.animate(
      [
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.03)`,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 20}px)) scale(1)`,
        },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
      }
    ).finished;

    await el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 200,
      easing: 'ease-in',
      fill: 'forwards',
    }).finished;
  }
}
