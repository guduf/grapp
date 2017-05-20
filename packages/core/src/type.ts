import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Provider } from './di';

const TYPE_META_TOKEN = 'grapp:operation'

export interface TypeParams {
  selector?: string;
  providers?: Provider[];
}

export interface TypeMeta extends TypeParams {
  selector: string;
  filename: string;
}

export function Type(params: TypeParams, filename?: string): ClassDecorator {
  if (!filename)
    try { filename = stackTrace()[1].getFileName(); }
    catch (err) { console.error(err); }
  return function TypeDecorator(defCtor: any) {
    const selector = params.selector || defCtor.name;
    const typeMeta: TypeMeta = {filename, selector, ...params};
    Reflect.defineMetadata(TYPE_META_TOKEN, typeMeta, defCtor);
  }
}

export function getTypeMeta(defCtor: any): TypeMeta {
  return Reflect.getMetadata(TYPE_META_TOKEN, defCtor);
}
