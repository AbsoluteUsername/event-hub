import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  readonly prefersReducedMotion = signal(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  constructor() {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mql.addEventListener('change', (e) => this.prefersReducedMotion.set(e.matches));
  }

  shouldAnimate(): boolean {
    return !this.prefersReducedMotion();
  }
}
