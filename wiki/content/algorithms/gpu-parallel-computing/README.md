---
title: GPU Parallel Computing
category: algorithms
tags: [GPU, parallel-computing, compute-shader, CUDA, SIMD]
description: GPU architecture, compute shaders, parallel reduction, sorting algorithms, and optimization techniques for GPU computation.
related: [graphics-fundamentals/rasterization-pipeline, graphics-fundamentals/realtime-rendering-pipeline, game-engines/unreal/niagara-particles]
order: 4
---

# GPU Parallel Computing

GPUs excel at massively parallel computation. Whereas CPUs optimize for sequential performance (fast clock speeds, sophisticated branch prediction), GPUs sacrifice individual thread speed for thousands of concurrent threads. A modern GPU processes 10,000+ threads simultaneously.

## GPU Architecture Fundamentals

### Memory Hierarchy

GPUs have distinct memory layers with different access characteristics:

```
Registers (per-thread)
├─ 32-256 bytes per thread
├─ Latency: <1 cycle
└─ Bandwidth: per-thread only

Shared Memory (per-threadblock)
├─ 48-96 KB per block (128-512 threads)
├─ Latency: 1-2 cycles
└─ Bandwidth: ~1TB/s (fast!)

L2 Cache (chip-wide)
├─ 256KB - 12MB
├─ Latency: 20-40 cycles
└─ Bandwidth: comparable to L2 on CPU

Global Memory (VRAM)
├─ 2GB - 48GB (depends on GPU)
├─ Latency: 200-400 cycles (!!)
└─ Bandwidth: ~1TB/s (but long latency hides bandwidth)
```

**Key insight:** Global memory access is expensive (200+ cycle latency). Computation is cheap; data movement expensive. Algorithms must maximize computation-per-memory-access ratio.

### Execution Model: Warps and Blocks

Threads organized hierarchically:

**Warp:** 32 threads executing same instruction in parallel (NVIDIA) or 64 (AMD). Critical concept: all threads in warp must follow same code path or performance degrades.

```glsl
// GPU code: thousands of instances of this execute in parallel
void compute_kernel(int index) {
  if (index < size) {  // Divergence: bad!
    // Half the warp takes this branch
    expensive_operation();
  } else {
    // Other half waits (wasted cycles)
    simple_operation();
  }
  
  barrier();  // Wait for all threads in block
}
```

**Thread block:** 32-1024 threads (typically 256) sharing local memory, executing on single multiprocessor.

**Grid:** Collection of blocks executing simultaneously across GPU.

### Memory Coalescing

Global memory accessed in 128-byte "cache lines." Accessing consecutive memory locations (thread 0 reads address 0, thread 1 reads address 4, etc.) accesses single cache line. Random access costs multiple cache lines.

**Optimal memory access pattern:**

```glsl
// Good: sequential access
int idx = threadIdx.x + blockIdx.x * blockDim.x;
float value = global_array[idx];  // All threads access consecutive memory

// Bad: strided access
int idx = (threadIdx.x + blockIdx.x * blockDim.x) * stride;
float value = global_array[idx];  // Threads skip around; cache misses
```

## Compute Shaders

Compute shaders (OpenGL/Vulkan) or kernel functions (CUDA) express parallel algorithms.

### Basic Compute Shader Structure

```glsl
#version 430
layout(local_size_x = 256) in;

layout(std430, binding = 0) buffer InputBuffer {
  float data[];
} input_buf;

layout(std430, binding = 1) buffer OutputBuffer {
  float data[];
} output_buf;

void main() {
  uint idx = gl_GlobalInvocationID.x;
  
  // Boundary check
  if (idx >= input_buf.data.length()) return;
  
  // Process element
  float value = input_buf.data[idx];
  output_buf.data[idx] = value * 2.0;  // Simple double
}
```

**Launch:**
```cpp
// C++
glDispatchCompute((N + 255) / 256, 1, 1);  // Round up to multiple of 256
glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
```

### Work-Efficient Parallel Reduction

Reduce N values to single result (sum, max, min). Naive approach: thread 0 accumulates all values (O(N) sequential).

**Efficient approach:** Logarithmic reduction with synchronization.

```glsl
#version 430
layout(local_size_x = 256) in;

layout(std430, binding = 0) buffer DataBuffer {
  float data[];
} buf;

shared float shared_data[256];

void main() {
  uint idx = gl_GlobalInvocationID.x;
  uint local_idx = gl_LocalInvocationIndex;
  
  // Load from global to shared memory
  if (idx < buf.data.length()) {
    shared_data[local_idx] = buf.data[idx];
  } else {
    shared_data[local_idx] = 0.0;
  }
  
  memoryBarrierShared();
  barrier();
  
  // Reduction tree: stride halves each iteration
  for (uint stride = 128; stride > 0; stride >>= 1) {
    if (local_idx < stride) {
      shared_data[local_idx] += shared_data[local_idx + stride];
    }
    memoryBarrierShared();
    barrier();
  }
  
  // First thread outputs result
  if (local_idx == 0) {
    buf.data[gl_WorkGroupID.x] = shared_data[0];
  }
}
```

**Complexity:**
- Naive: O(N) time, 1 thread working
- Reduction tree: O(log N) time, N threads working (total operations: O(N log N) but parallel)

**Key optimization:** Use shared memory (fast) instead of global memory for intermediate sums.

### Prefix Sum (Inclusive Scan)

Compute cumulative sum: output[i] = input[0] + input[1] + ... + input[i].

Essential for sorting, stream compaction, histogram computation.

```glsl
#version 430
layout(local_size_x = 256) in;

layout(std430, binding = 0) buffer DataBuffer {
  uint data[];
} buf;

shared uint shared_data[512];  // 2x local size for up-sweep and down-sweep

void main() {
  uint idx = gl_GlobalInvocationID.x;
  uint local_idx = gl_LocalInvocationIndex;
  
  // Load into shared memory
  shared_data[local_idx * 2] = (idx * 2 < buf.data.length()) ? 
    buf.data[idx * 2] : 0;
  shared_data[local_idx * 2 + 1] = (idx * 2 + 1 < buf.data.length()) ? 
    buf.data[idx * 2 + 1] : 0;
  
  memoryBarrierShared();
  barrier();
  
  // Up-sweep (reduce)
  for (uint stride = 1; stride < 512; stride *= 2) {
    uint index = (local_idx + 1) * stride * 2 - 1;
    if (index < 512) {
      shared_data[index] += shared_data[index - stride];
    }
    memoryBarrierShared();
    barrier();
  }
  
  // Down-sweep (distribute)
  for (uint stride = 256; stride > 0; stride /= 2) {
    uint index = (local_idx + 1) * stride * 2 - 1;
    if (index + stride < 512) {
      shared_data[index + stride] += shared_data[index];
    }
    memoryBarrierShared();
    barrier();
  }
  
  // Write results
  if (idx * 2 < buf.data.length()) {
    buf.data[idx * 2] = shared_data[local_idx * 2];
  }
  if (idx * 2 + 1 < buf.data.length()) {
    buf.data[idx * 2 + 1] = shared_data[local_idx * 2 + 1];
  }
}
```

## Sorting on GPU

Sorting is critical bottleneck for many GPU algorithms. CPU quicksort (divergent control flow) is disastrous on GPU.

### Bitonic Sort: O(log² N) Parallel

Bitonic sort compares elements at fixed distances, enabling parallel comparison stages.

```glsl
#version 430
layout(local_size_x = 256) in;

layout(std430, binding = 0) buffer DataBuffer {
  uint data[];
} buf;

void main() {
  uint idx = gl_GlobalInvocationID.x;
  uint block_size = buf.data.length();
  
  // Bitonic sorting network
  for (uint stride = 1; stride < block_size; stride *= 2) {
    for (uint block_size_inner = stride * 2; block_size_inner <= block_size; 
         block_size_inner *= 2) {
      
      uint sorted_idx = idx / (block_size_inner / 2) * block_size_inner + 
                        idx % (stride);
      uint compare_idx = sorted_idx + stride;
      
      bool should_swap = (compare_idx < block_size) &&
                         ((idx / block_size_inner) % 2 == 0) ?
                         (buf.data[sorted_idx] > buf.data[compare_idx]) :
                         (buf.data[sorted_idx] < buf.data[compare_idx]);
      
      if (should_swap) {
        uint temp = buf.data[sorted_idx];
        buf.data[sorted_idx] = buf.data[compare_idx];
        buf.data[compare_idx] = temp;
      }
      
      memoryBarrierBuffer();
      barrier();
    }
  }
}
```

**Complexity:** O(log² N) depth (comparison stages); O(N log² N) total work (suboptimal but highly parallel).

### Radix Sort: O(N) but GPU-friendly

Sorts by examining one digit (bit) at a time.

```glsl
#version 430
layout(local_size_x = 256) in;

layout(std430, binding = 0) buffer InputBuffer {
  uint data[];
} input_buf;

layout(std430, binding = 1) buffer OutputBuffer {
  uint data[];
} output_buf;

layout(std430, binding = 2) buffer CounterBuffer {
  uint data[];
} counter_buf;

void main() {
  uint idx = gl_GlobalInvocationID.x;
  
  for (uint bit = 0; bit < 32; bit++) {
    // Extract bit
    uint bit_value = (input_buf.data[idx] >> bit) & 1;
    
    // Count ones up to this position (prefix sum)
    // Uses prefix sum algorithm (scan)
    uint position = prefix_sum(bit_value);
    
    // Write to output based on bit value
    if (bit_value == 1) {
      uint write_pos = count_zeros() + position;
      output_buf.data[write_pos] = input_buf.data[idx];
    } else {
      output_buf.data[position] = input_buf.data[idx];
    }
    
    // Swap buffers for next iteration
    memoryBarrierBuffer();
    barrier();
  }
}
```

**Complexity:** O(32N) for 32-bit integers = O(N); highly parallel.

## Bank Conflicts and Optimization

Shared memory is divided into banks. Multiple threads accessing same bank simultaneously cause serialization.

```glsl
// Bank conflict: all threads access different banks (good!)
shared float data[256];
float value = data[threadIdx.x];  // Thread 0: bank 0, thread 1: bank 1, etc.

// Bank conflict: all threads access same bank (bad!)
shared float data[256];
float value = data[threadIdx.x / 2];  // Threads pair up on same bank
```

**Solution:** Padding to avoid bank conflicts.

```glsl
// With padding
shared float data[256 + (256 / 32)];  // Extra elements to offset banks
float value = data[threadIdx.x * 1 + threadIdx.x / 32];  // Spread across banks
```

## Occupancy and Throughput

GPU's ability to hide latency depends on having enough threads to schedule while one stalls waiting for memory.

**Occupancy:** (Active threads) / (Maximum threads the GPU can run) × 100%

```
Low occupancy (25%): When one thread waits for memory, 75% of multiprocessor idle
High occupancy (100%): When one thread waits, others execute; latency hidden
```

**Factors limiting occupancy:**
- Register usage (each thread allocates registers; limited pool per multiprocessor)
- Shared memory usage (each block allocates; limited per multiprocessor)
- Thread block size (some block sizes align better with hardware)

**Optimization example:**

```glsl
// Uses 64 registers per thread
void expensive_kernel() {
  float temp[32];  // Allocates 32 registers
  // ... complex computation ...
}

// Refactored to use fewer registers
void optimized_kernel() {
  // Process data in chunks, reusing registers
  for (int chunk = 0; chunk < total_chunks; chunk++) {
    float temp[8];  // Only 8 registers
    // Process chunk
  }
}
```

Reducing registers from 64 to 32 per thread doubles occupancy if that was the bottleneck.

## Practical GPU Algorithm Patterns

### Map: Element-wise transformation

```glsl
// Each thread processes one element independently
for (uint idx = 0; idx < N; idx += grid_size) {
  output[idx] = transform(input[idx]);
}
```

**Occupancy:** Excellent (minimal shared memory, few registers).

### Reduce: Aggregate to single value

```glsl
// Parallel reduction using shared memory
float result = parallel_sum(input_array);
```

**Occupancy:** Good (shared memory moderate).

### Scan: Prefix sum

```glsl
// Sequential within thread block, multiple passes across blocks
uint prefix_sum_value = parallel_scan(input_array, index);
```

**Occupancy:** Moderate (barrier synchronization limits parallelism).

### Compact: Remove elements matching condition

```glsl
// Count elements matching condition (reduce)
// Compute output positions (scan)
// Write selected elements to output (map)
```

**Occupancy:** Complex (multiple kernels, synchronization overhead).

## CUDA vs Compute Shader vs Metal

| Aspect | CUDA | Compute Shader | Metal |
|--------|------|---|---|
| Language | C++ with extensions | GLSL | Objective-C++ |
| Platform | NVIDIA GPUs only | OpenGL (all vendors) | Apple/Metal (all Apple devices) |
| Maturity | Very mature (15+ years) | Newer, evolving | Relatively new |
| Performance | Maximum optimization | Good, vendor-optimized | Excellent on Apple hardware |
| Learning curve | Steep (C++ required) | Moderate (GLSL familiar) | Moderate (Objective-C) |
| Ecosystem | Excellent (libraries, tools) | Good (less specialized tools) | Growing |

**Selection guidance:**
- NVIDIA-only pipeline → CUDA
- Cross-vendor flexibility → Compute shader
- Apple ecosystem → Metal
- Game engines → Compute shader (built-in support)

## Performance Tuning Checklist

1. **Benchmark baseline:** Time kernel before optimization
2. **Identify bottleneck:** Is memory bandwidth or compute latency limiting?
3. **Improve occupancy:** Reduce registers/shared memory, larger thread blocks
4. **Coalesce memory access:** Sequential addressing, avoid strided access
5. **Minimize divergence:** Keep all threads in warp on same code path
6. **Use shared memory:** Cache frequently-accessed data locally
7. **Reduce synchronization:** Barriers are expensive; group work into independent tasks
8. **Rebenmark:** Verify improvement

Typical speedup from optimization: 2-10x compared to naive implementation. Beyond that requires algorithmic changes (different algorithm better suited to GPU).

GPU computing excels when computation is highly parallel, data access patterns predictable, and control flow uniform across threads. Inherently sequential algorithms remain CPU-bound.
