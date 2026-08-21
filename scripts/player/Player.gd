class_name PrototypePlayer
extends CharacterBody3D

@export var walk_speed: float = 4.0
@export var run_speed: float = 7.0
@export var acceleration: float = 18.0
@export var gravity: float = 18.0
@export var camera_distance: float = 8.5
@export var camera_height: float = 5.0

var controls: Node
var camera_yaw: float = 0.0
var camera_pitch: float = -0.28
var _camera: Camera3D

func _ready() -> void:
	controls = get_node_or_null("/root/Main/TouchControls")
	_build_camera()

func _physics_process(delta: float) -> void:
	var move_input := _read_move_input()
	var is_running := _read_run_input()
	var speed := run_speed if is_running else walk_speed
	var direction := Vector3(move_input.x, 0.0, move_input.y)

	if direction.length() > 1.0:
		direction = direction.normalized()
	var target_velocity := direction * speed
	velocity.x = move_toward(velocity.x, target_velocity.x, acceleration * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, acceleration * delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.1
	move_and_slide()

	if direction.length_squared() > 0.01:
		var target_angle := atan2(-direction.x, -direction.z)
		rotation.y = lerp_angle(rotation.y, target_angle, delta * 10.0)
	_update_camera(delta)

func _read_move_input() -> Vector2:
	var keyboard := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	if keyboard.length_squared() > 0.001:
		return keyboard
	if controls and controls.has_method("get_move_vector"):
		return controls.get_move_vector()
	return Vector2.ZERO

func _read_run_input() -> bool:
	if Input.is_action_pressed("run"):
		return true
	return controls != null and controls.has_method("is_sprint_pressed") and controls.is_sprint_pressed()

func _build_camera() -> void:
	_camera = Camera3D.new()
	_camera.name = "ThirdPersonCamera"
	_camera.current = true
	_camera.fov = 65.0
	_camera.near = 0.1
	_camera.far = 180.0
	add_child(_camera)

func _update_camera(delta: float) -> void:
	if not is_instance_valid(_camera):
		return
	var target := global_position + Vector3.UP * 1.2
	var offset := Vector3(0.0, camera_height, camera_distance)
	offset = offset.rotated(Vector3.UP, camera_yaw)
	var desired := target + offset
	_camera.global_position = _camera.global_position.lerp(desired, min(1.0, delta * 7.0))
	_camera.look_at(target, Vector3.UP)

func set_camera_yaw(value: float) -> void:
	camera_yaw = value

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenDrag:
		# A small right-side swipe rotates the camera without requiring a mouse.
		if event.position.x > get_viewport().get_visible_rect().size.x * 0.45:
			camera_yaw -= event.relative.x * 0.006
			camera_pitch = clamp(camera_pitch - event.relative.y * 0.003, -0.65, 0.15)
