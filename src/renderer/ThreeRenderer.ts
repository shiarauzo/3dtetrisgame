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

export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private gridLines: THREE.LineSegments | null = null;
  private placedBlocksMeshes: THREE.Mesh[] = [];
  private currentPieceMeshes: THREE.Mesh[] = [];
  private nextPieceRenderer: THREE.WebGLRenderer;
  private nextPieceScene: THREE.Scene;
  private nextPieceCamera: THREE.OrthographicCamera;
  private flashPlanes: THREE.Mesh[] = [];
  private prefersReducedMotion: boolean;
  private zoomLevel = 1;
  private readonly MIN_ZOOM = 0.5;
  private readonly MAX_ZOOM = 2;

  constructor(canvas: HTMLCanvasElement, nextPieceCanvas: HTMLCanvasElement) {
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Main scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);

    // Orthographic camera for isometric view
    const aspect = canvas.width / canvas.height;
    const frustumSize = 15;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    // Position camera for isometric view
    this.camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE);
    this.camera.lookAt(GRID_WIDTH / 2, GRID_HEIGHT / 2, GRID_DEPTH / 2);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.width, canvas.height);

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
    this.nextPieceRenderer.setSize(nextPieceCanvas.width, nextPieceCanvas.height);

    const npLight = new THREE.AmbientLight(0xffffff, 1);
    this.nextPieceScene.add(npLight);

    // Create grid
    this.createGrid();
  }

  private createGrid(): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    // Floor grid (5x5)
    for (let x = 0; x <= GRID_WIDTH; x++) {
      positions.push(x, 0, 0, x, 0, GRID_DEPTH);
    }
    for (let z = 0; z <= GRID_DEPTH; z++) {
      positions.push(0, 0, z, GRID_WIDTH, 0, z);
    }

    // Vertical lines at corners
    positions.push(0, 0, 0, 0, GRID_HEIGHT, 0);
    positions.push(GRID_WIDTH, 0, 0, GRID_WIDTH, GRID_HEIGHT, 0);
    positions.push(0, 0, GRID_DEPTH, 0, GRID_HEIGHT, GRID_DEPTH);
    positions.push(GRID_WIDTH, 0, GRID_DEPTH, GRID_WIDTH, GRID_HEIGHT, GRID_DEPTH);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ color: GRID_LINE_COLOR });
    this.gridLines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.gridLines);
  }

  private createBlockMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: BLOCK_COLOR });
    const mesh = new THREE.Mesh(geometry, material);

    // Add yellow edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: EDGE_COLOR });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    mesh.add(edgeLines);

    return mesh;
  }

  public renderPlacedBlocks(blocks: Position[]): void {
    // Remove old meshes
    this.placedBlocksMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.placedBlocksMeshes = [];

    // Add new meshes
    blocks.forEach((pos) => {
      const mesh = this.createBlockMesh();
      mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
      this.scene.add(mesh);
      this.placedBlocksMeshes.push(mesh);
    });
  }

  public renderCurrentPiece(piece: Piece | null): void {
    // Remove old meshes
    this.currentPieceMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.currentPieceMeshes = [];

    if (!piece) return;

    // Add new meshes
    piece.blocks.forEach((block) => {
      const mesh = this.createBlockMesh();
      const worldPos = {
        x: piece.position.x + block.position.x,
        y: piece.position.y + block.position.y,
        z: piece.position.z + block.position.z,
      };
      mesh.position.set(worldPos.x + 0.5, worldPos.y + 0.5, worldPos.z + 0.5);
      this.scene.add(mesh);
      this.currentPieceMeshes.push(mesh);
    });
  }

  public renderNextPiece(piece: Piece | null): void {
    // Clear previous next piece
    while (this.nextPieceScene.children.length > 1) {
      this.nextPieceScene.remove(this.nextPieceScene.children[1]);
    }

    if (!piece) return;

    piece.blocks.forEach((block) => {
      const mesh = this.createBlockMesh();
      mesh.position.set(block.position.x + 0.5, block.position.y + 0.5, block.position.z + 0.5);
      this.nextPieceScene.add(mesh);
    });
  }

  public showFlashEffect(yLevel: number): void {
    // Skip animation if user prefers reduced motion
    if (this.prefersReducedMotion) return;

    const geometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_DEPTH);
    const material = new THREE.MeshBasicMaterial({ color: FLASH_COLOR, transparent: true, opacity: 0.7 });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(GRID_WIDTH / 2, yLevel + 0.5, GRID_DEPTH / 2);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);
    this.flashPlanes.push(plane);

    // Fade out and remove
    setTimeout(() => {
      this.scene.remove(plane);
      this.flashPlanes = this.flashPlanes.filter((p) => p !== plane);
    }, 200);
  }

  public rotateCamera(deltaX: number, deltaY: number): void {
    const sensitivity = 0.01;
    const radius = CAMERA_DISTANCE;

    // Calculate current spherical coordinates
    const currentX = this.camera.position.x - GRID_WIDTH / 2;
    const currentY = this.camera.position.y - GRID_HEIGHT / 2;
    const currentZ = this.camera.position.z - GRID_DEPTH / 2;

    let theta = Math.atan2(currentZ, currentX);
    let phi = Math.acos(currentY / radius);

    theta -= deltaX * sensitivity;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * sensitivity));

    // Convert back to cartesian
    this.camera.position.x = radius * Math.sin(phi) * Math.cos(theta) + GRID_WIDTH / 2;
    this.camera.position.y = radius * Math.cos(phi) + GRID_HEIGHT / 2;
    this.camera.position.z = radius * Math.sin(phi) * Math.sin(theta) + GRID_DEPTH / 2;

    this.camera.lookAt(GRID_WIDTH / 2, GRID_HEIGHT / 2, GRID_DEPTH / 2);
  }

  public zoom(delta: number): void {
    const zoomSpeed = 0.1;
    this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoomLevel + delta * zoomSpeed));
    this.updateCameraZoom();
  }

  private updateCameraZoom(): void {
    const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
    const frustumSize = 15 / this.zoomLevel;
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
        break;
      case 'y':
        this.camera.position.set(centerX, centerY + distance, centerZ);
        break;
      case 'z':
        this.camera.position.set(centerX, centerY, centerZ + distance);
        break;
    }

    this.camera.lookAt(centerX, centerY, centerZ);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
    this.nextPieceRenderer.render(this.nextPieceScene, this.nextPieceCamera);
  }

  public handleResize(width: number, height: number): void {
    const aspect = width / height;
    const frustumSize = 15;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
