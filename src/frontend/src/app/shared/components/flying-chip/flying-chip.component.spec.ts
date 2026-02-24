import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlyingChipComponent } from './flying-chip.component';

describe('FlyingChipComponent', () => {
  let component: FlyingChipComponent;
  let fixture: ComponentFixture<FlyingChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlyingChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlyingChipComponent);
    component = fixture.componentInstance;
    component.eventType = 'PageView';
    component.userId = 'user123';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render chip with event type label', () => {
    const typeEl = fixture.nativeElement.querySelector('.chip-type');
    expect(typeEl.textContent.trim()).toBe('PageView');
  });

  it('should render userId when 12 chars or fewer', () => {
    component.userId = 'shortUser';
    fixture.detectChanges();
    const userEl = fixture.nativeElement.querySelector('.chip-user');
    expect(userEl.textContent.trim()).toBe('shortUser');
  });

  it('should truncate userId to 12 chars + "..." when exceeding 12 chars', () => {
    component.userId = 'veryLongUserId123456';
    fixture.detectChanges();
    const userEl = fixture.nativeElement.querySelector('.chip-user');
    expect(userEl.textContent.trim()).toBe('veryLongUser...');
  });

  it('should show full userId when exactly 12 chars', () => {
    component.userId = '123456789012';
    fixture.detectChanges();
    const userEl = fixture.nativeElement.querySelector('.chip-user');
    expect(userEl.textContent.trim()).toBe('123456789012');
  });

  it('should have role="status" on host element', () => {
    const hostEl = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('status');
  });

  it('should have aria-label="Event submitting" on host element', () => {
    const hostEl = fixture.nativeElement;
    expect(hostEl.getAttribute('aria-label')).toBe('Event submitting');
  });

  it('should have position: fixed on host element', () => {
    const hostEl = fixture.nativeElement;
    expect(hostEl.style.position).toBe('fixed');
  });

  it('should have pointer-events: none on host element', () => {
    const hostEl = fixture.nativeElement;
    expect(hostEl.style.pointerEvents).toBe('none');
  });

  it('should apply type-specific CSS class on chip-type element', () => {
    const typeEl = fixture.nativeElement.querySelector('.chip-type');
    expect(typeEl.classList.contains('type-pageview')).toBeTrue();

    component.eventType = 'Click';
    fixture.detectChanges();
    const updatedTypeEl = fixture.nativeElement.querySelector('.chip-type');
    expect(updatedTypeEl.classList.contains('type-click')).toBeTrue();
  });
});
