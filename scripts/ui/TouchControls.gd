class_name TouchControls
extends Control

var move_vector := Vector2.ZERO
var sprint_pressed := false
var joystick_center := Vector2(112.0, 600.0)
var joystick_radius := 78.0
var knob_radius := 30.0
var active_touch := -1
var sprint_rect := Rect2(1080.0, 575.0, 140.0, 90.0)
var zoom_in_rect := Rect2()
var zoom_out_rect := Rect2()
var zoom_delta := 0.0
var pinch_ids := {}
var pinch_distance := 0.0

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func get_move_vector() -> Vector2:
	return move_vector

func is_sprint_pressed() -> bool:
	return sprint_pressed

func consume_zoom_delta() -> float:
	var value := zoom_delta
	zoom_delta = 0.0
	return value

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x < get_viewport_rect().size.x * 0.42 and active_touch == -1:
				active_touch = event.index
				joystick_center = event.position
				_update_joystick(event.position)
			elif sprint_rect.has_point(event.position):
				sprint_pressed = true
			elif zoom_in_rect.has_point(event.position):
				zoom_delta -= 1.0
			elif zoom_out_rect.has_point(event.position):
				zoom_delta += 1.0
			pinch_ids[event.index] = event.position
		else:
			if event.index == active_touch:
				active_touch = -1
				move_vector = Vector2.ZERO
				help_queue_redraw()
			if sprint_rect.has_point(event.position):
				sprint_pressed = false
			pinch_ids.erase(event.index)
			if pinch_ids.size() < 2:
				pinch_distance = 0.0
	elif event is InputEventScreenDrag:
		if event.index == active_touch:
			_update_joystick(event.position)
		pinch_ids[event.index] = event.position
		_update_pinch_zoom()

func _update_joystick(position: Vector2) -> void:
	var offset := position - joystick_center
	move_vector = offset.limit_length(joystick_radius) / joystick_radius
	move_vector.y = -move_vector.y
	help_queue_redraw()

func _update_pinch_zoom() -> void:
	if pinch_ids.size() < 2:
		return
	var points := pinch_ids.values()
	var current_distance: float = points[0].distance_to(points[1])
	if pinch_distance > 0.0:
		zoom_delta += (pinch_distance - current_distance) * 0.012
	pinch_distance = current_distance

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

	zoom_in_rect = Rect2(viewport_size.x - 208.0, 36.0, 72.0, 62.0)
	zoom_out_rect = Rect2(viewport_size.x - 124.0, 36.0, 72.0, 62.0)
	_draw_camera_button(zoom_in_rect, "+")
	_draw_camera_button(zoom_out_rect, "−")
	draw_string(ThemeDB.fallback_font, Vector2(viewport_size.x - 208.0, 124.0), "CAMERA", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.88, 0.94, 1.0, 0.8))

func _draw_camera_button(rect: Rect2, label: String) -> void:
	draw_style_box(_make_box(Color(0.08, 0.12, 0.18, 0.76), Color(0.95, 0.72, 0.32, 0.9), 12.0), rect)
	draw_string(ThemeDB.fallback_font, rect.position + Vector2(27.0, 43.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 32, Color(1.0, 0.92, 0.7))

func _make_box(fill: Color, border: Color, radius: float) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = fill
	box.border_color = border
	box.set_border_width_all(2)
	box.set_corner_radius_all(int(radius))
	return box
