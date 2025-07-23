<script setup lang="ts">
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import Circle3D from "~/assets/Circle3D.vue";


const generateDistributedPositions = (count: number) => {
  const positions = []

  // Define 5 distinct regions for 5 orbs
  const regions = [
    { x: [5, 25], y: [5, 25] },           // Top-left
    { x: [75, 95], y: [5, 25] },          // Top-right  
    { x: [35, 65], y: [35, 65] },         // Center
    { x: [5, 25], y: [75, 95] },          // Bottom-left
    { x: [75, 95], y: [75, 95] },         // Bottom-right
  ]

  for (let i = 0; i < count; i++) {
    const region = regions[i]

    // Generate random position within the selected region
    const randomX = Math.random() * (region.x[1] - region.x[0]) + region.x[0]
    const randomY = Math.random() * (region.y[1] - region.y[0]) + region.y[0]

    positions.push({
      top: randomY,
      left: randomX,
    })
  }

  return positions
}

const generateDirectionalPath = (orbIndex: number) => {

  const directionalPaths = [
    'M48.774,163.258 C55.774,144.258 63.241,52.457 136.237,51.442 211.219,51.442 161.886,9.327 190.566,-15.929 211.913,-34.727 189.781,-48.213 218.774,-87.724 241.784,-119.082 250.823,-123.715 252.297,-134.579 ',
    'M340.69801,372.326 C21.06101,402.939 -423.93999,324.867 -452.82299,257.83 -488.76999,174.396 -201.16399,-155.142 -163.52799,-161.725 -77.96999,-176.648 49.75001,21.514 94.72901,2.057 306.11801,-89.387 407.91801,80.399 457.34101,159.907 ',
    'M-52.872,-11.523 C-45.872,-30.523 40.292,-149.768 113.331,-150.768 188.311,-150.768 159.368,-404.934 197.503,-407.189 349.821,-416.195 542.536,-232.983 591.548,-232.983 678.541,-232.983 635.265,-798.529 1229.962,-693.454 ',
    'M-2.905,-37.28801 C4.095,-56.28801 -594.248,29.46599 -591.578,-212.01801 -590.748,-287.01201 -517.031,-487.74801 -630.55,-501.48201 -920.786,-536.59501 -1040.677,-659.98801 -1011.701,-699.51201 -988.682,-730.85001 214.986,-676.17901 216.465,-687.05401 ',
    'M-1147.24602,75.583 C-1140.24602,56.583 -1132.77902,-35.218 -1059.78302,-36.233 -984.80102,-36.233 -611.77802,-91.4 -583.08302,-116.674 -561.73702,-135.46 -2.65302,-412.675 26.34698,-452.199 49.34898,-483.538 66.31998,-833.37 67.79998,-844.242 '
  ]

  return directionalPaths[orbIndex]
}

const circlePositions = generateDistributedPositions(5);
const timeline = gsap.timeline();
gsap.registerPlugin(MotionPathPlugin);


onMounted(() => {
  circlePositions.forEach((position, i) => {
    // Generate unique directional path for each orb
    const directionalPath = generateDirectionalPath(i)

    // Use absolute position 0 to start all animations at the same time
    timeline.to(`#orb-${i}`, {
      motionPath: {
        path: directionalPath,
        curviness: 1,
        alignOrigin: [0.5, 0.5],
      },
      duration: 120,
      yoyo: true,
      repeat: -1,
    }, 0)

    // Create motion path helper for the element

  })
})

</script>

<template>
  <div class="flex flex-col items-center h-screen relative overflow-hidden">
    <Circle3D v-for="(position, i) in circlePositions" 
      :id="i" 
      :key="i"
      class="2xl:w-120 xl:w-96 md:w-72 w-48 aspect-square absolute text-primary" 
      :style="{
        top: `${position.top}%`,
        left: `${position.left}%`
      }" 
    />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full h-screen ">
      <LoginForm />
    </div>
  </div>
</template>
