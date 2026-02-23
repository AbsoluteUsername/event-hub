import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventTypeChipComponent } from './event-type-chip.component';

describe('EventTypeChipComponent', () => {
  let component: EventTypeChipComponent;
  let fixture: ComponentFixture<EventTypeChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTypeChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventTypeChipComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.type = 'PageView';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render "PageView" with correct aria-label', () => {
    component.type = 'PageView';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.textContent.trim()).toBe('PageView');
    expect(chip.getAttribute('aria-label')).toBe('Event type: PageView');
  });

  it('should render "Click" with correct aria-label', () => {
    component.type = 'Click';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.textContent.trim()).toBe('Click');
    expect(chip.getAttribute('aria-label')).toBe('Event type: Click');
  });

  it('should render "Purchase" with correct aria-label', () => {
    component.type = 'Purchase';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.textContent.trim()).toBe('Purchase');
    expect(chip.getAttribute('aria-label')).toBe('Event type: Purchase');
  });

  it('should apply correct CSS class for PageView', () => {
    component.type = 'PageView';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.classList.contains('chip-pageview')).toBeTrue();
  });

  it('should apply correct CSS class for Click', () => {
    component.type = 'Click';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.classList.contains('chip-click')).toBeTrue();
  });

  it('should apply correct CSS class for Purchase', () => {
    component.type = 'Purchase';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.classList.contains('chip-purchase')).toBeTrue();
  });

  it('should have pill shape with border-radius via chip class', () => {
    component.type = 'PageView';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip).toBeTruthy();
    expect(chip.classList.contains('chip')).toBeTrue();
  });

  it('should render with unknown type without crashing', () => {
    component.type = 'Unknown';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip).toBeTruthy();
    expect(chip.textContent.trim()).toBe('Unknown');
    expect(chip.getAttribute('aria-label')).toBe('Event type: Unknown');
  });

  it('should render chip text matching the type input exactly (case-sensitive)', () => {
    component.type = 'PageView';
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.textContent.trim()).toBe('PageView');
    expect(chip.textContent.trim()).not.toBe('pageview');
    expect(chip.textContent.trim()).not.toBe('PAGEVIEW');
  });
});
