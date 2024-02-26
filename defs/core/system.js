import { COMPONENT_ADDED, COMPONENT_REMOVED } from "./component/index.js";

export default class System {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#entity;

	// static state
	#registeredComponentList = new Set();
	#registeredComponents    = new Map();



	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get autoregister(){ return []; }// get autoregister

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get registeredComponentList(){ return this.#registeredComponentList; }
	get registeredComponents()   { return this.#registeredComponents;    }
	get entity()                 { return this.#entity;                  }
	// ~~setters ~~
	set entity(entity){ this.#entity = entity; }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	added(entity){
		entity.addEventListener(COMPONENT_ADDED, this.#autoRegisterComponent);
		entity.addEventListener(COMPONENT_REMOVED, this.#autoUnregisterComponent);
	}// added
	removed(entity){
		entity.removeEventListener(COMPONENT_ADDED, this.#autoRegisterComponent);
		entity.removeEventListener(COMPONENT_REMOVED, this.#autoUnregisterComponent);
	}// removed

	connected(entity){} // connected
	disconnected(entity){} // disconnected

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
		const hasRegisteredComponent = this.#registeredComponentList.has(component);

		if(!hasRegisteredComponent){
			const name = component.constructor.name;

			// add the component to the list of registered components
			this.#registeredComponentList.add(component);

			// also add the component to a Map() grouped by component type
			if(this.#registeredComponents.has(name)) this.#registeredComponents.get(name).add(component);
			else                                     this.#registeredComponents.set(name, new Set([ component ]));
		}
		else {
			console.warn(
				`[WARNING](${this.constructor.name}) Cannot register component`,
				component,
				"as it has already been registered"
			);
		}
		
	}// #register
	#unregister = component => {
		const hasRegisteredComponent = this.#registeredComponentList.has(component);

		if(hasRegisteredComponent){
			const name = component.constructor.name;

			// remove this component from all System storage
			this.#registeredComponentList.delete(component);
			this.#registeredComponents.get(name).delete(component);
		}
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
		const { component } = event;
		const shouldComponentAutoRegister = this.constructor.autoregister.some(definition => component instanceof definition );

		if(shouldComponentAutoRegister){
			event.stopPropagation(); // this would enforce that components can only be registered to one system; is that what we want?
			this.#register(component);
		}
	}// #autoRegisterComponent

	#autoUnregisterComponent = event => {
		const { component } = event;
		const shouldComponentAutoUnregister = this.constructor.autoregister.some(definition => component instanceof definition );

		if(shouldComponentAutoUnregister){
			event.stopPropagation(); // this would enforce that components can only be registered to one system; is that what we want?
			this.#unregister(component);	
		}
	}// #autoUnregisterComponent
}// System
