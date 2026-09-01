/**
 * Low-Poly Procedural 3D Geometry Factory
 * Pure Three.js flat-shaded geometry with rich saturated palettes for VR.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from '@iwsdk/core';

// Shared PBR materials with flat shading for peak 90fps VR performance
export const Materials = {
  redBird: new MeshStandardMaterial({
    color: 0xee2222,
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true,
  }),
  yellowBird: new MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.35,
    metalness: 0.1,
    flatShading: true,
  }),
  bombBird: new MeshStandardMaterial({
    color: 0x222226,
    roughness: 0.6,
    metalness: 0.2,
    flatShading: true,
  }),
  beak: new MeshStandardMaterial({
    color: 0xff8800,
    roughness: 0.3,
    flatShading: true,
  }),
  white: new MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.5,
    flatShading: true,
  }),
  black: new MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    flatShading: true,
  }),
  pigSkin: new MeshStandardMaterial({
    color: 0x33cc44,
    roughness: 0.4,
    flatShading: true,
  }),
  pigSnout: new MeshStandardMaterial({
    color: 0x55ee66,
    roughness: 0.3,
    flatShading: true,
  }),
  wood: new MeshStandardMaterial({
    color: 0x965a28,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  }),
  woodLight: new MeshStandardMaterial({
    color: 0xba7a44,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true,
  }),
  stone: new MeshStandardMaterial({
    color: 0x7a828a,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  }),
  glass: new MeshStandardMaterial({
    color: 0x44ddff,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.3,
    flatShading: true,
  }),
  slingshotLeather: new MeshStandardMaterial({
    color: 0x5c3317,
    roughness: 0.9,
    flatShading: true,
  }),
  gold: new MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.8,
    roughness: 0.2,
    flatShading: true,
  }),
  grass: new MeshStandardMaterial({
    color: 0x44aa33,
    roughness: 0.9,
    flatShading: true,
  }),
  grassHill: new MeshStandardMaterial({
    color: 0x388e28,
    roughness: 0.9,
    flatShading: true,
  }),
  skyDome: new MeshBasicMaterial({
    color: 0x66c2ff,
    side: DoubleSide,
  }),
  cloud: new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    flatShading: true,
  }),
  foliage: new MeshStandardMaterial({
    color: 0x2e8b57,
    roughness: 0.8,
    flatShading: true,
  }),
  treeTrunk: new MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.9,
    flatShading: true,
  }),
  slingshotBand: new MeshBasicMaterial({
    color: 0x3388ff,
    side: DoubleSide,
  }),
  dropShadow: new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: DoubleSide,
  }),
};

/**
 * Creates the stylized Red Bird.
 */
export function createRedBirdMesh(radius = 0.12) {
  const root = new Group();
  root.name = 'RedBird';

  // Body
  const bodyGeo = new SphereGeometry(radius, 12, 10);
  const body = new Mesh(bodyGeo, Materials.redBird);
  root.add(body);

  // White belly patch
  const bellyGeo = new SphereGeometry(radius * 0.7, 8, 8);
  const belly = new Mesh(bellyGeo, Materials.white);
  belly.position.set(0, -radius * 0.3, radius * 0.65);
  belly.scale.set(1.0, 0.8, 0.5);
  root.add(belly);

  // Eyes (White spheres with black pupils)
  const eyeGeo = new SphereGeometry(radius * 0.28, 8, 8);
  const pupilGeo = new SphereGeometry(radius * 0.12, 6, 6);

  const leftEye = new Mesh(eyeGeo, Materials.white);
  leftEye.position.set(-radius * 0.38, radius * 0.2, radius * 0.8);
  const leftPupil = new Mesh(pupilGeo, Materials.black);
  leftPupil.position.set(-radius * 0.38, radius * 0.2, radius * 1.02);
  root.add(leftEye, leftPupil);

  const rightEye = new Mesh(eyeGeo, Materials.white);
  rightEye.position.set(radius * 0.38, radius * 0.2, radius * 0.8);
  const rightPupil = new Mesh(pupilGeo, Materials.black);
  rightPupil.position.set(radius * 0.38, radius * 0.2, radius * 1.02);
  root.add(rightEye, rightPupil);

  // Angry Eyebrows (Box rotated)
  const browGeo = new BoxGeometry(radius * 0.95, radius * 0.15, radius * 0.1);
  const leftBrow = new Mesh(browGeo, Materials.black);
  leftBrow.position.set(-radius * 0.35, radius * 0.45, radius * 0.8);
  leftBrow.rotation.z = -0.3;
  const rightBrow = new Mesh(browGeo, Materials.black);
  rightBrow.position.set(radius * 0.35, radius * 0.45, radius * 0.8);
  rightBrow.rotation.z = 0.3;
  root.add(leftBrow, rightBrow);

  // Beak (Cone)
  const beakGeo = new CylinderGeometry(0, radius * 0.35, radius * 0.6, 6);
  const beak = new Mesh(beakGeo, Materials.beak);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -radius * 0.05, radius * 1.15);
  root.add(beak);

  // Tail Feathers
  const tailGeo = new BoxGeometry(radius * 0.15, radius * 0.35, radius * 0.6);
  const tail = new Mesh(tailGeo, Materials.black);
  tail.position.set(0, radius * 0.1, -radius * 1.05);
  tail.rotation.x = -0.4;
  root.add(tail);

  // Top Crest Feathers
  const crestGeo = new BoxGeometry(radius * 0.12, radius * 0.45, radius * 0.2);
  const crest = new Mesh(crestGeo, Materials.redBird);
  crest.position.set(0, radius * 1.05, -radius * 0.2);
  crest.rotation.x = -0.35;
  root.add(crest);

  return root;
}

/**
 * Creates the stylized Yellow Bird (Chuck - Speed Dasher).
 */
export function createYellowBirdMesh(radius = 0.12) {
  const root = new Group();
  root.name = 'YellowBird';

  // Triangular pyramid body
  const bodyGeo = new CylinderGeometry(0, radius * 1.25, radius * 1.8, 4);
  const body = new Mesh(bodyGeo, Materials.yellowBird);
  body.rotation.y = Math.PI / 4;
  root.add(body);

  // Eyes
  const eyeGeo = new SphereGeometry(radius * 0.25, 8, 8);
  const pupilGeo = new SphereGeometry(radius * 0.1, 6, 6);

  const leftEye = new Mesh(eyeGeo, Materials.white);
  leftEye.position.set(-radius * 0.32, radius * 0.05, radius * 0.65);
  const leftPupil = new Mesh(pupilGeo, Materials.black);
  leftPupil.position.set(-radius * 0.32, radius * 0.05, radius * 0.85);

  const rightEye = new Mesh(eyeGeo, Materials.white);
  rightEye.position.set(radius * 0.32, radius * 0.05, radius * 0.65);
  const rightPupil = new Mesh(pupilGeo, Materials.black);
  rightPupil.position.set(radius * 0.32, radius * 0.05, radius * 0.85);
  root.add(leftEye, leftPupil, rightEye, rightPupil);

  // Brows
  const browGeo = new BoxGeometry(radius * 0.7, radius * 0.12, radius * 0.08);
  const leftBrow = new Mesh(browGeo, Materials.black);
  leftBrow.position.set(-radius * 0.3, radius * 0.26, radius * 0.65);
  leftBrow.rotation.z = -0.25;
  const rightBrow = new Mesh(browGeo, Materials.black);
  rightBrow.position.set(radius * 0.3, radius * 0.26, radius * 0.65);
  rightBrow.rotation.z = 0.25;
  root.add(leftBrow, rightBrow);

  // Beak
  const beakGeo = new CylinderGeometry(0, radius * 0.28, radius * 0.7, 4);
  const beak = new Mesh(beakGeo, Materials.beak);
  beak.rotation.x = Math.PI / 2;
  beak.rotation.y = Math.PI / 4;
  beak.position.set(0, -radius * 0.15, radius * 0.95);
  root.add(beak);

  // Black Top Crest
  const crestGeo = new BoxGeometry(radius * 0.15, radius * 0.6, radius * 0.15);
  const crest = new Mesh(crestGeo, Materials.black);
  crest.position.set(0, radius * 0.95, -radius * 0.1);
  crest.rotation.x = -0.4;
  root.add(crest);

  return root;
}

/**
 * Creates the stylized Bomb Bird (Exploder).
 */
export function createBombBirdMesh(radius = 0.14) {
  const root = new Group();
  root.name = 'BombBird';

  // Body
  const bodyGeo = new SphereGeometry(radius, 12, 10);
  const body = new Mesh(bodyGeo, Materials.bombBird);
  root.add(body);

  // Forehead Dot (Orange bomb marker)
  const dotGeo = new SphereGeometry(radius * 0.22, 8, 8);
  const dot = new Mesh(dotGeo, Materials.beak);
  dot.position.set(0, radius * 0.55, radius * 0.75);
  root.add(dot);

  // Eyes (White with tiny black pupils)
  const eyeGeo = new SphereGeometry(radius * 0.26, 8, 8);
  const pupilGeo = new SphereGeometry(radius * 0.08, 6, 6);

  const leftEye = new Mesh(eyeGeo, Materials.white);
  leftEye.position.set(-radius * 0.35, radius * 0.15, radius * 0.85);
  const leftPupil = new Mesh(pupilGeo, Materials.black);
  leftPupil.position.set(-radius * 0.35, radius * 0.15, radius * 1.05);

  const rightEye = new Mesh(eyeGeo, Materials.white);
  rightEye.position.set(radius * 0.35, radius * 0.15, radius * 0.85);
  const rightPupil = new Mesh(pupilGeo, Materials.black);
  rightPupil.position.set(radius * 0.35, radius * 0.15, radius * 1.05);
  root.add(leftEye, leftPupil, rightEye, rightPupil);

  // Beak
  const beakGeo = new CylinderGeometry(0, radius * 0.3, radius * 0.5, 6);
  const beak = new Mesh(beakGeo, Materials.beak);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -radius * 0.1, radius * 1.15);
  root.add(beak);

  // Fuse on top
  const fuseGeo = new CylinderGeometry(radius * 0.08, radius * 0.08, radius * 0.45, 6);
  const fuse = new Mesh(fuseGeo, Materials.wood);
  fuse.position.set(0, radius * 1.05, 0);
  fuse.rotation.z = 0.2;

  // Fuse spark tip
  const sparkGeo = new SphereGeometry(radius * 0.12, 6, 6);
  const sparkMat = new MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff6600,
    emissiveIntensity: 0.8,
    flatShading: true,
  });
  const spark = new Mesh(sparkGeo, sparkMat);
  spark.position.set(radius * 0.08, radius * 1.25, 0);
  root.add(fuse, spark);

  return root;
}

/**
 * Creates the Comical Enemy Pig with snouts, ears, and googly eyes.
 */
export function createPigMesh(radius = 0.13) {
  const root = new Group();
  root.name = 'Pig';

  // Body
  const bodyGeo = new SphereGeometry(radius, 12, 10);
  const body = new Mesh(bodyGeo, Materials.pigSkin);
  root.add(body);

  // Snout (Flat oval cylinder)
  const snoutGeo = new CylinderGeometry(radius * 0.45, radius * 0.45, radius * 0.25, 10);
  const snout = new Mesh(snoutGeo, Materials.pigSnout);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -radius * 0.05, radius * 0.95);
  snout.scale.set(1.2, 1.0, 0.85);
  root.add(snout);

  // Nostrils (Dark green/black cylinders)
  const nostrilGeo = new CylinderGeometry(radius * 0.09, radius * 0.09, radius * 0.1, 6);
  const leftNostril = new Mesh(nostrilGeo, Materials.black);
  leftNostril.rotation.x = Math.PI / 2;
  leftNostril.position.set(-radius * 0.18, -radius * 0.05, radius * 1.1);
  const rightNostril = new Mesh(nostrilGeo, Materials.black);
  rightNostril.rotation.x = Math.PI / 2;
  rightNostril.position.set(radius * 0.18, -radius * 0.05, radius * 1.1);
  root.add(leftNostril, rightNostril);

  // Googly Eyes (offset pupils for funny cartoon expression)
  const eyeGeo = new SphereGeometry(radius * 0.28, 8, 8);
  const pupilGeo = new SphereGeometry(radius * 0.11, 6, 6);

  const leftEye = new Mesh(eyeGeo, Materials.white);
  leftEye.position.set(-radius * 0.38, radius * 0.28, radius * 0.78);
  const leftPupil = new Mesh(pupilGeo, Materials.black);
  leftPupil.position.set(-radius * 0.32, radius * 0.32, radius * 1.02);

  const rightEye = new Mesh(eyeGeo, Materials.white);
  rightEye.position.set(radius * 0.38, radius * 0.28, radius * 0.78);
  const rightPupil = new Mesh(pupilGeo, Materials.black);
  rightPupil.position.set(radius * 0.44, radius * 0.24, radius * 1.02);

  root.add(leftEye, leftPupil, rightEye, rightPupil);

  // Ears (Small angled cones)
  const earGeo = new CylinderGeometry(0, radius * 0.28, radius * 0.45, 4);
  const leftEar = new Mesh(earGeo, Materials.pigSkin);
  leftEar.position.set(-radius * 0.7, radius * 0.75, 0);
  leftEar.rotation.z = 0.6;
  leftEar.rotation.x = -0.2;

  const rightEar = new Mesh(earGeo, Materials.pigSkin);
  rightEar.position.set(radius * 0.7, radius * 0.75, 0);
  rightEar.rotation.z = -0.6;
  rightEar.rotation.x = -0.2;

  root.add(leftEar, rightEar);

  return root;
}

/**
 * Creates the Full Iconic Slingshot Model with ground pedestal and fork branches.
 */
export function createSlingshotRingMesh() {
  const root = new Group();
  root.name = 'SlingshotRoot';

  // 1. Heavy Wooden Base Stand on Floor
  const baseGeo = new CylinderGeometry(0.28, 0.34, 0.12, 10);
  const base = new Mesh(baseGeo, Materials.wood);
  base.position.set(0, -1.05 + 0.06, 0); // Ground level
  root.add(base);

  // 2. Vertical Slingshot Tree Trunk
  const trunkGeo = new CylinderGeometry(0.065, 0.085, 0.8, 8);
  const trunk = new Mesh(trunkGeo, Materials.wood);
  trunk.position.set(0, -0.45, 0);
  root.add(trunk);

  // 3. Left Y-Fork Branch
  const forkLeftGeo = new CylinderGeometry(0.05, 0.065, 0.45, 8);
  const forkLeft = new Mesh(forkLeftGeo, Materials.wood);
  forkLeft.position.set(-0.16, -0.05, 0);
  forkLeft.rotation.z = 0.55;
  root.add(forkLeft);

  // 4. Right Y-Fork Branch
  const forkRightGeo = new CylinderGeometry(0.05, 0.065, 0.45, 8);
  const forkRight = new Mesh(forkRightGeo, Materials.wood);
  forkRight.position.set(0.16, -0.05, 0);
  forkRight.rotation.z = -0.55;
  root.add(forkRight);

  // 5. Golden Mount Brackets at tips
  const bracketGeo = new TorusGeometry(0.055, 0.015, 6, 12);
  const leftBracket = new Mesh(bracketGeo, Materials.gold);
  leftBracket.position.set(-0.28, 0.12, 0);
  leftBracket.rotation.y = Math.PI / 2;

  const rightBracket = new Mesh(bracketGeo, Materials.gold);
  rightBracket.position.set(0.28, 0.12, 0);
  rightBracket.rotation.y = Math.PI / 2;
  root.add(leftBracket, rightBracket);

  // 6. Left and Right Rubber Band Mounting Nodes
  const mountGeo = new SphereGeometry(0.035, 8, 8);
  const mountMat = new MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x0088cc,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    flatShading: true,
  });

  const leftMount = new Mesh(mountGeo, mountMat);
  leftMount.position.set(-0.28, 0.12, 0);
  leftMount.name = 'LeftMount';

  const rightMount = new Mesh(mountGeo, mountMat);
  rightMount.position.set(0.28, 0.12, 0);
  rightMount.name = 'RightMount';
  root.add(leftMount, rightMount);

  // 7. Glowing Holographic Aiming Ring in Center
  const ringGeo = new TorusGeometry(0.26, 0.018, 8, 20);
  const ringMat = new MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x0088cc,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
    flatShading: true,
  });
  const ring = new Mesh(ringGeo, ringMat);
  ring.position.set(0, 0, 0);
  root.add(ring);

  // 8. Crosshair reticle
  const reticleGeo = new RingGeometry(0.07, 0.08, 16);
  const reticleMat = new MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.6,
    side: DoubleSide,
  });
  const reticle = new Mesh(reticleGeo, reticleMat);
  root.add(reticle);

  return root;
}

/**
 * Creates dynamic dual rubber band ribbon meshes connecting slingshot prongs to bird.
 */
export function createRubberBandMeshes() {
  const geoLeft = new BufferGeometry();
  const geoRight = new BufferGeometry();

  const posLeft = new Float32Array(18);
  const posRight = new Float32Array(18);

  geoLeft.setAttribute('position', new Float32BufferAttribute(posLeft, 3));
  geoRight.setAttribute('position', new Float32BufferAttribute(posRight, 3));

  const matLeft = new MeshBasicMaterial({
    color: 0x3388ff,
    side: DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const matRight = new MeshBasicMaterial({
    color: 0x3388ff,
    side: DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  const meshLeft = new Mesh(geoLeft, matLeft);
  const meshRight = new Mesh(geoRight, matRight);
  meshLeft.name = 'RubberBandLeft';
  meshRight.name = 'RubberBandRight';

  const group = new Group();
  group.add(meshLeft, meshRight);
  return { group, meshLeft, meshRight, matLeft, matRight };
}

/**
 * Updates rubber band ribbon geometry given left prong, right prong, and bird coordinates.
 */
export function updateRubberBandGeometry(meshLeft, meshRight, leftProng, rightProng, birdPos, width = 0.025) {
  // Left Band Ribbon (quad from leftProng to birdPos)
  const posL = meshLeft.geometry.attributes.position.array;
  posL[0] = leftProng.x;
  posL[1] = leftProng.y + width;
  posL[2] = leftProng.z;

  posL[3] = leftProng.x;
  posL[4] = leftProng.y - width;
  posL[5] = leftProng.z;

  posL[6] = birdPos.x;
  posL[7] = birdPos.y + width;
  posL[8] = birdPos.z;

  posL[9] = birdPos.x;
  posL[10] = birdPos.y + width;
  posL[11] = birdPos.z;

  posL[12] = leftProng.x;
  posL[13] = leftProng.y - width;
  posL[14] = leftProng.z;

  posL[15] = birdPos.x;
  posL[16] = birdPos.y - width;
  posL[17] = birdPos.z;
  meshLeft.geometry.attributes.position.needsUpdate = true;

  // Right Band Ribbon (quad from rightProng to birdPos)
  const posR = meshRight.geometry.attributes.position.array;
  posR[0] = rightProng.x;
  posR[1] = rightProng.y + width;
  posR[2] = rightProng.z;

  posR[3] = rightProng.x;
  posR[4] = rightProng.y - width;
  posR[5] = rightProng.z;

  posR[6] = birdPos.x;
  posR[7] = birdPos.y + width;
  posR[8] = birdPos.z;

  posR[9] = birdPos.x;
  posR[10] = birdPos.y + width;
  posR[11] = birdPos.z;

  posR[12] = rightProng.x;
  posR[13] = rightProng.y - width;
  posR[14] = rightProng.z;

  posR[15] = birdPos.x;
  posR[16] = birdPos.y - width;
  posR[17] = birdPos.z;
  meshRight.geometry.attributes.position.needsUpdate = true;
}

/**
 * Creates structural building blocks (Wood, Stone, Glass, TNT).
 */
export function createBlockMesh(dimensions = [0.8, 0.15, 0.15], materialType = 'wood') {
  const [w, h, d] = dimensions;
  const geo = new BoxGeometry(w, h, d);
  let mat = Materials.wood;

  if (materialType === 'stone') mat = Materials.stone;
  else if (materialType === 'glass') mat = Materials.glass;
  else if (materialType === 'woodLight') mat = Materials.woodLight;
  else if (materialType === 'tnt') mat = createTNTMaterial();

  const mesh = new Mesh(geo, mat);
  mesh.name = `Block_${materialType}`;
  return mesh;
}

/**
 * Creates TNT Barrel Mesh with striped danger texture.
 */
export function createTNTBarrelMesh(radius = 0.15, height = 0.35) {
  const root = new Group();
  root.name = 'TNT_Barrel';

  const barrelGeo = new CylinderGeometry(radius, radius, height, 12);
  const barrel = new Mesh(barrelGeo, createTNTMaterial());
  root.add(barrel);

  // Top and bottom metallic rim rings
  const rimGeo = new TorusGeometry(radius, 0.015, 6, 16);
  const topRim = new Mesh(rimGeo, Materials.black);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = height / 2 - 0.01;

  const botRim = new Mesh(rimGeo, Materials.black);
  botRim.rotation.x = Math.PI / 2;
  botRim.position.y = -height / 2 + 0.01;

  root.add(topRim, botRim);
  return root;
}

function createTNTMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cc2222';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(0, 38, 128, 52);

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TNT', 64, 64);

  const texture = new CanvasTexture(canvas);
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.1,
    flatShading: true,
  });
}

/**
 * Creates subtle drop shadow disc to anchor objects to the ground.
 */
export function createDropShadowMesh(radius = 0.2) {
  const geo = new RingGeometry(0, radius, 16);
  const mesh = new Mesh(geo, Materials.dropShadow);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.005;
  mesh.name = 'DropShadow';
  return mesh;
}

/**
 * Creates a complete immersive low-poly VR environment (Meadow Island, Sky, Clouds, Trees, Lights).
 */
export function createVREnvironment() {
  const root = new Group();
  root.name = 'VREnvironment';

  // 1. Hemisphere Light (Soft Sky Blue & Warm Ground Green)
  const hemiLight = new HemisphereLight(0x99ddff, 0x336622, 0.85);
  root.add(hemiLight);

  // 2. Sunlight (Warm cartoon directional sun)
  const sunLight = new DirectionalLight(0xfffaed, 1.2);
  sunLight.position.set(4, 8, 3);
  root.add(sunLight);

  // 3. Grassy Meadow Floor Island
  const floorGeo = new CylinderGeometry(18, 20, 0.6, 24);
  const floor = new Mesh(floorGeo, Materials.grass);
  floor.position.set(0, -0.3, -2);
  root.add(floor);

  // 4. Background Rolling Hills
  for (let i = 0; i < 7; i++) {
    const hillRadius = 4 + Math.random() * 5;
    const hillGeo = new SphereGeometry(hillRadius, 8, 6);
    const hill = new Mesh(hillGeo, Materials.grassHill);
    const angle = (i / 7) * Math.PI * 2;
    const dist = 14 + Math.random() * 4;
    hill.position.set(Math.cos(angle) * dist, -hillRadius * 0.7, Math.sin(angle) * dist - 2);
    root.add(hill);
  }

  // 5. Stylized Low-Poly Cartoon Trees
  const treePositions = [
    [-3.2, 0, -3.5],
    [3.5, 0, -3.2],
    [-4.5, 0, -1.5],
    [4.8, 0, -1.8],
    [-2.8, 0, -5.5],
    [2.8, 0, -5.8],
    [-5.0, 0, -4.0],
    [5.2, 0, -4.2],
  ];

  treePositions.forEach(([tx, ty, tz]) => {
    const tree = new Group();
    const trunkGeo = new CylinderGeometry(0.12, 0.18, 1.2, 6);
    const trunk = new Mesh(trunkGeo, Materials.treeTrunk);
    trunk.position.y = 0.6;

    const foliage1 = new Mesh(new SphereGeometry(0.7, 6, 5), Materials.foliage);
    foliage1.position.y = 1.4;

    const foliage2 = new Mesh(new SphereGeometry(0.5, 6, 5), Materials.foliage);
    foliage2.position.y = 1.9;

    tree.add(trunk, foliage1, foliage2);
    tree.position.set(tx, ty, tz);
    root.add(tree);
  });

  // 6. Floating Low-Poly Clouds in Sky
  const cloudPositions = [
    [-6, 6, -8],
    [5, 7, -10],
    [0, 8, -12],
    [-8, 5, -5],
    [7, 6, -6],
  ];

  cloudPositions.forEach(([cx, cy, cz]) => {
    const cloud = new Group();
    for (let j = 0; j < 4; j++) {
      const puff = new Mesh(new SphereGeometry(0.8 + Math.random() * 0.5, 6, 5), Materials.cloud);
      puff.position.set((j - 1.5) * 0.7, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4);
      cloud.add(puff);
    }
    cloud.position.set(cx, cy, cz);
    root.add(cloud);
  });

  return root;
}
