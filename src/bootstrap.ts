import { GraphQLSchema } from 'graphql';

import { Db } from './db';
import { GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';

export interface GrappData {
  schema: GraphQLSchema
  rootValue: { [key: string]: any }
}

export function bootstrapGrapp(target: GrappTarget, db: Db): Promise<GrappData> {
  let grappRef: GrappRef;
  try {
    if (!db || typeof db.collection !== 'function') throw new Error('Invalid db');
    grappRef = new GrappRef(db, target);
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve(grappRef.build());
}
