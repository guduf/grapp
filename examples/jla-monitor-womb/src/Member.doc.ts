import { Observable } from 'rxjs';

import {
  Doc,
  DocId,
  DocMutation,
  DocQuery,
  DocSubscription,
  Data,
  Mutation,
  Query,
  Subscription
} from '../../../lib';

const schema = `
  type Member {
    id: ID!
    pseudo: String!
  }

  type Mutation {
    createMember(pseudo: String!): Member!
    removeMember(id: ID!): Boolean!
  }

  type Query {
    getMember(id: ID!): Member!
  }

  type Subscription {
    listMember: [Member]!
  }
`;

@Mutation()
export class MemberMutation {
  constructor(private _docMutation: DocMutation<Member>) { }

  createMember({pseudo}: {pseudo: string}): Promise<Member> {
    return this._docMutation.create({pseudo});
  }

  removeMember({id}: {id: string}): Promise<boolean> {
    return this._docMutation.remove(id);
  }
}

@Query()
export class MemberQuery {
  constructor(private _docQuery: DocQuery<Member>) { }

  getMember({id}: {id: string}): Promise<Member> {
    return this._docQuery.findOne({id});
  }
}

@Subscription()
export class MemberSubscription {
  constructor(private _docSubscription: DocSubscription<Member>) { }

  listMember(): Observable<Member[]> {
    return this._docSubscription.watch({}).do(members => console.log(members.map(m => m.id)));
  }
}

@Doc({
  operations: [MemberMutation, MemberQuery, MemberSubscription],
  schema
})
export class Member {
  @DocId
  id: string
  @Data.string({req: 1, inp: 1, upd: 1})
  pseudo: Promise<string>
}

export default Member;
