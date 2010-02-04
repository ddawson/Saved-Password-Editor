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
    window.removeEventListener("load", loadHandler, false);
  },
  false);

/*
window.addEventListener(
  "unload",
  function unloadHandler (ev) {
    const Cc = Components.classes, Ci = Components.interfaces;

    var mpSlot = Cc["@mozilla.org/security/pkcs11moduledb;1"].
                   getService(Ci.nsIPKCS11ModuleDB).findSlotByName("");
    if (mpSlot) {
      let status = mpSlot.status;
      if (status != Ci.nsIPKCS11ModuleDB.SLOT_UNINITIALIZED &&
            status != Ci.nsIPKCS11ModuleDB.SLOT_READY) {
        switch (spEditor.prefs.getIntPref("logout_on_close")) {
        case 2:
          let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].
            getService(Ci.nsIPromptService);
          var check = { value: false };
          var answer =
            ps.confirmEx(window, spEditor.strBundle.getString("logout"),
                         spEditor.strBundle.getString("logoutquestion"),
                         ps.BUTTON_POS_0*ps.BUTTON_TITLE_YES +
                           ps.BUTTON_POS_1*ps.BUTTON_TITLE_NO +
                           ps.BUTTON_POS_0_DEFAULT,
                         null, null, null,
                         spEditor.strBundle.getString("dontaskmeagain"),
                         check);
          answer = answer == 0 ? true : false;
          if (check.value)
            spEditor.prefs.setIntPref("logout_on_close", answer ? 1 : 0);
          if (!answer) return;

        // Fall through
        case 1:
          Cc["@mozilla.org/security/pk11tokendb;1"].
            createInstance(Ci.nsIPK11TokenDB).getInternalKeyToken().
            logoutAndDropAuthenticatedResources();
          break;
        }
      }
    }
    window.removeEventListener("unload", unloadHandler, false);
  },
  false);
*/

document.getElementById("signonsTree").addEventListener(
  "select",
  function (ev) {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length == 1 && !gSelectUserInUse)
      document.getElementById("editSignon").disabled = false;
    else
      document.getElementById("editSignon").disabled = true;
  },
  false);

const spEditor = {
  strBundle: null,
  prefs: Components.classes["@mozilla.org/preferences-service;1"].
         getService(Components.interfaces.nsIPrefService).
         getBranch("extensions.savedpasswordeditor."),

  editSignon: function () {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length != 1) return;

    if (this.prefs.getBoolPref("always_login")) {
      var token = Components.classes["@mozilla.org/security/pk11tokendb;1"].
                    createInstance(Components.interfaces.nsIPK11TokenDB).
                    getInternalKeyToken();
      if (!token.checkPassword("")) {
        try {
          token.login(true);
        } catch (e) { }
      }
      if (!token.isLoggedIn()) return;
    }

    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var signon = table[selections[0]];
    var ret = { newSignon: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal", signon, ret);
    if (!ret.newSignon) return;
    passwordmanager.modifyLogin(signon, ret.newSignon);
    LoadSignons();
  },

  newSignon: function () {
    var ret = { newSignon: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal", null, ret);
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
