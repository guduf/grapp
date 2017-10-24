import { DocTypeRef } from './doc_ref';
import { FieldMeta, FieldRef } from './fields';
import { TypeInstance, TypeTarget } from './type';
export declare type RelationFieldKind = 'btm' | 'bto' | 'hm' | 'ho';
export interface RelationFieldParams {
    kind: RelationFieldKind;
    foreignSelector: string;
    query: Object;
}
export declare class RelationFieldMeta extends FieldMeta implements RelationFieldParams {
    constructor(target: TypeTarget, key: string, params: RelationFieldParams);
    kind: RelationFieldKind;
    foreignSelector: string;
    query: Object;
}
export interface RelationFieldDecorator {
    (foreignSelector: string, query?: Object): PropertyDecorator;
}
export declare class RelationFieldRef extends FieldRef<DocTypeRef, RelationFieldMeta> {
    constructor(typeRef: DocTypeRef, key: string, meta: RelationFieldMeta);
    defineValue: (instance: any) => () => Promise<TypeInstance | TypeInstance[]>;
    private _fetchData(instance);
}
export declare function buildRelationFieldDecorator(kind: RelationFieldKind): RelationFieldDecorator;
export declare const Relation: {
    belongsToMany: RelationFieldDecorator;
    belongsToOne: RelationFieldDecorator;
    hasMany: RelationFieldDecorator;
    hasOne: RelationFieldDecorator;
};
