import {
  Data,
  Grapp,
  Collection,
  Payload,
  Type,
  Typer
} from '../../../dist/index';
import { User } from './user';

@Type()
export class OrgaUserQuery {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

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

@Type()
export class OrgaUser extends User {
  private constructor(
    @Payload {id} : { id :string }
  ) { super(); }

  group: 'orga'

  @Data.shortid({req: true, inp: true, upd: false})
  orgaId: string;
  @Data.boolean({req: true, inp: true, upd: true})
  isManager: boolean;
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
      isManager: boolean
      tokenTasks: [TokenTask]!
    }

    type OrgaUserQuery {
      get(id: ID!): OrgaUser
      listByOrga(orgaId: ID!, onlyManagers: Boolean): [OrgaUser]!
    }

    type Query {
      OrgaUser: OrgaUserQuery
    }
  `
})
export class OrgaUserGrapp { }
