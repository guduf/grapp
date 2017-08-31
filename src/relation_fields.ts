import { DocInstance } from './doc';
import { DocRef } from './doc_ref';
import { decorateField } from './fields';
import { defineMetaKey } from './meta';


export type RelationFieldKind = 'btm'|'bto'|'hm'|'ho'|'syb'|'sybs';

class RelationFieldMeta {
  constructor(
    public kind: RelationFieldKind,
    public foreignSelector: string,
    public query: Object
  ) { }

  buildResolver(docRef: DocRef, instance: DocInstance): { (): Promise<any> } {
    return async () => {
      if (/^sybs?$/.test(this.kind)) {
        throw new Error('Not implemented');
      }
      const foreignDocRef = docRef.otherRefs.get(this.foreignSelector);
      if (!foreignDocRef)
        throw new ReferenceError(`Can't find DocRef with this selector: ${this.foreignSelector}`);
      switch (this.kind) {
        case 'btm': {
          return foreignDocRef.find({...this.query, [docRef.idKey]: docRef.id});
        }
        case 'bto': {
          return foreignDocRef.findOne({...this.query, [docRef.idKey]: docRef.id});
        }
        case 'hm': {
          const foreignIds: string[] = await instance[foreignDocRef.idsKey];
          return docRef.find({...this.query, $ids: foreignIds});
        }
        case 'ho': {
          const foreignId: string = await instance[foreignDocRef.idKey];
          return docRef.findOne({...this.query, id: foreignId});
        }
      }
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
