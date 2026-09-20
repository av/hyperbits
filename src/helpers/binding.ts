import type gsap from "gsap";

export type GsapProxyBinding<Proxy> = {
  proxy: Proxy;
  apply: () => void;
};

export type TimeStateBinding<State> = {
  stateAt: (time: number) => State;
};

export type TimelineBind = (timeline: gsap.core.Timeline) => () => void;

export function chainTimelineUpdate(
  timeline: gsap.core.Timeline,
  update: () => void,
): () => void {
  const previous = timeline.eventCallback("onUpdate");
  const onUpdate = () => {
    if (typeof previous === "function") previous.call(timeline);
    update();
  };
  timeline.eventCallback("onUpdate", onUpdate);
  update();
  return () => {
    timeline.eventCallback("onUpdate", previous);
  };
}
