import { PerspectiveCamera } from "three";

import { CAMERA_ADDED, CAMERA_REMOVED } from "./events.js";
import Component from "./../../component.js";
import { parseProperty } from "./../../utils.js";


export default class Camera extends Component {
	// CONFIG
	// -------------------------------
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
			 	default: Infinity // NOTE: test to see if it works without this
			}
		}
	}// get schema


	// INTERFACE
	// ------------------------------
	get camera(){ return this.#camera }


	// PROPERTIES
	// ------------------------------
	#camera;


	// LIFECYCLE JAZZ
	// --------------------------------
	connected(entity){
		super.connected(entity);

		this.#createCamera(this.data, entity);
	}// constructor
	disconnected(entity){
		super.disconnected(entity);

		entity.remove(this.#camera);
	}// disconnected

	update(property, previous, current){
		if(previous !== current){
			switch(property){
				// changing these properties requires the camera to be recreated
				case "type": {
					this.#createCamera(this.data, this.entity);
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
	#createCamera = (data, entity) => {
		switch(data.type){
			case "perspective": {
				const { 
					fov,    // (number) of degrees field-of-view the camera has
					aspect, // (number) aspect ratio of the <canvas> that the camera will be projected onto (use Infinity if unknown)
					near,   // (number) of meters objects can get close to the camera before they're no-longer rendered
					far     // (number) of meters objects can move away from the camera before they're no-longer rendered
				} = data;

				// if we already have a camera, remove it before adding this one
				if(this.#camera){
					entity.remove(this.#camera);
					entity.dispatchEvent({ 
						type: CAMERA_REMOVED,
						bubbles: true,
						camera: this.#camera
					});
				}

				// generate and add new camera
				const camera = this.#camera = new PerspectiveCamera(fov, aspect, near, far);

				entity.add(camera);
				entity.dispatchEvent({ 
					type: CAMERA_ADDED,
					bubbles: true,
					camera
				});


				break;
			}
		}
	}// #createCamera
	#updateCamera = (camera, property, value) => {

		const parsedValue = parseProperty(value, Camera.schema[property].type);

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
