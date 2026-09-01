/**
 * Slingshot Interaction System
 * Handles hand tracking pinch-and-pull mechanics, elastic rubber band rendering,
 * real-time trajectory calculation, and Havok physics launch impulse in VR.
 */

import {
  createSystem,
  PhysicsBody,
  PhysicsManipulation,
  PhysicsShape,
  PhysicsShapeType,
  PhysicsState,
  Vector3,
} from '@iwsdk/core';
import { BirdComponent, SlingshotComponent } from '../components.js';
import { sound } from '../game/audio.js';
import {
  createBombBirdMesh,
  createDropShadowMesh,
  createRedBirdMesh,
  createRubberBandMeshes,
  createSlingshotRingMesh,
  createVREnvironment,
  createYellowBirdMesh,
  updateRubberBandGeometry,
} from '../game/geometry.js';
import { HandPinchTracker } from '../game/hand-tracker.js';
import { particles } from '../game/particles.js';
import { TrajectoryPredictor } from '../game/trajectory.js';
import { GameFlowSystem } from './game-flow-system.js';

export class SlingshotSystem extends createSystem({
  slingshots: { required: [SlingshotComponent] },
  birds: { required: [BirdComponent] },
}) {
  constructor() {
    super(...arguments);
    // Slingshot placement right in front of the VR user at chest height
    this.anchorPos = new Vector3(0, 1.05, -0.75);
    this.leftProngPos = new Vector3(-0.28, 1.17, -0.75);
    this.rightProngPos = new Vector3(0.28, 1.17, -0.75);

    this.currentBirdEntity = null;
    this.currentBirdType = 'red';
    this.isGrabbed = false;
    this.grabbedHand = 'none';

    this.maxPullRadius = 0.55;
    this.launchMultiplier = 15.0;

    this.birdPos = new Vector3().copy(this.anchorPos);
    this.pullVector = new Vector3();
    this.launchVelocity = new Vector3();

    this.handTracker = null;
    this.trajectory = null;
    this.rubberBands = null;

    this.hoverPulseTime = 0;
    this.dropShadow = null;
    this.vrEnv = null;
  }

  init() {
    // 1. Add Rich VR Environment (Island, Skies, Trees, Sun Light)
    this.vrEnv = createVREnvironment();
    this.world.scene.add(this.vrEnv);

    // 2. Add Hand Tracking & Effects Containers
    this.handTracker = new HandPinchTracker(this.world);
    this.trajectory = new TrajectoryPredictor(28, 0.038);
    this.rubberBands = createRubberBandMeshes();

    this.world.scene.add(this.trajectory.getContainer());
    this.world.scene.add(this.rubberBands.group);
    this.world.scene.add(particles.getContainer());

    // 3. Create Iconic Slingshot Entity
    const slingMesh = createSlingshotRingMesh();
    slingMesh.position.copy(this.anchorPos);
    this.slingshotEntity = this.world.createTransformEntity(slingMesh);
    this.slingshotEntity.addComponent(SlingshotComponent, {
      tension: 0,
      isGrabbed: false,
    });

    // Floor drop shadow for slingshot stand
    this.dropShadow = createDropShadowMesh(0.38);
    this.dropShadow.position.set(this.anchorPos.x, 0.005, this.anchorPos.z);
    this.world.scene.add(this.dropShadow);

    // Initial rubber band resting geometry
    updateRubberBandGeometry(
      this.rubberBands.meshLeft,
      this.rubberBands.meshRight,
      this.leftProngPos,
      this.rightProngPos,
      this.anchorPos
    );
  }

  /**
   * Spawns a new bird inside the slingshot.
   * @param {string} birdType - 'red' | 'yellow' | 'bomb'
   */
  spawnBird(birdType = 'red') {
    if (this.currentBirdEntity) {
      try {
        this.currentBirdEntity.dispose();
      } catch (_) {}
      this.currentBirdEntity = null;
    }

    this.currentBirdType = birdType;
    let birdMesh;

    if (birdType === 'yellow') {
      birdMesh = createYellowBirdMesh(0.12);
    } else if (birdType === 'bomb') {
      birdMesh = createBombBirdMesh(0.14);
    } else {
      birdMesh = createRedBirdMesh(0.12);
    }

    birdMesh.position.copy(this.anchorPos);
    this.birdPos.copy(this.anchorPos);

    this.currentBirdEntity = this.world.createTransformEntity(birdMesh);
    this.currentBirdEntity.addComponent(BirdComponent, {
      type: birdType,
      state: 'in_sling',
      hasUsedAbility: false,
      flightTime: 0,
    });

    this.isGrabbed = false;
    this.trajectory.hide();

    updateRubberBandGeometry(
      this.rubberBands.meshLeft,
      this.rubberBands.meshRight,
      this.leftProngPos,
      this.rightProngPos,
      this.anchorPos
    );
  }

  update(delta, time) {
    particles.update(delta);

    if (this.world?.xrFrame) {
      this.handTracker.update(this.world.xrFrame);
    }

    if (!this.currentBirdEntity || !this.currentBirdEntity.object3D) return;

    if (!this.currentBirdEntity.hasComponent(BirdComponent)) return;
    const birdState = this.currentBirdEntity.getValue(BirdComponent, 'state');
    if (birdState !== 'in_sling') return;

    const birdMesh = this.currentBirdEntity.object3D;

    // Check hand pinch proximity
    const pinchStatus = this.handTracker.getPinchNear(this.birdPos, 0.25);

    // 1. Grab Initiation
    if (!this.isGrabbed && pinchStatus.isPinching && pinchStatus.isNear) {
      this.isGrabbed = true;
      this.grabbedHand = pinchStatus.hand;

      sound.playPinchHaptic();
      particles.spawnPinchConfetti(pinchStatus.pinchPos);
    }

    // 2. While Grabbed & Pulling
    if (this.isGrabbed) {
      if (pinchStatus.isPinching) {
        this.pullVector.subVectors(pinchStatus.pinchPos, this.anchorPos);

        // Disallow pulling forward into the target scene
        if (this.pullVector.z < 0) {
          this.pullVector.z = 0;
        }

        // Clamp to max pull radius
        const pullDist = this.pullVector.length();
        if (pullDist > this.maxPullRadius) {
          this.pullVector.multiplyScalar(this.maxPullRadius / pullDist);
        }

        this.birdPos.copy(this.anchorPos).add(this.pullVector);
        birdMesh.position.copy(this.birdPos);

        const currentPull = this.pullVector.length();
        const tension = Math.min(1.0, currentPull / this.maxPullRadius);

        sound.updateStretchSound(tension);

        let bandColor = 0x3388ff;
        if (tension > 0.7) bandColor = 0xff2222;
        else if (tension > 0.3) bandColor = 0xffcc00;

        this.rubberBands.matLeft.color.setHex(bandColor);
        this.rubberBands.matRight.color.setHex(bandColor);

        updateRubberBandGeometry(
          this.rubberBands.meshLeft,
          this.rubberBands.meshRight,
          this.leftProngPos,
          this.rightProngPos,
          this.birdPos
        );

        this.launchVelocity
          .subVectors(this.anchorPos, this.birdPos)
          .multiplyScalar(this.launchMultiplier);
        this.launchVelocity.y += tension * 1.5;

        if (tension > 0.08) {
          this.trajectory.update(this.birdPos, this.launchVelocity, tension);
        } else {
          this.trajectory.hide();
        }

        birdMesh.lookAt(
          this.birdPos.x + this.launchVelocity.x,
          this.birdPos.y + this.launchVelocity.y,
          this.birdPos.z + this.launchVelocity.z
        );
      } else {
        this.releaseBird();
      }
    } else {
      if (pinchStatus.isNear) {
        this.hoverPulseTime += delta * 6;
        const pulse = 0.5 + Math.sin(this.hoverPulseTime) * 0.4;
        birdMesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setHex(0x0088cc);
            child.material.emissiveIntensity = pulse;
          }
        });
      } else {
        birdMesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissiveIntensity = 0;
          }
        });
      }
    }
  }

  releaseBird() {
    this.isGrabbed = false;
    sound.stopStretchSound();
    this.trajectory.hide();

    const pullDist = this.pullVector.length();
    const tension = pullDist / this.maxPullRadius;

    updateRubberBandGeometry(
      this.rubberBands.meshLeft,
      this.rubberBands.meshRight,
      this.leftProngPos,
      this.rightProngPos,
      this.anchorPos
    );
    this.rubberBands.matLeft.color.setHex(0x3388ff);
    this.rubberBands.matRight.color.setHex(0x3388ff);

    if (tension < 0.12) {
      this.birdPos.copy(this.anchorPos);
      if (this.currentBirdEntity?.object3D) {
        this.currentBirdEntity.object3D.position.copy(this.anchorPos);
      }
      return;
    }

    sound.playLaunch();

    this.currentBirdEntity.setValue(BirdComponent, 'state', 'flying');

    this.launchVelocity
      .subVectors(this.anchorPos, this.birdPos)
      .multiplyScalar(this.launchMultiplier);
    this.launchVelocity.y += tension * 1.5;

    let radius = 0.12;
    let density = 2.5;
    if (this.currentBirdType === 'bomb') {
      radius = 0.14;
      density = 4.0;
    } else if (this.currentBirdType === 'yellow') {
      density = 2.0;
    }

    this.currentBirdEntity.addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Sphere,
      dimensions: [radius, 0, 0],
      density,
      restitution: 0.35,
      friction: 0.5,
    });

    this.currentBirdEntity.addComponent(PhysicsBody, {
      state: PhysicsState.Dynamic,
      linearDamping: 0.02,
      angularDamping: 0.05,
      gravityFactor: 1.0,
    });

    this.currentBirdEntity.addComponent(PhysicsManipulation, {
      linearVelocity: [
        this.launchVelocity.x,
        this.launchVelocity.y,
        this.launchVelocity.z,
      ],
      angularVelocity: [
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ],
    });

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.onBirdLaunched(this.currentBirdEntity);
      }
    } catch (_) {}
  }
}
