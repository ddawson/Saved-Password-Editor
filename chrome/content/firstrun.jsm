/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2012  Daniel Dawson <ddawson@icehouse.net>

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

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes,
      Ci = Components.interfaces,
      FIREFOX = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}",
      SEAMONKEY = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}",
      THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
      PREFNAME = "currentVersion",
      THISVERSION = "2.5pre1",
      COMPAREVERSION = "2.5pre1",
      CONTENT = "chrome://savedpasswordeditor/content/",
      WELCOMEURL = CONTENT + "welcome.xhtml",
      WELCOMEURL_SM = CONTENT + "welcome_sm.xhtml",
      prefs = Cc["@mozilla.org/preferences-service;1"].
        getService(Ci.nsIPrefService).
        getBranch("extensions.savedpasswordeditor."),
      wm = Cc["@mozilla.org/appshell/window-mediator;1"].
        getService(Ci.nsIWindowMediator),
      vc = Cc["@mozilla.org/xpcom/version-comparator;1"].
        getService(Ci.nsIVersionComparator);

var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

function welcome () {
  delete timer;
  var appId = Cc["@mozilla.org/xre/app-info;1"].
              getService(Ci.nsIXULAppInfo).ID;

  switch (appId) {
  case FIREFOX:
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
  }
}

function set_welcome () {
  timer.initWithCallback({ notify: function () { welcome(); } },
                         500, Ci.nsITimer.TYPE_ONE_SHOT);
}

if (prefs.prefHasUserValue(PREFNAME)) {
  let lastVersion = prefs.getCharPref(PREFNAME);
  if (vc.compare(lastVersion, COMPAREVERSION) < 0)
    set_welcome();
  if (vc.compare(lastVersion, THISVERSION) < 0)
    prefs.setCharPref(PREFNAME, THISVERSION);
} else {
  set_welcome();
  prefs.setCharPref(PREFNAME, THISVERSION);
}
