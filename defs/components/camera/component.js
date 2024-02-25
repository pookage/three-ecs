import { PerspectiveCamera } from "three";

import Component from "../../core/component/index.js";

import { CAMERA_ADDED, CAMERA_REMOVED } from "./events.js";


export default class Camera extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#camera;


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get schema(){
		return {
			// (string) which kind of THREE camera to create
			type: {
			 	oneOf: [
			 		"perspective"
			 	]
			},
			// (number) of degrees field-of-view the camera has
			fov: {
			 	default: 60
			},
			// (number) of meters objects can get close to the camera before they're no-longer rendered
			near: {
			 	default: 0.1
			},
			// (number) of meters objects can move away from the camera before they're no-longer rendered
			far: {
			 	default: 1000
			},
			// (number) aspect ratio of the <canvas> that the camera will be projected onto (use Infinity if unknown)
			aspect: {
				type: "number",
			 	default: 1 // NOTE: test to see if it works without this
			}
		} 
	}// schema

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get camera(){ return this.#camera; }

	// ~~ setters ~~
	set entity(entity){
		super.entity = entity;
		console.log("adding camera")
		entity.dispatchEvent({ 
			type: CAMERA_ADDED,
			bubbles: true,
			camera: this.#camera
		});
	}// set entity

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	constructor(config){
		super(config);

		this.#camera = this.#createCamera(this.data, this.entity);
	}// constructor
	connected(entity){
		super.connected(entity);

		entity.add(this.#camera);	
	}// connected
	disconnected(entity){
		super.disconnected(entity);

		entity.remove(this.#camera);
		entity.dispatchEvent({ 
			type: CAMERA_REMOVED,
			bubbles: true,
			camera: this.#camera
		});
	}// disconnected

	update(property, previous, current){
		if(previous !== current){
			switch(property){
				// changing these properties requires the camera to be recreated
				case "type": {
					this.#replaceCamera(this.data, this.entity);
					break;
				}
				// otherwise the camera can just be modified in-place
				default: {
					this.#updateCamera(this.#camera, property, current);
					break;
				}
			}
		}

		super.update(property, previous, current);
	}// update


	// UTILS
	// ----------------------------------
	#replaceCamera = (data, entity) => {
		// if we already have a camera, remove it before adding this one
		if(this.#camera){
			entity.remove(this.#camera);
			entity.dispatchEvent({ 
				type: CAMERA_REMOVED,
				bubbles: true,
				camera: this.#camera
			});
		}

		// creata new camera from the new data
		const camera = this.#camera = this.#createCamera(this.data, this.entity);

		// add it and let the scene know that a new one is present
		entity.add(camera);
		entity.dispatchEvent({ 
			type: CAMERA_ADDED,
			bubbles: true,
			camera
		});
	}// #replaceCamera

	#createCamera = (data, entity) => {
		let camera;
		switch(data.type){
			case "perspective": {
				const { 
					fov,    // (number) of degrees field-of-view the camera has
					aspect, // (number) aspect ratio of the <canvas> that the camera will be projected onto (use Infinity if unknown)
					near,   // (number) of meters objects can get close to the camera before they're no-longer rendered
					far     // (number) of meters objects can move away from the camera before they're no-longer rendered
				} = data;

				// generate a new camera
				camera = new PerspectiveCamera(fov, aspect, near, far);
				break;
			}
		}

		return camera;
	}// #createCamera

	#updateCamera = (camera, property, value) => {
		switch(property){
			// these property names map directly to the THREE.PerspectiveCamera
			case "aspect":
			case "far":
			case "fov":
			case "near": {
				camera[property] = value;
				break;
			}
		}
	}// #updateCamera
}// Camera
