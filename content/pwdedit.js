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

var okCallback;

function init (oldSignon, callback) {
  if (!oldSignon) {
    oldSignon = Components.classes["@mozilla.org/login-manager/loginInfo;1"].
                  createInstance(Components.interfaces.nsILoginInfo);
    oldSignon.init("", "", "", "", "", "", "");
  }
  with (document) {
    getElementById("hostname_text").value = oldSignon.hostname;
    getElementById("formSubmitURL_text").value = oldSignon.formSubmitURL;
    getElementById("httpRealm_text").value = oldSignon.httpRealm;
    getElementById("username_text").value = oldSignon.username;
    getElementById("password_text").value = oldSignon.password;
    getElementById("usernameField_text").value = oldSignon.usernameField;
    getElementById("passwordField_text").value = oldSignon.passwordField;
    var st = getElementById("signon_type");
    st.addEventListener("command", handle_typeSelect, false);
    if (oldSignon.httpRealm != null && oldSignon.httpRealm != "") {
      st.selectedIndex = 1;
      handle_typeSelect(null);
    }
  }
  okCallback = callback;
}

function handle_typeSelect (evt) {
  with (document) {
    var idx = getElementById("signon_type").selectedIndex;
    if (idx == 0) {
      getElementById("formSubmitURL_row").collapsed = false;
      getElementById("httpRealm_row").collapsed = true;
      getElementById("usernameField_row").collapsed = false;
      getElementById("passwordField_row").collapsed = false;
      getElementById("guessfrompage_btn").collapsed = false;
    } else {
      getElementById("formSubmitURL_row").collapsed = true;
      getElementById("httpRealm_row").collapsed = false;
      getElementById("usernameField_row").collapsed = true;
      getElementById("passwordField_row").collapsed = true;
      getElementById("guessfrompage_btn").collapsed = true;
    }
  }
  return false;
}

function guessParameters () {
  // Locate the content window for the last seen tab
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
             getService(Components.interfaces.nsIWindowMediator);
  var curWin = wm.getMostRecentWindow("navigator:browser");
  var curBrowser = curWin.document.getElementById("content").selectedBrowser;
  var curBrWin = curBrowser.contentWindow;

  // Get the host prefix
  var curLocation = curBrWin.location;
  var hostname = curLocation.protocol + "//" + curLocation.host;

  // Locate a likely login form and its fields
  var curDoc = curBrowser.contentDocument;
  var pwdField = curDoc.evaluate(
    '//form//input[@type="password"]', curDoc, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (!pwdField) {
    window.alert("No login form found!");
    return;
  }
  var form = pwdField.form;
  var unameField = curDoc.evaluate(
    './/input[@type="text" and not(preceding::input[@type="password"])][last()]',
    form, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (!unameField) {
    window.alert("No login form found!");
    return;
  }

  // Construct the submit prefix
  var formAction = form.getAttribute("action");
  var re = /^([0-9-_A-Za-z]+:\/\/[^/]+)\//;
  var ary = re.exec(formAction);
  var formSubmitURL;
  if (ary)
    formSubmitURL = ary[1];
  else
    formSubmitURL = hostname;

  // Get the field names and values
  usernameField = unameField.getAttribute("name");
  username = unameField.value;
  passwordField = pwdField.getAttribute("name");
  password = pwdField.value;

  // Populate the editor form
  with (document) {
    getElementById("hostname_text").value = hostname;
    getElementById("formSubmitURL_text").value = formSubmitURL;
    getElementById("username_text").value = username;
    getElementById("password_text").value = password;
    getElementById("usernameField_text").value = usernameField;
    getElementById("passwordField_text").value = passwordField;
  }
}
  
function setNewSignon () {
  with (document) {
    var hostname = getElementById("hostname_text").value;
    var formSubmitURL, httpRealm;
    var username = getElementById("username_text").value;
    var password = getElementById("password_text").value;
    var usernameField, passwordField;
    var idx = getElementById("signon_type").selectedIndex;
    if (idx == 0) {
      formSubmitURL = getElementById("formSubmitURL_text").value;
      httpRealm = null;
      usernameField = getElementById("usernameField_text").value;
      passwordField = getElementById("passwordField_text").value;
    } else {
      formSubmitURL = null;
      httpRealm = getElementById("httpRealm_text").value;
      usernameField = passwordField = "";
    }
  }
  var newSignon = Components.classes["@mozilla.org/login-manager/loginInfo;1"].
                    createInstance(Components.interfaces.nsILoginInfo);
  newSignon.init(hostname, formSubmitURL, httpRealm, username, password,
                 usernameField, passwordField);
  okCallback(newSignon);
}
