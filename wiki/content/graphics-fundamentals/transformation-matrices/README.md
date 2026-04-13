---
title: Transformation Matrices and Coordinate Spaces
category: graphics-fundamentals
tags: [matrices, transformations, homogeneous-coordinates, quaternions, projection, coordinates]
description: Deep dive into 4x4 transformation matrices, homogeneous coordinates, quaternions vs Euler angles, and projection matrices for graphics pipelines.
related: [graphics-fundamentals/rasterization-pipeline, game-engines/unity/coordinate-systems-transforms]
order: 2
---

# Transformation Matrices and Coordinate Spaces

Transformations are the foundation of 3D graphics. Vertices must be moved from model space to world space, then to camera space, and finally projected to screen space. This process relies on matrix multiplication and homogeneous coordinate systems, which extend 3D points to 4D to enable both linear transformations and translations in a single matrix operation.

## Homogeneous Coordinates

In pure 3D Euclidean space, translation is not a linear operation—it requires adding a vector. Homogeneous coordinates solve this elegantly by introducing a fourth coordinate w:

```
3D point: (x, y, z)
Homogeneous form: (x, y, z, w) or [x, y, z, w]^T
```

To convert back to 3D, divide by w:
```
(x, y, z, w) → (x/w, y/w, z/w)
```

By convention:
- **w = 1**: A point in 3D space
- **w = 0**: A direction/vector (not affected by translation)
- **w ≠ 1**: Requires division to recover actual 3D coordinates (used in perspective projection)

### Why Homogeneous Coordinates Are Essential

A 3x3 matrix can only represent rotation and scaling. Translation requires addition:
```
[x']   [r00 r01 r02] [x]   [tx]
[y'] = [r10 r11 r12] [y] + [ty]
[z']   [r20 r21 r22] [z]   [tz]
```

With homogeneous coordinates, a single 4x4 matrix handles everything:
```
[x']   [r00 r01 r02 tx] [x]
[y'] = [r10 r11 r12 ty] [y]
[z']   [r20 r21 r22 tz] [z]
[w']   [ 0   0   0   1 ] [w]
```

This simplicity is why 4x4 matrices dominate real-time graphics. A single matrix multiply (16 operations with SIMD) replaces a 3x3 multiply plus vector addition.

## Matrix Transformation Hierarchy

Objects are typically transformed through multiple coordinate spaces:

```
Model Space
    ↓ (Model Matrix)
World Space
    ↓ (View Matrix)
View/Camera Space
    ↓ (Projection Matrix)
Clip Space
    ↓ (Perspective Division)
Normalized Device Coordinates (NDC)
    ↓ (Viewport Transform)
Screen Space
```

### Model Matrix
Transforms vertices from object/model space to world space. Encodes the object's position, rotation, and scale in the world.

```
Model = Translation × Rotation × Scale

[1  0  0  tx]   [cos θ   -sin θ   0  0]   [sx  0   0  0]
[0  1  0  ty] × [sin θ    cos θ   0  0] × [0  sy   0  0]
[0  0  1  tz]   [0        0       1  0]   [0   0  sz  0]
[0  0  0  1 ]   [0        0       0  1]   [0   0   0  1]
```

**Transformation order matters**: typically Scale → Rotate → Translate. Multiplying in reverse order (right-to-left when read) applies transformations in reverse.

### View Matrix
Transforms world space to camera/view space. Essentially, it moves and orients the camera. Mathematically, it's the **inverse** of the camera's world transformation:

```
View = Camera^(-1)
```

### The Look-At Matrix
The standard way to construct a view matrix given eye position, target, and up vector:

```
function lookAt(eye, target, up):
    forward = normalize(target - eye)
    right = normalize(cross(forward, up))
    up = cross(right, forward)  // Recompute for orthogonality
    
    [right.x    right.y    right.z    -dot(right, eye)]
    [up.x       up.y       up.z       -dot(up, eye)]
    [-forward.x -forward.y -forward.z  dot(forward, eye)]
    [0          0          0           1]
```

The negations and specific construction ensure that:
- The camera looks down -Z in view space
- +Y is up
- +X is rightward
- The camera position becomes the origin

## Projection Matrices

These matrices handle the crucial transformation from 3D to 2D, mapping world coordinates into a bounded region suitable for rasterization.

### Orthographic (Parallel) Projection

Orthographic projection simply clips to a bounding box, with no perspective distortion. Used in CAD, 2D games, and some UI rendering.

```
function ortho(left, right, bottom, top, near, far):
    width = right - left
    height = top - bottom
    depth = far - near
    
    [2/width      0          0           -(right+left)/width]
    [0            2/height   0           -(top+bottom)/height]
    [0            0          -2/depth    -(far+near)/depth]
    [0            0          0           1]
```

Properties:
- Parallel lines remain parallel
- No foreshortening
- All objects appear at the same size regardless of distance
- Good for architectural visualization

### Perspective Projection

Perspective projection maps a **frustum** (truncated pyramid) to NDC. Objects farther away appear smaller due to perspective distortion.

```
function perspective(fovY, aspect, near, far):
    f = 1.0 / tan(fovY / 2.0)
    
    [f/aspect    0    0                           0]
    [0           f    0                           0]
    [0           0    (far+near)/(near-far)      2*far*near/(near-far)]
    [0           0    -1                          0]
```

Where:
- `fovY`: Vertical field of view angle (in radians)
- `aspect`: Width/Height of viewport
- `near`, `far`: Clipping plane distances (positive values)
- The projection maps the frustum cone to a [-1, 1]³ cube in NDC

The z-component computation is key:
```
z_clip = ((far+near)/(near-far)) * z_view + 2*far*near/(near-far) * w_view
z_ndc = z_clip / z_clip_w  // After w-division
```

Note: Different APIs (OpenGL vs DirectX) handle NDC z-range differently:
- **OpenGL NDC**: z ranges from -1 (near) to +1 (far)
- **DirectX NDC**: z ranges from 0 (near) to +1 (far)

The projection matrix ensures **non-linear z-distribution**: objects near the camera have high z precision, while distant objects share coarser precision. This is why depth testing can cause z-fighting with distant geometry—accumulation of floating-point error compounds over large distances.

## Rotation Representations

Two major approaches exist for representing rotations: Euler angles and quaternions.

### Euler Angles (Pitch, Yaw, Roll)

Decompose rotation into three sequential rotations around cardinal axes:

```
Rotation = Rz(roll) × Ry(yaw) × Rx(pitch)

     [cos(roll)  -sin(roll)   0]   [cos(yaw)    0  sin(yaw)]   [1        0          0    ]
   = [sin(roll)   cos(roll)   0] × [0           1  0      ] × [0  cos(pitch)  -sin(pitch)]
     [0           0           1]   [-sin(yaw)   0  cos(yaw)]   [0  sin(pitch)   cos(pitch)]
```

**Advantages**:
- Intuitive for humans (rotations around familiar axes)
- Easy to read/write in configuration files
- Only 3 values needed

**Disadvantages**:
- Gimbal lock: When two axes align, one degree of freedom is lost
- **Gimbal Lock Example**: When pitch = 90°, yaw and roll become equivalent (both rotate around vertical). Any "up" rotation can be achieved with yaw or roll, so the animator cannot independently control two axes.
- Interpolation between angles is non-linear and can produce unexpected paths
- Prone to numerical instability when combined

### Quaternions

A quaternion represents rotation as a unit vector in 4D:

```
q = [x, y, z, w] or q = w + xi + yj + zk

where i² = j² = k² = ijk = -1
```

For a rotation of angle θ around axis (ax, ay, az):

```
q = [sin(θ/2) * ax, sin(θ/2) * ay, sin(θ/2) * az, cos(θ/2)]
```

**Key Properties**:
- Unit quaternions must satisfy: x² + y² + z² + w² = 1
- Identity rotation: q = [0, 0, 0, 1]
- Inverse rotation: q^(-1) = [−x, −y, −z, w] (for unit quaternions)

**Rotating a point with a quaternion**:
```
p' = q * p * q^(-1)

where p = [x, y, z, 0] (pure quaternion)
```

This can be computed without explicitly converting to matrices:

```glsl
vec3 rotateByQuaternion(vec3 v, vec4 q) {
    vec3 qxyz = q.xyz;
    vec3 cross1 = cross(qxyz, v);
    vec3 cross2 = cross(qxyz, cross1);
    return v + 2.0 * (q.w * cross1 + cross2);
}
```

**Advantages**:
- **No gimbal lock**: Rotations are always smooth and non-degenerate
- **Smooth interpolation**: Spherical linear interpolation (SLERP) produces natural motion
- **Efficient composition**: Quaternion multiplication is faster than matrix multiplication
- **Numerically stable**: Only 4 values to track

**Disadvantages**:
- Less intuitive for direct specification
- Need to normalize after repeated operations
- Requires conversion to matrix for GPU use

### Interpolation: Euler vs Quaternion

Given start angle θ₁ = 0° and end angle θ₂ = 180° (rotation around Z), linear interpolation in Euler space:

```
θ(t) = θ₁ + t(θ₂ - θ₁) = t * 180°
```

This works fine. But consider:
- θ₁ = [0°, 0°, 90°] (yaw)
- θ₂ = [0°, 90°, 0°] (pitch)

Linear interpolation produces intermediate rotations that are not pure yaw or pitch—the object tumbles through an unexpected path. **Quaternion SLERP** (Spherical Linear Interpolation) produces intuitive, smooth rotation:

```
SLERP(q₁, q₂, t) = (sin((1-t)θ) / sin(θ)) * q₁ + (sin(tθ) / sin(θ)) * q₂

where θ = arccos(dot(q₁, q₂))
```

This ensures constant angular velocity and shortest rotation path.

## Converting Between Representations

### Quaternion to Matrix

```
q = [x, y, z, w]

     [1-2(y²+z²)   2(xy-wz)      2(xz+wy)    0]
M =  [2(xy+wz)     1-2(x²+z²)    2(yz-wx)    0]
     [2(xz-wy)     2(yz+wx)      1-2(x²+y²)  0]
     [0             0             0           1]
```

### Matrix to Quaternion (Shepperd's Method)

For stability, find the largest diagonal element and use that as the starting point:

```
If trace(M) > 0:
    s = sqrt(trace(M) + 1.0) * 2
    w = 0.25 * s
    x = (M[2,1] - M[1,2]) / s
    y = (M[0,2] - M[2,0]) / s
    z = (M[1,0] - M[0,1]) / s
Else if M[0,0] > M[1,1] and M[0,0] > M[2,2]:
    s = sqrt(1.0 + M[0,0] - M[1,1] - M[2,2]) * 2
    w = (M[2,1] - M[1,2]) / s
    x = 0.25 * s
    y = (M[0,1] + M[1,0]) / s
    z = (M[0,2] + M[2,0]) / s
[... similar branches for other cases ...]
```

## Normalized Device Coordinates (NDC)

After perspective division, coordinates are in NDC:
- **OpenGL NDC**: x, y, z ∈ [-1, 1]
- **DirectX NDC**: x, y ∈ [0, 1], z ∈ [0, 1]

This normalized space allows the rasterizer to work with fixed viewport logic regardless of actual screen resolution.

## Reverse Z and Precision

Modern graphics engines often use **Reverse Z** (far plane at z=0, near plane at z=1 in NDC) for better floating-point precision:

```
Standard projection (z ∈ [-1, 1]):
    z_ndc = (far + near) / (near - far) * z_view + 2*far*near / (near - far)

Reverse Z projection (z ∈ [1, 0]):
    z_ndc = (near) / (near - far) * z_view + far*near / (near - far)
    Flip depth comparison: GL_LESS becomes GL_GREATER
```

**Benefit**: With a standard 24-bit depth buffer (16.8M values), near-plane precision at 0.1 units away covers 0.000006 units, while far-plane precision at 1000 units away covers 0.06 units. Reverse Z linearizes this distribution.

## Practical Considerations

1. **Column-Major vs Row-Major**: Different APIs store matrices differently. Always confirm order when interoperating between libraries.

2. **Matrix Multiplication Order**: Transformation stacking goes right-to-left:
   ```glsl
   vec4 transformedPos = ProjectionMatrix * ViewMatrix * ModelMatrix * modelPosition;
   ```

3. **Normal Transformation**: Surface normals must be transformed using the **inverse transpose** of the upper-3x3 model matrix to preserve perpendicularity after non-uniform scaling:
   ```
   transformedNormal = transpose(inverse(M3x3)) * normal
   ```
   
   For uniform scaling only, the model matrix's upper-3x3 suffices.

4. **Skinning/Skeletal Animation**: Blend multiple bone transformations per vertex:
   ```glsl
   vec4 skinnedPos = vec4(0.0);
   for(int i = 0; i < 4; i++) {
       skinnedPos += weights[i] * boneMatrices[boneIds[i]] * modelPosition;
   }
   gl_Position = ProjectionMatrix * ViewMatrix * skinnedPos;
   ```

Transformation matrices are the backbone of all 3D graphics transformations, and mastering homogeneous coordinates, projection types, and rotation representations is essential for any graphics programmer.
