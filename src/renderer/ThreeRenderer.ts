import * as THREE from 'three';
import {
  BG_COLOR,
  BLOCK_COLOR,
  EDGE_COLOR,
  GRID_LINE_COLOR,
  GRID_WIDTH,
  GRID_DEPTH,
  GRID_HEIGHT,
  CAMERA_DISTANCE,
  FLASH_COLOR,
} from '../constants';
import { Position, Piece } from '../types';

// Pool size for reusable meshes
const BLOCK_POOL_SIZE = 150;

export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private gridLines: THREE.LineSegments | null = null;
  private nextPieceRenderer: THREE.WebGLRenderer;
  private nextPieceScene: THREE.Scene;
  private nextPieceCamera: THREE.OrthographicCamera;
  private prefersReducedMotion: boolean;
  private zoomLevel = 1;
  private readonly MIN_ZOOM = 0.3;
  private readonly MAX_ZOOM = 2.5;
  private cameraTheta = Math.PI / 4;

  // Shared geometry and materials (created ONCE)
  private sharedBlockGeometry: THREE.BoxGeometry;
  private sharedBlockMaterial: THREE.MeshBasicMaterial;
  private sharedEdgeGeometry: THREE.EdgesGeometry;
  private sharedEdgeMaterial: THREE.LineBasicMaterial;
  private sharedFlashGeometry: THREE.PlaneGeometry;
  private sharedFlashMaterial: THREE.MeshBasicMaterial;

  // Object pools
  private blockPool: THREE.Mesh[] = [];
  private activeBlocks: THREE.Mesh[] = [];
  private currentPieceBlocks: THREE.Mesh[] = [];
  private nextPieceBlocks: THREE.Mesh[] = [];
  private nextPiecePool: THREE.Mesh[] = [];

  // Flash plane (reused)
  private flashPlane: THREE.Mesh | null = null;
  private flashTimeout: number | null = null;

  constructor(canvas: HTMLCanvasElement, nextPieceCanvas: HTMLCanvasElement) {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create shared geometry and materials ONCE
    this.sharedBlockGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.sharedBlockMaterial = new THREE.MeshBasicMaterial({ color: BLOCK_COLOR });
    this.sharedEdgeGeometry = new THREE.EdgesGeometry(this.sharedBlockGeometry);
    this.sharedEdgeMaterial = new THREE.LineBasicMaterial({ color: EDGE_COLOR });
    this.sharedFlashGeometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_DEPTH);
    this.sharedFlashMaterial = new THREE.MeshBasicMaterial({
      color: FLASH_COLOR,
      transparent: true,
      opacity: 0.7
    });

    // Main scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);

    // Orthographic camera
    const aspect = canvas.width / canvas.height;
    const frustumSize = 25;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    this.camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE);
    this.camera.lookAt(GRID_WIDTH / 2, GRID_HEIGHT / 2, GRID_DEPTH / 2);

    // Renderer with pixel ratio cap for HiDPI
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.width, canvas.height);

    // Set initial zoom (1 = default, <1 = zoomed out, >1 = zoomed in)
    this.zoomLevel = 1;
    this.updateCameraZoom();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Next piece preview setup
    this.nextPieceScene = new THREE.Scene();
    this.nextPieceScene.background = new THREE.Color(BG_COLOR);

    const npAspect = nextPieceCanvas.width / nextPieceCanvas.height;
    const npFrustumSize = 5;
    this.nextPieceCamera = new THREE.OrthographicCamera(
      (npFrustumSize * npAspect) / -2,
      (npFrustumSize * npAspect) / 2,
      npFrustumSize / 2,
      npFrustumSize / -2,
      0.1,
      100
    );
    this.nextPieceCamera.position.set(5, 5, 5);
    this.nextPieceCamera.lookAt(2, 0, 2);

    this.nextPieceRenderer = new THREE.WebGLRenderer({ canvas: nextPieceCanvas, antialias: true });
    this.nextPieceRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.nextPieceRenderer.setSize(nextPieceCanvas.width, nextPieceCanvas.height);

    const npLight = new THREE.AmbientLight(0xffffff, 1);
    this.nextPieceScene.add(npLight);

    // Create grid
    this.createGrid();

    // Pre-allocate block pools
    this.initBlockPools();
  }

  private initBlockPools(): void {
    // Main scene pool
    for (let i = 0; i < BLOCK_POOL_SIZE; i++) {
      const mesh = this.createPooledBlockMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.blockPool.push(mesh);
    }

    // Next piece pool (only need 4)
    for (let i = 0; i < 4; i++) {
      const mesh = this.createPooledBlockMesh();
      mesh.visible = false;
      this.nextPieceScene.add(mesh);
      this.nextPiecePool.push(mesh);
    }
  }

  private createPooledBlockMesh(): THREE.Mesh {
    // Reuse shared geometry and material
    const mesh = new THREE.Mesh(this.sharedBlockGeometry, this.sharedBlockMaterial);
    const edgeLines = new THREE.LineSegments(this.sharedEdgeGeometry, this.sharedEdgeMaterial);
    mesh.add(edgeLines);
    return mesh;
  }

  private getBlockFromPool(): THREE.Mesh | null {
    // Find first invisible block in pool
    for (const block of this.blockPool) {
      if (!block.visible) {
        return block;
      }
    }
    return null;
  }

  private createGrid(): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    for (let x = 0; x <= GRID_WIDTH; x++) {
      positions.push(x, 0, 0, x, 0, GRID_DEPTH);
    }
    for (let z = 0; z <= GRID_DEPTH; z++) {
      positions.push(0, 0, z, GRID_WIDTH, 0, z);
    }

    positions.push(0, 0, 0, 0, GRID_HEIGHT, 0);
    positions.push(GRID_WIDTH, 0, 0, GRID_WIDTH, GRID_HEIGHT, 0);
    positions.push(0, 0, GRID_DEPTH, 0, GRID_HEIGHT, GRID_DEPTH);
    positions.push(GRID_WIDTH, 0, GRID_DEPTH, GRID_WIDTH, GRID_HEIGHT, GRID_DEPTH);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ color: GRID_LINE_COLOR });
    this.gridLines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.gridLines);
  }

  public renderPlacedBlocks(blocks: Position[]): void {
    // Hide all previously active blocks
    for (const block of this.activeBlocks) {
      block.visible = false;
    }
    this.activeBlocks = [];

    // Show and position blocks from pool
    for (let i = 0; i < blocks.length; i++) {
      const pos = blocks[i];
      const mesh = this.getBlockFromPool();
      if (mesh) {
        mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
        mesh.visible = true;
        this.activeBlocks.push(mesh);
      }
    }
  }

  public renderCurrentPiece(piece: Piece | null, visualYOffset: number = 0): void {
    // Hide previous current piece blocks
    for (const block of this.currentPieceBlocks) {
      block.visible = false;
    }
    this.currentPieceBlocks = [];

    if (!piece) return;

    // Show and position blocks for current piece
    for (const block of piece.blocks) {
      const mesh = this.getBlockFromPool();
      if (mesh) {
        const worldPos = {
          x: piece.position.x + block.position.x,
          y: piece.position.y + block.position.y - visualYOffset,
          z: piece.position.z + block.position.z,
        };
        mesh.position.set(worldPos.x + 0.5, worldPos.y + 0.5, worldPos.z + 0.5);
        mesh.visible = true;
        this.currentPieceBlocks.push(mesh);
      }
    }
  }

  public renderNextPiece(piece: Piece | null): void {
    // Hide all next piece blocks
    for (const block of this.nextPiecePool) {
      block.visible = false;
    }
    this.nextPieceBlocks = [];

    if (!piece) return;

    // Show and position blocks for next piece
    for (let i = 0; i < piece.blocks.length && i < this.nextPiecePool.length; i++) {
      const block = piece.blocks[i];
      const mesh = this.nextPiecePool[i];
      mesh.position.set(block.position.x + 0.5, block.position.y + 0.5, block.position.z + 0.5);
      mesh.visible = true;
      this.nextPieceBlocks.push(mesh);
    }
  }

  public showFlashEffect(yLevel: number): void {
    if (this.prefersReducedMotion) return;

    // Reuse single flash plane
    if (!this.flashPlane) {
      this.flashPlane = new THREE.Mesh(this.sharedFlashGeometry, this.sharedFlashMaterial);
      this.flashPlane.rotation.x = -Math.PI / 2;
      this.scene.add(this.flashPlane);
    }

    // Clear existing timeout
    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }

    this.flashPlane.position.set(GRID_WIDTH / 2, yLevel + 0.5, GRID_DEPTH / 2);
    this.flashPlane.visible = true;

    this.flashTimeout = window.setTimeout(() => {
      if (this.flashPlane) {
        this.flashPlane.visible = false;
      }
    }, 200);
  }

  public rotateCamera(deltaX: number, deltaY: number): void {
    const sensitivity = 0.01;
    const radius = CAMERA_DISTANCE;

    const currentX = this.camera.position.x - GRID_WIDTH / 2;
    const currentY = this.camera.position.y - GRID_HEIGHT / 2;
    const currentZ = this.camera.position.z - GRID_DEPTH / 2;

    let theta = Math.atan2(currentZ, currentX);
    let phi = Math.acos(currentY / radius);

    theta -= deltaX * sensitivity;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * sensitivity));

    this.cameraTheta = theta;

    this.camera.position.x = radius * Math.sin(phi) * Math.cos(theta) + GRID_WIDTH / 2;
    this.camera.position.y = radius * Math.cos(phi) + GRID_HEIGHT / 2;
    this.camera.position.z = radius * Math.sin(phi) * Math.sin(theta) + GRID_DEPTH / 2;

    this.camera.lookAt(GRID_WIDTH / 2, GRID_HEIGHT / 2, GRID_DEPTH / 2);
  }

  public getCameraRelativeDirection(input: 'up' | 'down' | 'left' | 'right'): 'left' | 'right' | 'forward' | 'backward' {
    let angle = this.cameraTheta % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;

    const sector = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;

    const mappings: Record<number, Record<string, 'left' | 'right' | 'forward' | 'backward'>> = {
      0: { up: 'forward', down: 'backward', left: 'right', right: 'left' },
      1: { up: 'left', down: 'right', left: 'backward', right: 'forward' },
      2: { up: 'left', down: 'right', left: 'backward', right: 'forward' },
      3: { up: 'backward', down: 'forward', left: 'right', right: 'left' },
      4: { up: 'backward', down: 'forward', left: 'left', right: 'right' },
      5: { up: 'right', down: 'left', left: 'forward', right: 'backward' },
      6: { up: 'right', down: 'left', left: 'forward', right: 'backward' },
      7: { up: 'forward', down: 'backward', left: 'right', right: 'left' },
    };

    return mappings[sector][input];
  }

  public zoom(delta: number): void {
    const zoomSpeed = 0.1;
    this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoomLevel + delta * zoomSpeed));
    this.updateCameraZoom();
  }

  private updateCameraZoom(): void {
    const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
    const frustumSize = 25 / this.zoomLevel;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
  }

  public snapCameraToAxis(axis: 'x' | 'y' | 'z'): void {
    const distance = CAMERA_DISTANCE;
    const centerX = GRID_WIDTH / 2;
    const centerY = GRID_HEIGHT / 2;
    const centerZ = GRID_DEPTH / 2;

    switch (axis) {
      case 'x':
        this.camera.position.set(centerX + distance, centerY, centerZ);
        this.cameraTheta = 0;
        break;
      case 'y':
        this.camera.position.set(centerX, centerY + distance, centerZ);
        break;
      case 'z':
        this.camera.position.set(centerX, centerY, centerZ + distance);
        this.cameraTheta = Math.PI / 2;
        break;
    }

    this.camera.lookAt(centerX, centerY, centerZ);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
    this.nextPieceRenderer.render(this.nextPieceScene, this.nextPieceCamera);
  }

  public handleResize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.updateCameraZoom();
  }

  public dispose(): void {
    // Properly dispose of all Three.js resources
    this.sharedBlockGeometry.dispose();
    this.sharedBlockMaterial.dispose();
    this.sharedEdgeGeometry.dispose();
    this.sharedEdgeMaterial.dispose();
    this.sharedFlashGeometry.dispose();
    this.sharedFlashMaterial.dispose();

    if (this.gridLines) {
      this.gridLines.geometry.dispose();
      (this.gridLines.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    this.nextPieceRenderer.dispose();
  }
}
