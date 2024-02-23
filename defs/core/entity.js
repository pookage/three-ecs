import { Object3D, MathUtils } from "three";

import ECSObject from "./ecs-object.js";
import { componentRegistry, toProperCase } from "../../utils/index.js";


export default class Entity extends Object3D {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#component;
	// static state
	#isPlaying    = false;
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get mappings(){
		return {
			"position": "entity.position",
			"rotation": "entity.rotation",
			"scale"   : "entity.scale",
			"visible" : "entity.visible"
		}
	}// get mappings
	static get defaultComponents(){
		return {};
	}// get defaultComponents

	// PUBLIC PROPERTIES
	get components()   { return this.#components;   }
	get dependencies() { return this.#dependencies; }
	get isPlaying()    { return this.#isPlaying;    }
	get isEntity()     { return true; }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	connected(){
		// fire connected lifecycle callback on all attached components
		for(const component of this.#components.values()){
			component.connected(this);
		}
	}// #connected

	disconnected(){
		// fire disconnected lifecycle callback on all attached components
		for(const component of this.#components.values()){
			component.disconnected(this);
		}
	}// #disconnected
	
	play(){
		if(!this.#isPlaying){
			this.#isPlaying = true;
			// fire play() lifecycle callback on all attached components
			for(const component of entity.components.values()){
				component.play();
			}
		} else {
			console.warn("[WARNING](Entity) You called .play() on an entity that was already playing: call to play ignored.", this);
		}
	}// play
	pause(){
		if(this.#isPlaying){
			this.#isPlaying = false;
			// fire pause() lifecycle callback on all attached components
			for(const component of entity.components.values()){
				component.pause();
			}
		} else {
			console.warn("[WARNING](Entity) You called .pause() on an entity that was already paused: call to pause ignored.", this);
		}
	}// pause

	tick(time, deltaTime){
		for(this.#component of this.#components.values()){
			this.#component.tick(time, deltaTime);
		}
	}// #tick

	tock(time, deltaTime){
		for(this.#component of this.#components.values()){
			this.#component.tock(time, deltaTime);
		}
	}// #tock

	add(entity, ...otherArgs){
		super.add(entity, ...otherArgs);
		ECSObject.add.apply(this, [ entity ]); 
	}// add
	remove(entity){ 
		super.remove(entity);
		ECSObject.remove.apply(this, [ entity ]); 
	} // remove

	addComponent(component){
		ECSObject.addComponent.apply(this, [ component ])
	}// addComponent
	removeComponent(component){
		ECSObject.removeComponent.apply(this, [ component ])
	}// removeComponent

	dispatchEvent(event, ...otherArgs){
		ECSObject.dispatchEvent.apply(this, [ event, ...otherArgs ]);
	}// dispatchEvent


	// DEFAULT LIFECYCLE JAZZ
	// -------------------------------------
	constructor(children = [], initialComponents = [], properties = {}){
		super();

		// define all the components to be attached to this entity
		const defaultComponents = Object
			.entries(this.constructor.defaultComponents)
			.map(([ name, componentProperties ]) => new (componentRegistry.get(name))(componentProperties));
		const components = [ ...defaultComponents, ...initialComponents ];

		// initialise the entity with functionality shared by all ECS entities
		ECSObject.init.apply(this, [ children, components, properties ]);

		// apply mapped properties to the underlying Object3D directly
		for(const [key, value] of Object.entries(properties)) {
			if(Object.keys(this.constructor.mappings).includes(key)){
				this.#applyProperty(key, value);	
			}
		}
	}// constructor

	// UTILS
	// -------------------------------------
	#applyProperty = (key, value) => {
		const [ name, property ] = this.constructor.mappings[key]?.split(".");

		// if we're not targeting the entity, then assume we're targeting a component and let that component handle the parsing
		if(name !== "entity") this.#components.get(toProperCase(name)).data[property] = value;

		// otherwise assuming we want to manipulate the entity directly and parse it here & now
		else {
			switch(property){
				case "position": {
					// receive this property as an {xyz} object, but set it using the threejs Vector3 methods
					const { 
						x = 0, 
						y = 0, 
						z = 0
					} = value;

					this.position.set(
						parseFloat(x), 
						parseFloat(y), 
						parseFloat(z)
					);
					break;
				}
				case "rotation": {
					// receive this property as an {xyz} object in degrees, and apply using the threejs Euler method in radians
					const { 
						x = 0, 
						y = 0, 
						z = 0 
					} = value;

					this.rotation.set(
						MathUtils.degToRad(x), 
						MathUtils.degToRad(y), 
						MathUtils.degToRad(z)
					);
					break;
				}
				case "scale": {
					const { x, y, z } = isObject(value) 
						// if we have an object, use its xyz properties and default to 1 for anything undefined
						? {
							x: value.x ?? 1,
							y: value.y ?? 1,
							z: value.z ?? 1
						} 
						// if we have a single value, apply it equally to all axis
						: {
							x: value,
							y: value,
							z: value
						};
					this.scale.set(
						parseFloat(x),
						parseFloat(y),
						parseFloat(z)
					);
					break;
				}

				case "visible": {
					this.visible = value;
					break;
				}

				// otherwise don't treat this property with any special case
				default: this[key] = value;
			}
		} 
	}// #applyProperty
}// Entity
