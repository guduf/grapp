import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import { InjectionToken, Injector, Provider, ReflectiveInjector } from './di';
import { getGrappMeta, GrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';

export async function bootstrapGrapp(grapp: any): Promise<graphqlHTTP.Middleware> {
  if (!grapp) {
    const message = 'The grapp passed as argument is null';
    return Promise.reject(new TypeError(message));
  }
  const meta = getGrappMeta(grapp);
  if (!meta) {
    const message = 'The grapp passed as argument has not been decorated with @Grapp';
    return Promise.reject(new TypeError(message));
  }
  const app = express();
  const rootInjector = createCoreInjector();
  let grappRef: GrappRef;
  try { grappRef = new GrappRef(rootInjector, meta); }
  catch (err) { return Promise.reject(err); }
  const [schema, rootValue] = grappRef.build();
  return Promise.resolve(graphqlHTTP({schema, rootValue, graphiql: true}));
}

export class TypeTokenStore {
  private _tokens = new Map<string, InjectionToken<string>>();
  create(selector: string): InjectionToken<string> {
    if (this._tokens.has(selector))
      throw new Error(`The token with selector "${selector} has already been created`);
    const token =  new InjectionToken(selector);
    this._tokens.set(selector, token);
    return token;
  }
  get(selector: string): InjectionToken<string> {
    return this._tokens.get(selector);
  }
}

export function createCoreInjector(): Injector {
  const coreProviders: Provider[] = [
    {provide: TypeTokenStore, useClass: TypeTokenStore}
  ];
  return ReflectiveInjector.resolveAndCreate(coreProviders);
}
