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

window.addEventListener(
  "load",
  function loadHandler (ev) {
    spEditor.strBundle = document.getElementById("savedpwdedit-stringbundle");
    if (spEditor.prefs.getIntPref("clonebutton") != 1)
      document.getElementById("cloneSignon").hidden = true;
    window.removeEventListener("load", loadHandler, false);
  },
  false);

document.getElementById("signonsTree").addEventListener(
  "select",
  function (ev) {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length == 1 && !gSelectUserInUse) {
      document.getElementById("cloneSignon").disabled = false;
      document.getElementById("editSignon").disabled = false;
    } else {
      document.getElementById("cloneSignon").disabled = true;
      document.getElementById("editSignon").disabled = true;
    }
  },
  false);

const spEditor = {
  strBundle: null,
  prefs: Components.classes["@mozilla.org/preferences-service;1"].
         getService(Components.interfaces.nsIPrefService).
         getBranch("extensions.savedpasswordeditor."),

  login: function () {
    if (this.prefs.getBoolPref("always_login")) {
      var token = Components.classes["@mozilla.org/security/pk11tokendb;1"].
                    createInstance(Components.interfaces.nsIPK11TokenDB).
                    getInternalKeyToken();
      if (!token.checkPassword("")) {
        try {
          token.login(true);
        } catch (e) { }
        return token.isLoggedIn();
      }
    }
    return true;
  },

  editSignon: function () {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length != 1) return;
    if (!this.login()) return;
    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var signon = table[selections[0]];
    var ret = { newSignon: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal,resizable",
      signon, false, ret);
    if (!ret.newSignon) return;
    passwordmanager.modifyLogin(signon, ret.newSignon);
    LoadSignons();
  },

  cloneSignon: function () {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length != 1) return;
    if (!this.login()) return;
    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var signon = table[selections[0]];
    var ret = { newSignon: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal,resizable",
      signon, true, ret);
    if (!ret.newSignon) return;
    try {
      passwordmanager.addLogin(ret.newSignon);
      LoadSignons();
    } catch (e) {
      Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Components.interfaces.nsIPromptService).
        alert(window, this.strBundle.getString("error"),
              this.strBundle.getFormattedString("badnewentry", [e.message]));
    }
  },

  newSignon: function () {
    if (this.prefs.getIntPref("clonebutton") == 2) {
      var selections = GetTreeSelections(signonsTree);
      if (selections.length == 1) {
        this.cloneSignon();
        return;
      }
    }

    var ret = { newSignon: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal,resizable",
      null, false, ret);
    if (!ret.newSignon) return;
    try {
      passwordmanager.addLogin(ret.newSignon);
      LoadSignons();
    } catch (e) {
      Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Components.interfaces.nsIPromptService).
        alert(window, this.strBundle.getString("error"),
              this.strBundle.getFormattedString("badnewentry", [e.message]));
    }
  },
}
