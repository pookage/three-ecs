import { MeshBasicMaterial, Color } from "three";

import Component from "../../core/component/index.js";


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
	constructor(config){
		super(config);

		this.#material = this.#generateMaterial(this.data);
	}// constructor
	update(property, previous, current){
		if(previous !== current){
			switch(property){
				case "type": {
					this.#material = this.#generateMaterial(this.data);
					break;
				}
				case "color": {
					this.#updateMaterial(this.#material, property, current);
					break;
				}
			}
		}

		super.update(property, previous, current);
	}// update


	// UTILS
	// -------------------------------
	#generateMaterial = data => {
		const {
			color,
			type
		} = data;

		let material;
		switch(type){
			case "basic": {
				material = new MeshBasicMaterial({ color })
				break;
			}
			default: {
				console.error("[ERROR](Material) Cannot create material of unknown type:", type)
			}
		}

		return material;
	}// #generateMaterial

	#updateMaterial = (material, property, value) => {
		switch(property){
			case "color": {
				material[property] = value;	
			}
		}
	}// #updateMaterial
}// Material
