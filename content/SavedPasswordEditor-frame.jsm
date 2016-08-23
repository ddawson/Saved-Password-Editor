/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2016  Daniel Dawson <danielcdawson@gmail.com>

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

"use strict";

var EXPORTED_SYMBOLS = ["SavedPasswordEditor"];

const htmlNamespaceResolver =
  aPrefix => aPrefix == "xhtml" ? "http://www.w3.org/1999/xhtml" : null;

var SavedPasswordEditor = {
  getFormData (aElement) {
    const HTMLInputElement =
      aElement.ownerDocument.defaultView.HTMLInputElement;

    if (aElement instanceof HTMLInputElement && aElement.form) {
      var form = aElement.form;
    } else
      return null;

    var curDoc = aElement.ownerDocument;
    var curLocation = curDoc.defaultView.location;
    var hostname = `${curLocation.protocol}//${curLocation.host}`;
    var passwordField = null;
    for (var i = 0; i < form.elements.length; i++) {
      let element = form.elements[i];
      if (element instanceof HTMLInputElement
          && element.type.toLowerCase() == "password") {
        passwordField = element;
        break;
      }
    }
    if (!passwordField) return null;

    var usernameField = null;
    for (i = i - 1; i >= 0; i--) {
      let element = form.elements[i];
      if (!element instanceof HTMLInputElement) continue;
      let elType = (element.getAttribute("type") || "").toLowerCase();
      if (!elType || elType == "text" || elType == "email" || elType == "url"
          || elType == "tel" || elType == "number") {
        usernameField = element;
        break;
      }
    }
    if (!usernameField) return null;

    var formAction = form.action;
    var res;
    if (formAction && formAction.startsWith("javascript:"))
      res = "javascript:";
    else {
      res = formAction ? /^([0-9-_A-Za-z]+:\/\/[^/]+)\//.exec(formAction)
                           : [ null, hostname ];
      if (!res) return null;
      res = res[1];
    }

    return {
      hostname,
      formSubmitURL: res,
      username: usernameField.value,
      password: passwordField.value,
      usernameField: usernameField.name,
      passwordField: passwordField.name,
    };
  },

  scanForLoginForms ({ target: aMM }) {
    const HTMLDocument = aMM.content.HTMLDocument,
          HTMLInputElement = aMM.content.HTMLInputElement;

    function walkTree (aWindow) {
      var curDoc = aWindow.document;
      if (!(curDoc instanceof HTMLDocument)) return [];

      // Get the host prefix;
      var curLocation = aWindow.location;
      var hostname = curLocation.protocol + "//" + curLocation.host;

      // Locate likely login forms and their fields
      var loginForms = [];
      var forms = curDoc.evaluate(
        "//xhtml:form", curDoc, htmlNamespaceResolver,
        aWindow.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
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
          if (!elType || elType == "text" || elType == "email"
              || elType == "url" || elType == "tel" || elType == "number") {
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
          if (!res) continue;
          res = res[1];
        }

        loginForms.push({
          hostname, formSubmitURL: res,
          username: unameField.value, password: pwdField.value,
          usernameField: unameField.getAttribute("name"),
          passwordField: pwdField.getAttribute("name"),
        });
      }

      // See if any frame or iframe contains a login form
      var frames = aWindow.frames;
      for (var i = 0; i < frames.length; i++) {
        loginForms.push(...walkTree(frames[i]));
      }

      return loginForms;
    }

    aMM.sendAsyncMessage(
      "SavedPasswordEditor:loginformsresults", walkTree(aMM.content));
  },
};
