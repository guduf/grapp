import { Data, DataArray } from '../../../dist/index';
export type UserGroup = 'mediafix'|'orga';

export class User {
  @Data.shortid({req: true, inp: false, upd: false})
  id: string
  @Data.email({req: true, inp: true, upd: false})
  email: string
  @Data.string({req: true, inp: true, upd: true})
  firstName: string
  @Data.string({req: true, inp: true, upd: true})
  lastName: string
  @Data.string({req: true, inp: false, upd: false})
  group: UserGroup
  @Data.string({req: false, inp: false, upd: false})
  lastConnection: Date
}
