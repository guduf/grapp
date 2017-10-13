import {
  Data,
  Grapp,
  Collection,
  Payload,
  Typer,
  Doc,
  DocMutation,
  DocQuery
} from '../../../dist/index';

import { Orga } from './Orga';

@Doc()
export class TokenPurchase {
  private constructor(
    @Payload {id}: {id: string},
    @Typer private _typer: Typer
  ) { }

  @Data.shortid({req: true, inp: false, upd: false})
  id: string;
  @Data.shortid({req: true, inp: true, upd: false})
  orgaId: string;

  @Data.shortid({req: true, inp: true, upd: false})
  date: Date;
  @Data.shortid({req: true, inp: true, upd: false})
  amount: number;
  @Data.shortid({req: false, inp: true, upd: true})
  ref: String;

  async orga(): Promise<Orga> {
    const id = await this.orgaId;
    return this._typer<Orga>('Orga', {id});
  }
}

@DocQuery({docTarget: TokenPurchase})
export class TokenPurchaseQuery {
  constructor(
    @Collection private _collection: Collection,
    @Typer private _typer: Typer
  ) { }

  get({id}: { id: string }): TokenPurchase {
    return this._typer('TokenPurchase', {id});
  }
  async findByOrga(
    {orgaId}: { orgaId: string }
  ): Promise<TokenPurchase[]> {
    const ids: {id: string}[] = await this._collection
      .find<{ id: string }>({orgaId}, {id: true})
      .toArray();
    return ids.map(({id}) => this._typer('TokenPurchase', {id}));
  }
}

@DocMutation({docTarget: TokenPurchase})
export class TokenPurchaseMutation {
  create(): Promise<TokenPurchase> {
    throw new Error('Not implemented')
  }
}

@Grapp({
  types: [TokenPurchase, TokenPurchaseQuery, TokenPurchaseMutation],
  schema: `
    type TokenPurchase {
      id: ID!
      date: Date!
      amount: Int!
      ref: String

      orga: Orga!
    }

    input TokenPurchaseCandidate {
      amount: Int!
      date: String
      ref: String
    }

    type TokenPurchaseMutation {
      create(
        orgaId: ID!,
        candidate: TokenPurchaseCandidate!
      ): TokenPurchase!
    }

    type Mutation {
      TokenPurchase: TokenPurchaseMutation!
    }

    type TokenPurchaseQuery {
      get(id: ID!): TokenPurchase!
    }

    type Query {
      TokenPurchase: TokenPurchaseQuery!
    }
  `
})
export class TokenPurchaseGrapp { }
