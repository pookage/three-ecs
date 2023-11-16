import { BoxGeometry, SphereGeometry } from "three";
import Component from "./../../component.js";

export default class Geometry extends Component {
	// CONFIG
	// -------------------------------------
	static get schema(){
		return {
			primitive: {
				oneOf: [
					"box",
					"sphere"
				]
			},
			width: {
				default: 1
			},
			height: {
				default: 1
			},
			depth: {
				default: 1
			},
			radius: {
				default: 1
			}
		}
	}// schema


	// INTERFACE
	// -------------------------------------
	get geometry(){ return this.#geometry }


	// PROPERTIES
	// -------------------------------------
	#geometry;


	// LIFECYCLE JAZZ
	// -------------------------------------
	constructor(...args){
		super(...args);

		this.#updateGeometry(this.data);
	}// constructor
	update(property, previous, current){
		if(previous !== current){
			this.#updateGeometry(this.data);	
		}

		super.update(property, previous, current);
	}// update


	// UTILS
	// -------------------------------------
	#updateGeometry = (data) => {
		switch(data.primitive){
			case "box": {
				const {
					width,
					height,
					depth
				} = data;

				this.#geometry = new BoxGeometry(width, height, depth);
				break;
			}
			case "sphere": {
				const { 
					radius 
				} = data;

				this.#geometry = new SphereGeometry(radius);
				break;
			}
		}
	}// #updateGeometry
}// Geometry
