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
    Cu = Components.utils,
    PREFNAME = "currentVersion",
    THISVERSION = "1.5",
    COMPAREVERSION = "1.0",
    WELCOMEURL = "chrome://savedpasswordeditor/content/welcome.xhtml",
    WELCOMEURL_SM = "chrome://savedpasswordeditor/content/welcome_sm.xhtml";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
         getService(Ci.nsIWindowMediator);
var prefs = Cc["@mozilla.org/preferences-service;1"].
              getService(Ci.nsIPrefService).
              getBranch("extensions.savedpasswordeditor.");

function SavedPasswordEditorStartup () {}

SavedPasswordEditorStartup.prototype = {
  classDescription:  "Saved Password Editor Startup",
  classID:           Components.ID("{bbfefd70-d9a5-4419-bc83-fc2686ad3026}"),
  contractID:        "@daniel.dawson/savedpasswordeditor-startup;1",
  _xpcom_categories: [{ category: "app-startup", service: true }],
  QueryInterface:    XPCOMUtils.generateQI([
                       Ci.nsISavedPasswordEditorStartup,
                       Ci.nsIObserver]),

  welcome: function () {
    var appId = Cc["@mozilla.org/xre/app-info;1"].
                getService(Ci.nsIXULAppInfo).ID;

    if (appId == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}"
        || appId == "{a463f10c-3994-11da-9945-000d60ca027b}") {
      // Firefox/Flock
      var curWin = wm.getMostRecentWindow("navigator:browser");
      curWin.gBrowser.selectedTab = curWin.gBrowser.addTab(WELCOMEURL);
    } else if (appId == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") {
      // SeaMonkey
      var curWin = wm.getMostRecentWindow("navigator:browser");

      if (!curWin) {
        var cmdLine = {
          handleFlagWithParam: function (flag, caseSensitive) {
            return flag == "browser" ? WELCOMEURL_SM : null;
          },
          handleFlag: function (flag, caseSensitive) {
            return false;
          },
          preventDefault: true
        };

        const clh_prefix = 
          "@mozilla.org/commandlinehandler/general-startup;1";
        Cc[clh_prefix + "?type=browser"].
          getService(Ci.nsICommandLineHandler).handle(cmdLine);
      } else
        curWin.gBrowser.selectedTab = curWin.gBrowser.addTab(WELCOMEURL_SM);
    } else if (appId == "{3550f703-e582-4d05-9a08-453d09bdfdc6}") {
      // Thunderbird
      var curWin = wm.getMostRecentWindow("mail:3pane");
      curWin.focus()
      curWin.document.getElementById("tabmail").openTab(
        "contentTab", { contentPage: WELCOMEURL });
    }
  },

  check_version: function () {
    var comp = this;

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

    function set_welcome() {
      this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      timer.initWithCallback ({
        notify: function (timer) {
          comp.welcome();
          delete this.timer;
        }}, 3000, Ci.nsITimer.TYPE_ONE_SHOT);
    }

    if (prefs.prefHasUserValue(PREFNAME)) {
      var lastVersion = prefs.getCharPref(PREFNAME);
      if (isOlder(lastVersion, COMPAREVERSION))
        set_welcome();
      if (isOlder(lastVersion, THISVERSION))
        prefs.setCharPref(PREFNAME, THISVERSION);
    } else {
      set_welcome();
      prefs.setCharPref(PREFNAME, THISVERSION);
    }
  },

  observe: function (aSubject, aTopic, aData) {
    var os = Cc["@mozilla.org/observer-service;1"].
             getService(Ci.nsIObserverService);
    var comp = this;
    switch (aTopic) {
    case "app-startup":
      os.addObserver(this, "final-ui-startup", false);
      break;

    case "final-ui-startup":
      os.removeObserver(this, "final-ui-startup");
      this.check_version();
      break;
    }
  },
};

function NSGetModule (compMgr, fileSpec) {
  return XPCOMUtils.generateModule([SavedPasswordEditorStartup]);
}
