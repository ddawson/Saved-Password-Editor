/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2012  Daniel Dawson <danielcdawson@gmail.com>

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

const Cc = Components.classes, Ci = Components.interfaces;

function el (aEl) document.getElementById(aEl);

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
    el("renameMenuitem_text").hidden = true;
} else
  toggle_displayMenuitem();

toggle_alwaysShowPasswords();
