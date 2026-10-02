import { KitchenGame } from './game-core.js';

export class MultiplayerSession {
  constructor({transport, host=false, now=()=>Date.now()}={}) {
    this.transport=transport; this.isHost=host; this.now=now;
    this.sessionId=null; this.game=null; this.playerId=null; this.mode='guest';
    this.peers=new Map(); this.pending=new Map(); this.statusCb=()=>{}; this.snapshotCb=()=>{};
    this.lastTick=0; this.running=false; this.rate=new Map();
  }
  onStatus(cb){this.statusCb=cb}
  onSnapshot(cb){this.snapshotCb=cb}
  status(s){this.statusCb(s)}
  startHost(sessionId='host-'+Math.random().toString(36).slice(2)) {
    this.sessionId=sessionId; this.game=new KitchenGame(this.now); this.game.reset();
    this.playerId='host'; this.mode='host'; this.game.addPlayer('host','Host',0); this.running=true; this.status('hosting');
  }
  attachPeer(id,channel){
    if(!this.isHost || this.peers.size>=3 || this.peers.has(id)) return false;
    if(!/^p[0-9]+$/.test(id) && id!=='host') return false;
    this.peers.set(id,channel); this.game.addPlayer(id,'Guest',0); channel.send?.(JSON.stringify({type:'identity',playerId:id,sessionId:this.sessionId}));
    channel.onmessage=(e)=>this.receive(id,e.data);
    channel.onclose=()=>this.disconnect(id);
    return true;
  }
  receive(id,msg){
    if(typeof msg==='string') { try { msg=JSON.parse(msg); } catch { return; } }
    if(!msg || typeof msg !== 'object') return;
    if(!this.isHost && msg.type==='identity') { this.playerId=msg.playerId; this.sessionId=msg.sessionId; this.mode='guest'; return; }
    if(!this.isHost) {
      if(msg.type==='snapshot') this.snapshotCb(msg.snapshot);
      return;
    }
    const peer=this.peers.get(id);
    if(!peer || msg.sessionId!==this.sessionId || msg.playerId!==id) return;
    if(typeof msg.type !== 'string' || JSON.stringify(msg).length>2048) return;
    const now=this.now(); const r=this.rate.get(id)||{t:now,n:0};
    if(now-r.t>1000){r.t=now;r.n=0} if(++r.n>30)return; this.rate.set(id,r);
    if(msg.type==='input') {
      if(!Number.isFinite(msg.x)||!Number.isFinite(msg.y)||Math.abs(msg.x)>1||Math.abs(msg.y)>1) return;
      this.game.move(id,msg.x,msg.y);
    }
    if(msg.type==='interact' && typeof msg.station==='string' && msg.station.length<32) {
      this.game.interact(id,msg.station);
    }
  }
  tick(){if(!this.isHost||!this.running)return;this.game.tick(.05);const snap=this.game.snapshot();this.snapshotCb(snap);for(const [id,c] of this.peers){if(c.readyState=== 'open')c.send(JSON.stringify({type:'snapshot',snapshot:snap}))}}
  sendInput(x,y){if(this.isHost)return;this.transport?.send({type:'input',sessionId:this.sessionId,playerId:this.playerId,x,y})}
  sendInteract(station){if(this.isHost)return;this.transport?.send({type:'interact',sessionId:this.sessionId,playerId:this.playerId,station})}
  consumeSnapshot(s){this.snapshotCb(s)}
  start(){if(this.isHost){this.game.state.phase='playing';this.running=true}}
  replay(){if(this.isHost){this.game.replay()}}
  disconnect(id){this.peers.delete(id);this.game?.removePlayer(id);this.status({peer:id,state:'peer-left'})}
  stop(reason='closed'){this.running=false;this.status(reason);for(const c of this.peers.values())c.close?.();this.peers.clear()}
  hidden(){this.stop('host-paused')}
}
