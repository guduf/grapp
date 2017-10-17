import { DocRef } from './doc_ref';
import { TypeInstance } from './type';
import { decorateField, FieldContext, FieldMeta, FieldRef, FieldResolver } from './fields';
import { defineMetaKey } from './meta';
import { plural } from 'pluralize';


export type RelationFieldKind = 'btm'|'bto'|'hm'|'ho';

export class RelationFieldMeta implements FieldMeta {
  constructor(
    public kind: RelationFieldKind,
    public foreignSelector: string,
    public query: Object,
  ) { }

  FieldRefClass = RelationFieldRef;
}

export class RelationFieldRef implements FieldRef {
  constructor(
    public typeRef: DocRef,
    public key: string,
    public meta: RelationFieldMeta
  ) { }


  defineProperty(instance: TypeInstance) {
    const descriptor: PropertyDescriptor = {
     get: () => { return this.resolve(instance); },
     set: (newValue: any) => { throw new Error('You cant set a decorated property') },
     enumerable: true,
     configurable: false
    }
    Object.defineProperty(instance, this.key, descriptor);
  }

  resolve(instance: TypeInstance) { return this._fetchData(instance); }

  private async _fetchData(instance: TypeInstance): Promise<TypeInstance|TypeInstance[]> {
    const {foreignSelector, kind, query} = this.meta;
    const foreignDocRef = <DocRef>this.typeRef.grappRef.root.getTypeRef(foreignSelector);
    if (!(foreignDocRef instanceof DocRef)) throw new Error('foreignDocRef is not instance of DocRef');
    if (kind[0] === 'b') {
      let docIdKey = this.typeRef.selector[0].toLocaleLowerCase() + this.typeRef.selector.slice(1) + 'Id';
      if (!foreignDocRef.fields.has(docIdKey)) {
        if (foreignDocRef.fields.has(plural(docIdKey))) docIdKey = plural(docIdKey);
        else throw new Error('Cannot find docIdKey in foreignDocRef: ' + docIdKey);
      }
      switch (kind) {
        case 'btm': {
          const btmQuery = {...query, [docIdKey]: (await instance.id)};
          const data: { id: string }[] = await foreignDocRef.collection.find(btmQuery, {id: true}).toArray();
          return data.map(({id}) => foreignDocRef.instanciate({id}));
        }
        case 'bto': {
          const btoQuery = {...query, [docIdKey]: (await instance.id)};
          const data: { id: string } = await foreignDocRef.collection.findOne(btoQuery);
          return foreignDocRef.instanciate(data);
        }
      }
    }
    else if (kind[0] === 'h') {
      let foreignDocIdKey = foreignDocRef.selector[0].toLocaleLowerCase() + foreignDocRef.selector.slice(1) + 'Id';
      switch (kind) {
        case 'hm': {
          if (!this.typeRef.fields.has(plural(foreignDocIdKey)))
            throw new Error('Cannot find foreignDocId in DocRef: ' + plural(foreignDocIdKey));
          const ids: string[] = await instance[plural(foreignDocIdKey)];
          const hmQuery = {...query, id: {$in: ids}};
          const data: { id: string }[] = await foreignDocRef.collection.find(hmQuery, {id: true}).toArray();
          return data.map(({id}) => foreignDocRef.instanciate({id}));
        }
        case 'ho': {
          if (!this.typeRef.fields.has(foreignDocIdKey))
            throw new Error('Cannot find foreignDocId in DocRef: ' + foreignDocIdKey);
          const docId = await instance[foreignDocIdKey];
          const hoQuery = {...query, id: docId};
          const {id}: { id: string } = await foreignDocRef.collection.findOne(hoQuery);
          return foreignDocRef.instanciate({id});
        }
      }
    }
    else throw new ReferenceError('Cannot fing the relation kind: ' + kind);
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
