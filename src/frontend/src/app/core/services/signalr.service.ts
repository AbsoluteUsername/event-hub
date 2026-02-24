import { Injectable, InjectionToken, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Store } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { EventResponse } from '../../shared/models/event.model';
import {
  signalrConnected,
  signalrDisconnected,
  signalrEventReceived,
  signalrReconnecting,
} from '../../store/signalr/signalr.actions';

export const SIGNALR_CONNECTION = new InjectionToken<signalR.HubConnection>(
  'SignalR HubConnection',
  {
    providedIn: 'root',
    factory: () =>
      new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/api`)
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build(),
  }
);

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly store = inject(Store);
  private readonly connection = inject(SIGNALR_CONNECTION);

  constructor() {
    this.connection.onreconnecting(() => {
      this.store.dispatch(signalrReconnecting());
    });

    this.connection.onreconnected(() => {
      this.store.dispatch(signalrConnected());
    });

    this.connection.onclose(() => {
      this.store.dispatch(signalrDisconnected());
    });

    this.connection.on('newEvent', (event: EventResponse) => {
      this.store.dispatch(signalrEventReceived({ event }));
    });
  }

  async startConnection(): Promise<void> {
    try {
      await this.connection.start();
      this.store.dispatch(signalrConnected());
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.store.dispatch(signalrDisconnected());
    }
  }

  async stopConnection(): Promise<void> {
    await this.connection.stop();
  }
}
