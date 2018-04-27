const {app, Menu} = require('electron');

const template = [
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo', label: 'Undo'
      },
      {
        role: 'redo', label: 'Redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut', label: 'Cut'
      },
      {
        role: 'copy', label: 'Copy'
      },
      {
        role: 'paste', label: 'Paste'
      },
      {
        role: 'delete', label: 'Delete'
      },
      {
        role: 'selectall', label: 'Select all'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        role: 'resetzoom', label: 'Actual size'
      },
      {
        role: 'zoomin', label: 'Zoom in'
      },
      {
        role: 'zoomout', label: 'Zoom out'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen', label: 'Toggle fullscreen'
      }
    ]
  },
  {
    role: 'window', label: 'Window',
    submenu: [
      {
        role: 'minimize', label: 'Minimize'
      },
      {
        role: 'close', label: 'Close'
      }
    ]
  },
  {
    role: 'help', label: 'Help',
    submenu: [
      {
        label: 'Learn more',
        click () { require('electron'.shell.openExternal('http://google.com')) }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about', label: 'About' + " " + name
      },
      {
        type: 'separator'
      },
      {
        role: 'services', label: 'Services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide', label: 'Hide' + " " + name
      },
      {
        role: 'hideothers', label: 'Hide others'
      },
      {
        role: 'unhide', label: 'Unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit', label: 'Quit' + " " + name
      }
    ]
  });
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking', label: 'Start speaking'
        },
        {
          role: 'stopspeaking', label: 'Stop speaking'
        }
      ]
    }
  );
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring all to front',
      role: 'front'
    }
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
