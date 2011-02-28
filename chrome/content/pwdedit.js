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

function el (name) document.getElementById(name);

const Cc = Components.classes,
      Ci = Components.interfaces,
      prefs = Cc["@mozilla.org/preferences-service;1"].
              getService(Ci.nsIPrefService).
              getBranch("extensions.savedpasswordeditor."),
      THUNDERBIRD = "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
      CONKEROR = "{a79fe89b-6662-4ff4-8e88-09950ad4dfde}",
      SPICEBIRD = "{ee53ece0-255c-4cc6-8a7e-81a8b6e5ba2c}",
      SUNBIRD = "{718e30fb-e89b-41dd-9da7-e25a45638b28}";

var strBundle, catStorage, haveOldSignon, oldSignon, cloneSignon;

window.addEventListener(
  "DOMContentLoaded",
  function loadHandler (ev) {
    strBundle = el("string-bundle");

    var scsCid = "@daniel.dawson/signoncategorystorage;1";
    catStorage = scsCid in Cc ?
                 Cc[scsCid].getService(Ci.ddISignonCategoryStorage) : null;

    oldSignon = window.arguments[0];
    cloneSignon = window.arguments[1];

    var showpwd = prefs.getIntPref("showpassword");
    var pwdField = el("password_text");
    var pwdCurHidden = (pwdField.type == "password");
    pwdField.setAttribute("type", "password");
    var pwdViewButton = el("passwordView_btn");
    switch (showpwd) {
    case 1:
      pwdCurHidden = false;
      // Fall through
    case 2:
      if (!pwdCurHidden && login())
        pwdField.removeAttribute("type");
      break;
    }
    if (pwdField.hasAttribute("type") && pwdField.type == "password") {
      pwdViewButton.label = strBundle.getString("showPassword");
      pwdViewButton.accessKey = strBundle.getString("showPasswordAccesskey");
    } else {
      pwdViewButton.label = strBundle.getString("hidePassword");
      pwdViewButton.accessKey = strBundle.getString("hidePasswordAccesskey");
    }
  
    haveOldSignon = false;
    if (!oldSignon) {
      oldSignon = Cc["@mozilla.org/login-manager/loginInfo;1"].
                    createInstance(Ci.nsILoginInfo);
      oldSignon.init("", "", "", "", "", "", "");
      el("header").setAttribute("title", strBundle.getString("newlogin"));
    } else if (cloneSignon) {
      el("header").setAttribute("title", strBundle.getString("clonelogin"));
      haveOldSignon = true;
    } else {
      el("header").setAttribute("title", strBundle.getString("editlogin"));
      haveOldSignon = true;
    }

    el("hostname_text").value = oldSignon.hostname;
    el("formSubmitURL_text").value = oldSignon.formSubmitURL;
    el("httpRealm_text").value = oldSignon.httpRealm;
    el("username_text").value = oldSignon.username;
    el("password_text").value = oldSignon.password;
    el("usernameField_text").value = oldSignon.usernameField;
    el("passwordField_text").value = oldSignon.passwordField;

    if (catStorage)
      el("tags_text").value = catStorage.getCategory(oldSignon);
    else
      el("tags_box").hidden = true;

    if (!oldSignon.httpRealm)
      el("type_group").selectedIndex = 0;
    else if (oldSignon.hostname.match(/^http/))
      el("type_group").selectedIndex = 1;
    else
      el("type_group").selectedIndex = 2;

    var xai = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
    switch (xai.ID) {
    case THUNDERBIRD:
    case SPICEBIRD:
      el("type_form").hidden = true;
      if (!haveOldSignon)
        el("type_group").selectedIndex = 1;
      break;

    case SUNBIRD:
      el("type_groupbox").hidden = true;
      el("type_group").selectedIndex = 2;
      break;

    // Nothing to do for Firefox and SeaMonkey
    }

    handle_typeSelect();

    if (haveOldSignon && !cloneSignon)
      el("type_group").disabled = true;

    window.removeEventListener("DOMContentLoaded", loadHandler, false);
  },
  false);

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
    el("formSubmitURL_row").collapsed = false;
    el("httpRealm_row").collapsed = true;
    el("usernameField_row").collapsed = false;
    el("passwordField_row").collapsed = false;
    el("guessFromPage_btn").collapsed = false;
  } else {
    el("formSubmitURL_row").collapsed = true;
    el("httpRealm_row").collapsed = idx == 2;
    el("usernameField_row").collapsed = true;
    el("passwordField_row").collapsed = true;
    el("guessFromPage_btn").collapsed = true;
  }
}

function togglePasswordView () {
  var pwdField = el("password_text");
  var pwdViewButton = el("passwordView_btn");
  if (pwdField.type == "password") {
    if (!login()) return;
    pwdField.removeAttribute("type");
    pwdViewButton.label = strBundle.getString("hidePassword");
    pwdViewButton.accessKey = strBundle.getString("hidePasswordAccesskey");
  } else {
    pwdField.setAttribute("type", "password");
    pwdViewButton.label = strBundle.getString("showPassword");
    pwdViewButton.accessKey = strBundle.getString("showPasswordAccesskey");
  }
}

function guessParameters () {
  function walkTree (win) {
    var curDoc = win.document;
    if (!(curDoc instanceof HTMLDocument)) return false;

    inpage: {
      // Get the host prefix;
      var curLocation = win.location;
      var hostname = curLocation.protocol + "//" + curLocation.host;

      // Locate a likely login form and its fields
      var pwdFields = curDoc.evaluate(
        '//form//input[translate(@type, "PASWORD", "pasword")="password"]',
        curDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (pwdFields.snapshotLength == 0) break inpage;

      for (var i = 0; i < pwdFields.snapshotLength; i++) {
        var pwdField = pwdFields.snapshotItem(i), form = pwdField.form;
        var unameField = curDoc.evaluate(
          '(.//input[(not(@type) or translate(@type, "TEX", "tex")="text") ' +
            'and not(preceding::input[' +
            'translate(@type, "PASWORD", "pasword")="password"])])[last()]',
          form, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).
            singleNodeValue;
        if (unameField) break;
      }

      if (unameField) {
        // Construct the submit prefix
        var formAction = form.getAttribute("action");
        var res = /^([0-9-_A-Za-z]+:\/\/[^/]+)\//.exec(formAction);
        var formSubmitURL;
        if (res)
          formSubmitURL = res[1];
        else
          formSubmitURL = hostname;

        // Populate the editor form
        el("hostname_text").value = hostname;
        el("formSubmitURL_text").value = formSubmitURL;
        if (pwdField.value != "") {
          el("username_text").value = unameField.value;
          el("password_text").value = pwdField.value;
        }
        el("usernameField_text").value = unameField.getAttribute("name");
        el("passwordField_text").value = pwdField.getAttribute("name");
        return true;
      }
    }

    // See if any frame or iframe contains a login form
    var frames = win.frames;
    for (var i = 0; i < frames.length; i++) {
      if (walkTree(frames[i])) return true;
    }

    return false;
  }

  // Locate the browser object for the last seen tab
  var curWin =
      Cc["@mozilla.org/appshell/window-mediator;1"].
      getService(Ci.nsIWindowMediator).
      getMostRecentWindow("navigator:browser").getBrowser().contentWindow;

  // Attempt to find a login form
  if (!walkTree(curWin)) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"].
      getService(Ci.nsIPromptService).
      alert(window, strBundle.getString("error"),
            strBundle.getString("nologinform"));
  }
}

function setNewSignon () {
  var hostname = el("hostname_text").value,
    formSubmitURL, httpRealm,
    username = el("username_text").value,
    password = el("password_text").value,
    tags = el("tags_text").value,
    usernameField, passwordField;
  var idx = el("type_group").selectedIndex;

  if (idx == 0) {
    formSubmitURL = el("formSubmitURL_text").value;
    httpRealm = null;
    usernameField = el("usernameField_text").value;
    passwordField = el("passwordField_text").value;
  } else {
    formSubmitURL = null;
    httpRealm = idx == 1 ? el("httpRealm_text").value : hostname;
    usernameField = passwordField = "";
  }

  var newSignon = Cc["@mozilla.org/login-manager/loginInfo;1"].
                  createInstance(Ci.nsILoginInfo);
  newSignon.init(hostname, formSubmitURL, httpRealm, username, password,
                 usernameField, passwordField);
  if (window.arguments[2].callback)
    window.arguments[2].callback(newSignon);
  else
    window.arguments[2].newSignon = newSignon;

  if (catStorage) {
    if (haveOldSignon && !cloneSignon) catStorage.setCategory(oldSignon, "");
    catStorage.setCategory(newSignon, tags);
  }
}
