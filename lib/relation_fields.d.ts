import { DocRef } from './doc_ref';
import { TypeInstance } from './type';
import { FieldMeta, FieldRef } from './fields';
export declare type RelationFieldKind = 'btm' | 'bto' | 'hm' | 'ho';
export declare class RelationFieldMeta implements FieldMeta {
    kind: RelationFieldKind;
    foreignSelector: string;
    query: Object;
    constructor(kind: RelationFieldKind, foreignSelector: string, query: Object);
    FieldRefClass: typeof RelationFieldRef;
}
export declare class RelationFieldRef implements FieldRef {
    typeRef: DocRef;
    key: string;
    meta: RelationFieldMeta;
    constructor(typeRef: DocRef, key: string, meta: RelationFieldMeta);
    defineProperty(instance: TypeInstance): void;
    resolve(instance: TypeInstance): Promise<TypeInstance | TypeInstance[]>;
    private _fetchData(instance);
}
export declare function buildRelationFieldDecorator(kind: RelationFieldKind, foreignSelector: string, query?: Object): PropertyDecorator;
export declare function belongsToMany(selector: string, query?: Object): PropertyDecorator;
export declare function belongsToOne(selector: string, query?: Object): PropertyDecorator;
export declare function hasMany(selector: string, query?: Object): PropertyDecorator;
export declare function hasOne(selector: string, query?: Object): PropertyDecorator;
export declare const Relation: {
    belongsToMany: (selector: string, query?: Object) => PropertyDecorator;
    belongsToOne: (selector: string, query?: Object) => PropertyDecorator;
    hasMany: (selector: string, query?: Object) => PropertyDecorator;
    hasOne: (selector: string, query?: Object) => PropertyDecorator;
};
