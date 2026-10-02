/* Experimental LAN multiplayer transport only.
 * No signaling server. Manual SDP copy/paste. Host authoritative.
 */
export class LanPeerSession {
  constructor({host=false, onMessage=()=>{}, onState=()=>{}}={}) {
    this.host=host; this.onMessage=onMessage; this.onState=onState;
    this.peers=new Map(); this.pc=null; this.dc=null; this.closed=false;
  }
  static config(){ return {iceServers:[]}; }
  _safeSend(peer,msg){
    const text=JSON.stringify(msg);
    if(text.length>4096) throw new Error('payload too large');
    if(peer.dc?.readyState==='open' && peer.dc.bufferedAmount<65536) peer.dc.send(text);
  }
  createHostOffer(){
    if(!this.host) throw Error('host only');
    this.pc=new RTCPeerConnection(LanPeerSession.config());
    this.dc=this.pc.createDataChannel('kitchen-input');
    this.bind(this.dc);
    return this.gather(this.pc).then(()=>this.pc.localDescription);
  }
  async acceptGuestOffer(offer){
    this.pc=new RTCPeerConnection(LanPeerSession.config());
    this.pc.ondatachannel=e=>{this.dc=e.channel; this.bind(this.dc)};
    await this.pc.setRemoteDescription(offer);
    const answer=await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.gather(this.pc);
    return this.pc.localDescription;
  }
  async acceptGuestAnswer(answer){
    await this.pc.setRemoteDescription(answer);
  }
  gather(pc){
    return new Promise(resolve=>{
      if(pc.iceGatheringState==='complete') return resolve();
      const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve();}};
      pc.addEventListener('icegatheringstatechange',done);
      setTimeout(resolve,10000);
    });
  }
  bind(dc){
    dc.onopen=()=>this.onState('connected');
    dc.onclose=()=>this.onState('closed');
    dc.onmessage=e=>{
      try { const m=JSON.parse(e.data); if(m.input && !Number.isFinite(m.input.x)) return; this.onMessage(m); } catch {}
    };
  }
  sendInput(input){
    if(Math.abs(input.x)>1||Math.abs(input.y)>1) return;
    this._safeSend({input:{x:input.x,y:input.y,a:!!input.a},t:Date.now()});
  }
  close(){this.closed=true;this.dc?.close();this.pc?.close();}
}
