class_name DebugHud
extends CanvasLayer

var status_label: Label
var fps_label: Label
var elapsed := 0.0

func _ready() -> void:
	status_label = Label.new()
	status_label.position = Vector2(28, 24)
	status_label.add_theme_font_size_override("font_size", 22)
	status_label.add_theme_color_override("font_color", Color(0.92, 0.96, 1.0))
	status_label.text = "COMPACT CITY  /  FOUNDATION BUILD\nWASD: move   SHIFT: run   Swipe right: look"
	add_child(status_label)

	fps_label = Label.new()
	fps_label.position = Vector2(28, 92)
	fps_label.add_theme_font_size_override("font_size", 18)
	fps_label.add_theme_color_override("font_color", Color(0.55, 0.9, 0.72))
	add_child(fps_label)

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed > 0.25:
		elapsed = 0.0
		fps_label.text = "FPS %d   |   Objects %d   |   Mobile renderer: Compatibility" % [Engine.get_frames_per_second(), get_tree().get_node_count()]
