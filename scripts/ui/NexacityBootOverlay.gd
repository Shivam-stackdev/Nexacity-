extends CanvasLayer

const TITLE_COLOR := Color("#72d7ff")
const HAZE_COLOR := Color("#1d9fdf")
const MIN_HOLD_SECONDS := 1.8

var _root: Control
var _stage_label: Label
var _error_label: Label
var _started_at := 0.0
var _completed := false

func _ready() -> void:
	layer = 100
	_started_at = Time.get_ticks_msec() * 0.001
	_build_overlay()
	_play_intro()

func set_stage(stage: String) -> void:
	if _completed:
		return
	_stage_label.text = stage.to_upper()

func show_error(message: String) -> void:
	_completed = true
	_stage_label.text = "INITIALIZATION PAUSED"
	if OS.is_debug_build():
		_error_label.text = "DEBUG: " + message
		_error_label.visible = true
	push_error(message)

func complete() -> void:
	if _completed:
		return
	_stage_label.text = "READY"
	_completed = true
	var elapsed := Time.get_ticks_msec() * 0.001 - _started_at
	if elapsed < MIN_HOLD_SECONDS:
		await get_tree().create_timer(MIN_HOLD_SECONDS - elapsed).timeout
	var fade := create_tween()
	fade.set_trans(Tween.TRANS_SINE)
	fade.set_ease(Tween.EASE_IN_OUT)
	fade.tween_property(_root, "modulate:a", 0.0, 0.4)
	fade.tween_callback(queue_free)

func _build_overlay() -> void:
	_root = Control.new()
	_root.name = "NexacityBootRoot"
	_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)

	var background := ColorRect.new()
	background.color = Color("#03070d")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.add_child(background)

	var haze := ColorRect.new()
	haze.color = Color(HAZE_COLOR, 0.10)
	haze.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	haze.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(haze)

	_add_particles()
	_add_title()
	_add_status()

func _add_particles() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var viewport_size := get_viewport().get_visible_rect().size
	for index in range(12):
		var particle := ColorRect.new()
		var particle_size := rng.randf_range(1.0, 3.0)
		particle.color = Color(TITLE_COLOR, rng.randf_range(0.05, 0.18))
		particle.size = Vector2(particle_size, particle_size)
		particle.position = Vector2(rng.randf_range(0.0, viewport_size.x), rng.randf_range(0.0, viewport_size.y))
		particle.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_root.add_child(particle)
		var drift := create_tween().set_loops()
		drift.set_trans(Tween.TRANS_SINE)
		drift.tween_property(particle, "position:y", particle.position.y - rng.randf_range(12.0, 40.0), rng.randf_range(2.8, 5.5))
		drift.parallel().tween_property(particle, "modulate:a", rng.randf_range(0.25, 0.7), rng.randf_range(1.4, 2.8))
		drift.tween_property(particle, "position:y", particle.position.y, rng.randf_range(2.8, 5.5))

func _add_title() -> void:
	var glow := _make_title_label()
	glow.name = "NexacityGlow"
	glow.add_theme_color_override("font_color", Color(TITLE_COLOR, 0.28))
	glow.add_theme_color_override("font_outline_color", Color(HAZE_COLOR, 0.35))
	glow.add_theme_constant_override("outline_size", 8)
	_root.add_child(glow)

	var title := _make_title_label()
	title.name = "NexacityTitle"
	title.add_theme_color_override("font_color", TITLE_COLOR)
	title.add_theme_color_override("font_outline_color", Color("#a7ecff"))
	title.add_theme_constant_override("outline_size", 1)
	_root.add_child(title)

	glow.modulate.a = 0.0
	title.modulate.a = 0.0
	var intro := create_tween()
	intro.set_trans(Tween.TRANS_SINE)
	intro.set_ease(Tween.EASE_OUT)
	intro.tween_interval(0.2)
	intro.tween_property(title, "modulate:a", 1.0, 0.5)
	intro.parallel().tween_property(glow, "modulate:a", 1.0, 0.5)

func _make_title_label() -> Label:
	var label := Label.new()
	label.text = "NEXACITY"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_preset(Control.PRESET_CENTER)
	label.offset_left = -340.0
	label.offset_top = -74.0
	label.offset_right = 340.0
	label.offset_bottom = 10.0
	label.add_theme_font_size_override("font_size", 58)
	label.add_theme_constant_override("shadow_offset_x", 0)
	label.add_theme_constant_override("shadow_offset_y", 0)
	return label

func _add_status() -> void:
	_stage_label = Label.new()
	_stage_label.text = "INITIALIZE GODOT"
	_stage_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_stage_label.set_anchors_preset(Control.PRESET_CENTER)
	_stage_label.offset_left = -240.0
	_stage_label.offset_top = 36.0
	_stage_label.offset_right = 240.0
	_stage_label.offset_bottom = 62.0
	_stage_label.add_theme_font_size_override("font_size", 12)
	_stage_label.add_theme_color_override("font_color", Color("#9cdffb"))
	_root.add_child(_stage_label)

	_error_label = Label.new()
	_error_label.visible = false
	_error_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_error_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_error_label.set_anchors_preset(Control.PRESET_CENTER)
	_error_label.offset_left = -330.0
	_error_label.offset_top = 84.0
	_error_label.offset_right = 330.0
	_error_label.offset_bottom = 130.0
	_error_label.add_theme_font_size_override("font_size", 11)
	_error_label.add_theme_color_override("font_color", Color("#f3a8a8"))
	_root.add_child(_error_label)

func _play_intro() -> void:
	# Title tween is created in _add_title so the overlay can render immediately.
	pass
