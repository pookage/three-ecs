import { MeshBasicMaterial, Color } from "three";

import Component from "../../core/component.js";


export default class Material extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#material;


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get schema(){
		return {
			type: {
				oneOf: [
					"basic"
				]
			},
			color: {
				type: "color",
				default: new Color(0xff0000)
			}
		}
	}// get schema

	// PUBLIC PROPERTIES
	get material(){ return this.#material }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	update(property, previous, current){
		super.update(property, previous, current);

		if(previous !== current){
			switch(property){
				case "type": {
					this.#generateMaterial(this.data);
					break;
				}
				case "color": {
					this.#updateMaterial(this.#material, property, current);
					break;
				}
			}
		}
	}// update


	// UTILS
	// -------------------------------
	#generateMaterial = data => {
		const {
			color,
			type
		} = data;

		switch(type){
			case "basic": {
				this.#material = new MeshBasicMaterial({ color })
				break;
			}
			default: {
				console.error("[ERROR](Material) Cannot create material of unknown type:", type)
			}
		}
	}// #generateMaterial

	#updateMaterial = (material, property, value) => {
		switch(property){
			case "color": {
				material[property] = value;	
			}
		}
	}// #updateMaterial
}// Material
