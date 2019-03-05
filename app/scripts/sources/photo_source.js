/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * A photo from a {@link module:PhotoSource}
 * This is the photo information that is persisted.
 *
 * @typedef {{}} module:PhotoSource.Photo
 * @property {string} url - The url to the photo
 * @property {string} author - The photographer
 * @property {number} asp - The aspect ratio of the photo
 * @property {Object} [ex] - Additional information about the photo
 * @property {string} [point] - geolocation 'lat lon'
 */

/**
 * The photos for a {@link module:PhotoSource}
 *
 * @typedef {{}} module:PhotoSource.Photos
 * @property {string} type - type of {@link module:PhotoSource}
 * @property {module:PhotoSource.Photo[]} photos - The photos
 */

/**
 * A potential source of photos for the screen saver
 * @module PhotoSource
 */
export default class PhotoSource {

  /**
   * Create a new photo source
   * @param {string} useKey - The key for if the source is selected
   * @param {string} photosKey - The key for the collection of photos
   * @param {string} type - A descriptor of the photo source
   * @param {string} desc - A human readable description of the source
   * @param {boolean} isDaily - Should the source be updated daily
   * @param {boolean} isArray - Is the source an Array of photo Arrays
   * @param {?Object} [loadArg=null] - optional arg for load function
   * @constructor
   */
  constructor(useKey, photosKey, type, desc, isDaily, isArray,
              loadArg = null) {
    this._useKey = useKey;
    this._photosKey = photosKey;
    this._type = type;
    this._desc = desc;
    this._isDaily = isDaily;
    this._isArray = isArray;
    this._loadArg = loadArg;
  }

  /**
   * Add a {@link module:PhotoSource.Photo} to an existing Array
   * @param {Array} photos - {@link module:PhotoSource.Photo} Array
   * @param {string} url - The url to the photo
   * @param {string} author - The photographer
   * @param {number} asp - The aspect ratio of the photo
   * @param {Object} [ex] - Additional information about the photo
   * @param {string} [point=''] - 'lat lon'
   */
  static addPhoto(photos, url, author, asp, ex, point = '') {
    /** @type {module:PhotoSource.Photo} */
    const photo = {
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
   * @param {number} lat - latitude
   * @param {number} lon - longitude
   * @returns {string} 'lat lon'
   */
  static createPoint(lat, lon) {
    if ((typeof lat === 'number') && (typeof lon === 'number')) {
      return `${lat.toFixed(6)} ${lon.toFixed(6)}`;
    } else {
      return `${lat} ${lon}`;
    }
  }

  /**
   * Fetch the photos for this source - override
   * @abstract
   * @returns {Promise<Object>} could be array of photos or albums
   */
  fetchPhotos() {
  }

  /**
   * Get if the source type
   * @returns {string} the source type
   */
  getType() {
    return this._type;
  }

  /**
   * Get if we should update daily
   * @returns {boolean} if true, update daily
   */
  isDaily() {
    return this._isDaily;
  }

  /**
   * Get the photos from local storage
   * @returns {module:PhotoSource.Photos} the photos
   */
  getPhotos() {
    let ret = {
      type: this._type,
      photos: [],
    };
    if (this.use()) {
      let photos = [];
      if (this._isArray) {
        let items = Chrome.Storage.get(this._photosKey);
        // could be that items have not been retrieved yet
        items = items || [];
        for (const item of items) {
          photos = photos.concat(item.photos);
        }
      } else {
        photos = Chrome.Storage.get(this._photosKey);
        // could be that items have not been retrieved yet
        photos = photos || [];
      }
      ret.photos = photos;
    }
    return ret;
  }

  /**
   * Determine if this source has been selected for display
   * @returns {boolean} true if selected
   */
  use() {
    return Chrome.Storage.getBool(this._useKey);
  }

  /**
   * Process the photo source.
   * @returns {Promise<void>} void
   */
  process() {
    if (this.use()) {
      return this.fetchPhotos().then((photos) => {
        const errMess = this._savePhotos(photos);
        if (!ChromeUtils.isWhiteSpace(errMess)) {
          return Promise.reject(new Error(errMess));
        }
        return Promise.resolve();
      }).catch((err) => {
        let title = Chrome.Locale.localize('err_photo_source_title');
        title += `: ${this._desc}`;
        ChromeLog.error(err.message, 'PhotoSource.process', title,
            `source: ${this._useKey}`);
        return Promise.reject(err);
      });
    } else {
      // hack so we don't delete album selections when Google Photos
      // page is disabled
      const useGoogle = Chrome.Storage.getBool('useGoogle');
      if (!((this._photosKey === 'albumSelections') && !useGoogle)) {
        localStorage.removeItem(this._photosKey);
      }
      return Promise.resolve();
    }
  }

  /**
   * Save the photos to localStorage in a safe manner
   * @param {Object} photos - could be array of photos or albums
   * - {@link module:PhotoSource.Photo} Array
   * @returns {?string} non-null on error
   * @private
   */
  _savePhotos(photos) {
    let ret = null;
    const keyBool = this._useKey;
    if (photos && photos.length) {
      const set = Chrome.Storage.safeSet(this._photosKey, photos, keyBool);
      if (!set) {
        ret = 'Exceeded storage capacity.';
      }
    }
    return ret;
  }
}
