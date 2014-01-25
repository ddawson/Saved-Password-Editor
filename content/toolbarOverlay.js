/*
    Saved Password Editor, extension for Gecko applications
    Copyright (C) 2014  Daniel Dawson <ddawson@icehouse.net>

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

window.addEventListener(
  "load",
  function _loadHandler () {
    window.removeEventListener("load", _loadHandler, false);

    const btnId = "savedpasswordeditor-button";
    const btnPos = {
      "navigator:browser": [["nav-bar", null],],
      "mail:3pane": [["mail-bar3", "button-appmenu"],
                     ["msgToolbar", "throbber-box"],],
      "msgcompose": [["composeToolbar2", null],
                     ["composeToolbar", "throbber-box"],],
    };
    var wtype = document.documentElement.getAttribute("windowtype");

    if (!(wtype in btnPos)) return;

    const prefName = "extensions.savedpasswordeditor.addedButtonTo";
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
               getService(Components.interfaces.nsIPrefService).getBranch("");
    if (prefs.prefHasUserValue(prefName))
      var addedButtonTo = prefs.getCharPref(prefName).split(",");
    else
      var addedButtonTo = [];

    if (addedButtonTo.indexOf(wtype) == -1) {
      if (document.getElementById("PanelUI-menu-button")) {
        /* Australis */

        var btn = document.getElementById(btnId);
        if (!btn || btn.parentNode.place == "palette")
          CustomizableUI.addWidgetToArea("savedpasswordeditor-button",
                                         "nav-bar");
      } else {
        /* Old-style toolbar */

        let toolbar, before;
        for each ([tbId, beforeId] in btnPos[wtype]) {
          toolbar = document.getElementById(tbId);
          if (!toolbar) continue;
          before = beforeId ? document.getElementById(beforeId) : null;
          break;
        }

        if (!toolbar) return;

        var btn = document.getElementById(btnId);
        if (!btn || btn.parentNode.tagName == "toolbarpalette") {
          toolbar.insertItem(btnId, before);
          toolbar.setAttribute("currentset", toolbar.currentSet);
          document.persist(toolbar.id, "currentset");
        }
      }

      addedButtonTo.push(wtype);
      prefs.setCharPref(prefName, addedButtonTo.join(","));
    }
  },
  false);
