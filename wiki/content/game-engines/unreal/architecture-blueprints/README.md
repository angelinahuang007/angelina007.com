---
title: Unreal Engine Architecture and Blueprints
category: game-engines/unreal
tags: [unreal, architecture, blueprints, C++]
description: Comprehensive guide to Unreal Engine's architecture including Gameplay Framework hierarchy, GameMode/GameState/PlayerController/Pawn relationships, Blueprint vs C++ tradeoffs, UObject/AActor hierarchy, Gameplay Ability System (GAS), and subsystems for scalable game architecture.
related: [game-engines/unity/architecture-workflow, concepts/engine-architecture]
order: 1
---

# Unreal Engine Architecture and Blueprints

## Gameplay Framework Overview

Unreal's Gameplay Framework provides the foundational structure for all games. Understanding this hierarchy is critical for proper game architecture.

### Core Class Hierarchy

```cpp
// AActor - Base for all placeable objects
class AActor : public UObject
{
public:
    virtual void BeginPlay();
    virtual void Tick(float DeltaTime);
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason);
};

// APawn - Actor that can be controlled
class APawn : public AActor
{
public:
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent);
    class AController* GetController() const;
};

// ACharacter - Pawn with collision and movement
class ACharacter : public APawn
{
public:
    UPROPERTY() class UCharacterMovementComponent* CharacterMovement;
    UPROPERTY() class UCapsuleComponent* CapsuleComponent;
};

// AController - Controls a Pawn
class AController : public AActor
{
public:
    virtual void Possess(APawn* InPawn);
    virtual void UnPossess();
};

// APlayerController - Controller for player-controlled Pawn
class APlayerController : public AController
{
public:
    virtual void BeginPlay() override;
    virtual void SetupInputComponent();
};

// AAIController - Controller for AI-controlled Pawn
class AAIController : public AController
{
public:
    class UBehaviorTreeComponent* BehaviorTreeComponent;
};

// AGameMode - Game rules, match state
class AGameMode : public AActor
{
public:
    virtual void BeginPlay() override;
    virtual APlayerController* Login(class APlayerController* NewPlayer);
    virtual void Logout(class AController* Exiting);
};

// AGameState - Replicates game state to clients
class AGameState : public AActor
{
public:
    UPROPERTY(Replicated) float ElapsedTime;
    UPROPERTY(Replicated) TArray<class APlayerState*> PlayerArray;
};

// APlayerState - Per-player state (score, ping, etc)
class APlayerState : public AInfo
{
public:
    UPROPERTY(Replicated) float Score;
    UPROPERTY(Replicated) int32 PlayerId;
};
```

### Gameplay Framework Flow

```
Game Start
    ↓
AGameMode::BeginPlay()
    ↓
AGameMode spawns players
    ↓
APlayerController::Login()
    ↓
APlayerController spawns Pawn (ACharacter)
    ↓
APlayerController::Possess(Pawn)
    ↓
AGameState replicates to all clients
    ↓
All objects receive BeginPlay()
```

## GameMode and GameState

### GameMode: Server Authority

```cpp
// Custom GameMode
UCLASS()
class MYGAME_API AMyGameMode : public AGameMode
{
    GENERATED_BODY()

public:
    AMyGameMode();

    virtual void BeginPlay() override;
    virtual APlayerController* Login(APlayerController* NewPlayer);
    virtual void Logout(AController* Exiting);

    UPROPERTY(EditAnywhere, Category = "Game")
    TSubclassOf<APawn> DefaultPawnClass;

    UPROPERTY(EditAnywhere, Category = "Game")
    TSubclassOf<APlayerController> PlayerControllerClass;

    UFUNCTION(BlueprintImplementableEvent, Category = "Game")
    void OnPlayerSpawned(ACharacter* Character);

    // Server-only RPC
    UFUNCTION(Server, Unreliable)
    void ServerHandlePlayerDeath(ACharacter* DeadCharacter);
};

void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();
    Debug::LogF(TEXT("Game started"));
}

APlayerController* AMyGameMode::Login(APlayerController* NewPlayer)
{
    APlayerController* PC = Super::Login(NewPlayer);
    
    // Spawn player pawn
    APawn* PlayerPawn = GetWorld()->SpawnActor<APawn>(DefaultPawnClass);
    PC->Possess(PlayerPawn);
    
    return PC;
}
```

### GameState: Replicated to Clients

```cpp
UCLASS()
class MYGAME_API AMyGameState : public AGameState
{
    GENERATED_BODY()

public:
    AMyGameState();

    UPROPERTY(Replicated, BlueprintReadOnly)
    float TimeRemaining;

    UPROPERTY(Replicated, BlueprintReadOnly)
    int32 TeamAScore;

    UPROPERTY(Replicated, BlueprintReadOnly)
    int32 TeamBScore;

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    UFUNCTION(BlueprintImplementableEvent)
    void OnTimeChanged(float NewTime);

    UFUNCTION(BlueprintImplementableEvent)
    void OnScoreChanged();

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};

void AMyGameState::GetLifetimeReplicatedProps(
    TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(AMyGameState, TimeRemaining);
    DOREPLIFETIME(AMyGameState, TeamAScore);
    DOREPLIFETIME(AMyGameState, TeamBScore);
}
```

## PlayerController and Pawn

### PlayerController: Input and Client Logic

```cpp
UCLASS()
class MYGAME_API AMyPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    AMyPlayerController();

    virtual void BeginPlay() override;
    virtual void SetupInputComponent() override;
    virtual void Tick(float DeltaTime) override;

private:
    // Input callbacks
    void MoveForward(float Value);
    void MoveRight(float Value);
    void OnJump();
    void OnLook(const struct FInputActionValue& Value);

    UPROPERTY()
    class AMyCharacter* PlayerCharacter;

    UPROPERTY(EditAnywhere, Category = "Input")
    class UInputMappingContext* DefaultInputMappingContext;

    UPROPERTY(EditAnywhere, Category = "Input")
    class UInputAction* MoveAction;

    UPROPERTY(EditAnywhere, Category = "Input")
    class UInputAction* LookAction;
};

void AMyPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    if (UEnhancedInputComponent* EnhancedInputComponent = 
        Cast<UEnhancedInputComponent>(InputComponent))
    {
        // Add Move Action
        EnhancedInputComponent->BindAction(
            MoveAction, 
            ETriggerEvent::Triggered, 
            this, 
            &AMyPlayerController::MoveForward);

        // Add Look Action
        EnhancedInputComponent->BindAction(
            LookAction, 
            ETriggerEvent::Triggered, 
            this, 
            &AMyPlayerController::OnLook);
    }
}

void AMyPlayerController::MoveForward(float Value)
{
    if (PlayerCharacter)
    {
        PlayerCharacter->AddMovementInput(
            PlayerCharacter->GetActorForwardVector(), 
            Value);
    }
}
```

### Pawn: Physical Representation

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyCharacter();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    class USpringArmComponent* CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    class UCameraComponent* FollowCamera;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float WalkSpeed = 600.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float SprintSpeed = 1000.0f;

    UPROPERTY(ReplicatedUsing = OnRep_bIsSprinting)
    bool bIsSprinting = false;

    UFUNCTION()
    void OnRep_bIsSprinting();

    UFUNCTION(Server, Unreliable)
    void ServerSetSprinting(bool bNewSprinting);

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};

void AMyCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (APlayerController* PlayerController = 
        Cast<APlayerController>(Controller))
    {
        if (UEnhancedInputLocalPlayerSubsystem* InputSubsystem = 
            GetWorld()->GetFirstPlayerController()->GetLocalPlayer()
            ->GetSubsystem<UEnhancedInputLocalPlayerSubsystem>())
        {
            InputSubsystem->AddMappingContext(DefaultInputMappingContext, 0);
        }
    }
}
```

## Blueprint vs C++

### Blueprint Advantages

```
- Rapid iteration (no compile)
- Visual scripting
- Non-programmers can contribute
- Easy debugging and inspection
- Good for prototyping
```

### C++ Advantages

```cpp
// Performance
// Smaller runtime overhead
// Compiled to native code
// Better for performance-critical systems

// Complex Logic
// Easier to implement complex algorithms
// Better IDE support and refactoring
// Type safety and compile-time checks

// Custom Systems
// Create new engine features
// Custom shaders and rendering
// Plugin development
```

### Hybrid Approach

```cpp
// Base gameplay logic in C++
UCLASS()
class MYGAME_API ABaseCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    float Health = 100.0f;

    UFUNCTION(BlueprintNativeEvent, BlueprintCallable)
    void TakeDamage(float DamageAmount);

    UFUNCTION(BlueprintImplementableEvent)
    void OnHealthChanged(float NewHealth);

protected:
    virtual void BeginPlay() override;
};

// Blueprint extends with custom behavior
// BP_MyCharacter : ABaseCharacter
// - Implements OnHealthChanged for custom UI
// - Implements TakeDamage for special effects
```

## UObject and AActor Hierarchy

### UObject: Base Class

```cpp
// UObject is Unreal's root class
// Provides reflection, serialization, memory management

UCLASS()
class MYGAME_API UMyDataObject : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere)
    FString Name;

    UPROPERTY(EditAnywhere)
    float Value;

    UFUNCTION(BlueprintCallable)
    void PrintData();
};

void UMyDataObject::PrintData()
{
    UE_LOG(LogTemp, Warning, TEXT("%s: %f"), *Name, Value);
}
```

### AActor: World Objects

```cpp
// AActor can exist in world
// Has transform, can be spawned/destroyed
// Supports replication and networking

UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
};
```

### UActorComponent: Modular Components

```cpp
// Attach to AActor for specific functionality
UCLASS()
class MYGAME_API UMyComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UMyComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(
        float DeltaTime, 
        ELevelTick TickType,
        FActorComponentTickFunction* ThisTickFunction) override;
};

// Usage
void AMyActor::BeginPlay()
{
    Super::BeginPlay();

    UMyComponent* MyComp = NewObject<UMyComponent>(this);
    MyComp->RegisterComponent();
}
```

## Gameplay Ability System (GAS)

Advanced system for managing character abilities, effects, and attributes.

```cpp
// Ability Attributes
UCLASS()
class MYGAME_API UMyAttributeSet : public UAttributeSet
{
    GENERATED_BODY()

public:
    UPROPERTY(ReplicatedUsing = OnRep_Health)
    FGameplayAttributeData Health;

    UPROPERTY(ReplicatedUsing = OnRep_MaxHealth)
    FGameplayAttributeData MaxHealth;

    UPROPERTY(ReplicatedUsing = OnRep_Stamina)
    FGameplayAttributeData Stamina;

    UFUNCTION()
    void OnRep_Health(const FGameplayAttributeData& OldHealth);

    virtual void PreAttributeChange(
        const FGameplayAttribute& Attribute, 
        float& NewValue) override;

    virtual void PostGameplayEffectExecute(
        const FGameplayEffectModCallbackData& Data) override;

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};

// Ability Class
UCLASS()
class MYGAME_API UMyGameplayAbility : public UGameplayAbility
{
    GENERATED_BODY()

public:
    virtual void ActivateAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;

    virtual void EndAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        bool bReplicateEndAbility,
        bool bWasCancelled) override;

protected:
    UPROPERTY(EditAnywhere)
    TSubclassOf<UGameplayEffect> DamageEffect;
};

// Grant ability to character
void AMyCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (AbilitySystemComponent)
    {
        FGameplayAbilitySpec AbilitySpec(
            UMyGameplayAbility::StaticClass(),
            1, 
            0, 
            this);

        AbilitySystemComponent->GiveAbility(AbilitySpec);
    }
}
```

## Subsystems

Modular, automatic management of game systems.

```cpp
// Engine Subsystem (exists once in engine)
UCLASS()
class MYGAME_API UMyEngineSubsystem : public FTickableGameObject
{
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    void DoSomething();
};

// World Subsystem (exists once per world)
UCLASS()
class MYGAME_API UMyWorldSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    void ManageWorldLogic();
};

// Local Player Subsystem (per local player)
UCLASS()
class MYGAME_API UMyPlayerSubsystem : public ULocalPlayerSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    void HandlePlayerInput();
};

// Usage
void AMyCharacter::BeginPlay()
{
    Super::BeginPlay();

    UMyWorldSubsystem* WorldSubsystem = 
        GetWorld()->GetSubsystem<UMyWorldSubsystem>();

    if (WorldSubsystem)
    {
        WorldSubsystem->ManageWorldLogic();
    }
}
```

## Project Organization

### Folder Structure

```
Content/
├── Core/
│   ├── GameModes/
│   ├── Characters/
│   └── Controllers/
├── Gameplay/
│   ├── Abilities/
│   ├── Items/
│   └── Enemies/
├── UI/
│   ├── Menus/
│   ├── HUD/
│   └── Widgets/
├── Assets/
│   ├── Meshes/
│   ├── Materials/
│   ├── Textures/
│   └── Audio/
└── Maps/
    ├── Levels/
    └── Cinematics/
```

## Best Practices

1. **Separate Logic:** Keep gameplay logic in C++, behavior customization in Blueprints
2. **Use Subsystems:** Centralize game systems for better organization
3. **Respect Ownership:** GameMode owns game rules, GameState owns game state
4. **Replication:** Only replicate necessary data over network
5. **Components:** Use components for modular, reusable functionality
6. **Async Loading:** Load maps and assets asynchronously
7. **Memory Management:** Use UPROPERTY() for proper garbage collection

## Conclusion

Unreal's Gameplay Framework provides powerful, flexible foundation for game development. Understanding the relationship between GameMode, GameState, PlayerController, and Pawn is essential. Use C++ for performance-critical systems and Blueprints for rapid iteration and customization.
