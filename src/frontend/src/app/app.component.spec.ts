import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { selectIsSubmitting, selectSubmissionStatus } from './store/submission/submission.selectors';
import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsPagination,
  selectEventsSort,
} from './store/events/events.selectors';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsSubmitting, value: false },
            { selector: selectSubmissionStatus, value: 'idle' },
            { selector: selectEvents, value: [] },
            { selector: selectEventsTotalCount, value: 0 },
            { selector: selectEventsLoading, value: false },
            { selector: selectEventsPagination, value: { page: 1, pageSize: 20 } },
            { selector: selectEventsSort, value: { sortBy: 'createdAt', sortDir: 'desc' } },
          ],
        }),
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

  it('should render the SignalR placeholder', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.signalr-placeholder')).toBeTruthy();
  });
});
