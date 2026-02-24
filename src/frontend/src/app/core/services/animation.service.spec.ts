import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';

describe('AnimationService', () => {
  let service: AnimationService;
  let matchMediaSpy: jasmine.Spy;
  let changeListener: ((e: MediaQueryListEvent) => void) | null;

  function setupMatchMedia(matches: boolean): void {
    changeListener = null;
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({
      matches,
      addEventListener: (_event: string, listener: (e: MediaQueryListEvent) => void) => {
        changeListener = listener;
      },
      removeEventListener: jasmine.createSpy('removeEventListener'),
    } as unknown as MediaQueryList);
  }

  afterEach(() => {
    changeListener = null;
  });

  describe('when prefers-reduced-motion is NOT set', () => {
    beforeEach(() => {
      setupMatchMedia(false);
      TestBed.configureTestingModule({});
      service = TestBed.inject(AnimationService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should return true from shouldAnimate()', () => {
      expect(service.shouldAnimate()).toBeTrue();
    });

    it('should have prefersReducedMotion signal set to false', () => {
      expect(service.prefersReducedMotion()).toBeFalse();
    });
  });

  describe('when prefers-reduced-motion: reduce is matched', () => {
    beforeEach(() => {
      setupMatchMedia(true);
      TestBed.configureTestingModule({});
      service = TestBed.inject(AnimationService);
    });

    it('should return false from shouldAnimate()', () => {
      expect(service.shouldAnimate()).toBeFalse();
    });

    it('should have prefersReducedMotion signal set to true', () => {
      expect(service.prefersReducedMotion()).toBeTrue();
    });
  });

  describe('when matchMedia change event fires', () => {
    beforeEach(() => {
      setupMatchMedia(false);
      TestBed.configureTestingModule({});
      service = TestBed.inject(AnimationService);
    });

    it('should update prefersReducedMotion signal when user toggles preference', () => {
      expect(service.prefersReducedMotion()).toBeFalse();
      expect(service.shouldAnimate()).toBeTrue();

      // Simulate user enabling reduced motion
      changeListener!({ matches: true } as MediaQueryListEvent);
      expect(service.prefersReducedMotion()).toBeTrue();
      expect(service.shouldAnimate()).toBeFalse();

      // Simulate user disabling reduced motion
      changeListener!({ matches: false } as MediaQueryListEvent);
      expect(service.prefersReducedMotion()).toBeFalse();
      expect(service.shouldAnimate()).toBeTrue();
    });
  });
});
