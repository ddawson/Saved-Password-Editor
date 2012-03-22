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

Components.utils.import(
  "resource://savedpasswordeditor/SavedPasswordEditor.jsm");

addEventListener(
  "load",
  function () {
    var prefix = "savedpasswordeditor-";

    function showItem (aId) {
      document.getElementById(prefix + aId).hidden = false;
    }

    function hideItem (aId) {
      document.getElementById(prefix + aId).hidden = true;
    }

    function popupshowingHandler () {
      let idList = ["ctxmenuseparator",
                    "savelogininfo", "editlogininfo", "deletelogininfo"];
      let target = gContextMenu.target;
      idList.forEach(
        SavedPasswordEditor.contextMenuShowing(target) ? showItem : hideItem);
    }

    function popuphiddenHandler () {
      SavedPasswordEditor.contextMenuHidden();
    }

    var ctxMenu = document.getElementById("contentAreaContextMenu");
    ctxMenu.addEventListener("popupshowing", popupshowingHandler, false);
  },
  false);
