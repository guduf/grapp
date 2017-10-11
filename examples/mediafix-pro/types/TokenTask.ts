import {
  Data,
  DataArray,
  Grapp,
  Collection,
  Payload,
  Typer,
  Type
} from '../../../dist/index';

export type TokenTaskStatus = 'proposal'|'pending'|'validation'|'completed'|'canceled';

@Type()
export class TokenTask {
  constructor(
    @Payload
    {id}: { id: string }
  ) { }

  @Data.shortid({req: 1, inp: 0, upd: 0})
  id: Promise<string>
  @Data.shortid({req: 1, inp: 1, upd: 1})
  executiveId: Promise<string>
  @Data.shortid({req: 1, inp: 1, upd: 0})
  orgaId: Promise<string>
  @DataArray.shortid({req: 1, inp: 1, upd: 1})
  supervisorIds: Promise<string[]>

  @DataArray.shortid({req: 1, inp: 0, upd: 0})
  createdAt: Promise<Date>
  @DataArray.shortid({req: 0, inp: 1, upd: 1})
  completedAt: Promise<Date>
  @DataArray.shortid({req: 1, inp: 1, upd: 1})
  status: Promise<TokenTaskStatus>

  @Data.string({req: 1, inp: 1, upd: 1})
  title: string
  @Data.string({req: 0, inp: 1, upd: 1})
  descr: string
  @Data.string({req: 1, inp: 1, upd: 1})
  amount: number
}

@Type()
export class TokenTaskQuery {
  private constructor(
    @Typer private _typer: Typer,
    @Collection private _collection: Collection
  ) { }

  get({id}: { id: string }): TokenTask {
    return this._typer('TokenTask', {id});
  }

  async findByOrga({orgaId}: { orgaId: string }): Promise<TokenTask[]> {
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>({orgaId}, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('TokenTask', {id}));
  }
}

@Type()
export class TokenTaskMutation {
  private constructor(
    @Typer private _typer: Typer,
    @Collection private _collection: Collection
  ) { }
}

@Grapp({
  types: [TokenTask, TokenTaskMutation, TokenTaskQuery],
  schema: `
    enum TokenTaskStatus { proposal pending validation completed canceled }

    type TokenTask {
      id: ID!

      executive: MediafixUser!
      orga: Orga!
      supervisors: [OrgaUser]!

      createdAt: Date!
      completedAt: Date!
      status: TokenTaskStatus!

      title: String!
      descr: String
      amount: Int!
    }

    input TokenTaskCandidate {
      amount: Int!
      title: String!
      descr: String
      status: TokenTaskStatus
    }

    type TokenTaskMutation {
      changeStatus(id: ID!, status: TokenTaskStatus!): TokenTask!
      create(orgaId: ID!, candidate: TokenTaskCandidate!): TokenTask!
    }

    type Mutation {
      TokenTask: TokenTaskMutation
    }

    type TokenTaskQuery {
      get(id: ID!): TokenTask!
      list: [TokenTask]!
    }

    type Query {
      TokenTask: TokenTaskQuery
    }
  `
})
export class TokenTaskGrapp { }
