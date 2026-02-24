import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  DestroyRef,
  NgZone,
  inject,
} from '@angular/core';
import { DOCUMENT, AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { AppState } from '../../store';
import {
  selectIsSubmitting,
  selectSubmissionStatus,
  selectIsSubmitDisabled,
} from '../../store/submission/submission.selectors';
import {
  submitEvent,
  submitEventSuccess,
  resetSubmissionStatus,
  chipFlying,
  chipWaitingSignalr,
  chipLanding,
  chipLanded,
} from '../../store/submission/submission.actions';
import { signalrEventReceived } from '../../store/signalr/signalr.actions';
import {
  EventType,
  CreateEventRequest,
  EventResponse,
} from '../../shared/models/event.model';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { AnimationService } from '../../core/services/animation.service';
import { FlyingChipComponent } from '../../shared/components/flying-chip/flying-chip.component';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    GlassPanelComponent,
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
})
export class EventFormComponent implements OnInit, AfterViewInit {
  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actions$ = inject(Actions);
  private readonly animationService = inject(AnimationService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly ngZone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  @ViewChild('userIdInput') userIdInput!: ElementRef<HTMLInputElement>;
  @ViewChild('submitButton', { read: ElementRef }) submitButtonRef!: ElementRef<HTMLElement>;

  isSubmitting$ = this.store.select(selectIsSubmitting);
  isSubmitDisabled$ = this.store.select(selectIsSubmitDisabled);
  submissionStatus$ = this.store.select(selectSubmissionStatus);

  eventForm = new FormGroup({
    userId: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(100)],
      updateOn: 'blur',
    }),
    type: new FormControl<EventType | ''>('', {
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(500)],
      updateOn: 'blur',
    }),
  });

  eventTypes = Object.values(EventType);

  ngOnInit(): void {
    this.submissionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        if (status === 'success') {
          // If animation is enabled, chip flow handles reset on 'complete'
          if (!this.animationService.shouldAnimate()) {
            this.resetFormAndRefocus();
            this.store.dispatch(resetSubmissionStatus());
          }
        } else if (status === 'complete') {
          this.resetFormAndRefocus();
          this.store.dispatch(resetSubmissionStatus());
        } else if (status === 'failure') {
          this.store.dispatch(resetSubmissionStatus());
        }
      });

    // Listen for submitEventSuccess to launch chip animation
    this.actions$
      .pipe(
        ofType(submitEventSuccess),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ event }) => {
        if (this.animationService.shouldAnimate()) {
          this.launchFlyingChip(event);
        }
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.userIdInput?.nativeElement?.focus());
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const request: CreateEventRequest = {
      userId: this.eventForm.get('userId')!.value!,
      type: this.eventForm.get('type')!.value! as EventType,
      description: this.eventForm.get('description')!.value!,
    };

    this.store.dispatch(submitEvent({ request }));
  }

  private resetFormAndRefocus(): void {
    this.eventForm.reset();
    this.eventForm.markAsPristine();
    this.eventForm.markAsUntouched();
    setTimeout(() => this.userIdInput?.nativeElement?.focus());
  }

  private launchFlyingChip(event: EventResponse): void {
    const chipRef = this.viewContainerRef.createComponent(FlyingChipComponent);
    chipRef.instance.eventType = event.type;
    chipRef.instance.userId = event.userId;
    chipRef.changeDetectorRef.detectChanges();

    // Move to document.body for position:fixed overlay
    this.document.body.appendChild(chipRef.location.nativeElement);

    const sourceRect = this.submitButtonRef.nativeElement.getBoundingClientRect();
    const tableHeader = this.document.querySelector('.events-table mat-header-row, .events-table thead') as HTMLElement;
    const targetRect = tableHeader
      ? tableHeader.getBoundingClientRect()
      : new DOMRect(window.innerWidth / 2, 100, 200, 40);

    // Create SignalR promise
    const signalrPromise = new Promise<void>((resolve) => {
      this.actions$
        .pipe(ofType(signalrEventReceived), take(1))
        .subscribe(() => {
          this.ngZone.run(() => this.store.dispatch(chipLanding()));
          resolve();
        });
    });

    this.ngZone.run(() => this.store.dispatch(chipFlying()));

    chipRef.instance
      .animate(sourceRect, targetRect, () => {
        this.ngZone.run(() => this.store.dispatch(chipWaitingSignalr()));
        return signalrPromise;
      })
      .then(() => {
        this.ngZone.run(() => this.store.dispatch(chipLanded()));
        chipRef.destroy();
      });
  }

  getErrorMessage(field: string): string {
    const control = this.eventForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Required';
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Must be ${maxLength} characters or fewer`;
    }
    return '';
  }
}
