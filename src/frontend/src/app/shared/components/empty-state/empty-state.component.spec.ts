import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to no-data mode', () => {
    expect(component.mode()).toBe('no-data');
  });

  describe('no-data mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'no-data');
      fixture.detectChanges();
    });

    it('should render outbox icon', () => {
      const icon = fixture.nativeElement.querySelector('mat-icon.empty-state__icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('fonticon')).toBe('outbox');
    });

    it('should render "No events yet" title', () => {
      const title = fixture.nativeElement.querySelector('.empty-state__title');
      expect(title.textContent.trim()).toBe('No events yet');
    });

    it('should render subtitle text', () => {
      const subtitle = fixture.nativeElement.querySelector('.empty-state__subtitle');
      expect(subtitle.textContent.trim()).toBe('Submit your first event using the form on the left.');
    });

    it('should NOT render "Clear all filters" button', () => {
      const button = fixture.nativeElement.querySelector('.empty-state__clear-btn');
      expect(button).toBeNull();
    });
  });

  describe('no-results mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'no-results');
      fixture.detectChanges();
    });

    it('should render search_off icon', () => {
      const icon = fixture.nativeElement.querySelector('mat-icon.empty-state__icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('fonticon')).toBe('search_off');
    });

    it('should render "No events match your filters" title', () => {
      const title = fixture.nativeElement.querySelector('.empty-state__title');
      expect(title.textContent.trim()).toBe('No events match your filters');
    });

    it('should render "Clear all filters" button', () => {
      const button = fixture.nativeElement.querySelector('.empty-state__clear-btn');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Clear all filters');
    });

    it('should emit clearFilters when button is clicked', () => {
      spyOn(component.clearFilters, 'emit');
      const button = fixture.nativeElement.querySelector('.empty-state__clear-btn');
      button.click();
      expect(component.clearFilters.emit).toHaveBeenCalled();
    });
  });

  it('should have role="status" on host element', () => {
    const hostEl = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('status');
  });

  it('should render icon at 48px size', () => {
    const icon = fixture.nativeElement.querySelector('mat-icon.empty-state__icon');
    expect(icon).toBeTruthy();
    const styles = getComputedStyle(icon);
    expect(styles.fontSize).toBe('48px');
    expect(styles.width).toBe('48px');
    expect(styles.height).toBe('48px');
  });
});
