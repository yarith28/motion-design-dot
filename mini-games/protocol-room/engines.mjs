import{pages,cuckoo,ring,persistent}from'./storage.mjs';
import{banker,versions,tokenRing,termination}from'./systems.mjs';
import{consensus,routing,leases}from'./network.mjs';
import{durable,pipeline}from'./execution.mjs';
import{deltas,watermarks}from'./streams.mjs';
import{cursors,echoes}from'./collaboration.mjs';
import{cancellation,brackets,pivots}from'./numerics.mjs';
export const engines={
 'page-orchard':pages,'paired-harbor':cuckoo,'ring-transfer':ring,'branch-archive':persistent,
 'safe-advance':banker,'version-valley':versions,'lantern-ring':tokenRing,'quiet-network':termination,
 'term-tower':consensus,'changing-roads':routing,'lease-lighthouse':leases,
 'durable-ink':durable,'pipeline-parade':pipeline,'delta-garden':deltas,'timestamp-current':watermarks,
 'shared-cursors':cursors,'echo-seals':echoes,'cancellation-desk':cancellation,'bracket-ferry':brackets,'pivot-gallery':pivots
};
