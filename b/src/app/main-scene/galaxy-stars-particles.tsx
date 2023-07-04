import { BoxGeometry, BufferGeometry, InstancedBufferGeometry, Mesh, MeshPhongMaterial } from "three";
import { useMemo } from "react";
import { jsx } from "@emotion/react";
import { useFrame } from "@react-three/fiber";
import transformChunk from "../../utils/glsl/transform.glsl?raw";
import randomChunk from "../../utils/glsl/random.glsl?raw";
import { color, float } from "../../utils/glsl";
import quadraticInChunk from "glsl-easings/quadratic-in.glsl?raw";

// import { logHook } from "../../utils/glsl/hookShaderSource";
export function GalaxyStarsParticles({
    ...props
}: jsx.JSX.IntrinsicElements["mesh"]) {
    const { mesh, setTimeSec } = useMemo(() => {
        const g = new BoxGeometry();
        const ig = new InstancedBufferGeometry();
        (ig as BufferGeometry).copy(g);
        ig.instanceCount = Math.ceil(2000);

        const m = new MeshPhongMaterial({
            fog: false,
        });
        m.onBeforeCompile = (shader) => {
            m.userData.shader = shader;

            shader.uniforms.timeSec = { value: 0 };

            // shader.vertexShader = 
            //     shaderSourceLogHook(shader.vertexShader);
            // shader.fragmentShader = 
            //     shaderSourceLogHook(shader.fragmentShader);
            shader.vertexShader = /*glsl*/ `
#define USE_INSTANCING
mat4 instanceMatrix;

#define USE_INSTANCING_COLOR
vec3 instanceColor;
`
                + shader.vertexShader
                    .replace(
                /*glsl*/ "void main() {",
                    /*glsl*/ `
${transformChunk}
${randomChunk}
${quadraticInChunk}
uniform float timeSec;


void particleMain() {
    randomSeed = (1.0 + float(gl_InstanceID)) / ${float(ig.instanceCount)};
    // float lifeSec = randomInRange(0.9, 2.0);
    // float initialLifeOffsetSec = randomInRange(-lifeSec, 0.0);
    // float iterationWithPhase = (timeSec + initialLifeOffsetSec) / lifeSec;
    float iteration = 0.0;
    float t = 0.0;
    float particleTimeSec = timeSec;
    float emissionTimeSec = timeSec - particleTimeSec;

    mat4 emitterTransform = translate(vec3(0.0, 0.0, 0.0));

    // if (gl_InstanceID == 0) { 
    //     instanceMatrix = emitterTransform;
    //     instanceColor = ${color("#f98602")};
    //     return;
    // }

    float iterationSeed = fract(iteration * 1e-10);
    randomSeed = fract(randomSeed + iterationSeed); 

    vec3 initialVelocity = (
        vec3(randomDir3()) 
        + vec3(randomInRange(1.0, 3.0), 0.0, 0.0)
    ) * 0.2;
    vec3 gravity = randomBi() * randomBi() * vec3(0.2, 1.0, 0.0);
    vec3 displacementInTime = 
        initialVelocity * particleTimeSec 
        + gravity * particleTimeSec * particleTimeSec;

    vec3 initialPosition = mix(
        vec3(-10.0, -10.0, -10.0), 
        vec3(10.0, -10.0, 10.0), 
        random3());
    
    float t1 = float(gl_InstanceID);
    vec3 p1 = vec3(
        -500.0 + t1 * 0.5 + cos(t1 * 0.015) * 100.0,
        -1000.0 + cos(t1 * 0.1) * 50.0 + sin(t1 * 0.01) * 200.0,
        -600.0 + cos(t1 * 0.001) * 100.0 + cos(t1 * 0.001) * 200.0
    );
  
    mat4 particleTransform = translate(initialPosition + p1)
        * scale(vec3(mix(0.1, 3.0, random())));

    instanceMatrix = emitterTransform * particleTransform;
    instanceColor = mix(
        ${color("#fff23e")},
        ${color("#ffffff")},
        randomBi());
}

void main() {
    particleMain();
`,
                    );

            shader.fragmentShader = /*glsl*/ `
#define USE_COLOR
`
                + shader.fragmentShader;
        };


        const x = new Mesh(ig, m);
        x.frustumCulled = false;
        return {
            mesh: x,
            setTimeSec(value: number) {
                if (!m.userData.shader) { return; }
                m.userData.shader.uniforms.timeSec.value = value;
            },
        };
    }, []);
    useFrame(({ clock }) => { setTimeSec(clock.getElapsedTime()); });
    return <primitive {...props} object={mesh} />;
}
