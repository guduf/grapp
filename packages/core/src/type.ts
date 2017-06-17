
import 'reflect-metadata';
import { TypeInfo } from 'graphql';
import { get as stackTrace } from 'stack-trace';
import { Inject, InjectionToken, Provider, Injector } from './di';

const TYPE_META_TOKEN = 'grapp:type';


export type TypeTarget = any;

export interface TypeParams {
  selector?: string;
  providers?: Provider[];
  schema?: string;
  schemaUrl?: string;
}

export interface TypeMeta extends TypeParams {
  selector: string;
  filename: string;
  providers: Provider[];
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
    const typeMeta: TypeMeta = {
      ...params,
      filename,
      selector,
      providers: params.providers || []
    };
    Reflect.defineMetadata(TYPE_META_TOKEN, typeMeta, typeTarget);
  }
}

export function getTypeMeta(typeTarget: TypeTarget): TypeMeta {
  return Reflect.getMetadata(TYPE_META_TOKEN, typeTarget);
}

export abstract class GenericType { }

export abstract class TypeBuilder {
  build<
    T extends GenericType = GenericType,
    S extends { [key: string]: any } = { [key: string]: any }
  >(target: TypeTarget, payload: S): T {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export const TYPE_PAYLOAD_TOKEN = new InjectionToken('TYPE_PAYLOAD_TOKEN');
export function TypePayload(): ParameterDecorator {
  return function typePayloadDecorator(typeTarget: TypeTarget, key: string, i: number) {
    Inject(TYPE_PAYLOAD_TOKEN)(typeTarget, key, i);
  }
}
