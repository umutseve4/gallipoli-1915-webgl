// Dependency-free source/configuration guards, NOT a browser or GPU test.
// The Three.js test doubles below only expose the material configuration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fogNames = ['fogColor', 'fogNear', 'fogFar', 'fogDensity'];

function loadWater(source = html) {
  const match = source.match(/const\s+waterUniforms\s*=[\s\S]*?scene\.add\(water\);/);
  assert.ok(match, 'water initialization must be available for source checks');
  class Vector3 {
    constructor(x, y, z) { Object.assign(this, { x, y, z }); }
    normalize() { return this; }
  }
  class ShaderMaterial {
    constructor(options) { Object.assign(this, options); }
  }
  class Mesh {
    constructor(geometry, material) {
      Object.assign(this, { geometry, material, rotation: {}, position: {} });
    }
  }
  const THREE = {
    Vector3,
    ShaderMaterial,
    Mesh,
    PlaneGeometry: class {},
    UniformsLib: {
      fog: Object.fromEntries(fogNames.map(name => [name, { value: 0 }])),
    },
    UniformsUtils: {
      merge: sources => Object.assign({}, ...sources),
    },
  };
  return vm.runInNewContext(
    `${match[0]}\n({ water, waterUniforms });`,
    { THREE, scene: { add() {} } },
    { timeout: 1000 },
  );
}

function assertFog(material) {
  assert.equal(material.fog, true);
  for (const name of fogNames) {
    assert.ok(Object.hasOwn(material.uniforms, name), `missing fog uniform: ${name}`);
  }
}

function assertStandaloneIncludes(shader) {
  for (const line of shader.split('\n')) {
    if (line.includes('#include')) {
      assert.match(line, /^[ \t]*#include +<[\w./]+>[ \t]*$/, 'expected standalone #include');
    }
  }
}

function includeNames(shader) {
  return [...shader.matchAll(/^[ \t]*#include +<([\w./]+)>[ \t]*$/gm)].map(match => match[1]);
}

test('inline module JavaScript parses after removing its two static imports', () => {
  const match = html.match(/<script\s+type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, 'inline module must exist');
  const script = match[1];
  const imports = script.match(/^import[^\n]*;\s*$/gm);
  assert.equal(imports?.length, 2);
  assert.doesNotThrow(() => new vm.Script(script.replace(/^import[^\n]*;\s*$/gm, '')));
});

test('water material receives fog and the animated custom uniform object', () => {
  const { water, waterUniforms } = loadWater();
  assertFog(water.material);
  assert.equal(water.material.uniforms, waterUniforms);
  assert.ok(Object.hasOwn(waterUniforms, 'uTime'));
  assert.ok(Object.hasOwn(waterUniforms, 'uLight'));
  waterUniforms.uTime.value = 12;
  assert.equal(water.material.uniforms.uTime.value, 12);
});

test('water shader includes occupy standalone lines', () => {
  const { water } = loadWater();
  assertStandaloneIncludes(water.material.vertexShader);
  assertStandaloneIncludes(water.material.fragmentShader);
});

test('fog, tone mapping and output color chunks are preserved in order', () => {
  const { water } = loadWater();
  assert.deepEqual(includeNames(water.material.vertexShader), ['fog_pars_vertex', 'fog_vertex']);
  assert.deepEqual(includeNames(water.material.fragmentShader), [
    'common', 'fog_pars_fragment', 'tonemapping_fragment', 'colorspace_fragment', 'fog_fragment',
  ]);
});

test('guard rejects reintroduced inline shader directives', () => {
  const { water } = loadWater();
  const malformed = water.material.vertexShader.replace('\n#include <fog_pars_vertex>', '#include <fog_pars_vertex>');
  assert.notEqual(malformed, water.material.vertexShader);
  assert.throws(() => assertStandaloneIncludes(malformed), /standalone #include/);
});

test('guard rejects removal of the fog uniform merge', () => {
  const malformed = html.replace('THREE.UniformsLib.fog,', '');
  assert.notEqual(malformed, html);
  const { water } = loadWater(malformed);
  assert.throws(() => assertFog(water.material), /missing fog uniform/);
});
