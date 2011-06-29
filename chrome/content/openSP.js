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

function speOpenSavedPasswords () {
  var spWin = Components.classes["@mozilla.org/appshell/window-mediator;1"].
                getService(Components.interfaces.nsIWindowMediator).
                getMostRecentWindow("Toolkit:PasswordManager");
  if (spWin)
    spWin.focus();
  else
    Components.classes["@mozilla.org/embedcomp/window-watcher;1"].
      getService(Components.interfaces.nsIWindowWatcher).
      openWindow(null, "chrome://passwordmgr/content/passwordManager.xul",
                 "", "chrome,titlebar,toolbar,centerscreen,resizable", null);
}
