import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  DestroyRef,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
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
import { AppState } from '../../store';
import {
  selectIsSubmitting,
  selectSubmissionStatus,
} from '../../store/submission/submission.selectors';
import {
  submitEvent,
  resetSubmissionStatus,
} from '../../store/submission/submission.actions';
import {
  EventType,
  CreateEventRequest,
} from '../../shared/models/event.model';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

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

  @ViewChild('userIdInput') userIdInput!: ElementRef<HTMLInputElement>;

  isSubmitting$ = this.store.select(selectIsSubmitting);
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
          this.eventForm.reset();
          this.eventForm.markAsPristine();
          this.eventForm.markAsUntouched();
          setTimeout(() => this.userIdInput?.nativeElement?.focus());
          this.store.dispatch(resetSubmissionStatus());
        } else if (status === 'failure') {
          this.store.dispatch(resetSubmissionStatus());
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
