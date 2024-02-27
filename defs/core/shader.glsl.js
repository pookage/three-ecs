import { Vector3 } from "three";

export default class Shader {
	static get uniforms(){ 
		return {
			time: {
				value: 1.0
			}
		}; 
	}
	static get vertex(){ 
		return `
			/* added by three.js
			---------------------------------------
				uniform mat4 modelMatrix;
				uniform mat4 modelViewMatrix;
				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;
				uniform mat3 normalMatrix;
				uniform vec3 cameraPosition;

				attribute vec3 position;
				attribute vec3 normal;
				attribute vec2 uv;

				documentation here: https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
			*/

			/* added by three-ecs
			-----------------------------------------*/
			uniform float time;

			varying vec3 v_Normal;

			void main() {
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				v_Normal    = normal;
			}
		`; 
	}
	static get fragment(){ 
		return `
			/* added by three.js
			----------------------------------------
				uniform mat4 viewMatrix;
				uniform vec3 cameraPosition;

				documentation here: https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
			*/

			/* added by three-ecs
			----------------------------------------*/
			uniform float time;

			varying vec3 v_Normal;


			void main(){
				gl_FragColor = vec4(
					v_Normal.x, 
					v_Normal.y, 
					v_Normal.z, 
					1.0
				);
			}
		`; 
	}
}// Shader
