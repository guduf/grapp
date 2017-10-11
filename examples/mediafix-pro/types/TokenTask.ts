import {
  Data,
  DataArray,
  Grapp,
  Collection,
  Payload,
  Typer,
  Type
} from '../../../dist/index';

import { MediafixUser } from './MediafixUser';
import { Orga } from './Orga';
import { OrgaUser } from './OrgaUser';

export type TokenTaskStatus = 'proposal'|'pending'|'validation'|'completed'|'canceled';

@Type()
export class TokenTask {
  constructor(
    @Payload {id}: { id: string },
    @Typer private _typer: Typer
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

  async executive(): Promise<MediafixUser> {
    const id = await this.executiveId;
    return this._typer('MediafixUser', {id});
  }

  async orga(): Promise<Orga> {
    const id = await this.orgaId;
    return this._typer('Orga', {id});
  }

  async supervisors(): Promise<OrgaUser[]> {
    const ids = await this.supervisorIds;
    return ids.map(id  => this._typer('OrgaUser', {id}));
  }
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

  async findByOrgaUser({orgaUserId}: { orgaUserId: string }): Promise<TokenTask[]> {
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>({orgaUserId}, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('TokenTask', {id}));
  }

  async findByMediafixUser({mediafixUserId}: { mediafixUserId: string }): Promise<TokenTask[]> {
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>({executiveId: mediafixUserId}, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('TokenTask', {id}));
  }

  async list() {
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>({}, {id: true})
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

  create(): Promise<TokenTask> {
    throw new Error('Not implemented');
  }

  changeStatus({id, status}: { id: string, status: TokenTaskStatus }): Promise<TokenTask> {
    throw new Error('Not implemented');
  }
}

@Grapp({
  types: [TokenTask, TokenTaskMutation, TokenTaskQuery],
  collection: 'tokenTasks',
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
