import { Scene, WebGLRenderer } from "three";

import Entity from "./entity.js";
import { CAMERA_ADDED, CAMERA_REMOVED } from "./components/camera/events.js";

export default class World extends Scene {

	// CONFIG
	// -----------------------------------
	#samplerate; // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)

	// STATE
	// -----------------------------------
	#cameras      = [];    // (array) containing every camera used in the scene
	#lastTickTime = 0;     // (number) ms since scene creation that the last tick() was called
	#isPlaying    = false; // (boolean) whether or not the entity is playing or is paused

	// HELPERS
	// -----------------------------------
	#renderer;
	#camera;
	#frame;
	#deltaTime;
	#resizeHandler;


	// INTERFACE
	// ------------------------------------
	get cameras(){ return this.#cameras; }
	get canvas() { return this.#renderer.domElement; }

	static get mappedProperties(){
		return [];
	}// mappedProperties

	add(entity){
		super.add(entity);
		if(entity.isEntity){
			if(this.#isPlaying) entity.play();
		}
	}// add
	remove(entity){
		super.remove(entity)
		if(entity.isEntity) entity.disconnected();
	}// remove


	// LIFECYCLE JAZZ
	// -------------------------------------
	constructor(children = [], components = [], properties = {}){
		// call the Scene() constructor
		super();

		const {
			samplerate = 1 // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)
		} = properties

		this.#samplerate    = samplerate;
		this.#resizeHandler = () => this.#updateRendererSizes();

		// add any children that this scene was initialised with
		for(const child of children) this.add(child);

		const renderer = this.#renderer = new WebGLRenderer({ antialias: true });
		
		this.#updateCameraSetup();

		window.addEventListener("resize", this.#resizeHandler);
		this.addEventListener(CAMERA_ADDED, this.#updateCameraSetup);
		this.addEventListener(CAMERA_REMOVED, this.#updateCameraSetup);
	}// constructor

	play(){
		requestAnimationFrame(() => {
			this.#updateRendererSizes()

			const sceneHasCamera = this.#isPlaying = !!this.#camera;

			if(sceneHasCamera){
				this.#isPlaying = true;

				// call the play() lifecycle method on all the entities in the scene 
				this.traverse(entity => {
					if(entity.isEntity) entity.play();
				});

				this.#frame = requestAnimationFrame(this.#tick);
			} else {
				console.warn("[WARNING](World) You play() a World without at least one camera - please add a camera to the scene and call .play() again when ready");
			}
		})
	}// play

	pause(){
		cancelAnimationFrame(this.#frame);

		this.#isPlaying = false;

		// call the pause() lifecycle method on all entities in the scene 
		this.traverse(entity => {
			if(entity.isEntity) entity.pause()
		});
	}// pause

	disconnected(){
		window.removeEventListener("resize", this.#resizeHandler);
		cancelAnimationFrame(this.#frame);

		// call the disconnected() lifecycle on all entities in the scene
		this.traverse(entity => {
			if(entity.isEntity) entity.disconnected()
		});
	}// disconnected

	#tick = (time) => {
		// queue-up the next animation frame
		this.#frame = requestAnimationFrame(this.#tick);

		// calculate the time since our last tick
		this.#deltaTime = time - (this.#lastTickTime || time);

		// call the tick() lifecycle on all entities in the scene
		this.traverse(entity => {
			if(entity !== this && entity.isEntity){
				entity.tick(time, this.#deltaTime)
			}
		});

		// render the new scene
		this.#renderer.render(this, this.#camera);

		// apply any calculations that need to happen AFTER the animation frame
		this.#tock(time, this.#deltaTime);

		// store the time for the next deltaTime calculation
		this.#lastTickTime = time;
	}// tick

	#tock = (time, deltaTime) => {
		this.traverse(entity => {
			if(entity !== this && entity.isEntity){
				entity.tock(time, this.#deltaTime)
			}
		});
	}// #tock


	// UTILS
	// -----------------------------------
	#updateRendererSizes = () => {
		// get the dimensions of the parent that the <canvas> exists within
		const {
			width: newWidth,
			height: newHeight
		} = getComputedStyle(this.canvas.getRootNode().host || this.canvas.parentElement);

		// calculate the new propteries based on the current viewport size
		const width       = parseInt(newWidth) * this.#samplerate;
		const height      = parseInt(newHeight) * this.#samplerate;
		const aspectRatio = width / height;

		// apply new properties to the camera and renderer
		if(this.#camera) this.#camera.aspect = aspectRatio;
		this.#camera?.updateProjectionMatrix();
		this.#renderer?.setSize(width, height, false);
		
		// return so that this can also be used as a helper-util
		return {
			width, 
			height,
			aspectRatio
		};
	}// #updateRendererSizes
	#updateCameraSetup = () => {
		// get all the cameras that are already in the scene
		this.traverse(entity => {
			if(entity.isCamera && !this.#cameras.includes(entity)){
				this.#cameras.push(entity)
			}
		});

		// set the first one it finds as the 'main' camera
		this.#camera = this.#cameras[0];
	}// #updateCameraSetup
}// World
