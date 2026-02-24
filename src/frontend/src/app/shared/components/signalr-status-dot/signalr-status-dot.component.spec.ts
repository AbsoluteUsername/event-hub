import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SignalRStatusDotComponent } from './signalr-status-dot.component';

describe('SignalRStatusDotComponent', () => {
  let component: SignalRStatusDotComponent;
  let fixture: ComponentFixture<SignalRStatusDotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalRStatusDotComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalRStatusDotComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.status = 'connected';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('connected state', () => {
    beforeEach(() => {
      component.status = 'connected';
      fixture.detectChanges();
    });

    it('should render green dot with "Connected" label', () => {
      const dot = fixture.nativeElement.querySelector('.dot');
      const label = fixture.nativeElement.querySelector('.label');

      expect(dot.classList.contains('dot--connected')).toBeTrue();
      expect(label.textContent.trim()).toBe('Connected');
    });

    it('should have correct tooltip text', () => {
      expect(component.tooltipText).toBe('Real-time updates are active');
    });
  });

  describe('reconnecting state', () => {
    beforeEach(() => {
      component.status = 'reconnecting';
      fixture.detectChanges();
    });

    it('should render amber dot with "Reconnecting..." label', () => {
      const dot = fixture.nativeElement.querySelector('.dot');
      const label = fixture.nativeElement.querySelector('.label');

      expect(dot.classList.contains('dot--reconnecting')).toBeTrue();
      expect(label.textContent.trim()).toBe('Reconnecting...');
    });

    it('should have correct tooltip text', () => {
      expect(component.tooltipText).toBe('Attempting to reconnect to real-time service...');
    });
  });

  describe('disconnected state', () => {
    beforeEach(() => {
      component.status = 'disconnected';
      fixture.detectChanges();
    });

    it('should render grey dot with "Disconnected" label', () => {
      const dot = fixture.nativeElement.querySelector('.dot');
      const label = fixture.nativeElement.querySelector('.label');

      expect(dot.classList.contains('dot--disconnected')).toBeTrue();
      expect(label.textContent.trim()).toBe('Disconnected');
    });

    it('should have correct tooltip text', () => {
      expect(component.tooltipText).toBe('Real-time updates are unavailable');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      component.status = 'connected';
      fixture.detectChanges();
    });

    it('should have role="status" on host element', () => {
      const host = fixture.nativeElement;
      expect(host.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" on host element', () => {
      const host = fixture.nativeElement;
      expect(host.getAttribute('aria-live')).toBe('polite');
    });

    it('should have matTooltip directive present', () => {
      const indicator = fixture.nativeElement.querySelector('[ng-reflect-message]');
      expect(indicator).toBeTruthy();
    });
  });

  describe('reactive input changes', () => {
    it('should update UI when status changes from connected to disconnected', () => {
      component.status = 'connected';
      fixture.detectChanges();

      let dot = fixture.nativeElement.querySelector('.dot');
      let label = fixture.nativeElement.querySelector('.label');
      expect(dot.classList.contains('dot--connected')).toBeTrue();
      expect(label.textContent.trim()).toBe('Connected');

      component.status = 'disconnected';
      fixture.detectChanges();

      dot = fixture.nativeElement.querySelector('.dot');
      label = fixture.nativeElement.querySelector('.label');
      expect(dot.classList.contains('dot--disconnected')).toBeTrue();
      expect(label.textContent.trim()).toBe('Disconnected');
    });

    it('should update UI when status changes from disconnected to reconnecting', () => {
      component.status = 'disconnected';
      fixture.detectChanges();

      component.status = 'reconnecting';
      fixture.detectChanges();

      const dot = fixture.nativeElement.querySelector('.dot');
      const label = fixture.nativeElement.querySelector('.label');
      expect(dot.classList.contains('dot--reconnecting')).toBeTrue();
      expect(label.textContent.trim()).toBe('Reconnecting...');
    });
  });
});
