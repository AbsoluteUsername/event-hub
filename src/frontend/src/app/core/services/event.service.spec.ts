import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { CreateEventRequest, EventResponse, EventType } from '../../shared/models/event.model';
import { environment } from '../../../environments/environment';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  const mockRequest: CreateEventRequest = {
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
  };

  const mockResponse: EventResponse = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
    createdAt: '2026-02-23T14:30:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST to /api/events with correct body', () => {
    service.create(mockRequest).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should return Observable<EventResponse> with correct types', () => {
    service.create(mockRequest).subscribe((response) => {
      expect(response.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.userId).toBe('olena');
      expect(response.type).toBe(EventType.PageView);
      expect(response.description).toBe('Viewed homepage');
      expect(response.createdAt).toBe('2026-02-23T14:30:00Z');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/events`);
    req.flush(mockResponse);
  });
});
