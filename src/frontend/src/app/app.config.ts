import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { eventsReducer } from './store/events/events.reducer';
import { submissionReducer } from './store/submission/submission.reducer';
import { signalrReducer } from './store/signalr/signalr.reducer';
import { SubmissionEffects } from './store/submission/submission.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideStore({
      events: eventsReducer,
      submission: submissionReducer,
      signalr: signalrReducer,
    }),
    provideEffects(SubmissionEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    provideHttpClient(withInterceptors([])),
    provideAnimationsAsync(),
  ],
};
