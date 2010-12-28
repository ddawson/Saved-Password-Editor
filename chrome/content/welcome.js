/*
    Saved Password Editor, extension for Firefox 3.0+
    Copyright (C) 2010  Daniel Dawson <ddawson@icehouse.net>

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

const Cc = Components.classes,
      Ci = Components.interfaces,
      SEAMONKEY = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}",
      THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

window.addEventListener(
  "load",
  function loadHandler (ev) {
    var appId;

    function openSecPane () {
      var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
                 getService(Ci.nsIWindowMediator);
      if (appId == THUNDERBIRD)
          wm.getMostRecentWindow("mail:3pane").
            openOptionsDialog("paneSecurity");
      else
          wm.getMostRecentWindow("navigator:browser").
            openPreferences("paneSecurity");
    }

    function openPwdPane () {
      var chromeWin = Cc["@mozilla.org/appshell/window-mediator;1"].
                        getService(Ci.nsIWindowMediator).
                        getMostRecentWindow("navigator:browser");
      chromeWin.goPreferences("passwords_pane");
    }

    function el (name) document.getElementById(name);

    appId = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).ID;
    var appType = (appId == SEAMONKEY) ? 1 : 0;
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
      "href", "https://addons.mozilla.org/" + appName + "/addon/60265/");

    if (appType == 0) {
      //el("security").setAttribute("href", "javascript:void(0);");
      //el("security").addEventListener(
      //  "click", function (ev) { openSecPane() }, false);
    } else {
      //el("passwords").setAttribute("href", "javascript:void(0);");
      //el("passwords").addEventListener(
      //  "click", function (ev) { openPwdPane(); }, false);
    }
    el("appname").textContent = Application.name;
    window.removeEventListener("load", loadHandler, false);
  },
  false);
