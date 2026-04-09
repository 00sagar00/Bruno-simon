import { Color, Scene, Vector2, WebGLRenderer } from 'three'
import * as dat from 'dat.gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import World from './World/index.js'
import Resources from './Resources.js'
import Camera from './Camera.js'
import ThreejsJourney from './ThreejsJourney.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import BlurPass from './Passes/Blur.js'
import GlowsPass from './Passes/Glows.js'

export default class Application
{
    /**
     * Constructor
     */
    constructor(_options)
    {
        // Options
        this.$canvas = _options.$canvas

        // Set up
        this.time = new Time()
        this.sizes = new Sizes()
        this.resources = new Resources()

        this.setConfig()
        this.setDebug()
        this.setRenderer()
        this.setCamera()
        this.setPasses()
        this.setWorld()
        this.setTitle()
        this.setThreejsJourney()
    }

    /**
     * Set config
     */
    setConfig()
    {
        this.config = {}
        this.config.debug = window.location.hash === '#debug'
        this.config.cyberTruck = window.location.hash === '#cybertruck'
        this.config.touch = false
        this.config.performanceProfiles = {
            low: {
                rendererPixelRatioMax: 1,
                powerPreference: 'default',
                blurStrength: 0,
                touchBlurStrength: 0,
                glowEnabled: false,
                glowRadius: 0.55,
                glowAlpha: 0.28,
                shadowRevealAlpha: 0.28
            },
            medium: {
                rendererPixelRatioMax: 1.5,
                powerPreference: 'high-performance',
                blurStrength: 0.45,
                touchBlurStrength: 0.25,
                glowEnabled: true,
                glowRadius: 0.65,
                glowAlpha: 0.42,
                shadowRevealAlpha: 0.38
            },
            high: {
                rendererPixelRatioMax: 2,
                powerPreference: 'high-performance',
                blurStrength: 1,
                touchBlurStrength: 1,
                glowEnabled: true,
                glowRadius: 0.7,
                glowAlpha: 0.55,
                shadowRevealAlpha: 0.5
            }
        }

        this.config.performanceProfile = this.detectPerformanceProfile()
        this.config.performance = this.config.performanceProfiles[this.config.performanceProfile]

        window.addEventListener('touchstart', () =>
        {
            this.config.touch = true
            this.world.controls.setTouch()

            this.passes.horizontalBlurPass.strength = this.config.performance.touchBlurStrength
            this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new Vector2(this.passes.horizontalBlurPass.strength, 0)
            this.passes.verticalBlurPass.strength = this.config.performance.touchBlurStrength
            this.passes.verticalBlurPass.material.uniforms.uStrength.value = new Vector2(0, this.passes.verticalBlurPass.strength)
        }, { once: true })
    }

    detectPerformanceProfile()
    {
        if(window.location.hash === '#quality-low')
        {
            return 'low'
        }

        if(window.location.hash === '#quality-medium')
        {
            return 'medium'
        }

        if(window.location.hash === '#quality-high')
        {
            return 'high'
        }

        let score = 0

        const deviceMemory = navigator.deviceMemory || 4
        const hardwareConcurrency = navigator.hardwareConcurrency || 4
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        const viewportSmall = this.sizes.viewport.width < 900
        const dpr = window.devicePixelRatio || 1

        if(deviceMemory <= 2) score -= 2
        else if(deviceMemory <= 4) score -= 1

        if(hardwareConcurrency <= 2) score -= 2
        else if(hardwareConcurrency <= 4) score -= 1

        if(coarsePointer) score -= 1
        if(viewportSmall) score -= 1
        if(dpr > 1.75) score -= 1

        if(score <= - 3)
        {
            return 'low'
        }

        if(score <= - 1)
        {
            return 'medium'
        }

        return 'high'
    }

    /**
     * Set debug
     */
    setDebug()
    {
        if(this.config.debug)
        {
            this.debug = new dat.GUI({ width: 420 })
            this.setPerformanceDebugHud()
        }
    }

    setPerformanceDebugHud()
    {
        this.performanceDebugHud = {}
        this.performanceDebugHud.startupFps = null
        this.performanceDebugHud.$element = document.createElement('div')
        this.performanceDebugHud.$element.style.position = 'fixed'
        this.performanceDebugHud.$element.style.top = '12px'
        this.performanceDebugHud.$element.style.right = '446px'
        this.performanceDebugHud.$element.style.padding = '8px 10px'
        this.performanceDebugHud.$element.style.borderRadius = '8px'
        this.performanceDebugHud.$element.style.background = 'rgba(0, 0, 0, 0.65)'
        this.performanceDebugHud.$element.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        this.performanceDebugHud.$element.style.color = '#ffffff'
        this.performanceDebugHud.$element.style.fontFamily = 'monospace'
        this.performanceDebugHud.$element.style.fontSize = '11px'
        this.performanceDebugHud.$element.style.lineHeight = '1.35'
        this.performanceDebugHud.$element.style.zIndex = '10000'
        this.performanceDebugHud.$element.style.pointerEvents = 'none'
        document.body.appendChild(this.performanceDebugHud.$element)

        this.updatePerformanceDebugHud()
    }

    updatePerformanceDebugHud()
    {
        if(!this.performanceDebugHud || !this.performanceDebugHud.$element)
        {
            return
        }

        const startupFps = this.performanceDebugHud.startupFps === null
            ? '--'
            : this.performanceDebugHud.startupFps.toFixed(1)

        this.performanceDebugHud.$element.innerHTML = `quality: ${this.config.performanceProfile}<br>startup fps: ${startupFps}`
    }

    /**
     * Set renderer
     */
    setRenderer()
    {
        // Scene
        this.scene = new Scene()

        // Renderer
        this.renderer = new WebGLRenderer({
            canvas: this.$canvas,
            alpha: true,
            powerPreference: this.config.performance.powerPreference
        })
        // this.renderer.setClearColor(0x414141, 1)
        this.renderer.setClearColor(0x000000, 1)
        // this.renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2))
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.performance.rendererPixelRatioMax))
        this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
        this.renderer.autoClear = false

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.performance.rendererPixelRatioMax))
            this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
        })
    }

    /**
     * Set camera
     */
    setCamera()
    {
        this.camera = new Camera({
            time: this.time,
            sizes: this.sizes,
            renderer: this.renderer,
            debug: this.debug,
            config: this.config
        })

        this.scene.add(this.camera.container)

        this.time.on('tick', () =>
        {
            if(this.world && this.world.car)
            {
                this.camera.target.x = this.world.car.chassis.object.position.x
                this.camera.target.y = this.world.car.chassis.object.position.y
            }
        })
    }

    setPasses()
    {
        this.passes = {}

        // Debug
        if(this.debug)
        {
            this.passes.debugFolder = this.debug.addFolder('postprocess')
            // this.passes.debugFolder.open()
        }

        this.passes.composer = new EffectComposer(this.renderer)

        // Create passes
        this.passes.renderPass = new RenderPass(this.scene, this.camera.instance)

        this.passes.horizontalBlurPass = new ShaderPass(BlurPass)
        this.passes.horizontalBlurPass.strength = this.config.touch ? 0 : this.config.performance.blurStrength
        this.passes.horizontalBlurPass.material.uniforms.uResolution.value = new Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
        this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new Vector2(this.passes.horizontalBlurPass.strength, 0)

        this.passes.verticalBlurPass = new ShaderPass(BlurPass)
        this.passes.verticalBlurPass.strength = this.config.touch ? 0 : this.config.performance.blurStrength
        this.passes.verticalBlurPass.material.uniforms.uResolution.value = new Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
        this.passes.verticalBlurPass.material.uniforms.uStrength.value = new Vector2(0, this.passes.verticalBlurPass.strength)

        // Debug
        if(this.debug)
        {
            const folder = this.passes.debugFolder.addFolder('blur')
            folder.open()

            folder.add(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, 'x').step(0.001).min(0).max(10)
            folder.add(this.passes.verticalBlurPass.material.uniforms.uStrength.value, 'y').step(0.001).min(0).max(10)
        }

        this.passes.glowsPass = new ShaderPass(GlowsPass)
        this.passes.glowsPass.color = '#ffcfe0'
        this.passes.glowsPass.material.uniforms.uPosition.value = new Vector2(0, 0.25)
        this.passes.glowsPass.material.uniforms.uRadius.value = this.config.performance.glowRadius
        this.passes.glowsPass.material.uniforms.uColor.value = new Color(this.passes.glowsPass.color)
        this.passes.glowsPass.material.uniforms.uColor.value.convertLinearToSRGB()
        this.passes.glowsPass.material.uniforms.uAlpha.value = this.config.performance.glowAlpha
        this.passes.glowsPass.enabled = this.config.performance.glowEnabled

        // Debug
        if(this.debug)
        {
            const folder = this.passes.debugFolder.addFolder('glows')
            folder.open()

            folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'x').step(0.001).min(- 1).max(2).name('positionX')
            folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'y').step(0.001).min(- 1).max(2).name('positionY')
            folder.add(this.passes.glowsPass.material.uniforms.uRadius, 'value').step(0.001).min(0).max(2).name('radius')
            folder.addColor(this.passes.glowsPass, 'color').name('color').onChange(() =>
            {
                this.passes.glowsPass.material.uniforms.uColor.value = new Color(this.passes.glowsPass.color)
            })
            folder.add(this.passes.glowsPass.material.uniforms.uAlpha, 'value').step(0.001).min(0).max(1).name('alpha')
        }

        // Add passes
        this.passes.composer.addPass(this.passes.renderPass)
        this.passes.composer.addPass(this.passes.horizontalBlurPass)
        this.passes.composer.addPass(this.passes.verticalBlurPass)
        this.passes.composer.addPass(this.passes.glowsPass)

        // Time tick
        this.time.on('tick', () =>
        {
            this.passes.horizontalBlurPass.enabled = this.passes.horizontalBlurPass.material.uniforms.uStrength.value.x > 0
            this.passes.verticalBlurPass.enabled = this.passes.verticalBlurPass.material.uniforms.uStrength.value.y > 0
            this.passes.glowsPass.enabled = this.config.performance.glowEnabled && this.passes.glowsPass.material.uniforms.uAlpha.value > 0

            // Renderer
            this.passes.composer.render()
            // this.renderer.domElement.style.background = 'black'
            // this.renderer.render(this.scene, this.camera.instance)
        })

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
            this.passes.composer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
            if(this.passes.composer.setPixelRatio)
            {
                this.passes.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.performance.rendererPixelRatioMax))
            }
            this.passes.horizontalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
            this.passes.horizontalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
            this.passes.verticalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
            this.passes.verticalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
        })

        this.startPerformanceAutoTune()
    }

    setPerformanceProfile(_profileName)
    {
        if(!this.config.performanceProfiles[_profileName])
        {
            return
        }

        this.config.performanceProfile = _profileName
        this.config.performance = this.config.performanceProfiles[_profileName]

        if(this.renderer)
        {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, this.config.performance.rendererPixelRatioMax)
            this.renderer.setPixelRatio(pixelRatio)
        }

        if(this.passes)
        {
            const blurStrength = this.config.touch ? 0 : this.config.performance.blurStrength
            this.passes.horizontalBlurPass.strength = blurStrength
            this.passes.verticalBlurPass.strength = blurStrength
            this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new Vector2(blurStrength, 0)
            this.passes.verticalBlurPass.material.uniforms.uStrength.value = new Vector2(0, blurStrength)
            this.passes.glowsPass.material.uniforms.uRadius.value = this.config.performance.glowRadius
            this.passes.glowsPass.material.uniforms.uAlpha.value = this.config.performance.glowAlpha
            this.passes.glowsPass.enabled = this.config.performance.glowEnabled

            if(this.passes.composer && this.passes.composer.setPixelRatio)
            {
                this.passes.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.performance.rendererPixelRatioMax))
            }
        }

        if(this.world && this.world.shadows)
        {
            this.world.shadows.alpha = Math.min(this.world.shadows.alpha, this.config.performance.shadowRevealAlpha)
        }

        if(this.debug)
        {
            console.info(`Quality profile: ${this.config.performanceProfile}`)
        }

        this.updatePerformanceDebugHud()
    }

    startPerformanceAutoTune()
    {
        this.performanceAutoTune = {
            elapsed: 0,
            frames: 0,
            done: false
        }

        this.time.on('tick', () =>
        {
            if(this.performanceAutoTune.done)
            {
                return
            }

            this.performanceAutoTune.elapsed += this.time.delta
            this.performanceAutoTune.frames++

            if(this.performanceAutoTune.elapsed < 3500)
            {
                return
            }

            const fps = this.performanceAutoTune.frames / (this.performanceAutoTune.elapsed / 1000)
            if(this.performanceDebugHud)
            {
                this.performanceDebugHud.startupFps = fps
            }

            if(fps < 30 && this.config.performanceProfile !== 'low')
            {
                this.setPerformanceProfile('low')
            }
            else if(fps < 42 && this.config.performanceProfile === 'high')
            {
                this.setPerformanceProfile('medium')
            }

            this.performanceAutoTune.done = true
            this.updatePerformanceDebugHud()
        })
    }

    /**
     * Set world
     */
    setWorld()
    {
        this.world = new World({
            config: this.config,
            debug: this.debug,
            resources: this.resources,
            time: this.time,
            sizes: this.sizes,
            camera: this.camera,
            scene: this.scene,
            renderer: this.renderer,
            passes: this.passes
        })
        this.scene.add(this.world.container)
    }

    /**
     * Set title
     */
    setTitle()
    {
        this.title = {}
        this.title.frequency = 300
        this.title.width = 20
        this.title.position = 0
        this.title.$element = document.querySelector('title')
        this.title.absolutePosition = Math.round(this.title.width * 0.25)

        this.time.on('tick', () =>
        {
            if(this.world.physics)
            {
                this.title.absolutePosition += this.world.physics.car.forwardSpeed

                if(this.title.absolutePosition < 0)
                {
                    this.title.absolutePosition = 0
                }
            }
        })

        window.setInterval(() =>
        {
            this.title.position = Math.round(this.title.absolutePosition % this.title.width)

            document.title = `${'_'.repeat(this.title.width - this.title.position)}🚗${'_'.repeat(this.title.position)}`
        }, this.title.frequency)
    }

    /**
     * Set Three.js Journey
     */
    setThreejsJourney()
    {
        this.threejsJourney = new ThreejsJourney({
            config: this.config,
            time: this.time,
            world: this.world
        })
    }

    /**
     * Destructor
     */
    destructor()
    {
        this.time.off('tick')
        this.sizes.off('resize')

        this.camera.orbitControls.dispose()
        this.renderer.dispose()
        if(this.debug)
        {
            this.debug.destroy()
        }
    }
}
