# 🐶 WebAR Puppy Experience

**[👉 Try WebAR Puppy Live Demo](https://reliable-melba-93be87.netlify.app/)**

## Project Overview

WebAR Puppy is an immersive augmented reality (AR) web experience that brings a virtual 3D puppy into your real-world environment. Using just a web browser and device camera, users can interact with a friendly 3D puppy model positioned over a target image, rotate it with touch/mouse gestures, and discover additional information through interactive AR panels that appear on either side of the model.

![WebAR Puppy Demo](dog.webp)

### Key Highlights

- No app installation required - runs entirely in the browser
- Works on most modern smartphones, tablets, and computers with a camera
- Immersive AR experience with intuitive interactions
- Informative panels that appear in 3D space alongside the model
- Image slideshow feature showcasing additional content

## ✨ Features

- **Browser-Based AR**: Experience augmented reality directly in your web browser without downloading any apps
- **Image Target Recognition**: Uses the device camera to detect and track a specific target image
- **Interactive 3D Model**: A detailed puppy model that can be rotated through touch or mouse interaction
- **Dual AR Information Panels**: Text information panel on the left and image slideshow panel on the right
- **User-Friendly Scanning UI**: Visual guidance shows users exactly which image to scan
- **Custom UI Controls**: Slideshow navigation and panel dismissal buttons
- **Responsive Design**: Optimized for both mobile and desktop experiences
- **Separation of Concerns**: Clean code organization with separate HTML, CSS, and JavaScript files

## 🛠️ Technology Stack

- **THREE.js**: Powers the 3D rendering and scene management
- **MindAR**: Provides the image tracking and AR capabilities
- **WebGL**: Enables hardware-accelerated graphics in the browser
- **JavaScript (ES6+)**: Handles all application logic and interactions
- **HTML5/CSS3**: Structures and styles the user interface elements
- **ES Modules**: For modern JavaScript module organization

## 🚀 Getting Started

### Prerequisites

- A modern web browser with WebGL and camera access support:
  - Chrome (recommended), Firefox, Safari, or Edge
- A device with a camera (for AR functionality)
- The target image (`dog.webp` included in the project)
- A local server to serve the files (Python's built-in server recommended)

### Quick Start

1. Clone or download this repository
2. Navigate to the project directory
3. Start a local server:

```bash
# Using Python (recommended)
python -m http.server 8000

# Using Node.js and npx
npx serve
```

4. Open your browser and visit:
```
http://localhost:8000
```

5. Allow camera access when prompted
6. Point your camera at the target image (`dog.webp`)

### Using the Application

1. **Scanning**: Hold your device so the camera can see the target image
2. **Interaction**: Once the puppy appears:
   - Swipe or drag to rotate the model
   - Tap/click on the puppy to reveal information panels
   - Use the arrow buttons to navigate through images
   - Press the X button to dismiss panels

## 📁 Project Structure

```
WebAR Puppy/
├── index.html          # Main HTML structure
├── app.js              # AR and interaction logic
├── app.css             # Styling for the application
├── targets.mind        # MindAR target image data
├── pup.glb             # 3D puppy model
├── dog.webp            # Target image for scanning
├── plugins/            # External plugins
├── aframe.io/          # A-Frame library files
└── cdn.jsdelivr.net/   # CDN resources
```

## ⚙️ Customization

The application offers several customization points:

### Modifying Panel Positions
In `app.js`, look for these sections:
```javascript
// Left panel position (adjust x value)
leftPanelMesh.position.set(-0.8, 0, 0);

// Right panel position (adjust x value)
rightPanelMesh.position.set(0.8, 0, 0);
```

### Changing Slideshow Images
Update the `slideImageUrls` array in `app.js`:
```javascript
const slideImageUrls = [
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
  'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg',
  'https://images.pexels.com/photos/39317/chihuahua-dog-puppy-cute-39317.jpeg'
];
```

### Model Adjustments
To modify the 3D model's appearance:
```javascript
// Scale
gltf.scene.scale.set(12, 12, 12);

// Position
gltf.scene.position.set(0, 0.5, 0);

// Rotation
gltf.scene.rotation.set(90, 0, 0);
```

## 📱 Compatibility

- **Mobile**: Android (Chrome, Samsung Internet), iOS (Safari)
- **Desktop**: Chrome, Firefox, Edge, Safari
- **Minimum Requirements**: WebGL support, camera access, and adequate processing power

## 💡 Development Tips

- Use Chrome DevTools with mobile device emulation for testing
- Ensure good lighting when testing AR functionality
- For optimal tracking, print the target image rather than displaying it on another screen
- When developing, consider lowering the model complexity to improve performance on lower-end devices



## 🙏 Acknowledgements

- THREE.js team for their excellent 3D web framework
- MindAR creators for making web AR accessible
- All testers who provided feedback during development
