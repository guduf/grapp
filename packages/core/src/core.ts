import { InjectionToken, Injector, Provider } from './di';
import { getGrappMeta, GrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';
import { GraphQLSchema, GraphQLTypeResolver as Resolver } from 'graphql';

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
  return Promise.resolve({schema, rootValue});
}


export function createCoreInjector(): Injector {
  const coreProviders: Provider[] = [];
  return Injector.resolveAndCreate(coreProviders);
}

export { GraphQLTypeResolver as Resolver } from 'graphql';
