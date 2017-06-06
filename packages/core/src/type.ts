import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Inject, InjectionToken, Provider, Injector } from './di';

const TYPE_META_TOKEN = 'grapp:type';

export type TypeTarget = any;

export interface TypeParams {
  selector?: string;
  providers?: Provider[];
}

export interface TypeMeta extends TypeParams {
  selector: string;
  filename: string;
}

export function Type(params: TypeParams = {}, filename?: string): ClassDecorator {
  if (!filename) try { filename = stackTrace()[1].getFileName(); }
  catch (err) { console.error(err); }
  return function typeDecorator(typeTarget: TypeTarget) {
    let selector = params.selector;
    if (!params.selector) {
      const match = (<string>typeTarget.name || '').match(/^([A-Z][a-zA-Z0-9]+)Type$/);
      if (!match) throw new Error('You must provide a selector or respect the Type pattern');
      selector = match[1];
    }
    const typeMeta: TypeMeta = {filename, selector, ...params};
    Reflect.defineMetadata(TYPE_META_TOKEN, typeMeta, typeTarget);
  }
}

export function getTypeMeta(typeTarget: TypeTarget): TypeMeta {
  return Reflect.getMetadata(TYPE_META_TOKEN, typeTarget);
}

// export class TypeRef<T = any> {
//   get instance() { return this._instance; }
//   get selector() { return this._selector; }
//   private _selector: string;
//   private _instance: T;
//   constructor(
//     private _moduleInjector: Injector,
//     protected _typeCtor: any,
//     meta: TypeMeta
//   ) {
//     this._selector = meta.selector;
//     const injector = Injector.resolveAndCreate(meta.providers || [], _moduleInjector);
//     this._instance = injector.resolveAndInstantiate(_typeCtor);
//   }
// }

export interface ITypeBuilder<T, P = any> { (payload: P): T }

export class TypeBuilderRef<T, P = {}> {
  constructor(private _typeTarget: TypeTarget) { }
  build(payload: P): T {
    const args: any[] = [];
    return new this._typeTarget(payload, ...args);
  }
}

export const TYPE_BUILDER_INJECTION_PREFIX = 'grapp:typeBuilder:';

export function TypeBuilder(typeSelector: string): ParameterDecorator {
  return function typeBuilderDecorator(typeTarget: TypeTarget, key: string, i: number) {
    Inject(TYPE_BUILDER_INJECTION_PREFIX + typeSelector)(typeTarget, key, i);
  }
}

export const TYPE_PAYLOAD_META_TOKEN = 'grapp:payload';
export const TYPE_PAYLOAD_TOKEN = new InjectionToken('grapp:payload');

export function TypePayload(): ParameterDecorator {
  return function typePayloadDecorator(typeTarget: TypeTarget, key: string, i: number) {
    Inject(TYPE_PAYLOAD_TOKEN)(typeTarget, key, i);
    Reflect.defineMetadata(TYPE_PAYLOAD_META_TOKEN, true, typeTarget);
  }
}

export function hasTypePayload(typeTarget: TypeTarget): boolean {
  return Reflect.getMetadata(TYPE_PAYLOAD_META_TOKEN, typeTarget) || false;
}
