/**
 * GrappRoot
 */
import { GraphQLSchema } from 'graphql';
import { Injector, Provider } from './di';
import { GrappMeta, GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
/** Available parameters to bootstaping Grapp. */
export interface GrappRootParams {
    /** Additional providers injected before the boostraped grapps. */
    providers?: Provider[];
}
/**
 * Represents a unique instance created during bootstrap to initialize the grapps.
 */
export declare class GrappRoot {
    /**
     * Initializes a Grapp root.
     * @param target The grapp target.
     * @param params The Grapp root parameters.
     */
    constructor(target: GrappTarget, params?: GrappRootParams);
    /** The root injector. */
    injector: Injector;
    /** The store of registred grapps. */
    grappRefs: Map<any, GrappRef<GrappMeta>>;
    /**
     * Creates a grapp and registers it in the root store.
     * If the target has already been registred, it is directly returned.
     * @param target The grapp that will be initialize.
     * @returns The registred grapp reference.
     */
    registerGrappRef(target: GrappTarget): GrappRef;
    /**
     * Retrieves a type reference by browsing the registred grapp references.
     * @param selector The selector of the expected type reference.
     * @returns The expected type reference.
     */
    getTypeRef(selector: string): TypeRef;
    /**
     * Finds a type reference using the selector to create a new type instance
     * @param selector The selector of the expected type
     * @param payload The payload to create the new type instance
     * @returns The new type instance.
     */
    typer(selector: string, payload?: {
        [key: string]: any;
    }): TypeInstance;
    /**
     * Builds a new a graphQL schema using the registred grapps references.
     */
    build(): GraphQLSchema;
}
/**
 * Initialize a grapp or an array of grapps to build a GraphQL schema.
 * @param target A grapp or an array of grapps that Grapp will build
 * @param params The Grapp root parameters
 * @return The new graphQL schema
 */
export declare function bootstrapGrapp(target: GrappTarget, params?: GrappRootParams): GraphQLSchema;
