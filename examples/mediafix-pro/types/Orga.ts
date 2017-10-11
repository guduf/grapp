import {
  Data,
  Grapp,
  Collection,
  Payload,
  Type,
  Typer
} from '../../../dist/index';

import { OrgaUser, OrgaUserQuery } from './OrgaUser';
import { TokenPurchase, TokenPurchaseQuery } from './TokenPurchase';
import { TokenTask, TokenTaskQuery } from './TokenTask';

@Type()
export class Orga {
  constructor(
    @Payload {id}: { id: string },
    @Typer private _typer: Typer
  ) { }

  @Data.shortid({req: 1, inp: 0, upd: 0})
  id: Promise<string>
  @Data.string({req: 1, inp: 1, upd: 1})
  name: Promise<string>

  async managers(args: {}): Promise<OrgaUser[]> {
    const orgaId = await this.id;
    const orgaUserQuery: OrgaUserQuery = this._typer('OrgaUserQuery');
    return orgaUserQuery.listByOrga({orgaId, onlyManagers: true});
  }
  async tokenTasks(args: {}): Promise<TokenTask[]> {
    const orgaId = await this.id;
    const tokenTaskQuery: TokenTaskQuery = this._typer('TokenTaskQuery');
    return tokenTaskQuery.findByOrga({orgaId});
  }
  async tokenPurchases(): Promise<TokenPurchase[]> {
    const orgaId = await this.id;
    const tokenPurchaseQuery: TokenPurchaseQuery = this._typer('TokenPurchaseQuery');
    return tokenPurchaseQuery.findByOrga({orgaId});
  }
  async users(args: {}): Promise<OrgaUser[]> {
    const orgaId = await this.id;
    const orgaUserQuery: OrgaUserQuery = this._typer('OrgaUserQuery');
    return orgaUserQuery.listByOrga({orgaId});
  }
}

@Type()
export class OrgaQuery {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

  get({id}: { id: string }): Orga {
    return this._typer('Orga', {id});
  }

  async list(): Promise<OrgaQuery[]> {
    const ids: { id: string }[] = await this._collection
      .find<{id: string}>({}, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('Orga', {id}));
  }
}

@Type()
export class OrgaMutation {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

  async create(name: string): Promise<Orga> {
    return this._typer('Orga', {id: 'foo'});
  }
}

@Grapp({
  types: [Orga, OrgaQuery, OrgaMutation],
  schema: `
    type Orga {
      id: ID!
      name: String!
      managers: [OrgaUser]!
      users: [OrgaUser]!
      tokenPurchases: [TokenPurchase]!
      tokenTasks: [TokenTask]!
    }

    type OrgaQuery {
      get(id: ID!): Orga
      list: [Orga]!
    }

    type OrgaMutation {
      create(name: String!): Orga
    }

    type Query {
      Orga: OrgaQuery
    }

    type Mutation {
      Orga: OrgaMutation
    }
  `
})
export class OrgaGrapp { }
