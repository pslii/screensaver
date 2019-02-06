/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/paper-styles/typography.js';
import '@polymer/paper-styles/color.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-material/paper-material.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-item/paper-item-body.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { Locale } from
      '../../setting-elements/localize-behavior/localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

(function(window) {

  new ExceptionHandler();

  window.app = window.app || {};
  app.ErrorPageFactory = Polymer({
    _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>

      :host {
        display: block;
        position: relative;
      }

      .page-content {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }

      .page-toolbar {
        margin-bottom: 0;
      }

      .body-content {
        padding-top: 0;
      }

      #errorViewer {
        height: 82vh;
        @apply --paper-font-subhead;
        white-space: pre-wrap;
        overflow: hidden;
        overflow-y: scroll;
        padding: 16px;
        margin: 0;
      }

    </style>

    <paper-material elevation="1" class="page-content">
      <!-- Tool bar -->
      <paper-material elevation="1">
        <app-toolbar class="page-toolbar">
          <span class="space"></span>
          <div class="middle middle-container center horizontal layout flex">
            <div class="flex">[[_computeTitle(lastError)]]</div>
            <paper-icon-button id="email" icon="myicons:mail" on-tap="_onEmailTapped" disabled\$="[[!lastError.message]]">
            </paper-icon-button>
            <paper-tooltip for="email" position="left" offset="0">
              Send email to support
            </paper-tooltip>
            <paper-icon-button id="remove" icon="myicons:delete" on-tap="_onRemoveTapped" disabled\$="[[!lastError.message]]">
            </paper-icon-button>
            <paper-tooltip for="remove" position="left" offset="0">
              Delete the error
            </paper-tooltip>
          </div>
        </app-toolbar>
      </paper-material>
      <!-- Content -->
      <div class="body-content horizontal layout">
        <div id="errorViewer">
          <div class="error-text">[[lastError.message]]</div>
          <div class="error-text">[[_computeStack(lastError)]]</div>
        </div>
      </div>
    </paper-material>
`,

    is: 'error-page',

    behaviors: [
      Chrome.LocalizeBehavior,
    ],

    properties: {
      lastError: {
        type: Object,
        value: function() {
          return new Chrome.Storage.LastError();
        },
        notify: true,
      },
    },

    ready: function() {
      Chrome.Storage.getLastError().then((lastError) => {
        this.set('lastError', lastError);
        return Promise.resolve();
      }).catch((err) => {
        Chrome.GA.error(err.message, 'ErrorPage.ready');
      });
      chrome.storage.onChanged.addListener((changes) => {
        // listen for changes to lastError
        for (const key in changes) {
          if (changes.hasOwnProperty(key)) {
            if (key === 'lastError') {
              const change = changes[key];
              this.set('lastError', change.newValue);
              break;
            }
          }
        }
      });
    },

    /**
     * Event: Email support
     * @private
     */
    _onEmailTapped: function() {
      let body = app.Utils.getEmailBody();
      body = body + `${this.lastError.title}\n\n${this.lastError.message}\n\n` +
          `${this.lastError.stack}`;
      body = body + '\n\nPlease provide any additional info. ' +
          'on what led to the error.\n\n';

      const url = app.Utils.getEmailUrl('Last Error', body);
      Chrome.GA.event(Chrome.GA.EVENT.ICON, 'LastError email');
      chrome.tabs.create({ url: url });
    },

    /**
     * Event: Remove the error
     * @private
     */
    _onRemoveTapped: function() {
      Chrome.Storage.clearLastError();
      Chrome.GA.event(Chrome.GA.EVENT.ICON, 'LastError delete');
    },

    /**
     * Computed Binding
     * @param {Chrome.Storage.LastError} lastError - the error
     * @returns {string} stack trace
     * @private
     */
    _computeStack: function(lastError) {
      let ret = '';
      if (lastError.message) {
        ret += lastError.stack;
      }
      return ret;
    },

    /**
     * Computed Binding
     * @param {Chrome.Storage.LastError} lastError - the error
     * @returns {string} page title
     * @private
     */
    _computeTitle: function(lastError) {
      let ret = Locale.localize('last_error_viewer_title');
      if (lastError.message) {
        ret += ` - ${lastError.title}`;
      }
      return ret;
    },
  });
})(window);
