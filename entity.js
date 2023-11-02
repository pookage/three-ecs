import { Object3D, MathUtils, EventDispatcher } from "three";
import { isObject } from "./utils.js";


export default class Entity extends Object3D {
	// HELPERS
	// -----------------------------
	#component; 


	// STATE
	// -----------------------------
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity
	#isConnected  = false;     // (Boolean) flipped during connected() and disconnected() to determine whether the entity has been added by another entity or not
	#isPlaying    = false;     // (Boolean) flipped during play() and pause() as this can be trigged both just on this entity, and on all entities by the World()
	#isRemoving   = false;     // (Boolean) flipped during remove() as this can be trigged on this component directly, or as part of a larger removal by the World()


	// INTERFACE
	// ----------------------------
	// getters
	get components()  { return this.#components;  } // only allow components to be accessed, not replaced
	get dependencies(){ return this.#dependencies } // only allow dependencies to be modified by this class
	get isEntity()    { return true;              } // signal that this Object3D is part of the ECS
	get isConnected() { return this.#isConnected  } 

	static get mappedProperties(){
		return [
			"position",
			"rotation",
			"scale",
			"visible"
		]
	}// mappedProperties

	add(entity, ...otherArgs){
		super.add(entity, ...otherArgs);

		if(entity.isEntity){
			if(this.#isPlaying) entity.play();
		}
	}// add
	remove(entity){
		super.remove(entity)
		if(entity.isEntity) entity.disconnected();
	}// remove

	dispatchEvent(event, ...otherArgs){

		// console.log({event})

		/*
			NOTE:
				code copied from the abandoned PR on the THREE.js repo
				https://github.com/mrdoob/three.js/pull/8368/files
		*/

		// console.log("dispatching event", event)

		const {
			stopPropagation,
			propagationStopped,
			bubbles
		} = event;

		if (stopPropagation === undefined) {
			event.stopPropagation = function() {
				event.propagationStopped = true;
			}
		}

		EventDispatcher.prototype.dispatchEvent.call(this, event, ...otherArgs);

		if (!propagationStopped && bubbles) {
			this.parent?.dispatchEvent(event);
			// console.log("propagating event to parent", this)
		}
	}// dispatchEvent


	// LIFECYCLE JAZZ
	// -----------------------------
	constructor(
		children   = [], 
		components = [],
		properties = {}
	){
		super();

		// add child entities to the heirarchy
		for(const child of children) this.add(child);
		// add components to the entity
		for(const component of components) this.addComponent(component);
		// apply properties to the underlying Object3D directly
		for(const [key, value] of Object.entries(properties)) {
			if(this.constructor.mappedProperties.includes(key)){
				this.applyProperty(key, value);	
			}
		}

		// console.log(this)

		this.addEventListener("added", event => event.target.connected())

	}// constructor

	tick(time, deltaTime){
		// NOTE: the scene propagates the tick to all entities; the entity just passes to components
		// call lifecycle method on all components on this entity
		for(this.#component of this.#components.values()){
			this.#component.tick(time, deltaTime);
		}
	}// tick

	tock(time, deltaTime){
		// NOTE: the scene propagates the tock to all entities; the entity just passes to components
		// call lifecycle method on all components on this entity
		for(this.#component of this.#components.values()){
			this.#component.tock(time, deltaTime);
		}
	}// tock

	play(){
		if(!this.#isPlaying){
			// flip flag to prevent this method being called more than once
			this.#isPlaying = true;

			// propagate state to all child entities and components
			this.traverse(entity => {
				// only call lifecycle methods on other entities
				if(entity.isEntity){
					entity.play(); 

					// call lifecycle play() on all components on this entity
					for(this.#component of entity.components.values()){
						this.#component.play();
					}
				}
			})
		}
	}// play

	connected(){
		this.#isConnected = true;
		for(this.#component of this.#components.values()){
			this.#component.connected(this);
		}
		// called when this entity has been added to another entity or the scene
	}// connected	

	pause(){
		if(this.#isPlaying){
			// flip flag to prevent this method being called more than once
			this.#isPlaying = false;

			// propagate state to all child entities and components
			this.traverse(entity => {
				if(entity.isEntity){
					entity.pause();

					// call lifecycle pause() on all components on this entity
					for(this.#component of entity.components.values()){
						this.#component.pause();
					}
				}
			});
		}
	}// pause

	disconnected(){
		if(!this.#isRemoving){
			// flip flag to prevent this method from being called more than once
			this.#isRemoving = true;

			// propogate state to all child entities and components
			this.traverse(entity => {
				// only call lifecycle methods on other entities
				if(entity !== this && entity.isEntity){
					entity.disconnected();

					// remove every component from this entity before removing the entity
					for(this.#component of this.#components.values()){
						this.removeComponent(this.#component)
					}
				}
			});
		}
	}// disconnected


	// UTILS
	// ----------------------------
	applyProperty(property, value){
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

			// otherwise don'n treat this property with any special case
			default: this[property] = value;
		}
	}// applyProperty
	addComponent(component){
		const componentName = component.constructor.name;

		if(this.#components.has(componentName)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${componentName} instance - this will be removed and replaced with the new one`);

			// call the component 'remove' lifecycle method so it can do its own cleanup
			this.#components.get(componentName).cleanup();
		}

		// add the new component
		this.#components.set(componentName, component);
		component.entity = this;

		// update the dependency map to include this component
		for(const provider of component.constructor.dependencies){
			if(this.#dependencies.get(provider)){
				this.#dependencies.get(provider).push(componentName);
			} else {
				this.#dependencies.set(provider, [ componentName ]);
			}
		}

		// if this entity is already in the scene, then call the component's 'play' lifecycle method
		
		if(this.#isConnected) component.connected(this);
		if(this.#isPlaying)   component.play();
	}// addComponent

	removeComponent(component){
		const componentName = component.constructor.name;

		// remove this component as a dependency on all other components
		for(const dependencies of this.#dependencies.values()){
			if(dependencies.includes(componentName))
			dependencies.splice(dependencies.indexOf(componentName), 1)
		}

		// call the components 'remove' lifecycle method
		component.disconnected(this);
		// remove the component from this entity
		this.#components.delete(componentName);
	}// removeComponent
}// Entity

console.log(`
	TODO: Take all the lifecycle etc methods from the Entity class, and export them as functions that the World class can then import and use
		ie. this.removeComponent = Entity.removeComponent.bind(this)

`)
