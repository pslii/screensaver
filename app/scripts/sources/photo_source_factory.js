/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import CCSource from './photo_source_chromecast.js';
import FlickrSource from './photo_source_flickr.js';
import GoogleSource from './photo_source_google.js';
import RedditSource from './photo_source_reddit.js';
import * as PhotoSources from './photo_sources.js';

/**
 * Factory to create {@link module:PhotoSource} instances
 * @module PhotoSourceFactory
 */

/**
 * Factory Method to create a new {@link PhotoSource}
 * @param {string} useKey - {@link PhotoSource.UseKey}
 * @returns {?PhotoSource} a new PhotoSource or subclass
 */
export function create(useKey) {
  switch (useKey) {
    case PhotoSources.UseKey.ALBUMS_GOOGLE:
      return new GoogleSource(useKey, 'albumSelections', 'Google User',
          Chrome.Locale.localize('google_title_photos'),
          true, true, null);
    case PhotoSources.UseKey.PHOTOS_GOOGLE:
      // not implemented yet
      return new GoogleSource(useKey, 'googleImages', 'Google User',
          'NOT IMPLEMENTED',
          true, false, null);
    case PhotoSources.UseKey.CHROMECAST:
      return new CCSource(useKey, 'ccImages', 'Google',
          Chrome.Locale.localize('setting_chromecast'),
          false, false, null);
    case PhotoSources.UseKey.INT_FLICKR:
      return new FlickrSource(useKey, 'flickrInterestingImages',
          'flickr',
          Chrome.Locale.localize('setting_flickr_int'),
          true, false, false);
    case PhotoSources.UseKey.AUTHOR:
      // noinspection JSCheckFunctionSignatures
      return new FlickrSource(useKey, 'authorImages', 'flickr',
          Chrome.Locale.localize('setting_mine'),
          false, false, true);
    case PhotoSources.UseKey.SPACE_RED:
      return new RedditSource(useKey, 'spaceRedditImages', 'reddit',
          Chrome.Locale.localize('setting_reddit_space'),
          true, false, 'r/spaceporn/');
    case PhotoSources.UseKey.EARTH_RED:
      return new RedditSource(useKey, 'earthRedditImages', 'reddit',
          Chrome.Locale.localize('setting_reddit_earth'),
          true, false, 'r/EarthPorn/');
    case PhotoSources.UseKey.ANIMAL_RED:
      return new RedditSource(useKey, 'animalRedditImages', 'reddit',
          Chrome.Locale.localize('setting_reddit_animal'),
          true, false, 'r/animalporn/');
    default:
      ChromeLog.error(`Bad PhotoSource type: ${useKey}`,
          'PhotoSourceFactory.create');
      return null;
  }
}
