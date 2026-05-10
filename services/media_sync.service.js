import * as FileSystem from 'expo-file-system';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { getDb } from '../database/db';

/**
 * MediaSyncService
 * Handles downloading and caching of images (logos, signatures) from Firebase Storage.
 */
class MediaSyncService {
  /**
   * Syncs a remote file to local storage.
   * @param {string} storagePath Path in Firebase Storage (e.g., 'orgs/123/logo.png')
   * @param {string} type 'logo' | 'signature'
   * @param {string} id Unique identifier for the record
   */
  async syncMedia(storagePath, type, id) {
    if (!storagePath) return null;

    try {
      const fileName = storagePath.split('/').pop();
      const localUri = `${FileSystem.documentDirectory}${type}_${id}_${fileName}`;

      // Check if file already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      if (fileInfo.exists) {
        return localUri;
      }

      // If not, download from Firebase Storage
      console.log(`⬇️ Downloading media: ${storagePath}`);
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // Update local database path if needed
      await this.updateLocalPath(type, id, localUri);

      return localUri;
    } catch (error) {
      console.error(`❌ Error syncing media (${type}):`, error);
      return null;
    }
  }

  async updateLocalPath(type, id, localUri) {
    const sqlite = await getDb();
    if (type === 'logo') {
      await sqlite.runAsync(
        "UPDATE organizations SET logo_path = ? WHERE remote_id = ?",
        [localUri, id]
      );
    } else if (type === 'signature') {
      await sqlite.runAsync(
        "UPDATE clients SET signature_svg = ? WHERE remote_id = ?",
        [localUri, id]
      );
    }
  }
}

export const mediaSyncService = new MediaSyncService();
