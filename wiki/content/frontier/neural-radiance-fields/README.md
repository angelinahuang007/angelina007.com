---
title: Neural Radiance Fields (NeRF)
category: frontier
order: 1
tags: [NeRF, neural-rendering, volumetric, novel-view-synthesis]
description: Complete technical guide to neural radiance fields, volumetric rendering, positional encoding, MLP architectures, training pipelines, and practical variants like Instant-NGP and Mip-NeRF.
related: [frontier/gaussian-splatting, graphics-fundamentals/ray-tracing-fundamentals, graphics-fundamentals/global-illumination]
---

# Neural Radiance Fields (NeRF)

## Overview

Neural Radiance Fields (NeRF) represents a paradigm shift in view synthesis and 3D scene representation. Published by Mildenhall et al. in 2020, NeRF learns an implicit neural representation of a scene by training a fully-connected neural network to predict radiance (color) and density (opacity) at any 3D coordinate and viewing direction. This approach enables photorealistic novel view synthesis from sparse input images.

The core insight: a scene can be represented as a continuous 5D function $F_\theta: (\mathbf{x}, \mathbf{d}) \rightarrow (\mathbf{c}, \sigma)$ where $\mathbf{x} \in \mathbb{R}^3$ is 3D position, $\mathbf{d}$ is viewing direction, $\mathbf{c}$ is RGB color, and $\sigma$ is volume density.

## The Volumetric Rendering Equation

NeRF uses classical volumetric rendering to convert the implicit representation into images:

$$C(\mathbf{r}) = \int_0^{\infty} T(t) \sigma(\mathbf{r}(t)) \mathbf{c}(\mathbf{r}(t), \mathbf{d}) \, dt$$

Where:
- $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$ is the ray parameterized by origin $\mathbf{o}$ and direction $\mathbf{d}$
- $\sigma(t)$ is the volume density (opacity) at position $\mathbf{r}(t)$
- $T(t) = \exp\left(-\int_0^t \sigma(\mathbf{r}(s)) ds\right)$ is the transmittance (accumulated transparency)
- $\mathbf{c}(t, \mathbf{d})$ is the emitted radiance, dependent on both position and view direction

In practice, this integral is approximated using quadrature:

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i \left(1 - \exp(-\sigma_i \delta_i)\right) \mathbf{c}_i$$

where $T_i = \exp\left(-\sum_{j=1}^{i-1} \sigma_j \delta_j\right)$ and $\delta_i$ is the distance between adjacent samples along the ray.

## Positional Encoding

A critical component enabling NeRF's success is positional encoding. Raw 3D coordinates fed directly to a neural network lack the inductive bias to learn high-frequency details. The solution uses sinusoidal encoding:

$$\gamma(\mathbf{p}) = \left(\sin(2^0 \pi \mathbf{p}), \cos(2^0 \pi \mathbf{p}), \sin(2^1 \pi \mathbf{p}), \cos(2^1 \pi \mathbf{p}), \ldots, \sin(2^{L-1} \pi \mathbf{p}), \cos(2^{L-1} \pi \mathbf{p})\right)$$

This creates $2L$ features per coordinate. Position and direction use different encoding depths: typically $L_\gamma = 10$ for position (resulting in 60-dimensional features) and $L_d = 4$ for direction (8-dimensional).

The mathematical intuition: sinusoidal encodings create a Fourier basis allowing the network to represent arbitrarily high frequencies. This is related to the Neural Tangent Kernel (NTK) theory and demonstrates how to make neural networks effective feature learners.

## MLP Architecture

The network architecture is surprisingly simple: two 8-layer MLPs with 256 hidden units:

```python
class NeRFNetwork(nn.Module):
    def __init__(self, input_ch=60, input_ch_views=24, hidden_dim=256):
        super().__init__()
        
        # Main MLP for density and intermediate features
        self.fc1 = nn.Linear(input_ch, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, hidden_dim)
        self.fc4 = nn.Linear(hidden_dim, hidden_dim)
        
        self.fc5 = nn.Linear(input_ch + hidden_dim, hidden_dim)
        self.fc6 = nn.Linear(hidden_dim, hidden_dim)
        self.fc7 = nn.Linear(hidden_dim, hidden_dim)
        
        # Density prediction
        self.sigma_layer = nn.Linear(hidden_dim, 1)
        
        # Second MLP for color (view-dependent)
        self.fc8 = nn.Linear(hidden_dim + input_ch_views, hidden_dim)
        self.fc9 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.rgb_layer = nn.Linear(hidden_dim // 2, 3)
        
    def forward(self, x, d):
        # x: positional encoding (60D)
        # d: directional encoding (24D)
        
        h = F.relu(self.fc1(x))
        h = F.relu(self.fc2(h))
        h = F.relu(self.fc3(h))
        h = F.relu(self.fc4(h))
        
        # Skip connection from input
        h = F.relu(self.fc5(torch.cat([x, h], -1)))
        h = F.relu(self.fc6(h))
        h = F.relu(self.fc7(h))
        
        # Density is view-independent
        sigma = self.sigma_layer(h)
        sigma = F.relu(sigma)
        
        # Color depends on viewing direction
        h = torch.cat([h, d], -1)
        h = F.relu(self.fc8(h))
        h = F.relu(self.fc9(h))
        rgb = torch.sigmoid(self.rgb_layer(h))
        
        return torch.cat([rgb, sigma], -1)
```

The architecture separates density prediction (view-independent, determined by geometry) from color prediction (view-dependent, capturing specular reflections and brdf effects). This inductive bias proves crucial for learning accurate representations.

## Training Pipeline

### Data Acquisition
Training requires camera poses and calibration from multi-view images. Classical structure-from-motion (COLMAP) or traditional photogrammetry produces initial camera parameters and sparse 3D points.

### Ray Sampling Strategy
For each training iteration:
1. Sample a random image from the training set
2. Sample random rays within that image (typically 1024 rays per batch)
3. Sample 64 points coarsely along each ray (Nc=64)
4. Sample 128 points in a stratified manner between coarse points (Nf=128)

This coarse-to-fine hierarchical sampling accelerates convergence by focusing computation on relevant regions.

### Loss Function
$$\mathcal{L} = \sum_{i \in \text{rays}} \left\| \hat{C}_i - C_i^{\text{gt}} \right\|_2^2 + \left\| \hat{C}_i^{\text{coarse}} - C_i^{\text{gt}} \right\|_2^2$$

where the first term is the fine loss and second is coarse loss from the hierarchical sampling network.

### Optimization
- Adam optimizer with learning rate 5e-4
- Exponential decay schedule: $\text{lr}(t) = 5 \times 10^{-4} \times 0.1^{t/300000}$
- Training typically requires 100k-300k iterations
- GPU memory: typically 1-2 hours on a single V100

## NeRF Variants and Extensions

### Instant-NGP (Instant Neural Graphics Primitives)
Published by Müller et al. at NVIDIA, Instant-NGP achieves 100-1000× speedup through:

**Multi-resolution Hash Encoding**: Instead of sinusoidal encoding, uses a multi-resolution hash table:
- Each resolution level $l$ maintains a hash table with $T_l$ entries
- For each coordinate, compute hash values at each level
- Bilinear interpolation between hash table entries
- Learnable features stored in hash tables rather than network weights

The hash function: $h(\mathbf{x}) = (\oplus_{i=0}^{2} x_i \cdot p_i) \mod T$, where $p_i$ are large primes and $\oplus$ is XOR.

This allows:
- Shallow networks (2-3 layers) sufficient for good results
- Training in minutes instead of hours
- Compact representation suitable for real-time inference

### Mip-NeRF
Addresses aliasing artifacts when viewing at different scales. Key improvements:

**Integrated Positional Encoding**: Instead of encoding a point $\mathbf{x}$, encode a cone-shaped uncertainty region:
$$\gamma(\mathbf{x}, \sigma^2) = \left(\sin(2^k \pi \mathbf{x}) \cdot \exp\left(-\frac{1}{2}(2^k \pi \sigma)^2\right), \ldots\right)$$

This provides frequency-dependent weighting: high frequencies are attenuated when uncertainty is large (distant/coarse views).

**IPE Properties**:
- Naturally handles level-of-detail anti-aliasing
- Enables graceful degradation across scales
- Matches classical mipmap filtering theory

### NeRF in the Wild
Handles:
- Variable lighting conditions
- Dynamic transient objects
- Unknown camera exposure settings

Uses per-image learned embeddings for appearance and extra latent codes for transients, decomposing scenes into static content (rendered by NeRF) and transient elements.

## Limitations and Challenges

### Computational Cost
- Forward pass through 16-layer network for millions of samples
- Dense sampling needed for quality (256+ samples per ray)
- Training requires substantial data and time

### Data Requirements
- Typically needs 50-100+ high-quality calibrated images
- Fails gracefully with sparse input
- Requires good camera calibration

### Representation Limitations
- Struggles with glossy/mirror materials (high-frequency view dependence)
- Cannot extrapolate significantly beyond training viewpoints
- Poor at handling transparency and complex materials

### Physical Realism
- Lacks physical grounding in radiometry
- Cannot predict appearance under novel illumination
- No guarantee of physical plausibility

## Practical Applications

### Virtual Production
NeRF powers novel view synthesis for virtual cameras in film/broadcast. Actors perform once; synthetic cameras can be placed anywhere post-shoot within the capture volume.

### Real Estate and Retail
Immersive product visualization from sparse images. Users can orbit products and examine from any angle.

### Scene Completion and Reconstruction
Combining NeRF with depth estimation for 3D scene understanding, robotic manipulation, and AR placement.

### Digital Heritage
Capturing cultural artifacts and archaeological sites with high-fidelity 3D+appearance reconstruction from museum collections.

## Future Directions

**Neural Radiance Caches**: Decoupling view synthesis from input view count through learned appearance priors.

**Differentiable Rendering Integration**: Using NeRF as a rendering engine for inverse problems (material estimation, lighting recovery).

**Dynamic NeRF**: Extending to video with per-frame weights or coordinate deformation fields tracking motion.

**Hybrid Geometry-Neural**: Combining explicit mesh geometry with NeRF for better generalization and editing capabilities.

## References and Further Reading

- Mildenhall, B., et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis
- Müller, T., et al. (2022). Instant Neural Graphics Primitives with a Multiresolution Hash Encoding
- Barron, J. T., et al. (2021). Mip-NeRF: A Multiscale Representation for Anti-Aliasing Neural Radiance Fields
- Martin-Brualla, R., et al. (2021). NeRF in the Wild: Neural Radiance Fields for Unconstrained Photo Collections
