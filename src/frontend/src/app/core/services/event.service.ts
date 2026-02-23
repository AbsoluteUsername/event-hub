import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEventRequest, EventResponse } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';
import { PagedResult } from '../../shared/models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(request: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/api/events`, request);
  }

  getAll(filter: EventFilter): Observable<PagedResult<EventResponse>> {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('pageSize', filter.pageSize.toString())
      .set('sortBy', filter.sortBy)
      .set('sortDir', filter.sortDir);

    if (filter.type) params = params.set('type', filter.type);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.description) params = params.set('description', filter.description);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);

    return this.http.get<PagedResult<EventResponse>>(`${this.apiUrl}/api/events`, { params });
  }
}
