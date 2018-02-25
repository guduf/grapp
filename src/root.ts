/**
 * GrappRoot
 */
import {
  buildASTSchema,
  DocumentNode,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  DefinitionNode
} from 'graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

import { Injector, Provider, TYPER } from './di';
import { GrappMeta, GrappTarget, getGrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';

/** Available parameters to bootstaping Grapp. */
export interface GrappRootParams {
  /** Additional providers injected before the boostraped grapps. */
  providers?: Provider[]
}

/**
 * Represents a unique instance created during bootstrap to initialize the grapps.
 */
export class GrappRoot {
  /**
   * Initializes a Grapp root.
   * @param target The grapp target.
   * @param params The Grapp root parameters.
   */
  constructor(
    target: GrappTarget,
    params: GrappRootParams = {}
  ) {
    if (!target) throw new TypeError('(target) is not a valid object');

    this.injector = Injector.resolveAndCreate([
      ...(params.providers || []),
      {provide: TYPER, useValue: this.typer.bind(this)}
    ]);

    this.bootstrapedGrapp = this.importGrappRef(target);
  }

  /** The root injector. */
  injector: Injector;
  /** The store of registred grapps. */
  grappRefs = new Map<GrappTarget, GrappRef>();
  /** The grapp which has been bootstraped */
  bootstrapedGrapp: GrappRef

  /**
   * Creates a grapp and registers it in the root store.
   * If the target has already been registred, it is directly returned.
   * @param target The grapp that will be initialize.
   * @returns The registred grapp reference.
   */
  importGrappRef(target: GrappTarget): GrappRef {
    if (this.grappRefs.has(target)) return this.grappRefs.get(target);
    const grappMeta = getGrappMeta(target);
    if (!grappMeta) return null;
    const grappRef = new grappMeta.ctor(this, grappMeta);
    this.grappRefs.set(target, grappRef);
    return grappRef;
  }

  /**
   * Retrieves a type reference by browsing the registred grapp references.
   * @param selector The selector of the expected type reference.
   * @returns The expected type reference.
   */
  getTypeRef(selector: string): TypeRef {
    for (const [, grappRef] of this.grappRefs)
      if (grappRef.typeRefs.type.has(selector))
        return grappRef.typeRefs.type.get(selector);
  }

  /**
   * Finds a type reference using the selector to create a new type instance
   * @param selector The selector of the expected type
   * @param payload The payload to create the new type instance
   * @returns The new type instance.
   */
  typer(selector: string, payload: { [key: string]: any } = {}): TypeInstance {
    const typeRef = this.getTypeRef(selector);
    if (!typeRef) throw new Error('Cant find type with selector: ' + selector);
    return typeRef.instanciate(payload);
  }
}

/**
 * Initialize a grapp or an array of grapps to build a GraphQL schema.
 * @param target A grapp or an array of grapps that Grapp will build
 * @param params The Grapp root parameters
 * @return The new graphQL schema
 */
export function bootstrapGrapp(target: GrappTarget, params: GrappRootParams = {}): GraphQLSchema {
  const root = new GrappRoot(target, params);
  return root.bootstrapedGrapp.build();
}
