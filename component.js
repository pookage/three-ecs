import { Color, MathUtils } from "three";
import { generateReactiveShallowState } from "./utils.js";

export default class Component {

	// PROPERTIES
	// ----------------------------
	data;   // (Proxy) instance that mirrors the passed-in schema, and calls update() when modified
	entity; // (Entity) instance that has added this component (set by the entity)


	// CONFIG
	// ----------------------------
	static get schema()      { return {} } // the schema should be read-only and defined on the subclass
	static get dependencies(){ return [] } // all the components that this relies on to function

	// LIFECYCLE JAZZ
	// ----------------------------
	constructor(userConfig = {}){

		// ensure that lifecycle methods are bound so they can be triggered elsewhere with correct scope
		this.connected         = this.connected.bind(this);
		this.disconnected      = this.disconnected.bind(this);
		this.play              = this.play.bind(this);
		this.update            = this.update.bind(this);
		this.tick              = this.tick.bind(this);
		this.dependencyAdded   = this.dependencyAdded.bind(this)
		this.dependencyUpdated = this.dependencyUpdated.bind(this)
		this.dependencyRemoved = this.dependencyRemoved.bind(this)

		// generate a reactive internal "data" state that calls 'update' when modified
		const config = this.generateVerifiedConfig(userConfig);
		const data   = this.data = generateReactiveShallowState(config, this.update);
	}// constructor

	// called when the component has been added to an entity
	connected(entity){
		// let any dependencies know that this component has been added
		if(entity.dependencies.has(this.constructor.name)){
			for(const dependency of entity.dependencies.get(this.constructor.name)){
				entity.components.get(dependency).dependencyAdded(
					this.constructor.name,
					this.data
				);
			}
		}
	}// connected

	// called when the component has been removed from an entity
	disconnected(entity){
		// let any dependencies know that this component has been removed
		if(entity.dependencies.has(this.constructor.name)){
			for(const dependency of entity.dependencies.get(this.constructor.name)){
				entity.components.get(dependency).dependencyRemoved(
					this.constructor.name,
				);
			}
		}
	}// disconnected

	// called when the component is part of an active scene
	play(){ }// play

	// called when any of the component's properties have been modified
	update(property, previous, current){
		// let any dependencies know that a change has occurred
		if(previous !== current && this.entity.dependencies.has(this.constructor.name)){
			for(const dependency of this.entity.dependencies.get(this.constructor.name)){
				this.entity.components.get(dependency).dependencyUpdated(
					this.constructor.name,
					property,
					previous,
					current
				);
			}
		}	
	}// update

	// called on every animation frame
	tick(time, deltaTime){ }// tick

	// called after every animation frame
	tock(time, deltaTime){ }// tock


	// DEPENDENCY LIFECYCLE
	// -------------------------------------
	dependencyAdded(component, data){ }// dependencyAdded
	dependencyUpdated(component, property, previous, current){ }// dependencyUpdated
	dependencyRemoved(component){ }// dependencyRemoved


	// UTILS
	// -----------------------------
	generateVerifiedConfig = (userConfig) => {
		return Object.entries(this.constructor.schema).reduce((config, [property, value]) => {
			const type                        = value.type || (value.default !== undefined && typeof value.default) || typeof value.oneOf?.[0]
			const userValue                   = this.#applySchemaPropertyType(userConfig[property], type, value);
			const permittedValues             = value.oneOf || [ userValue ];
			const propertyHasUserDefinedValue = userConfig.hasOwnProperty(property);
			const isDefinedValueOfCorrectType = this.#verifyType(userValue, type);
			const isDefinedValuePermitted     = permittedValues.includes(userValue);


			// APPLY USER-DEFINED PROPERTIES
			// -----------------------------------
			// if the user's defined a valid value for the property then go ahead and apply it
			if(propertyHasUserDefinedValue && isDefinedValueOfCorrectType && isDefinedValuePermitted){
				config[property] = userValue;
			} else {
				// otherwise just use the default value specified in the config
				config[property] = this.#applySchemaPropertyType(value.default ?? value.oneOf[0], type, value);

				//...and let the user know where they went wrong...
				if (propertyHasUserDefinedValue){

					// ...by not not giving the value the correct type...
					if(!isDefinedValueOfCorrectType){
						console.warn(
							`[WARNING](${this.constructor.name}) Cannot set property '${property}' to`, 
							userValue, 
							`as it is not of type '${type}' - applying the default value instead.`
						);	
					} 

					// ...by not using a whitelisted value
					if(!isDefinedValuePermitted){
						console.warn(
							`[WARNING](${this.constructor.name}) Cannot set property '${property}' to`,
							userValue,
							`as it is not one of the permitted values:`,
							permittedValues,
							`- applying the default value instead.`
						);
					}
				} 
			}

			return config;
		}, {});
	}// generateVerifiedConfig

	#applySchemaPropertyType = (value, type, config) => {
		switch(type){
			case "number": {
				const userValue = parseFloat(value);
				const {
					min = userValue,
					max = userValue
				} = config;
				
				return MathUtils.clamp(userValue, min, max);
			}
			case "boolean": return (/true/).test(value);
			case "color":  return new Color(value);
			case "string": 
			default: {
				return new String(value).toString();
			}
		}
	}// #applySchemaPropertyType

	#verifyType = (value, type, config) => {
		switch(type){
			case "boolean":
			case "number":
			case "string": {
				return typeof value;
			}
			case "color": {
				return value.isColor
			}
		}
	}// #verifyType
}// Component
