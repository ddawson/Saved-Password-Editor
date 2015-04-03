/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2015  Daniel Dawson <danielcdawson@gmail.com>

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

const Cc = Components.classes, Ci = Components.interfaces,
  Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

var prefs = Services.prefs.getBranch("extensions.savedpasswordeditor.");

function el (aEl) document.getElementById(aEl);

window.addEventListener(
  "load",
  function () { el("entershortcut_lbl").style.visibility = "hidden"; },
  false);

var keycodesToSymbols = {}, symbolsToKeycodes = {};
{
  let setupKeycodeTable = [
      0, "",
      3, "CANCEL",
      6, "HELP",
      8, "BACK_SPACE",
      9, "TAB",
     12, "CLEAR", "RETURN", "ENTER",
     16, "SHIFT", "CONTROL", "ALT", "PAUSE", "CAPS_LOCK",
     27, "ESCAPE",
     32, "SPACE", "PAGE_UP", "PAGE_DOWN", "END", "HOME", "LEFT", "UP", "RIGHT",
         "DOWN", "SELECT", "PRINT", "EXECUTE", "PRINTSCREEN", "INSERT",
         "DELETE",
     93, "CONTEXT_MENU",
     96, "NUMPAD0", "NUMPAD1", "NUMPAD2", "NUMPAD3", "NUMPAD4", "NUMPAD5",
         "NUMPAD6", "NUMPAD7", "NUMPAD8", "NUMPAD9", "MULTIPLY", "ADD",
         "SEPARATOR", "SUBTRACT", "DECIMAL", "DIVIDE",
         "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11",
         "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21",
         "F22", "F23", "F24",
    144, "NUM_LOCK", "SCROLL_LOCK",
  ];

  let i = 0, keycode = 0;
  while (i < setupKeycodeTable.length) {
    let elem = setupKeycodeTable[i];
    let elemNum = parseInt(elem);
    if (!isNaN(elemNum)) {
      i++;
      keycode = elemNum;
      continue;
    }
    keycodesToSymbols[keycode] = elem;
    symbolsToKeycodes[elem] = keycode;
    i++;
    keycode++;
  }
}

function synctopref () {
  var value = el("opensp_shortcut_key").value;
  prefs.setIntPref("openspkeycode",
                   value in symbolsToKeycodes ? symbolsToKeycodes[value] : 0);
  return value;
}

function captureshortcut (evt) {
  el("entershortcut_lbl").style.visibility = "visible";
  var btn = el("opensp_keypressrecv");
  btn.addEventListener("keypress", keycapture, false);
  btn.focus();
}

function keycapture (evt) {
  var modifiers = [];
  [["ctrlKey", "control"], ["altKey", "alt"],
   ["metaKey", "meta"], ["shiftKey", "shift"]].forEach(
    function (m, idx, ary) {
      if (evt[m[0]]) modifiers.push(m[1]);
    });
  modifiers = modifiers.join(",");

  if (evt.charCode == 0 || evt.location == 3 /* keypad */)
    var char = keycodesToSymbols[evt.keyCode];
  else
    var char = String.fromCharCode(evt.charCode);
  var modTxt = el("opensp_shortcut_modifiers"),
      keyTxt = el("opensp_shortcut_key");
  modTxt.value = modifiers;
  var inpEvt = document.createEvent("Event");
  inpEvt.initEvent("input", true, true);
  modTxt.dispatchEvent(inpEvt);
  keyTxt.value = char;
  inpEvt = document.createEvent("Event");
  inpEvt.initEvent("input", true, true);
  keyTxt.dispatchEvent(inpEvt);

  evt.stopPropagation();
  el("entershortcut_lbl").style.visibility = "hidden";
  el("opensp_keypressrecv").
    removeEventListener("keypress", keycapture, false);
  el("opensp_shortcut_capturebtn").focus();
}

function toggle_displayMenuitem () {
  var rmi_lbl = el("renameMenuitem_lbl"), rmi_text = el("renameMenuitem_text");
  if (el("displayMenuitem_ck").checked)
    rmi_lbl.disabled = rmi_text.disabled = false;
  else
    rmi_lbl.disabled = rmi_text.disabled = true;
}

function toggle_alwaysShowPasswords () {
  var fp_ck = el("forcepromptformasterpassword_ck"),
      sp_rg = el("showPassword_rg");

  if (el("alwaysshowpasswords_ck").checked) {
    fp_ck.disabled = false;
    sp_rg.disabled = true;
  } else {
    fp_ck.disabled = true;
    sp_rg.disabled = false;
  }
}

if (Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).ID ==
    "{a79fe89b-6662-4ff4-8e88-09950ad4dfde}") {
  el("displayMenuitem_ck").hidden =
    el("renameMenuitem_lbl").hidden =
    el("renameMenuitem_text").hidden =
    el("opensp_shortcut_box").hidden =
    el("entershortcut_lbl").hidden = true;
} else
  toggle_displayMenuitem();

toggle_alwaysShowPasswords();
