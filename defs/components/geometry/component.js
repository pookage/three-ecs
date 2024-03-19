import { BoxGeometry, PlaneGeometry, SphereGeometry } from "three";

import Component from "../../core/component/index.js";


export default class Geometry extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#geometry;

	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get schema(){
		return {
			primitive: {
				oneOf: [
					"box",
					"sphere",
					"plane"
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

	// PUBLIC PROPERTIES
	get geometry(){ return this.#geometry; }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	constructor(config){
		super(config);

		this.#geometry = this.#generateGeometry(this.data);
	}// constructor
	update(property, previous, current){
		if(previous !== current){
			this.#geometry = this.#generateGeometry(this.data);	
		}

		super.update(property, previous, current);
	}// update


	// UTILS
	// -------------------------------------
	#generateGeometry = (data) => {
		let geometry;

		switch(data.primitive){
			case "box": {
				const {
					width,
					height,
					depth
				} = data;

				geometry = new BoxGeometry(width, height, depth);
				break;
			}
			case "plane": {
				const {
					width, 
					height
				} = data;

				geometry = new PlaneGeometry(width, height);
				break;
			}
			case "sphere": {
				const { 
					radius 
				} = data;

				geometry = new SphereGeometry(radius);
				break;
			}
		}

		return geometry;
	}// #generateGeometry
}// Geometry
