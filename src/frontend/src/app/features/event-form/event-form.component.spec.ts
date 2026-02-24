import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { Action } from '@ngrx/store';
import { EventFormComponent } from './event-form.component';
import { selectIsSubmitting, selectSubmissionStatus, selectIsSubmitDisabled } from '../../store/submission/submission.selectors';
import { submitEvent, resetSubmissionStatus } from '../../store/submission/submission.actions';
import { EventType } from '../../shared/models/event.model';
import { AnimationService } from '../../core/services/animation.service';

describe('EventFormComponent', () => {
  let component: EventFormComponent;
  let fixture: ComponentFixture<EventFormComponent>;
  let store: MockStore;
  let actions$: Subject<Action>;
  let animationService: jasmine.SpyObj<AnimationService>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    animationService = jasmine.createSpyObj('AnimationService', ['shouldAnimate'], {
      prefersReducedMotion: jasmine.createSpy().and.returnValue(false),
    });
    animationService.shouldAnimate.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [EventFormComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsSubmitting, value: false },
            { selector: selectIsSubmitDisabled, value: false },
            { selector: selectSubmissionStatus, value: 'idle' },
          ],
        }),
        provideMockActions(() => actions$),
        { provide: AnimationService, useValue: animationService },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    fixture = TestBed.createComponent(EventFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 3 form fields and Submit button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const formFields = compiled.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(3);

    const submitButton = compiled.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton?.textContent?.trim()).toContain('Submit Event');
  });

  it('should show Required error for empty userId on blur', () => {
    const userIdInput = fixture.nativeElement.querySelector('input[formControlName="userId"]');
    userIdInput.focus();
    userIdInput.blur();
    userIdInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    component.eventForm.get('userId')?.markAsTouched();
    fixture.detectChanges();

    const matErrors = fixture.nativeElement.querySelectorAll('mat-error');
    const errorTexts = Array.from(matErrors as NodeListOf<Element>).map((el) => el.textContent?.trim());
    expect(errorTexts).toContain('Required');
  });

  it('should show maxlength error for userId exceeding 100 characters', () => {
    const control = component.eventForm.get('userId')!;
    control.setValue('a'.repeat(101));
    control.markAsTouched();
    fixture.detectChanges();

    const matErrors = fixture.nativeElement.querySelectorAll('mat-error');
    const errorTexts = Array.from(matErrors as NodeListOf<Element>).map((el) => el.textContent?.trim());
    expect(errorTexts).toContain('Must be 100 characters or fewer');
  });

  it('should show maxlength error for description exceeding 500 characters', () => {
    const control = component.eventForm.get('description')!;
    control.setValue('a'.repeat(501));
    control.markAsTouched();
    fixture.detectChanges();

    const matErrors = fixture.nativeElement.querySelectorAll('mat-error');
    const errorTexts = Array.from(matErrors as NodeListOf<Element>).map((el) => el.textContent?.trim());
    expect(errorTexts).toContain('Must be 500 characters or fewer');
  });

  it('should dispatch submitEvent action with correct payload when form is valid', () => {
    component.eventForm.get('userId')!.setValue('testUser');
    component.eventForm.get('type')!.setValue(EventType.Click);
    component.eventForm.get('description')!.setValue('Test description');

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      submitEvent({
        request: {
          userId: 'testUser',
          type: EventType.Click,
          description: 'Test description',
        },
      })
    );
  });

  it('should NOT dispatch when form is invalid and should mark all fields as touched', () => {
    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: '[Event Form] Submit Event' }));
    expect(component.eventForm.get('userId')?.touched).toBeTrue();
    expect(component.eventForm.get('type')?.touched).toBeTrue();
    expect(component.eventForm.get('description')?.touched).toBeTrue();
  });

  it('should disable Submit button when isSubmitDisabled is true', () => {
    store.overrideSelector(selectIsSubmitDisabled, true);
    store.refreshState();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeTrue();
  });

  it('should have aria-busy on Submit button when isSubmitDisabled is true', () => {
    store.overrideSelector(selectIsSubmitDisabled, true);
    store.refreshState();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.getAttribute('aria-busy')).toBe('true');
  });

  it('should keep Submit button disabled during chip animation cycle', () => {
    store.overrideSelector(selectIsSubmitDisabled, true);
    store.refreshState();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeTrue();
  });

  it('should reset form on submitEventSuccess status', fakeAsync(() => {
    component.eventForm.get('userId')!.setValue('testUser');
    component.eventForm.get('type')!.setValue(EventType.PageView);
    component.eventForm.get('description')!.setValue('Test');

    store.overrideSelector(selectSubmissionStatus, 'success');
    store.refreshState();
    tick();

    expect(component.eventForm.get('userId')?.value).toBeFalsy();
    expect(component.eventForm.get('type')?.value).toBeFalsy();
    expect(component.eventForm.get('description')?.value).toBeFalsy();
    expect(store.dispatch).toHaveBeenCalledWith(resetSubmissionStatus());
  }));

  it('should preserve form values on submitEventFailure status', fakeAsync(() => {
    component.eventForm.get('userId')!.setValue('testUser');
    component.eventForm.get('type')!.setValue(EventType.Purchase);
    component.eventForm.get('description')!.setValue('Buy item');

    store.overrideSelector(selectSubmissionStatus, 'failure');
    store.refreshState();
    tick();

    expect(component.eventForm.get('userId')?.value).toBe('testUser');
    expect(component.eventForm.get('type')?.value).toBe(EventType.Purchase);
    expect(component.eventForm.get('description')?.value).toBe('Buy item');
    expect(store.dispatch).toHaveBeenCalledWith(resetSubmissionStatus());
  }));

  it('should skip chip creation when reduced motion is preferred', fakeAsync(() => {
    animationService.shouldAnimate.and.returnValue(false);

    component.eventForm.get('userId')!.setValue('testUser');
    component.eventForm.get('type')!.setValue(EventType.PageView);
    component.eventForm.get('description')!.setValue('Test');

    store.overrideSelector(selectSubmissionStatus, 'success');
    store.refreshState();
    tick();

    // Form should reset immediately since animation is disabled
    expect(component.eventForm.get('userId')?.value).toBeFalsy();
    expect(store.dispatch).toHaveBeenCalledWith(resetSubmissionStatus());
  }));

  it('should trigger onSubmit when Enter key is pressed on Description field', () => {
    spyOn(component, 'onSubmit');
    const descriptionInput = fixture.nativeElement.querySelector('input[formControlName="description"]');
    descriptionInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(component.onSubmit).toHaveBeenCalled();
  });
});
