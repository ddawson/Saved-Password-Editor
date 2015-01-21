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

function el (name) document.getElementById(name);

const Cc = Components.classes,
      Ci = Components.interfaces,
      prefs = Cc["@mozilla.org/preferences-service;1"].
              getService(Ci.nsIPrefService).
              getBranch("extensions.savedpasswordeditor."),
      THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
      CONKEROR = "{a79fe89b-6662-4ff4-8e88-09950ad4dfde}";

var pwdCurHidden, genStrBundle, peStrBundle, haveOldSignon,
    oldSignons, editorMode, loginForms, curLoginIdx, oldUsername, oldPassword;

window.addEventListener(
  "DOMContentLoaded",
  function dclHandler (ev) {
    var pwdField = el("password_text");
    pwdCurHidden = (pwdField.type == "password");
    pwdField.setAttribute("type", "password");
    window.removeEventListener("DOMContentLoaded", dclHandler, false);
  },
  false);

window.addEventListener(
  "load",
  function loadHandler (ev) {
    genStrBundle = el("general-string-bundle");
    peStrBundle = el("pwdedit-string-bundle");

    oldSignons = window.arguments[0];
    editorMode = window.arguments[1];

    haveOldSignon = oldSignons.length > 0;
    if (!haveOldSignon)
      oldSignons[0] = { hostname: "", formSubmitURL: "", httpRealm: "",
                        username: "", password: "", usernameField: "",
                        passwordField: "" };

    if (editorMode == 0)
      el("header").setAttribute("title", peStrBundle.getString("newlogin"));
    else if (editorMode == 2)
      el("header").setAttribute("title", peStrBundle.getString("clonelogin"));
    else
      el("header").setAttribute(
        "title", peStrBundle.getString(oldSignons.length > 1 ? "editmultlogin"
                                                           : "editlogin"));

    var compositeSignon = intersectSignonProps(oldSignons);

    var props = [ "hostname", "formSubmitURL", "httpRealm",
                  "username", "password", "usernameField", "passwordField" ];
    for (let i in props) {
      let propName = props[i], tbox = el(propName + "_text");
      if (compositeSignon[propName] !== undefined) {
        tbox.indefinite = false;
        tbox.autoreindef = false;
        tbox.value = compositeSignon[propName];
      } else {
        tbox.indefinite = true;
        tbox.autoreindef = true;
      }
    }

    if (oldSignons.length > 1) {
      el("type_group").style.display = "none";
      el("type_caption").style.display = "none";

      let haveWebLogin = false, haveAnnotatedLogin = false;
      for (let i = 0; i < oldSignons.length; i++) {
        if (oldSignons[i].httpRealm)
          haveAnnotatedLogin = true;
        else
          haveWebLogin = true;
      }

      if (haveAnnotatedLogin)
        el("formSubmitURL_lbl").disabled = el("formSubmitURL_text").disabled =
          true;
      if (haveWebLogin)
        el("httpRealm_lbl").disabled = el("httpRealm_text").disabled =
          true;

    } else {
      let type;
      if (!oldSignons[0].httpRealm)
        type = 0;
      else
        type = 1;
      el("type_group").selectedIndex = type;

      handle_typeSelect();

      if (editorMode == 1)
        el("type_group").disabled = true;
    }

    window.setTimeout(afterLoadHandler, 1);
    window.removeEventListener("load", loadHandler, false);
  },
  false);

function afterLoadHandler () {
  var pwdShownInSPWin = window.arguments[2];
  var alwaysShowPwds = prefs.getBoolPref("always_show_passwords");
  var showpwd = prefs.getIntPref("showpassword");
  var pwdField = el("password_text");
  var showpwdButton = el("showPassword_btn");
  var hidepwdButton = el("hidePassword_btn");

  if (alwaysShowPwds && (pwdShownInSPWin || (haveOldSignon ? login() : true)))
    pwdCurHidden = false;
  else switch (showpwd) {
  case 0:
    pwdCurHidden = true;
    break;
  case 1:
    if (pwdShownInSPWin || (haveOldSignon ? login() : true))
      pwdCurHidden = false;
    break;
  case 2:
    if (!pwdCurHidden && !pwdShownInSPWin
        && (haveOldSignon ? !login() : false))
      pwdCurHidden = true;
    break;
  case 3:
    pwdCurHidden = !pwdShownInSPWin;
    break;
  }
  if (!pwdCurHidden) pwdField.removeAttribute("type");

  if (pwdField.hasAttribute("type") && pwdField.type == "password") {
    showpwdButton.hidden = false;
    hidepwdButton.hidden = true;
  } else {
    showpwdButton.hidden = true;
    hidepwdButton.hidden = false;
  }
}

function intersectSignonProps (signons) {
  var intersection = new Object();
  var propList = [ "hostname", "formSubmitURL", "httpRealm", "username",
                   "password", "usernameField", "passwordField" ];
  for (var i = 0; i < signons.length; i++) {
    let signon = signons[i];
    for (var j = 0; j < propList.length; j++) {
      let prop = propList[j];
      if (!intersection.hasOwnProperty(prop))
        intersection[prop] = signon[prop] !== undefined ? signon[prop] : null;
      else if (signon[prop] != intersection[prop])
        intersection[prop] = undefined;
    }
  }

  return intersection;
}

function login () {
  var token = Components.classes["@mozilla.org/security/pk11tokendb;1"].
                createInstance(Components.interfaces.nsIPK11TokenDB).
                getInternalKeyToken();
  if (!token.checkPassword("")) {
    try {
      token.login(true);
    } catch (e) { }
    return token.isLoggedIn();
  }
  return true;
}

function handle_typeSelect () {
  var idx = el("type_group").selectedIndex;
  if (idx == 0) {
    el("formSubmitURL_lbl").disabled = el("formSubmitURL_text").disabled =
      el("usernameField_lbl").disabled = el("usernameField_text").disabled =
      el("passwordField_lbl").disabled = el("passwordField_text").disabled =
      el("guessFromPage_btn").disabled = false;
    el("httpRealm_lbl").disabled = el("httpRealm_text").disabled = true;
  } else {
    el("formSubmitURL_lbl").disabled = el("formSubmitURL_text").disabled =
      el("usernameField_lbl").disabled = el("usernameField_text").disabled =
      el("passwordField_lbl").disabled = el("passwordField_text").disabled =
      el("guessFromPage_btn").disabled = true;
    el("httpRealm_lbl").disabled = el("httpRealm_text").disabled = false;
  }
}

function togglePasswordView () {
  var focusTarget;
  var pwdField = el("password_text");
  var showpwdButton = el("showPassword_btn");
  var hidepwdButton = el("hidePassword_btn");
  if (pwdField.type == "password") {
    if (pwdField.value != "" && !login()) return;
    pwdField.removeAttribute("type");
    showpwdButton.hidden = true;
    hidepwdButton.hidden = false;
    focusTarget = hidepwdButton;
  } else {
    pwdField.setAttribute("type", "password");
    showpwdButton.hidden = false;
    hidepwdButton.hidden = true;
    focusTarget = showpwdButton;
  }

  window.setTimeout(function () { focusTarget.focus(); }, 1);
}

function guessParameters () {
  function walkTree (win) {
    var curDoc = win.document;
    if (!(curDoc instanceof HTMLDocument)) return;

    // Get the host prefix;
    var curLocation = win.location;
    var hostname = curLocation.protocol + "//" + curLocation.host;

    // Locate likely login forms and their fields
    var forms = curDoc.evaluate("//xhtml:form", curDoc, _htmlNamespaceResolver,
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < forms.snapshotLength; i++) {
      let form = forms.snapshotItem(i), pwdField = null, j;
      for (j = 0; j < form.elements.length; j++) {
        let element = form.elements[j];
        if (element instanceof HTMLInputElement
            && element.type == "password") {
          pwdField = element;
          break;
        }
      }
      if (!pwdField) continue;

      let unameField = null;
      for (j = j - 1; j >= 0; j--) {
        let element = form.elements[j];
        if (!element instanceof HTMLInputElement) continue;
        let elType = (element.getAttribute("type") || "").toLowerCase();
        if (!elType || elType == "text" || elType == "email" || elType == "url"
            || elType == "tel" || elType == "number") {
          unameField = element;
          break;
        }
      }
      if (!unameField) continue;

      // Construct the submit prefix
      let formAction = form.action;
      let res;
      if (formAction && formAction.startsWith("javascript:"))
        res = "javascript:";
      else {
        res = formAction ? /^([0-9-_A-Za-z]+:\/\/[^/]+)\//.exec(formAction)
                         : [ null, hostname ];
        if (!res) return false;
        res = res[1];
      }

      loginForms.push({
        hostname: hostname, formSubmitURL: res,
        username: unameField.value, password: pwdField.value,
        usernameField: unameField.getAttribute("name"),
        passwordField: pwdField.getAttribute("name") });
    }

    // See if any frame or iframe contains a login form
    var frames = win.frames;
    for (var i = 0; i < frames.length; i++) {
      walkTree(frames[i]);
    }
  }

  // Locate the browser object for the last seen tab
  var curWin =
      Cc["@mozilla.org/appshell/window-mediator;1"].
      getService(Ci.nsIWindowMediator).
      getMostRecentWindow("navigator:browser").getBrowser().contentWindow;

  // Attempt to find login form(s)
  loginForms = [];
  oldUsername = el("username_text").value;
  oldPassword = el("password_text").value;

  walkTree(curWin);
  if (loginForms.length == 0) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"].
      getService(Ci.nsIPromptService).
      alert(window, genStrBundle.getString("error"),
            peStrBundle.getString("nologinform"));
    return;
  }

  if (loginForms.length > 1) {
    el("prevForm_btn").hidden = false;
    el("nextForm_btn").hidden = false;
  } else {
    el("prevForm_btn").hidden = true;
    el("nextForm_btn").hidden = true;
  }

  _fillFromForm(0);
}

function _htmlNamespaceResolver (aPrefix)
  aPrefix == "xhtml" ? "http://www.w3.org/1999/xhtml" : null

function _fillFromForm (aIdx) {
  curLoginIdx = aIdx;
  var loginForm = loginForms[aIdx];
  el("hostname_text").value = loginForm.hostname;
  el("formSubmitURL_text").value = loginForm.formSubmitURL;
  el("usernameField_text").value = loginForm.usernameField;
  el("passwordField_text").value = loginForm.passwordField;
  if (loginForm.password == "") {
    el("username_text").value = oldUsername;
    el("password_text").value = oldPassword;
  } else {
    el("username_text").value = loginForm.username;
    el("password_text").value = loginForm.password;
  }

  for each (let prfx in ["hostname", "formSubmitURL", "username", "password",
                         "usernameField", "passwordField"]) {
    let chgEvt = document.createEvent("Event");
    chgEvt.initEvent("change", true, true);
    el(prfx + "_text").dispatchEvent(chgEvt);
  }

  if (curLoginIdx == 0)
    el("prevForm_btn").disabled = true;
  else
    el("prevForm_btn").disabled = false;

  if (curLoginIdx == loginForms.length - 1)
    el("nextForm_btn").disabled = true;
  else
    el("nextForm_btn").disabled = false;
}

function prevForm () {
  if (curLoginIdx > 0) _fillFromForm(curLoginIdx - 1);
}

function nextForm () {
  if (curLoginIdx < loginForms.length - 1) _fillFromForm(curLoginIdx + 1);
}

function setNewSignon () {
  var hostname = el("hostname_text"),
      formSubmitURL = el("formSubmitURL_text"),
      httpRealm = el("httpRealm_text"),
      username = el("username_text"),
      password = el("password_text"),
      usernameField = el("usernameField_text"),
      passwordField = el("passwordField_text");
  var newProps = {
    hostname: hostname.qvalue,
    username: username.qvalue,
    password: password.qvalue,
  };

  if (oldSignons.length > 1)
    var type = -1;
  else
    var type = el("type_group").selectedIndex;

  if (type == -1) {
    newProps.formSubmitURL =
      formSubmitURL.indefinite ? undefined : formSubmitURL.disabled ? null :
      formSubmitURL.qvalue;
    newProps.httpRealm =
      httpRealm.indefinite ? undefined : httpRealm.disabled ? null :
      httpRealm.qvalue;
    newProps.usernameField =
      usernameField.indefinite ? undefined : usernameField.qvalue;
    newProps.passwordField =
      passwordField.indefinite ? undefined : passwordField.qvalue;
  } else if (type == 0) {
    newProps.formSubmitURL = formSubmitURL.qvalue;
    newProps.httpRealm = null;
    newProps.usernameField = usernameField.qvalue;
    newProps.passwordField = passwordField.qvalue;
  } else {
    newProps.formSubmitURL = null;
    newProps.httpRealm = httpRealm.qvalue;
    newProps.usernameField = newProps.passwordField = "";
  }

  if (!newProps.hostname && newProps.hostname !== undefined) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"].
      getService(Ci.nsIPromptService).
      alert(window, genStrBundle.getString("error"),
            peStrBundle.getString("emptyhost"));
    return false;
  }

  if ((type == 0 && !newProps.formSubmitURL
       && newProps.formSubmitURL !== undefined)
      || (type == 1 && !newProps.httpRealm
          && newProps.httpRealm !== undefined)) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"].
      getService(Ci.nsIPromptService).
      alert(window, genStrBundle.getString("error"),
            peStrBundle.getString("emptysecondary"));
    return false;
  }

  if (oldSignons.length > 1 && newProps.hostname !== undefined
      && newProps.username !== undefined
      && (newProps.formSubmitURL !== undefined
          || newProps.httpRealm !== undefined)) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"].
      getService(Ci.nsIPromptService).
      alert(window, genStrBundle.getString("error"),
            peStrBundle.getString("multduplogins"));
    return false;
  }

  if (window.arguments[3].callback) {
    let parentWindow = null;
    if (window.arguments[3].parentWindow)
      parentWindow = window.arguments[3].parentWindow;
    window.arguments[3].callback(newProps, parentWindow);
  } else
    window.arguments[3].newSignon = newProps;

  return true;
}
