import { DocState, DocTarget } from './doc';
import { GenericDocType } from './doc_type';
import { TypeTarget } from './type';


export abstract class DocStorage {
  find(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState[]> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  findOne(conditions: { [key: string]: any } = {}, ...fields: string[]): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export abstract class DocStorageFactory {
  find(
    target: DocTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<DocState[]> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
  findOne(
    target: DocTarget, conditions: { [key: string]: any } = {}, ...fields: string[]
  ): Promise<DocState> {
    throw new Error(
      'This is an abstract function that should not be called. ' +
      'It serves for injection concern'
    );
  }
}

export type DocStorageFactoryTarget = any;
