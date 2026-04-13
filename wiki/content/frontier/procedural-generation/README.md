---
title: Procedural Content Generation
category: frontier
order: 5
tags: [procedural, noise, WFC, L-systems, terrain, generation]
description: Comprehensive guide to procedural generation including noise functions, Wave Function Collapse, L-systems, terrain, city generation, and art-directability techniques.
related: [algorithms/computational-geometry, blender/shader-nodes, frontier/ai-content-generation]
---

# Procedural Content Generation

## Introduction

Procedural content generation (PCG) creates complex structures algorithmically rather than through manual placement. From infinite terrain to intricate vegetation to entire city layouts, PCG enables rapid content creation at scale while maintaining artistic control through parametrization.

This guide covers foundational noise functions, advanced techniques like Wave Function Collapse, L-systems, and strategies for balancing automation with artistic intent.

## Noise Functions

### Perlin Noise

Ken Perlin's foundational work (1985) creates smooth, natural-looking pseudorandom patterns ideal for terrain, clouds, and marble textures.

**Algorithm**:
1. Create regular grid with random gradient vectors at each grid point
2. For query point, find containing grid cell
3. Compute dot products with corner gradients
4. Interpolate results using smooth step function

```python
import math
import numpy as np

class PerlinNoise:
    def __init__(self, seed=0):
        np.random.seed(seed)
        self.permutation = np.arange(256, dtype=np.int32)
        np.random.shuffle(self.permutation)
        self.permutation = np.concatenate([self.permutation, self.permutation])
        
        # Precompute gradients (12 directions for 2D, 16 for 3D)
        self.gradients_2d = [
            (1, 1), (1, -1), (-1, 1), (-1, -1),
            (1, 0), (-1, 0), (0, 1), (0, -1)
        ]
    
    def fade(self, t):
        """Smoothstep interpolation: 3t^2 - 2t^3"""
        return t * t * (3.0 - 2.0 * t)
    
    def lerp(self, t, a, b):
        """Linear interpolation"""
        return a + t * (b - a)
    
    def dot_gradient(self, hash_val, x, y):
        """Compute dot product with gradient"""
        gradient = self.gradients_2d[hash_val % 8]
        return gradient[0] * x + gradient[1] * y
    
    def perlin2d(self, x, y):
        """Compute 2D Perlin noise at (x, y)"""
        # Find grid cell
        xi = int(x) % 256
        yi = int(y) % 256
        
        # Coordinates within grid cell
        xf = x - int(x)
        yf = y - int(y)
        
        # Hash corners
        h00 = self.permutation[self.permutation[xi] + yi]
        h10 = self.permutation[self.permutation[xi + 1] + yi]
        h01 = self.permutation[self.permutation[xi] + yi + 1]
        h11 = self.permutation[self.permutation[xi + 1] + yi + 1]
        
        # Gradient dot products
        g00 = self.dot_gradient(h00, xf, yf)
        g10 = self.dot_gradient(h10, xf - 1, yf)
        g01 = self.dot_gradient(h01, xf, yf - 1)
        g11 = self.dot_gradient(h11, xf - 1, yf - 1)
        
        # Interpolate
        u = self.fade(xf)
        v = self.fade(yf)
        
        x1 = self.lerp(u, g00, g10)
        x2 = self.lerp(u, g01, g11)
        
        return self.lerp(v, x1, x2)
```

**Properties**:
- Seamlessly tiles
- Smooth (continuous gradient)
- Natural appearance
- Deterministic from seed

### Simplex Noise

Perlin's later work (2002) improves on Perlin noise:

- Faster computation (especially in high dimensions)
- Less directional artifacts
- Higher quality gradients

Uses simplex (triangle in 2D, tetrahedron in 3D) instead of square grid:

```python
class SimplexNoise:
    def __init__(self, seed=0):
        np.random.seed(seed)
        self.permutation = np.arange(256, dtype=np.int32)
        np.random.shuffle(self.permutation)
        self.permutation = np.concatenate([self.permutation, self.permutation])
        
        # 3D gradients
        self.gradients = np.array([
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
            [1, 1, 0], [0, -1, 1], [-1, 1, 0], [0, -1, -1]
        ])
    
    def simplex3d(self, x, y, z):
        """3D simplex noise"""
        # Fast floor
        xi = int(x) if x >= 0 else int(x) - 1
        yi = int(y) if y >= 0 else int(y) - 1
        zi = int(z) if z >= 0 else int(z) - 1
        
        # Fractional parts
        xf = x - xi
        yf = y - yi
        zf = z - zi
        
        # Determine simplex cell
        if xf >= yf:
            if yf >= zf:
                order = [0, 1, 2]  # X > Y > Z
            elif xf >= zf:
                order = [0, 2, 1]  # X > Z >= Y
            else:
                order = [2, 0, 1]  # Z > X > Y
        else:
            if yf < zf:
                order = [2, 1, 0]  # Z > Y >= X
            elif xf < zf:
                order = [1, 2, 0]  # Y >= Z > X
            else:
                order = [1, 0, 2]  # Y >= X > Z
        
        # Four corner contributions
        corners = [
            (0, 0, 0),
            tuple(1 if i == order[0] else 0 for i in range(3)),
            tuple(1 if i in order[:2] else 0 for i in range(3)),
            (1, 1, 1)
        ]
        
        result = 0.0
        for i, corner in enumerate(corners):
            dx = xf - corner[0]
            dy = yf - corner[1]
            dz = zf - corner[2]
            
            # Attenuation
            t = 0.6 - dx*dx - dy*dy - dz*dz
            if t >= 0:
                # Hash to gradient
                h = self.permutation[(self.permutation[(self.permutation[xi + corner[0]] + yi + corner[1]) & 255] + zi + corner[2]) & 255]
                grad = self.gradients[h & 15]
                
                # Contribution
                result += pow(t, 4) * (grad[0]*dx + grad[1]*dy + grad[2]*dz)
        
        return 32 * result
```

### Worley Noise

Creates cellular/Voronoi patterns:

$$F(p) = \min_i \|p - c_i\|$$

where $c_i$ are randomly distributed cell centers.

```python
class WorleyNoise:
    def __init__(self, seed=0):
        np.random.seed(seed)
    
    def worley2d(self, x, y, scale=1.0):
        """Worley noise based on distance to nearest feature point"""
        x_scaled = x / scale
        y_scaled = y / scale
        
        # Grid cell
        grid_x = int(x_scaled)
        grid_y = int(y_scaled)
        
        local_x = x_scaled - grid_x
        local_y = y_scaled - grid_y
        
        min_dist = float('inf')
        
        # Check 3x3 neighborhood
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                cell_x = grid_x + dx
                cell_y = grid_y + dy
                
                # Hash to get feature points
                np.random.seed(cell_x * 73856093 ^ cell_y * 19349663)
                
                # Multiple points per cell
                num_points = 1
                for _ in range(num_points):
                    fx = np.random.rand()
                    fy = np.random.rand()
                    
                    # Distance to this point
                    dist = math.sqrt(
                        (local_x - fx + dx) ** 2 +
                        (local_y - fy + dy) ** 2
                    )
                    
                    min_dist = min(min_dist, dist)
        
        return min_dist
```

Uses cases: cracks, stone texture, plant distribution.

### Domain Warping

Enhance noise variety by distorting coordinates:

$$n(\mathbf{p}) = \text{Perlin}(\mathbf{p} + \text{Perlin}(\mathbf{p}))$$

Layering multiple warps creates fractal-like complexity:

```python
def domain_warp(x, y, iterations=4, amplitude=1.0):
    """Repeatedly distort space with noise"""
    for i in range(iterations):
        scale = 2.0 ** i
        offset_x = simplex(x * scale, y * scale) * amplitude
        offset_y = simplex(x * scale + 100, y * scale + 100) * amplitude
        
        x += offset_x
        y += offset_y
    
    return simplex(x, y)
```

## Fractional Brownian Motion (fBm)

Combine multiple octaves of noise at different scales:

$$n(\mathbf{p}) = \sum_{i=0}^{O} \frac{\text{noise}(\text{scale}_i \mathbf{p})}{\text{amplitude}_i}$$

where amplitude typically halves per octave (lacunarity = 2.0).

```python
def fbm(x, y, octaves=6, persistence=0.5, lacunarity=2.0, amplitude=1.0):
    """Fractional Brownian Motion: layered noise"""
    result = 0.0
    freq = 1.0
    amp = amplitude
    max_value = 0.0
    
    for i in range(octaves):
        result += simplex(x * freq, y * freq) * amp
        max_value += amp
        
        freq *= lacunarity
        amp *= persistence
    
    return result / max_value
```

This creates natural-looking terrain with detail at multiple scales.

## Wave Function Collapse (WFC)

Generates complex patterns by enforcing local constraints. Given example tile patterns, WFC synthesizes new patterns maintaining consistency.

### Algorithm Overview

1. **Tile extraction**: Analyze input image, extract all N×N tile patterns and their frequencies
2. **Constraint propagation**: Build adjacency rules (which tiles can neighbor which)
3. **Grid initialization**: Create output grid, mark all positions as "undecided"
4. **Collapse**: Repeatedly select lowest-entropy undecided position, collapse to random valid tile, propagate constraints
5. **Backtrack**: If contradiction found (position has no valid tiles), backtrack to last decision point

```python
class WaveFunctionCollapse:
    def __init__(self, input_image, tile_size=3):
        self.tile_size = tile_size
        self.tiles = self._extract_tiles(input_image)
        self.adjacency = self._compute_adjacency()
        self.tile_counts = {}
        for tile in self.tiles:
            self.tile_counts[tile] = self.tile_counts.get(tile, 0) + 1
    
    def _extract_tiles(self, image):
        """Extract all tile_size x tile_size patterns from image"""
        h, w = image.shape[:2]
        tiles = []
        for y in range(h - self.tile_size + 1):
            for x in range(w - self.tile_size + 1):
                tile = image[y:y+self.tile_size, x:x+self.tile_size]
                tiles.append(tuple(tile.flatten()))
        return list(set(tiles))
    
    def _compute_adjacency(self):
        """Determine which tiles can be adjacent"""
        adjacency = {tile: {'up': set(), 'right': set(), 'down': set(), 'left': set()} 
                     for tile in self.tiles}
        
        # Would analyze actual adjacencies from input
        # Simplified: all tiles adjacent
        for tile in self.tiles:
            adjacency[tile]['up'] = set(self.tiles)
            adjacency[tile]['right'] = set(self.tiles)
            adjacency[tile]['down'] = set(self.tiles)
            adjacency[tile]['left'] = set(self.tiles)
        
        return adjacency
    
    def collapse(self, width, height):
        """Generate output grid of given size"""
        # Initialize: all positions have all tiles possible
        grid = [[set(self.tiles) for _ in range(width)] for _ in range(height)]
        
        while True:
            # Find cell with minimum entropy > 0
            min_entropy = float('inf')
            min_pos = None
            
            for y in range(height):
                for x in range(width):
                    entropy = len(grid[y][x])
                    if 0 < entropy < min_entropy:
                        min_entropy = entropy
                        min_pos = (y, x)
            
            if min_pos is None:
                # All cells decided (entropy 1) or contradiction (entropy 0)
                # Check for contradictions
                for y in range(height):
                    for x in range(width):
                        if len(grid[y][x]) == 0:
                            return None  # Contradiction, backtrack needed
                break
            
            # Collapse min_pos cell
            y, x = min_pos
            possible = list(grid[y][x])
            weights = [self.tile_counts[tile] for tile in possible]
            chosen = np.random.choice(possible, p=np.array(weights)/sum(weights))
            grid[y][x] = {chosen}
            
            # Propagate constraints
            self._propagate(grid, height, width)
        
        return grid
    
    def _propagate(self, grid, height, width):
        """Propagate constraints after collapse"""
        changed = True
        while changed:
            changed = False
            
            for y in range(height):
                for x in range(width):
                    current = grid[y][x]
                    
                    # Check neighbors
                    if y > 0:
                        above = grid[y-1][x]
                        valid_above = {t for t in above 
                                      if any(t2 in self.adjacency[t2]['down'] 
                                            for t2 in current)}
                        if len(valid_above) < len(above):
                            grid[y-1][x] = valid_above
                            changed = True
                    
                    # Similar for right, below, left...
```

### WFC Applications

- **Dungeon generation**: Ensure room connectivity while maintaining style
- **Texture synthesis**: Infinite textures from small samples
- **Level design**: Maintain consistency with reference design patterns
- **City layouts**: Generate neighborhoods respecting real-world patterns

## L-Systems

Generate plant/tree structures using formal grammar:

**Example**: Lévy curve
- Axiom: `F`
- Rules: `F → F+F-F-F+F`
- Operations: `F` (forward), `+` (rotate left 60°), `-` (rotate right 60°)

```python
class LSystem:
    def __init__(self, axiom, rules, angle):
        self.axiom = axiom
        self.rules = rules
        self.angle = angle
    
    def iterate(self, generations):
        """Generate L-system string"""
        result = self.axiom
        for _ in range(generations):
            new_result = ""
            for char in result:
                new_result += self.rules.get(char, char)
            result = new_result
        return result
    
    def draw(self, instructions):
        """Convert L-system string to drawing commands"""
        x, y = 0, 0
        angle = 0
        stack = []
        
        positions = [(x, y)]
        
        for char in instructions:
            if char == 'F':
                # Move forward
                x += math.cos(math.radians(angle))
                y += math.sin(math.radians(angle))
                positions.append((x, y))
            elif char == '+':
                angle += self.angle
            elif char == '-':
                angle -= self.angle
            elif char == '[':
                stack.append((x, y, angle))
            elif char == ']':
                x, y, angle = stack.pop()
                positions.append((x, y))
        
        return positions

# Plant example
rules = {
    'A': 'F[+A][-A]FfA',
    'f': 'FF'
}

plant = LSystem('A', rules, angle=25)
instructions = plant.iterate(5)
structure = plant.draw(instructions)
```

Produces realistic-looking trees, ferns, and branching structures.

## Terrain Generation

### Heightmap Generation

Combine fBm with post-processing:

```python
def generate_terrain(width, height, scale=100.0, octaves=6):
    """Generate heightmap using fBm"""
    heightmap = np.zeros((height, width))
    
    for y in range(height):
        for x in range(width):
            # Normalize coordinates
            nx = x / scale
            ny = y / scale
            
            # Sample fBm
            height_value = fbm(nx, ny, octaves=octaves, amplitude=1.0)
            
            # Scale to reasonable range
            height_value = (height_value + 1.0) / 2.0  # -1..1 to 0..1
            height_value = max(0, min(1, height_value))
            
            heightmap[y, x] = height_value
    
    # Post-processing
    # Erosion simulation
    heightmap = erode_hydraulic(heightmap, iterations=5)
    
    # Normalize
    heightmap = (heightmap - heightmap.min()) / (heightmap.max() - heightmap.min())
    
    return heightmap * 256  # Convert to 0-256 range

def erode_hydraulic(heightmap, iterations=1, erosion_radius=3):
    """Simple erosion simulation"""
    result = heightmap.copy()
    
    for _ in range(iterations):
        for y in range(1, result.shape[0]-1):
            for x in range(1, result.shape[1]-1):
                neighbors = []
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx != 0 or dy != 0:
                            neighbors.append(result[y+dy, x+dx])
                
                # Simple: lower toward average of neighbors
                avg_neighbor = np.mean(neighbors)
                result[y, x] = 0.7 * result[y, x] + 0.3 * avg_neighbor
    
    return result
```

## City Generation

Combine Worley noise with constraint-based growth:

```python
class CityGenerator:
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def generate(self, num_districts=8, street_width=3):
        """Generate city layout"""
        # Start with district centers (Worley cells)
        grid = np.zeros((self.height, self.width), dtype=int)
        
        # Assign pixels to nearest district center
        for y in range(self.height):
            for x in range(self.width):
                dist = worley2d(x, y, scale=50)
                grid[y, x] = int(dist * 10) % num_districts
        
        # Add major roads
        grid = self._add_roads(grid, street_width)
        
        # Add building blocks
        buildings = self._place_buildings(grid, street_width)
        
        return grid, buildings
    
    def _add_roads(self, grid, width):
        """Add grid-like street pattern"""
        road_grid = grid.copy()
        
        # Major roads at regular intervals
        interval = 40
        for y in range(0, self.height, interval):
            road_grid[max(0, y-width):min(self.height, y+width), :] = -1  # Mark as road
        
        for x in range(0, self.width, interval):
            road_grid[:, max(0, x-width):min(self.width, x+width)] = -1
        
        return road_grid
    
    def _place_buildings(self, grid, street_width):
        """Place buildings in non-road cells"""
        buildings = []
        
        y = 0
        while y < self.height:
            x = 0
            while x < self.width:
                # Find connected non-road region
                if grid[y, x] != -1:
                    # Determine building bounds
                    width = 1
                    while x + width < self.width and grid[y, x+width] != -1:
                        width += 1
                    
                    height = 1
                    while y + height < self.height and all(grid[y+height, x+i] != -1 
                                                          for i in range(width)):
                        height += 1
                    
                    if width > 3 and height > 3:  # Minimum building size
                        buildings.append({
                            'x': x, 'y': y,
                            'width': width, 'height': height,
                            'type': grid[y, x]
                        })
                    
                    x += width
                else:
                    x += 1
            y += 1
        
        return buildings
```

## Art-Directability and Control

### Parameter-Driven Generation

Allow artists to control procedural output:

```python
class ProceduralArtist:
    def __init__(self):
        self.parameters = {
            'roughness': 0.5,
            'scale': 100.0,
            'octaves': 6,
            'color_saturation': 1.0,
            'feature_density': 1.0
        }
    
    def generate_with_control(self, seed, masks=None):
        """Generate respecting artistic constraints"""
        np.random.seed(seed)
        
        # Base generation
        result = self._generate_base()
        
        # Apply masks (hand-painted constraints)
        if masks is not None:
            result = self._apply_masks(result, masks)
        
        # Post-process based on parameters
        result = self._post_process(result)
        
        return result
    
    def _apply_masks(self, result, masks):
        """Blend procedural with hand-painted areas"""
        # masks: dict with 'mountain_range', 'water_bodies', 'vegetation'
        
        for mask_name, mask_data in masks.items():
            influence = mask_data['influence']  # 0..1
            
            if mask_name == 'mountain_range':
                # Enhance height in masked region
                result = np.where(mask_data['mask'] > 0.5,
                                result * (1 + 0.5 * influence),
                                result)
            
            elif mask_name == 'water_bodies':
                # Force low height in masked region
                result = np.where(mask_data['mask'] > 0.5,
                                result * 0.3,
                                result)
        
        return result
```

## PCG in Games vs. Film

### Games
- Infinite playable space
- Real-time generation budget constraints
- Reproducibility from seed
- Dynamic updates as player explores

### Film/VFX
- One-time pre-generation acceptable
- Quality over speed
- Artistic refinement of outputs
- Simulation of natural processes (water, erosion, growth)

## Future Directions

**Learning-based PCG**: Train neural networks on procedural outputs to learn generative patterns

**Interactive PCG**: Real-time editing with constraint propagation

**Physics-aware**: Ensure generated content respects physical simulation

**Semantic control**: Generate based on high-level descriptions (e.g., "temperate forest with ruins")
