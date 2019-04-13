/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage items in storage
 */

import * as ChromeGA from './analytics.js';
import * as ChromeJSON from './json.js';
import * as ChromeMsg from './msg.js';
import './ex_handler.js';

declare var ChromePromise: any;

/**
 * Get a JSON parsed value from localStorage
 *
 * @param key - key to get value for
 * @param def - optional default value if key not found
 * @returns JSON object or string, null if key does not exist
 */
export function get(key: string, def: any = null) {
  const item = localStorage.getItem(key);
  let value = def;
  if (item !== null) {
    value = ChromeJSON.parse(item);
  }
  return value;
}

/**
 * Get integer value from localStorage
 *
 * @param key - key to get value for
 * @param def - optional value to return, if NaN
 * @returns value as integer, NaN on error
 */
export function getInt(key: string, def: number = null) {
  const item = localStorage.getItem(key);
  let value = parseInt(item, 10);
  if (Number.isNaN(value)) {
    value = (def === null) ? value : def;
    if (def === null) {
      ChromeGA.error(`NaN value for: ${key} equals ${item}`,
          'Storage.getInt');
    }
  }
  return value;
}

/**
 * Get boolean value from localStorage
 *
 * @param key - key to get value for
 * @param def - return value if key not found
 * @returns value as boolean, null if key does not exist
 */
export function getBool(key: string, def: boolean = null) {
  return get(key, def);
}

/**
 * JSON stringify and save a value to localStorage
 *
 * @param key - key to set value for
 * @param value - new value, if null remove item
 */
export function set(key: string, value: object | [] | string | number | boolean | null = null) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    const val = JSON.stringify(value);
    localStorage.setItem(key, val);
  }
}

/**
 * Save a value to localStorage only if there is enough room
 *
 * @param key - localStorage Key
 * @param value - value to save
 * @param keyBool - key to a boolean value that is true if the primary key has non-empty value
 * @returns true if value was set successfully
 */
export function safeSet(key: string, value: JSON, keyBool: string = null) {
  let ret = true;
  const oldValue = get(key);
  try {
    set(key, value);
  } catch (e) {
    ret = false;
    if (oldValue) {
      // revert to old value
      set(key, oldValue);
    }
    if (keyBool) {
      // revert to old value
      if (oldValue && oldValue.length) {
        set(keyBool, true);
      } else {
        set(keyBool, false);
      }
    }
    // notify listeners
    ChromeMsg.send(ChromeMsg.TYPE.STORAGE_EXCEEDED).catch(() => {});
  }
  return ret;
}

/**
 * Get a value from chrome.storage.local
 *
 * {@link  https://developer.chrome.com/apps/storage}
 *
 * @param key - data key
 * @param def - default value if not found
 * @returns Object or Array from storage, def if not found
 */
export async function asyncGet(key: string, def: object | [] = null) {
  let ret = null;
  const chromep = new ChromePromise();
  try {
    const res = await chromep.storage.local.get([key]);
    ret = res[key];
  } catch (err) {
    if (def) {
      ret = def;
    }
    // TODO handle error
  }

  if (ret === undefined) {
    // probably not in storage
    ret = def;
  }

  return ret;
}

/**
 * Save a value to chrome.storage.local only if there is enough room
 *
 * {@link  https://developer.chrome.com/apps/storage}
 *
 * @param key - data key
 * @param value - data value
 * @param keyBool - key to a boolean value that is true if the primary key has non-empty value
 * @returns true if value was set successfully
 */
export async function asyncSet(key: string, value: object | [], keyBool: string = null) {
  // TODO what about keyBool?
  let ret = true;
  const chromep = new ChromePromise();
  const obj = {
    [key]: value,
  };
  try {
    await chromep.storage.local.set(obj);
  } catch (err) {
    // notify listeners save failed
    ChromeMsg.send(ChromeMsg.TYPE.STORAGE_EXCEEDED).catch(() => {});
    ret = false;
  }
  return ret;
}
  // const oldValue = get(key);
  // try {
  //   set(key, value);
  // } catch (e) {
  //   ret = false;
  //   if (oldValue) {
  //     // revert to old value
  //     set(key, oldValue);
  //   }
  //   if (keyBool) {
  //     // revert to old value
  //     if (oldValue && oldValue.length) {
  //       set(keyBool, true);
  //     } else {
  //       set(keyBool, false);
  //     }
  //   }
  //   // notify listeners
  //   ChromeMsg.send(ChromeMsg.TYPE.STORAGE_EXCEEDED).catch(() => {});
// }

// return ret;

