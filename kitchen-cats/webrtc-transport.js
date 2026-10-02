export class WebRTCTransport {
  constructor(){this.peers=new Map();this.onMessage=()=>{};this.onStatus=()=>{};}
  createPeer(peerId, sessionId){
    if(this.peers.has(peerId)) throw Error("peer exists");
    const pc=new RTCPeerConnection({iceServers:[]});
    const dc=pc.createDataChannel('kitchen');
    const peer={peerId,sessionId,pc,dc,closed:false};
    this.peers.set(peerId,peer); this.bind(peer); return peer;
  }
  bind(peer){peer.dc.onmessage=e=>this.onMessage(peer.peerId,JSON.parse(e.data)); peer.dc.onopen=()=>this.onStatus(peer.peerId,'connected'); peer.dc.onclose=()=>this.closePeer(peer.peerId);}
  send(peerId,msg){const p=this.peers.get(peerId); if(p?.dc?.readyState==='open') p.dc.send(JSON.stringify(msg));}
  closePeer(peerId){const p=this.peers.get(peerId); if(!p)return; p.dc.close?.();p.pc.close?.();this.peers.delete(peerId);this.onStatus(peerId,'closed');}
  async waitForIce(peer, timeoutMs=10000){
    const pc=peer.pc;
    if(pc.iceGatheringState==='complete') return;
    await new Promise((resolve,reject)=>{
      let done=false;
      const finish=(err)=>{ if(done)return; done=true; pc.removeEventListener('icegatheringstatechange',check); clearTimeout(timer); err?reject(err):resolve(); };
      const check=()=>{ if(pc.iceGatheringState==='complete') finish(); };
      const timer=setTimeout(()=>finish(new Error('ICE gathering timeout')), timeoutMs);
      pc.addEventListener('icegatheringstatechange',check);
    });
  }
  assertGathered(peer){
    const s=peer.pc.localDescription;
    if(!s || !s.sdp || !s.sdp.includes('a=candidate:')) throw new Error('No ICE candidates gathered. Check network or browser WebRTC support.');
    return s;
  }
  async createOffer(peerId, sessionId){
    const peer=this.createPeer(peerId, sessionId);
    const offer=await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    await this.waitForIce(peer);
    return JSON.stringify({sessionId,peerId,description:this.assertGathered(peer)});
  }
  async acceptOffer(text){
    const data=JSON.parse(text);
    const peer=this.createPeer(data.peerId, data.sessionId);
    await peer.pc.setRemoteDescription(data.description);
    const answer=await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);
    await this.waitForIce(peer);
    return JSON.stringify({sessionId:data.sessionId,peerId:data.peerId,description:this.assertGathered(peer)});
  }
  async acceptAnswer(text){
    const data=JSON.parse(text);
    const peer=this.peers.get(data.peerId);
    if(!peer || peer.sessionId!==data.sessionId) throw Error('stale answer');
    await peer.pc.setRemoteDescription(data.description);
  }
  close(){for(const id of [...this.peers.keys()])this.closePeer(id);}
}
