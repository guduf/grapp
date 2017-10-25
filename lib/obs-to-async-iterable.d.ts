import { Observable } from 'rxjs/Observable';
export declare function obsToAsyncIterator<T = any>(obs: Observable<T>): AsyncIterator<T>;
