import * as WebSocket from 'ws';
import { PubSub as BasePubSub, PubSubEngine } from 'graphql-subscriptions';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { OperationMessage } from 'subscriptions-transport-ws/dist/server';

interface PubEvent {
  triggerName: string
  payload: any

}

export class PubSub extends BasePubSub {
  constructor() {
    super();
  }

  completeOperation(ws: WebSocket, opId: string) {
    console.log(`completeOperation`, opId);
  }

  connect(connectionParams: Object, ws: WebSocket): void {
    console.log(`connect`, connectionParams);
  }

  startOperation(msg: OperationMessage, params: { [key: string]: any }, ws: WebSocket): OperationMessage {
    msg = {...msg, payload: {...msg.payload, variables: {...msg.payload.variables, opId: msg.id}}};
    console.log(`startOperation`, msg);
    return null;
  }

  disconnect(ws: WebSocket): void {
    console.log('disconnect');
  }

  // publish(triggerName: string, payload: any): boolean {
  //   this._subject.next({triggerName, payload});
  //   return true;
  // }

  // subscribe(triggerName: string, onMessage: (...args: any[]) => void): Promise<number> {
  //   const sub = this._subject
  //     .filter(e => (e.triggerName === triggerName))
  //     .map(e => e.payload)
  //     .subscribe()
  //   return Promise.resolve(2);
  // }

  // unsubscribe(subId: number): void {
  //   const sub = this._subs.get(subId);
  //   if (sub) sub.unsubscribe();
  // }

  // asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> { throw new Error(); }

  // private _subject = new Subject<PubEvent>()
  // private _subs = new Map<Number, Subscription>()
  // private _sockets = new Map<Number, WebSocket>()
}
