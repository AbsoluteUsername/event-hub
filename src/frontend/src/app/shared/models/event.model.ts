export enum EventType {
  PageView = 'PageView',
  Click = 'Click',
  Purchase = 'Purchase',
}

export interface CreateEventRequest {
  userId: string;
  type: EventType;
  description: string;
}

export interface EventResponse {
  id: string;
  userId: string;
  type: EventType;
  description: string;
  createdAt: string;
}
