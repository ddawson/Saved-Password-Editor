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

document.addEventListener(
  "DOMContentLoaded",
  function dclHandler (ev) {
    spEditor.strBundle = document.getElementById("savedpwdedit-stringbundle");
    document.removeEventListener("DOMContentLoaded", dclHandler, false);
  },
  false);

document.getElementById("passwordsTree").addEventListener(
  "select",
  function (ev) {
    var selections = gDataman.getTreeSelections(gPasswords.tree);
    if (selections.length == 1) {
      document.getElementById("key_editSignon").removeAttribute("disabled");
      document.getElementById("key_cloneSignon").removeAttribute("disabled");
      document.getElementById("edit_signon").removeAttribute("disabled");
      document.getElementById("clone_signon").removeAttribute("disabled");
      document.getElementById("speMenuBtn_editSignon").
        removeAttribute("disabled");
      document.getElementById("speMenuBtn_cloneSignon").
        removeAttribute("disabled");
      if (!spEditor.userChangedMenuBtn) {
        document.getElementById("speMenuBtn").command = "edit_signon";
        document.getElementById("speMenuBtn").
          setAttribute("icon", "properties");
      }
    } else if (!spEditor.refreshing) {
      document.getElementById("speMenuBtn").command = "new_signon";
      document.getElementById("speMenuBtn").
        setAttribute("icon", "add");
      document.getElementById("key_editSignon").
        setAttribute("disabled", "true");
      document.getElementById("key_cloneSignon").
        setAttribute("disabled", "true");
      document.getElementById("edit_signon").
        setAttribute("disabled", "true");
      document.getElementById("clone_signon").
        setAttribute("disabled", "true");
      document.getElementById("speMenuBtn_editSignon").
        setAttribute("disabled", "true");
      document.getElementById("speMenuBtn_cloneSignon").
        setAttribute("disabled", "true");
      spEditor.userChangedMenuBtn = false;
    }
  },
  false);

const spEditor = {
  strBundle: null,
  prefs: Components.classes["@mozilla.org/preferences-service;1"].
         getService(Components.interfaces.nsIPrefService).
         getBranch("extensions.savedpasswordeditor."),

  userChangedMenuBtn: false,
  refreshing: false,

  menuBtnSel: function (ev, elem) {
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

    this.userChangedMenuBtn = true;
    ev.stopPropagation();
  },

  mcbWrapper: function (method) {
    var myThis = this;
    return function () method.apply(myThis, arguments);
  },

  showErrorAlert: function (e) {
    let prompt = Components.classes["@mozilla.org/prompter;1"].
        getService(Components.interfaces.nsIPromptFactory).
        getPrompt(window.top, Components.interfaces.nsIPrompt),
      bag = prompt.QueryInterface(
        Components.interfaces.nsIWritablePropertyBag2);
    bag.setPropertyAsBool("allowTabModal", true);
    prompt.alert(this.strBundle.getString("error"),
                 this.strBundle.getFormattedString("badnewentry",
                                                   [e.message]));
  },

  SPE_WINDOW_NAME: "danieldawson:savedpasswordeditor",

  openSPEDialog: function (signon, cloning, ret) {
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].
      getService(Components.interfaces.nsIWindowWatcher);
    var oldWin = ww.getWindowByName(this.SPE_WINDOW_NAME, null);
    if (!oldWin)
      return window.openDialog(
        "chrome://savedpasswordeditor/content/pwdedit.xul",
        this.SPE_WINDOW_NAME, "centerscreen,dependent,dialog,chrome,resizable",
        signon, cloning, ret);
    else {
      oldWin.focus();
      return oldWin;
    }
  },

  editSignon: function () {
    var selections = gDataman.getTreeSelections(gPasswords.tree);
    if (selections.length != 1) return;
    var signon = gPasswords.displayedSignons[selections[0]];

    function __finish (newSignon) {
      try {
        gLocSvc.pwd.modifyLogin(signon, newSignon);
        this.refreshing = true;
        gPasswords.initialize();
        gPasswords.tree.view.selection.select(selections[0]);
        this.refreshing = false;
      } catch (e) {
        window.setTimeout(this.mcbWrapper(this.showErrorAlert), 0, e)
      }
    }
      
    var ret = { newSignon: null, callback: this.mcbWrapper(__finish) };
    var dlg = this.openSPEDialog(signon, false, ret);
  },

  cloneSignon: function () {
    var selections = gDataman.getTreeSelections(gPasswords.tree);
    if (selections.length != 1) return;
    var signon = gPasswords.displayedSignons[selections[0]];

    function __finish (newSignon) {
      try {
        gLocSvc.pwd.addLogin(newSignon);
      } catch (e) {
        window.setTimeout(this.mcbWrapper(this.showErrorAlert), 0, e);
      }
    }

    var ret = { newSignon: null, callback: this.mcbWrapper(__finish) };
    this.openSPEDialog(signon, true, ret);
  },

  newSignon: function () {
    function __finish (newSignon) {
      try {
        gLocSvc.pwd.addLogin(newSignon);
      } catch (e) {
        window.setTimeout(this.mcbWrapper(this.showErrorAlert), 0, e);
      }
    }

    var ret = { newSignon: null, callback: this.mcbWrapper(__finish) };
    this.openSPEDialog(null, false, ret);
  },
}
