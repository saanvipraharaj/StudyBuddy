import {
    useEffect,
    useRef
} from "react";

import * as THREE from "three";


function InteractiveWaveBackground() {

    const mountRef =
        useRef(null);


    useEffect(() => {

        const mount =
            mountRef.current;


        if (!mount) {
            return;
        }


        // ============================================
        // SCENE
        // ============================================

        const scene =
            new THREE.Scene();


        scene.background =
            new THREE.Color(
                "#08080A"
            );


        // ============================================
        // CAMERA
        // ============================================

        const camera =
            new THREE.PerspectiveCamera(
                55,
                window.innerWidth /
                window.innerHeight,
                0.1,
                100
            );


        camera.position.set(
            0,
            4.5,
            10
        );


        camera.lookAt(
            0,
            0,
            0
        );


        // ============================================
        // RENDERER
        // ============================================

        const renderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: false
            });


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        mount.appendChild(
            renderer.domElement
        );


        // ============================================
        // PARTICLE GRID SETTINGS
        // ============================================

        const width =
            22;

        const depth =
            16;


        const columns =
            window.innerWidth < 768
                ? 90
                : 145;


        const rows =
            window.innerWidth < 768
                ? 65
                : 100;


        const totalParticles =
            columns *
            rows;


        // ============================================
        // PARTICLE POSITIONS
        // ============================================

        const positions =
            new Float32Array(
                totalParticles *
                3
            );


        const originalPositions =
            new Float32Array(
                totalParticles *
                3
            );


        let index =
            0;


        for (
            let zIndex = 0;
            zIndex < rows;
            zIndex++
        ) {

            for (
                let xIndex = 0;
                xIndex < columns;
                xIndex++
            ) {

                const x =
                    (
                        xIndex /
                        (
                            columns -
                            1
                        ) -
                        0.5
                    ) *
                    width;


                const z =
                    (
                        zIndex /
                        (
                            rows -
                            1
                        ) -
                        0.5
                    ) *
                    depth;


                positions[
                    index
                ] = x;


                positions[
                    index +
                    1
                ] = 0;


                positions[
                    index +
                    2
                ] = z;


                originalPositions[
                    index
                ] = x;


                originalPositions[
                    index +
                    1
                ] = 0;


                originalPositions[
                    index +
                    2
                ] = z;


                index +=
                    3;
            }
        }


        // ============================================
        // GEOMETRY
        // ============================================

        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        // ============================================
        // MATERIAL
        // ============================================

        const material =
            new THREE.PointsMaterial({

                color:
                    new THREE.Color(
                        "#F05A9D"
                    ),

                size:
                    window.innerWidth <
                    768
                        ? 0.055
                        : 0.045,

                transparent:
                    true,

                opacity:
                    0.88,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending,

                sizeAttenuation:
                    true
            });


        // ============================================
        // PARTICLES
        // ============================================

        const points =
            new THREE.Points(
                geometry,
                material
            );


        points.rotation.x =
            -0.62;


        points.rotation.z =
            -0.08;


        points.position.y =
            -1.3;


        scene.add(
            points
        );


        // ============================================
        // SECOND PARTICLE LAYER
        // ============================================

        const secondGeometry =
            geometry.clone();


        const secondMaterial =
            new THREE.PointsMaterial({

                color:
                    new THREE.Color(
                        "#FF8FC0"
                    ),

                size:
                    window.innerWidth <
                    768
                        ? 0.035
                        : 0.028,

                transparent:
                    true,

                opacity:
                    0.28,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending
            });


        const secondPoints =
            new THREE.Points(
                secondGeometry,
                secondMaterial
            );


        secondPoints.rotation.x =
            -0.62;


        secondPoints.rotation.z =
            0.11;


        secondPoints.position.set(
            0,
            -0.7,
            -1.5
        );


        scene.add(
            secondPoints
        );


        // ============================================
        // MOUSE
        // ============================================

        const mouse = {

            x:
                0,

            y:
                0,

            targetX:
                0,

            targetY:
                0,

            strength:
                0
        };


        const handleMouseMove =
            (
                event
            ) => {

                mouse.targetX =
                    (
                        event.clientX /
                        window.innerWidth
                    ) *
                    2 -
                    1;


                mouse.targetY =
                    -(
                        (
                            event.clientY /
                            window.innerHeight
                        ) *
                        2 -
                        1
                    );


                mouse.strength =
                    1;
            };


        window.addEventListener(
            "mousemove",
            handleMouseMove
        );


        // ============================================
        // CLOCK
        // ============================================

        const clock =
            new THREE.Clock();


        // ============================================
        // ANIMATION
        // ============================================

        let animationFrameId;


        const animate =
            () => {

                animationFrameId =
                    requestAnimationFrame(
                        animate
                    );


                const elapsed =
                    clock.getElapsedTime();


                mouse.x +=
                    (
                        mouse.targetX -
                        mouse.x
                    ) *
                    0.055;


                mouse.y +=
                    (
                        mouse.targetY -
                        mouse.y
                    ) *
                    0.055;


                mouse.strength *=
                    0.985;


                const positionAttribute =
                    geometry.getAttribute(
                        "position"
                    );


                const array =
                    positionAttribute.array;


                for (
                    let i = 0;
                    i < totalParticles;
                    i++
                ) {

                    const i3 =
                        i *
                        3;


                    const baseX =
                        originalPositions[
                            i3
                        ];


                    const baseZ =
                        originalPositions[
                            i3 +
                            2
                        ];


                    // ====================================
                    // MAIN WAVE
                    // ====================================

                    const waveOne =
                        Math.sin(
                            baseX *
                            0.72 +
                            elapsed *
                            0.9
                        ) *
                        0.48;


                    const waveTwo =
                        Math.cos(
                            baseZ *
                            0.8 -
                            elapsed *
                            0.75
                        ) *
                        0.36;


                    const waveThree =
                        Math.sin(
                            (
                                baseX +
                                baseZ
                            ) *
                            0.42 +
                            elapsed *
                            0.65
                        ) *
                        0.28;


                    let y =
                        waveOne +
                        waveTwo +
                        waveThree;


                    // ====================================
                    // BIG FLOWING RIDGES
                    // ====================================

                    const ridge =
                        Math.sin(
                            baseZ *
                            1.18 +
                            baseX *
                            0.28 -
                            elapsed *
                            0.7
                        );


                    y +=
                        Math.pow(
                            Math.max(
                                ridge,
                                0
                            ),
                            3
                        ) *
                        1.2;


                    // ====================================
                    // MOUSE POSITION IN WORLD SPACE
                    // ====================================

                    const mouseWorldX =
                        mouse.x *
                        width *
                        0.48;


                    const mouseWorldZ =
                        mouse.y *
                        depth *
                        0.42;


                    const dx =
                        baseX -
                        mouseWorldX;


                    const dz =
                        baseZ -
                        mouseWorldZ;


                    const distance =
                        Math.sqrt(
                            dx *
                            dx +
                            dz *
                            dz
                        );


                    const radius =
                        3.8;


                    // ====================================
                    // MOUSE DEFORMATION
                    // ====================================

                    if (
                        distance <
                        radius
                    ) {

                        const force =
                            1 -
                            distance /
                            radius;


                        const smoothForce =
                            force *
                            force *
                            mouse.strength;


                        // Push wave upward

                        y +=
                            smoothForce *
                            1.8;


                        // Ripple around cursor

                        y +=
                            Math.sin(
                                distance *
                                5.5 -
                                elapsed *
                                8
                            ) *
                            smoothForce *
                            0.38;


                        // Slight X / Z distortion

                        array[
                            i3
                        ] =
                            baseX +
                            dx *
                            smoothForce *
                            0.06;


                        array[
                            i3 +
                            2
                        ] =
                            baseZ +
                            dz *
                            smoothForce *
                            0.06;

                    } else {

                        array[
                            i3
                        ] +=
                            (
                                baseX -
                                array[
                                    i3
                                ]
                            ) *
                            0.08;


                        array[
                            i3 +
                            2
                        ] +=
                            (
                                baseZ -
                                array[
                                    i3 +
                                    2
                                ]
                            ) *
                            0.08;
                    }


                    // ====================================
                    // SMOOTH Y
                    // ====================================

                    array[
                        i3 +
                        1
                    ] +=
                        (
                            y -
                            array[
                                i3 +
                                1
                            ]
                        ) *
                        0.12;
                }


                positionAttribute.needsUpdate =
                    true;


                // ====================================
                // SECOND LAYER MOVEMENT
                // ====================================

                const secondPosition =
                    secondGeometry.getAttribute(
                        "position"
                    );


                const secondArray =
                    secondPosition.array;


                for (
                    let i = 0;
                    i < totalParticles;
                    i++
                ) {

                    const i3 =
                        i *
                        3;


                    const baseX =
                        originalPositions[
                            i3
                        ];


                    const baseZ =
                        originalPositions[
                            i3 +
                            2
                        ];


                    const y =
                        Math.sin(
                            baseX *
                            0.48 -
                            elapsed *
                            0.55
                        ) *
                        0.35 +
                        Math.cos(
                            baseZ *
                            0.65 +
                            elapsed *
                            0.5
                        ) *
                        0.26;


                    secondArray[
                        i3 +
                        1
                    ] +=
                        (
                            y -
                            secondArray[
                                i3 +
                                1
                            ]
                        ) *
                        0.08;
                }


                secondPosition.needsUpdate =
                    true;


                // ====================================
                // CAMERA PARALLAX
                // ====================================

                camera.position.x +=
                    (
                        mouse.x *
                        0.55 -
                        camera.position.x
                    ) *
                    0.018;


                const targetCameraY =
                    4.5 +
                    mouse.y *
                    0.35;


                camera.position.y +=
                    (
                        targetCameraY -
                        camera.position.y
                    ) *
                    0.018;


                camera.lookAt(
                    0,
                    0,
                    0
                );


                // ====================================
                // VERY SLOW SCENE MOTION
                // ====================================

                points.rotation.z =
                    -0.08 +
                    Math.sin(
                        elapsed *
                        0.13
                    ) *
                    0.025;


                secondPoints.rotation.z =
                    0.11 +
                    Math.cos(
                        elapsed *
                        0.1
                    ) *
                    0.025;


                renderer.render(
                    scene,
                    camera
                );
            };


        animate();


        // ============================================
        // RESIZE
        // ============================================

        const handleResize =
            () => {

                camera.aspect =
                    window.innerWidth /
                    window.innerHeight;


                camera.updateProjectionMatrix();


                renderer.setSize(
                    window.innerWidth,
                    window.innerHeight
                );


                renderer.setPixelRatio(
                    Math.min(
                        window.devicePixelRatio,
                        2
                    )
                );
            };


        window.addEventListener(
            "resize",
            handleResize
        );


        // ============================================
        // CLEANUP
        // ============================================

        return () => {

            cancelAnimationFrame(
                animationFrameId
            );


            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );


            window.removeEventListener(
                "resize",
                handleResize
            );


            geometry.dispose();

            secondGeometry.dispose();

            material.dispose();

            secondMaterial.dispose();

            renderer.dispose();


            if (
                mount.contains(
                    renderer.domElement
                )
            ) {

                mount.removeChild(
                    renderer.domElement
                );
            }
        };

    }, []);


    return (
        <div
            ref={mountRef}
            className="three-wave-background"
            aria-hidden="true"
        />
    );
}


export default InteractiveWaveBackground;