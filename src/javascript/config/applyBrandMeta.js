import brand from './brand.js'

function setMeta(selector, attribute, value)
{
    const element = document.querySelector(selector)

    if(element)
    {
        element.setAttribute(attribute, value)
    }
}

export default function applyBrandMeta()
{
    const title = `${brand.name} - ${brand.role}`

    document.title = brand.name

    setMeta('meta[itemprop="name"]', 'content', title)
    setMeta('meta[itemprop="image"]', 'content', brand.socialImage.og)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:image"]', 'content', brand.socialImage.twitter)
    setMeta('meta[property="og:site_name"]', 'content', title)
    setMeta('meta[property="og:url"]', 'content', brand.siteUrl)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:image"]', 'content', brand.socialImage.og)
    setMeta('meta[name="apple-mobile-web-app-title"]', 'content', brand.name)
    setMeta('meta[name="application-name"]', 'content', brand.name)
}