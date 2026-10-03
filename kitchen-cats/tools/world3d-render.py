"""Procedural 3D Kitchen Cats world/prop renderer (Blender 4.3).

Run from the kitchen-cats directory:
  blender -b --factory-startup --python tools/world3d-render.py

The PNGs are delivered at 2x so that canvas can scale them down cleanly.
All props share a fixed orthographic camera, frame, and foot anchor.
"""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent.parent/'assets/world-3d'

def rgba(hex_color, alpha=1):
    channels = [int(hex_color[i:i+2], 16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v < .04045 else ((v+.055)/1.055)**2.4 for v in channels) + (alpha,)


COL = {k: rgba(v) for k,v in {
    'porcelain':'#EADABC', 'porcelain_light':'#F6EBCF',
    'sage':'#30594D', 'sage_light':'#648A6E', 'mint':'#A6C8A6',
    'wood':'#87522E', 'wood_light':'#B77844',
    'copper':'#9E4F2E', 'copper_light':'#CE7844', 'coral':'#D7664C',
    'tomato':'#A9332B', 'tomato_light':'#DB553B',
    'carrot':'#D96A1B', 'carrot_light':'#ED9631', 'broth':'#D89B38',
    'steel':'#688783', 'steel_light':'#BDCDC6', 'dark':'#213C33',
    'floor_a':'#D9DFCA', 'floor_b':'#C7D2B7', 'floor_edge':'#345D4A',
}.items()}
COL['shadow'] = rgba('#1A2B23', .34)


def mat(name, color, rough=0.35, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = color
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["Alpha"].default_value = color[3]
    if color[3] < 1:
        m.surface_render_method = 'BLENDED'
    return m


M = {k: mat(k, c, .32 if k in ("porcelain", "porcelain_light", "sage", "sage_light") else .46,
            .25 if k in ("steel", "steel_light", "copper", "copper_light") else 0)
     for k, c in COL.items()}


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def material(o, name):
    o.data.materials.append(M[name])
    return o


def cube(name, loc, dim, color, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = dim
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    material(o, color)
    if bevel:
        mod = o.modifiers.new('soft bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        o.modifiers.new('weighted surface normals', 'WEIGHTED_NORMAL')
    return o


def sphere(name, loc, scale, color, segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=12, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    material(o, color)
    bpy.ops.object.shade_smooth()
    return o


def cyl(name, loc, radius, depth, color, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    material(o, color)
    bevel = o.modifiers.new('rounded lip', 'BEVEL')
    bevel.width = min(.035, depth/4)
    bevel.segments = 3
    o.modifiers.new('weighted surface normals', 'WEIGHTED_NORMAL')
    return o


def torus(name, loc, major, minor, color):
    bpy.ops.mesh.primitive_torus_add(major_segments=40, minor_segments=8,
                                 location=loc, major_radius=major, minor_radius=minor)
    o = bpy.context.object
    o.name = name
    material(o, color)
    bpy.ops.object.shade_smooth()
    return o


def cone(name, loc, radius1, radius2, depth, color, vertices=20):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2,
                                depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    material(o, color)
    bevel = o.modifiers.new('soft rim', 'BEVEL')
    bevel.width = .018
    bevel.segments = 2
    o.modifiers.new('weighted surface normals', 'WEIGHTED_NORMAL')
    return o


def setup_camera(res_x, res_y, ortho_scale, target=(0,0,.3), camera=(0,-6,7), transparent=True):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 8
    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = transparent
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = transparent
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    world = bpy.data.worlds.new('soft mint ambient') if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.40,.50,.42,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
    bpy.ops.object.camera_add(location=camera)
    cam = bpy.context.object
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z','Y').to_euler()
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = ortho_scale
    scene.camera = cam
    for name, loc, energy, color, size in [
        ('warm key',(-3,-4,8),520,(1.0,.79,.59),3.4),
        ('cool fill',(4,2,6),220,(.65,.84,.74),5),
        ('top rim',(0,4,9),180,(1.0,.97,.85),4),
    ]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        lamp = bpy.context.object
        lamp.name = name
        lamp.data.energy = energy
        lamp.data.color = color
        lamp.data.shape = 'DISK'
        lamp.data.size = size
        lamp.rotation_euler = (Vector(target)-lamp.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(OUT/'test.png')
    return scene


def render(name):
    bpy.context.scene.render.filepath = str(OUT/name)
    bpy.ops.render.render(write_still=True)
    print('WROTE', name, flush=True)


def base_tile(color='porcelain_light'):
    # Centered 3D enamel station socket; the common foot is the bottom center.
    cube('soft cast shadow',(0,.03,-.05),(2.7,1.62,.05),'shadow',.12)
    cube('dark inset',(0,0,.11),(2.58,1.50,.24),'sage',.16)
    cube('copper band',(0,0,.24),(2.56,1.49,.09),'copper',.15)
    cube('glazed inset',(0,0,.34),(2.44,1.36,.18),color,.15)
    cube('back highlight',(0,.53,.445),(2.06,.04,.015),'porcelain',.012)


def tomato(loc=(0,0,.7), size=1):
    x,y,z = loc
    sphere('ripe tomato',loc,(.27*size,.25*size,.24*size),'tomato')
    sphere('tomato glowing shoulder',(x-.055*size,y-.06*size,z+.07*size),(.17*size,.13*size,.13*size),'tomato_light')
    cyl('stem',(x,y,z+.25*size),.026*size,.20*size,'wood')
    for a in range(5):
        angle = a * 2*math.pi/5
        leaf = sphere('tomato leaf',(x+.09*size*math.cos(angle),y+.09*size*math.sin(angle),z+.22*size),
                      (.11*size,.04*size,.025*size),'sage_light',16)
        leaf.rotation_euler[2] = angle


def carrot(loc=(0,0,.72), size=1, tilt=0):
    x,y,z = loc
    body = cone('carrot root',(x,y,z),.18*size,.045*size,.56*size,'carrot')
    body.rotation_euler[1] = 1.00+tilt
    sphere('carrot orange highlight',(x-.07*size,y-.03*size,z+.09*size),(.10*size,.11*size,.10*size),'carrot_light')
    for a in [-.65,0,.65]:
        leaf = cone('leaf',(x-.17*size,y+.035*size+a*.13*size,z+.28*size),.055*size,.008*size,.30*size,'sage_light')
        leaf.rotation_euler[1] = -.4


def prep_board(working=False, ready=False):
    base_tile()
    cube('oak chopping board',(0,.01,.55),(1.57,.91,.19),'wood_light',.09)
    cube('board raised edge',(0,-.39,.66),(1.46,.055,.025),'wood',.015)
    for x in [-.36,.04,.42]:
        cube('oak grain',(x,.12,.661),(.014,.55,.006),'wood',.005)
    # Knife angle changes as the actual prep job enters working state.
    knife = cube('brushed steel blade',(.55,-.10,.80),(.13,.78,.065),'steel_light',.02)
    knife.rotation_euler[2] = -.45 if working else -.2
    handle = cube('sage knife handle',(.83,-.34,.80),(.18,.36,.12),'sage',.045)
    handle.rotation_euler[2] = -.45 if working else -.2
    if working:
        for i in range(3):
            sphere('chop motion bead',(-.44+i*.13,-.15,.72),(.045,.045,.04),'coral',16)
    if ready:
        torus('ready copper ring',(0,0,.71),.64,.024,'copper_light')
        for x in [-.65,.65]:
            sphere('ready gleam',(x,.32,.78),(.065,.065,.07),'porcelain_light',16)


def pot(working=False, ready=False, kind='carrot'):
    base_tile('sage')
    # Stove burner and stout earthenware pot, held in the same frame for all states.
    cyl('burner',(0,0,.51),.70,.12,'dark')
    torus('copper burner ring',(0,0,.59),.58,.045,'copper_light')
    cyl('pot body',(0,0,.84),.66,.50,'sage')
    cyl('inner soup surface',(0,0,1.105),.57,.026,
        ('tomato_light' if kind == 'tomato' else 'broth') if working or ready else 'dark')
    torus('brushed steel pot rim',(0,0,1.11),.63,.065,'steel_light')
    for x in [-.77,.77]:
        cube('pot handle',(x,0,.96),(.32,.19,.10),'copper',.055)
    if working or ready:
        for x,y,s in [(-.25,.07,.085),(.21,-.09,.095),(.03,.18,.05)]:
            torus('soup bubble',(x,y,1.14),s,.012,'porcelain_light')
        if working:
            for x in [-.23,.2]:
                sphere('steam lower puff',(x,.12,1.40),(.06,.05,.13),'porcelain_light',16)
                sphere('steam upper puff',(x+.04,.16,1.61),(.05,.04,.09),'porcelain_light',16)
    if ready:
        # Large green lamp and brass halo read as READY at phone scale.
        cyl('ready lamp pedestal',(0,-.12,1.36),.13,.25,'copper_light')
        sphere('ready emerald light',(0,-.12,1.55),(.16,.16,.16),'mint',16)
        torus('ready halo',(0,-.12,1.55),.22,.025,'copper_light')
        for a in range(4):
            ang=a*math.pi/2
            sphere('ready satellite',(.31*math.cos(ang),-.12+.31*math.sin(ang),1.55),
                   (.045,.045,.045),'porcelain_light',12)


def crate(kind):
    base_tile()
    cube('produce crate',(0,0,.69),(1.64,1.00,.41),'wood',.09)
    cube('crate inner shadow',(0,0,.92),(1.43,.79,.035),'dark',.04)
    for y in [-.5,.5]:
        cube('oak slat',(0,y,.79),(1.70,.10,.32),'wood_light',.03)
    for x in [-.73,.73]:
        cube('corner bracket',(x,0,.82),(.09,1.03,.40),'copper',.02)
    coords=[(-.38,-.17,.97),(.35,-.13,.98),(-.18,.20,1.03),(.25,.23,1.04)]
    for i,p in enumerate(coords):
        (tomato if kind=='tomato' else carrot)(p,.84 if i < 2 else .73, i*.18) if kind=='carrot' else tomato(p,.84 if i < 2 else .73)


def pass_counter():
    base_tile('wood_light')
    cube('raised transfer ledge',(0,0,.59),(1.85,.93,.19),'wood',.07)
    cube('marble pass shelf',(0,0,.72),(1.75,.84,.17),'porcelain_light',.075)
    for x in [-.74,.74]:
        torus('copper side bowl',(x,.01,.83),.08,.018,'copper_light')


def service():
    base_tile('wood_light')
    cube('service shelf',(0,0,.64),(1.77,.96,.20),'wood',.08)
    cube('porcelain service tray',(0,0,.77),(1.6,.82,.14),'porcelain_light',.08)
    torus('service dish rim',(0,-.06,.88),.43,.055,'copper_light')
    cyl('service plate',(0,-.06,.86),.40,.06,'porcelain')
    sphere('order bell',(0,.31,1.03),(.14,.14,.11),'copper_light')
    cyl('bell base',(0,.31,.91),.17,.035,'copper')


def bin_prop():
    base_tile('sage_light')
    cyl('waste bin',(0,0,.78),.50,.58,'sage')
    cyl('bin dark mouth',(0,0,1.08),.47,.025,'dark')
    torus('copper bin rim',(0,0,1.09),.47,.05,'copper')
    cube('front petal motif',(0,-.50,.74),(.27,.03,.20),'mint',.05)


def food_base():
    cyl('small white dish',(0,0,.19),.76,.09,'porcelain_light')
    torus('dish copper trim',(0,0,.25),.69,.035,'copper_light')


def chopped(kind):
    food_base()
    for i in range(8):
        ang=i*2*math.pi/8
        radius=.27 + (.05 if i%2 else 0)
        x,y=radius*math.cos(ang),radius*math.sin(ang)
        p=cube('chopped piece',(x,y,.32),(.18,.15,.15),'tomato_light' if kind=='tomato' else 'carrot_light',.025)
        p.rotation_euler[2]=ang
    for x,y in [(-.08,-.05),(.06,.09)]:
        sphere('fresh herb',(x,y,.43),(.075,.045,.018),'sage_light',16)


def soup(kind):
    cyl('ceramic bowl',(0,0,.34),.72,.38,'porcelain_light')
    cyl('soup face',(0,0,.545),.63,.022,'tomato' if kind=='tomato' else 'broth')
    torus('ceramic rim',(0,0,.54),.69,.055,'porcelain')
    for x,y in [(-.17,.08),(.13,-.13),(.04,.18)]:
        sphere('bright garnish',(x,y,.59),(.07,.035,.028),'sage_light',16)
    sphere('cream swirl',(0,-.07,.565),(.16,.055,.008),'porcelain_light',16)


def local_marker():
    # This physically sits below the player feet; it never conveys a remote
    # player state, so the local-player identity remains unmistakable.
    cyl('soft marker shadow',(0,0,.008),.92,.015,'shadow')
    cyl('sage enamel floor medallion',(0,0,.044),.78,.060,'sage')
    torus('raised copper marker rim',(0,0,.083),.76,.063,'copper_light')
    torus('inner cream accent',(0,0,.088),.55,.023,'porcelain_light')
    sphere('paw palm',(0,-.10,.105),(.22,.18,.030),'porcelain_light',16)
    for x,y in [(-.30,.20),(-.10,.28),(.12,.28),(.32,.20)]:
        sphere('paw toe',(x,y,.105),(.079,.077,.027),'porcelain_light',16)


def render_prop(name, fn):
    clear()
    setup_camera(384,288,3.70,target=(0,0,.65),camera=(0,-6,7))
    fn()
    render(name)


def render_food(name, fn):
    clear()
    setup_camera(256,256,2.45,target=(0,0,.33),camera=(0,-6,7))
    fn()
    render(name)


def render_marker():
    clear()
    setup_camera(256,128,3.20,target=(0,0,.04),camera=(0,-6,7))
    local_marker()
    render('local-marker.png')


def room():
    clear()
    setup_camera(2000,940,10.0,target=(0,0,0),camera=(0,-10,12),transparent=False)
    # Natural material, real depth: each floor tile has a tiny lip and the
    # counters cast visible shadows on the walkable plane.
    cube('room foundation',(0,0,-.34),(10.18,7.10,.35),'floor_edge',.18)
    cube('grout',(0,0,-.15),(9.94,6.96,.04),'porcelain',.02)
    for ix in range(25):
        x=(ix-12)*.396
        for iy in range(17):
            y=(iy-8)*.406
            cube('glazed floor tile',(x,y,-.11),(.388,.398,.035),
                 'floor_a' if (ix+iy)%2==0 else 'floor_b',.007)
    # Framing walls and sage plinth make the central 800px playable room clear.
    cube('back low wall',(0,2.35,.26),(9.86,.20,.82),'sage',.08)
    cube('back moulding',(0,2.20,.65),(9.84,.16,.10),'copper',.03)
    for x in [-4.95,4.95]:
        cube('side kickrail',(x,0,.10),(.16,6.40,.43),'sage',.05)
    # Pantry shelves live in the 100px scenic bands, outside the collision map.
    for sx in [-4.50,4.50]:
        cube('honey side shelf',(sx,-.55,.38),(.63,1.18,.14),'wood_light',.05)
        cube('shelf sage legs',(sx,-.55,.10),(.53,1.06,.36),'sage',.045)
        for y in [-.82,-.28]:
            cyl('stoneware spice jar',(sx,y,.61),.17,.36,'porcelain')
            cyl('copper spice lid',(sx,y,.81),.18,.055,'copper')
        cyl('herb planter',(sx,-.54,.88),.21,.21,'copper')
        for dx,dy in [(-.12,0),(.10,-.07),(.02,.11)]:
            sphere('herb sprig',(sx+dx,-.54+dy,1.07),(.12,.08,.16),'sage_light',16)
    # Main rear cookline, bottom delivery line, and central transfer island.
    for label,y,w,d in [('rear',1.12,8.00,1.20),('front',-2.68,8.00,.88),('island',-1.45,2.08,.98)]:
        cube(f'{label} counter shadow',(0,y,-.02),(w+.08,d+.08,.07),'shadow',.09)
        cube(f'{label} oak carcass',(0,y,.28),(w,d,.58),'wood',.10)
        cube(f'{label} copper rim',(0,y,.60),(w+.04,d+.04,.10),'copper',.075)
        cube(f'{label} cream stone top',(0,y,.69),(w+.08,d+.08,.12),'porcelain_light',.09)
        cube(f'{label} sage front',(0,y-d/2-.006,.26),(w-.18,.045,.36),'sage',.016)
        cube(f'{label} dark plinth',(0,y-d/2-.047,-.01),(w-.16,.075,.09),'dark',.02)
        for x in [-(w/2-.18),w/2-.18]:
            cube(f'{label} edge bracket',(x,y-d/2-.03,.27),(.08,.06,.44),'copper_light',.018)
        drawer_x = [-3.0,-1.2,.6,2.9] if label == 'rear' else ([-2.9,2.9] if label == 'front' else [0])
        for x in drawer_x:
            cube(f'{label} panel inset',(x,y-d/2-.048,.27),(.83,.018,.30),'sage_light',.026)
            cube(f'{label} drawer pull',(x,y-d/2-.069,.27),(.36,.044,.055),'copper_light',.020)
            for ex in [-.28,.28]:
                cyl(f'{label} handle rivet',(x+ex,y-d/2-.085,.27),.035,.035,'copper')
    # Directional pools of light under upper stations and hanging enamel lamps.
    for x in [-3.0,-1.2,.6,2.9]:
        cyl('counter inset pad',(x,.55,.77),.51,.035,'porcelain')
        torus('copper socket ring',(x,.55,.80),.48,.020,'copper_light')
    for x in [-3.0,2.9]:
        cyl('lower inset pad',(x,-2.68,.77),.50,.035,'porcelain')
        torus('lower copper socket',(x,-2.68,.80),.47,.020,'copper_light')
    cyl('island inset pad',(0,-1.45,.78),.55,.035,'porcelain')
    torus('island copper socket',(0,-1.45,.81),.51,.020,'copper_light')
    render('room-1000x470@2x.png')


if __name__ == '__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    if '--room' in sys.argv:
        room()
        raise SystemExit(0)
    if '--marker' in sys.argv:
        render_marker()
        raise SystemExit(0)
    if '--preview' in sys.argv:
        render_prop('station-pot-working.png', lambda: pot(working=True))
        room()
        raise SystemExit(0)
    room()
    for name,fn in [
        ('station-tomato.png', lambda: crate('tomato')),
        ('station-carrot.png', lambda: crate('carrot')),
        ('station-prep-idle.png', lambda: prep_board()),
        ('station-prep-working.png', lambda: prep_board(working=True)),
        ('station-prep-ready.png', lambda: prep_board(ready=True)),
        ('station-pot-idle.png', lambda: pot()),
        ('station-pot-working-tomato.png', lambda: pot(working=True,kind='tomato')),
        ('station-pot-working-carrot.png', lambda: pot(working=True,kind='carrot')),
        ('station-pot-ready-tomato.png', lambda: pot(ready=True,kind='tomato')),
        ('station-pot-ready-carrot.png', lambda: pot(ready=True,kind='carrot')),
        ('station-pass.png', pass_counter),
        ('station-serve.png', service),
        ('station-bin.png', bin_prop),
    ]:
        render_prop(name,fn)
    for name,fn in [
        ('food-tomato.png',lambda: tomato((0,0,.31),1.6)),
        ('food-carrot.png',lambda: carrot((0,0,.42),1.5)),
        ('food-chopped-tomato.png',lambda: chopped('tomato')),
        ('food-chopped-carrot.png',lambda: chopped('carrot')),
        ('food-soup-tomato.png',lambda: soup('tomato')),
        ('food-soup-carrot.png',lambda: soup('carrot')),
    ]:
        render_food(name,fn)
    render_marker()
