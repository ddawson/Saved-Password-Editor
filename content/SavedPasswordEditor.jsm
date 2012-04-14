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

const Cc = Components.classes,
      Ci = Components.interfaces,
      Cu = Components.utils;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var EXPORTED_SYMBOLS = ["SavedPasswordEditor"];

XPCOMUtils.defineLazyGetter(
  this, "prefs", function ()
    Cc["@mozilla.org/preferences-service;1"].
      getService(Ci.nsIPrefService).
      getBranch("extensions.savedpasswordeditor."));
XPCOMUtils.defineLazyServiceGetter(
  this, "pwdSvc",
  "@mozilla.org/login-manager;1", "nsILoginManager");
XPCOMUtils.defineLazyServiceGetter(
  this, "stringSvc",
  "@mozilla.org/intl/stringbundle;1", "nsIStringBundleService");
XPCOMUtils.defineLazyServiceGetter(
  this, "alertsSvc",
  "@mozilla.org/alerts-service;1", "nsIAlertsService");
XPCOMUtils.defineLazyServiceGetter(
  this, "promptSvc",
  "@mozilla.org/embedcomp/prompt-service;1", "nsIPromptService");
XPCOMUtils.defineLazyGetter(
  this, "genStrBundle", function ()
    stringSvc.createBundle(
      "chrome://savedpasswordeditor/locale/spe.properties"));
XPCOMUtils.defineLazyGetter(
  this, "pmoStrBundle", function ()
    stringSvc.createBundle(
      "chrome://savedpasswordeditor/locale/pwdmgrOverlay.properties"));

function el (aWindow, aId) aWindow.document.getElementById(aId)

function showAlert (aMsg) {
  alertsSvc.showAlertNotification(
    "chrome://savedpasswordeditor/skin/key32.png",
    genStrBundle.GetStringFromName("savedpasswordeditor"), aMsg);
}

var SavedPasswordEditor = {
  _deleting: false,
  _signonMap: {},

  openSavedPasswords: function () {
    var spWin = Cc["@mozilla.org/appshell/window-mediator;1"].
                  getService(Ci.nsIWindowMediator).
                  getMostRecentWindow("Toolkit:PasswordManager");
    if (spWin)
      spWin.focus();
    else
      Cc["@mozilla.org/embedcomp/window-watcher;1"].
        getService(Ci.nsIWindowWatcher).
        openWindow(
          null, "chrome://passwordmgr/content/passwordManager.xul", "",
          "chrome,titlebar,toolbar,centerscreen,resizable", null);
  },

  contextMenuShowing: function (aElement) {
    if (aElement instanceof Ci.nsIDOMHTMLInputElement && aElement.form) {
      var form = aElement.form;
    } else
      return false;

    var curDoc = aElement.ownerDocument;
    var curLocation = curDoc.defaultView.location;
    var hostname = curLocation.protocol + "//" + curLocation.host;
    var passwordField = null;
    for (var i = 0; i < form.elements.length; i++) {
      let element = form.elements[i];
      if (element instanceof Ci.nsIDOMHTMLInputElement
          && element.type.toLowerCase() == "password") {
        passwordField = element;
        break;
      }
    }
    if (!passwordField) return false;

    var usernameField = null;
    for (i = i - 1; i >= 0; i--) {
      let element = form.elements[i];
      if (!element instanceof Ci.nsIDOMHTMLInputElement) continue;
      let elType = element.getAttribute("type").toLowerCase();
      if (!elType || elType == "text" || elType == "email" || elType == "url"
          || elType == "tel" || elType == "number") {
        usernameField = element;
        break;
      }
    }
    if (!usernameField) return false;

    var formAction = form.action;
    var res = formAction ? /^([0-9-_A-Za-z]+:\/\/[^/]+)\//.exec(formAction)[1]
                         : hostname;

    this.curInfo = {
      hostname: hostname,
      formSubmitURL: res,
      username: usernameField.value,
      password: passwordField.value,
      usernameField: usernameField.name,
      passwordField: passwordField.name,
    };
    return true;
  },

  saveLoginInfo: function (aWindow, aEvt) {
    function _finish (aNewSignon) {
      if (!aNewSignon) return;
      try {
        let newSignon = Cc["@mozilla.org/login-manager/loginInfo;1"].
                        createInstance(Ci.nsILoginInfo);
        newSignon.init(aNewSignon.hostname, aNewSignon.formSubmitURL,
                       aNewSignon.httpRealm, aNewSignon.username,
                       aNewSignon.password, aNewSignon.usernameField,
                       aNewSignon.passwordField);
        pwdSvc.addLogin(newSignon);
        showAlert(genStrBundle.GetStringFromName("logininfosaved"));
      } catch (e) {
        promptSvc.alert(
          aWindow,
          genStrBundle.GetStringFromName("error"),
          pmoStrBundle.formatStringFromName("badnewentry", [e.message], 1));
      }
    }

    var ret = { newSignon: null, callback: _finish };
    aWindow.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome",
      [this.curInfo], 0, false, ret);
    this.curInfo = null;
  },

  _finishEdit: function (aNewSignon) {
    if (!aNewSignon) return;

    var newSignon = Cc["@mozilla.org/login-manager/loginInfo;1"].
                    createInstance(Ci.nsILoginInfo);
    newSignon.init(aNewSignon.hostname, aNewSignon.formSubmitURL,
                   aNewSignon.httpRealm, aNewSignon.username,
                   aNewSignon.password, aNewSignon.usernameField,
                   aNewSignon.passwordField);
    pwdSvc.modifyLogin(SavedPasswordEditor.oldSignon, newSignon);
    showAlert(genStrBundle.GetStringFromName("logininfochanged"));
  },

  _handleDisambigSelection: function (aEvt) {
    var spe = SavedPasswordEditor, target = aEvt.target,
        window = target.ownerDocument.defaultView,
        dp = el(window, "savedpasswordeditor-disambig-popup");

    if (spe._deleting) {
      try {
        pwdSvc.removeLogin(spe._signonMap[target.label]);
        showAlert(genStrBundle.GetStringFromName("logininfodeleted"));
      } catch (e) {
        promptSvc.alert(
          window,
          genStrBundle.GetStringFromName("error"),
          genStrBundle.formatStringFromName("failed", [e.message], 1));
      }
    } else
      window.openDialog(
        "chrome://savedpasswordeditor/content/pwdedit.xul", "",
        "centerscreen,dependent,dialog,chrome",
        [spe._signonMap[target.label]], 1, false,
        { newSignon: null, callback: spe._finishEdit });

    spe._deleting = false;
  },

  _showDisambig: function (aWindow, aSignons) {
    var dp = el(aWindow, "savedpasswordeditor-disambig-popup");
    while (dp.hasChildNodes()) dp.removeChild(dp.firstChild);

    this._signonMap = {};
    for each (let signon in aSignons) {
      this._signonMap[signon.username] = signon;
      let mi = aWindow.document.createElement("menuitem");
      mi.setAttribute("label", signon.username);
      dp.appendChild(mi);
    }

    dp.addEventListener("command", this._handleDisambigSelection, false);
    var spe = this;
    dp.addEventListener(
      "popuphidden",
      function _phHandler () {
        dp.removeEventListener("command", spe._handleDisambigSelection, false);
        dp.removeEventListener("popuphidden", _phHandler, false);
      },
      false);

    var bo = el(aWindow, "contentAreaContextMenu").boxObject,
        x = bo.x, y = bo.y;
    aWindow.setTimeout(
      function () { dp.openPopup(null, null, x, y, true, false, null); }, 1);
  },

  editLoginInfo: function (aWindow) {
    var signons = pwdSvc.findLogins({}, this.curInfo.hostname,
                                    this.curInfo.formSubmitURL, null);
    this.curInfo = null;
    this._deleting = false;

    if (signons.length == 0) {
      promptSvc.alert(
        aWindow,
        genStrBundle.GetStringFromName("error"),
        genStrBundle.GetStringFromName("nologinstoedit"));
    } else if (signons.length == 1) {
      this.oldSignon = signons[0];
      aWindow.openDialog(
        "chrome://savedpasswordeditor/content/pwdedit.xul", "",
        "centerscreen,dependent,dialog,chrome",
        [signons[0]], 1, false,
        { newSignon: null, callback: this._finishEdit });
    } else
      this._showDisambig(aWindow, signons);
  },

  deleteLoginInfo: function (aWindow) {
    var signons = pwdSvc.findLogins({}, this.curInfo.hostname,
                                    this.curInfo.formSubmitURL, null);
    this.curInfo = null;
    this._deleting = true;

    if (signons.length == 0) {
      promptSvc.alert(
        aWindow,
        genStrBundle.GetStringFromName("error"),
        genStrBundle.GetStringFromName("nologinstodelete"));
    } else if (signons.length == 1) {
      try {
        pwdSvc.removeLogin(signons[0]);
        showAlert(genStrBundle.GetStringFromName("logininfodeleted"));
      } catch (e) {
        promptSvc.alert(
          aWindow,
          genStrBundle.GetStringFromName("error"),
          genStrBundle.formatStringFromName("failed", [e.message], 1));
      }
    } else
      this._showDisambig(aWindow, signons);
  },
};
