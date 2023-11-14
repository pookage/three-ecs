import { AmbientLight, DirectionalLight, PointLight } from "three";

import Component from "./../../component.js";
import { parseProperty } from "./../../utils.js";


export default class Light extends Component {

	// CONFIG
	// -----------------------------------
	static get schema(){
		return {
			color: {
				type: "color",
				default: "#ffffff"
			},
			decay: {
				type: "number",
				default: 2,
				min: 0
			},
			distance: {
				type: "number",
				default: 0,
				min: 0
			},
			intensity: {
				type: "number",
				min: 0,
				default: 1
			},
			type: {
				oneOf: [
					"ambient",
					"directional",
					"hemisphere",
					"point",
					"spot"
				],
				default: "ambient"
			}
		}
	}// get schema


	// INTERFACE
	// ----------------------------------
	get light(){ return this.#light }


	// PROPERTIES
	// ----------------------------------
	#light;


	// LIFECYCLE JAZZ
	// ----------------------------------
	connected(entity){
		super.connected(entity);

		this.#createLight(this.data, entity);
	}// connected

	disconnected(entity){
		super.disconnected(entity);

		this.#removeLight(entity);
	}// disconnected

	update(property, previous, current){
		if(previous !== current){
			switch(property){
				case "type": {
					this.#createLight(this.data, this.entity);
					break;
				}
				case "color":
				case "intensity": {
					this.#updateLight(this.#light, property, current);
				}
			}
		}

		super.update(property, previous, current);
	}// update


	// UTILS
	// -----------------------------------
	#createLight = (data, entity) => {
		const {
			color, 
			intensity
		} = data;

		// every light uses these arguments, so might as well pre-parse them
		const commonArgs = [
			parseProperty(color,     Light.schema.color.type), 
			parseProperty(intensity, Light.schema.intensity.type)
		];


		// determine which light to build
		switch(data.type){
			case "ambient": {
				
				// remove the old light before creating the new one
				this.#removeLight(entity);

				// create and add the new light to the scene
				const light = this.#light = new AmbientLight(...commonArgs);
				entity.add(light);
				break;
			}
			case "directional": {
				// remove the old light before creating the new one
				this.#removeLight(entity);

				// create and add the new light to the scene
				const light = this.#light = new DirectionalLight(...commonArgs);
				entity.add(light);
				break;
			}
			case "point": {
				const {
					distance,
					decay
				} = data;

				// remove the old light before creating the new one
				this.#removeLight(entity);

				const light = this.#light = new PointLight(
					...commonArgs,
					parseProperty(distance, Light.schema.distance.type),
					parseProperty(decay,    Light.schema.decay.type)
				);

				entity.add(light);
				break;
			}
			case "hemisphere":
			case "spot": {
				console.warn(`[Light] The ${type} light is a valid type, but has not been implemented yet.`);
				break;
			}
			default: {
				console.error("[Light] Cannot create light - unknown light type:", data.type);
				break;
			}
		}
	}// #createLight
	#removeLight = (entity) => {
		if(!!this.#light){
			entity.remove(this.#light);
		}
	}// #removeLight

	#updateLight = (light, property, value) => {
		const parsedValue = parseProperty(value, Light.schema[property].type);

		switch(property){
			case "color":
			case "intensity": {
				light[property] = parsedValue;
				break;
			}
		}
	}// #updateLight

}// Light
