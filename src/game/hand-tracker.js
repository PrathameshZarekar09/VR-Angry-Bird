/**
 * WebXR Hand Joint & Pinch Gesture Tracker
 * Handles hand tracking with index-and-thumb pinch gestures on both hands,
 * with seamless desktop mouse/pointer fallback for development testing.
 */

import { Vector3 } from '@iwsdk/core';

export class HandPinchTracker {
  constructor(world) {
    this.world = world;

    // Hand tracking state
    this.leftHand = {
      isPinching: false,
      pinchDistance: 1.0,
      pinchPosition: new Vector3(),
      indexTipPos: new Vector3(),
      thumbTipPos: new Vector3(),
      active: false,
    };

    this.rightHand = {
      isPinching: false,
      pinchDistance: 1.0,
      pinchPosition: new Vector3(),
      indexTipPos: new Vector3(),
      thumbTipPos: new Vector3(),
      active: false,
    };

    // Desktop mouse/pointer fallback state
    this.pointer = {
      isDown: false,
      worldPosition: new Vector3(),
      active: false,
    };

    this.tempVec = new Vector3();
    this.initDesktopPointer();
  }

  initDesktopPointer() {
    if (typeof window === 'undefined') return;

    const onPointerDown = (e) => {
      if (this.world?.session) return; // In XR, use hand tracking
      this.pointer.isDown = true;
      this.updatePointerRay(e);
    };

    const onPointerMove = (e) => {
      if (this.world?.session) return;
      if (this.pointer.isDown) {
        this.updatePointerRay(e);
      }
    };

    const onPointerUp = () => {
      if (this.world?.session) return;
      this.pointer.isDown = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  updatePointerRay(e) {
    const camera = this.world?.camera;
    if (!camera) return;

    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

    // Project ray from camera to slingshot plane (z ≈ -1.0)
    const rayPos = new Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const camPos = new Vector3();
    camera.getWorldPosition(camPos);

    const dir = rayPos.sub(camPos).normalize();
    const targetZ = -1.0;
    const dist = (targetZ - camPos.z) / dir.z;

    this.pointer.worldPosition.copy(camPos).addScaledVector(dir, dist);
    this.pointer.active = true;
  }

  /**
   * Updates hand joint poses and pinch distances from active XRFrame.
   * @param {XRFrame} frame
   */
  update(frame) {
    const session = this.world?.session;
    const refSpace = this.world?.xrReferenceSpace;

    if (!session || !frame || !refSpace) {
      // Use desktop pointer fallback
      return;
    }

    const inputSources = session.inputSources;
    this.leftHand.active = false;
    this.rightHand.active = false;

    for (let i = 0; i < inputSources.length; i++) {
      const source = inputSources[i];
      if (!source.hand) continue;

      const handedness = source.handedness;
      const handState = handedness === 'left' ? this.leftHand : this.rightHand;

      const indexJoint = source.hand.get('index-finger-tip');
      const thumbJoint = source.hand.get('thumb-tip');

      if (!indexJoint || !thumbJoint) continue;

      const indexPose = frame.getPose(indexJoint, refSpace);
      const thumbPose = frame.getPose(thumbJoint, refSpace);

      if (indexPose && thumbPose) {
        handState.active = true;

        handState.indexTipPos.set(
          indexPose.transform.position.x,
          indexPose.transform.position.y,
          indexPose.transform.position.z
        );

        handState.thumbTipPos.set(
          thumbPose.transform.position.x,
          thumbPose.transform.position.y,
          thumbPose.transform.position.z
        );

        // Distance between index finger tip and thumb tip
        this.tempVec.subVectors(handState.indexTipPos, handState.thumbTipPos);
        handState.pinchDistance = this.tempVec.length();

        // Fingertip midpoint
        handState.pinchPosition
          .copy(handState.indexTipPos)
          .add(handState.thumbTipPos)
          .multiplyScalar(0.5);

        // Pinch hysteresis (threshold 0.025m to engage, 0.040m to release)
        if (!handState.isPinching && handState.pinchDistance < 0.025) {
          handState.isPinching = true;
        } else if (handState.isPinching && handState.pinchDistance > 0.04) {
          handState.isPinching = false;
        }
      }
    }
  }

  /**
   * Returns active pinch state near a target coordinate.
   * @param {Vector3} targetPos - Target position (e.g. bird in slingshot)
   * @param {number} grabRange - Distance threshold to engage grab (0.20m)
   * @returns {{ isPinching: boolean, pinchPos: Vector3, isNear: boolean, hand: string }}
   */
  getPinchNear(targetPos, grabRange = 0.2) {
    // 1. Check right hand
    if (this.rightHand.active) {
      const dist = this.rightHand.pinchPosition.distanceTo(targetPos);
      const isNear = dist < grabRange;
      if (isNear && this.rightHand.isPinching) {
        return {
          isPinching: true,
          pinchPos: this.rightHand.pinchPosition,
          isNear: true,
          hand: 'right',
        };
      }
      if (isNear) {
        return {
          isPinching: false,
          pinchPos: this.rightHand.pinchPosition,
          isNear: true,
          hand: 'right',
        };
      }
    }

    // 2. Check left hand
    if (this.leftHand.active) {
      const dist = this.leftHand.pinchPosition.distanceTo(targetPos);
      const isNear = dist < grabRange;
      if (isNear && this.leftHand.isPinching) {
        return {
          isPinching: true,
          pinchPos: this.leftHand.pinchPosition,
          isNear: true,
          hand: 'left',
        };
      }
      if (isNear) {
        return {
          isPinching: false,
          pinchPos: this.leftHand.pinchPosition,
          isNear: true,
          hand: 'left',
        };
      }
    }

    // 3. Fallback: Desktop Mouse/Pointer
    if (this.pointer.active) {
      const dist = this.pointer.worldPosition.distanceTo(targetPos);
      const isNear = dist < grabRange * 1.5;
      if (this.pointer.isDown && isNear) {
        return {
          isPinching: true,
          pinchPos: this.pointer.worldPosition,
          isNear: true,
          hand: 'pointer',
        };
      }
      if (isNear) {
        return {
          isPinching: false,
          pinchPos: this.pointer.worldPosition,
          isNear: true,
          hand: 'pointer',
        };
      }
    }

    return {
      isPinching: false,
      pinchPos: new Vector3(),
      isNear: false,
      hand: 'none',
    };
  }
}
