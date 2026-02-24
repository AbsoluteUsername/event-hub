import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { Action } from '@ngrx/store';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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

  beforeEach(async () => {
    const actions$ = new Subject<Action>();
    const animationService = jasmine.createSpyObj('AnimationService', ['shouldAnimate'], {
      prefersReducedMotion: jasmine.createSpy().and.returnValue(false),
    });
    animationService.shouldAnimate.and.returnValue(false);

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
});
