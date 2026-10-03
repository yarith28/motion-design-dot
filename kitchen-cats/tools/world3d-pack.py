"""Pack rendered station and food frames into two atlases and validate crops.

Run after render_world.py with Python 3 + Pillow. Individual station/food
render PNGs are staging intermediates; this script retains them so the pack
can be inspected before deleting unused intermediates from a release.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent/'assets/world-3d'
MANIFEST = json.loads((ROOT/'manifest.json').read_text())
REPORT = {'station': {}, 'food': {}}


def pack(group, metadata, filename, bounds_key):
    width, height = metadata['imageWidth'], metadata['imageHeight']
    cell_width, cell_height = metadata['cellWidth'], metadata['cellHeight']
    atlas = Image.new('RGBA', (width, height), (0,0,0,0))
    for key, box in group.items():
        path = ROOT/(key+'.png' if bounds_key=='station' else 'food-'+key+'.png')
        with Image.open(path) as source:
            image = source.convert('RGBA')
        assert image.size == (cell_width,cell_height), (path,image.size)
        opaque = image.getchannel('A').point(lambda n: 255 if n >= 16 else 0)
        painted = opaque.getbbox()
        assert painted, f'{path} has no visible pixels'
        # Empty margins prevent cross-cell sampling with bilinear canvas draws.
        assert painted[0] > 5 and painted[1] > 5, (path,painted)
        assert painted[2] < cell_width-5 and painted[3] < cell_height-5, (path,painted)
        assert box['w'] == cell_width and box['h'] == cell_height
        atlas.alpha_composite(image,(box['x'],box['y']))
        REPORT[bounds_key][key]={'alphaBounds':list(painted),'bytes':path.stat().st_size}
    atlas.save(ROOT/filename,optimize=True)
    return atlas


def contact(stations, foods):
    # Inspection artifact outside the published app: each row is a real
    # simulation state, so false burnt/spoiled art cannot enter the pack.
    tile_w,tile_h=300,264
    columns=4
    station_keys=list(MANIFEST['stations'])
    rows=(len(station_keys)+columns-1)//columns
    view=Image.new('RGB',(columns*tile_w,(rows+2)*tile_h),(35,61,50))
    draw=ImageDraw.Draw(view)
    try:
        font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',17)
    except OSError:
        font=ImageFont.load_default()
    for index,key in enumerate(station_keys):
        col,row=index%columns,index//columns
        box=MANIFEST['stations'][key]
        src=stations.crop((box['x'],box['y'],box['x']+box['w'],box['y']+box['h']))
        display=src.resize((278,208),Image.Resampling.LANCZOS)
        view.paste(display,(col*tile_w+11,row*tile_h+30),display)
        draw.text((col*tile_w+10,row*tile_h+8),key.replace('station-',''),font=font,fill=(248,232,192))
    for index,key in enumerate(MANIFEST['foods']):
        col,row=index%columns,rows+index//columns
        box=MANIFEST['foods'][key]
        src=foods.crop((box['x'],box['y'],box['x']+box['w'],box['y']+box['h']))
        display=src.resize((208,208),Image.Resampling.LANCZOS)
        view.paste(display,(col*tile_w+46,row*tile_h+30),display)
        draw.text((col*tile_w+10,row*tile_h+8),key,font=font,fill=(248,232,192))
    evidence=Path('/workspace/kitchen-cats-evidence/new-assets')
    evidence.mkdir(parents=True,exist_ok=True)
    view.save(evidence/'world-state-contact.png',optimize=True)


stations=pack(MANIFEST['stations'],MANIFEST['stationAtlas'],'station-atlas.png','station')
foods=pack(MANIFEST['foods'],MANIFEST['foodAtlas'],'food-atlas.png','food')
contact(stations,foods)
(ROOT/'render-metrics.json').write_text(json.dumps(REPORT,indent=2)+'\n')
print(json.dumps({
    'stationAtlasBytes':(ROOT/'station-atlas.png').stat().st_size,
    'foodAtlasBytes':(ROOT/'food-atlas.png').stat().st_size,
    'roomBytes':(ROOT/'room-1000x470@2x.png').stat().st_size,
    'croppedFrames':len(REPORT['station'])+len(REPORT['food']),
},indent=2))
