import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { decorateField, FieldContext, FieldMeta, FieldRef, FieldResolver } from './fields';
import { defineMetaKey } from './meta';


export type RelationFieldKind = 'btm'|'bto'|'hm'|'ho'|'syb'|'sybs';

export class RelationFieldMeta implements FieldMeta {
  constructor(
    public kind: RelationFieldKind,
    public foreignSelector: string,
    public query: Object
  ) { }

  FieldRefClass = RelationFieldRef;
}

export class RelationFieldRef implements FieldRef {
  constructor(
    public typeRef: TypeRef,
    public key: string,
    public meta: RelationFieldMeta
  ) { }

  resolve(instance: TypeInstance, args: {}) { return this._fetchData(instance); }

  private async _fetchData(instance: TypeInstance): Promise<TypeInstance|TypeInstance[]> {
    return <TypeInstance>null;
    // if (/^sybs?$/.test(this.meta.kind)) throw new Error('Not implemented');
    // const {foreignSelector, kind, query} = this.meta;
    // const foreignTypeRef = this.typeRef.otherRefs.get(foreignSelector);
    // if (!foreignTypeRef)
    //   throw new ReferenceError(`Can't find TypeRef with this selector: ${foreignSelector}`);
    // switch (kind) {
    //   case 'btm':
    //     return foreignTypeRef.find({...query, [this.typeRef.idKey]: this.typeRef.id});
    //   case 'bto':
    //     return foreignTypeRef.findOne({...query, [this.typeRef.idKey]: this.typeRef.id});
    //   case 'hm':
    //     return this.typeRef.find({...query, $ids: (await instance[foreignTypeRef.idsKey])});
    //   case 'ho':
    //     return this.typeRef.findOne({...query, id: (await instance[foreignTypeRef.idKey])});
    // }
  }
}

export function buildRelationFieldDecorator(
  kind: RelationFieldKind, foreignSelector: string, query: Object = {}
): PropertyDecorator {
  const meta = new RelationFieldMeta(kind, foreignSelector, query);
  return decorateField(meta);
}

export function belongsToMany(selector: string, query?: Object): PropertyDecorator {
  return buildRelationFieldDecorator('btm', selector, query);
}

export function belongsToOne(selector: string, query?: Object): PropertyDecorator {
  return buildRelationFieldDecorator('bto', selector, query);
}

export function hasMany(selector: string, query?: Object): PropertyDecorator {
  return buildRelationFieldDecorator('hm', selector, query);
}

export function hasOne(selector: string, query?: Object): PropertyDecorator {
  return buildRelationFieldDecorator('ho', selector, query);
}

export const Relation = {belongsToMany, belongsToOne, hasMany, hasOne};
