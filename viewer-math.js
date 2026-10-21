// Keep framing independent of rendering so it can be checked for every asset.
export function poseBounds(THREE, root) {
  root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(root, true);
}

export function animationBounds(THREE, root, mixer, clip, samples = 24) {
  const bounds = new THREE.Box3();
  const previousScale = mixer.timeScale;
  mixer.timeScale = 1;
  if (clip && clip.duration > 0) {
    for (let i = 0; i <= samples; i++) {
      mixer.setTime(clip.duration * i / samples * 0.999999);
      bounds.union(poseBounds(THREE, root));
    }
    mixer.setTime(0);
  } else {
    bounds.union(poseBounds(THREE, root));
  }
  mixer.timeScale = previousScale;
  return bounds;
}

export function cameraFrame(THREE, bounds, aspect, fov = 45) {
  if (bounds.isEmpty()) throw new Error('The model has no visible geometry.');
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.01);
  const direction = new THREE.Vector3(0.6, 0.13, 1).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right);
  const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const tanH = tanV * Math.max(aspect, 0.01);
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(center);
        const depth = point.dot(direction);
        distance = Math.max(distance,
          Math.abs(point.dot(right)) / tanH + depth,
          Math.abs(point.dot(up)) / tanV + depth);
      }
    }
  }
  distance = Math.max(distance * 1.18, radius * 1.1);
  return {
    center, radius, distance,
    position: center.clone().addScaledVector(direction, distance),
    near: Math.max(radius / 100, 0.001),
    far: (distance + radius) * 20
  };
}
