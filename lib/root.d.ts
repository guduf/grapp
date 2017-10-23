import { GraphQLSchema } from 'graphql';
import { Db } from './db';
import { Injector, Provider } from './di';
import { GrappMeta, GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
export interface RootParams {
    db: Db;
    providers?: Provider[];
}
export declare class Root {
    private _target;
    private _params;
    constructor(_target: GrappTarget | GrappTarget[], _params: RootParams);
    injector: Injector;
    grappRefs: Map<any, GrappRef<GrappMeta>>;
    schema: GraphQLSchema;
    readonly db: Db;
    registerGrappRef(target: GrappTarget): GrappRef;
    getTypeRef(selector: string): TypeRef;
    typer(selector: string, payload: {
        [key: string]: any;
    }): TypeInstance;
    build(): GraphQLSchema;
}
export declare function bootstrapGrapp(target: GrappTarget, params: RootParams): GraphQLSchema;
