import { MeshBasicMaterial, MeshStandardMaterial } from "three";

import Component from "./../../component.js";
import { parseProperty } from "./../../utils.js";


export default class Material extends Component {
	// CONFIG
	// --------------------------------
	static get schema(){
		return {
			type: {
				oneOf: [
					"basic",
					"standard"
				]
			},
			color: {
				type: "color",
				default: "#ff0000"
			}
		}
	}// schema


	// INTERFACE
	// -------------------------------
	get material(){ return this.#material }


	// PROPERTIES
	// -------------------------------
	#material;


	// LIFECYCLE JAZZ
	// ------------------------------
	constructor(...args){
		super(...args);

		this.#generateMaterial(this.data);
	}// constructor

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

		const common = {
			color: parseProperty(color, Material.schema.color.type)
		};

		switch(type){
			case "basic": {
				this.#material = new MeshBasicMaterial({ ...common })
				break;
			}
			case "standard": {
				this.#material = new MeshStandardMaterial({ ...common });
				break;
			}
			default: {
				console.error("[Material] Cannot create material - unknown type:", type)
			}
		}
	}// #generateMaterial

	#updateMaterial = (material, property, value) => {

		const parsedValue = parseProperty(value, Material.schema[property].type)

		switch(property){
			case "color": {
				material[property] = parsedValue;	
			}
		}
	}// #updateMaterial
}// Material
