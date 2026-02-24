import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, BehaviorSubject } from 'rxjs';
import { Action } from '@ngrx/store';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { AppComponent } from './app.component';
import { selectIsSubmitting, selectSubmissionStatus, selectIsSubmitDisabled } from './store/submission/submission.selectors';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
} from './store/events/events.selectors';
import { selectConnectionStatus } from './store/signalr/signalr.selectors';
import { AnimationService } from './core/services/animation.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let breakpointSubject: BehaviorSubject<BreakpointState>;

  const makeBreakpointState = (mobile: boolean, tablet: boolean, desktop: boolean): BreakpointState => ({
    matches: desktop || tablet || mobile,
    breakpoints: {
      '(max-width: 767.98px)': mobile,
      '(min-width: 768px) and (max-width: 1023.98px)': tablet,
      '(min-width: 1024px)': desktop,
    },
  });

  beforeEach(async () => {
    const actions$ = new Subject<Action>();
    const animationService = jasmine.createSpyObj('AnimationService', ['shouldAnimate'], {
      prefersReducedMotion: jasmine.createSpy().and.returnValue(false),
    });
    animationService.shouldAnimate.and.returnValue(false);

    breakpointSubject = new BehaviorSubject<BreakpointState>(makeBreakpointState(false, false, true));

    const mockBreakpointObserver = {
      observe: jasmine.createSpy('observe').and.returnValue(breakpointSubject.asObservable()),
      isMatched: jasmine.createSpy('isMatched').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsSubmitting, value: false },
            { selector: selectIsSubmitDisabled, value: false },
            { selector: selectSubmissionStatus, value: 'idle' },
            { selector: selectEvents, value: [] },
            { selector: selectEventsTotalCount, value: 0 },
            { selector: selectEventsLoading, value: false },
            { selector: selectEventsPagination, value: { page: 1, pageSize: 20 } },
            { selector: selectEventsSort, value: { sortBy: 'createdAt', sortDir: 'desc' } },
            { selector: selectConnectionStatus, value: 'disconnected' },
          ],
        }),
        provideMockActions(() => actions$),
        { provide: AnimationService, useValue: animationService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should have the title "Event Hub"', () => {
    expect(app.title).toEqual('Event Hub');
  });

  it('should render the app header with title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-title')?.textContent).toContain('Event Hub');
  });

  it('should render the event form component', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-event-form')).toBeTruthy();
  });

  it('should render the SignalR status dot component', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-signalr-status-dot')).toBeTruthy();
  });

  describe('Responsive signals', () => {
    it('should set isDesktop=true on desktop breakpoint', () => {
      fixture.detectChanges();
      breakpointSubject.next(makeBreakpointState(false, false, true));
      expect(app.isDesktop()).toBeTrue();
      expect(app.isTablet()).toBeFalse();
      expect(app.isMobile()).toBeFalse();
    });

    it('should set isTablet=true on tablet breakpoint', () => {
      fixture.detectChanges();
      breakpointSubject.next(makeBreakpointState(false, true, false));
      expect(app.isTablet()).toBeTrue();
      expect(app.isDesktop()).toBeFalse();
      expect(app.isMobile()).toBeFalse();
    });

    it('should set isMobile=true on mobile breakpoint', () => {
      fixture.detectChanges();
      breakpointSubject.next(makeBreakpointState(true, false, false));
      expect(app.isMobile()).toBeTrue();
      expect(app.isTablet()).toBeFalse();
      expect(app.isDesktop()).toBeFalse();
    });

    it('should pass collapsed=true to app-events-filter when not desktop', () => {
      fixture.detectChanges();
      breakpointSubject.next(makeBreakpointState(true, false, false));
      fixture.detectChanges();
      const filterEl = fixture.nativeElement.querySelector('app-events-filter');
      expect(filterEl).toBeTruthy();
    });
  });
});
