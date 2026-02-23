import { EventType } from './event.model';

export interface EventFilter {
  type?: EventType | null;
  userId?: string;
  description?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
