/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * A source of photos for the screen saver
 */

import {ISelectedAlbum} from './photo_source_google';

import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;

/**
 * A photo from a {@link PhotoSource}
 * This is the photo information that is persisted.
 *
 * @property url - url of photo
 * @property author - photographer
 * @property asp - aspect ration
 * @property ex - extra info. about the photo
 * @property point - geolocation
 */
export interface IPhoto {
  url: string;
  author: string;
  asp: string;
  ex?: any;
  point?: string;
}

/**
 * The photos for a {@link PhotoSource}
 *
 * @property type - The type of PhotoSource
 * @property photos - The array of photos
 */
export interface IPhotos {
  type: string;
  photos: IPhoto[];
}


/**
 * A source of photos for the screen saver
 */
export abstract class PhotoSource {

  /**
   * Add a {@link IPhoto} to an existing Array
   *
   * @param photos - The array to add to
   * @param url - The url to the photo
   * @param author - The photographer
   * @param asp - The aspect ratio of the photo
   * @param ex - Additional information about the photo
   * @param point - An optional geolocation
   */
  public static addPhoto(photos: IPhoto[], url: string, author: string, asp: number, ex: any, point: string = '') {
    const photo: IPhoto = {
      url: url,
      author: author,
      asp: asp.toPrecision(3),
    };
    if (ex) {
      photo.ex = ex;
    }
    if (point && !ChromeUtils.isWhiteSpace(point)) {
      photo.point = point;
    }
    photos.push(photo);
  }

  /**
   * Create a geo point string from a latitude and longitude
   *
   * @param lat - latitude
   * @param lon - longitude
   * @returns 'lat lon'
   */
  public static createPoint(lat: number, lon: number) {
    if ((typeof lat === 'number') && (typeof lon === 'number')) {
      return `${lat.toFixed(6)} ${lon.toFixed(6)}`;
    } else {
      return `${lat} ${lon}`;
    }
  }

  private readonly _useKey: string;
  private readonly _photosKey: string;
  private readonly _type: string;
  private readonly _desc: string;
  private readonly _isDaily: boolean;
  private readonly _isArray: boolean;
  private readonly _loadArg: any;

  /**
   * Create a new photo source
   *
   * @param useKey - The key for if the source is selected
   * @param photosKey - The key for the collection of photos
   * @param type - A descriptor of the photo source
   * @param desc - A human readable description of the source
   * @param isDaily - Should the source be updated daily
   * @param isArray - Is the source an Array of photo Arrays
   * @param loadArg - optional arg for load function
   */
  protected constructor(useKey: string, photosKey: string, type: string,
                        desc: string, isDaily: boolean, isArray: boolean, loadArg: any = null) {
    this._useKey = useKey;
    this._photosKey = photosKey;
    this._type = type;
    this._desc = desc;
    this._isDaily = isDaily;
    this._isArray = isArray;
    this._loadArg = loadArg;
  }

  /**
   * Fetch the photos for this source
   *
   * @throws An error if fetch failed
   * @returns Could be array of photos or albums
   */
  public abstract fetchPhotos(): Promise<IPhoto[] | ISelectedAlbum[]>;

  /**
   * Get the source type
   */
  public getType() {
    return this._type;
  }

  /**
   * Get if the photos key that is persisted
   */
  public getPhotosKey() {
    return this._photosKey;
  }

  /**
   * Get a human readable description
   */
  public getDesc() {
    return this._desc;
  }

  /**
   * Get use key name
   */
  public getUseKey() {
    return this._useKey;
  }

  /**
   * Get use extra argument
   */
  public getLoadArg() {
    return this._loadArg;
  }

  /**
   * Get if we should update daily
   */
  public isDaily() {
    return this._isDaily;
  }

  /**
   * Get the photos from local storage
   */
  public async getPhotos() {
    const ret: IPhotos = {
      type: this._type,
      photos: [],
    };

    if (this.use()) {
      let photos: IPhoto[] = [];
      if (this._isArray) {
        let items = await ChromeStorage.asyncGet(this._photosKey);
        // could be that items have not been retrieved yet
        items = items || [];
        for (const item of items) {
          photos = photos.concat(item.photos);
        }
      } else {
        photos = await ChromeStorage.asyncGet(this._photosKey);
        // could be that items have not been retrieved yet
        photos = photos || [];
      }
      ret.photos = photos;
    }
    return Promise.resolve(ret);
  }

  /**
   * Determine if this source has been selected for display
   *
   * @returns true if selected
   */
  public use() {
    return ChromeStorage.getBool(this._useKey);
  }

  /**
   * Process the photo source.
   */
  public async process() {
    if (this.use()) {
      // add the source
      try {
        const photos = await this.fetchPhotos();
        const errMess = await this._save(photos);
        if (!ChromeUtils.isWhiteSpace(errMess)) {
          return Promise.reject(new Error(errMess));
        }
      } catch (err) {
        let title = ChromeLocale.localize('err_photo_source_title');
        title += `: ${this._desc}`;
        ChromeLog.error(err.message, 'PhotoSource.process', title,
            `source: ${this._useKey}`);
        return Promise.reject(err);
      }
    } else {
      // remove the source

      // HACK so we don't delete album or photos when Google Photos
      // page is disabled
      const useGoogle = ChromeStorage.getBool('useGoogle', true);
      let isGoogleKey = false;
      if ((this._photosKey === 'albumSelections') ||
          (this._photosKey === 'googleImages')) {
        isGoogleKey = true;
      }

      if (!(isGoogleKey && !useGoogle)) {
        try {
          const chromep = new ChromePromise();
          await chromep.storage.local.remove(this._photosKey);
        } catch (e) {
          // ignore
        }
      }
    }

    return Promise.resolve();
  }

  /**
   * Save the data to chrome.storage.local in a safe manner
   *
   * @param photos - could be array of photos or albums
   * @returns An error message if the save failed
   */
  private async _save(photos: IPhoto[] | ISelectedAlbum[]) {
    let ret = null;
    const keyBool = this._useKey;
    if (photos && photos.length) {
      const set =
          await ChromeStorage.asyncSet(this._photosKey, photos, keyBool);
      if (!set) {
        ret = 'Exceeded storage capacity.';
      }
    }
    return ret;
  }
}
