import { useEffect, useRef } from 'react'
import Application from './javascript/Application.js'
import applyBrandMeta from './javascript/config/applyBrandMeta.js'

export default function App()
{
    const canvasRef = useRef(null)

    useEffect(() =>
    {
        applyBrandMeta()

        const application = new Application({
            $canvas: canvasRef.current,
            useComposer: true
        })

        window.application = application

        return () =>
        {
            if(window.application === application)
            {
                delete window.application
            }

            if(application && typeof application.destructor === 'function')
            {
                application.destructor()
            }
        }
    }, [])

    return (
        <>
            <canvas ref={canvasRef} className="canvas js-canvas"></canvas>

            <div className="threejs-journey is-hover-none js-threejs-journey">
                <div className="message js-message">
                    <div className="boy">
                        <div className="variant is-hi">
                            <div className="body"></div>
                            <div className="arm js-boy-arm"></div>
                        </div>
                        <div className="variant is-yay"></div>
                        <div className="variant is-shrugging"></div>
                    </div>
                    <div className="bubble">
                        <div className="text">Hey! You seem to really enjoy my portfolio.</div>
                        <div className="tip"></div>
                    </div>
                </div>
                <div className="message js-message">
                    <div className="bubble">
                        <div className="text">Would you like to learn how to create cool websites like this?</div>
                        <div className="tip"></div>
                    </div>
                </div>
                <div className="message js-message is-answers">
                    <a href="#" className="answer is-no js-no">
                        <span className="background"></span>
                        <span className="hover"></span>
                        <span className="label">Nah, I'm good</span>
                    </a>
                    <a href="https://threejs-journey.com?c=p1" target="_blank" rel="noopener" className="answer is-yes js-yes">
                        <span className="background"></span>
                        <span className="hover"></span>
                        <span className="label">Yes, teach me!</span>
                    </a>
                </div>
                <div className="message js-message">
                    <div className="bubble">
                        <div className="text">Alright then.<br />Have fun and try not to break my car!</div>
                        <div className="tip"></div>
                    </div>
                </div>
            </div>
        </>
    )
}
