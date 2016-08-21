/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2016  Daniel Dawson <danielcdawson@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

const SEAMONKEY = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}",
      THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

Components.utils.import("resource://gre/modules/Services.jsm");

window.addEventListener(
  "load",
  function loadHandler (ev) {
    var appId;

    function openSecPane () {
      var wm = Services.wm;
      if (appId == THUNDERBIRD)
          wm.getMostRecentWindow("mail:3pane").
            openOptionsDialog("paneSecurity");
      else
          wm.getMostRecentWindow("navigator:browser").
            openPreferences("paneSecurity");
    }

    function openPwdPane () {
      var chromeWin = Services.wm.getMostRecentWindow("navigator:browser");
      chromeWin.goPreferences("passwords_pane");
    }

    function el (name) document.getElementById(name);

    appId = Services.appinfo.ID;
    var appName = "firefox";
    switch (appId) {
    case THUNDERBIRD:
      appName = "thunderbird";
      break;
    case SEAMONKEY:
      appName = "seamonkey";
      break;
    }
    el("addonlink").setAttribute(
      "href", "https://addons.mozilla.org/" + appName
              + "/addon/saved-password-editor/");
    el("appname").textContent = Services.appinfo.name;
    window.removeEventListener("load", loadHandler, false);
  },
  false);
