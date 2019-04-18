/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Controller for the screen saver
 */

import * as AppData from './data.js';

import * as MyMsg from '../../scripts/my_msg.js';

import * as ChromeGA from '../chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../chrome-extension-utils/scripts/storage.js';
import {ChromeTime} from '../chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from '../chrome-extension-utils/scripts/utils.js';

import '../chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * Screensaver URL
 */
const _SS_URL = '/html/screensaver.html';

/**
 * Error showing Screensaver
 */
const _ERR_SHOW = ChromeLocale.localize('err_show_ss');

/**
 * Determine if the screen saver can be displayed
 *
 * @returns true if should display the screensaver
 */
export function isActive() {
  const enabled = ChromeStorage.getBool('enabled');
  const keepAwake = ChromeStorage.getBool('keepAwake');
  const aStart = ChromeStorage.get('activeStart');
  const aStop = ChromeStorage.get('activeStop');
  const inRange = ChromeTime.isInRange(aStart, aStop);

  // do not display if screen saver is not enabled or
  // keepAwake scheduler is enabled and is in the inactive range
  return !(!enabled || (keepAwake && !inRange));
}

/**
 * Display the screensaver(s)
 *
 * @remarks
 *
 * Important: Always request screensaver through this call
 *
 * @param single - if true, only show on one display
 */
export async function display(single: boolean) {

  try {
    const all = ChromeStorage.getBool('allDisplays', AppData.DEFS.allDisplays);
    if (!single && all) {
      await openOnAllDisplays();
    } else {
      await open(null);
    }
  } catch (err) {
    ChromeLog.error(err.message, 'SSControl.display');
  }

  return Promise.resolve();
}

/**
 * Close all the screen saver windows
 */
export function close() {
  // send message to the screen savers to close themselves
  ChromeMsg.send(MyMsg.TYPE.SS_CLOSE).catch(() => {});
}

/**
 * Determine if there is a full screen chrome window running on a display
 *
 * @param disp - a connected display
 * @returns true if there is a full screen window on the display
 */
async function hasFullscreen(disp: chrome.system.display.DisplayInfo) {
  let ret = false;
  const fullScreen = ChromeStorage.getBool('chromeFullscreen', AppData.DEFS.chromeFullscreen);

  try {
    if (fullScreen) {
      // see if there is a Chrome window that is in full screen mode
      const wins = await chromep.windows.getAll({populate: false});
      const left = disp ? disp.bounds.left : 0;
      const top = disp ? disp.bounds.top : 0;
      for (const win of wins) {
        if ((win.state === 'fullscreen') && (!disp || (win.top === top && win.left === left))) {
          ret = true;
          break;
        }
      }
    }
  } catch (err) {
    ChromeGA.error(err.message, 'SSController.hasFullscreen');
  }

  return Promise.resolve(ret);
}

/**
 * Determine if a screensaver is currently showing
 *
 * @returns true if showing
 */
async function isShowing() {
  // send message to the screensaver's to see if any are around
  try {
    await ChromeMsg.send(MyMsg.TYPE.SS_IS_SHOWING);
    return Promise.resolve(true);
  } catch (err) {
    // no one listening
    return Promise.resolve(false);
  }
}

/**
 * Open a screen saver window on the given display
 *
 * @param disp - a connected display or null for the main display
 */
async function open(disp: chrome.system.display.DisplayInfo | null) {
  // window creation options
  const winOpts: chrome.windows.CreateData = {
    url: _SS_URL,
    type: 'popup',
  };

  try {
    const hasFullScreen = await hasFullscreen(disp);
    if (hasFullScreen) {
      // don't display if there is a fullscreen window
      return Promise.resolve();
    }

    if (!disp) {
      winOpts.state = 'fullscreen';
    } else {
      winOpts.left = disp.bounds.left;
      winOpts.top = disp.bounds.top;
      winOpts.width = disp.bounds.width;
      winOpts.height = disp.bounds.height;
    }

    const win = await chromep.windows.create(winOpts);
    if (win) {
      if (disp) {
        await chromep.windows.update(win.id, {state: 'fullscreen'});
      }
      await chromep.windows.update(win.id, {focused: true});
    }

  } catch (err) {
    ChromeLog.error(err.message, 'SSControl._open', _ERR_SHOW);
  }

  return Promise.resolve();
}

/**
 * Open a screensaver on every display
 */
async function openOnAllDisplays() {
  try {
    const displayArr = await chromep.system.display.getInfo();
    if (displayArr.length === 1) {
      await open(null);
    } else {
      for (const disp of displayArr) {
        await open(disp);
      }
    }
  } catch (err) {
    ChromeLog.error(err.message, 'SSControl.openOnAllDisplays', _ERR_SHOW);
  }

  return Promise.resolve();
}

/**
 * Event: Fired when the system changes to an active, idle or locked state.
 * The event fires with "locked" if the screen is locked or the [built in]
 * screensaver activates, "idle" if the system is unlocked and the user has not
 * generated any input for a specified number of seconds, and "active" when the
 * user generates input on an idle system.
 *
 * @link https://developer.chrome.com/extensions/idle#event-onStateChanged
 *
 * @param state - current state of computer
 */
async function _onIdleStateChanged(state: string) {
  try {
    const showing = await isShowing();
    if (state === 'idle') {
      if (isActive() && !showing) {
        await display(false);
      }
    } else if (state === 'locked') {
      // close on screen lock
      close();
    } else {
      const isWindows = await ChromeUtils.isWindows();
      if (!isWindows) {
        // Windows 10 Creators triggers an 'active' state
        // when the window is created, so we have to skip closing here.
        // Wouldn't need this at all if ChromeOS handled keyboard (or focus?)
        // right
        close();
      }
    }
  } catch (err) {
    ChromeGA.error(err.message, 'SSControl.isShowing');
  }
}

/**
 * Event: Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 *
 * @link https://developer.chrome.com/extensions/runtime#event-onMessage
 *
 * @param request - details for the message
 * @param sender MessageSender object
 * @param response - function to call once after processing
 * @returns true if asynchronous
 */
function onChromeMessage(request: ChromeMsg.IMsgType, sender: chrome.runtime.MessageSender,
                         response: (arg0: object) => void) {
  let ret = false;
  if (request.message === MyMsg.TYPE.SS_SHOW.message) {
    ret = true; // async
    // preview the screensaver
    display(false).catch(() => {});
  }
  return ret;
}

// listen for changes to the idle state of the computer
chrome.idle.onStateChanged.addListener(_onIdleStateChanged);

// listen for chrome messages
ChromeMsg.addListener(onChromeMessage);
