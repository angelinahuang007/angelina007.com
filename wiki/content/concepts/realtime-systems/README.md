---
title: Real-Time System Design
category: concepts
order: 4
tags: [real-time, frame-budget, latency, buffering, vsync, networking]
description: Comprehensive guide to real-time system design principles including frame budgets, latency management, buffering strategies, and applications to games, digital twins, and live visualization.
related: [digital-twin/architecture-overview, digital-twin/realtime-data-pipeline, game-engines/unity/performance-optimization]
---

# Real-Time System Design

## Introduction

Real-time systems must produce output within strict deadlines. A game must render a new frame within 16ms (60fps). A robot control system must process sensor input and output motor commands within milliseconds. A live data dashboard must update within seconds. Missing deadlines leads to missed frames, control failure, or stale data.

This guide explores principles enabling systems to consistently meet timing constraints under varying computational loads.

## Frame Time and Budgets

### Frame Timing Fundamentals

For a display refreshing at 60Hz, a new frame appears every 16.667ms:

$$\text{Frame Time} = \frac{1}{\text{Frame Rate}} = \frac{1}{60} \approx 16.67 \text{ ms}$$

The system has exactly this window to:
1. Read input
2. Update simulation
3. Render
4. Display result

Exceeding the budget causes the frame to display late (jank) or drop (frame skip).

```cpp
class FrameTimer {
    double target_frame_time = 1.0 / 60.0;  // 16.67ms
    double frame_start_time = 0;
    
public:
    void frame_begin() {
        frame_start_time = get_current_time();
    }
    
    void frame_end() {
        double elapsed = get_current_time() - frame_start_time;
        double remaining = target_frame_time - elapsed;
        
        if (remaining > 0) {
            sleep(remaining);  // Wait for frame pacing
        } else {
            // Frame overrun - either optimize or reduce quality
            frame_skip_count++;
        }
    }
    
    bool is_frame_overbudget() {
        return (get_current_time() - frame_start_time) > target_frame_time;
    }
};
```

### Frame Budget Allocation

Distribute the frame time across subsystems:

**Typical 60fps frame budget (16.67ms)**:
- Input processing: 0.5ms
- Update: 5-6ms
- Physics: 2-3ms
- Rendering: 7-9ms
- Buffer swap: 0.5ms

Budgets depend on platform and content complexity. Mobile targets 30-60fps with smaller budgets.

```cpp
class FrameBudgetMonitor {
    struct BudgetItem {
        std::string name;
        double limit_ms;
        double actual_ms = 0;
    };
    
    std::vector<BudgetItem> budgets = {
        {"input", 0.5},
        {"update", 6.0},
        {"physics", 2.0},
        {"render", 7.0}
    };
    
public:
    void report_frame() {
        double total = 0;
        for (const auto& item : budgets) {
            double usage_percent = (item.actual_ms / item.limit_ms) * 100;
            printf("%s: %.2f/%.2f ms (%.1f%%)\n", 
                   item.name.c_str(), item.actual_ms, item.limit_ms, usage_percent);
            
            if (item.actual_ms > item.limit_ms) {
                printf("  WARNING: OVERBUDGET\n");
            }
            
            total += item.actual_ms;
        }
        printf("Frame total: %.2f ms\n", total);
    }
};
```

## Deterministic vs. Non-Deterministic

### Deterministic Systems

Given identical inputs, produce identical outputs every time. Critical for:
- Networking (replay/rollback)
- Debugging (reproducible crashes)
- Testing and validation

**Requirements**:
- Fixed timestep (not variable delta)
- No floating-point precision variance
- No random number generation differences
- No thread ordering variance

```cpp
class DeterministicSimulation {
    double fixed_timestep = 1.0 / 60.0;
    uint32_t random_seed = 12345;
    
public:
    void update() {
        // CORRECT: Fixed timestep, seeded RNG
        for (int i = 0; i < substeps; i++) {
            simulate_physics(fixed_timestep);
            
            // Use seeded RNG for reproducibility
            if (should_spawn_enemy()) {
                Random rng(random_seed++);  // Different seed each call
                Enemy e = create_random_enemy(rng);
            }
        }
    }
};

// WRONG: Non-deterministic
void BAD_update(double delta_time) {
    simulate_physics(delta_time);  // Variable timestep
    
    if (random() < 0.01) {  // Global RNG, not seeded
        spawn_random_enemy();
    }
}
```

### Non-Deterministic Systems

Accept variance in output. More flexible but harder to debug/network.

**Uses**:
- Graphics (frame jitter unnoticeable)
- Audio (imperceptible variance)
- AI (randomness adds variety)

## Latency vs. Throughput

### Latency

Time from input to observable output. Critical for:
- Games (input response delay feels bad)
- Remote control (robot, vehicle)
- Interactive applications

**Sources of latency**:
1. **Input sampling**: 1-2ms waiting for next input poll
2. **Processing**: Simulation and rendering
3. **Display**: 0-40ms depending on vsync and buffer mode
4. **Network**: 0-300ms for remote systems

```
Input Sample → Update → Render → Display → User Sees
   1ms        5ms      8ms       16ms      Total: 30ms
```

### Frame Pipelining

Modern GPUs pipeline: while GPU renders frame N, CPU prepares frame N+1.

This increases throughput but adds latency:

```
Frame N-1:  CPU Update N-1 → GPU Render N-1 → Display N-1
Frame N:                       CPU Update N  → GPU Render N
Frame N+1:                                    CPU Update N+1 → GPU Render N+1

Time: 0ms     10ms      20ms      30ms
```

**Single frame latency**: 30ms (3 frames at 60fps)

### Reducing Latency

**Techniques**:
1. **Triple buffering**: Reduce wait times
2. **Partial updates**: Update visible region only
3. **Predictive rendering**: Predict user input
4. **Asynchronous time-warp**: VR technique, reprojection for low-latency

```cpp
class LatencyReduction {
    static constexpr int NUM_FRAMES_HISTORY = 2;
    Transform predicted_transforms[NUM_FRAMES_HISTORY];
    
public:
    Transform predict_position(const Transform& current, 
                              const Transform& previous,
                              double time_until_display) {
        // Estimate velocity from history
        Vec3 velocity = (current.position - previous.position) / frame_time;
        
        // Extrapolate
        return current.position + velocity * time_until_display;
    }
};
```

## Buffering Strategies

### Double Buffering

Two buffers: one CPU writes, GPU reads; then swap roles.

**Prevents**: Tearing (displaying incomplete frames).

```cpp
class DoubleBuffer {
    std::array<FrameBuffer, 2> buffers;
    int write_index = 0;
    int read_index = 1;
    std::mutex lock;
    
public:
    void swap() {
        std::lock_guard<std::mutex> guard(lock);
        std::swap(write_index, read_index);
    }
    
    FrameBuffer& get_write_buffer() {
        return buffers[write_index];
    }
    
    FrameBuffer& get_read_buffer() {
        return buffers[read_index];
    }
};

// In rendering loop:
framebuffer.clear();
render_scene(framebuffer.get_write_buffer());
display(framebuffer.get_read_buffer());
framebuffer.swap();
```

### Triple Buffering

Three buffers: GPU alternates between two while CPU writes to third.

**Benefits**:
- GPU never waits for CPU
- CPU never waits for GPU
- Reduces latency vs. waiting for swap

**Cost**: Extra 16ms latency (3 frames in flight).

### Ring Buffering

For systems with multiple producers/consumers:

```cpp
template<typename T, int RING_SIZE = 3>
class RingBuffer {
    std::array<T, RING_SIZE> data;
    std::atomic<int> write_index{0};
    std::atomic<int> read_index{0};
    
public:
    void push(const T& value) {
        data[write_index] = value;
        write_index = (write_index + 1) % RING_SIZE;
        
        // If catching up to reader, drop old data
        if (write_index == read_index) {
            read_index = (read_index + 1) % RING_SIZE;
        }
    }
    
    bool try_pop(T& value) {
        if (read_index == write_index) return false;  // Empty
        
        value = data[read_index];
        read_index = (read_index + 1) % RING_SIZE;
        return true;
    }
};
```

## VSync and Frame Pacing

### VSync (Vertical Synchronization)

Wait for display vertical blanking period before swapping buffers. Eliminates tearing.

**Behavior**:

```
With VSync OFF:
Frame 0: Render finish (10ms) → Display immediately → Visible for 8ms
Frame 1: Render finish (14ms) → Display immediately → Visible for 12ms
Result: Tearing (different parts of different frames visible)

With VSync ON (60Hz):
Frame 0: Render finish (10ms) → Wait 6ms → Swap at vsync (16ms) → Display 16ms
Frame 1: Render finish (14ms) → Wait 2ms → Swap at vsync (32ms) → Display 16ms
Result: Clean, but some frames drop
```

**Trade-offs**:
- ON: Smooth but potential latency
- OFF: Lower latency but potential tearing

### Adaptive Sync

Dynamically match refresh rate to frame rate (FreeSync, G-Sync):

```
Variable 40-144Hz display
Game renders at 100fps → Display at 100Hz
Game drops to 60fps → Display at 60Hz
No tearing, minimal latency
```

## Networking and Real-Time

### Client-Server Latency

Network round-trip time (RTT) dominates latency in networked systems:

```
Local system:      ~30ms latency (input to screen)
WiFi client:       +50-100ms RTT
Ethernet client:   +10-30ms RTT
Internet (distant):+200-500ms RTT
```

### Prediction and Rollback

Predict opponent positions locally, then correct when real data arrives:

```cpp
class NetworkedEntity {
    Vec3 last_confirmed_position;
    Vec3 predicted_position;
    Vec3 velocity;
    
public:
    void local_update(double dt) {
        // Extrapolate based on last known velocity
        predicted_position += velocity * dt;
    }
    
    void receive_update(const NetworkUpdate& update) {
        // Server-confirmed position might differ
        if (glm::distance(predicted_position, update.position) > 0.5) {
            // Rollback: player teleported or took different path
            // Smoothly interpolate to new position
            rollback_to(update.position);
        }
        
        last_confirmed_position = update.position;
        velocity = update.velocity;
    }
    
private:
    void rollback_to(const Vec3& target) {
        // Gradual correction (100ms)
        correction_time = 0.1;
        correction_target = target;
    }
};
```

### Dead Reckoning

Extrapolate object state when updates are delayed:

```cpp
class DeadReckoningEntity {
    // Last known state
    Vec3 position;
    Vec3 velocity;
    Quat rotation;
    Vec3 angular_velocity;
    double last_update_time;
    
public:
    void extrapolate(double current_time) {
        double time_since_update = current_time - last_update_time;
        
        // Simple linear extrapolation
        position += velocity * time_since_update;
        rotation *= Quat(angular_velocity * time_since_update, 0);
        
        // Could add acceleration for more accuracy
    }
};
```

## Real-Time Constraints in Different Domains

### Games

**Target**: 60fps, 16.67ms per frame

**Constraints**:
- Frame drops visible to player
- Latency feels like "input lag"
- Physics must remain deterministic for networking

```cpp
class GameEngine {
    void run() {
        while (running) {
            auto frame_start = std::chrono::high_resolution_clock::now();
            
            process_input();          // ~0.5ms
            update_simulation(1/60);  // ~5ms, fixed timestep
            update_physics(1/60);     // ~2ms, fixed timestep
            render_scene();           // ~7ms
            present_frame();          // ~0.5ms
            
            wait_for_vsync();
        }
    }
};
```

### Digital Twins and Monitoring

**Target**: Update every 100ms-1s, render every 33ms

**Constraints**:
- Network latency acceptable (300ms stale data OK)
- CPU costs matter less than game
- Scalability to thousands of objects

```cpp
class DigitalTwinSystem {
    struct Entity {
        uint32_t id;
        Transform transform;
        double last_update_time;
        std::vector<Vec3> position_history;  // For interpolation
    };
    
    void update_from_network(const EntityUpdate& update) {
        // Update at slower network rate (10Hz typical)
        auto& entity = entities[update.id];
        entity.position_history.push_back(entity.transform.position);
        entity.transform = update.transform;
        entity.last_update_time = current_time();
    }
    
    void render() {
        // Render at higher rate (30fps), interpolating between updates
        for (auto& entity : entities) {
            double time_since_update = current_time() - entity.last_update_time;
            
            // Interpolate between position_history[-2] and position_history[-1]
            Vec3 interpolated = interpolate(
                entity.position_history[size-2],
                entity.position_history[size-1],
                time_since_update / network_update_interval
            );
            
            render_entity(entity, interpolated);
        }
    }
};
```

### Live Data Visualization

**Target**: Update data every second, refresh display every 100ms

**Constraints**:
- Data updates may be bursty
- Visual smoothness important for readability
- Large datasets (millions of points)

```python
class RealtimeDataDashboard:
    def __init__(self):
        self.data_points = collections.deque(maxlen=10000)
        self.lock = threading.Lock()
    
    def on_data_received(self, value):
        """Called when new sensor data arrives"""
        with self.lock:
            self.data_points.append((time.time(), value))
    
    def render_frame(self):
        """Called at 30fps"""
        with self.lock:
            recent_data = list(self.data_points)
        
        # Render only visible window (last 60 seconds)
        window = [d for d in recent_data if d[0] > time.time() - 60]
        
        self.plot_data(window)
        self.update_statistics(window)
```

## Performance Profiling

### Timing Information

```cpp
class PerformanceProfiler {
    struct TimingInfo {
        std::string name;
        double min_ms = INFINITY;
        double max_ms = 0;
        double total_ms = 0;
        int sample_count = 0;
    };
    
    std::unordered_map<std::string, TimingInfo> timings;
    
public:
    class ScopedTimer {
        PerformanceProfiler& prof;
        std::string name;
        std::chrono::high_resolution_clock::time_point start;
        
    public:
        ScopedTimer(PerformanceProfiler& p, const std::string& n) 
            : prof(p), name(n) {
            start = std::chrono::high_resolution_clock::now();
        }
        
        ~ScopedTimer() {
            auto duration = std::chrono::high_resolution_clock::now() - start;
            double ms = duration.count() / 1e6;
            
            auto& info = prof.timings[name];
            info.min_ms = std::min(info.min_ms, ms);
            info.max_ms = std::max(info.max_ms, ms);
            info.total_ms += ms;
            info.sample_count++;
        }
    };
    
    void report() {
        for (auto& [name, info] : timings) {
            double avg = info.total_ms / info.sample_count;
            printf("%s: %.2f/%.2f/%.2f ms (min/avg/max)\n",
                   name.c_str(), info.min_ms, avg, info.max_ms);
        }
    }
};

// Usage:
{
    PerformanceProfiler::ScopedTimer timer(profiler, "physics");
    physics_world.step(dt);
}
```

## Summary

Real-time systems require careful attention to timing, buffering, and latency. Success involves understanding hardware constraints (display refresh, network latency), budgeting resources, and using techniques like prediction, extrapolation, and frame pipelining. Different domains (games, monitoring, robots) have different acceptable latencies and update frequencies, requiring custom optimization strategies.
