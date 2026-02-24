import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { SignalRService, SIGNALR_CONNECTION } from './signalr.service';
import {
  signalrConnected,
  signalrDisconnected,
  signalrEventReceived,
  signalrReconnecting,
} from '../../store/signalr/signalr.actions';
import { EventType } from '../../shared/models/event.model';

describe('SignalRService', () => {
  let service: SignalRService;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;
  let mockConnection: any;
  let callbackMap: Map<string, Function>;
  let onHandlerMap: Map<string, Function>;

  beforeEach(() => {
    callbackMap = new Map();
    onHandlerMap = new Map();

    mockConnection = {
      start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
      stop: jasmine.createSpy('stop').and.returnValue(Promise.resolve()),
      on: jasmine
        .createSpy('on')
        .and.callFake((methodName: string, callback: Function) => {
          onHandlerMap.set(methodName, callback);
        }),
      onreconnecting: jasmine
        .createSpy('onreconnecting')
        .and.callFake((callback: Function) => {
          callbackMap.set('onreconnecting', callback);
        }),
      onreconnected: jasmine
        .createSpy('onreconnected')
        .and.callFake((callback: Function) => {
          callbackMap.set('onreconnected', callback);
        }),
      onclose: jasmine
        .createSpy('onclose')
        .and.callFake((callback: Function) => {
          callbackMap.set('onclose', callback);
        }),
    };

    TestBed.configureTestingModule({
      providers: [
        SignalRService,
        provideMockStore(),
        { provide: SIGNALR_CONNECTION, useValue: mockConnection },
      ],
    });

    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch');
    service = TestBed.inject(SignalRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should register onreconnecting callback', () => {
      expect(mockConnection.onreconnecting).toHaveBeenCalled();
      expect(callbackMap.has('onreconnecting')).toBeTrue();
    });

    it('should register onreconnected callback', () => {
      expect(mockConnection.onreconnected).toHaveBeenCalled();
      expect(callbackMap.has('onreconnected')).toBeTrue();
    });

    it('should register onclose callback', () => {
      expect(mockConnection.onclose).toHaveBeenCalled();
      expect(callbackMap.has('onclose')).toBeTrue();
    });

    it('should register newEvent handler', () => {
      expect(mockConnection.on).toHaveBeenCalledWith(
        'newEvent',
        jasmine.any(Function)
      );
      expect(onHandlerMap.has('newEvent')).toBeTrue();
    });
  });

  describe('startConnection', () => {
    it('should call connection.start()', async () => {
      await service.startConnection();
      expect(mockConnection.start).toHaveBeenCalled();
    });

    it('should dispatch signalrConnected on successful start', async () => {
      await service.startConnection();
      expect(dispatchSpy).toHaveBeenCalledWith(signalrConnected());
    });

    it('should dispatch signalrDisconnected on failed start', async () => {
      mockConnection.start.and.returnValue(
        Promise.reject(new Error('Connection failed'))
      );
      await service.startConnection();
      expect(dispatchSpy).toHaveBeenCalledWith(signalrDisconnected());
    });
  });

  describe('stopConnection', () => {
    it('should call connection.stop()', async () => {
      await service.stopConnection();
      expect(mockConnection.stop).toHaveBeenCalled();
    });
  });

  describe('connection callbacks', () => {
    it('should dispatch signalrReconnecting on reconnecting', () => {
      const callback = callbackMap.get('onreconnecting')!;
      callback();
      expect(dispatchSpy).toHaveBeenCalledWith(signalrReconnecting());
    });

    it('should dispatch signalrConnected on reconnected', () => {
      const callback = callbackMap.get('onreconnected')!;
      callback();
      expect(dispatchSpy).toHaveBeenCalledWith(signalrConnected());
    });

    it('should dispatch signalrDisconnected on close', () => {
      const callback = callbackMap.get('onclose')!;
      callback();
      expect(dispatchSpy).toHaveBeenCalledWith(signalrDisconnected());
    });
  });

  describe('newEvent handler', () => {
    it('should dispatch signalrEventReceived with event data', () => {
      const mockEvent = {
        id: '1',
        userId: 'user1',
        type: EventType.Click,
        description: 'test click',
        createdAt: '2026-02-24T00:00:00Z',
      };

      const handler = onHandlerMap.get('newEvent')!;
      handler(mockEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        signalrEventReceived({ event: mockEvent })
      );
    });
  });
});
