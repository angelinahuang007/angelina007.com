import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';

type LookControlsOptions = {
  onChange: () => void;
  onHeading?: (degrees: number) => void;
  onTap?: () => void;
  reducedMotion: boolean;
};

type MotionResult = 'enabled' | 'denied' | 'unsupported';
type PermissionDeviceOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const MIN_PITCH = MathUtils.degToRad(-50);
const MAX_PITCH = MathUtils.degToRad(48);
const ANGLE_EPSILON = 0.00002;
const POINTER_SPEED = 0.0035;
const KEY_SPEED = 1.15;
const TAP_SLOP = 7;
const TAP_MAX_DURATION = 450;
const TAP_CLICK_DELAY = 700;
const MOUSE_YAW_RANGE = Math.PI * 2;
const MOUSE_PITCH_RANGE = MathUtils.degToRad(70);
// Permission belongs to this document, not an individual room's controls.
let motionPermissionGranted = false;
const DIRECTION_KEYS = new Set([
  'KeyA', 'KeyD', 'KeyW', 'KeyS',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
]);

/** Fixed-position looking: positive yaw turns right, positive pitch looks up. */
export function createLookControls(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  options: LookControlsOptions,
) {
  const direction = camera.getWorldDirection(new Vector3());
  const initialYaw = Math.atan2(direction.x, -direction.z);
  const initialPitch = MathUtils.clamp(Math.asin(direction.y), MIN_PITCH, MAX_PITCH);
  let yaw = initialYaw;
  let pitch = initialPitch;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let lastHeading = Number.NaN;
  let disposed = false;
  const viewEuler = new Euler(0, 0, 0, 'YXZ');
  const pressed = new Set<string>();

  let pointer: {
    id: number;
    touch: boolean;
    mouse: boolean;
    dragging: boolean;
    tapEligible: boolean;
    startedAt: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null = null;
  let completedTap: { id: number; touch: boolean; x: number; y: number; endedAt: number } | null = null;
  let mouseLook: { x: number; y: number; yaw: number; pitch: number } | null = null;

  let motionEnabled = false;
  let permissionEpoch = 0;
  let pendingPermission: Promise<MotionResult> | null = null;
  let previousSensorYaw: number | null = null;
  let previousSensorPitch = 0;
  const sensorEuler = new Euler(0, 0, 0, 'YXZ');
  const sensorQuaternion = new Quaternion();
  const screenQuaternion = new Quaternion();
  const screenAxis = new Vector3(0, 0, 1);
  const sensorDirection = new Vector3();
  // Device sensors look out of the handset's back; cameras look along local -Z.
  const handsetToCamera = new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);

  function applyOrientation() {
    camera.quaternion.setFromEuler(viewEuler.set(pitch, -yaw, 0, 'YXZ'));
    const heading = MathUtils.euclideanModulo(MathUtils.radToDeg(yaw), 360);
    if (!Number.isFinite(lastHeading) || Math.abs(heading - lastHeading) > 0.05) {
      lastHeading = heading;
      options.onHeading?.(heading);
    }
  }

  function turn(yawDelta: number, pitchDelta = 0) {
    if (disposed || !Number.isFinite(yawDelta) || !Number.isFinite(pitchDelta)) return;
    const nextPitch = MathUtils.clamp(targetPitch + pitchDelta, MIN_PITCH, MAX_PITCH);
    if (yawDelta === 0 && nextPitch === targetPitch) return;
    if (mouseLook) { mouseLook.yaw += yawDelta; mouseLook.pitch += nextPitch - targetPitch; }
    targetYaw += yawDelta;
    targetPitch = nextPitch;
    options.onChange();
  }

  function face(headingDegrees: number) {
    if (disposed || !Number.isFinite(headingDegrees)) return;
    const absoluteYaw = MathUtils.degToRad(headingDegrees);
    // Replace the pending target, choosing the shortest path from the current view.
    // Repeated navigation clicks must not accumulate relative turns while easing.
    const delta = Math.atan2(Math.sin(absoluteYaw - yaw), Math.cos(absoluteYaw - yaw));
    if (mouseLook) mouseLook.yaw += yaw + delta - targetYaw;
    targetYaw = yaw + delta;
    options.onChange();
  }

  function clearPointer() {
    const id = pointer?.id;
    pointer = null;
    if (id !== undefined && canvas.hasPointerCapture(id)) {
      try { canvas.releasePointerCapture(id); } catch { /* Capture may already be lost. */ }
    }
  }

  function capturePointer(id: number) {
    try { canvas.setPointerCapture(id); } catch { /* Cancelled pointers cannot be captured. */ }
  }

  function stopMouseLook() {
    if (!mouseLook) return;
    mouseLook = null;
    canvas.dataset.mouseLook = 'inactive';
    // Freeze at the visible view when exiting, including any pending easing.
    targetYaw = yaw;
    targetPitch = pitch;
  }

  function mousePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }

  function followMouse(event: PointerEvent) {
    if (!mouseLook) return;
    const position = mousePosition(event);
    if (!position) { stopMouseLook(); return; }
    const nextYaw = mouseLook.yaw + (position.x - mouseLook.x) * MOUSE_YAW_RANGE;
    const nextPitch = MathUtils.clamp(mouseLook.pitch - (position.y - mouseLook.y) * MOUSE_PITCH_RANGE, MIN_PITCH, MAX_PITCH);
    if (nextYaw === targetYaw && nextPitch === targetPitch) return;
    targetYaw = nextYaw;
    targetPitch = nextPitch;
    options.onChange();
  }

  function onPointerLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    stopMouseLook();
    if (completedTap && !completedTap.touch) completedTap = null;
    if (pointer?.mouse) clearPointer();
  }

  function onPointerDown(event: PointerEvent) {
    completedTap = null;
    if (pointer && event.pointerId !== pointer.id) pointer.tapEligible = false;
    if (disposed || !event.isPrimary || event.button !== 0 || pointer !== null) return;
    const touch = event.pointerType === 'touch';
    const mouse = event.pointerType === 'mouse';
    if (!mouse) stopMouseLook();
    pointer = {
      id: event.pointerId,
      touch,
      mouse,
      dragging: !touch && !mouse,
      tapEligible: touch || mouse,
      startedAt: event.timeStamp,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
    };
    if (!touch) {
      canvas.focus({ preventScroll: true });
      if (!mouse) capturePointer(event.pointerId);
      event.preventDefault();
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (disposed) return;
    if (event.pointerType === 'mouse') {
      if (pointer?.mouse && pointer.id === event.pointerId
        && Math.max(Math.abs(event.clientX - pointer.startX), Math.abs(event.clientY - pointer.startY)) >= TAP_SLOP) {
        pointer.tapEligible = false;
      }
      followMouse(event);
      return;
    }
    if (!pointer || event.pointerId !== pointer.id) return;
    if (!pointer.dragging) {
      const dx = event.clientX - pointer.startX;
      const dy = event.clientY - pointer.startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_SLOP) return;
      pointer.tapEligible = false;
      // Do not capture a vertical touch gesture: touch-action: pan-y keeps page scrolling.
      if (Math.abs(dy) >= Math.abs(dx)) {
        clearPointer();
        return;
      }
      pointer.dragging = true;
      canvas.focus({ preventScroll: true });
      capturePointer(event.pointerId);
    }
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    // Touch rotates horizontally; pen also looks vertically.
    turn(-dx * POINTER_SPEED, pointer.touch ? 0 : dy * POINTER_SPEED);
    if (event.cancelable) event.preventDefault();
  }

  function onPointerUp(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const duration = event.timeStamp - pointer.startedAt;
    if (pointer.tapEligible && !pointer.dragging && duration >= 0 && (!pointer.touch || duration <= TAP_MAX_DURATION)
      && Math.max(Math.abs(event.clientX - pointer.startX), Math.abs(event.clientY - pointer.startY)) < TAP_SLOP) {
      completedTap = { id: pointer.id, touch: pointer.touch, x: event.clientX, y: event.clientY, endedAt: event.timeStamp };
    }
    clearPointer();
  }

  function onPointerCancel(event: PointerEvent) {
    if (event.pointerType === 'mouse') stopMouseLook();
    if (completedTap?.id === event.pointerId) completedTap = null;
    if (pointer?.id === event.pointerId) clearPointer();
  }

  function onLostPointerCapture(event: PointerEvent) {
    // Touch releases its implicit capture after pointerup, before click. That normal
    // release must keep a completed tap; losing capture mid-gesture cancels it.
    if (pointer?.id === event.pointerId) {
      completedTap = null;
      clearPointer();
    }
  }

  function onClick(event: MouseEvent) {
    const tap = completedTap;
    completedTap = null;
    // Use the completed pointer gesture as the source of truth. iOS Safari can
    // report a touch-generated click as pointerType "mouse" (WebKit 282988).
    if (disposed || !tap || !event.isTrusted || event.detail === 0
      || event.timeStamp < tap.endedAt || event.timeStamp - tap.endedAt > TAP_CLICK_DELAY
      || Math.max(Math.abs(event.clientX - tap.x), Math.abs(event.clientY - tap.y)) >= TAP_SLOP) return;
    if (tap.touch) {
      // Stay inside the trusted click stack: iOS permission prompts require activation.
      options.onTap?.();
    } else if (mouseLook) {
      stopMouseLook();
    } else {
      const position = mousePosition(event);
      if (!position) return;
      targetYaw = yaw;
      targetPitch = pitch;
      mouseLook = { ...position, yaw, pitch };
      canvas.dataset.mouseLook = 'active';
      canvas.focus({ preventScroll: true });
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    // The canvas alone owns these keys; form controls and other UI keep normal behavior.
    if (event.target !== canvas || document.activeElement !== canvas
      || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Escape' && mouseLook) {
      event.preventDefault();
      clearInteraction();
      return;
    }
    if (!DIRECTION_KEYS.has(event.code)) return;
    event.preventDefault();
    if (!pressed.has(event.code)) {
      pressed.add(event.code);
      options.onChange();
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (!DIRECTION_KEYS.has(event.code)) return;
    if (pressed.delete(event.code)) event.preventDefault();
  }

  function clearInteraction() {
    stopMouseLook();
    pressed.clear();
    completedTap = null;
    clearPointer();
  }

  function recalibrateMotion() {
    previousSensorYaw = null;
  }

  function onVisibilityChange() {
    if (document.hidden) clearInteraction();
    // A handset may have moved while the page was hidden; resume without a jump.
    recalibrateMotion();
  }

  function onDeviceOrientation(event: DeviceOrientationEvent) {
    if (!motionEnabled || disposed || document.hidden) return;
    const { alpha, beta, gamma } = event;
    if (alpha === null || beta === null || gamma === null
      || !Number.isFinite(alpha) || !Number.isFinite(beta) || !Number.isFinite(gamma)) return;
    const legacyOrientation = (window as Window & { orientation?: number }).orientation;
    const screenAngle = window.screen.orientation?.angle ?? legacyOrientation ?? 0;
    sensorEuler.set(
      MathUtils.degToRad(beta),
      MathUtils.degToRad(alpha),
      -MathUtils.degToRad(gamma),
      'YXZ',
    );
    sensorQuaternion.setFromEuler(sensorEuler).multiply(handsetToCamera).multiply(
      screenQuaternion.setFromAxisAngle(screenAxis, -MathUtils.degToRad(screenAngle)),
    );
    sensorDirection.set(0, 0, -1).applyQuaternion(sensorQuaternion);
    const sensorPitch = Math.asin(MathUtils.clamp(sensorDirection.y, -1, 1));
    // Heading is undefined when the phone looks almost straight up/down; rebaseline there.
    if (Math.abs(sensorDirection.y) > 0.985) {
      recalibrateMotion();
      return;
    }
    const sensorYaw = Math.atan2(sensorDirection.x, -sensorDirection.z);
    if (previousSensorYaw === null) {
      previousSensorYaw = sensorYaw;
      previousSensorPitch = sensorPitch;
      return;
    }
    // Unwrap each sensor sample so crossing north does not spin the camera a full turn.
    const yawDelta = Math.atan2(
      Math.sin(sensorYaw - previousSensorYaw),
      Math.cos(sensorYaw - previousSensorYaw),
    );
    const pitchDelta = sensorPitch - previousSensorPitch;
    previousSensorYaw = sensorYaw;
    previousSensorPitch = sensorPitch;
    if (Math.abs(yawDelta) + Math.abs(pitchDelta) > ANGLE_EPSILON) turn(yawDelta, pitchDelta);
  }

  function disableMotion() {
    permissionEpoch += 1;
    motionEnabled = false;
    pendingPermission = null;
    recalibrateMotion();
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    window.removeEventListener('orientationchange', recalibrateMotion);
    window.screen.orientation?.removeEventListener('change', recalibrateMotion);
  }

  function enableMotion(): Promise<MotionResult> {
    if (disposed || !window.isSecureContext || typeof window.DeviceOrientationEvent === 'undefined') {
      return Promise.resolve('unsupported');
    }
    if (motionEnabled) return Promise.resolve('enabled');
    if (pendingPermission) return pendingPermission;
    const epoch = ++permissionEpoch;
    const request = (async (): Promise<MotionResult> => {
      const deviceOrientation = window.DeviceOrientationEvent as PermissionDeviceOrientation;
      try {
        // This runs synchronously up to requestPermission, preserving the canvas tap.
        if (deviceOrientation.requestPermission && !motionPermissionGranted) {
          if (await deviceOrientation.requestPermission() !== 'granted') return 'denied';
          motionPermissionGranted = true;
        }
      } catch {
        return 'denied';
      }
      // Disabling or unmounting during a permission prompt must never attach late listeners.
      if (disposed || epoch !== permissionEpoch) return 'unsupported';
      motionEnabled = true;
      recalibrateMotion();
      window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
      window.addEventListener('orientationchange', recalibrateMotion);
      window.screen.orientation?.addEventListener('change', recalibrateMotion);
      return 'enabled';
    })();
    pendingPermission = request;
    void request.finally(() => {
      if (pendingPermission === request) pendingPermission = null;
    });
    return request;
  }

  function reset() {
    if (disposed) return;
    clearInteraction();
    targetYaw = initialYaw;
    targetPitch = initialPitch;
    // Reset is deliberately immediate; do not animate through many accumulated rotations.
    yaw = initialYaw;
    pitch = initialPitch;
    recalibrateMotion();
    applyOrientation();
    options.onChange();
  }

  function update(dt: number): boolean {
    if (disposed) return false;
    const step = Number.isFinite(dt) ? MathUtils.clamp(dt, 0, 0.05) : 0;
    const right = Number(pressed.has('KeyD') || pressed.has('ArrowRight'))
      - Number(pressed.has('KeyA') || pressed.has('ArrowLeft'));
    const up = Number(pressed.has('KeyW') || pressed.has('ArrowUp'))
      - Number(pressed.has('KeyS') || pressed.has('ArrowDown'));
    const yawStep = right * KEY_SPEED * step;
    const nextPitch = MathUtils.clamp(targetPitch + up * KEY_SPEED * step, MIN_PITCH, MAX_PITCH);
    if (mouseLook) { mouseLook.yaw += yawStep; mouseLook.pitch += nextPitch - targetPitch; }
    targetYaw += yawStep;
    targetPitch = nextPitch;

    const blend = options.reducedMotion ? 1 : 1 - Math.exp(-20 * step);
    yaw += (targetYaw - yaw) * blend;
    pitch += (targetPitch - pitch) * blend;
    const settling = Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > ANGLE_EPSILON;
    if (!settling) {
      yaw = targetYaw;
      pitch = targetPitch;
    }
    applyOrientation();
    // Sensor events invalidate on demand; an enabled sensor alone never keeps rAF running.
    return pressed.size > 0 || settling;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearInteraction();
    disableMotion();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('wheel', clearInteraction);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('blur', clearInteraction);
    window.removeEventListener('blur', clearInteraction);
    window.removeEventListener('scroll', clearInteraction, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  // Notify the caller before acquiring listeners, so a failing callback cannot leak them.
  applyOrientation();
  canvas.dataset.mouseLook = 'inactive';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', clearInteraction, { passive: true });
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('blur', clearInteraction);
  window.addEventListener('blur', clearInteraction);
  window.addEventListener('scroll', clearInteraction, { passive: true, capture: true });
  document.addEventListener('visibilitychange', onVisibilityChange);

  return { update, reset, turn, face, enableMotion, disableMotion, dispose };
}
