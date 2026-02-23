import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEventRequest, EventResponse } from '../../shared/models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(request: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/api/events`, request);
  }
}
