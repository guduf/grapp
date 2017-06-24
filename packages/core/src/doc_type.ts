import { TypeBuilder, TypeTarget } from './type';
import { GenericDoc } from './doc';
import { DocRef } from './doc_ref';
import { GenericDocStorage } from './doc_storage';
export interface DocState { id: string; [key: string]: any }

export abstract class DocTypePayload {
  docRef: DocRef;
  state: DocState;
}

export abstract class GenericDocType<D extends GenericDoc = GenericDoc> {
  constructor(payload: DocTypePayload) {
    if (typeof payload !== 'object') throw new Error('Payload is not a object');
    const {docRef, state} = payload;
    if (!((this.__docRef = payload.docRef) instanceof DocRef))
      throw new Error('DocTypePayload had no invalid DocRef');
    if (!(this.__id = state.id)) throw new Error('DocTypePayload state has no id');
    const docProps: PropertyDescriptorMap = {};
    const docState: { [field: string]: any } = {};
    for (const [field] of this.__docRef.meta.fields) {
      docState[field] = state[field];
      docProps[field] = <TypedPropertyDescriptor<Promise<any>>>{
        configurable: false,
        enumerable: true,
        get: this.__docGetter(field)
      };
    }
    this.__docState = Object.seal(docState);
    this.__doc = Object.freeze(Object.create(Object.prototype, docProps));
  }
  get doc(): D { return this.__doc; }
  get id(): string { return this.__id; }
  private __doc: D;
  private __docRef: DocRef;
  private __docState: { [key: string]: any };
  private __id: string;
  private __docGetter(field: string): { (): Promise<any> } {
    return (async () => {
      if (this.__docState[field]) return field;
      let newState: { [field: string]: any };
      try { newState = await this.__docRef.findOne({id: this.__id}); }
      catch (err) { console.error(err); throw new Error('Failed to fetch doc'); }
      for (const field in this.__docState)
        if (typeof newState[field] !== 'undefined') this.__docState[field] = newState[field];
      return this.__docState[field];
    });
  }
}

export type DocTypeTarget = typeof GenericDocType;

export abstract class DocTypeBuilder {
  build<
    T extends GenericDocType = GenericDocType
  >(target: TypeTarget, docState: { id: string; [key: string]: any }): T {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export abstract class DocTypeFinder {
  get<
    T extends GenericDocType = GenericDocType
  >(target: TypeTarget, id: string): T {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  find<
    T extends GenericDocType = GenericDocType
  >(
    target: TypeTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<T[]> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  findOne<
    T extends GenericDocType = GenericDocType
  >(
    target: TypeTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<T> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}
