<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import * as THREE from "three";

const container = ref(null);

let renderer;
let scene;
let camera;
let animationId;

const initScene = () => {
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#020617");

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.5, 4);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  container.value.appendChild(renderer.domElement);

  // simple cube as "avatar"
  const geometry = new THREE.BoxGeometry(1.4, 2, 0.6);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4f46e5,
    metalness: 0.1,
    roughness: 0.6,
  });
  const avatar = new THREE.Mesh(geometry, material);
  scene.add(avatar);

  // ground
  const groundGeo = new THREE.CircleGeometry(3, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.1;
  scene.add(ground);

  // lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111111, 0.7);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(2, 4, 3);
  scene.add(dirLight);

  // animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate);

    avatar.rotation.y += 0.01;

    renderer.render(scene, camera);
  };

  animate();

  const handleResize = () => {
    if (!container.value) return;
    const w = container.value.clientWidth;
    const h = container.value.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  window.addEventListener("resize", handleResize);

  // store on instance to clean up later
  container.value.__threeCleanup = () => {
    window.removeEventListener("resize", handleResize);
  };
};

onMounted(() => {
  if (container.value) {
    initScene();
  }
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
  }
  if (container.value && container.value.__threeCleanup) {
    container.value.__threeCleanup();
  }
});
</script>

<template>
  <div ref="container" class="avatar-canvas"></div>
</template>

<style scoped>
.avatar-canvas {
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  border: 1px solid #1f2937;
  overflow: hidden;
  background: radial-gradient(circle at top, #111827, #020617);
}
</style>
