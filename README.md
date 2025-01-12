# AiderDesk Connector VSCode Extension

## Overview

AiderDesk Connector is a VS Code extension that connects to the AiderDesk tool, tracking file operations in your workspace to enable seamless integration with Aider's AI-powered pair programming capabilities.

Learn more about AiderDesk: [https://github.com/hotovo/aider-desk](https://github.com/hotovo/aider-desk)

## Features

- WebSocket client connecting to AiderDesk on port 24337
- Tracks currently opened files in your projects
- Provides real-time file status updates to AiderDesk
- Seamless integration with Aider's AI pair programming workflow

## Usage

The extension automatically connects to AiderDesk when VS Code starts. No manual configuration is needed - just make sure AiderDesk is running.

The extension will:
1. Connect to AiderDesk on port 24337
2. Track your workspace's open files
3. Send real-time updates as you work with files

## Installation

1. Clone the repository
2. Run `npm install`
3. Compile the extension with `npm run compile`
4. Load the extension in VS Code

## Development

- `npm run compile`: Compile the TypeScript code
- `npm run watch`: Watch for changes and recompile
- `npm run lint`: Run linter

## Contributing

Contributions are welcome! Please submit pull requests or open issues on the GitHub repository.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
