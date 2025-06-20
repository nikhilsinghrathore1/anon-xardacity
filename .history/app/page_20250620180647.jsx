"use client"

import React, { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import {logoData} from "./path"
import "remixicon/fonts/remixicon.css";
import LocomotiveScroll from 'locomotive-scroll';

function Landing() {

  
  // Create refs for elements that need direct DOM access
  const fadeOverlayRef = useRef(null);
  const svgOverlayRef = useRef(null);
  const overlayRectRef = useRef(null);
  const logoContainerRef = useRef(null);
  const logoMaskRef = useRef(null);
  const imagesDivRef = useRef(null);
  const gameButtonRef = useRef(null);
  const svgRef = useRef(null);
  const mainRef = useRef(null);

  const handleSwitch = () => {
    console.log("clicked")
    window.location.href = "/game"
  };

  console.log("edited")
  
  let [showContent, setShowContent] = useState(false);
  const [count, setCount] = useState(0);
  const [start, setstart] = useState(false);
  const [windowLoaded, setwindowLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showGameButton, setShowGameButton] = useState(false);
  const [loadedImages, setLoadedImages] = useState({
    bg: false,
    sky: false,
    character: false
  });
  
  gsap.registerPlugin(ScrollTrigger)
  
  // Preload images and track loading state
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem('hasReloaded');
  
    if (!hasReloaded) {
      const timeout = setTimeout(() => {
        sessionStorage.setItem('hasReloaded', 'true');
        window.location.reload();
      }, 5000);
  
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const locomotiveScroll = new LocomotiveScroll();
    console.log(logoData)
    const imagesToLoad = [
      { key: 'bg', src: './bg.png' },
      { key: 'sky', src: './sky.png' },
      { key: 'character', src: './girlbg.png' }
    ];

    let loadPromises = imagesToLoad.map(({ key, src }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => ({ ...prev, [key]: true }));
          resolve({ key, loaded: true });
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          setLoadedImages(prev => ({ ...prev, [key]: true })); // Continue even if image fails
          resolve({ key, loaded: false });
        };
        img.src = src;
      });
    });

    Promise.all(loadPromises).then(() => {
      setImagesLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleLoad = () => {
      const fadeOverlay = fadeOverlayRef.current;
      const svgOverlay = svgOverlayRef.current;
      const overlayRect = overlayRectRef.current;
      const logoContainer = logoContainerRef.current;
      const logoMask = logoMaskRef.current;
      const imagesDiv = imagesDivRef.current;
      const gameButton = gameButtonRef.current;
      let fadeOverlayOpacity = 0; // Declare the variable

      if (!logoMask || !logoContainer) return;

      const initialOverlayScale = 670;   
      logoMask.setAttribute("d", logoData)
      const logoDimension = logoContainer.getBoundingClientRect()  
      const logoBoundingBox = logoMask.getBBox()
      const horizontalScaleRatio = logoDimension.width / logoBoundingBox.width
      const verticalScaleRatio = logoDimension.height / logoBoundingBox.height
      const logoScaleFactor = Math.min(horizontalScaleRatio, verticalScaleRatio)
      const logoHorizontalPosition = logoDimension.left + (logoDimension.width - logoBoundingBox.width * logoScaleFactor) / 2 - logoBoundingBox.x * logoScaleFactor; 
      const logoVerticalPosition = logoDimension.top + (logoDimension.height - logoBoundingBox.height * logoScaleFactor) / 2 - logoBoundingBox.y * logoScaleFactor;   

      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top", 
        end: `${window.innerHeight * 5}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self) => {
          const scrollProgress = self.progress;
          
          // Background blur and opacity effects
          const blurAmount = Math.min(10, scrollProgress * 15); // Max 10px blur
          const opacityAmount = Math.max(0.3, 1 - scrollProgress * 0.8); // Min 0.3 opacity
          
          if (imagesDiv) {
            gsap.set(imagesDiv, {
              filter: `blur(${blurAmount}px)`,
              opacity: opacityAmount
            });
          }

          if (scrollProgress < 0.85) {
            const normalizedProgress = scrollProgress * (1 / 0.85);
            const overlayScale = initialOverlayScale * Math.pow(1 / initialOverlayScale, normalizedProgress)

            if (svgOverlay) {
              gsap.set(svgOverlay, {
                scale: overlayScale
              })
            }

            // Color transition from dark to white
            const colorProgress = Math.min(1, scrollProgress * 2); // Faster color transition
            const r = Math.floor(17 + (255 - 17) * colorProgress);
            const g = Math.floor(17 + (255 - 17) * colorProgress);
            const b = Math.floor(23 + (255 - 23) * colorProgress);
            const newColor = `rgb(${r}, ${g}, ${b})`;
            
            if (overlayRect) {
              gsap.set(overlayRect, {
                fill: newColor
              });
            }

            if (scrollProgress > 0.25) {
              fadeOverlayOpacity = Math.min(1, (scrollProgress - 0.25) * (1 / 0.4));
            }
            if (fadeOverlay) {
              gsap.set(fadeOverlay, {
                opacity: fadeOverlayOpacity
              })
            }
          }

          // Show game button when scroll is near the end
          if (scrollProgress > 0.8 && !showGameButton) {
            setShowGameButton(true);
          }
        }
      })
      
      logoMask.setAttribute("transform", `translate(${logoHorizontalPosition}, ${logoVerticalPosition}) scale(${logoScaleFactor})`)

      setwindowLoaded(true);
    };

    // Wait for both the window to load and showContent to be true
    if (showContent) {
      // Small delay to ensure DOM is ready
      setTimeout(handleLoad, 100);
    }

    // Also listen for window load if it hasn't happened yet
    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [showContent, showGameButton]); // Add showGameButton as dependency

  useGSAP(() => {
    const tl = gsap.timeline();
    if (start) {
      tl.to(".vi-mask-group", {
        rotate: 180,
        duration: 10,
        ease: "Power4.easeInOut",
        transformOrigin: "50% 50%",
      }).to(".vi-mask-group", {
        delay: -7,
        scale: 7,
        duration: 2,
        ease: "Expo.easeInOut",
        transformOrigin: "50% 50%",
        opacity: 0,
        onUpdate: function () {
          if (this.progress() >= 0.9) {
            svgRef.current?.remove();
            setShowContent(true);
            this.kill();

          }
        },
      });
    }
  }, [start]);

  useGSAP(() => {
    if (!showContent) return;

    gsap.to(".main", {
      scale: 1,
      rotate: 0,
      duration: 2,
      delay: "-1",
      ease: "Expo.easeInOut",
    });

    gsap.to(".sky", {
      scale: 1.1,
      rotate: 0,
      duration: 2,
      delay: "-.8",
      ease: "Expo.easeInOut",
    });

    gsap.to(".bg", {
      scale: 1.1,
      rotate: 0,
      duration: 2,
      delay: "-.8",
      ease: "Expo.easeInOut",
    });

    gsap.to(".character", {
      scale: window.innerWidth >= 768 ? 1 : window.innerWidth >= 640 ? 0.75 : 0.5,
      x: "-50%",
      y: 0,
      rotate: window.innerWidth >= 768 ? 0 : 0,
      duration: 2,
      delay: "-.8",
      ease: "Expo.easeInOut",
    });

    gsap.to(".text", {
      scale: 1,
      rotate: 0,
      duration: 2,
      delay: "-.8",
      ease: "Expo.easeInOut",
    });

    const main = mainRef.current;

    // Ultra-smooth parallax with lerp interpolation
    let mouse = { x: 0 };
    let target = { x: 0 };
    let current = {
      text: 0,
      sky: 0,
      bg: 0
    };

    // Smoothing factor (lower = smoother but slower)
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const handleMouseMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 40;
    };

    main?.addEventListener("mousemove", handleMouseMove);

    // Use GSAP ticker for 60fps smooth animation
    const tickerCallback = () => {
      // Interpolate towards target with different speeds for each element
      current.text = lerp(current.text, target.x * 0.4, 0.08);
      current.sky = lerp(current.sky, target.x, 0.06);
      current.bg = lerp(current.bg, target.x * 1.7, 0.04);

      // Apply transforms
      gsap.set(".main .text", { x: `${current.text}%` });
      gsap.set(".sky", { x: current.sky });
      gsap.set(".bg", { x: current.bg });
    };

    gsap.ticker.add(tickerCallback);

    // Cleanup function
    return () => {
      main?.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(tickerCallback);
    };
  }, [showContent]);

  // Animate game button when it appears
  useGSAP(() => {
    if (showGameButton) {
      gsap.fromTo(".game-button", 
        { 
          scale: 0,
          opacity: 0,
          y: 50
        },
        { 
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "Expo.easeOut",
          delay: 0.5
        }
      );
    }
  }, [showGameButton]);

  useEffect(() => {
    if (windowLoaded && imagesLoaded) {
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setstart(true);
            return 100;
          }
          return prev + 1;
        });
      }, 50); // Faster counting for better UX

      return () => clearInterval(interval);
    }
  }, [windowLoaded, imagesLoaded]);

  const handleStartGame = () => {
    console.log("Starting game...");
    navigate("game")
  };

  return (
    <>
    <div className="hero relative w-[100vw]  ">
      <div className="main_content">
      <div ref={svgRef} className="svg flex items-center justify-center fixed top-0 left-0 z-[100] w-full h-screen overflow-hidden bg-black">
        <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <mask id="viMask">
              <rect width="100%" height="100%" fill="black" />
              <g className="vi-mask-group">
                <text
                  x="50%"
                  y="50%"
                  fontSize="250"
                  textAnchor="middle"
                  fill="white"
                  dominantBaseline="middle"
                  fontFamily="Arial Black"
                >
                  NC
                </text>
              </g>
            </mask>
          </defs>
          <image
            href="./bg.png"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            mask="url(#viMask)"
          />
        </svg>

        {/* Loading Counter */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="text-white text-xl sm:text-2xl font-bold">
            {count}%
          </div>
          {/* Loading status indicator */}
          <div className="text-white text-sm mt-2 text-center opacity-50">
            {!imagesLoaded && "Loading assets..."}
            {imagesLoaded && !windowLoaded && "Preparing..."}
          </div>
        </div>
      </div>

      {showContent && (
        <div ref={mainRef} className="main w-full md:rotate-[-10deg] md:scale-[1.7] rotate-0 scale-100">
          <div className="landing overflow-hidden relative w-full h-screen bg-black">
            {/* Navbar */}
            <div className="navbar absolute top-0 left-0 z-[10] w-full py-6 px-4 md:py-10 md:px-10">
              <div className="logo flex gap-4 md:gap-7">
                <div className="lines flex flex-col gap-[5px]">
                  <div className="line w-8 h-1 md:w-15 md:h-2 bg-white"></div>
                  <div className="line w-6 h-1 md:w-8 md:h-2 bg-white"></div>
                  <div className="line w-4 h-1 md:w-5 md:h-2 bg-white"></div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-4xl -mt-[4px] md:-mt-[8px] leading-none text-white">
                  AOstar
                </h3>
              </div>
            </div>

            {/* Images Container */}
            <div ref={imagesDivRef} className="imagesdiv relative overflow-hidden w-full h-screen">
              {loadedImages.sky && (
                <img
                  className="absolute sky scale-[1.2] md:scale-[1.5] rotate-0 md:rotate-[-20deg] top-0 left-0 w-full h-full object-cover"
                  src="./sky.png"
                  alt=""
                  loading="eager"
                />
              )}
              {loadedImages.bg && (
                <img
                  className="absolute scale-[1.2] md:scale-[1.8] rotate-0 md:rotate-[-3deg] bg top-0 left-0 w-full h-full object-cover"
                  src="./bg.png"
                  alt=""
                  loading="eager"
                />
              )}
              
              {/* Main Text */}
              <div className="text text-white flex flex-col gap-2 md:gap-3 absolute top-[15%] sm:top-[20%] md:top-1 left-1/2 -translate-x-1/2 text-center md:text-left scale-100 md:scale-[1.4] rotate-0 md:rotate-[-10deg]">
                <h1 className="text-7xl sm:text-8xl md:text-[12rem] leading-none md:-ml-40 mt-5 sm:mt-0">grand</h1>
                <h1 className="text-7xl sm:text-8xl md:text-[12rem] leading-none md:ml-20">Simi</h1>
                <h1 className="text-7xl sm:text-8xl md:text-[12rem] leading-none md:-ml-40">City</h1>
              </div>
              
              {/* Character Image */}
              {loadedImages.character && (
                <img
                  className="absolute character left-1/2 -translate-x-1/2 hidden sm:block"
                  src="./girlbg.png"
                  alt="not showing"
                  loading="eager"
                  style={{
                    top: window.innerWidth >= 768 ? '10%' : window.innerWidth >= 640 ? '40%' : '35%',
                    transform: 'translateX(-50%)',
                    scale: window.innerWidth >= 768 ? '1' : window.innerWidth >= 640 ? '0.75' : '0.5'
                  }}
                />
              )}
            </div>

            {/* Bottom Bar */}
            <div className="btmbar text-white absolute bottom-0 left-0 w-full py-8 px-4 md:py-15 md:px-10 bg-gradient-to-t from-black to-transparent">
              <div className="flex gap-2 md:gap-4 items-center">
                <i className="text-2xl md:text-4xl ri-arrow-down-line"></i>
                <h3 className="text-base md:text-xl hidden sm:block">
                  Scroll Down
                </h3>
              </div>

              <div className="left-1/2 -translate-x-1/2 text-sm sm:text-base md:text-xl flex gap-4 md:gap-10 absolute bottom-[10%] sm:bottom-[15%] md:bottom-[20%] z-20 px-4 py-2 rounded flex-col sm:flex-row text-center sm:text-left">
                <p>
                  <span className="">Anon</span>
                  <span className="f2"> X </span>
                  <span className="">Ardacity</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* fade overlay */}
      <div ref={fadeOverlayRef} className="fade-overlay  absolute top-0 left-0 w-full h-[100vh] bg-black opacity-0 pointer-events-none"></div>

      {/* overlay with svg */}
      <div ref={svgOverlayRef} className="overlay absolute pointer-events-none top-0 left-0 w-[100vw] h-[200vh] z-[200]">
        <svg width="100%" height="100%">
          <defs>
            <mask id="logoRevealMask">
            <rect width="100%" height="100%" fill="white"></rect>
            <path ref={logoMaskRef} id="logoMask" fill="black"></path>
            </mask>
          </defs>
          <rect ref={overlayRectRef} className="overlay-rect" width="100%" height="100%" fill="#111117" mask="url(#logoRevealMask)"/>
        </svg>
      </div>

      {/* Game Start Button */}
      {showGameButton && (
        <div ref={gameButtonRef} className="game-button fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-auto">
          <button 
           onClick={handleSwitch}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-xl md:text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <span className="relative z-10 flex items-center gap-3">
              <i className="ri-gamepad-line text-2xl"></i>
              START GAME
              <i className="ri-arrow-right-line text-2xl group-hover:translate-x-1 transition-transform duration-300"></i>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      )}

      {/* frame of reference */}
      <div ref={logoContainerRef} className="logo_container fixed top-[25%] left-1/2 pointer-events-none -translate-x-1/2 -translate-y-1/2 w-[300px] h-[350px] z-[300]"></div>

      <div className="overlay-copy pointer-events-none">
        <h1 className="uppercase text-[6rem] le">Animation <br /> Experiment 452 <br /> by Niko</h1>
      </div>
      </div>

      <div className="outro">
        <p className="para uppercase text-black text-[1.25rem] ">if everything is right this will have a button </p>
      </div>
    </>
  );
}

export default Landing;