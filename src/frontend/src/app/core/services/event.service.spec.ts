import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { CreateEventRequest, EventResponse, EventType } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';
import { PagedResult } from '../../shared/models/paged-result.model';
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

  describe('getAll', () => {
    const mockPagedResult: PagedResult<EventResponse> = {
      items: [mockResponse],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    };

    it('should send GET request to /api/events with query params', () => {
      const filter: EventFilter = {
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDir: 'desc',
        type: EventType.Click,
        userId: 'olena',
      };

      service.getAll(filter).subscribe((response) => {
        expect(response).toEqual(mockPagedResult);
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/api/events` &&
          r.method === 'GET' &&
          r.params.get('page') === '1' &&
          r.params.get('pageSize') === '20' &&
          r.params.get('sortBy') === 'createdAt' &&
          r.params.get('sortDir') === 'desc' &&
          r.params.get('type') === 'Click' &&
          r.params.get('userId') === 'olena'
      );
      req.flush(mockPagedResult);
    });

    it('should omit null/undefined filter values from query params', () => {
      const filter: EventFilter = {
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };

      service.getAll(filter).subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/api/events` &&
          r.method === 'GET'
      );
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('sortBy')).toBe('createdAt');
      expect(req.request.params.get('sortDir')).toBe('desc');
      expect(req.request.params.has('type')).toBe(false);
      expect(req.request.params.has('userId')).toBe(false);
      expect(req.request.params.has('description')).toBe(false);
      expect(req.request.params.has('from')).toBe(false);
      expect(req.request.params.has('to')).toBe(false);
      req.flush(mockPagedResult);
    });

    it('should return Observable<PagedResult<EventResponse>> with correct shape', () => {
      const filter: EventFilter = {
        page: 2,
        pageSize: 10,
        sortBy: 'userId',
        sortDir: 'asc',
      };

      const expectedResult: PagedResult<EventResponse> = {
        items: [mockResponse],
        totalCount: 15,
        page: 2,
        pageSize: 10,
      };

      service.getAll(filter).subscribe((response) => {
        expect(response.items).toBeDefined();
        expect(response.totalCount).toBe(15);
        expect(response.page).toBe(2);
        expect(response.pageSize).toBe(10);
        expect(response.items.length).toBe(1);
        expect(response.items[0].id).toBe(mockResponse.id);
        expect(response.items[0].userId).toBe(mockResponse.userId);
        expect(response.items[0].type).toBe(mockResponse.type);
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/api/events` &&
          r.method === 'GET'
      );
      req.flush(expectedResult);
    });
  });
});
