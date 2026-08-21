class_name TouchControls
extends Control

var move_vector := Vector2.ZERO
var sprint_pressed := false
var joystick_center := Vector2(112.0, 600.0)
var joystick_radius := 78.0
var knob_radius := 30.0
var active_touch := -1
var sprint_rect := Rect2(1080.0, 575.0, 140.0, 90.0)

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func get_move_vector() -> Vector2:
	return move_vector

func is_sprint_pressed() -> bool:
	return sprint_pressed

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x < get_viewport_rect().size.x * 0.42 and active_touch == -1:
				active_touch = event.index
				joystick_center = event.position
				_update_joystick(event.position)
			elif sprint_rect.has_point(event.position):
				sprint_pressed = true
		else:
			if event.index == active_touch:
				active_touch = -1
				move_vector = Vector2.ZERO
				help_queue_redraw()
			if sprint_rect.has_point(event.position):
				sprint_pressed = false
	elif event is InputEventScreenDrag and event.index == active_touch:
		_update_joystick(event.position)

func _update_joystick(position: Vector2) -> void:
	var offset := position - joystick_center
	move_vector = offset.limit_length(joystick_radius) / joystick_radius
	move_vector.y = -move_vector.y
	help_queue_redraw()

func help_queue_redraw() -> void:
	queue_redraw()

func _draw() -> void:
	var viewport_size := get_viewport_rect().size
	var center := joystick_center
	if active_touch == -1:
		center = Vector2(112.0, viewport_size.y - 120.0)
	joystick_center = center
	draw_circle(center, joystick_radius, Color(0.08, 0.12, 0.18, 0.62))
	draw_arc(center, joystick_radius, 0.0, TAU, 40, Color(0.65, 0.78, 0.9, 0.7), 3.0)
	var knob_offset := Vector2(move_vector.x, -move_vector.y) * (joystick_radius - knob_radius)
	draw_circle(center + knob_offset, knob_radius, Color(0.35, 0.72, 0.95, 0.88))
	var button := Rect2(viewport_size.x - 185.0, viewport_size.y - 145.0, 145.0, 82.0)
	sprint_rect = button
	draw_style_box(_make_box(Color(0.08, 0.12, 0.18, 0.72), Color(0.72, 0.85, 0.95, 0.75), 14.0), button)
	draw_string(ThemeDB.fallback_font, button.position + Vector2(37.0, 50.0), "RUN", HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color(0.9, 0.96, 1.0))

func _make_box(fill: Color, border: Color, radius: float) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = fill
	box.border_color = border
	box.set_border_width_all(2)
	box.set_corner_radius_all(int(radius))
	return box
