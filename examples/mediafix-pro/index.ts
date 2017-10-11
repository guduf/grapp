import { connect } from 'mongodb';

import { bootstrapGrapp, Grapp } from '../../dist/index';
import { OrgaGrapp } from './types/Orga';
import { OrgaUserGrapp } from './types/OrgaUser';
import { TokenPurchaseGrapp } from './types/TokenPurchase';
import { TokenTaskGrapp } from './types/TokenTask';

const MONGODB_ENDPOINT = 'mongodb://127.0.0.1:27017/grapp-mediafix-pro'

@Grapp({
  imports: [OrgaGrapp, OrgaUserGrapp, TokenPurchaseGrapp, TokenTaskGrapp]
})
class AppGrapp { }

export async function bootstrapApp() {
  const db = await connect(MONGODB_ENDPOINT);
  const schema = await bootstrapGrapp(AppGrapp, {db});
  console.log(`schema`, schema);
}

bootstrapApp().then(null, console.error);
