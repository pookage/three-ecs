import { EventDispatcher } from "three";
// import { EntityEventDispatcher } from "../../utils/index.js";


let comp;
let sys;

const ECSObject = {
	// LIFECYCLE JAZZ
	// -------------------------------------
	init(
		children   = [], 
		systems    = [], 
		components = [], 
		properties = {}
	){
		// adopt systems
		for(const system of systems) this.addSystem(system);
		// adopt children
		for(const child of children) this.add(child);
		// adopt components
		for(const component of components) this.addComponent(component);
	},//init

	connected(){
		// mark this entity as connected 
		this.isConnected = true;

		// fire connected lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.connected(this);
		// fire connected lifecycle callback on all attached components
		for(const component of this.components.values()) component.connected(this);
	},// connected
	disconnected(){
		// mark this entity as disconnected
		this.isConnected = false;

		// fire disconnected lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.disconnected(this);
		// fire disconnected lifecycle callback on all attached components
		for(const component of this.components.values()) component.disconnected(this);
	},// disconnected

	play(){
		// fire play lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.play();
		// fire play() lifecycle callback on all attached components
		for(const component of this.components.values()) component.play();
	},// play
	pause(){
		// fire pause lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.pause();
		// fire pause() lifecycle callback on all attached components
		for(const component of this.components.values()) component.pause();
	}, // pause

	tick(time, deltaTime){
		// NOTE: systems need to come after components for ticks
		// fire tick lifecycle callback on all attached systems
		for(sys of this.systems.values()) sys.tick(time, deltaTime);
		// fire tick lifecycle callback on all attached components
		for(comp of this.components.values()) comp.tick(time, deltaTime);
	}, // tick
	tock(time, deltaTime){
		// fire tock lifecycle callback on all attached systems
		for(sys of this.systems.values()) sys.tock(time, deltaTime);
		// fire tock lifecycle callback on all attached components
		for(comp of this.components.values()){ comp.tock(time, deltaTime); }
	}, // tock


	// UTILS
	// -------------------------------------
	add(entity){
		if(entity.isEntity){
			// fire lifecycle methods as applicable
			if(this.isAdded)     entity.added();
			if(this.isConnected) entity.connected();
			if(this.isPlaying)   entity.play();
		}
	},// add
	remove(entity){
		if(entity.isEntity){
			entity.removed();
			if(this.isConnected) entity.disconnected();
		}
	},// remove

	dispatchEvent(event, ...otherArgs){
		/*
			NOTE:
				code copied from the abandoned PR on the THREE.js repo
				https://github.com/mrdoob/three.js/pull/8368/files
		*/
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
		}
	}, //dispatchEvent

	addSystem(system){
		if(this.systems.has(system.constructor)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${system.constructor.name} instance - this will be removed and replaced with the new one`);
			this.removeSystem(this.systems.get(system.constructor));
		}

		// add the new system
		this.systems.set(system.constructor, system);
		system.entity = this;

		// call the appropriate system lifecycle methods if it's been added after the entity has been connected
		if(this.isAdded)     system.added(this);
		if(this.isConnected) system.connected(this);
		if(this.isPlaying)   system.play();
	},
	removeSystem(system){
		// call the appropriate system
		system.removed(this);
		if(this.isConnected) system.disconnected(this);
		// remove the system from this entity
		this.systems.delete(system.constructor);
	},

	addComponent(component, isParentAdded){
		if(this.components.has(component.constructor)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${component.constructor.name} instance - this will be removed and replaced with the new one`);
			this.removeComponent(this.components.get(component.constructor));
		}

		// add the new component to this entity
		this.components.set(component.constructor, component);
		component.entity = this;

		// call the appropriate component lifecycle methods if it's been added after the entity has been connected
		if(this.isAdded)     component.added(this);
		if(this.isConnected) component.connected(this);
		if(this.isPlaying)   component.play();

		// update the dependency map to include this component
		for(const provider of component.constructor.dependencies){
			if(this.dependencies.get(provider)){
				this.dependencies.get(provider).push(component.constructor);
			} else {
				this.dependencies.set(provider, [ component.constructor ]);
			}
		}
	}, // addComponent
	removeComponent(component){
		// remove this component as a dependency on all other components
		for(const dependencies of this.dependencies.values()){
			if(dependencies.includes(component.constructor))
			dependencies.splice(dependencies.indexOf(component.constructor), 1)
		}

		// call the appropriate component lifecycle methods
		component.removed(this);
		if(this.isConnected) component.disconnected(this);
		// remove the component from this entity
		this.components.delete(component.constructor);
	}// removeComponent
};

export default ECSObject;
