import { GraphQLSchema } from 'graphql';
import { Db } from './db';
import { Injector, Provider } from './di';
import { DocEvents } from './doc_event';
import { GrappMeta, GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
export interface RootParams {
    db: Db;
    providers?: Provider[];
}
export declare class Root {
    constructor(target: GrappTarget | GrappTarget[], params: RootParams);
    db: Db;
    injector: Injector;
    grappRefs: Map<any, GrappRef<GrappMeta>>;
    docEvents: DocEvents;
    schema: GraphQLSchema;
    registerGrappRef(target: GrappTarget): GrappRef;
    getTypeRef(selector: string): TypeRef;
    typer(selector: string, payload: {
        [key: string]: any;
    }): TypeInstance;
    build(): GraphQLSchema;
}
export declare function bootstrapGrapp(target: GrappTarget, params: RootParams): GraphQLSchema;
