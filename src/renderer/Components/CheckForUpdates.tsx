import * as React from "react";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../rpcCommands";

export const CheckForUpdates = () => (
  <li className="action" onClick={() => ipcRenderer.send(COMMANDS.CHECK_FOR_UPDATES)}>
    Check for Updates...
  </li>
);
