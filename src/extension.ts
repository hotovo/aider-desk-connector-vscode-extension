import vscode from 'vscode';
// @ts-expect-error there is exported io
import {io} from 'socket.io-client';
import path from 'path';

interface Client {
  socket: SocketIOClient.Socket;
  projectBasePath: string;
}

let client: Client | undefined;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('AiderDesk Connector');
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine('AiderDesk Connector: Starting client connection to port 24337');

  // Create Socket.IO client
  try {
    const socket = io('http://localhost:24337', {
      reconnectionDelay: 5000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 0,
      timeout: 1000
    });

    socket.on('connect', () => {
      outputChannel.appendLine('AiderDesk Connector: Connected to server');

      // Get the workspace folder path
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        outputChannel.appendLine('AiderDesk Connector: No workspace folder found');
        return;
      }

      const projectBasePath = workspaceFolders[0].uri.fsPath;
      client = {socket, projectBasePath};

      // Send initialization message
      const openFiles = getOpenFiles(projectBasePath);
      socket.emit('message', {
        action: 'init',
        baseDir: projectBasePath,
        contextFiles: openFiles.map(filePath => ({
          path: filePath,
          sourceType: 'vscode'
        }))
      });
    });

    socket.on('disconnect', () => {
      outputChannel.appendLine('AiderDesk Connector: Disconnected from server');
      client = undefined;
    });

    socket.on('error', (error: any) => {
      outputChannel.appendLine(`AiderDesk Connector: Socket error: ${error}`);
    });

    // Cleanup on deactivation
    context.subscriptions.push({
      dispose: () => {
        cleanup();
      }
    });

  } catch (error) {
    outputChannel.appendLine(`AiderDesk Connector: Failed to connect to server: ${error}`);
    return;
  }

  // Track tab changes
  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs((e) => {
      if (!client) {
        return;
      }

      // Handle closed tabs
      e.closed.forEach(tab => {
        if (tab.input instanceof vscode.TabInputText) {
          const filePath = tab.input.uri.fsPath;
          if (tab.input.uri.scheme === 'file') {
            outputChannel.appendLine(`AiderDesk Connector: Tab closed: ${filePath}`);
            sendFileEvent('drop-file', filePath);
          }
        }
      });

      // Handle opened tabs
      e.opened.forEach(tab => {
        if (tab.input instanceof vscode.TabInputText) {
          const filePath = tab.input.uri.fsPath;
          if (tab.input.uri.scheme === 'file') {
            outputChannel.appendLine(`AiderDesk Connector: Tab opened: ${filePath}`);
            sendFileEvent('add-file', filePath);
          }
        }
      });
    })
  );
}

// Get currently open files relative to project base path
function getOpenFiles(projectBasePath: string): string[] {
  const openFiles: string[] = [];
  outputChannel.appendLine('AiderDesk Connector: Getting open files');
  outputChannel.appendLine(vscode.window.tabGroups.all.flatMap(group => group.tabs).length.toString());
  const allTabs = vscode.window.tabGroups.all
    .flatMap(group => group.tabs)
    .filter(tab => tab.input instanceof vscode.TabInputText);

  outputChannel.appendLine(`List of tab files: ${allTabs.map(tab => (tab.input as vscode.TabInputText).uri.fsPath)}`);

  allTabs.forEach(tab => {
    const uri = (tab.input as vscode.TabInputText).uri;
    if (uri.scheme === 'file' && uri.fsPath.startsWith(projectBasePath)) {
      const relativePath = path.relative(projectBasePath, uri.fsPath);
      openFiles.push(relativePath);
    }
  });

  return openFiles;
}

// Send file events to server
function sendFileEvent(action: 'add-file' | 'drop-file', fullPath: string) {
  if (!client || !fullPath.startsWith(client.projectBasePath)) {
    return;
  }

  const relativePath = path.relative(client.projectBasePath, fullPath);
  try {
    client.socket.emit('message', {
      action,
      path: relativePath,
      sourceType: 'vscode'
    });
  } catch (error) {
    outputChannel.appendLine(`AiderDesk Connector: Error sending message to server: ${error}`);
  }
}

function cleanup() {
  if (client) {
    client.socket.disconnect();
    client = undefined;
  }
  outputChannel.appendLine('AiderDesk Connector: Cleaned up Socket.IO connection');
}

export function deactivate() {
  cleanup();
}
