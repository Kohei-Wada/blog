import { localeFeed } from '../../utils/rss';

export async function GET(context) {
  return localeFeed('ja', context);
}
