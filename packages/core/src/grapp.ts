import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Provider } from './di';

const GRAPP_META_TOKEN = 'grapp:module'

export interface GrappParams {
  schema?: string
  schemaUrl?: string
  types: any[]
  providers?: Provider[]
}

export interface GrappMeta extends GrappParams {
  filename: string;
}

export function Grapp(params: GrappParams, filename?: string): ClassDecorator {
  if (!filename) filename = stackTrace()[1].getFileName();
  return function GrappDecorator(grappCtor: any) {
    const grappMeta: GrappMeta = {...params, filename};
    Reflect.defineMetadata(GRAPP_META_TOKEN, grappMeta, grappCtor);
  }
}

export function getGrappMeta(grappCtor: any): GrappMeta {
  return Reflect.getMetadata(GRAPP_META_TOKEN, grappCtor);
}
