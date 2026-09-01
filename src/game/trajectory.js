/**
 * Real-time Trajectory Arc Prediction
 * Computes Havok gravity parabolic arc and renders dotted beads.
 */

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from '@iwsdk/core';

export class TrajectoryPredictor {
  constructor(numPoints = 26, stepTime = 0.04) {
    this.numPoints = numPoints;
    this.stepTime = stepTime;
    this.container = new Group();
    this.container.name = 'TrajectoryPredictor';

    this.beadGeo = new SphereGeometry(0.016, 6, 6);
    this.beadMat = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
    });

    this.beads = [];
    for (let i = 0; i < this.numPoints; i++) {
      const bead = new Mesh(this.beadGeo, this.beadMat.clone());
      bead.visible = false;
      this.beads.push(bead);
      this.container.add(bead);
    }

    this.gravity = new Vector3(0, -9.81, 0);
  }

  getContainer() {
    return this.container;
  }

  /**
   * Updates predicted trajectory arc.
   * @param {Vector3} startPos - Bird launch origin
   * @param {Vector3} velocity - Initial impulse velocity vector
   * @param {number} tensionRatio - 0.0 to 1.0 (for color coding)
   */
  update(startPos, velocity, tensionRatio = 0.5) {
    // Interpolate color: Blue (0-30%) -> Yellow (31-70%) -> Red (71-100%)
    let colorHex = 0x00aaff;
    if (tensionRatio > 0.7) {
      colorHex = 0xff2222;
    } else if (tensionRatio > 0.3) {
      colorHex = 0xffcc00;
    }

    for (let i = 0; i < this.numPoints; i++) {
      const t = (i + 1) * this.stepTime;
      const x = startPos.x + velocity.x * t;
      const y = startPos.y + velocity.y * t + 0.5 * this.gravity.y * t * t;
      const z = startPos.z + velocity.z * t;

      const bead = this.beads[i];
      if (y < 0.05) {
        // Floor hit
        bead.visible = false;
      } else {
        bead.visible = true;
        bead.position.set(x, y, z);
        bead.material.color.setHex(colorHex);

        // Subtle fading along arc
        const alpha = Math.max(0.2, 1.0 - (i / this.numPoints) * 0.7);
        bead.material.opacity = alpha;

        // Bead size scaling
        const s = Math.max(0.6, 1.0 - (i / this.numPoints) * 0.4);
        bead.scale.set(s, s, s);
      }
    }
  }

  hide() {
    for (const bead of this.beads) {
      bead.visible = false;
    }
  }
}
