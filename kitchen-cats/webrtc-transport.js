// Manual signaling, host ICE candidates only: no servers or media permissions.
export class WebRTCTransport {
  constructor() {
    this.peers = new Map();
    this.onMessage = () => {};
    this.onStatus = () => {};
  }
  createPeer(peerId, sessionId, initiator = false) {
    if (typeof RTCPeerConnection !== "function")
      throw Error("WebRTC is unavailable in this browser.");
    if (
      typeof peerId !== "string" ||
      peerId.length === 0 ||
      peerId.length > 80 ||
      typeof sessionId !== "string" ||
      sessionId.length === 0 ||
      sessionId.length > 80
    )
      throw Error("Invalid pairing identity. Create a fresh offer.");
    if (this.peers.has(peerId))
      throw Error("This pairing is already in use. Create a new offer.");
    const pc = new RTCPeerConnection({ iceServers: [] });
    const peer = {
      peerId,
      sessionId,
      pc,
      dc: null,
      cancelIce: null,
      disconnectTimer: null,
    };
    this.peers.set(peerId, peer);
    pc.ondatachannel = (e) => {
      if (peer.dc) {
        e.channel.close();
        return;
      }
      this.bind(peer, e.channel);
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) {
        this.closePeer(peerId);
      } else if (pc.connectionState === "disconnected") {
        clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = setTimeout(() => {
          if (pc.connectionState === "disconnected") this.closePeer(peerId);
        }, 5000);
      } else {
        clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = null;
      }
    };
    peer.timer = setTimeout(() => {
      if (peer.dc?.readyState !== "open") this.closePeer(peerId);
    }, 120000);
    if (initiator) this.bind(peer, pc.createDataChannel("kitchen"));
    return peer;
  }
  bind(peer, dc) {
    if (peer.dc || !dc) {
      dc?.close();
      return;
    }
    peer.dc = dc;
    dc.onmessage = (e) => {
      if (typeof e.data !== "string" || e.data.length > 65536) return;
      try {
        this.onMessage(peer.peerId, JSON.parse(e.data));
      } catch {}
    };
    dc.onopen = () => {
      clearTimeout(peer.timer);
      this.onStatus(peer.peerId, "connected");
    };
    dc.onclose = () => this.closePeer(peer.peerId);
    dc.onerror = () => this.closePeer(peer.peerId);
  }
  send(peerId, msg) {
    const dc = this.peers.get(peerId)?.dc;
    if (dc?.readyState !== "open") return false;
    if (dc.bufferedAmount > 262144) {
      this.closePeer(peerId);
      return false;
    }
    try {
      const payload = JSON.stringify(msg);
      if (payload.length > 65536) return false;
      dc.send(payload);
      return true;
    } catch {
      this.closePeer(peerId);
      return false;
    }
  }
  closePeer(peerId) {
    const p = this.peers.get(peerId);
    if (!p) return;
    this.peers.delete(peerId);
    clearTimeout(p.timer);
    clearTimeout(p.disconnectTimer);
    p.cancelIce?.();
    if (p.dc) {
      p.dc.onclose = null;
      p.dc.onerror = null;
      p.dc.close();
    }
    p.pc.onconnectionstatechange = null;
    p.pc.close();
    this.onStatus(peerId, "closed");
  }
  close() {
    for (const id of [...this.peers.keys()]) this.closePeer(id);
  }
  async waitForIce(peer) {
    const pc = peer.pc;
    if (pc.iceGatheringState === "complete") return;
    await new Promise((resolve, reject) => {
      let timer;
      const finish = (err) => {
        pc.removeEventListener("icegatheringstatechange", check);
        clearTimeout(timer);
        peer.cancelIce = null;
        err ? reject(err) : resolve();
      };
      const check = () => {
        if (pc.iceGatheringState === "complete") finish();
      };
      peer.cancelIce = () => finish(Error("Pairing cancelled"));
      timer = setTimeout(
        () =>
          finish(
            Error("ICE gathering timed out. Try again on the same Wi-Fi."),
          ),
        10000,
      );
      pc.addEventListener("icegatheringstatechange", check);
      check();
    });
  }
  description(peer) {
    if (!this.peers.has(peer.peerId)) throw Error("Pairing cancelled");
    const d = peer.pc.localDescription;
    if (!d?.sdp?.includes("a=candidate:"))
      throw Error(
        "No ICE candidates gathered. This browser/network cannot pair locally.",
      );
    return { type: d.type, sdp: d.sdp };
  }
  parse(text, type) {
    if (typeof text !== "string" || text.length > 65536)
      throw Error("Invalid pairing text");
    let d;
    try {
      d = JSON.parse(text);
    } catch {
      throw Error("Invalid pairing JSON");
    }
    if (
      d?.version !== 1 ||
      typeof d.peerId !== "string" ||
      typeof d.sessionId !== "string" ||
      d.peerId.length === 0 ||
      d.sessionId.length === 0 ||
      d.peerId.length > 80 ||
      d.sessionId.length > 80 ||
      d.description?.type !== type ||
      typeof d.description.sdp !== "string" ||
      d.description.sdp.length > 65536 ||
      !d.description.sdp.includes("a=candidate:")
    )
      throw Error("Paste a current " + type + " from Kitchen Cats");
    return d;
  }
  async createOffer(peerId, sessionId) {
    const peer = this.createPeer(peerId, sessionId, true);
    try {
      await peer.pc.setLocalDescription(await peer.pc.createOffer());
      await this.waitForIce(peer);
      return JSON.stringify({
        version: 1,
        peerId,
        sessionId,
        description: this.description(peer),
      });
    } catch (e) {
      this.closePeer(peerId);
      throw e;
    }
  }
  async acceptOffer(text) {
    const data = this.parse(text, "offer"),
      peer = this.createPeer(data.peerId, data.sessionId);
    try {
      await peer.pc.setRemoteDescription(data.description);
      await peer.pc.setLocalDescription(await peer.pc.createAnswer());
      await this.waitForIce(peer);
      return JSON.stringify({ ...data, description: this.description(peer) });
    } catch (e) {
      this.closePeer(peer.peerId);
      throw e;
    }
  }
  async acceptAnswer(text) {
    const data = this.parse(text, "answer"),
      peer = this.peers.get(data.peerId);
    if (!peer || peer.sessionId !== data.sessionId)
      throw Error("Stale answer. Create a new offer.");
    try {
      await peer.pc.setRemoteDescription(data.description);
    } catch (e) {
      this.closePeer(peer.peerId);
      throw e;
    }
  }
}
