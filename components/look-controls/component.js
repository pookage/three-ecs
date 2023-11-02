// external imports
import { MathUtils } from "three";
// internal imports
import Component from "./../../component.js";


export default class LookControls extends Component {
	// CONFIG
	// -------------------------------
	static get schema(){
		return {
			// how much the base speed should be scaled by the user-input intensity
			// NOTE: this scales exponentially
			sensitivity: {
				default: 0.5, 
				min: 0,
				max: 1
			},
			// degrees-per-second of rotation applied at medium sensitivity
			// NOTE: this scales linearly
			speed: {
				default: 2.5
			},
			invertX: {
				default: false
			},
			invertY: {
				default: false
			}
		}
	}// get schema


	// STATE
	// --------------------------------
	#isLooking = false;
	#input     = {
		previous: {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2
		},
		current: {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2
		}
	};


	// PROPERTIES
	// --------------------------------
	#step    = 0; // (number) base look speed scale by sensitivity
	#invertY = 1;
	#invertX = 1;


	// LIFECYCLE JAZZ
	// --------------------------------
	connected(entity){
		super.connected(entity);
		this.#step    = this.#updateStep(this.data.speed, this.data.sensitivity);
		this.#invertX = this.#updateInversion(this.data.invertX);
		this.#invertY = this.#updateInversion(this.data.invertY);
		this.#addListeners();
	}// connected
	update(property, previous, current){
		switch(property){
			case "sensitivity": 
			case "speed"      : {
				this.#step = this.#updateStep(this.data.speed, this.data.sensitivity);
				break;
			}
			case "invertX": {
				this.#invertX = this.#updateInversion(this.data.invertX);
				break;
			}
			case "invertY": {
				this.#invertY = this.#updateInversion(this.data.invertY);
				break;
			}
		}
		// let other components know that this component has applied its changes
		super.update(property, previous, current);
	}// update
	disconnected(entity){
		super.disconnected(entity);
		this.#removeListeners();
	}// disconnected

	tick(time, deltaTime){
		super.tick(time, deltaTime);

		// only update the rotation if we're in look mode
		if(this.#isLooking){
			// update the horizontal rotation if the mouse has had some horizontal movement
			if(this.#input.current.x !== this.#input.previous.x){		
				this.entity.rotation.y += MathUtils.degToRad(
					// calculate the base sensitivity
					(this.#step * deltaTime) * 
					// scale based on the intensity of the input
					(this.#input.previous.x - this.#input.current.x) *
					// invert input if requested in setup
					this.#invertX
				);
			}
			
			// update the vertical rotation if the mouse has had some vertical movement
			if(this.#input.current.y !== this.#input.previous.y){
				this.entity.rotation.x += MathUtils.degToRad(
					// calculate the base sensitivity
					(this.#step * deltaTime) * 
					// scale based on the intensity of the input
					(this.#input.previous.y - this.#input.current.y) *
					// invert input if requested in setup
					this.#invertY
				);
			}
		}
	}// tick
	tock(time, deltaTime){
		super.tock(time, deltaTime);

		// store the previous input for comparison in next loop
		this.#input.previous.x = this.#input.current.x;
		this.#input.previous.y = this.#input.current.y;
	}// tock


	// UTILS
	// --------------------------------
	#addListeners = () => {
		window.addEventListener("mousedown", this.#startLook);
		window.addEventListener("mouseup", this.#endLook);
		window.addEventListener("mousemove", this.#updateLook);
	}// #addListeners
	#removeListeners = () => {
		window.removeEventListener("mousedown", this.#startLook);
		window.removeEventListener("mouseup", this.#endLook);
		window.removeEventListener("mousemove", this.#updateLook);
	}// #removeListeners

	#updateStep = (speed, sensitivity) => {
		return speed * ((sensitivity * sensitivity) / 100);
	}// #updateStep
	#updateInversion = invert => {
		return invert ? -1 : +1
	}// #updateInversion


	// EVENT HANDLERS
	// ------------------------------
	#startLook = event => {
		this.#isLooking = true;
	}// #startLook
	#endLook = event => {
		this.#isLooking = false;
	}// #endLook
	#updateLook = ({ clientX, clientY }) => {
		this.#input.current.x = clientX;
		this.#input.current.y = clientY;
	}// #updateLook
}// LookControls
