import * as THREE from "https://unpkg.com/three@v0.149.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@v0.149.0/examples/jsm/loaders/GLTFLoader.js";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.0/dist/mindar-image-three.prod.js";

// Global variables
let puppy3DModel;
let arInfoPanel = null;
let calloutSprite = null; // Variable to store the callout sprite
let currentSlide = 0;
let mindarThree;
let renderer;
let scene;
let camera;
let anchor;
let initialTouchX = 0;
const slideTextures = [];
const slideImageUrls = [
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
  'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg',
  'https://images.pexels.com/photos/39317/chihuahua-dog-puppy-cute-39317.jpeg'
];

// Initialize app when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Preload slideshow images
function preloadImages() {
  slideImageUrls.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// Main app initialization
function initApp() {
  preloadImages();
    const mixers = [];
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const mouseVector = new THREE.Vector2();
  
  mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: "targets.mind", // Using the targets.mind file
    autoStart: false, // We will manually start the scene
    filterMinCF: 0.0001,
    filterBeta: 0.001,
    uiLoading: "#loading", // Optional loading UI
    uiScanning: "#scanning", // Optional scanning UI
    uiError: "#error", // Optional error message UI
  });
  renderer = mindarThree.renderer;
  scene = mindarThree.scene;
  camera = mindarThree.camera;
  const loader = new GLTFLoader();
  anchor = mindarThree.addAnchor(0);
  
  // Create texture loader for slides
  const textureLoader = new THREE.TextureLoader();
  slideImageUrls.forEach((url) => {
    const texture = textureLoader.load(url);
    slideTextures.push(texture);
  });

  let mixer; // Declare a variable to store the mixer
    // Load 3D model
  loader.load(
    "pup.glb",
    function (gltf) {
      console.log("GLB model loaded successfully");
      
      // Scale adjustment - may need to be adjusted based on model size
      gltf.scene.scale.set(12, 12, 12);
      
      // Position adjustment
      gltf.scene.position.set(0, 0.5, 0);
      
      // Rotation - modified to make model stand upright
      gltf.scene.rotation.set(90, 0, 0);
      
      // Make model visible by ensuring materials are set correctly
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Animation handling if the model has animations
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((animationClip) => {
          const action = mixer.clipAction(animationClip);
          action.play();
          mixers.push(mixer);
          console.log("Playing animation:", animationClip.name);
        });
      }      // Store reference to the model for rotation
      puppy3DModel = gltf.scene;
      
      // Add the model to the anchor
      anchor.group.add(gltf.scene);
      console.log("Model added to scene");
      
      // First, check if there's an existing callout and remove it
      anchor.group.traverse((child) => {
        if (child.isSprite && child !== calloutSprite) {
          console.log("Found and removing extra sprite");
          anchor.group.remove(child);
        }
      });
      
      // Create callout sprite above the dog
      createCalloutSprite();
      
      // Setup touch and mouse interactions after model is loaded
      setupInteractions(document.querySelector("#container"), puppy3DModel);
    },
    // Progress callback
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error("Error loading model:", error);
    }
  );
  // Setup lighting
  setupLighting(scene, anchor);
  
  // Setup event listeners
  setupEventListeners(anchor, mindarThree);
  
  // Start the scene with proper error handling
  mindarThree.start()
    .then(() => {
      console.log("AR session started successfully");
      document.querySelector("#loading").style.display = "none";
      document.querySelector("#scanning").style.display = "block";
    })
    .catch((error) => {
      console.error("Error starting AR session:", error);
      document.querySelector("#loading").style.display = "none";
      document.querySelector("#error").style.display = "block";
    });
    // Animation loop
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    for (const mixer of mixers) {
      mixer.update(delta);
    }
    renderer.render(scene, camera);
  });
  
  // Setup UI controls
  setupUIControls();
}

// Setup all lighting
function setupLighting(scene, anchor) {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Main directional light (simulates sun)
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(1, 1, 1);
  mainLight.castShadow = true;
  scene.add(mainLight);

  // Additional directional light from opposite direction to fill shadows
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-1, 0, -1);
  scene.add(fillLight);

  // Hemisphere light for more natural lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  anchor.group.add(hemiLight);
}

// Setup all event listeners for AR target
function setupEventListeners(anchor, mindarThree) {
  // Add event listeners to track AR anchor status
  anchor.onTargetFound = () => {
    console.log("Target found - anchor should now be visible");
    document.querySelector("#scanning").style.display = "none";
    
    // Check for and remove any duplicate sprites
    checkForSprites();
    
    // Make sure callout is visible when target is found
    if (calloutSprite && !arInfoPanel?.visible) {
      calloutSprite.visible = true;
    }
  };
  
  anchor.onTargetLost = () => {
    console.log("Target lost - anchor should now be hidden");
    document.querySelector("#scanning").style.display = "block";
    
    // Hide AR panel when target is lost
    hideARInfoPanel();
  };
}

// Setup interactions (touch and mouse)
function setupInteractions(container, puppy3DModel) {
  // Variables for touch and mouse interaction
  let isTapping = false;
  let isMouseDown = false;
  let interactionStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let mouseStartX = 0;
  let mouseStartY = 0;
  let lastPosX = 0;
  const tapThreshold = 200; // milliseconds
  const moveThreshold = 10; // pixels
  
  // Touch event handlers for rotation
  container.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) {
      // Record the touch position and time
      initialTouchX = event.touches[0].clientX;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      lastPosX = initialTouchX;
      interactionStartTime = Date.now();
      isTapping = true;
      
      event.preventDefault(); // Prevent default touch behaviors like page scrolling
    }
  }, { passive: false });
  
  container.addEventListener("touchmove", (event) => {
    if (event.touches.length === 1 && puppy3DModel) {
      // Calculate touch movement
      const currentTouchX = event.touches[0].clientX;
      const deltaX = currentTouchX - lastPosX;
      const totalMoveX = Math.abs(currentTouchX - touchStartX);
      const totalMoveY = Math.abs(event.touches[0].clientY - touchStartY);
      
      // If moved more than threshold, it's not a tap
      if (totalMoveX > moveThreshold || totalMoveY > moveThreshold) {
        isTapping = false;
      }
      
      // Rotate only on Y axis - adjust sensitivity as needed
      puppy3DModel.rotation.y += deltaX * 0.01;
      
      // Update position for next move event
      lastPosX = currentTouchX;
      
      event.preventDefault(); // Prevent default touch behaviors
    }
  }, { passive: false });
  
  // Touch end handler for tap detection
  container.addEventListener("touchend", (event) => {
    if (isTapping && (Date.now() - interactionStartTime < tapThreshold)) {
      // This is a tap event, check if we tapped on the 3D model
      checkTapOnModel(touchStartX, touchStartY);
    }
    isTapping = false;
  });
  
  // Mouse event handlers for rotation and click
  container.addEventListener("mousedown", (event) => {
    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    lastPosX = mouseStartX;
    interactionStartTime = Date.now();
    isMouseDown = true;
  });
  
  container.addEventListener("mousemove", (event) => {
    if (isMouseDown && puppy3DModel) {
      // Calculate mouse movement
      const currentMouseX = event.clientX;
      const deltaX = currentMouseX - lastPosX;
      
      // Rotate only on Y axis - adjust sensitivity as needed
      puppy3DModel.rotation.y += deltaX * 0.01;
      
      // Update position for next move event
      lastPosX = currentMouseX;
    }
  });
  
  container.addEventListener("mouseup", (event) => {
    if (isMouseDown && (Date.now() - interactionStartTime < tapThreshold)) {
      const totalMoveX = Math.abs(event.clientX - mouseStartX);
      const totalMoveY = Math.abs(event.clientY - mouseStartY);
      
      // If movement was small enough, consider it a click
      if (totalMoveX < moveThreshold && totalMoveY < moveThreshold) {
        checkTapOnModel(mouseStartX, mouseStartY);
      }
    }
    isMouseDown = false;
  });
  
  // Handle mouse leaving the container
  container.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });
}

// Setup UI control buttons
function setupUIControls() {
  document.getElementById('next-slide').addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slideTextures.length;
    updateARSlide();
  });
  
  document.getElementById('prev-slide').addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slideTextures.length) % slideTextures.length;
    updateARSlide();
  });
  
  document.getElementById('close-ar-panel').addEventListener('click', () => {
    hideARInfoPanel();
  });
  
  // Disable right-click menu and keyboard shortcuts
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('Right-click is disabled!');
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.key === 'u')) {
      e.preventDefault();
      alert('View Source is disabled!');
    }
  });
}

// Function to check if the tap is on the 3D model using raycasting
function checkTapOnModel(x, y) {
  if (!puppy3DModel) return;
  
  // Convert screen coordinates to normalized device coordinates
  const rect = mindarThree.renderer.domElement.getBoundingClientRect();
  const normalizedX = ((x - rect.left) / rect.width) * 2 - 1;
  const normalizedY = -((y - rect.top) / rect.height) * 2 + 1;
  
  // Set up raycaster
  const raycaster = new THREE.Raycaster();
  const mouseVector = new THREE.Vector2(normalizedX, normalizedY);
  raycaster.setFromCamera(mouseVector, mindarThree.camera);
  
  // Check for intersections with the model
  const intersects = raycaster.intersectObject(puppy3DModel, true);
  
  if (intersects.length > 0) {
    // Tap was on the model, show AR info panel and hide callout
    console.log("Model tapped!");
    showARInfoPanel();
    
    // Hide the callout sprite when dog is tapped
    if (calloutSprite) {
      calloutSprite.visible = false;
    }
  }
}

// Function to create and show the AR info panel
function showARInfoPanel() {
  if (arInfoPanel) {
    // If panel already exists, just show it
    arInfoPanel.visible = true;
    document.getElementById('ar-controls').style.display = 'block';
    return;
  }
    // Create panel group
  arInfoPanel = new THREE.Group();
    // Left panel for text
  const leftPanelGeometry = new THREE.PlaneGeometry(0.8, 0.6);
  const leftPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.9,
    transparent: true,
    side: THREE.DoubleSide
  });
  const leftPanelMesh = new THREE.Mesh(leftPanelGeometry, leftPanelMaterial);  // Position on the left side of the model
  // ADJUST THIS VALUE: Use a larger negative number to move further left (e.g., -1.2), smaller negative number to move closer to model (e.g., -0.5)
  leftPanelMesh.position.set(-0.8, 0, 0);
  
  // Right panel for images
  const rightPanelGeometry = new THREE.PlaneGeometry(0.8, 0.6);
  const rightPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.9,
    transparent: true,
    side: THREE.DoubleSide
  });
  const rightPanelMesh = new THREE.Mesh(rightPanelGeometry, rightPanelMaterial);  // Position on the right side of the model
  // ADJUST THIS VALUE: Use a larger positive number to move further right (e.g., 1.2), smaller positive number to move closer to model (e.g., 0.5)
  rightPanelMesh.position.set(0.8, 0, 0);
    // Create slide mesh for right panel
  const slideGeometry = new THREE.PlaneGeometry(0.7, 0.5);
  const slideMaterial = new THREE.MeshBasicMaterial({
    map: slideTextures[currentSlide],
    transparent: true,
    side: THREE.DoubleSide
  });
  const slideMesh = new THREE.Mesh(slideGeometry, slideMaterial);  // Place the slide mesh at the same position as the right panel (must match the rightPanelMesh x-position)
  slideMesh.position.set(0.8, 0, 0.01);
  
  // Create text for left panel
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#3498db';
  context.fillRect(0, 0, canvas.width, 50);
  context.fillStyle = '#222222';
  context.fillRect(0, 50, canvas.width, canvas.height);
  context.font = '30px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.fillText('Adorable AR Puppy', canvas.width / 2, 35);
  context.font = '18px Arial';
  context.fillText('Perfect virtual companion', canvas.width / 2, 85);
  context.fillText('for all ages!', canvas.width / 2, 115);
  context.fillText('Tap to interact with your', canvas.width / 2, 155);
  context.fillText('new AR friend', canvas.width / 2, 185);
  
  const textTexture = new THREE.Texture(canvas);
  textTexture.needsUpdate = true;
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide
  });  const textGeometry = new THREE.PlaneGeometry(0.7, 0.5);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);  // Place the text mesh at the same position as the left panel (must match the leftPanelMesh x-position)
  textMesh.position.set(-0.8, 0, 0.01);
  
  // Add all elements to the panel group
  arInfoPanel.add(leftPanelMesh);
  arInfoPanel.add(rightPanelMesh);
  arInfoPanel.add(slideMesh);
  arInfoPanel.add(textMesh);  // Overall position and scale of all panels
  // ADJUST THESE VALUES:
  // - First parameter (0): Move entire panel group left/right (usually keep at 0)
  // - Second parameter (0.3): Move entire panel group up/down (higher value = higher position)
  // - Third parameter (0): Move entire panel group forward/backward (positive = closer to camera)
  // - Scale (0.8): Overall size of all panels (smaller value = smaller panels)
  arInfoPanel.position.set(0, 0.3, 0);
  arInfoPanel.scale.set(0.8, 0.8, 0.8);
  
  // Add panel to the anchor
  anchor.group.add(arInfoPanel);
  
  // Show controls
  document.getElementById('ar-controls').style.display = 'block';
  
  // Store slide mesh reference for updates
  arInfoPanel.userData = {
    slideMesh: slideMesh
  };
}

// Function to hide AR info panel
function hideARInfoPanel() {
  if (arInfoPanel) {
    arInfoPanel.visible = false;
    document.getElementById('ar-controls').style.display = 'none';
    
    // Show callout again when info panel is hidden
    if (calloutSprite) {
      calloutSprite.visible = true;
    }
  }
}

// Update slide in AR panel
function updateARSlide() {
  if (arInfoPanel && arInfoPanel.userData.slideMesh) {
    arInfoPanel.userData.slideMesh.material.map = slideTextures[currentSlide];
    arInfoPanel.userData.slideMesh.material.needsUpdate = true;
  }
}

// Debug function to check for extra sprites
function checkForSprites() {
  let spriteCount = 0;
  if (anchor && anchor.group) {
    anchor.group.traverse((child) => {
      if (child.isSprite) {
        spriteCount++;
        console.log("Found sprite at position:", child.position.y);
        // If it's not our tracked calloutSprite, remove it
        if (child !== calloutSprite) {
          console.log("Removing extra sprite");
          anchor.group.remove(child);
        }
      }
    });
    console.log(`Total sprites in scene: ${spriteCount}`);
  }
}

// Function to create the floating callout sprite above the dog
function createCalloutSprite() {
  // First check for and remove any existing sprites
  checkForSprites();
  
  // Make sure we don't have any existing callout sprite
  if (calloutSprite) {
    anchor.group.remove(calloutSprite);
    calloutSprite = null;
  }
  
  // Load callout texture
  const textureLoader = new THREE.TextureLoader();
  const calloutTexture = textureLoader.load('callout (2).png');
  
  // Create sprite material with the callout texture
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: calloutTexture,
    transparent: true,
    opacity: 1
  });
  
  // Create sprite and position it above the dog model
  calloutSprite = new THREE.Sprite(spriteMaterial);
  calloutSprite.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
  calloutSprite.position.set(0.5, -0.7, 1); // Position above the dog (adjust y-value as needed)
  calloutSprite.rotation.set(0, Math.PI / 2, 0); // Rotate to face camera

  // Add sprite to anchor group
  anchor.group.add(calloutSprite);
  
  // Check once more to make sure we only have one sprite
  console.log("After creating callout:");
  checkForSprites();
  
  // Start animation
  animateCallout();
}

// Function to animate the callout with an up-down movement
function animateCallout() {
  if (!calloutSprite) return;
  
  // Initial position
  const initialY = calloutSprite.position.y;
  const animationAmplitude = 0.05; // How much it moves up/down
  const animationSpeed = 0.003; // Speed of the animation
  
  // Stop any existing animations
  if (calloutSprite.userData && calloutSprite.userData.animationId) {
    cancelAnimationFrame(calloutSprite.userData.animationId);
  }
  
  // Store reference to initial position
  calloutSprite.userData = calloutSprite.userData || {};
  calloutSprite.userData.initialY = initialY;

  // Animation function to be called in the render loop
  function updateCalloutAnimation() {
    if (calloutSprite && calloutSprite.visible) {
      // Sine wave animation for smooth up-down movement
      calloutSprite.position.y = initialY + Math.sin(Date.now() * animationSpeed) * animationAmplitude;
      
      // Request next frame and store the animation ID
      calloutSprite.userData.animationId = requestAnimationFrame(updateCalloutAnimation);
    }
  }
  
  // Start the animation
  updateCalloutAnimation();
}
