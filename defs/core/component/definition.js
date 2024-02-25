import { parseUnverifiedConfig, generateReactiveShallowState } from "../../../utils/index.js";

import { ADDED, REMOVED } from "./events.js";

export default class Component {
	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get schema()      { return {} } // the schema should be read-only and defined on the subclass
	static get dependencies(){ return [] } // all the components that this relies on to function

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get data()   { return this.#data;   } // get data
	get entity() { return this.#entity; } // get entity

	// ~~ setters ~~
	set entity(entity) { 
		this.#entity = entity;
	}// set entity


	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	tick(time, delatTime){}// tick
	tock(time, delatTime){}// tock

	play(){}// play
	pause(){}// pause

	added(entity){
		// let any dependencies know that this component has been added
		if(entity.dependencies.has(this.constructor.name)){
			for(const dependency of entity.dependencies.get(this.constructor.name)){
				entity.components.get(dependency).dependencyAdded(
					this.constructor.name,
					this.data
				);
			}
		}

		// broadcast a wider connection event for anything else to hook onto
		this.entity.dispatchEvent({
			type: ADDED,
			bubbles: true,
			component: this
		});
	}// added
	removed(entity){ 
		// let any dependencies know that this component has been removed
		if(entity.dependencies.has(this.constructor.name)){
			for(const dependency of entity.dependencies.get(this.constructor.name)){
				entity.components.get(dependency).dependencyRemoved(
					this.constructor.name,
				);
			}
		}

		// broadcast a wider connection event for anything else to hook onto
		this.entity.dispatchEvent({
			type: REMOVED,
			bubbles: true,
			component: this
		});
	}// removed

	connected(entity){ }// connected
	disconnected(entity){ }// disconnected

	update(property, previous, current){
		// let any dependencies know that a change has occurred
		if(previous !== current && this.#entity.dependencies.has(this.constructor.name)){
			for(const dependency of this.#entity.dependencies.get(this.constructor.name)){
				this.#entity.components.get(dependency).dependencyUpdated(
					this.constructor.name,
					property,
					previous,
					current
				);
			}
		}	
	}// update

	// ~~ dependency lifecycle methods ~~
	dependencyAdded(component, data){}// dependencyAdded
	dependencyUpdated(component, property, previous, current){ }// dependencyUpdated
	dependencyRemoved(component){ }// dependencyRemoved


	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#entity;
	#data;


	// DEFAULT LIFECYCLE JAZZ
	// -------------------------------------
	constructor(userConfig = {}){
		const verifiedConfig = parseUnverifiedConfig.apply(this, [
			userConfig,
			this.constructor.schema
		]);

		this.#data = generateReactiveShallowState(verifiedConfig, this.update.bind(this));
	}// constructor	
}// Component
