import { componentRegistry } from "./index.js";
import Entity from "./entity.js";

export default class Primitive extends Entity {

	// INTERFACE
	// --------------------------------
	static get defaultComponents(){ return }
	static get mappings(){ return }


	// LIFECYCLE JAZZ
	// ---------------------------------
	constructor(children, components = [], properties){
		super(
			children, 
			[ ...this.#generateDefaultComponents(), ...components ], 
			properties
		);
	}// constructor


	// UTILS
	// ---------------------------------
	#generateDefaultComponents = () => {
		return Object.entries(this.constructor.defaultComponents).map(([ name, properties]) => {
			const definition = componentRegistry.get(name);
			const component  = new definition(properties);
		});
	}// generateDefaultComponents
}// Primitive
