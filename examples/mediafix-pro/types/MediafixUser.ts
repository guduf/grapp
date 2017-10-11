import {
  Data,
  Grapp,
  Collection,
  Payload,
  Type,
  Typer
} from '../../../dist/index';

import { Orga, OrgaQuery } from './orga';
import { User } from './user';
import { TokenTask, TokenTaskQuery } from './tokenTask';

@Type()
export class MediafixUserQuery {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

  async get({id}: {id: string}): Promise<MediafixUser> {
    return this._typer('Orga', {id});
  }

  async listByOrga(
    {orgaId, onlyManagers}: { orgaId: string, onlyManagers?: boolean }
  ): Promise<MediafixUser[]> {
    const dbQuery = {orgaId, ...(onlyManagers === true ? {isManager: true} : {})};
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>(dbQuery, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('MediafixUser', {id}));
  }
}

@Type()
export class MediafixUser extends User {
  private constructor(
    @Payload {id} : { id :string },
    @Typer private _typer: Typer
  ) { super(); }

  group: 'mediafix'

  async orga(): Promise<Orga> {
    const id  = await this.id;
    const orgaQuery: OrgaQuery = this._typer('OrgaQuery');
    return orgaQuery.get({id});
  }

  async tokenTasks(): Promise<TokenTask[]> {
    const mediafixUserId  = await this.id;
    const tokenTaskQuery: TokenTaskQuery = this._typer('TokenTaskQuery');
    return tokenTaskQuery.findByMediafixUser({mediafixUserId});
  }
}

@Grapp({
  types: [MediafixUser, MediafixUserQuery],
  collection: 'orgaUser',
  schema: `
    type MediafixUser implements User {
      id: ID!
      email: String!
      firstName: String!
      lastName: String!
      group: UserGroup!
      lastConnection: Date

      tokenTasks: [TokenTask]!
    }

    type MediafixUserQuery {
      get(id: ID!): MediafixUser
    }

    type Query {
      MediafixUser: MediafixUserQuery
    }
  `
})
export class MediafixUserGrapp { }
