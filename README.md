# Circuit-Forge

Circuit Forge is a digital circuit simulation application that lets users design, test, and visualise electronic circuits in a user-friendly environment.

## Features

- Drag-and-drop interface for circuit building
- Real-time circuit simulation
- Support for various components (LEDs, resistors, ICs, switches, etc.)
- Breadboard integration
- Save and load projects
- Export circuits as images

## Prerequisites

Before installing Circuit Forge, ensure you have the following:

- **Node.js** (version 18 or higher)
- **npm** (usually comes with Node.js)

## Installation

### Windows

1. **Install Node.js and npm**:
   - Download the installer from [nodejs.org](https://nodejs.org/)
   - Run the installer and follow the instructions
   - Make sure to check the option to install npm and add Node.js to your PATH

2. **Install dependencies**:
   ```
   cd circuit-forge
   npm install
   ```

3. **Start the development server**:
   ```
   npm run dev
   ```

4. **For production build**:
   ```
   npm run build
   ```
   The built files will be in the `dist` directory.

### macOS

1. **Install Node.js and npm**:
   - Using Homebrew (recommended):
     ```
     brew install node
     ```
   - Or download the installer from [nodejs.org](https://nodejs.org/)

2. **Install dependencies**:
   ```
   cd circuit-forge
   npm install
   ```

3. **Start the development server**:
   ```
   npm run dev
   ```

4. **For production build**:
   ```
   npm run build
   ```
   The built files will be in the `dist` directory.

### Linux

1. **Install Node.js and npm**:
   - Ubuntu/Debian:
     ```
     sudo apt update
     sudo apt install nodejs npm
     ```
   - Fedora:
     ```
     sudo dnf install nodejs npm
     ```
   - Arch Linux:
     ```
     sudo pacman -S nodejs npm
     ```

2. **Verify installation**:
   ```
   node --version
   npm --version
   ```
   Make sure Node.js version is 18 or higher.

3. **Install dependencies**:
   ```
   cd circuit-forge
   npm install
   ```

4. **Start the development server**:
   ```
   npm run dev
   ```

5. **For production build**:
   ```
   npm run build
   ```
   The built files will be in the `dist` directory.

## Running the Application

After starting the development server, open your browser and navigate to:
```
http://localhost:5173 (or whatever is stated on the terminal)
```

## Building for Production

The production build process compiles and optimises the application for deployment:

1. Run the build command:
   ```
   npm run build
   ```

2. The built files will be in the `dist` directory and can be served using any HTTP server:
   ```
   npm run preview
   ```
   This will serve the production build at `http://localhost:4173` (or whatever is stated on the terminal)

## Troubleshooting

### Common Issues

1. **Error: Cannot find module**:
   - Make sure you've run `npm install`
   - Try deleting the `node_modules` folder and running `npm install` again

2. **Browser compatibility issues**:
   - Circuit Forge works best in modern browsers like Chrome, Firefox, or Edge

3. **Build fails**:
   - Make sure you have the correct Node.js version (18+)
   - Check for errors in the console
   - Run `npm install` again to ensure all dependencies are correctly installed