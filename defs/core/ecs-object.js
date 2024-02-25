import { EventDispatcher } from "three";

let comp;

const ECSObject = {
	// LIFECYCLE JAZZ
	// -------------------------------------
	init(children = [], systems = [], components = [], properties = {}){
		// adopt children
		for(const child of children) this.add(child);
		// adopt systems
		for(const system of systems) this.addSystem(system);
		// adopt components
		for(const component of components) this.addComponent(component);
	},//init

	connected(){
		// fire connected lifecycle callback on all attached components
		for(const component of this.components.values()){
			component.connected(this);
		}
	},// connected
	disconnected(){
		// fire disconnected lifecycle callback on all attached components
		for(const component of this.components.values()){
			component.disconnected(this);
		}
	},// disconnected

	play(){
		// fire play() lifecycle callback on all attached components
		for(const component of this.components.values()){
			component.play();
		}
	},// play
	pause(){
		// fire pause() lifecycle callback on all attached components
		for(const component of this.components.values()){
			component.pause();
		}
	}, // pause

	tick(time, deltaTime){
		for(comp of this.components.values()){
			comp.tick(time, deltaTime);
		}
	}, // tick
	tock(time, deltaTime){
		for(comp of this.components.values()){
			comp.tock(time, deltaTime);
		}
	}, // tock


	// UTILS
	// -------------------------------------
	add(entity){
		if(entity.isEntity){
			entity.connected();
			if(this.isPlaying) entity.play();
		}
	},// add
	remove(entity){
		if(entity.isEntity){
			entity.disconnected();
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
		const systemName = system.constructor.name;

		if(this.systems.has(systemName)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${systemName} instance - this will be removed and replaced with the new one`);
			this.removeSystem(this.systems.get(systemName));
		}

		// add the new system
		this.systems.set(systemName, system);
		system.entity = this;
	},
	removeSystem(system){
		const systemName = system.constructor.name;

		// call the systems 'remove' lifecycle method
		system.disconnected(this);
		// remove the system from this entity
		this.systems.delete(systemName);
	},

	addComponent(component){
		const componentName = component.constructor.name;

		if(this.components.has(componentName)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${componentName} instance - this will be removed and replaced with the new one`);
			this.removeComponent(this.components.get(componentName));
		}

		// add the new component to this entity
		this.components.set(componentName, component);
		component.entity = this;

		// update the dependency map to include this component
		for(const provider of component.constructor.dependencies){
			if(this.dependencies.get(provider)){
				this.dependencies.get(provider).push(componentName);
			} else {
				this.dependencies.set(provider, [ componentName ]);
			}
		}
	}, // addComponent
	removeComponent(component){
		const componentName = component.constructor.name;

		// remove this component as a dependency on all other components
		for(const dependencies of this.dependencies.values()){
			if(dependencies.includes(componentName))
			dependencies.splice(dependencies.indexOf(componentName), 1)
		}

		// call the components 'remove' lifecycle method
		component.disconnected(this);
		// remove the component from this entity
		this.components.delete(componentName);
	}// removeComponent
};

export default ECSObject;
