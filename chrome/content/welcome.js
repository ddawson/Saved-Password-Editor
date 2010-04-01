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

const Cc = Components.classes, Ci = Components.interfaces;

window.addEventListener(
  "load",
  function loadHandler (ev) {
    function openSecPane () {
      var chromeWin = Cc["@mozilla.org/appshell/window-mediator;1"].
                        getService(Ci.nsIWindowMediator).
                        getMostRecentWindow("navigator:browser");
      return chromeWin.openPreferences("paneSecurity");
    }

    function openPwdPane () {
      var chromeWin = Cc["@mozilla.org/appshell/window-mediator;1"].
                        getService(Ci.nsIWindowMediator).
                        getMostRecentWindow("navigator:browser");
      chromeWin.goPreferences("passwords_pane");
    }

    function el (name) {
      return document.getElementById(name);
    }

    var appId = Cc["@mozilla.org/xre/app-info;1"].
                  getService(Ci.nsIXULAppInfo).ID;
    var appType =
      (appId == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}"          // Firefox
       || appId == "{a463f10c-3994-11da-9945-000d60ca027b}") ? 0  // Flock
                                                             : 1; // SeaMonkey
    el("addonlink").setAttribute(
      "href", "https://addons.mozilla.org/firefox/addon/60265/");
    if (appType == 0) {
      el("security").setAttribute("href", "javascript:void(0);");
      el("security").addEventListener(
        "click", function (ev) { openSecPane() }, false);
    } else {
      el("passwords").setAttribute("href", "javascript:void(0);");
      el("passwords").addEventListener(
        "click", function (ev) { openPwdPane(); }, false);
    }
    el("appname").textContent = Application.name;
    window.removeEventListener("load", loadHandler, false);
  },
  false);
