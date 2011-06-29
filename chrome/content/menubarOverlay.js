/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2011  Daniel Dawson <ddawson@icehouse.net>

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

window.addEventListener(
  "load",
  function init_menuitemDynamic (evt) {
    const prefBranch =
      Components.classes["@mozilla.org/preferences-service;1"].
      getService(Components.interfaces.nsIPrefService).
      getBranch("extensions.savedpasswordeditor.");

    function menuitemDynamic (evt) {
      var hidden = !prefBranch.getBoolPref("display_menuitem");
      document.getElementById("savedpasswordeditor-menuitem").hidden = hidden;
      return true;
    }

    function register_menuitemDynamic (popup) {
      if (popup)
        popup.addEventListener("popupshowing", menuitemDynamic, false);
    }

    function appmenuitemDynamic (evt) {
      var hidden = !prefBranch.getBoolPref("display_menuitem");
      document.getElementById("savedpasswordeditor-appmenuitem").hidden =
        hidden;
      return true;
    }

    function register_appmenuitemDynamic (popup) {
      if (popup)
        popup.addEventListener("popupshowing", appmenuitemDynamic, false);
    }

    register_menuitemDynamic(document.getElementById("menu_ToolsPopup"));
    register_menuitemDynamic(document.getElementById("taskPopup"));
    register_appmenuitemDynamic(document.getElementById("appmenu-popup"));
    window.removeEventListener("load", init_menuitemDynamic, false);
  },
  false);
