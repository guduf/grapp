import { DocInstance } from './doc';
import { DocRef } from './doc_ref';
import { decorateField, FieldContext, FieldMeta, FieldRef, FieldResolver } from './fields';
import { defineMetaKey } from './meta';


export type RelationFieldKind = 'btm'|'bto'|'hm'|'ho'|'syb'|'sybs';

export class RelationFieldMeta implements FieldMeta {
  constructor(
    public kind: RelationFieldKind,
    public foreignSelector: string,
    public query: Object
  ) { }

  RefClass = RelationFieldRef;
}

export class RelationFieldRef implements FieldRef {
  constructor(
    public docRef: DocRef,
    public key: string,
    public meta: RelationFieldMeta
  ) { }

  resolve(args: {}, {doc}: FieldContext) { return this._fetchData(doc); }

  private async _fetchData(instance: DocInstance): Promise<DocInstance|DocInstance[]> {
    if (/^sybs?$/.test(this.meta.kind)) throw new Error('Not implemented');
    const {foreignSelector, kind, query} = this.meta;
    const foreignDocRef = this.docRef.otherRefs.get(foreignSelector);
    if (!foreignDocRef)
      throw new ReferenceError(`Can't find DocRef with this selector: ${foreignSelector}`);
    switch (kind) {
      case 'btm':
        return foreignDocRef.find({...query, [this.docRef.idKey]: this.docRef.id});
      case 'bto':
        return foreignDocRef.findOne({...query, [this.docRef.idKey]: this.docRef.id});
      case 'hm':
        return this.docRef.find({...query, $ids: (await instance[foreignDocRef.idsKey])});
      case 'ho':
        return this.docRef.findOne({...query, id: (await instance[foreignDocRef.idKey])});
    }
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
