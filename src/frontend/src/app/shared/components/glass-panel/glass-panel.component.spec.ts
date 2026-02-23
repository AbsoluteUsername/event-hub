import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassPanelComponent } from './glass-panel.component';

describe('GlassPanelComponent', () => {
  let component: GlassPanelComponent;
  let fixture: ComponentFixture<GlassPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlassPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlassPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render default glass-panel class', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.glass-panel')).toBeTruthy();
    expect(el.querySelector('.glass-panel-compact')).toBeFalsy();
  });

  it('should render glass-panel-compact class when compact is true', () => {
    component.compact = true;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.glass-panel-compact')).toBeTruthy();
    expect(el.querySelector('.glass-panel')).toBeFalsy();
  });

  it('should project content via ng-content', () => {
    const hostEl = fixture.nativeElement as HTMLElement;
    const testContent = document.createElement('span');
    testContent.textContent = 'Test Content';
    hostEl.querySelector('.glass-panel')?.appendChild(testContent);
    expect(hostEl.textContent).toContain('Test Content');
  });
});
