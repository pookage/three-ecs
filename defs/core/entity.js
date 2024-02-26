import { Object3D, MathUtils } from "three";

import ECSObject from "./ecs-object.js";
import { parseAsThreeProperty, parseValueWithSchema } from "../../utils/index.js";


export default class Entity extends Object3D {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// static state
	#isAdded      = false;
	#isConnected  = false;
	#isPlaying    = false;
	#systems      = new Map(); // (Map) containing every System instance attached to this entity
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get mappings(){
		return {
			"position": [ Entity, "position"],
			"rotation": [ Entity, "rotation"],
			"scale"   : [ Entity, "scale"   ],
			"visible" : [ Entity, "visible" ]
		}
	}// get mappings
	static get defaultSystems(){
		return [];
	}// get defaultSystems
	static get defaultComponents(){
		return new Map();
	}// get defaultComponents

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get systems()      { return this.#systems;      }
	get components()   { return this.#components;   }
	get dependencies() { return this.#dependencies; }
	get isAdded()      { return this.#isAdded;      }
	get isConnected()  { return this.#isConnected;  }
	get isPlaying()    { return this.#isPlaying;    }
	get isEntity()     { return true; }

	// ~~ setters ~~
	set isConnected(isConnected){ this.#isConnected = isConnected; }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	constructor(
		children          = [], 
		initialSystems    = [],
		initialComponents = [],
		properties        = {}
	){
		super();

		const defaultSystems = this.constructor.defaultSystems.map(DefaultSystem => new DefaultSystem())
		const systems = [ ...defaultSystems, ...initialSystems ];

		// define all the components to be attached to this entity
		const defaultComponents = this.constructor.defaultComponents
			.entries()
			.map(([ DefaultComponent, defaultProperties ]) => new DefaultComponent(defaultProperties));
		const components = [ ...defaultComponents, ...initialComponents ];

		// initialise the entity with functionality shared by all ECS entities
		ECSObject.init.call(this, children, systems, components, properties);

		// apply mapped properties to the underlying Object3D directly
		for(const [key, value] of Object.entries(properties)) {
			if(Object.keys(this.constructor.mappings).includes(key)){
				this.applyProperty(key, value);	
			}
		}
	}// constructor

	added()  { 
		// fire added lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.added(this);
		// fire added lifecycle callback on all attached components
		for(const component of this.components.values()) component.added(this);

		// flip the flag to mark this entity as added
		this.#isAdded = true; 
	}// added
	removed(){ 
		// fire removed lifecycle callback on all attached systems
		for(const system of this.systems.values()) system.removed(this);
		// fire removed lifecycle callback on all attached components
		for(const component of this.components.values()) component.removed(this);

		// flip the flag to mark this entity as removed
		this.#isAdded = false; 
	}// remoevd

	connected()   { ECSObject.connected.call(this);    }// connected
	disconnected(){ ECSObject.disconnected.call(this); }// disconnected
	
	play(){
		if(!this.#isPlaying){
			this.#isPlaying = true;
			ECSObject.play.call(this);
		} else {
			console.warn("[WARNING](Entity) You called .play() on an entity that was already playing: call to play ignored.", this);
		}
	}// play
	pause(){
		if(this.#isPlaying){
			this.#isPlaying = false;
			ECSObject.pause.call(this);
		} else {
			console.warn("[WARNING](Entity) You called .pause() on an entity that was already paused: call to pause ignored.", this);
		}
	}// pause

	tick(time, deltaTime){
		ECSObject.tick.call(this, time, deltaTime);
	}// #tick

	tock(time, deltaTime){
		ECSObject.tock.call(this, time, deltaTime);
	}// #tock

	add(entity, ...otherArgs){
		super.add(entity, ...otherArgs);
		ECSObject.add.call(this, entity); 
	}// add
	remove(entity){ 
		ECSObject.remove.call(this, entity); 
		super.remove(entity);
	} // remove

	// ~~ utils ~~
	addSystem(system)   { ECSObject.addSystem.call(this,    system); }// addSystem
	removeSystem(system){ ECSObject.removeSystem.call(this, system); }// removeSystem

	addComponent(component)   { ECSObject.addComponent.call(this,    component); }// addComponent
	removeComponent(component){ ECSObject.removeComponent.call(this, component); }// removeComponent

	dispatchEvent(event, ...otherArgs){ ECSObject.dispatchEvent.call(this, event, ...otherArgs); }// dispatchEvent

	applyProperty(mappedProperty, rawValue){
		const [ ComponentConstructor, property ] = this.constructor.mappings[mappedProperty];

		// if we're not targeting the entity, then assume we're targeting a component and let that component handle the parsing
		if(ComponentConstructor !== Entity){
			this.#components.get(ComponentConstructor).data[property] = parseValueWithSchema(
				rawValue, 
				property, 
				ComponentConstructor.schema[property]
			);
		}

		// otherwise assuming we want to manipulate the entity directly and parse it here & now
		else {
			const value = parseAsThreeProperty(rawValue, property);

			switch(property){
				case "position": {
					this.position.copy(value);
					break;
				}
				case "rotation": {
					this.rotation.copy(value);
					break;
				}
				case "scale": {
					this.scale.copy(value);
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
	}// applyProperty
}// Entity
