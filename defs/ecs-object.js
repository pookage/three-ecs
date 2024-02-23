import { EventDispatcher } from "three";

console.warn("[TODO] Confirm whether the top-level World's traverse() is enough to call the lifecycle methods throughout the scene, or whether child entities need to call these too")

const ECSObject = {
	// LIFECYCLE JAZZ
	// -------------------------------------
	init(children = [], components = [], properties = {}){
		// adopt children
		for(const child of children) this.add(child);
		// adopt components
		for(const component of components) addComponent.apply(this, component);
	},//init

	// NOTE: these lifecyle methods might only be needed by the World.js - confirm after testing
	connected(){
		this.traverse(entity => {
			if(entity.isEntity) entity.connected();
		});
	},
	disconnected(){
		this.traverse(entity => {
			if(entity.isEntity) entity.disconnected();
		});
	},
	play(){
		this.traverse(entity => {
			if(entity.isEntity) entity.play();
		});
	}, // play
	pause(){
		this.traverse(entity => {
			if(entity.isEntity) entity.pause();
		});
	}, // pause
	add(entity, ...otherArgs){
		super.add(entity, ...otherArgs);
		if(entity.isEntity){
			entity.connected();
			if(this.isPlaying) entity.play();
		}
	},// add
	remove(entity){
		super.remove(entity);
		if(entity.isEntity){
			entity.disconnected();
		}
	},// remove
	tick(time, deltaTime){
		this.traverse(entity => {
			if(entity.isEntity){
				entity.tick(time, deltaTime);
			}
		});
	},// tick
	tock(time, deltaTime){
		this.traverse(entity => {
			if(entity.isEntity){
				entity.tick(time, deltaTime);
			}
		});
	},// tock

	// UTILS
	// -------------------------------------
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
	addComponent(component){
		const componentName = component.constructor.name;

		if(this.components.has(componentName)){
			console.warn(`[WARNING] ${this.constructor.name} already has a ${componentName} instance - this will be removed and replaced with the new one`);

			// call the component 'remove' lifecycle method so it can do its own cleanup
			this.components.get(componentName).cleanup();
		}

		// add the new component
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
