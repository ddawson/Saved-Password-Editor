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

document.getElementById("signonsTree").addEventListener(
  "select",
  function () {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length == 1 && !gSelectUserInUse)
      document.getElementById("editSignon").disabled = false;
    else
      document.getElementById("editSignon").disabled = true;
  },
  false);

window.addEventListener(
  "load",
  function (ev) {
    spEditor.strBundle = document.getElementById("savedpwdedit-stringbundle");
  },
  false);

const spEditor = {
  strBundle: null,
  editSignon: function () {
    var selections = GetTreeSelections(signonsTree);
    if (selections.length != 1) return;
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
