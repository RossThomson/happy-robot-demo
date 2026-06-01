import {
  computeBrokerCounterRate,
  computeCeilingRate,
  computeFloorRate,
  shouldAcceptCarrierOffer,
} from "@/lib/negotiation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const listRate = 950;
const floor = computeFloorRate(listRate);
const ceiling = computeCeilingRate(listRate);

const round1 = computeBrokerCounterRate(1080, listRate, floor, ceiling, null);
assert(round1 === 1015, `round 1 expected 1015, got ${round1}`);

const round2 = computeBrokerCounterRate(1020, listRate, floor, ceiling, round1);
assert(
  round2 >= round1,
  `round 2 counter ${round2} must not be below prior counter ${round1}`,
);
assert(round2 === 1017.5, `round 2 expected 1017.5, got ${round2}`);

assert(
  shouldAcceptCarrierOffer(1015, listRate, round1),
  "carrier at last counter should accept",
);

console.log("negotiation tests passed");
