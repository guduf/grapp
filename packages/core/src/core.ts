import { InjectionToken, Injector, Provider } from './di';
import { getGrappMeta, GrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';
import { GraphQLSchema } from 'graphql';

export interface GrappData {
  schema: GraphQLSchema
  rootValue: { [key: string]: any }
}

export async function bootstrapGrapp(
  grapp: any, extraProviders?: Provider[]
): Promise<GrappData> {
  if (!grapp) {
    const message = 'The grapp passed as argument is null';
    return Promise.reject(new TypeError(message));
  }
  const meta = getGrappMeta(grapp);
  if (!meta) {
    const message = 'The grapp passed as argument has not been decorated with @Grapp';
    return Promise.reject(new TypeError(message));
  }
  const coreInjector = createCoreInjector();
  const rootInjector = extraProviders ?
    Injector.resolveAndCreate(extraProviders, coreInjector) :
    undefined;
  let grappRef: GrappRef;
  try { grappRef = new GrappRef(rootInjector || coreInjector, meta); }
  catch (err) { return Promise.reject(err); }
  const [schema, rootValue] = grappRef.build();
  return Promise.resolve<GrappData>({schema, rootValue});
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
  return Injector.resolveAndCreate(coreProviders);
}
