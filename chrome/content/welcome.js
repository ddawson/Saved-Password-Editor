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

    function el (name) {
      return document.getElementById(name);
    }

    el("addonlink").setAttribute(
      "href", "https://addons.mozilla.org/firefox/addon/60265/");
    el("security").setAttribute("href", "javascript:void(0);");
    el("security").addEventListener(
      "click", function (ev) { openSecPane() }, false);
    el("shortcut").setAttribute("href", "javascript:void(0);");
    el("shortcut").addEventListener(
      "click",
      function clickHandler (ev) {
        var win = openSecPane();
        win.addEventListener(
          "load",
          function loadHandler () {
            win.document.documentElement.currentPane.ownerDocument.defaultView.
              gSecurityPane.showPasswords();  // Jeez, that's a long path!
            win.removeEventListener("load", loadHandler, false);
          },
          false);
      },
      false);
    window.removeEventListener("load", loadHandler, false);
  },
  false);
