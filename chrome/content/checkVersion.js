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

{
  let checkVersion = function () {
    const PREFNAME = "currentVersion",
            THISVERSION = "1.1.4",
            COMPAREVERSION = "1.0",
            Cc = Components.classes, Ci = Components.interfaces;
    var prefs = Cc["@mozilla.org/preferences-service;1"].
                  getService(Ci.nsIPrefService).
                  getBranch("extensions.savedpasswordeditor.");

    function isOlder (version, compareTo) {
      var vAnalysis = version.split(".");
      var ctAnalysis = compareTo.split(".");

      for (let i = 0; i < ctAnalysis.length; i++) {
        if (i == vAnalysis.length) return true;
        var vNum = Number(vAnalysis[i]), ctNum = Number(ctAnalysis[i]);
        if (isNaN(vNum) || i >= ctAnalysis.length || vNum < ctNum) {
          return true;
        }
        if (vNum > ctNum)  // Was a newer version?? Not going to deal with it!
          break;
      }
      return false;
    }

    function welcome () {
      if (Application.id == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}"
          || Application.id == "{a463f10c-3994-11da-9945-000d60ca027b}") {
        // Firefox/Flock
        var url = "chrome://savedpasswordeditor/content/welcome_fx.xhtml";
      } else {
        // SeaMonkey
        var url = "chrome://savedpasswordeditor/content/welcome_sm.xhtml";
      }

      gBrowser.selectedTab = gBrowser.addTab(url);
    }

    if (prefs.prefHasUserValue(PREFNAME)) {
      var lastVersion = prefs.getCharPref(PREFNAME);
      if (isOlder(lastVersion, COMPAREVERSION))
        welcome();
      if (isOlder(lastVersion, THISVERSION))
        prefs.setCharPref(PREFNAME, THISVERSION);
    } else {
      welcome();
      prefs.setCharPref(PREFNAME, THISVERSION);
    }
  };

  window.addEventListener(
    "load",
    function loadHandler (ev) {
      window.setTimeout(checkVersion, 1500);
      window.removeEventListener("load", loadHandler, false);
    },
    false);
}
