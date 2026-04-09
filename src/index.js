import './style/main.css'
import Application from './javascript/Application.js'
import applyBrandMeta from './javascript/config/applyBrandMeta.js'

applyBrandMeta()

window.application = new Application({
    $canvas: document.querySelector('.js-canvas'),
    useComposer: true
})
