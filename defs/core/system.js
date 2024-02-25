import { COMPONENT_CONNECTED, COMPONENT_DISCONNECTED } from "./component/index.js";

export default class System {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#entity;

	// static state
	#registeredComponents = new Set();


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get autoregister(){ return []; }// get autoregister

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get registeredComponents(){ return this.#registeredComponents; }
	get entity()              { return this.#entity;               }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	constructor(entity){
		this.#entity = entity;

		console.warn("[TODO] Confirm that adding this event listener in the constructor is okay and it doesn't need to go in connected()");
		entity.addEventListener(COMPONENT_CONNECTED, this.#autoRegisterComponent);
		entity.addEventListener(COMPONENT_DISCONNECTED, this.#autoUnregisterComponent);
	}// constructor

	connected(){ } // connected
	disconnected(){
		entity.removeEventListener(COMPONENT_CONNECTED, this.#autoRegisterComponent);
		entity.removeEventListener(COMPONENT_DISCONNECTED, this.#autoUnregisterComponent);
	} // disconnected

	play(){ } // play
	pause(){ } // pause

	tick(time, deltaTime){ }// tick
	tock(time, deltaTime){ }// tock

	// ~~ utils ~~
	update(){ } // update
	
	register(component){
		this.#register(component);
	}// register
	unregister(component){
		this.#unregister(component);
	}// unregister


	// UTILS
	// -------------------------------------
	#register = component => {
		const hasRegisteredComponent = this.#registeredComponents.has(component);

		if(!hasRegisteredComponent) this.#registeredComponents.add(component);
		else {
			console.warn(
				`[WARNING](${this.constructor.name}) Cannot register component`,
				component,
				"as it has already been registered"
			);
		}
		
	}// #register
	#unregister = component => {
		const hasRegisteredComponent = this.#registeredComponents.has(component);

		if(hasRegisteredComponent) this.#registeredComponents.delete(component);
		else {
			console.warn(
				`[WARNING](${this.constructor.name}) Cannot un-register component`,
				component,
				"as it has already been un-registered"
			);
		}
	}// unregister



	// EVENT HANDLERS
	// -------------------------------------
	#autoRegisterComponent = event => {
		const { component } = event.detail;
		const shouldAutoRegisterComponent = this.constructor.autoregister.contains(component.constructor.name);
		
		if(shouldAutoRegisterComponent){
			event.stopPropagation(); // this would enforce that components can only be registered to one system; is that what we want?
			this.#register(component);
		}
	}// #autoRegisterComponent

	#autoUnregisterComponent = event => {
		const { component } = event.detail;
		const shouldAutoRegisterComponent = this.constructor.autoregister.contains(component.constructor.name);

		if(shouldAutoRegisterComponent){
			event.stopPropagation(); // this would enforce that components can only be registered to one system; is that what we want?
			this.#unregister(component);	
		}
	}// #autoUnregisterComponent
}// System
