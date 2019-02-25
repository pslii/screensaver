/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '/scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage the current user
 * @namespace User
 */

/**
 * Determine if Chrome is signed in
 * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
 * @returns {Promise<boolean>} true if signed in to Chrome
 * @memberOf User
 */
export function isSignedInToChrome() {
  const chromep = new ChromePromise();
  let ret = true;
  // try to get a token and check failure message
  return chromep.identity.getAuthToken({interactive: false}).then((token) => {
    return Promise.resolve(ret);
  }).catch((err) => {
    if (err.message.match(/not signed in/)) {
      ret = false;
    }
    return Promise.resolve(ret);
  });
}

/**
 * Event: Fired when signin state changes for an act. on the user's profile.
 * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
 * @param {Object} account - chrome AccountInfo
 * @param {boolean} signedIn - true if signedIn
 * @private
 * @memberOf User
 */
function _onSignInChanged(account, signedIn) {
  Chrome.Storage.set('signedInToChrome', signedIn);
  if (!signedIn) {
    Chrome.GA.event(app.GA.EVENT.CHROME_SIGN_OUT);
    Chrome.Storage.set('albumSelections', []);
    const type = Chrome.Storage.getBool('permPicasa');
    if (type === 'allowed') {
      Chrome.Log.error(Chrome.Locale.localize('err_chrome_signout'));
    }
  }
}

/**
 * Event: called when document and resources are loaded<br />
 * @private
 * @memberOf User
 */
function _onLoad() {
  /**
   * Listen for changes to Browser sign-in
   */
  chrome.identity.onSignInChanged.addListener(_onSignInChanged);

}

// listen for documents and resources loaded
window.addEventListener('load', _onLoad);
