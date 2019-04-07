/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Google Analytics tracking
 * @module chrome/ga
 */

/**
 * Google Analytics Event
 * @typedef {{}} module:chrome/ga.Event
 * @property {string} eventCategory - category
 * @property {string} eventAction - action
 * @property {string} eventLabel - label
 */

import * as ChromeJSON from './json.js';
import * as ChromeUtils from './utils.js';

declare var ga: any;

export interface EventType {
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
}

/**
 * Event types
 * @type {{{module:chrome/ga.Event}}}
 * @property {module:chrome/ga.Event} INSTALLED - extension installed
 * @property {module:chrome/ga.Event} UPDATED - extension updated
 * @property {module:chrome/ga.Event} REFRESHED_AUTH_TOKEN - cached token refreshed
 * @property {module:chrome/ga.Event} ALARM - Chrome alarm triggered
 * @property {module:chrome/ga.Event} MENU - menu selected
 * @property {module:chrome/ga.Event} TOGGLE - setting-toggle
 * @property {module:chrome/ga.Event} LINK - setting-link
 * @property {module:chrome/ga.Event} TEXT - setting-text
 * @property {module:chrome/ga.Event} SLIDER_VALUE - setting-slider value
 * @property {module:chrome/ga.Event} SLIDER_UNITS - setting-slider unit
 * @property {module:chrome/ga.Event} BUTTON - button click
 * @property {module:chrome/ga.Event} ICON - toolbar icon click
 * @property {module:chrome/ga.Event} CHECK - checkbox click
 * @property {module:chrome/ga.Event} KEY_COMMAND - keyboard shortcut
 * @const
 */
export const EVENT = {
  INSTALLED: {
    eventCategory: 'extension',
    eventAction: 'installed',
    eventLabel: '',
  },
  UPDATED: {
    eventCategory: 'extension',
    eventAction: 'updated',
    eventLabel: '',
  },
  REFRESHED_AUTH_TOKEN: {
    eventCategory: 'user',
    eventAction: 'refreshedAuthToken',
    eventLabel: '',
  },
  ALARM: {
    eventCategory: 'alarm',
    eventAction: 'triggered',
    eventLabel: '',
  },
  MENU: {
    eventCategory: 'ui',
    eventAction: 'menuSelect',
    eventLabel: '',
  },
  TOGGLE: {
    eventCategory: 'ui',
    eventAction: 'toggle',
    eventLabel: '',
  },
  LINK: {
    eventCategory: 'ui',
    eventAction: 'linkSelect',
    eventLabel: '',
  },
  TEXT: {
    eventCategory: 'ui',
    eventAction: 'textChanged',
    eventLabel: '',
  },
  SLIDER_VALUE: {
    eventCategory: 'ui',
    eventAction: 'sliderValueChanged',
    eventLabel: '',
  },
  SLIDER_UNITS: {
    eventCategory: 'ui',
    eventAction: 'sliderUnitsChanged',
    eventLabel: '',
  },
  BUTTON: {
    eventCategory: 'ui',
    eventAction: 'buttonClicked',
    eventLabel: '',
  },
  RADIO_BUTTON: {
    eventCategory: 'ui',
    eventAction: 'radioButtonClicked',
    eventLabel: '',
  },
  ICON: {
    eventCategory: 'ui',
    eventAction: 'toolbarIconClicked',
    eventLabel: '',
  },
  CHECK: {
    eventCategory: 'ui',
    eventAction: 'checkBoxClicked',
    eventLabel: '',
  },
  KEY_COMMAND: {
    eventCategory: 'ui',
    eventAction: 'keyCommand',
    eventLabel: '',
  },
};

/**
 * Initialize analytics
 * @param {string} trackingId - tracking id
 * @param {string} appName - extension name
 * @param {string} appId - extension Id
 * @param {string} appVersion - extension version
 */
export function initialize(trackingId: string, appName: string , appId: string , appVersion: string) {
  // Standard Google Universal Analytics code
  // @ts-ignore
  (function(i, s, o, g, r, a, m) {
    // @ts-ignore
    i['GoogleAnalyticsObject'] = r; // tslint:disable-line no-string-literal
    // @ts-ignore
    i[r] = i[r] || function() {
      // @ts-ignore
      (i[r].q = i[r].q || []).push(arguments);
      // @ts-ignore
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, 'script',
      'https://www.google-analytics.com/analytics.js', 'ga');

  ga('create', trackingId, 'auto');
  // see: http://stackoverflow.com/a/22152353/1958200
  ga('set', 'checkProtocolTask', function() {
  });
  ga('set', 'appName', appName);
  ga('set', 'appId', appId);
  ga('set', 'appVersion', appVersion);
  ga('require', 'displayfeatures');
}

/**
 * Send a page
 * @param {string} url - page path
 */
export function page(url: string) {
  if (url) {
    if (!ChromeUtils.DEBUG) {
      ga('send', 'pageview', url);
    }
  }
}

/**
 * Send an event
 * @param {module:chrome/ga.Event} theEvent - the event type
 * @param {?string} [label=null] - override label
 * @param {?string} [action=null] - override action
 */
export function event(theEvent: EventType, label: string = null, action: string = null) {
  if (theEvent) {
    const ev = ChromeJSON.shallowCopy(theEvent);
    ev.hitType = 'event';
    ev.eventLabel = label ? label : ev.eventLabel;
    ev.eventAction = action ? action : ev.eventAction;
    if (!ChromeUtils.DEBUG) {
      ga('send', ev);
    } else {
      console.log(ev); // tslint:disable-line no-console
    }
  }
}

/**
 * Send an error
 * @param {?string} [label='unknown'] - override label
 * @param {?string} [action='unknownMethod'] - override action
 */
export function error(label = 'unknown', action = 'unknownMethod') {
  const ev = {
    hitType: 'event',
    eventCategory: 'error',
    eventAction: action,
    eventLabel: `Err: ${label}`,
  };
  if (!ChromeUtils.DEBUG) {
    ga('send', ev);
  } else {
    console.error(ev);
  }
}

/**
 * Send an exception
 * @param {Error} theError - the exception
 * @param {?string} [message=null] - the error message
 * @param {boolean} [fatal=true] - true if fatal
 */
export function exception(theError: Error, message: string = null, fatal = false) {
  try {
    let msg = 'Unknown';
    if (message) {
      msg = message;
    } else if (theError.message) {
      msg = theError.message;
    }
    if (theError.stack) {
      msg += `\n\n${theError.stack}`;
    }
    const ex = {
      hitType: 'exception',
      exDescription: msg,
      exFatal: fatal,
    };
    if (!ChromeUtils.DEBUG) {
      ga('send', ex);
    } else {
      console.error(ex);
    }
  } catch (err) {
    ChromeUtils.noop();
  }
}
