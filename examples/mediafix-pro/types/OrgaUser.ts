import {
  Data,
  Grapp,
  Collection,
  Payload,
  Doc,
  DocMutation,
  DocQuery,
  Typer
} from '../../../dist/index';

import { Orga, OrgaQuery } from './orga';
import { User } from './user';
import { TokenTask, TokenTaskQuery } from './tokenTask';

@Doc()
export class OrgaUser extends User {
  private constructor(
    @Payload {id} : { id :string },
    @Typer private _typer: Typer
  ) { super(); }

  group: 'orga'

  @Data.shortid({req: true, inp: true, upd: false})
  orgaId: string;
  @Data.boolean({req: true, inp: true, upd: true})
  isManager: boolean;

  async orga(): Promise<Orga> {
    const id  = await this.id;
    const orgaQuery: OrgaQuery = this._typer('OrgaQuery');
    return orgaQuery.get({id});
  }

  async tokenTasks(): Promise<TokenTask[]> {
    const orgaUserId  = await this.id;
    const tokenTaskQuery: TokenTaskQuery = this._typer('TokenTaskQuery');
    return tokenTaskQuery.findByOrgaUser({orgaUserId});
  }
}

@DocQuery({docTarget: OrgaUser})
export class OrgaUserQuery {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

  async get({id}: {id: string}): Promise<OrgaUser> {
    return this._typer('Orga', {id});
  }

  async listByOrga(
    {orgaId, onlyManagers}: { orgaId: string, onlyManagers?: boolean }
  ): Promise<OrgaUser[]> {
    const dbQuery = {orgaId, ...(onlyManagers === true ? {isManager: true} : {})};
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>(dbQuery, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('OrgaUser', {id}));
  }
}

@Grapp({
  types: [OrgaUser, OrgaUserQuery],
  schema: `
    type OrgaUser implements User {
      id: ID!
      email: String!
      firstName: String!
      lastName: String!
      group: UserGroup!
      lastConnection: Date

      orga: Orga!
      isManager: Boolean
      tokenTasks: [TokenTask]!
    }

    type OrgaUserQuery {
      get(id: ID!): OrgaUser
      listByOrga(orgaId: ID!, onlyManagers: Boolean): [OrgaUser]!
    }

    type Query {
      OrgaUser: OrgaUserQuery!
    }
  `
})
export class OrgaUserGrapp { }
