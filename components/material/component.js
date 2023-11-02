import { MeshBasicMaterial, Color } from "three";
import Component from "./../../component.js";

export default class Material extends Component {
	// CONFIG
	// --------------------------------
	static get schema(){
		return {
			type: {
				oneOf: [
					"basic"
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

					console.log(this)

					this.#updateMaterial(property, current);
					break;
				}
			}
		}
	}// update


	// UTILS
	// -------------------------------
	#generateMaterial = data => {
		switch(data.type){
			case "basic": {
				const {
					color
				} = data;

				this.#material = new MeshBasicMaterial({ color })
				break;
			}
		}
	}// #generateMaterial

	#updateMaterial = (property, value) => {
		switch(property){
			case "color": {

				console.log(value)

				const color = value.isColor
					? value             // use the THREE.Color if one's been given
					: new Color(value); // otherwise generate THREE.Color from the input instead

				this.#material.color = color;	
			}
		}
	}// #updateMaterial
}// Material
