import { EventEmitter } from 'events';
import { $$asyncIterator } from 'iterall';
import { plural, singular } from 'pluralize';
import { Observable } from 'rxjs/Observable';

export function obsToAsyncIterator<T = any>(obs: Observable<T>): AsyncIterator<T> {
  const pullQueue: { (result: IteratorResult<T>): void }[] = [];
  const pushQueue: T[] = [];
  let listening = true;

  const sub = obs.subscribe(
    value => pushValue(value),
    err => {},
    () => (listening = false)
  );

  const pushValue = value => {
    if (pullQueue.length !== 0) pullQueue.shift()({value, done: false});
    else pushQueue.push(value);
  };

  const pullValue = () => {
    return new Promise(resolve => {
      if (pushQueue.length !== 0) resolve({value: pushQueue.shift(), done: false});
      else pullQueue.push(resolve);
    });
  };

  const emptyQueue = () => {
    if (listening) {
      listening = false;
      sub.unsubscribe();
      pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
      pullQueue.length = 0;
      pushQueue.length = 0;
    }
  };

  return {
    next(): Promise<IteratorResult<T>> {
      return listening ? pullValue() : this.return();
    },

    return(): Promise<IteratorResult<T>> {
      emptyQueue();
      return Promise.resolve({value: undefined, done: true});
    },

    throw(error): Promise<IteratorResult<T>> {
      emptyQueue();
      return Promise.reject(error);
    },

    [$$asyncIterator]() {
      return this;
    },
  };
}

export function capitalize(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

export function pluralize(str: string): string {
  return plural(str);
}

export function singularize(str: string): string {
  return singular(str);
}

export function uncapitalize(str: string): string {
  return str[0].toLowerCase() + str.slice(1);
}
