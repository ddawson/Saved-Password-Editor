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

function handleSelection () {
  var selections = GetTreeSelections(signonsTree);
  if (selections.length == 1 && !gSelectUserInUse)
    document.getElementById("editSignon").removeAttribute("disabled");
  else
    document.getElementById("editSignon").setAttribute("disabled", "true");
}

document.getElementById("signonsTree").
  addEventListener("select", handleSelection, false);

function EditSignon () {
  var selections = GetTreeSelections(signonsTree);
  if (selections.length == 1) {
    var table =
      signonsTreeView._filterSet.length ? signonsTreeView._filterSet : signons;
    var signon = table[selections[0]];
    var win = window.openDialog(
      "chrome://savedpasswordeditor/content/pwdedit.xul", "",
      "centerscreen,dependent,dialog,chrome");
    win.addEventListener(
      "load",
      function (evt) {
        win.init(
          signon,
          function (newSignon) {
            passwordmanager.modifyLogin(signon, newSignon);
            LoadSignons();
          });
      },
      false);
  }
}

function NewSignon () {
  var origWin = window;
  var win = window.openDialog(
    "chrome://savedpasswordeditor/content/pwdedit.xul", "",
    "centerscreen,dependent,dialog,chrome");
  win.addEventListener(
    "load",
    function (evt) {
      win.init(
        null,
        function (newSignon) {
          try {
            var res = passwordmanager.addLogin(newSignon);
            LoadSignons();
          } catch (e) {
            window.alert(e.message);
          }
        });
    },
    false);
}
