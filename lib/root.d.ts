import { GraphQLSchema } from 'graphql';
import { PubSubEngine } from 'graphql-subscriptions';
import { Db } from './db';
import { Injector, Provider } from './di';
import { GrappMeta, GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
export interface RootParams {
    db: Db;
    pubsub: PubSubEngine;
    providers?: Provider[];
}
export declare class Root {
    constructor(target: GrappTarget | GrappTarget[], params: RootParams);
    db: Db;
    injector: Injector;
    grappRefs: Map<any, GrappRef<GrappMeta>>;
    pubsub: PubSubEngine;
    schema: GraphQLSchema;
    registerGrappRef(target: GrappTarget): GrappRef;
    getTypeRef(selector: string): TypeRef;
    typer(selector: string, payload: {
        [key: string]: any;
    }): TypeInstance;
    build(): GraphQLSchema;
}
export declare function bootstrapGrapp(target: GrappTarget, params: RootParams): GraphQLSchema;
