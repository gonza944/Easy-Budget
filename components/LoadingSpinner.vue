<template>
  <div ref="svgContainer" class="draw-me scale-150 transform-gpu" />
</template>

<script lang="ts" setup>
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { onMounted, ref } from 'vue';
import logoSvg from '~/assets/LogoVector.svg?raw';

const svgContainer = ref<HTMLElement>();

gsap.registerPlugin(DrawSVGPlugin);

onMounted(() => {
  // Safely inject SVG content
  if (svgContainer.value) {
    svgContainer.value.innerHTML = logoSvg;
  }

  // Set up SVG paths for DrawSVG animation
  // DrawSVG requires stroke properties to work
  gsap.set(".draw-me path", {
    stroke: "#DE6448",
    fill: "none",
    strokeWidth: 3,
  });

  // Create the drawing animation using proper DrawSVG syntax
  // Infinite forward-backward loop animation
  gsap.fromTo(".draw-me path", 
    {
      drawSVG: "0%" // Start: not drawn
    },
    {
      duration: 1,
      drawSVG: "100%", // End: fully drawn
      
      ease: "power2.inOut", // Better for yoyo (smooth in both directions)
      repeat: -1, // Infinite repeat
      yoyo: true // Reverse on alternate iterations (forward → backward → forward...)
    }
  );
});

</script>
