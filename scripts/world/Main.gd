extends Node3D

const PLAYER_SCENE := preload("res://scenes/player/Player.tscn")
const TOUCH_CONTROLS := preload("res://scripts/ui/TouchControls.gd")
const DEBUG_HUD := preload("res://scripts/ui/DebugHud.gd")
const BOOT_OVERLAY := preload("res://scripts/ui/NexacityBootOverlay.gd")
const MOUNTAIN_BACKDROP := preload("res://assets/liyue_inspired_mountain_backdrop.png")
const LANTERN_BANNER := preload("res://assets/lantern_banner_texture.png")
const STONE_PAVING := preload("res://assets/stone_paving_texture.png")

var palette := {
	"ground": Color("#718879"),
	"road": Color("#303744"),
	"sidewalk": Color("#a8adb1"),
	"building_a": Color("#d77868"),
	"building_b": Color("#e2b96a"),
	"building_c": Color("#6d9ac0"),
	"building_d": Color("#b785c4"),
	"park": Color("#4d8657"),
	"tree": Color("#2e6546"),
	"tree_trunk": Color("#76543c"),
	"school": Color("#dfd6b8"),
	"petrol": Color("#e7e8e4"),
	"accent": Color("#f2d35f"),
	"jade": Color("#4a9b88"),
	"water": Color("#277f83"),
	"roof": Color("#23434a"),
	"stone": Color("#8d8170")
}

var _boot_overlay

func _ready() -> void:
	_boot_overlay = BOOT_OVERLAY.new()
	_boot_overlay.name = "NexacityBootOverlay"
	add_child(_boot_overlay)
	await get_tree().process_frame
	await _run_startup_sequence()

func _run_startup_sequence() -> void:
	_boot_overlay.set_stage("Initialize Godot")
	await get_tree().process_frame

	_boot_overlay.set_stage("Initialize environment")
	_setup_environment()
	if get_node_or_null("WorldEnvironment") == null:
		_fail_boot("Environment initialization failed")
		return
	await get_tree().process_frame

	_boot_overlay.set_stage("Generate world")
	_build_city()
	if get_child_count() < 8:
		_fail_boot("World generation produced no scene content")
		return
	await get_tree().process_frame

	_boot_overlay.set_stage("Load player")
	var player := PLAYER_SCENE.instantiate()
	player.name = "Player"
	player.position = Vector3(0, 0.2, 18)
	add_child(player)
	if get_node_or_null("Player") == null:
		_fail_boot("Player scene could not be instantiated")
		return
	await get_tree().process_frame

	_boot_overlay.set_stage("Load touch controls")
	var touch_controls := TOUCH_CONTROLS.new()
	touch_controls.name = "TouchControls"
	add_child(touch_controls)
	if get_node_or_null("TouchControls") == null:
		_fail_boot("Touch controls could not be initialized")
		return
	var hud := DEBUG_HUD.new()
	hud.name = "DebugHud"
	add_child(hud)
	await get_tree().process_frame

	_boot_overlay.set_stage("Ready")
	_boot_overlay.complete()

func _fail_boot(message: String) -> void:
	if _boot_overlay != null:
		_boot_overlay.show_error(message)
	push_error("Nexacity startup failure: " + message)

func _setup_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("#1f355a")
	sky_material.sky_horizon_color = Color("#f4bc83")
	sky_material.ground_bottom_color = Color("#25333d")
	sky_material.ground_horizon_color = Color("#8c786c")
	sky_material.sun_angle_max = 18.0
	sky.sky_material = sky_material
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	environment.ambient_light_energy = 0.72
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var world_environment := WorldEnvironment.new()
	world_environment.name = "WorldEnvironment"
	world_environment.environment = environment
	add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.name = "MobileSun"
	sun.rotation_degrees = Vector3(-52, -28, 0)
	sun.light_color = Color("#ffe3b3")
	sun.light_energy = 1.2
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 55.0
	add_child(sun)

func _build_city() -> void:
	_add_textured_box("StoneGround", Vector3(72, 0.5, 72), Vector3(0, -0.25, 0), STONE_PAVING, true)
	_add_box("MainRoad", Vector3(9, 0.08, 72), Vector3(0, 0.03, 0), palette["road"], false)
	_add_box("CrossRoad", Vector3(72, 0.08, 8), Vector3(0, 0.04, -4), palette["road"], false)
	_add_box("SideRoadEast", Vector3(7, 0.08, 46), Vector3(20, 0.05, 12), palette["road"], false)
	_add_box("SideRoadWest", Vector3(7, 0.08, 42), Vector3(-20, 0.05, 15), palette["road"], false)
	_add_box("MarketLane", Vector3(28, 0.08, 5), Vector3(28, 0.06, 21), palette["road"], false)

	for z in range(-30, 35, 6):
		_add_box("CenterLine", Vector3(0.18, 0.02, 2.4), Vector3(0, 0.11, z), palette["accent"], false)
	for x in range(-30, 35, 6):
		_add_box("CrossLine", Vector3(2.4, 0.02, 0.18), Vector3(x, 0.12, -4), palette["accent"], false)

	_build_block(Vector3(-15, 0, -22), Vector2(3, 3), palette["building_a"])
	_build_block(Vector3(15, 0, -22), Vector2(3, 3), palette["building_b"])
	_build_block(Vector3(-15, 0, 9), Vector2(3, 2), palette["building_c"])
	_build_block(Vector3(14, 0, 9), Vector2(3, 2), palette["building_d"])
	_build_block(Vector3(29, 0, 5), Vector2(4, 2), palette["building_b"])
	_build_block(Vector3(-30, 0, -2), Vector2(3, 2), palette["building_c"])
	_build_block(Vector3(29, 0, -19), Vector2(3, 3), palette["building_a"])

	_build_park(Vector3(-28, 0, 23))
	_build_school(Vector3(19, 0, -28))
	_build_petrol_station(Vector3(28, 0, 29))
	_build_bus_stop(Vector3(-7, 0, -15))
	_build_harbor_district()
	_build_race_markers()
	_add_signs()

func _build_block(origin: Vector3, grid_size: Vector2, base_color: Color) -> void:
	var width := int(grid_size.x)
	var depth := int(grid_size.y)
	for ix in range(width):
		for iz in range(depth):
			var height := 3.0 + float((ix * 3 + iz * 5) % 4) * 1.0
			var size := Vector3(4.1, height, 4.1)
			var position := origin + Vector3(ix * 5.0, height * 0.5, iz * 5.0)
			_add_box("Building", size, position, base_color.lightened(float((ix + iz) % 3) * 0.08), true)
			_add_box("Roof", Vector3(3.4, 0.08, 0.15), position + Vector3(0, height * 0.12, -2.08), palette["accent"], false)

func _build_park(origin: Vector3) -> void:
	_add_box("Park", Vector3(18, 0.12, 15), origin + Vector3(0, 0.06, 0), palette["park"], false)
	_add_box("ParkPath", Vector3(2, 0.04, 15), origin + Vector3(0, 0.14, 0), palette["sidewalk"], false)
	_add_box("ParkPath2", Vector3(18, 0.04, 2), origin + Vector3(0, 0.15, 0), palette["sidewalk"], false)
	for x in [-6.0, 6.0]:
		for z in [-5.0, 5.0]:
			_add_tree(origin + Vector3(x, 0, z))
	_add_box("ParkBench", Vector3(2.8, 0.35, 0.5), origin + Vector3(4, 0.45, -2), palette["tree_trunk"], false)

func _add_tree(position: Vector3) -> void:
	_add_cylinder("TreeTrunk", 0.22, 1.4, position + Vector3(0, 0.7, 0), palette["tree_trunk"], true)
	_add_sphere("TreeCanopy", 1.25, position + Vector3(0, 2.0, 0), palette["tree"], false)

func _build_school(origin: Vector3) -> void:
	_add_box("School", Vector3(18, 4.2, 10), origin + Vector3(0, 2.1, 0), palette["school"], true)
	_add_box("SchoolRoof", Vector3(19, 0.3, 11), origin + Vector3(0, 4.35, 0), palette["building_c"], false)
	_add_box("SchoolDoor", Vector3(2.0, 2.3, 0.12), origin + Vector3(0, 1.15, 5.08), palette["building_a"], false)
	_add_box("SchoolSign", Vector3(7, 0.6, 0.15), origin + Vector3(0, 3.1, 5.14), palette["accent"], false)

func _build_petrol_station(origin: Vector3) -> void:
	_add_box("PetrolCanopy", Vector3(12, 0.35, 8), origin + Vector3(0, 3.6, 0), palette["accent"], false)
	for x in [-4.5, 4.5]:
		for z in [-2.8, 2.8]:
			_add_cylinder("CanopyPost", 0.18, 3.6, origin + Vector3(x, 1.8, z), palette["petrol"], true)
	_add_box("PetrolShop", Vector3(7, 2.8, 5), origin + Vector3(0, 1.4, -6), palette["petrol"], true)

func _build_bus_stop(origin: Vector3) -> void:
	_add_box("BusShelterRoof", Vector3(4.5, 0.22, 2.2), origin + Vector3(0, 2.2, 0), palette["building_c"], false)
	_add_box("BusBench", Vector3(2.5, 0.25, 0.5), origin + Vector3(0, 0.6, 0.5), palette["tree_trunk"], false)
	_add_box("BusStopPost", Vector3(0.16, 2.0, 0.16), origin + Vector3(-1.8, 1.0, -0.7), palette["accent"], true)

func _build_harbor_district() -> void:
	# A compact original mountain-harbor district layered over the foundation city.
	_add_box("JadeWater", Vector3(42, 0.12, 10), Vector3(0, 0.02, -27), palette["water"], false)
	_add_box("HarborWalk", Vector3(44, 0.22, 2.4), Vector3(0, 0.14, -21.5), palette["stone"], true)
	_add_box("HarborBridge", Vector3(16, 0.5, 4.0), Vector3(0, 0.35, -27), palette["stone"], true)
	for x in [-18.0, -12.0, 12.0, 18.0]:
		_add_box("Pier", Vector3(2.8, 0.3, 6.0), Vector3(x, 0.18, -27), palette["tree_trunk"], true)
		_add_lantern_pole(Vector3(x, 0, -23.0))

	_add_pavilion(Vector3(-17, 0, -16), Vector3(9, 3.8, 7), palette["building_a"])
	_add_pavilion(Vector3(17, 0, -16), Vector3(9, 4.5, 7), palette["building_b"])
	_add_pavilion(Vector3(0, 0, -31), Vector3(10, 5.5, 7), palette["jade"])
	_add_market_awning(Vector3(25, 0, 21))
	_add_market_awning(Vector3(32, 0, 21))
	for x in range(-28, 29, 8):
		_add_lantern_pole(Vector3(x, 0, -20.0))
	_add_stone_steps(Vector3(-28, 0, -19))
	_add_backdrop()

func _add_pavilion(origin: Vector3, size: Vector3, body_color: Color) -> void:
	_add_box("HarborPavilion", size, origin + Vector3(0, size.y * 0.5, 0), body_color, true)
	_add_box("PavilionRoof", Vector3(size.x + 1.4, 0.35, size.z + 1.4), origin + Vector3(0, size.y + 0.25, 0), palette["roof"], false)
	_add_box("PavilionRoofTrim", Vector3(size.x + 2.2, 0.18, 0.45), origin + Vector3(0, size.y + 0.55, -size.z * 0.5), palette["accent"], false)
	_add_box("PavilionDoor", Vector3(1.8, 2.2, 0.12), origin + Vector3(0, 1.1, size.z * 0.5 + 0.08), palette["roof"], false)
	for x in [-size.x * 0.35, size.x * 0.35]:
		_add_cylinder("PavilionPost", 0.16, size.y, origin + Vector3(x, size.y * 0.5, size.z * 0.5 + 0.18), palette["tree_trunk"], true)

func _add_market_awning(origin: Vector3) -> void:
	_add_box("MarketStall", Vector3(5.2, 2.0, 3.6), origin + Vector3(0, 1.0, 0), palette["building_a"], true)
	_add_textured_box("LanternBannerAwning", Vector3(6.0, 0.16, 4.4), origin + Vector3(0, 2.35, 0), LANTERN_BANNER, false)
	_add_box("MarketCounter", Vector3(4.8, 0.7, 0.55), origin + Vector3(0, 1.1, 2.0), palette["tree_trunk"], false)
	_add_lantern_pole(origin + Vector3(-2.5, 0, 1.0))

func _add_lantern_pole(position: Vector3) -> void:
	_add_cylinder("LanternPole", 0.10, 2.7, position + Vector3(0, 1.35, 0), palette["tree_trunk"], true)
	_add_sphere("LanternGlow", 0.42, position + Vector3(0, 2.55, 0), palette["accent"], false)
	_add_box("LanternCap", Vector3(0.58, 0.08, 0.58), position + Vector3(0, 2.92, 0), palette["roof"], false)

func _add_stone_steps(origin: Vector3) -> void:
	for i in range(5):
		_add_box("HarborStep", Vector3(8.0 - i * 0.7, 0.35, 1.2), origin + Vector3(0, 0.18 + i * 0.35, i * 1.1), palette["stone"], true)

func _add_backdrop() -> void:
	var backdrop := MeshInstance3D.new()
	backdrop.name = "MountainHarborBackdrop"
	var quad := QuadMesh.new()
	quad.size = Vector2(104.0, 58.0)
	backdrop.mesh = quad
	backdrop.position = Vector3(0, 25.0, -43.0)
	backdrop.rotation_degrees = Vector3(0, 180, 0)
	var material := StandardMaterial3D.new()
	material.albedo_texture = MOUNTAIN_BACKDROP
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	backdrop.material_override = material
	add_child(backdrop)

func _build_race_markers() -> void:
	var points := [Vector3(-26, 0.1, 31), Vector3(0, 0.1, 31), Vector3(26, 0.1, 31), Vector3(31, 0.1, 10), Vector3(31, 0.1, -14), Vector3(10, 0.1, -31)]
	for point in points:
		_add_box("RaceMarker", Vector3(1.2, 0.2, 1.2), point, palette["accent"], false)

func _add_signs() -> void:
	_add_box("MarketSign", Vector3(5, 1.2, 0.18), Vector3(28, 3.2, 17.8), palette["accent"], false)
	_add_box("CityGate", Vector3(0.35, 3.0, 0.35), Vector3(-4.5, 1.5, -31), palette["building_a"], true)
	_add_box("CityGate2", Vector3(0.35, 3.0, 0.35), Vector3(4.5, 1.5, -31), palette["building_a"], true)
	_add_box("CityGateTop", Vector3(9.35, 0.35, 0.35), Vector3(0, 3.0, -31), palette["building_a"], true)

func _add_textured_box(node_name: String, size: Vector3, position: Vector3, texture: Texture2D, with_collision: bool) -> Node3D:
	var container: Node3D = StaticBody3D.new() if with_collision else Node3D.new()
	container.name = node_name
	container.position = position
	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_texture = texture
	material.roughness = 0.88
	mesh_instance.material_override = material
	container.add_child(mesh_instance)
	if with_collision:
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		collision.shape = shape
		container.add_child(collision)
	add_child(container)
	return container

func _add_box(node_name: String, size: Vector3, position: Vector3, color: Color, with_collision: bool) -> Node3D:
	var container: Node3D = StaticBody3D.new() if with_collision else Node3D.new()
	container.name = node_name
	container.position = position
	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _material(color)
	container.add_child(mesh_instance)
	if with_collision:
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		collision.shape = shape
		container.add_child(collision)
	add_child(container)
	return container

func _add_cylinder(node_name: String, radius: float, height: float, position: Vector3, color: Color, with_collision: bool) -> Node3D:
	var container: Node3D = StaticBody3D.new() if with_collision else Node3D.new()
	container.name = node_name
	container.position = position
	var mesh_instance := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = 10
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _material(color)
	container.add_child(mesh_instance)
	if with_collision:
		var collision := CollisionShape3D.new()
		var shape := CylinderShape3D.new()
		shape.radius = radius
		shape.height = height
		collision.shape = shape
		container.add_child(collision)
	add_child(container)
	return container

func _add_sphere(node_name: String, radius: float, position: Vector3, color: Color, with_collision: bool) -> Node3D:
	var container: Node3D = StaticBody3D.new() if with_collision else Node3D.new()
	container.name = node_name
	container.position = position
	var mesh_instance := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 12
	mesh.rings = 6
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _material(color)
	container.add_child(mesh_instance)
	if with_collision:
		var collision := CollisionShape3D.new()
		var shape := SphereShape3D.new()
		shape.radius = radius
		collision.shape = shape
		container.add_child(collision)
	add_child(container)
	return container

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.82
	return material
