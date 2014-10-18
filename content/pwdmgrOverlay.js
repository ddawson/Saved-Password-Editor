/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2014  Daniel Dawson <danielcdawson@gmail.com>

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

document.addEventListener(
  "DOMContentLoaded",
  function dclHandler (ev) {
    spEditor.genStrBundle =
      document.getElementById("savedpwdedit-gen-stringbundle");
    spEditor.pmoStrBundle =
      document.getElementById("savedpwdedit-overlay-stringbundle");
    document.removeEventListener("DOMContentLoaded", dclHandler, false);
  },
  false);

window.addEventListener(
  "load",
  function (ev) {
    if (spEditor.prefs.getBoolPref("always_show_passwords")) {
      if (!spEditor.prefs.getBoolPref("force_prompt_for_masterPassword")
          || masterPasswordLogin(function () true)) {
        showingPasswords = true;
        document.getElementById("togglePasswords").label
          = kSignonBundle.getString("hidePasswords");
        document.getElementById("togglePasswords").accessKey
          = kSignonBundle.getString("hidePasswordsAccessKey");
        document.getElementById("passwordCol").hidden = false;
        _filterPasswords();
      }
    }

    if (spEditor.prefs.getBoolPref("preselect_current_site")) {
      let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
               getService(Components.interfaces.nsIWindowMediator);
      let brWin = wm.getMostRecentWindow("navigator:browser");

      if (brWin) {
        let loc = brWin.getBrowser().contentWindow.location;
        let hostname = loc.protocol + "//" + loc.host;
        let col = getColumnByName("hostname");
        for (let i = 0; i < signonsTreeView.rowCount; i++)
          if (signonsTreeView.getCellText(i, col) == hostname) {
            signonsTreeView.selection.select(i);
            setTimeout(function () {
                         signonsTree.treeBoxObject.ensureRowIsVisible(i);
                       }, 0);
            break;
          }
      }
    }

    var menuBtnAnon =
      document.getAnonymousNodes(document.getElementById("speMenuBtn"));
    var innerBtn = menuBtnAnon[1], dropMarker = menuBtnAnon[2];
    innerBtn.removeAttribute("class");
    dropMarker.removeAttribute("class");
    var innerBtnCS = getComputedStyle(innerBtn),
        dropMarkerStl = dropMarker.style;
    dropMarkerStl.marginTop = innerBtnCS.marginTop;
    dropMarkerStl.marginBottom = innerBtnCS.marginBottom;
  },
  false);

document.getElementById("signonsTree").addEventListener(
  "select",
  function (ev) {
    if (!spEditor.selectionsEnabled) return;
    var selections = GetTreeSelections(signonsTree);
    if (selections.length > 0
        && (!window.hasOwnProperty("gSelectUserInUse") || !gSelectUserInUse)) {
      document.getElementById("key_editSignon").removeAttribute("disabled");
      document.getElementById("edit_signon").removeAttribute("disabled");
      document.getElementById("speMenuBtn_editSignon").
        removeAttribute("disabled");
      if (!spEditor.userChangedMenuBtn) {
        document.getElementById("speMenuBtn").command = "edit_signon";
        document.getElementById("speMenuBtn").
          setAttribute("icon", "properties");
      }
    } else {
      document.getElementById("speMenuBtn").command = "new_signon";
      document.getElementById("speMenuBtn").
        setAttribute("icon", "add");
      document.getElementById("key_editSignon").
        setAttribute("disabled", "true");
      document.getElementById("edit_signon").
        setAttribute("disabled", "true");
      document.getElementById("speMenuBtn_editSignon").
        setAttribute("disabled", "true");
      spEditor.userChangedMenuBtn = false;
    }

    if (selections.length == 1
        && (!window.hasOwnProperty("gSelectUserInUse") || !gSelectUserInUse)) {
      document.getElementById("key_cloneSignon").removeAttribute("disabled");
      document.getElementById("clone_signon").removeAttribute("disabled");
      document.getElementById("speMenuBtn_cloneSignon").
        removeAttribute("disabled");
    } else {
      document.getElementById("key_cloneSignon").
        setAttribute("disabled", "true");
      document.getElementById("clone_signon").
        setAttribute("disabled", "true");
      document.getElementById("speMenuBtn_cloneSignon").
        setAttribute("disabled", "true");
    }
  },
  false);

const spEditor = {
  genStrBundle: null,
  pmoStrBundle: null,
  prefs: Components.classes["@mozilla.org/preferences-service;1"].
         getService(Components.interfaces.nsIPrefService).
         getBranch("extensions.savedpasswordeditor."),

  selectionsEnabled: true,
  userChangedMenuBtn: false,

  menuBtnSel: function (ev, elem) {
    this.userChangedMenuBtn = true;
    var mb = document.getElementById("speMenuBtn");
    switch(elem.id) {
    case "speMenuBtn_editSignon":
      mb.command = "edit_signon";
      mb.setAttribute("icon", "properties");
      this.editSignon();
      break;

    case "speMenuBtn_cloneSignon":
      mb.command = "clone_signon";
      mb.removeAttribute("icon");
      this.cloneSignon();
      break;

    case "speMenuBtn_newSignon":
      mb.command = "new_signon";
      mb.setAttribute("icon", "add");
      this.newSignon();
      break;
    }

    ev.stopPropagation();
  },

  _mergeSignonProps: function (oldSignon, newProps) {
    var merged = {};
    for (let prop in newProps)
      if (newProps[prop] === undefined)
        merged[prop] = oldSignon[prop];
      else
        merged[prop] = newProps[prop];

    var newSignon =
      Components.classes["@mozilla.org/login-manager/loginInfo;1"].
      createInstance(Components.interfaces.nsILoginInfo);
    newSignon.init(merged.hostname, merged.formSubmitURL,
                   merged.httpRealm, merged.username, merged.password,
                   merged.usernameField, merged.passwordField);
    return newSignon;
  },

  editSignon: function () {
    this.selectionsEnabled = false;
    var selections = GetTreeSelections(signonsTree);
    if (selections.length < 1) return;
    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var selSignons = selections.map(function (el) table[el]);
    var ret = { newSignon: null, callback: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal",
      selSignons, 1, showingPasswords, ret);

    this.selectionsEnabled = true;
    if (!ret.newSignon) return;

    try {
      for (let i = 0; i < selSignons.length; i++)
        passwordmanager.modifyLogin(
          selSignons[i], this._mergeSignonProps(selSignons[i], ret.newSignon));
      var fv = document.getElementById("filter").value;
      setFilter("");
      setFilter(fv);
      signonsTreeView.selection.clearSelection();
    } catch (e) {
      Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Components.interfaces.nsIPromptService).
        alert(window, this.genStrBundle.getString("error"),
              this.pmoStrBundle.getFormattedString("badnewentry",
                                                   [e.message]));
    }
  },

  cloneSignon: function () {
    this.selectionsEnabled = false;
    var selections = GetTreeSelections(signonsTree);
    if (selections.length != 1) return;
    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var signon = table[selections[0]];
    var ret = { newSignon: null, callback: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal",
      [signon], 2, showingPasswords, ret);
    this.selectionsEnabled = true;
    if (!ret.newSignon) return;
    try {
      passwordmanager.addLogin(this._mergeSignonProps(signon, ret.newSignon));
      var fv = document.getElementById("filter").value;
      setFilter("");
      setFilter(fv);
      signonsTreeView.selection.clearSelection();
    } catch (e) {
      Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Components.interfaces.nsIPromptService).
        alert(window, this.genStrBundle.getString("error"),
              this.pmoStrBundle.getFormattedString("badnewentry",
                                                   [e.message]));
    }
  },

  newSignon: function () {
    this.selectionsEnabled = false;
    var ret = { newSignon: null, callback: null };
    window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome,modal",
      [], 0, showingPasswords, ret);
    this.selectionsEnabled = true;
    if (!ret.newSignon) return;
    try {
      let newSignon =
        Components.classes["@mozilla.org/login-manager/loginInfo;1"].
        createInstance(Components.interfaces.nsILoginInfo);
      newSignon.init(ret.newSignon.hostname, ret.newSignon.formSubmitURL,
                     ret.newSignon.httpRealm, ret.newSignon.username,
                     ret.newSignon.password, ret.newSignon.usernameField,
                     ret.newSignon.passwordField);
      passwordmanager.addLogin(newSignon);
      var fv = document.getElementById("filter").value;
      setFilter("");
      setFilter(fv);
      signonsTreeView.selection.clearSelection();
    } catch (e) {
      Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Components.interfaces.nsIPromptService).
        alert(window, this.genStrBundle.getString("error"),
              this.pmoStrBundle.getFormattedString("badnewentry",
                                                   [e.message]));
    }
  },
}
