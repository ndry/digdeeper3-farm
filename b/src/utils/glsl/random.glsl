// random by Spatial, slightly edited
// source: https://stackoverflow.com/a/17479300/2224730
/*
    static.frag
    by Spatial
    05 July 2013
*/

// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
uint hash(uint x) {
    x += (x << 10u);
    x ^= (x >> 6u);
    x += (x << 3u);
    x ^= (x >> 11u);
    x += (x << 15u);
    return x;
}

// Compound versions of the hashing algorithm I whipped together.
uint hash(uvec2 v) { return hash(v.x ^ hash(v.y)); }
uint hash(uvec3 v) { return hash(v.x ^ hash(v.y) ^ hash(v.z)); }
uint hash(uvec4 v) { return hash(v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w)); }

// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct(uint m) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne = 0x3F800000u; // 1.0 in IEEE binary32

    m &= ieeeMantissa; // Keep only mantissa bits (fractional part)
    m |= ieeeOne; // Add fractional part to 1.0

    float f = uintBitsToFloat(m); // Range [1:2]
    return f - 1.0; // Range [0:1]
}

// Pseudo-random value in half-open range [0:1].
float _random(float x) { return floatConstruct(hash(floatBitsToUint(x))); }
float _random(vec2 v) { return floatConstruct(hash(floatBitsToUint(v))); }
float _random(vec3 v) { return floatConstruct(hash(floatBitsToUint(v))); }
float _random(vec4 v) { return floatConstruct(hash(floatBitsToUint(v))); }
// end of random.by.Spatial

// seeded random
float randomSeed = 0.0;
float random() { return randomSeed = _random(randomSeed); }
vec2 random2() { return vec2(random(), random()); }
vec3 random3() { return vec3(random(), random(), random()); }

// random utils
float randomSign() { return random() < 0.5 ? -1.0 : 1.0; }
float randomBi() { return random() < 0.5 ? 0.0 : 1.0; }

float randomInRange(float a, float b) { return mix(a, b, random()); }
vec2 randomInRange(vec2 a, vec2 b) { return mix(a, b, random2()); }
vec3 randomInRange(vec3 a, vec3 b) { return mix(a, b, random3()); }
vec3 randomDir3() { 
    // alias: random on a unit sphere
    // based on https://github.com/mrdoob/three.js/blob/b4b756539e0e8c3e49d13cee062c77156a1cdd5d/src/math/Vector3.js#L686
    float u = mix(-1.0, 1.0, random());
    float t = mix(0.0, PI2, random());
    float f = sqrt(1.0 - u * u);
    return vec3(f * cos(t), f * sin(t), u);
}
vec3 randomInBall() {
    // based on https://stackoverflow.com/a/54544972/2224730
    return randomDir3() * pow(random(), 1.0 / 3.0);
}
