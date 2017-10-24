import { DocRef, DocTypeRef } from './doc_ref';
import { setFieldMeta, FieldMeta, FieldRef } from './fields';
import { TypeInstance, TypeTarget } from './type';
import { pluralize } from './utils';

export type RelationFieldKind = 'btm'|'bto'|'hm'|'ho';

export interface RelationFieldParams {
  kind: RelationFieldKind
  foreignSelector: string
  query: Object
}

export class RelationFieldMeta extends FieldMeta implements RelationFieldParams {
  constructor(
    target: TypeTarget,
    key: string,
    params: RelationFieldParams
  ) {
    super(target, key, params, <typeof FieldRef>RelationFieldRef);
    this.kind = params.kind;
    this.foreignSelector = params.foreignSelector;
    this.query = params.query;
  }

  kind: RelationFieldKind
  foreignSelector: string
  query: Object
}

export interface RelationFieldDecorator {
  (foreignSelector: string, query?: Object): PropertyDecorator
}

export class RelationFieldRef extends FieldRef<DocTypeRef, RelationFieldMeta> {
  constructor(typeRef: DocTypeRef, key: string, meta: RelationFieldMeta) {
    super(typeRef, key, meta);
    if (!(this.typeRef instanceof DocTypeRef))
      throw new Error('typeRef must be instance DocTypeRef for RelationFieldRef');
  }

  defineValue = instance => () => this._fetchData(instance);

  private async _fetchData(instance: TypeInstance): Promise<TypeInstance|TypeInstance[]> {
    const {foreignSelector, kind, query} = this.meta;
    const foreignDocTypeRef = <DocTypeRef>this.typeRef.grappRef.root.getTypeRef(foreignSelector);
    if (!(foreignDocTypeRef instanceof DocRef)) throw new Error('foreignDocTypeRef is not instance of DocRef');
    if (kind[0] === 'b') {
      let docIdKey = this.typeRef.selector[0].toLocaleLowerCase() + this.typeRef.selector.slice(1) + 'Id';
      if (!foreignDocTypeRef.fields.has(docIdKey)) {
        if (foreignDocTypeRef.fields.has(pluralize(docIdKey))) docIdKey = pluralize(docIdKey);
        else throw new Error('Cannot find docIdKey in foreignDocTypeRef: ' + docIdKey);
      }
      switch (kind) {
        case 'btm': {
          const btmQuery = {...query, [docIdKey]: (await instance.id)};
          const data: { id: string }[] = await foreignDocTypeRef.collection.find(btmQuery, {id: true}).toArray();
          return data.map(({id}) => foreignDocTypeRef.instanciate({id}));
        }
        case 'bto': {
          const btoQuery = {...query, [docIdKey]: (await instance.id)};
          const data: { id: string } = await foreignDocTypeRef.collection.findOne(btoQuery);
          return foreignDocTypeRef.instanciate(data);
        }
      }
    }
    else if (kind[0] === 'h') {
      let foreignDocIdKey = foreignDocTypeRef.selector[0].toLocaleLowerCase() + foreignDocTypeRef.selector.slice(1) + 'Id';
      switch (kind) {
        case 'hm': {
          if (!this.typeRef.fields.has(pluralize(foreignDocIdKey)))
            throw new Error('Cannot find foreignDocId in DocRef: ' + pluralize(foreignDocIdKey));
          const ids: string[] = await instance[pluralize(foreignDocIdKey)];
          const hmQuery = {...query, id: {$in: ids}};
          const data: { id: string }[] = await foreignDocTypeRef.collection.find(hmQuery, {id: true}).toArray();
          return data.map(({id}) => foreignDocTypeRef.instanciate({id}));
        }
        case 'ho': {
          if (!this.typeRef.fields.has(foreignDocIdKey))
            throw new Error('Cannot find foreignDocId in DocRef: ' + foreignDocIdKey);
          const docId = await instance[foreignDocIdKey];
          const hoQuery = {...query, id: docId};
          const {id}: { id: string } = await foreignDocTypeRef.collection.findOne(hoQuery);
          return foreignDocTypeRef.instanciate({id});
        }
      }
    }
    else throw new ReferenceError('Cannot fing the relation kind: ' + kind);
  }
}

export function buildRelationFieldDecorator(kind: RelationFieldKind): RelationFieldDecorator {
  return (foreignSelector: string, query: Object = {}) => {
    return function decorateRelationField(target, key: string) {
      const meta = new RelationFieldMeta(target, key, {kind, foreignSelector, query});
      setFieldMeta(target, key, meta);
    }
  }
}

export const Relation = {
  belongsToMany: buildRelationFieldDecorator('btm'),
  belongsToOne: buildRelationFieldDecorator('bto'),
  hasMany: buildRelationFieldDecorator('hm'),
  hasOne: buildRelationFieldDecorator('ho')
};
