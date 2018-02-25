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

    this.registerGrappRef(target);
  }

  /** The root injector. */
  injector: Injector;
  /** The store of registred grapps. */
  grappRefs = new Map<GrappTarget, GrappRef>();

  /**
   * Creates a grapp and registers it in the root store.
   * If the target has already been registred, it is directly returned.
   * @param target The grapp that will be initialize.
   * @returns The registred grapp reference.
   */
  registerGrappRef(target: GrappTarget): GrappRef {
    if (this.grappRefs.has(target)) return this.grappRefs.get(target);
    const grappMeta = getGrappMeta(target);
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

  /**
   * Builds a new a graphQL schema using the registred grapps references.
   */
  build(): GraphQLSchema {
    const rootResolverMap: { [type: string]: { [field: string]: any } } = {
      Mutation: {},
      Query: {}
    };
    const rootDocNode: DocumentNode = {kind: 'Document', definitions: []};
    const opNodes: { [key: string]: ObjectTypeDefinitionNode } = {};
    // for (const opKind of OPERATION_KINDS) opNodes[opKind] = {
    //   kind: 'ObjectTypeDefinition',
    //   name: {kind: 'Name', value: opKind},
    //   fields: []
    // };
    const rootMutationNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Mutation'},
      fields: []
    };
    // for (const [, grappRef] of this.grappRefs) {
    //   let parsed: { docNode: DocumentNode, resolverMap: { [key: string]: any } }
    //   try {
    //     parsed = grappRef.parse();
    //   } catch (err) {
    //     console.error(err);
    //     throw new Error('Failed to parse grappRef: ' + grappRef.target.name);
    //   }
    //   if (parsed) {
    //     for (const def of parsed.docNode.definitions) {
    //       if (def.kind !== 'ObjectTypeDefinition') rootDocNode.definitions.push(def);
    //       else if (OPERATION_KINDS.indexOf(<OperationKind>def.name.value) >= 0)
    //         opNodes[def.name.value].fields.push(...def.fields);
    //       else rootDocNode.definitions.push(def);
    //     }
    //     for (const selector in parsed.resolverMap) {
    //       if (OPERATION_KINDS.indexOf(<OperationKind>selector) >= 0) rootResolverMap[selector] = {
    //         ...rootResolverMap[selector],
    //         ...parsed.resolverMap[selector]
    //       };
    //       else rootResolverMap[selector] = parsed.resolverMap[selector];
    //     }
    //   }
    // }
    // for (const kind of OPERATION_KINDS)
    //   if (opNodes[kind].fields.length) {
    //     rootDocNode.definitions.push(opNodes[kind]);
    //   } else if (kind === 'Query') {
    //     const err = new Error(`BuildError: No fields in Query definition`);
    //     console.error(err);
    //     throw err;
    //   }
    let schema: GraphQLSchema;
    try { schema = buildASTSchema(rootDocNode); } catch (catched) {
      const err = new Error(`BuildError: ${catched.message || catched}`);
      console.error(`rootDocNode.definitions\n`, rootDocNode.definitions);
      console.error(err);
      throw err;
    }
    addResolveFunctionsToSchema(schema, rootResolverMap);
    return schema;
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
  return root.build();
}
