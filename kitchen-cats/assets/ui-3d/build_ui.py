"""Render Kitchen Cats interface artwork with Blender 4.3.

Usage: blender -b --factory-startup --python build_ui.py

All panels and buttons are drawn as actual beveled three-dimensional objects.
The generous transparent gutters are intentional: CSS uses border-image 9-slice
for frames so that the material edges keep their thickness at phone sizes.
"""

import bpy
import math
import os
from pathlib import Path
from mathutils import Vector


OUT = Path(__file__).resolve().parent
OUT.mkdir(exist_ok=True)

PAL = {
    "cream": (0.95, 0.90, 0.77, 1),
    "ivory": (0.995, 0.974, 0.882, 1),
    "sage": (0.18, 0.345, 0.290, 1),
    "deep": (0.085, 0.195, 0.175, 1),
    "mint": (0.68, 0.79, 0.67, 1),
    "oak": (0.68, 0.39, 0.20, 1),
    "oak_light": (0.82, 0.56, 0.30, 1),
    "copper": (0.76, 0.42, 0.24, 1),
    "gold": (0.92, 0.68, 0.32, 1),
    "coral": (0.86, 0.40, 0.27, 1),
    "tomato": (0.77, 0.20, 0.15, 1),
    "carrot": (0.92, 0.45, 0.14, 1),
    "charcoal": (0.16, 0.19, 0.16, 1),
    "shadow": (0.04, 0.095, 0.078, 1),
}


def linearize(color):
    return tuple((v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4)
                 for v in color[:3]) + (color[3],)


def material(name, color, metallic=0, roughness=0.35):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = linearize(color)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linearize(color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


M = {name: material(name, col, .58 if name in ("copper", "gold") else .02,
                    .22 if name in ("copper", "gold") else .32)
     for name, col in PAL.items()}


def rounded_box(name, loc, dims, mat, bevel=0.1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    if bevel:
        mod = obj.modifiers.new("broad soft machined corners", "BEVEL")
        mod.width = min(bevel, min(dims) * .46)
        mod.segments = 5
        mod.affect = 'EDGES'
        mod2 = obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
        mod2.weight = 50
    return obj


def sphere(name, loc, radius, mat, scale=(1, 1, 1), segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=12,
                                         radius=radius, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    ob.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    bpy.ops.object.shade_smooth()
    return ob


def cylinder(name, loc, radius, depth, mat, vertices=48, axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius,
                                        depth=depth, location=loc)
    ob = bpy.context.object
    ob.name = name
    if axis == 'Y': ob.rotation_euler[0] = math.pi / 2
    ob.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    be = ob.modifiers.new("soft manufactured lip", "BEVEL")
    be.width = min(.07, depth * .25)
    be.segments = 3
    ob.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    bpy.ops.object.shade_smooth()
    return ob


def torus(name, loc, major, minor, mat, axis='Z'):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=48, minor_segments=12,
                                     location=loc)
    ob = bpy.context.object
    ob.name = name
    if axis == 'Y': ob.rotation_euler[0] = math.pi / 2
    ob.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    bpy.ops.object.shade_smooth()
    return ob


def rod(name, a, b, radius, mat):
    mid = (Vector(a) + Vector(b)) / 2
    direction = Vector(b) - Vector(a)
    ob = cylinder(name, mid, radius, direction.length, mat, 16)
    ob.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return ob


def star(name, loc, outer, inner, depth, mat, points=5):
    # Star is a solid extruded mesh, not a flat texture primitive.
    coords = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner
        a = math.pi / 2 + i * math.pi / points
        coords.append((loc[0] + r * math.cos(a), loc[1],
                       loc[2] + r * math.sin(a)))
    verts = [(x, y - depth / 2, z) for x, y, z in coords] + [
        (x, y + depth / 2, z) for x, y, z in coords]
    faces = [tuple(range(points * 2 - 1, -1, -1)),
             tuple(range(points * 2, points * 4))]
    for i in range(points * 2):
        j = (i + 1) % (points * 2)
        faces.append((i, j, j + points * 2, i + points * 2))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M[mat])
    be = obj.modifiers.new("star bevel", 'BEVEL')
    be.width = .045
    be.segments = 3
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def curve(name, coords, bevel, mat):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth = bevel
    data.bevel_resolution = 3
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(coords) - 1)
    for point, xyz in zip(spline.bezier_points, coords):
        point.co = xyz
        point.handle_left_type = point.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M[mat])
    return obj


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def setup_camera(look=(0, 0, 0), pos=(0, -10, 3), scale=5):
    bpy.ops.object.camera_add(location=pos)
    camera = bpy.context.object
    camera.rotation_euler = (Vector(look) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = scale
    bpy.context.scene.camera = camera


def setup_light():
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = linearize((.68, .77, .70, 1))
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
    for name, pos, power, color, size in [
        ("warm key", (-4, -5, 8), 520, (1.0, .80, .64), 3.4),
        ("mint bounce", (5, -2, 3), 220, (.73, 1.0, .84), 3.4),
        ("top rim", (1, 4, 6), 180, (1.0, .94, .80), 3.0),
    ]:
        bpy.ops.object.light_add(type='AREA', location=pos)
        light = bpy.context.object
        light.name = name
        light.data.energy = power
        light.data.color = color
        light.data.shape = 'DISK'
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()


def scene_start(camera='front', scale=5):
    reset()
    setup_light()
    if camera == 'front': setup_camera(scale=scale)
    elif camera == 'top': setup_camera(pos=(0, -6, 7), scale=scale)
    else: setup_camera(pos=(0, -8, 6), scale=scale)


def render(name, width, height, samples=16):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.render.filepath = str(OUT / f"{name}.png")
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.render.image_settings.compression = 65
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = samples
    bpy.ops.render.render(write_still=True)


def panel(name, base='cream', width=7.5, height=4.5, output=(1000, 600), rivets=True):
    scene_start(scale=max(width * 1.25, height * output[0] / output[1] * 1.25))
    backing = 'deep' if base == 'sage' else 'oak'
    edge = 'coral' if name.endswith('urgent') else ('copper' if base == 'sage' else 'sage')
    face = 'sage' if base == 'sage' else 'ivory'
    rounded_box('soft contact underlay', (0, .19, -.085), (width + .14, .20, height + .10), 'shadow', .23)
    rounded_box('machined side body', (0, .075, 0), (width, .27, height), backing, .24)
    rounded_box('metallic edge reveal', (0, -.074, .018), (width - .12, .09, height - .12), edge, .20)
    rounded_box('satin face', (0, -.139, .025), (width - .23, .062, height - .23), face, .17)
    if rivets:
        for x in (-width / 2 + .34, width / 2 - .34):
            for z in (-height / 2 + .34, height / 2 - .34):
                cylinder('copper pin', (x, -.185, z), .055, .035, 'gold', 24, 'Y')
    render(name, *output)


def button(name, color='coral', pressed=False, disabled=False):
    scene_start(scale=5.95)
    top = 'mint' if disabled else color
    rim = 'sage' if disabled else ('copper' if color == 'coral' else 'deep')
    z = -.065 if pressed else .015
    rounded_box('button dark lift', (0, .18, -.11), (4.85, .27, 1.16), 'shadow', .23)
    rounded_box('enamel edge', (0, .04, z), (4.78, .24, 1.13), rim, .22)
    rounded_box('satin raised press face', (0, -.11 if not pressed else -.035, z + .035),
                (4.58, .055, .92), top, .18)
    # Small pair of polished copper fasteners are anchored in corner slices.
    if not disabled:
        for x in (-2.12, 2.12):
            cylinder('small corner glint', (x, -.16 if not pressed else -.08, .025),
                     .035, .018, 'gold', 16, 'Y')
    render(name, 720, 210)


def avatar_plate(selected=False):
    scene_start(camera='top', scale=2.25)
    rim = 'coral' if selected else 'sage'
    cylinder('oak socket', (0, 0, -.045), .86, .16, 'oak', 64)
    cylinder('metal lip', (0, 0, .055), .80, .11, rim, 64)
    cylinder('porcelain dish', (0, 0, .12), .68, .065, 'ivory', 64)
    torus('raised inside rim', (0, 0, .155), .63, .027, 'gold' if selected else 'mint')
    render('avatar-plate-selected' if selected else 'avatar-plate', 256, 256)


def joystick():
    scene_start(camera='top', scale=2.45)
    cylinder('oak retaining plate', (0, 0, -.07), .93, .19, 'oak', 64)
    cylinder('sage housing', (0, 0, .035), .85, .15, 'sage', 64)
    torus('copper running ring', (0, 0, .11), .70, .065, 'copper')
    cylinder('dark control well', (0, 0, .12), .59, .10, 'deep', 64)
    for a in range(0, 360, 90):
        rad = math.radians(a)
        cylinder('compass rivet', (.76 * math.cos(rad), .76 * math.sin(rad), .14),
                 .045, .025, 'gold', 16)
    render('joystick-base', 320, 320)
    scene_start(camera='top', scale=1.44)
    cylinder('shaft shade', (0, 0, -.05), .42, .19, 'shadow', 48)
    cylinder('cup edge', (0, 0, .08), .43, .18, 'copper', 48)
    sphere('grip dome', (0, 0, .20), .44, 'sage', scale=(1, 1, .37))
    torus('thumb rim', (0, 0, .25), .31, .035, 'mint')
    render('joystick-knob', 180, 180)


def paw(loc=(0, -.31, 0), scale=1, mat='ivory'):
    x, y, z = loc
    sphere('palm', (x, y, z - .11 * scale), .20 * scale, mat,
           scale=(1.04, .19, .82))
    for dx, dz in [(-.24, .13), (-.08, .21), (.09, .21), (.25, .13)]:
        sphere('toe', (x + dx * scale, y, z + dz * scale), .088 * scale,
               mat, scale=(.83, .21, 1.1))


def action_disc(pressed=False):
    scene_start(camera='front', scale=2.45)
    y = -.02 if pressed else -.16
    cylinder('dark retaining body', (0, .18, -.065), .90, .24, 'shadow', 64, 'Y')
    cylinder('gold lip', (0, .08, 0), .87, .20, 'gold', 64, 'Y')
    cylinder('coral actuator', (0, y, .02), .76, .17, 'coral', 64, 'Y')
    torus('rim glint', (0, y - .096, .02), .66, .028, 'ivory', 'Y')
    paw((0, y - .11, 0), .86)
    render('action-disc-pressed' if pressed else 'action-disc', 320, 320)


def progress(name, fill='track'):
    scene_start(scale=5.85)
    rounded_box('copper side', (0, .04, -.015), (4.8, .20, .36), 'copper', .14)
    if fill == 'track':
        rounded_box('recess', (0, -.08, .005), (4.50, .05, .20), 'deep', .075)
    else:
        rounded_box('gloss bar', (0, -.08, .005), (4.50, .08, .20), fill, .08)
    render(name, 600, 86)


def tiny_icon(name):
    scene_start(camera='front', scale=2.05)
    if name == 'clock':
        cylinder('clock body', (0, 0, 0), .73, .18, 'sage', 48, 'Y')
        cylinder('clock face', (0, -.13, 0), .61, .05, 'ivory', 48, 'Y')
        torus('copper tick ring', (0, -.18, 0), .58, .045, 'copper', 'Y')
        rod('short hand', (0, -.23, 0), (0, -.23, .35), .048, 'sage')
        rod('long hand', (0, -.24, 0), (.30, -.24, -.18), .037, 'coral')
        sphere('pin', (0, -.26, 0), .075, 'gold')
    elif name == 'score':
        star('cast gold star', (0, -.04, 0), .76, .37, .20, 'gold')
        star('ivory inset star', (0, -.17, .01), .55, .27, .055, 'ivory')
    elif name == 'paw':
        cylinder('paw disk', (0, 0, 0), .76, .16, 'sage', 48, 'Y')
        paw((0, -.16, 0), 1.0, 'ivory')
    elif name in ('fullscreen', 'fullscreen-exit'):
        rounded_box('dark square', (0, 0, 0), (1.44, .17, 1.44), 'sage', .20)
        for sx in (-1, 1):
            for sz in (-1, 1):
                x, z = sx * .50, sz * .50
                dx = -sx * .25 if name == 'fullscreen' else sx * .15
                dz = -sz * .25 if name == 'fullscreen' else sz * .15
                rod('fullscreen corner A', (x, -.15, z), (x + dx, -.15, z), .055, 'ivory')
                rod('fullscreen corner B', (x, -.15, z), (x, -.15, z + dz), .055, 'ivory')
    elif name == 'help':
        cylinder('help disk', (0, 0, 0), .76, .16, 'sage', 48, 'Y')
        curve('question arc', [(-.25, -.22, .25), (0, -.22, .49),
                                (.24, -.22, .20), (0, -.22, -.12)], .065, 'ivory')
        sphere('question dot', (0, -.24, -.42), .08, 'ivory')
    elif name == 'leave':
        rounded_box('oak door', (.08, .03, 0), (1.1, .16, 1.37), 'oak', .12)
        rounded_box('door inset', (.12, -.08, 0), (.83, .05, 1.13), 'cream', .08)
        sphere('handle', (.42, -.16, -.06), .08, 'gold')
        rod('exit arrow stem', (-.64, -.20, 0), (-.14, -.20, 0), .05, 'coral')
        rod('exit arrow upper', (-.64, -.20, 0), (-.37, -.20, .23), .05, 'coral')
        rod('exit arrow lower', (-.64, -.20, 0), (-.37, -.20, -.23), .05, 'coral')
    elif name in ('sound', 'sound-off'):
        rounded_box('speaker cabinet', (-.23, -.04, 0), (.55, .24, .70), 'sage', .11)
        cylinder('speaker cone', (-.23, -.20, -.12), .23, .06, 'cream', 32, 'Y')
        if name == 'sound':
            curve('sound wave outer', [(.12, -.16, -.45), (.63, -.16, 0), (.12, -.16, .45)], .047, 'coral')
            curve('sound wave inner', [(.11, -.16, -.25), (.41, -.16, 0), (.11, -.16, .25)], .043, 'gold')
        else:
            rod('copper muted strike', (.08, -.30, -.42), (.62, -.30, .42), .065, 'coral')
    elif name in ('motion', 'motion-off'):
        star('large spark', (-.12, -.02, .02), .67, .14, .13, 'gold', 4)
        star('small spark', (.51, -.09, .45), .26, .075, .10, 'mint', 4)
        if name == 'motion-off':
            rod('copper motion pause A', (.24, -.25, -.50), (.24, -.25, .03), .07, 'coral')
            rod('copper motion pause B', (.46, -.25, -.50), (.46, -.25, .03), .07, 'coral')
    elif name == 'ready':
        cylinder('green badge', (0, 0, 0), .76, .17, 'sage', 48, 'Y')
        torus('copper badge ring', (0, -.105, 0), .68, .045, 'gold', 'Y')
        rod('check stem', (-.35, -.22, -.05), (-.08, -.22, -.30), .075, 'ivory')
        rod('check long arm', (-.08, -.22, -.30), (.41, -.22, .31), .075, 'ivory')
    elif name == 'urgent':
        cylinder('coral warning badge', (0, 0, 0), .76, .17, 'coral', 48, 'Y')
        torus('warning badge ring', (0, -.105, 0), .68, .045, 'gold', 'Y')
        rounded_box('heavy exclamation stem', (0, -.19, .16), (.15, .07, .60), 'ivory', .06)
        sphere('heavy exclamation dot', (0, -.23, -.40), .10, 'ivory')
    elif name == 'camera':
        rounded_box('camera enamel body', (0, 0, -.04), (1.40, .30, .92), 'sage', .13)
        rounded_box('top shutter', (-.34, .04, .48), (.52, .25, .24), 'copper', .07)
        cylinder('copper camera lens', (0, -.21, -.02), .40, .11, 'copper', 48, 'Y')
        cylinder('porcelain lens glass', (0, -.28, -.02), .28, .055, 'ivory', 48, 'Y')
        sphere('lens blue reflection', (-.10, -.32, .07), .09, 'mint', scale=(1, .35, 1))
        sphere('tiny flash', (.49, -.18, .25), .08, 'gold', scale=(1, .35, 1))
    elif name == 'qr':
        rounded_box('qr porcelain plaque', (0, 0, 0), (1.45, .18, 1.45), 'ivory', .15)
        for sx in (-1, 1):
            for sz in (-1, 1):
                x, z = .55 * sx, .55 * sz
                rod('qr reader horizontal bracket', (x, -.15, z), (x - .22 * sx, -.15, z), .045, 'copper')
                rod('qr reader vertical bracket', (x, -.15, z), (x, -.15, z - .22 * sz), .045, 'copper')
        for x, z in [(-.30, .29), (.29, .29), (-.30, -.28)]:
            rounded_box('embossed qr finder', (x, -.16, z), (.32, .06, .32), 'sage', .045)
            rounded_box('finder center', (x, -.205, z), (.11, .025, .11), 'ivory', .022)
        for x, z in [(.13, -.22), (.35, -.37), (.36, -.05), (.05, -.42)]:
            rounded_box('embossed qr module', (x, -.16, z), (.09, .06, .09), 'sage', .012)
    else:
        raise ValueError(name)
    render('icon-' + name, 192, 192)


def food_icon(name):
    scene_start(camera='top', scale=2.35)
    cylinder('porcelain dish', (0, 0, -.07), .88, .13, 'ivory', 64)
    torus('sage edge', (0, 0, .02), .77, .055, 'sage')
    if name == 'tomato':
        sphere('round tomato', (0, 0, .32), .46, 'tomato', scale=(1.08, 1, .86))
        for a in range(0, 360, 72):
            t = math.radians(a)
            rod('cutlery-like tomato leaf', (0, 0, .68),
                (.22 * math.cos(t), .22 * math.sin(t), .58), .037, 'sage')
        sphere('tomato shine', (-.15, -.24, .65), .095, 'ivory', scale=(1, .5, .28))
    elif name == 'carrot':
        cone = cylinder('carrot root', (0, 0, .28), .34, .70, 'carrot', 32)
        cone.scale = (.94, .73, 1)
        for a in (-.23, 0, .23):
            rod('carrot frond', (a * .3, 0, .60), (a, 0, .94), .045, 'sage')
        for z in (.14, .33, .52):
            rod('root score', (-.22, -.22, z), (.08, -.22, z + .015), .014, 'oak')
    render('icon-' + name, 192, 192)


def icon_tile():
    scene_start(camera='front', scale=2.0)
    rounded_box('square dark foot', (0, .13, -.04), (1.57, .21, 1.57), 'deep', .22)
    rounded_box('square polished rim', (0, -.025, 0), (1.50, .19, 1.50), 'copper', .20)
    rounded_box('enamel icon face', (0, -.14, .025), (1.32, .045, 1.32), 'sage', .16)
    render('button-icon-tile', 192, 192)


def pot(center=(0, 0, 0), scale=1):
    x, y, z = center
    cylinder('sage enamel pot', (x, y, z + .45 * scale), .66 * scale, .76 * scale, 'sage', 64)
    cylinder('soup surface', (x, y, z + .855 * scale), .57 * scale, .045 * scale, 'carrot', 64)
    torus('cast copper pot rim', (x, y, z + .84 * scale), .61 * scale,
          .055 * scale, 'copper')
    for side in (-1, 1):
        torus('pot handle', (x + side * .78 * scale, y, z + .62 * scale),
              .23 * scale, .06 * scale, 'copper', 'Y')
    for dx, dy in [(-.28, -.15), (.25, -.10), (.06, .24)]:
        sphere('ingredients in soup', (x + dx * scale, y + dy * scale, z + .90 * scale),
               .075 * scale, 'tomato' if dx < 0 else 'mint', scale=(1, 1, .32))
    for shift in (-.25, .13, .35):
        curve('translucent-looking steam', [(x + shift * scale, y, z + 1.0 * scale),
              (x + (shift - .08) * scale, y, z + 1.25 * scale),
              (x + (shift + .08) * scale, y, z + 1.5 * scale)],
              .018 * scale, 'ivory')


def hero():
    scene_start(camera='world', scale=11.7)
    camera = bpy.context.scene.camera
    camera.rotation_euler = (Vector((0, 0, 1.0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    # This is a miniature kitchen set, with true cast geometry and overlapping depth.
    rounded_box('sage back wall', (0, 1.2, 1.80), (9.4, .22, 4.4), 'sage', .16)
    rounded_box('oak wall shelf', (0, .88, 2.15), (8.3, .57, .19), 'oak_light', .07)
    rounded_box('cream backsplash tiles', (0, .98, .97), (9.1, .14, 1.5), 'cream', .10)
    for x in (-2.9, -1.6, -.3, 1.0, 2.3):
        rounded_box('tile seam shadow', (x, .89, .97), (.018, .02, 1.43), 'mint', .006)
    rounded_box('oak worktop', (0, -.43, -.40), (9.2, 3.10, .42), 'oak_light', .14)
    rounded_box('dark worktop front', (0, -1.77, -.86), (9.2, .45, .73), 'oak', .12)
    for x in (-3.65, -1.75, .15, 2.05):
        rounded_box('drawers', (x, -2.03, -.83), (1.72, .04, .50), 'cream', .08)
        rounded_box('copper pull', (x, -2.09, -.76), (.43, .07, .06), 'copper', .022)
    rounded_box('stove inset', (1.65, -.42, -.11), (3.0, 1.80, .13), 'deep', .10)
    for x in (.80, 2.50):
        torus('burner ring', (x, -.45, -.035), .52, .065, 'copper')
    pot((.83, -.45, -.05), 1.25)
    # Plated ingredients and cutting board furnish the left, ready for cat overlays.
    rounded_box('chopping block', (-2.47, -.56, -.08), (2.15, 1.17, .19), 'oak', .09)
    for x, y in [(-2.88, -.65), (-2.45, -.23), (-2.14, -.72)]:
        sphere('ripe tomato', (x, y, .12), .19, 'tomato', scale=(1, 1, .84))
        sphere('stem', (x, y, .28), .06, 'sage', scale=(1, 1, .5))
    for x, y in [(-1.78, .29), (-.90, .32)]:
        cylinder('porcelain pantry jar', (x, y, 2.48), .25, .52, 'ivory', 32)
        cylinder('copper jar lid', (x, y, 2.75), .29, .10, 'copper', 32)
    for x in (-2.80, -2.12):
        cylinder('bowl on shelf', (x, .67, 2.31), .28, .22, 'cream', 32)
        torus('bowl painted rim', (x, .67, 2.43), .26, .025, 'coral')
    # Opaque room is rendered to a transparent PNG; alpha only outside set.
    render('hero-kitchen', 1200, 760, 48)


def trophy_bowl():
    scene_start(camera='world', scale=4.5)
    rounded_box('oak prize plinth', (0, .10, -.53), (3.2, 1.55, .35), 'oak', .15)
    cylinder('large serving bowl', (0, 0, -.05), 1.11, .68, 'cream', 64)
    cylinder('soup top', (0, 0, .31), .94, .05, 'carrot', 64)
    torus('copper bowl rim', (0, 0, .28), 1.04, .07, 'copper')
    star('score star', (0, -1.15, 1.07), .49, .23, .20, 'gold')
    for side in (-1, 1):
        torus('prize handle', (side * 1.27, 0, -.02), .27, .065, 'sage', 'Y')
        sphere('tomato garnish', (side * .44, -.30, .37), .13, 'tomato', scale=(1, 1, .5))
    curve('celebration steam', [(-.25, .0, .39), (-.33, .0, .73), (-.12, .0, 1.04)], .025, 'ivory')
    curve('celebration steam', [(.23, .0, .39), (.13, .0, .72), (.31, .0, 1.06)], .025, 'ivory')
    render('result-soup-trophy', 480, 360, 48)


def help_icon(which):
    scene_start(camera='world', scale=2.35)
    rounded_box('oak tile', (0, 0, -.20), (1.7, 1.55, .24), 'oak', .12)
    if which == 'pick':
        sphere('tomato pickup', (-.21, 0, .24), .31, 'tomato')
        sphere('green stem', (-.21, 0, .54), .085, 'sage')
        cylinder('carrot pickup', (.30, 0, .12), .16, .47, 'carrot', 24)
        rod('carrot leaves', (.3, 0, .40), (.40, 0, .68), .05, 'sage')
    elif which == 'prep':
        rounded_box('chopping board', (0, 0, .05), (1.28, .90, .12), 'cream', .06)
        for x in (-.25, 0, .25):
            sphere('chopped tomato', (x, -.04, .20), .13, 'tomato', scale=(1, 1, .60))
        rod('metal knife', (-.55, -.36, .31), (.45, -.36, .31), .055, 'copper')
    elif which == 'simmer':
        pot((0, 0, -.08), .69)
    elif which == 'serve':
        cylinder('soup bowl', (0, 0, .10), .61, .35, 'cream', 48)
        cylinder('ready soup', (0, 0, .29), .52, .04, 'carrot', 48)
        torus('finished copper rim', (0, 0, .27), .58, .04, 'copper')
        star('service spark', (.48, -.32, .60), .22, .08, .08, 'gold', 4)
    render('help-' + which, 240, 240)


def effect(which):
    if which == 'sparkle':
        scene_start(camera='front', scale=2.5)
        star('large gold service spark', (0, 0, 0), .76, .15, .11, 'gold', 4)
        star('smaller cream flare', (.70, -.06, .55), .26, .065, .07, 'ivory', 4)
        star('coral confetti', (-.63, -.06, -.43), .19, .055, .06, 'coral', 4)
        star('mint glint', (.63, -.06, -.53), .18, .05, .06, 'mint', 4)
        render('effect-sparkle', 256, 256)
    elif which == 'steam':
        scene_start(camera='front', scale=2.4)
        for dx, top in [(-.40, 1.17), (0, 1.30), (.40, 1.12)]:
            curve('warm voluminous steam', [(dx, 0, -.80), (dx - .16, 0, -.20),
                  (dx + .10, 0, .30), (dx, 0, top)], .071, 'ivory')
            sphere('soft steam crest', (dx, 0, top), .07, 'ivory', scale=(1, .55, 1))
        render('effect-steam', 256, 320)
    elif which == 'bubble':
        scene_start(camera='front', scale=1.8)
        sphere('mint enamel bubble', (0, 0, 0), .58, 'mint', scale=(1, .76, 1))
        torus('bright bubble rim', (0, -.46, 0), .55, .035, 'ivory', 'Y')
        sphere('highlight', (-.20, -.53, .23), .12, 'ivory', scale=(.8, .30, .55))
        render('effect-bubble', 160, 160)
    elif which == 'station-halo':
        scene_start(camera='top', scale=2.78)
        torus('lower cast copper ring', (0, 0, -.09), .91, .062, 'copper')
        torus('bright gold interactive rim', (0, 0, .015), .79, .060, 'gold')
        for angle in (45, 150, 260):
            a = math.radians(angle)
            sphere('ring light catch', (.79 * math.cos(a), .79 * math.sin(a), .075),
                   .068, 'ivory', scale=(1, 1, .42))
        render('effect-station-halo', 320, 220)
    else:
        raise ValueError(which)


def main():
    if os.getenv('UI_SMALL_EXTRAS'):
        icon_tile()
        for name in ('fullscreen-exit', 'sound-off', 'motion-off'):
            tiny_icon(name)
        return
    if os.getenv('UI_EXTRAS'):
        panel('order-card-urgent', 'sage', 4.5, 1.45, (600, 220), False)
        tiny_icon('urgent')
        tiny_icon('camera')
        tiny_icon('qr')
        hero()
        effect('station-halo')
        icon_tile()
        for name in ('fullscreen-exit', 'sound-off', 'motion-off'):
            tiny_icon(name)
        return
    if os.getenv('UI_PREVIEW'):
        panel('panel-cream')
        panel('hud-ribbon', 'sage', 10.5, 1.08, (1400, 180), False)
        button('button-coral', 'coral')
        hero()
        return
    panel('panel-cream')
    panel('panel-sage', 'sage')
    panel('hud-ribbon', 'sage', 10.5, 1.08, (1400, 180), False)
    panel('order-card', 'cream', 4.5, 1.45, (600, 220), False)
    panel('order-card-urgent', 'sage', 4.5, 1.45, (600, 220), False)
    panel('status-badge', 'cream', 4.0, .95, (560, 160), False)
    for color in ('coral', 'sage', 'cream'):
        button('button-' + color, color)
        button('button-' + color + '-pressed', color, pressed=True)
    button('button-disabled', disabled=True)
    avatar_plate(False)
    avatar_plate(True)
    joystick()
    action_disc(False)
    action_disc(True)
    progress('progress-track')
    progress('progress-fill-sage', 'sage')
    progress('progress-fill-coral', 'coral')
    progress('progress-fill-gold', 'gold')
    for name in ('clock', 'score', 'paw', 'fullscreen', 'help', 'leave',
                 'sound', 'motion', 'ready', 'urgent', 'camera', 'qr'):
        tiny_icon(name)
    for name in ('tomato', 'carrot'):
        food_icon(name)
    icon_tile()
    hero()
    trophy_bowl()
    for name in ('pick', 'prep', 'simmer', 'serve'):
        help_icon(name)
    for name in ('sparkle', 'steam', 'bubble', 'station-halo'):
        effect(name)


if __name__ == '__main__':
    main()
