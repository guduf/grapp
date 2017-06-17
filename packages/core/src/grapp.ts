import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Provider } from './di';
import { DocTarget } from './doc';
import { OperationTarget } from './operation';
import { TypeTarget } from './type';

const GRAPP_META_TOKEN = Symbol('grapp:module');

export interface GrappParams {
  docs?: DocTarget[];
  operations?: OperationTarget[];
  providers?: Provider[];
  schema?: string;
  schemaUrl?: string;
  types?: TypeTarget[];
}

export interface GrappMeta extends GrappParams {
  filename: string;
}

export function Grapp(params: GrappParams, filename?: string): ClassDecorator {
  if (!filename) filename = stackTrace()[1].getFileName();
  return function GrappDecorator(grappCtor: any) {
    const grappMeta: GrappMeta = {
      ...params,
      filename,
      docs: params.docs || [],
      operations: params.operations || [],
      providers: params.providers || [],
      types: params.types || []
    };
    Reflect.defineMetadata(GRAPP_META_TOKEN, grappMeta, grappCtor);
  }
}

export function getGrappMeta(grappCtor: any): GrappMeta {
  return Reflect.getMetadata(GRAPP_META_TOKEN, grappCtor);
}
