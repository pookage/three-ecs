import { EventDispatcher } from "three";

/*
	NOTE:
		I had to adapt this, as it looks like editing the 'target' of an event is no-longer allowed,
		and the default one was throwing errors
*/
export default class EntityEventDispatcher extends EventDispatcher {
	dispatchEvent(t){
		if (void 0 === this._listeners) return;
		const e = this._listeners[t.type];
		if (void 0 !== e) {
			t.targetEntity = this;
			const n = e.slice(0);
			for (let e = 0, i = n.length; e < i; e++) n[e].call(this, t);
			t.targetEntity = null
		}
	}// dispatchEvent
}// EntityEventDispatcher
