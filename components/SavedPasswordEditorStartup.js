/*
    Saved Password Editor, extension for Firefox 3.5+
    Copyright (C) 2011  Daniel Dawson <ddawson@icehouse.net>

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
    FIREFOX = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}",
    FLOCK = "{a463f10c-3994-11da-9945-000d60ca027b}",
    SEAMONKEY = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}",
    THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
    SPICEBIRD = "{ee53ece0-255c-4cc6-8a7e-81a8b6e5ba2c}",
    PREFNAME = "currentVersion",
    THISVERSION = "2.2.5",
    COMPAREVERSION = "2.0",
    CONTENT = "chrome://savedpasswordeditor/content/",
    WELCOMEURL = CONTENT + "welcome.xhtml",
    WELCOMEURL_SM = CONTENT + "welcome_sm.xhtml",
    prefs = Cc["@mozilla.org/preferences-service;1"].
      getService(Ci.nsIPrefService).
      getBranch("extensions.savedpasswordeditor."),
    os = Cc["@mozilla.org/observer-service;1"].
      getService(Ci.nsIObserverService),
    wm = Cc["@mozilla.org/appshell/window-mediator;1"].
      getService(Ci.nsIWindowMediator),
    vc = Cc["@mozilla.org/xpcom/version-comparator;1"].
      getService(Ci.nsIVersionComparator);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function SavedPasswordEditorStartup () {}

SavedPasswordEditorStartup.prototype = {
  classDescription:  "Saved Password Editor Startup",
  classID:           Components.ID("{bbfefd70-d9a5-4419-bc83-fc2686ad3026}"),
  contractID:        "@daniel.dawson/savedpasswordeditor-startup;1",
  _xpcom_categories: [{ category: "app-startup", service: true }],
  QueryInterface:    XPCOMUtils.generateQI([Ci.nsIObserver]),

  observe: function (aSubject, aTopic, aData) {
    switch (aTopic) {
    case "app-startup":
    case "profile-after-change":
      os.addObserver(this, "final-ui-startup", false);
      break;

    case "final-ui-startup":
      os.removeObserver(this, "final-ui-startup");
      this.check_version();
      break;

    case "timer-callback":
      this.welcome();
      delete this.timer;
      break;
    }
  },

  check_version: function () {
    function set_welcome (comp) {
      var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      timer.init(comp, 3500, Ci.nsITimer.TYPE_ONE_SHOT);
      comp.timer = timer;
    }

    if (prefs.prefHasUserValue(PREFNAME)) {
      var lastVersion = prefs.getCharPref(PREFNAME);
      if (vc.compare(lastVersion, COMPAREVERSION) < 0)
        set_welcome(this);
      if (vc.compare(lastVersion, THISVERSION) < 0)
        prefs.setCharPref(PREFNAME, THISVERSION);
    } else {
      set_welcome(this);
      prefs.setCharPref(PREFNAME, THISVERSION);
    }
  },

  welcome: function () {
    var appId = Cc["@mozilla.org/xre/app-info;1"].
                getService(Ci.nsIXULAppInfo).ID;

    switch (appId) {
    case FIREFOX:
    case FLOCK:
      var curWin = wm.getMostRecentWindow("navigator:browser");
      curWin.gBrowser.selectedTab = curWin.gBrowser.addTab(WELCOMEURL);
      break;

    case SEAMONKEY:
      var curWin = wm.getMostRecentWindow("navigator:browser");

      if (!curWin) {
        var cmdLine = {
          handleFlagWithParam: function (flag, caseSensitive)
            flag == "browser" ? WELCOMEURL_SM : null,
          handleFlag: function (flag, caseSensitive) false,
          preventDefault: true
        };

        const clh_prefix = 
          "@mozilla.org/commandlinehandler/general-startup;1";
        Cc[clh_prefix + "?type=browser"].
          getService(Ci.nsICommandLineHandler).handle(cmdLine);
      } else
        curWin.gBrowser.selectedTab = curWin.gBrowser.addTab(WELCOMEURL_SM);
      break;

    case THUNDERBIRD:
      var curWin = wm.getMostRecentWindow("mail:3pane");
      curWin.focus();
      curWin.document.getElementById("tabmail").openTab(
        "contentTab", { contentPage: WELCOMEURL });
      break;

    case SPICEBIRD:
      var curWin = wm.getMostRecentWindow("collab:main");
      curWin.focus();
      curWin.document.getElementById("tabcollab").openTab(
        "contentTab", { contentPage: WELCOMEURL });
      break;
    }
  },
};

if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory =
    XPCOMUtils.generateNSGetFactory([SavedPasswordEditorStartup]);
else
  var NSGetModule =
    XPCOMUtils.generateNSGetModule([SavedPasswordEditorStartup]);
