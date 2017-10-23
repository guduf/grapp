import {
  Doc,
  DocId,
  DocMutation,
  DocQuery,
  Data,
  Mutation,
  Query
} from '../../../lib';

const schema = `
  type Member {
    id: ID!
    pseudo: String!
  }

  type MemberMutation {
    create(pseudo: String!): Member
  }

  type MemberQuery {
    get(id: ID!): Member
  }

  type Mutation {
    Member: MemberMutation!
  }

  type Query {
    Member: MemberQuery!
  }
`;

@Mutation()
export class MemberMutation {
  constructor(private _docMutation: DocMutation<Member>) { }

  create({pseudo}: {pseudo: string}): Promise<Member> {
    return this._docMutation.create({pseudo});
  }
}

@Query()
export class MemberQuery {
  constructor(private _docQuery: DocQuery<Member>) { }

  get({id}: {id: string}): Promise<Member> {
    return this._docQuery.findOne({id});
  }
}

@Doc({
  operations: [MemberMutation, MemberQuery],
  schema
})
export class Member {
  @DocId
  id: string
  @Data.string({req: 1, inp: 1, upd: 1})
  pseudo: Promise<string>
}

export default Member;
