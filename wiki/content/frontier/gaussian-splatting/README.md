---
title: 3D Gaussian Splatting
category: frontier
order: 2
tags: [gaussian-splatting, 3DGS, real-time, novel-view, differentiable-rendering]
description: Technical deep-dive into 3D Gaussian Splatting, differentiable rasterization, adaptive density control, training pipelines, and comparison with NeRF for real-time rendering.
related: [frontier/neural-radiance-fields, graphics-fundamentals/rasterization-pipeline, frontier/ai-content-generation]
---

# 3D Gaussian Splatting

## Introduction

3D Gaussian Splatting (3DGS), introduced by Kerbl et al. in 2023, represents a revolutionary shift in neural scene representation. While NeRF achieves photorealistic rendering through volumetric ray-tracing, 3DGS achieves comparable quality with real-time performance by representing scenes as collections of 3D anisotropic Gaussians rendered via differentiable rasterization.

The fundamental idea: decompose a scene into thousands of 3D Gaussians, each with position, covariance, opacity, and learned spherical harmonic (SH) coefficients. Rasterize these Gaussians directly to screen space using efficient 2D projections, enabling high frame rates (100+ fps) while maintaining neural representation benefits.

## Scene Representation

### Gaussian Definition

Each Gaussian is defined in 3D space as:

$$G(\mathbf{x}) = \exp\left(-\frac{1}{2} (\mathbf{x} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})\right)$$

Where:
- $\boldsymbol{\mu} \in \mathbb{R}^3$ is the Gaussian center position
- $\boldsymbol{\Sigma} \in \mathbb{R}^{3 \times 3}$ is the 3D covariance matrix

Since storing a full 3×3 covariance is expensive, parameterize it as:

$$\boldsymbol{\Sigma} = RS^2R^T$$

where:
- $R$ is a $3 \times 3$ rotation matrix, stored as a unit quaternion $\mathbf{q}$
- $S$ is a $3 \times 3$ diagonal scale matrix with entries $s_x, s_y, s_z$

This decomposition ensures positive-definiteness and provides intuitive parameters: rotation and per-axis scale.

### Color Representation via Spherical Harmonics

View-dependent color is encoded using spherical harmonics (SH). Instead of raw RGB per Gaussian:

$$\mathbf{c}(\mathbf{d}) = SH_{\text{basis}}(\mathbf{d}) \cdot \mathbf{c}_{\text{coeff}}$$

where $\mathbf{d}$ is the view direction, SH basis functions are evaluated at that direction, and coefficients are learned per Gaussian.

For order 0 (just SH0): 1 coefficient (average color)
For order 1: 4 coefficients (RGB × 4)
For order 2: 9 coefficients (RGB × 9)
For order 3: 16 coefficients (RGB × 16)

Most implementations use adaptive SH order, starting with 0 and increasing during training where needed for high-frequency color variation.

**SH Basis for first few orders:**

$$Y_0^0 = 1$$
$$Y_1^{-1} = y, \quad Y_1^0 = z, \quad Y_1^1 = x$$
$$Y_2^{-2} = xy, \quad Y_2^{-1} = yz, \quad Y_2^0 = \frac{1}{2}(3z^2-1), \quad Y_2^1 = xz, \quad Y_2^2 = \frac{1}{2}(x^2-y^2)$$

### Opacity Parameter

Per-Gaussian opacity $\alpha$ is learned but stored as a sigmoid input to ensure $\alpha \in [0, 1]$.

## Differentiable Rasterization

### Projection to Screen Space

For each Gaussian and camera view:
1. Project 3D Gaussian center to screen: $\mathbf{u} = \text{project}(\boldsymbol{\mu})$
2. Transform 3D covariance to 2D screen-space covariance using the Jacobian of projection

Given a perspective camera with intrinsics $\mathbf{K}$ and extrinsics $[\mathbf{R}|t]$, project a point in camera frame:

$$\begin{pmatrix} x \\ y \\ z \end{pmatrix}_{\text{cam}} = \mathbf{R} \begin{pmatrix} x \\ y \\ z \end{pmatrix}_{\text{world}} + \mathbf{t}$$

Screen coordinates: $u = f_x x / z + c_x$, $v = f_y y / z + c_y$

The 2D covariance transforms via the projection Jacobian $\mathbf{J}$:

$$\boldsymbol{\Sigma}_{\text{2D}} = \mathbf{J} \boldsymbol{\Sigma}_{\text{3D}} \mathbf{J}^T$$

where:

$$\mathbf{J} = \begin{pmatrix} \frac{f_x}{z} & 0 & -\frac{f_x x}{z^2} \\ 0 & \frac{f_y}{z} & -\frac{f_y y}{z^2} \end{pmatrix}$$

### Splat Rendering

For each pixel $\mathbf{p}$, compute contribution from all Gaussians:

$$\mathbf{c}(\mathbf{p}) = \sum_i \alpha_i \mathbf{c}_i(\mathbf{d}) \exp\left(-\frac{1}{2} (\mathbf{p} - \mathbf{u}_i)^T (\boldsymbol{\Sigma}_{2D,i})^{-1} (\mathbf{p} - \mathbf{u}_i)\right) \prod_{j<i} (1-\alpha_j)$$

The transmittance product $\prod_{j<i} (1-\alpha_j)$ requires Gaussians to be sorted in depth order.

### Efficient Tile-Based Culling

To avoid computing all Gaussians at each pixel:
1. Divide screen into 16×16 pixel tiles
2. Determine which Gaussians intersect each tile using bounding boxes
3. Only process relevant Gaussians per tile
4. Sort Gaussians by depth within each tile

This reduces complexity from O(pixels × Gaussians) to O(pixels × relevant Gaussians).

## Adaptive Density Control

### Densification Strategy

Gaussians are added or removed during training to efficiently represent geometric details:

**Split**: When a Gaussian is too large but represents important high-frequency content:
- Replace with two smaller Gaussians
- Initialize near original position with 70% scale

**Clone**: When a Gaussian is small and has high gradient magnitude:
- Create identical copy at a slightly offset position
- Helps represent fine geometric features

**Prune**: Remove Gaussians that:
- Have very low opacity ($\alpha < \epsilon$)
- Are outside scene bounds
- Contribute little to training loss

```python
def densification_and_pruning(gaussians, optimizer, grad_threshold=0.0002):
    # Compute gradient statistics
    grad_norm = gaussians.xyz_grad.norm(dim=1)
    
    # Identify candidates for split
    split_mask = (grad_norm > grad_threshold) & (max_scale > max_scale_threshold)
    
    # Identify candidates for clone
    clone_mask = (grad_norm > grad_threshold) & (max_scale < max_scale_threshold)
    
    # Split: create two Gaussians from one
    split_gaussians = []
    for idx in torch.where(split_mask)[0]:
        new_xyz = gaussians.xyz[idx] + torch.randn(2, 3) * gaussians.scale[idx].mean()
        new_scale = gaussians.scale[idx] * 0.7
        split_gaussians.append((new_xyz, new_scale, gaussians.opacity[idx]))
    
    # Clone: duplicate promising small Gaussians
    clone_gaussians = []
    for idx in torch.where(clone_mask)[0]:
        offset = torch.randn(3) * gaussians.scale[idx].mean() * 0.1
        clone_gaussians.append((
            gaussians.xyz[idx] + offset,
            gaussians.scale[idx],
            gaussians.opacity[idx]
        ))
    
    # Prune low-opacity Gaussians
    prune_mask = gaussians.opacity.squeeze() < min_opacity
    
    return split_gaussians, clone_gaussians, prune_mask
```

### Gradient Flow Analysis

The gradient signal guides densification. High gradients indicate the model is "struggling" to fit details in that region, so addition of Gaussians helps:

- Gaussians with high position gradient: geometry needs refinement
- Gaussians with high color gradient: appearance detail required
- Small Gaussians with high gradients: clone for finer detail
- Large Gaussians with high gradients: split into smaller ones

Densification occurs every 100 iterations for the first 15k iterations, then every 1000 iterations until convergence.

## Training Pipeline

### Initialization

Begin with sparse 3D points from Structure-from-Motion (e.g., COLMAP):

```python
def initialize_from_sfm(points_3d, colors_3d, num_points=100000):
    # For each SfM point, create a Gaussian
    xyz = torch.tensor(points_3d, dtype=torch.float32)
    
    # Initialize scales based on average distance to neighbors
    distances = torch.cdist(xyz, xyz)
    distances[distances == 0] = float('inf')
    mean_dist = distances.min(dim=1)[0].mean()
    scales = torch.full_like(xyz, math.log(mean_dist))
    
    # Initialize rotation as identity
    quaternions = torch.zeros(len(points_3d), 4)
    quaternions[:, 0] = 1.0  # w component
    
    # Initialize opacity to 0.5 (moderate)
    opacities = torch.full((len(points_3d), 1), -1.0)  # logit space
    
    # Initialize SH coefficients to input colors
    sh0 = torch.tensor(colors_3d, dtype=torch.float32).unsqueeze(1)
    
    return xyz, scales, quaternions, opacities, sh0
```

### Loss Function

$$\mathcal{L} = \lambda_1 \mathcal{L}_1 + \lambda_2 \mathcal{L}_{D-SSIM}$$

where:
- $\mathcal{L}_1$ is mean absolute error between rendered and ground truth RGB
- $\mathcal{L}_{D-SSIM}$ is differentiable SSIM loss, providing perceptually-motivated gradients

$$\text{D-SSIM} = 1 - \text{SSIM}$$

Typical weights: $\lambda_1 = 0.8$, $\lambda_2 = 0.2$

SSIM provides smoother gradients for high-level structure compared to raw L1, improving convergence.

### Optimization Details

- **Optimizer**: Adam (β1=0.9, β2=0.999, eps=1e-8)
- **Learning rates**:
  - xyz: 1.6e-4 with exponential decay
  - scale: 5e-3 with exponential decay  
  - rotation: 1e-3 with exponential decay
  - opacity: 5e-2 with exponential decay
  - SH coefficients: 2.5e-3 with exponential decay

- **Training schedule**: ~30k iterations on single GPU (30GB VRAM) takes ~1 hour
- **Batch size**: All training images, sampling rays/pixels per iteration

Learning rates are 10-100× higher than NeRF due to more efficient gradient flow through rasterization.

## Comparison with NeRF

| Aspect | NeRF | Gaussian Splatting |
|--------|------|-------------------|
| **Representation** | Continuous implicit (MLP) | Discrete (Gaussian primitives) |
| **Rendering** | Ray-marching (volumetric) | Rasterization (splatting) |
| **Inference Speed** | ~2-4 sec per frame | 30-100 fps |
| **Training Time** | 1-2 hours | 30 mins |
| **Memory** | Compact model (few MB) | Larger (100s MB to GB) |
| **Real-time** | No | Yes |
| **Editability** | Implicit, hard to edit | Explicit points, easier editing |
| **Convergence** | Smooth, predictable | Sometimes noisy initially |
| **Extrapolation** | Better (continuous field) | Worse (explicit points) |

## Advanced Features

### Dynamic Scene Handling

For video/dynamic scenes, augment each Gaussian with time-dependent deformations:

$$\boldsymbol{\mu}_t = \boldsymbol{\mu}_0 + \mathbf{d}_t$$

where $\mathbf{d}_t$ is a learned deformation per Gaussian per frame. Similar per-frame color adjustments handle lighting changes:

$$\mathbf{c}_t(\mathbf{d}) = \mathbf{c}_0(\mathbf{d}) + \Delta\mathbf{c}_t$$

### Mesh Extraction

Convert Gaussian splatting to explicit mesh through:
1. **Marching Cubes**: Use Gaussian density as implicit SDF, run marching cubes at appropriate threshold
2. **Poisson Reconstruction**: Render depth from Gaussians, use Poisson surface reconstruction
3. **Direct Point Cloud**: Treat Gaussians as point cloud, apply conventional meshing (Ball Pivoting, Convex Hull)

Quality depends on scene complexity and initial reconstruction density.

## Applications

### Real-time Rendering
- Interactive 3D asset visualization
- VR/AR applications requiring 6DOF tracking
- Live game engines

### Content Creation
- Rapid asset generation from image collections
- Scene digitization for film/VFX pipelines
- Avatar capture from multi-view video

### Autonomous Systems
- 3D environment understanding for robotics
- SLAM/mapping with neural scene representations
- Real-time scene understanding for autonomous vehicles

## Limitations

- **Memory consumption**: Large scenes may require gigabytes
- **Extrapolation**: Cannot predict beyond training viewpoints reliably
- **Transparency**: Struggles with partially transparent materials
- **Thin geometry**: Difficult to represent thin surfaces (hair, fabric)
- **Temporal stability**: Dynamic versions less stable than static

## Future Research

**Hierarchical representations**: Multi-level Gaussians for LOD rendering

**Neural texture synthesis**: Replacing SH with neural textures for dynamic appearance

**Hybrid representations**: Combining explicit geometry (meshes) with Gaussians for best of both worlds

**Compression**: Lossy compression schemes for gigabyte-scale scenes
