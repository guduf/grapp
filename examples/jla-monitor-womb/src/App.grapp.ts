import { Grapp } from '../../../lib';

import { Member } from './Member.doc';

@Grapp({
  imports: [Member]
})
export class AppGrapp { }
