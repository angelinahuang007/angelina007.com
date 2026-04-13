---
title: Animation Principles and Interpolation
category: concepts
order: 3
tags: [animation, principles, Disney, timing, interpolation]
description: Deep dive into the 12 Disney animation principles applied to 2D and 3D, interpolation methods for smooth motion, and technical implementation of professional animation systems.
related: [blender/animation-rigging, game-engines/unity/architecture-workflow, graphics-fundamentals/curves-and-surfaces]
---

# Animation Principles and Interpolation

## Introduction

Animation is the art of movement—making static images or models come alive through sequential images or continuous transformation. Whether traditional 2D frame-by-frame, 3D character rigging, or motion design, successful animation relies on principles discovered through decades of practice.

The Disney Animation Studios' "12 Principles of Animation" (developed by Ollie Johnston and Frank Thomas) remain the foundation of all professional animation. These principles apply equally to feature films, games, motion graphics, and interactive media.

## The 12 Principles of Animation

### 1. Squash and Stretch

Deformation that suggests weight, flexibility, and impact. An object doesn't maintain rigid dimensions—it compresses and extends based on motion and forces.

**Application**:
- A ball bouncing: squashes on impact, stretches as it falls
- Facial expressions: cheeks stretch when smiling, compress when grimacing
- Character movement: torso compresses when landing from a jump

**Implementation**:

```python
def apply_squash_stretch(original_scale, velocity, impact_magnitude):
    """Apply squash/stretch based on motion"""
    # Reduce vertical scale on impact, increase horizontal
    impact_factor = impact_magnitude * 0.3
    
    scale_y = original_scale[1] * (1.0 - impact_factor)
    scale_x = original_scale[0] * (1.0 + impact_factor * 0.5)
    scale_z = original_scale[2] * (1.0 + impact_factor * 0.5)
    
    # Maintain volume: if compressing, expand in other dimensions
    volume_ratio = (original_scale[0] * original_scale[1] * original_scale[2]) / \
                   (scale_x * scale_y * scale_z)
    
    scale_x *= pow(volume_ratio, 1/3)
    scale_z *= pow(volume_ratio, 1/3)
    
    return (scale_x, scale_y, scale_z)
```

### 2. Anticipation

Setup before action—telegraphing intent. Before a character jumps, they crouch. Before throwing, they pull back. This creates expectation and makes action feel intentional.

**Application**:
- Jump: crouch down before upward motion
- Punch: pull fist back before extension
- Blink: eyelids narrow slightly before full close

**Effect**: Makes motion feel deliberate, not sudden. Gives audience time to perceive intent.

### 3. Staging

Composition of each shot to clearly present what's happening. Use positioning, lighting, camera angle, and grouping to guide attention.

**Principles**:
- One clear focal point per shot
- Silhouettes should read clearly
- Avoid visual clutter
- Use negative space
- Leading lines direct eye

**Animation Example**: Character entering from frame edge into spotlight, all other elements fade/blur slightly.

### 4. Straight-Ahead vs. Pose-to-Pose Animation

Two fundamental approaches:

**Straight-Ahead**:
- Draw/animate each frame sequentially
- More spontaneous, loose feeling
- Harder to control timing
- Used for secondary action, effects

**Pose-to-Pose**:
- Establish key poses, then fill in-betweens
- More controlled, precise
- Better for character performance
- Industry standard for professional work

```python
class Animation:
    def __init__(self):
        self.keyframes = {}  # frame_number -> pose
        self.in_between_curve = 'ease_in_out'
    
    def add_keyframe(self, frame, pose):
        """Pose-to-pose: define key positions"""
        self.keyframes[frame] = pose
    
    def get_frame(self, frame_number):
        """Get interpolated frame between keyframes"""
        # Find surrounding keyframes
        lower_frame = max(f for f in self.keyframes if f <= frame_number)
        upper_frame = min(f for f in self.keyframes if f >= frame_number)
        
        if lower_frame == upper_frame:
            return self.keyframes[lower_frame]
        
        # Interpolate
        alpha = (frame_number - lower_frame) / (upper_frame - lower_frame)
        alpha = self.ease_curve(alpha)  # Apply easing
        
        return interpolate(self.keyframes[lower_frame], 
                         self.keyframes[upper_frame], 
                         alpha)
```

### 5. Follow-Through and Overlapping Action

Different body parts settle at different rates. Hair continues moving after head stops. Cloth trails motion. Overlapping timing creates appeal and fluidity.

**Principle**: No all parts of a character stop simultaneously.

**Implementation**:

```python
def calculate_follow_through(parent_transform, child_velocity, stiffness=0.9):
    """Child continues in parent's previous direction"""
    # stiffness: 1.0 = perfectly rigid, 0.0 = no influence
    # Create a lag that trails the parent
    
    velocity_lag = child_velocity * (1.0 - stiffness)
    new_position = parent_transform + velocity_lag
    
    # Gradually settle toward parent as stiffness increases
    child_velocity *= stiffness
    
    return new_position, child_velocity
```

### 6. Slow-In and Slow-Out (Ease-In/Out)

Objects don't start/stop abruptly. Acceleration and deceleration create smooth, natural motion. Fast in the middle, slow at edges.

**Real-world basis**: Inertia. Real objects gradually accelerate/decelerate.

**Mathematical formulation**:

For linear interpolation:
$$P(t) = (1-t) P_0 + t P_1, \quad t \in [0,1]$$

Linear is boring. Apply easing function $e(t)$:

$$P(t) = (1-e(t)) P_0 + e(t) P_1$$

**Common easing functions**:

```python
def ease_in_out_quad(t):
    """Quadratic ease in/out: smooth acceleration then deceleration"""
    if t < 0.5:
        return 2.0 * t * t
    else:
        return 1.0 - 2.0 * (1.0 - t) ** 2

def ease_in_out_cubic(t):
    """Cubic: smoother, more pronounced ease"""
    if t < 0.5:
        return 4.0 * t * t * t
    else:
        return 1.0 - 4.0 * (1.0 - t) ** 3

def ease_in_out_sine(t):
    """Sine: smooth, natural feeling"""
    return 0.5 * (1.0 - math.cos(math.pi * t))

def ease_out_elastic(t):
    """Elastic: bouncy overshoot"""
    return math.sin(-13 * math.pi/2 * (t + 1)) * math.pow(2, -10 * t) + 1

# Visualize curves
import numpy as np
import matplotlib.pyplot as plt

t = np.linspace(0, 1, 100)
linear = t
quad = np.array([ease_in_out_quad(x) for x in t])
cubic = np.array([ease_in_out_cubic(x) for x in t])

plt.plot(t, linear, label='Linear')
plt.plot(t, quad, label='Quad')
plt.plot(t, cubic, label='Cubic')
plt.legend()
plt.show()
```

### 7. Arcs

Motion follows curved paths, not straight lines. This creates natural, organic feeling. Even simple movements like reaching for something follow arcs.

**Why arcs?**
- Joint constraints create arcs (arm reaching follows arc through space)
- Avoids mechanical, linear feel
- More visually appealing
- Matches real-world motion

**Technical implementation**:

```python
def apply_arc(start_pos, end_pos, peak_height, t):
    """Interpolate along arc path"""
    # t: 0..1, 0=start, 1=end
    
    # Linear interpolation on horizontal plane
    horizontal = start_pos + t * (end_pos - start_pos)
    
    # Parabolic arc for vertical motion
    # Peak at t=0.5
    arc_height = 4 * peak_height * t * (1 - t)
    
    result = horizontal
    result[1] += arc_height  # Assuming Y is up
    
    return result

# Example: ball toss
trajectory = []
for frame in range(60):
    t = frame / 60.0
    pos = apply_arc(start=(0, 0, 0), end=(10, 0, 0), peak_height=5, t=t)
    trajectory.append(pos)
```

### 8. Secondary Action

Supporting action that adds detail and interest without distracting from main action. Breathing, tail movement, clothing flutter while character walks.

**Purpose**: Adds life and personality. Makes scene richer.

**Not to be confused with**: Main action (the purpose of the shot).

### 9. Timing

The number of frames allocated to an action. Timing conveys emotion, weight, intention.

**Principles**:
- Fast timing = quick, light, energetic
- Slow timing = heavy, deliberate, powerful
- More frames between key poses = slower, more emphasis

```python
FRAME_RATE = 24  # Standard film

# Heavy, powerful jump
crouch_frames = 6
rise_frames = 8    # More frames = slower = heavier feel
peak_frames = 2
fall_frames = 8
land_frames = 4

# Light, quick jump
crouch_frames = 2
rise_frames = 3
peak_frames = 1
fall_frames = 3
land_frames = 2
```

**Spacing diagram**:
```
Heavy motion (fewer positions, longer frames):
O     O     O     O     O
│────────────────────────│ 24 frames, 5 positions

Light motion (more positions, shorter frames):
O O O O O O O O O O
│──────────────────│ 24 frames, 10 positions
```

### 10. Exaggeration

Pushing action beyond realistic to heighten appeal and emotion. Cartoon eyes pop wider, swings arc higher, expressions push further.

**Gradient**:
- Realistic: 100% real-world motion
- Stylized: 110-150% exaggeration
- Cartoon: 200%+ exaggeration

**Example**: Horror jump scare vs. natural startle. Horror version over-extends, snaps faster, lands heavier.

```python
def apply_exaggeration(motion_vector, exaggeration_factor=1.2):
    """Amplify motion beyond realistic"""
    # Multiply magnitude, maintain direction
    magnitude = np.linalg.norm(motion_vector)
    direction = motion_vector / magnitude if magnitude > 0 else motion_vector
    return direction * magnitude * exaggeration_factor
```

### 11. Solid Drawing

In traditional animation, drawing with proper weight and volume. In 3D, this means proper modeling, rigging, and understanding of form.

**Principles**:
- Understand underlying anatomy
- Maintain consistent proportions
- Understand light and shadow
- Model three-dimensionally

### 12. Appeal

Star quality. Charisma that makes character/object engaging to watch. Often comes from exaggeration of appealing traits and clarity of design.

**For characters**: Strong silhouette, distinctive features, clear personality.

## Interpolation Methods

### Linear Interpolation

Simplest: proportional blend between start and end:

$$P(t) = (1-t) P_0 + t P_1, \quad t \in [0,1]$$

Fast but mechanical-feeling. Rarely used alone in professional animation.

```python
def lerp(a, b, t):
    return a + t * (b - a)
```

### Bezier Curves

Curves defined by control points, smooth and flexible. Much more expressive:

$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t)t^2 P_2 + t^3 P_3$$

for cubic Bezier (most common).

**Properties**:
- Curve passes through $P_0$ and $P_3$ (endpoints)
- $P_1$ and $P_2$ are control points (curve is attracted to them)
- Smooth second derivative (no sharp corners)

**Animation graph editor**: Shows animation curves as Bezier for precise timing control.

```python
def cubic_bezier(p0, p1, p2, p3, t):
    """Evaluate cubic Bezier curve at parameter t"""
    mt = 1 - t
    
    a = mt ** 3
    b = 3 * mt ** 2 * t
    c = 3 * mt * t ** 2
    d = t ** 3
    
    return a * p0 + b * p1 + c * p2 + d * p3

def bezier_derivative(p0, p1, p2, p3, t):
    """Velocity along curve (used for velocity-based animation)"""
    mt = 1 - t
    
    return 3 * mt**2 * (p1 - p0) + \
           6 * mt * t * (p2 - p1) + \
           3 * t**2 * (p3 - p2)
```

### Hermite Curves

Alternative using position and velocity (tangent) at endpoints:

$$H(t) = (2t^3 - 3t^2 + 1) P_0 + (-2t^3 + 3t^2) P_1 + (t^3 - 2t^2 + t) V_0 + (t^3 - t^2) V_1$$

**Advantage**: Intuitive—specify position and velocity at start/end.

**Use case**: Matching velocity at connection points between curves.

### Spherical Linear Interpolation (SLERP)

Linear interpolation of vectors doesn't maintain magnitude. For rotations (quaternions) or normalized vectors, use SLERP:

$$\text{SLERP}(q_0, q_1, t) = \frac{\sin((1-t)\theta)}{\sin(\theta)} q_0 + \frac{\sin(t\theta)}{\sin(\theta)} q_1$$

where $\cos(\theta) = q_0 \cdot q_1$.

**Why**: Interpolating quaternions linearly distorts rotation speed.

```python
def slerp(q0, q1, t):
    """Spherical linear interpolation of quaternions"""
    # Compute dot product
    dot_product = np.dot(q0, q1)
    
    # If dot product is negative, negate one quaternion
    if dot_product < 0.0:
        q1 = -q1
        dot_product = -dot_product
    
    # Clamp to avoid acos domain errors
    dot_product = np.clip(dot_product, -1.0, 1.0)
    
    theta = np.arccos(dot_product)
    sin_theta = np.sin(theta)
    
    if sin_theta < 0.001:
        # Vectors nearly parallel, use linear interpolation
        return (1.0 - t) * q0 + t * q1
    
    w0 = np.sin((1.0 - t) * theta) / sin_theta
    w1 = np.sin(t * theta) / sin_theta
    
    return w0 * q0 + w1 * q1
```

## Skeletal Animation

### Bone Hierarchy

Character skeleton as hierarchy of bones:

```python
class Bone:
    def __init__(self, name, parent=None):
        self.name = name
        self.parent = parent
        self.children = []
        
        # Local transform (relative to parent)
        self.position = glm.vec3(0)
        self.rotation = glm.quat()
        self.scale = glm.vec3(1)
        
        # World transform (absolute)
        self.world_matrix = glm.mat4(1)
        
        if parent:
            parent.children.append(self)
    
    def update_world_transform(self):
        """Propagate transforms down hierarchy"""
        local_matrix = self.get_local_matrix()
        
        if self.parent:
            self.world_matrix = self.parent.world_matrix * local_matrix
        else:
            self.world_matrix = local_matrix
        
        for child in self.children:
            child.update_world_transform()
    
    def get_local_matrix(self):
        """Convert position/rotation/scale to matrix"""
        t = glm.translate(glm.mat4(1), self.position)
        r = glm.mat4_cast(self.rotation)
        s = glm.scale(glm.mat4(1), self.scale)
        return t * r * s
```

### Skinning/Blend Shapes

Deform mesh based on bone positions:

```python
class SkinnedMesh:
    def __init__(self, mesh, skeleton):
        self.mesh = mesh
        self.skeleton = skeleton
        
        # Store which bones influence each vertex and how much
        self.bone_weights = []  # Per vertex: list of (bone_index, weight)
        self.bone_indices = []  # Per vertex: list of bone indices
    
    def deform(self):
        """Apply skeletal animation to mesh"""
        deformed_vertices = np.zeros_like(self.mesh.vertices)
        
        for v_idx, (vertex, normal) in enumerate(zip(self.mesh.vertices, 
                                                      self.mesh.normals)):
            deformed_pos = glm.vec3(0)
            deformed_normal = glm.vec3(0)
            
            # Blend bone influences
            for bone_idx, weight in zip(self.bone_indices[v_idx],
                                        self.bone_weights[v_idx]):
                bone = self.skeleton.bones[bone_idx]
                
                # Transform vertex by bone
                transformed_pos = bone.world_matrix * glm.vec4(vertex, 1)
                deformed_pos += weight * glm.vec3(transformed_pos)
                
                # Transform normal (use inverse transpose)
                transformed_normal = bone.world_matrix * glm.vec4(normal, 0)
                deformed_normal += weight * glm.vec3(transformed_normal)
            
            deformed_vertices[v_idx] = deformed_pos
            self.mesh.normals[v_idx] = glm.normalize(deformed_normal)
        
        return deformed_vertices
```

## Animation Production Workflow

### Blocking

Establish key poses without smooth motion. Reviewer can immediately assess composition, camera angles, character action.

### Spline

Add smooth interpolation between poses. Motion becomes fluid but may be floaty without secondary action.

### Polish

Add secondary action, refine timing, fine-tune curves. Final 50% of effort for final 20% of visual improvement.

## Comparison: Keyframe vs. Procedural vs. Motion Capture

| Method | Keyframe | Procedural | Motion Capture |
|--------|----------|-----------|-----------------|
| **Control** | Complete | Limited | Limited |
| **Production Time** | High | Low | Medium |
| **Realism** | Stylized | Varies | High |
| **File Size** | Small | Tiny | Large |
| **Flexibility** | High | Low | Medium |
| **Edit Difficulty** | Medium | Hard | Hard |
| **Best For** | Character | Procedural | Realistic movement |

## Advanced Topics: Constraint-Based Animation

Rather than animating positions directly, define constraints and solve:

```python
class IKConstraint:
    """Inverse kinematics: position end-effector, solve for joint angles"""
    
    def __init__(self, skeleton, end_effector_idx, target_pos):
        self.skeleton = skeleton
        self.end_effector = skeleton.bones[end_effector_idx]
        self.target = target_pos
    
    def solve_ccd(self, iterations=10):
        """Cyclic Coordinate Descent IK solver"""
        chain = self._get_chain_to_root()
        
        for _ in range(iterations):
            for bone in chain:
                # Get current and target positions
                current_pos = self.end_effector.world_matrix[:3, 3]
                target_vec = self.target - current_pos
                
                # Calculate desired rotation
                bone_pos = bone.world_matrix[:3, 3]
                current_vec = current_pos - bone_pos
                
                # Rotate bone to minimize error
                angle = self._angle_between(current_vec, target_vec)
                axis = np.cross(current_vec, target_vec)
                
                if np.linalg.norm(axis) > 0.001:
                    rotation = glm.quat(np.sin(angle/2), axis)
                    bone.rotation *= rotation
```

## Summary

Animation is a discipline blending art, physics, and psychology. The 12 principles provide a framework for creating compelling motion across any medium. Technical implementation—interpolation curves, skeletal deformation, constraint solving—enables translating artistic intent into runtime motion. Mastery requires both understanding principles and proficiency with tools and mathematics.
