/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
// eslint-disable-next-line camelcase
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<custom-style>
  <style>
    
    /*
     Polymer includes a shim for CSS Custom Properties that we can use for application theming.
     Below, you'll find the default palette for the Polymer Starter Kit layout. Feel free to play
     with changing the colors used or generate your own palette of colours at MaterialPalette.com.
  
     See https://www.polymer-project.org/1.0/docs/devguide/styling.html#xscope-styling-details
     for further information on custom CSS properties.
     */

    /* Application theme */

    html {
      --primary-color: var(--paper-indigo-700);
      --light-primary-color: var(--paper-indigo-500);
      --dark-primary-color: var(--paper-indigo-700);
      --text-primary-color: #ffffff; /*text/icons*/
      --accent-color: var(--paper-pink-a200);
      --light-accent-color: var(--paper-pink-a100);
      --dark-accent-color: var(--paper-pink-a400);
      --primary-background-color: #ffffff;
      --primary-text-color: var(--paper-grey-900);
      --secondary-text-color: #737373;
      --disabled-text-color: #9b9b9b;
      --divider-color: #dbdbdb;
      /* indigo-100 50% opacity */
      --selected-color: rgba(197, 202, 233, .5);

      /* Components */

      --setting-item-color: var(--paper-teal-700);

      /* app-drawer */
      --drawer-menu-color: #fff;
      --drawer-border-color: 1px solid #ccc;
      --drawer-toolbar-border-color: 1px solid rgba(0, 0, 0, 0.22);

      /* paper-listbox */
      --paper-listbox-background-color: #fff;
      --menu-link-color: #111111;

      /* paper-dialog */
      --paper-dialog-background-color: #fff;

      /* paper-slider */
      --paper-slider-active-color: var(--setting-item-color);
      --paper-slider-secondary-color: var(--setting-item-color);
      --paper-slider-knob-color: var(--setting-item-color);
      --paper-slider-pin-color: var(--setting-item-color);
      --paper-slider-knob-start-color: var(--setting-item-color);
      --paper-slider-knob-start-border-color: transparent;
      --paper-slider-pin-start-color: var(--setting-item-color);

      /* paper-input */
      --paper-input-container-focus-color: var(--setting-item-color);;

      /* paper-checkbox */
      --paper-checkbox-checked-color: var(--setting-item-color);;

    }

    /* General styles */

    paper-listbox iron-icon {
      margin-right: 20px;
      opacity: 0.54;
    }

    paper-listbox paper-item {
      --paper-item: {
        color: var(--menu-link-color);
        text-rendering: optimizeLegibility;
        cursor: pointer;
      };
    }

  </style>
</custom-style>`;

document.head.appendChild($_documentContainer.content);