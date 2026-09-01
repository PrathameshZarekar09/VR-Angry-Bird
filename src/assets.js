/**
 * Shared Application Asset Manifest
 * Evaluated in runtime and editor JS realms.
 */
import { AssetType, defineAssets } from '@iwsdk/core';

const publicAssetUrl = (filePath) =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

export default defineAssets({
  'welcome-panel': {
    url: publicAssetUrl('ui/welcome.uikitml'),
    type: AssetType.UIKitML,
    name: 'Welcome Panel',
  },
});
