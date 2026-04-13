---
title: Game Engine Architecture
category: concepts
order: 2
tags: [engine, architecture, ECS, scene-graph, rendering]
description: Comprehensive guide to game engine architecture patterns including entity-component systems, scene graphs, rendering pipelines, resource management, and comparisons across major engines.
related: [game-engines/unity/architecture-workflow, game-engines/unreal/architecture-blueprints, concepts/realtime-systems]
---

# Game Engine Architecture

## Introduction

Game engines are complex systems orchestrating dozens of subsystems: rendering, physics, audio, input, networking, and more. Understanding architectural patterns enables you to build efficient systems, debug issues, and make informed design decisions whether using established engines or building custom solutions.

This guide explores universal patterns: how data flows, how systems communicate, and how major engines implement these patterns differently.

## Core Architectural Patterns

### The Game Loop

Every engine revolves around this fundamental loop:

```cpp
while (game_running) {
    // Input
    input_manager.process_input();
    
    // Update game state
    update(delta_time);
    
    // Physics simulation
    physics_world.step(delta_time);
    
    // Render
    renderer.render();
    
    // Display
    display_frame();
}
```

The **delta_time** (time since last frame) is critical:
- Enables smooth animation regardless of frame rate
- Allows physics to be deterministic
- Enables replay and networking

```cpp
class Engine {
    double last_time = get_current_time();
    
    void run() {
        while (is_running) {
            double current_time = get_current_time();
            double delta_time = current_time - last_time;
            last_time = current_time;
            
            // Cap delta to prevent physics instability
            if (delta_time > 0.05) delta_time = 0.05;  // Max 50ms frame
            
            update(delta_time);
            render();
            
            // Frame pacing: limit to target framerate
            frame_limiter.wait_until_next_frame();
        }
    }
};
```

### Entity-Component-System (ECS)

Traditional object-oriented game entities have problems: inheritance hierarchies become unmaintainable, code reuse is difficult, cache locality suffers.

ECS separates concerns:
- **Entity**: Unique ID, container for components
- **Component**: Data (properties only, no behavior)
- **System**: Logic operating on components

```cpp
// Traditional OOP approach (problematic)
class Entity {
    virtual void update(double dt) = 0;
};

class Player : public Entity {
    Position pos;
    Velocity vel;
    Health health;
    
    void update(double dt) override {
        // Update position
        pos += vel * dt;
        
        // Check collision
        // Update animation
        // Update audio
    }
};

// ECS approach (superior)
struct Position { glm::vec3 value; };
struct Velocity { glm::vec3 value; };
struct Health { float hp; };

// Entity is just an ID
using Entity = uint32_t;

// System: operates on components
class PhysicsSystem {
    void update(double dt, EntityManager& entities) {
        entities.iterate<Position, Velocity>([dt](Position& pos, Velocity& vel) {
            pos.value += vel.value * static_cast<float>(dt);
        });
    }
};

class CollisionSystem {
    void update(double dt, EntityManager& entities) {
        // Iterate only entities with Position and Collider
        entities.iterate<Position, Collider>([this](Entity id, Position& pos, Collider& col) {
            // Check collisions
        });
    }
};
```

**Advantages of ECS**:
1. **Cache efficiency**: Components of same type are contiguous in memory
2. **Code reuse**: Systems compose freely without deep inheritance
3. **Parallelization**: Systems easily run in parallel (no component conflicts)
4. **Flexibility**: Add/remove components at runtime

**Implementation sketch**:

```cpp
class EntityManager {
    std::unordered_map<std::type_index, std::vector<void*>> components;
    std::unordered_map<uint32_t, std::vector<std::type_index>> entity_types;
    uint32_t next_entity_id = 1;
    
public:
    uint32_t create_entity() {
        return next_entity_id++;
    }
    
    template<typename T>
    T& add_component(uint32_t entity) {
        auto& storage = get_component_storage<T>();
        storage.push_back(T());
        entity_types[entity].push_back(typeid(T));
        return storage.back();
    }
    
    template<typename... Components>
    void iterate(std::function<void(Entity, Components&...)> func) {
        // Iterate entities with all specified components
        // Use signature to find matching entities
    }
    
private:
    template<typename T>
    std::vector<T>& get_component_storage() {
        auto it = components.find(typeid(T));
        if (it == components.end()) {
            components[typeid(T)] = std::vector<void*>();
        }
        return *reinterpret_cast<std::vector<T>*>(&components[typeid(T)]);
    }
};
```

### Scene Graph

Hierarchical representation where nodes can have children, enabling efficient spatial queries and transformation propagation:

```cpp
struct Transform {
    glm::vec3 position;
    glm::quat rotation;
    glm::vec3 scale = {1, 1, 1};
    
    glm::mat4 local_matrix() const {
        glm::mat4 t = glm::translate(glm::mat4(1), position);
        glm::mat4 r = glm::mat4_cast(rotation);
        glm::mat4 s = glm::scale(glm::mat4(1), scale);
        return t * r * s;
    }
};

class SceneNode {
    SceneNode* parent = nullptr;
    std::vector<SceneNode*> children;
    Transform local_transform;
    glm::mat4 world_matrix;
    
public:
    void add_child(SceneNode* child) {
        children.push_back(child);
        child->parent = this;
    }
    
    void update_world_transform() {
        if (parent) {
            world_matrix = parent->world_matrix * local_transform.local_matrix();
        } else {
            world_matrix = local_transform.local_matrix();
        }
        
        // Recursively update children
        for (auto child : children) {
            child->update_world_transform();
        }
    }
    
    glm::vec3 world_position() const {
        return glm::vec3(world_matrix[3]);
    }
};
```

**Uses**:
- Efficient spatial partitioning with hierarchies
- Transformation propagation (child inherits parent position)
- Bone systems for skeletal animation

## Resource Management

Resources (textures, meshes, audio) are expensive to load and should be managed carefully:

```cpp
class ResourceManager {
    std::unordered_map<std::string, std::shared_ptr<Resource>> resources;
    std::vector<std::string> loading_queue;
    
public:
    template<typename T>
    std::shared_ptr<T> load(const std::string& path) {
        auto it = resources.find(path);
        
        if (it != resources.end()) {
            return std::static_pointer_cast<T>(it->second);
        }
        
        // Load and cache
        auto resource = std::make_shared<T>();
        resource->load_from_file(path);
        resources[path] = resource;
        return resource;
    }
    
    void async_load(const std::string& path, 
                   std::function<void()> on_complete) {
        // Load on background thread
        std::thread([this, path, on_complete]() {
            auto resource = load_resource(path);
            on_complete();
        }).detach();
    }
    
    void unload(const std::string& path) {
        resources.erase(path);
    }
};
```

**Strategies**:
1. **Reference counting**: Keep resources loaded while referenced
2. **Streaming**: Load resources as needed, unload when far
3. **Asset bundles**: Group related resources for efficient loading
4. **Memory pooling**: Pre-allocate and reuse objects

## Rendering Pipeline Architecture

### Abstraction Layers

High-level design hides graphics API (DirectX, Vulkan, Metal) differences:

```cpp
// Renderer abstraction
class Renderer {
    virtual void begin_frame() = 0;
    virtual void submit_mesh(const Mesh& mesh, const glm::mat4& transform) = 0;
    virtual void set_lighting(const Light& light) = 0;
    virtual void end_frame() = 0;
};

// Concrete implementation
class VulkanRenderer : public Renderer {
    VkInstance instance;
    VkDevice device;
    VkCommandPool command_pool;
    
    void begin_frame() override {
        // Vulkan-specific setup
    }
    
    void submit_mesh(const Mesh& mesh, const glm::mat4& transform) override {
        // Vulkan rendering commands
    }
};

class DirectXRenderer : public Renderer {
    ID3D12Device* device;
    ID3D12CommandQueue* command_queue;
    
    void begin_frame() override {
        // DirectX-specific setup
    }
};
```

### Render Queue

Rather than drawing immediately, defer drawing operations and sort them optimally:

```cpp
struct RenderCommand {
    std::shared_ptr<Mesh> mesh;
    std::shared_ptr<Material> material;
    glm::mat4 transform;
    float distance_to_camera;  // For sorting
};

class RenderQueue {
    std::vector<RenderCommand> commands;
    
public:
    void submit(const RenderCommand& cmd) {
        commands.push_back(cmd);
    }
    
    void flush(Camera& camera) {
        // Calculate distance to camera
        for (auto& cmd : commands) {
            glm::vec3 center = glm::vec3(cmd.transform[3]);
            cmd.distance_to_camera = glm::length(center - camera.position);
        }
        
        // Sort by distance (back-to-front for transparency)
        std::sort(commands.begin(), commands.end(),
                 [](const RenderCommand& a, const RenderCommand& b) {
                     return a.distance_to_camera > b.distance_to_camera;
                 });
        
        // Execute in order
        for (auto& cmd : commands) {
            draw_mesh(cmd.mesh, cmd.material, cmd.transform);
        }
        
        commands.clear();
    }
};
```

**Benefits**:
- State changes minimized (group by material)
- Transparent objects rendered last
- Batch rendering possible
- GPU pipelining optimized

## Event System

Decouple systems through events:

```cpp
class EventBus {
    std::unordered_map<std::type_index, std::vector<std::function<void(void*)>>> listeners;
    
public:
    template<typename T>
    void subscribe(std::function<void(const T&)> callback) {
        listeners[typeid(T)].push_back(
            [callback](void* event_ptr) {
                callback(*static_cast<T*>(event_ptr));
            }
        );
    }
    
    template<typename T>
    void publish(const T& event) {
        auto it = listeners.find(typeid(T));
        if (it != listeners.end()) {
            for (auto& callback : it->second) {
                callback(const_cast<T*>(&event));
            }
        }
    }
};

// Usage
struct PlayerDeadEvent {
    uint32_t player_id;
    glm::vec3 death_position;
};

event_bus.subscribe<PlayerDeadEvent>([](const PlayerDeadEvent& event) {
    audio_manager.play_sound("death");
    particle_system.emit_at(event.death_position);
});

// When player dies:
event_bus.publish<PlayerDeadEvent>({player_id, position});
```

## Major Engine Architectures

### Unity Architecture

**GameObject-Component pattern**: Each GameObject has a set of Components

```csharp
public class Player : MonoBehaviour {
    public Rigidbody rb;
    public Animator animator;
    
    void Update() {
        // Called every frame
        float horizontal = Input.GetAxis("Horizontal");
        rb.velocity = new Vector3(horizontal * speed, rb.velocity.y, 0);
    }
    
    void FixedUpdate() {
        // Called at physics timestep (fixed)
        // Physics updates here
    }
}
```

**Strengths**:
- Approachable, MonoBehaviour interface
- Integrated editor with scene hierarchy
- Good for rapid prototyping

**Weaknesses**:
- Monolithic components (not pure ECS)
- Virtual function overhead
- Cache inefficiency at scale

### Unreal Engine Architecture

**Actor-Component pattern**: Each AActor has Components (similar to Unity but more powerful)

```cpp
// Pawn: player-controlled actor
class APawn : public AActor {
    class UPawnMovementComponent* MovementComponent;
    class UInputComponent* InputComponent;
};

// Character: humanoid Pawn
class ACharacter : public APawn {
    class UCharacterMovementComponent* CharacterMovement;
    class USkeletalMeshComponent* Mesh;
};

void ACharacter::BeginPlay() {
    Super::BeginPlay();
    InputComponent->BindAxis("MoveForward", this, &ACharacter::MoveForward);
}

void ACharacter::MoveForward(float Value) {
    AddMovementInput(GetActorForwardVector(), Value);
}
```

**Strengths**:
- Powerful component system
- Built-in networking
- Blueprint visual scripting
- Advanced animation systems

**Weaknesses**:
- Steep learning curve
- Large overhead for small projects
- Slower iteration than Unity for some workflows

### Godot Engine Architecture

**Node-based hierarchy**: Scenes composed of nodes in a tree

```gdscript
extends Node

class_name Player

@export var speed = 400
var velocity = Vector2.ZERO

func _process(delta):
    velocity = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    velocity = velocity.normalized() * speed
    $AnimatedSprite2D.animation = "right" if velocity.x > 0 else "left"

func _physics_process(delta):
    position += velocity * delta
```

**Strengths**:
- Simple, intuitive hierarchy
- Small footprint
- Open source
- Good GDScript language

**Weaknesses**:
- Smaller ecosystem
- Less documentation
- Fewer AAA features

### Custom Engine Pattern

Many studios build custom engines optimized for their specific needs:

```cpp
class Engine {
    EntityManager entities;
    PhysicsSystem physics;
    RenderSystem render;
    AudioSystem audio;
    EventBus events;
    InputManager input;
    
public:
    void tick(double delta_time) {
        input.process();
        events.dispatch_queued();
        
        physics.update(delta_time);
        entities.update(delta_time);
        
        render.prepare();
        render.render(entities.get_drawable_entities());
        render.submit();
    }
};
```

**Advantages**:
- Optimized for specific game type
- No unnecessary overhead
- Full control over architecture

**Disadvantages**:
- Development time
- Maintenance burden
- Harder to find talent familiar with custom code

## Serialization and Save Systems

Games need to save/load state efficiently:

```cpp
class Serializable {
    virtual void serialize(std::ostream& out) const = 0;
    virtual void deserialize(std::istream& in) = 0;
};

class GameState : public Serializable {
    std::map<uint32_t, Entity> entities;
    float game_time;
    
    void serialize(std::ostream& out) const override {
        // Write game time
        out.write(reinterpret_cast<char*>(&game_time), sizeof(game_time));
        
        // Write entity count
        uint32_t count = entities.size();
        out.write(reinterpret_cast<char*>(&count), sizeof(count));
        
        // Write each entity
        for (const auto& [id, entity] : entities) {
            out.write(reinterpret_cast<char*>(&id), sizeof(id));
            entity.serialize(out);
        }
    }
};
```

## Frame Lifecycle

Understanding the order of operations is crucial:

```
┌─────────────────────────────────────────┐
│ Frame N                                 │
├─────────────────────────────────────────┤
│ 1. Input Processing                     │
│    - Poll keyboard, mouse, gamepad      │
│    - Queue input events                 │
├─────────────────────────────────────────┤
│ 2. Event Dispatch                       │
│    - Process accumulated events         │
│    - Call subscribers                   │
├─────────────────────────────────────────┤
│ 3. Update (Variable Timestep)           │
│    - Update game logic (dt = time elapsed) │
│    - Animation, AI, etc                 │
├─────────────────────────────────────────┤
│ 4. Fixed Physics Step (Fixed Timestep)  │
│    - Physics simulation (0.016s)        │
│    - May occur multiple times if lag    │
├─────────────────────────────────────────┤
│ 5. Late Update                          │
│    - Camera following player            │
│    - Constraint solving                 │
├─────────────────────────────────────────┤
│ 6. Render                               │
│    - Queue draw commands                │
│    - Execute GPU commands               │
│    - Present framebuffer                │
└─────────────────────────────────────────┘
```

## Performance Considerations

### Memory Layout

Object layout affects cache efficiency:

```cpp
// Poor: scattered components, bad cache
struct Entity {
    Position position;      // Offset 0
    Velocity velocity;      // Offset 12
    Health health;          // Offset 24
    Rotation rotation;      // Offset 32
    // Many other fields
};

std::vector<Entity> entities;  // Entities scattered in memory

// Better: group by access pattern (ECS)
struct PositionComponent { glm::vec3 position; };
struct VelocityComponent { glm::vec3 velocity; };

std::vector<Position> positions;  // All positions contiguous
std::vector<Velocity> velocities;  // All velocities contiguous

// Accessing all positions is efficient (good cache locality)
for (auto& pos : positions) { /* ... */ }
```

### Culling

Don't process/render what's not visible:

```cpp
class CullingSystem {
    void cull_for_camera(Camera& camera, EntityManager& entities) {
        entities.iterate<Position, BoundingBox>([&camera, this](Entity id, Position& pos, BoundingBox& box) {
            glm::vec3 world_pos = pos.value;
            float distance = glm::length(world_pos - camera.position);
            
            // Frustum culling
            if (!camera.frustum.contains(box)) {
                entities.set_component_flag<Renderable>(id, false);
                return;
            }
            
            // Distance culling
            if (distance > max_render_distance) {
                entities.set_component_flag<Renderable>(id, false);
                return;
            }
            
            entities.set_component_flag<Renderable>(id, true);
        });
    }
};
```

## Summary

Game engine architecture balances complexity, performance, and flexibility. Modern engines use component-based design (ECS or variants), deferred rendering, event systems, and careful resource management. Whether using established engines or building custom solutions, understanding these patterns enables effective system design and optimization.
